const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const accountController = require('../controllers/accountController');

// Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.fieldname + path.extname(file.originalname));
    }
});

// File Type Filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('फक्त JPG, JPEG आणि PNG फाईल्स अपलोड करायला परवानगी आहे!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// फाईल्स अपलोड करण्यासाठी अचूक 3 Keys (बॅकएंड जे मॅच करेल)
const accountUpload = upload.fields([
    { name: 'panFile', maxCount: 1 },
    { name: 'gstFile', maxCount: 1 },
    { name: 'msmeFile', maxCount: 1 }
]);

// एरर सेफ्टी ट्रॅकिंग मिडलवेअर
const uploadMiddleware = (req, res, next) => {
    accountUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            let msg = `Multer Error (${err.code}): ${err.message}`;
            if (err.field) msg += ` -> चुकीची फील्ड: '${err.field}'`;
            return res.status(400).json({ status: 'Error', message: msg + " पोस्टमनमध्ये फक्त panFile, gstFile, msmeFile वापरा आणि रिकामी रो डिलीट करा." });
        } else if (err) {
            return res.status(400).json({ status: 'Error', message: err.message });
        }
        next();
    });
};

// endpoints
router.get('/', accountController.getAllAccounts);
router.post('/', uploadMiddleware, accountController.createAccount);
router.put('/:id', uploadMiddleware, accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

module.exports = router;