const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const companyController = require('../controllers/companyController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.fieldname + path.extname(file.originalname)); }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only JPG, JPEG, and PNG files are allowed!'), false);
};

const upload = multer({ storage: storage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: fileFilter });

// 4 specific file fields (that the backend expects)
const cpUpload = upload.fields([
    { name: 'logoFile', maxCount: 1 },
    { name: 'qrFile', maxCount: 1 },
    { name: 'stampFile', maxCount: 1 }, // New field added
    { name: 'signFile', maxCount: 1 }
]);

const uploadMiddleware = (req, res, next) => {
    cpUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            let customMessage = `Multer Error (${err.code}): ${err.message}`;
            if (err.field) customMessage += ` -> You have sent a field named '${err.field}'.`;
            return res.status(400).json({ status: 'Error', message: customMessage });
        } else if (err) {
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