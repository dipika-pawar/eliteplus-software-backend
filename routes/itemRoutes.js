const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const upload = require('../multer'); // Memory storage wali file vaparli

// File filter validation (Images & PDF check)
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'itemImg') {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Image must be in JPG, JPEG, PNG, or WEBP format only!'), false);
        }
    } else if (file.fieldname === 'itemPdf') {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Brochure must be in PDF format only!'), false);
        }
    } else {
        cb(null, true);
    }
};

// Multer upload fields with limits (5MB)
const uploadFields = upload.fields([
    { name: 'itemImg', maxCount: 1 },
    { name: 'itemPdf', maxCount: 1 }
]);

const uploadMiddleware = (req, res, next) => {
    uploadFields(req, res, (err) => {
        if (err) {
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