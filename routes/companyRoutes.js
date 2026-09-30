const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
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

// Multer upload with fields and file size limits (2MB)
const uploadFields = upload.fields([
    { name: 'logoFile', maxCount: 1 },
    { name: 'qrFile', maxCount: 1 },
    { name: 'stampFile', maxCount: 1 },
    { name: 'signFile', maxCount: 1 }
]);

const uploadMiddleware = (req, res, next) => {
    uploadFields(req, res, (err) => {
        if (err) {
            return res.status(400).json({ status: 'Error', message: err.message });
        }
        next();
    });
};

router.get('/', companyController.getAllCompanies);
router.post('/', uploadMiddleware, companyController.createCompany);
router.put('/:id', uploadMiddleware, companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

module.exports = router;