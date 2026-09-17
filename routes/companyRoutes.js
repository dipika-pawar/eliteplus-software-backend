const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const companyController = require('../controllers/companyController');

// =====================================================
// SUPABASE CLIENT INITIALIZATION
// =====================================================
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// =====================================================
// MULTER MEMORY STORAGE CONFIGURATION
// (Replaced diskStorage to prevent Vercel EROFS error)
// =====================================================
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only JPG, JPEG, and PNG files are allowed!'), false);
};

const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 2 * 1024 * 1024 }, 
    fileFilter: fileFilter 
});

// 4 specific file fields
const cpUpload = upload.fields([
    { name: 'logoFile', maxCount: 1 },
    { name: 'qrFile', maxCount: 1 },
    { name: 'stampFile', maxCount: 1 }, 
    { name: 'signFile', maxCount: 1 }
]);

// =====================================================
// UPLOAD MIDDLEWARE WITH SUPABASE CLOUD UPLOAD
// =====================================================
const uploadMiddleware = async (req, res, next) => {
    cpUpload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            let customMessage = `Multer Error (${err.code}): ${err.message}`;
            if (err.field) customMessage += ` -> You have sent a field named '${err.field}'.`;
            return res.status(400).json({ status: 'Error', message: customMessage });
        } else if (err) {
            return res.status(400).json({ status: 'Error', message: err.message });
        }

        try {
            // Check if files exist, then upload directly to Supabase Storage 'uploads' bucket
            if (req.files) {
                req.supabaseFiles = {};
                for (const fieldName in req.files) {
                    const file = req.files[fieldName][0];
                    const uniqueFilename = `${Date.now()}-${fieldName}${path.extname(file.originalname)}`;
                    
                    // Upload buffer to Supabase Storage
                    const { data, error } = await supabase.storage
                        .from('uploads') // Your Supabase Bucket Name
                        .upload(uniqueFilename, file.buffer, {
                            contentType: file.mimetype,
                            upsert: false
                        });

                    if (error) {
                        throw new Error(`Supabase upload failed for ${fieldName}: ${error.message}`);
                    }

                    // Attach uploaded file name to request object so controller can access it
                    req.supabaseFiles[fieldName] = uniqueFilename;
                }
            }
            next();
        } catch (uploadErr) {
            console.error("❌ Cloud Upload Error:", uploadErr);
            return res.status(500).json({ status: 'Error', message: uploadErr.message });
        }
    });
};

// =====================================================
// ROUTES
// =====================================================
router.get('/', companyController.getAllCompanies);
router.post('/', uploadMiddleware, companyController.createCompany);
router.put('/:id', uploadMiddleware, companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

module.exports = router;