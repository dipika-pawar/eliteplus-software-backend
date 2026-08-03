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
    cb(new Error('फक्त JPG, JPEG आणि PNG फाईल्स अपलोड करण्याची परवानगी आहे!'), false);
};

const upload = multer({ storage: storage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: fileFilter });

// ४ विशिष्ट फाईल फील्ड्स (बॅकएंड जे नावे शोधत आहे)
const cpUpload = upload.fields([
    { name: 'logoFile', maxCount: 1 },
    { name: 'qrFile', maxCount: 1 },
    { name: 'stampFile', maxCount: 1 }, // नवीन फील्ड जोडली
    { name: 'signFile', maxCount: 1 }
]);

const uploadMiddleware = (req, res, next) => {
    cpUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            let customMessage = `Multer Error (${err.code}): ${err.message}`;
            if (err.field) customMessage += ` -> तुम्ही '${err.field}' नावाचे फील्ड पाठवले आहे.`;
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