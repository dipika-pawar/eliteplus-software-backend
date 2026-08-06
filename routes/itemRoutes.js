const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const itemController = require('../controllers/itemController');

// Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.fieldname + path.extname(file.originalname));
    }
});

// File Type Validation Filters
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'itemImg') {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase()) && allowedTypes.test(file.mimetype);
        if (isValid) return cb(null, true);
        cb(new Error('इमेज फक्त JPG, JPEG, PNG किंवा WEBP फॉरमॅटमध्येच असावी!'), false);
    } else if (file.fieldname === 'itemPdf') {
        if (file.mimetype === 'application/pdf') return cb(null, true);
        cb(new Error('ब्रोशर फक्त PDF फॉरमॅटमध्येच असावे!'), false);
    } else {
        cb(null, true);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB Limit
    fileFilter: fileFilter
});

// itemImg आणि itemPdf दोन्ही फाईल्स स्वीकारण्यासाठी fields मिडिलवेअर
const itemUpload = upload.fields([
    { name: 'itemImg', maxCount: 1 },
    { name: 'itemPdf', maxCount: 1 }
]);

// सेफ्टी ट्रॅकिंग मिडिलवेअर (Multer Errors पकडण्यासाठी)
const uploadMiddleware = (req, res, next) => {
    itemUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ status: 'Error', message: `Multer Error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ status: 'Error', message: err.message });
        }
        next();
    });
};

// API Endpoints Mapping
router.get('/', itemController.getAllItems);
router.post('/', uploadMiddleware, itemController.createItem);
router.put('/:id', uploadMiddleware, itemController.updateItem); // ★ PUT वर देखील uploadMiddleware लावण्यात आला आहे
router.delete('/:id', itemController.deleteItem);

module.exports = router;