const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const itemController = require('../controllers/itemController');

// Storage Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.fieldname + path.extname(file.originalname));
    }
});

// File Filters
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'itemImg') {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase()) && allowedTypes.test(file.mimetype);
        if (isValid) return cb(null, true);
        cb(new Error('फक्त JPG, JPEG, PNG किंवा WEBP इमेजेस अलाऊड आहेत!'), false);
    } else if (file.fieldname === 'itemPdf') {
        if (file.mimetype === 'application/pdf') return cb(null, true);
        cb(new Error('ब्रोशर फक्त PDF फॉरमॅटमध्येच असावे!'), false);
    } else {
        cb(null, true);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB मॅक्स साईझ
    fileFilter: fileFilter
});

// itemImg आणि itemPdf फाईल्स स्वीकारण्यासाठी फील्ड्स व्याख्या
const itemUpload = upload.fields([
    { name: 'itemImg', maxCount: 1 },
    { name: 'itemPdf', maxCount: 1 }
]);

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

// API राउट्स मॅपिंग
router.get('/', itemController.getAllItems);
router.post('/', uploadMiddleware, itemController.createItem);
router.put('/:id', uploadMiddleware, itemController.updateItem);
router.delete('/:id', itemController.deleteItem);

module.exports = router;