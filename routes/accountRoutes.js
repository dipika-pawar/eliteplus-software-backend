const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const accountController = require('../controllers/accountController');

// =====================================================
// SUPABASE CLIENT INITIALIZATION
// =====================================================
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// =====================================================
// MULTER MEMORY STORAGE CONFIGURATION
// =====================================================
const storage = multer.memoryStorage();

// File Type Filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only JPG, JPEG, and PNG files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Exact 3 Keys for file upload
const accountUpload = upload.fields([
    { name: 'panFile', maxCount: 1 },
    { name: 'gstFile', maxCount: 1 },
    { name: 'msmeFile', maxCount: 1 }
]);

// =====================================================
// UPLOAD MIDDLEWARE WITH SUPABASE CLOUD UPLOAD
// =====================================================
const uploadMiddleware = async (req, res, next) => {
    accountUpload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            let msg = `Multer Error (${err.code}): ${err.message}`;
            if (err.field) msg += ` -> Incorrect field: '${err.field}'`;
            return res.status(400).json({ status: 'Error', message: msg + " Use only panFile, gstFile, and msmeFile." });
        } else if (err) {
            return res.status(400).json({ status: 'Error', message: err.message });
        }

        try {
            if (req.files) {
                req.supabaseFiles = {};
                for (const fieldName in req.files) {
                    const file = req.files[fieldName][0];
                    const uniqueFilename = `${Date.now()}-${fieldName}${path.extname(file.originalname)}`;
                    
                    // Upload buffer directly to Supabase Storage 'uploads' bucket
                    const { error } = await supabase.storage
                        .from('uploads')
                        .upload(uniqueFilename, file.buffer, {
                            contentType: file.mimetype,
                            upsert: false
                        });

                    if (error) {
                        throw new Error(`Supabase upload failed for ${fieldName}: ${error.message}`);
                    }

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

// endpoints
router.get('/', accountController.getAllAccounts);
router.post('/', uploadMiddleware, accountController.createAccount);
router.put('/:id', uploadMiddleware, accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

module.exports = router;