const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const itemController = require('../controllers/itemController');

const storage = multer.memoryStorage();

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
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

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

router.get('/', itemController.getAllItems);
router.post('/', uploadMiddleware, itemController.createItem);
router.put('/:id', uploadMiddleware, itemController.updateItem);
router.delete('/:id', itemController.deleteItem);

module.exports = router;