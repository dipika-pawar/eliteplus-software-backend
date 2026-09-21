const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const accountController = require('../controllers/accountController');

const storage = multer.memoryStorage();

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
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

const accountUpload = upload.fields([
    { name: 'panFile', maxCount: 1 },
    { name: 'gstFile', maxCount: 1 },
    { name: 'msmeFile', maxCount: 1 }
]);

const uploadMiddleware = (req, res, next) => {
    accountUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            let msg = `Multer Error (${err.code}): ${err.message}`;
            if (err.field) msg += ` -> Incorrect field: '${err.field}'`;
            return res.status(400).json({ status: 'Error', message: msg });
        } else if (err) {
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