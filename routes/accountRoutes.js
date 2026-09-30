const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const upload = require('../multer'); // Memory storage wali file vaparli

// File filter validation (optional security sathi)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, JPEG, and PNG files are allowed!'), false);
    }
};

// Multer upload fields with limits (5MB)
const uploadFields = upload.fields([
    { name: 'panFile', maxCount: 1 },
    { name: 'gstFile', maxCount: 1 },
    { name: 'msmeFile', maxCount: 1 }
]);

const uploadMiddleware = (req, res, next) => {
    uploadFields(req, res, (err) => {
        if (err) {
            return res.status(400).json({ status: 'Error', message: err.message });
        }
        next();
    });
};

router.get('/', accountController.getAllAccounts);
router.post('/', uploadMiddleware, accountController.createAccount);
router.put('/:id', uploadMiddleware, accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

module.exports = router;