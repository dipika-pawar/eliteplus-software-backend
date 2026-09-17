const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const itemController = require('../controllers/itemController');

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

// File Type Validation Filters
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'itemImg') {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase()) && allowedTypes.test(file.mimetype);
        if (isValid) return cb(null, true);
        cb(new Error('Image must be in JPG, JPEG, PNG, or WEBP format only!'), false);
    } else if (file.fieldname === 'itemPdf') {
        if (file.mimetype === 'application/pdf') return cb(null, true);
        cb(new Error('Brochure must be in PDF format only!'), false);
    } else {
        cb(null, true);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB Limit
    fileFilter: fileFilter
});

// Fields middleware to accept both itemImg and itemPdf files
const itemUpload = upload.fields([
    { name: 'itemImg', maxCount: 1 },
    { name: 'itemPdf', maxCount: 1 }
]);

// =====================================================
// UPLOAD MIDDLEWARE WITH SUPABASE CLOUD UPLOAD
// =====================================================
const uploadMiddleware = async (req, res, next) => {
    itemUpload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ status: 'Error', message: `Multer Error: ${err.message}` });
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

// API Endpoints Mapping
router.get('/', itemController.getAllItems);
router.post('/', uploadMiddleware, itemController.createItem);
router.put('/:id', uploadMiddleware, itemController.updateItem);
router.delete('/:id', itemController.deleteItem);

module.exports = router;