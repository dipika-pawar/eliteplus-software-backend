const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');

// Tax Endpoints
router.get('/', taxController.getAllTaxes);
router.post('/', taxController.createTax);

module.exports = router;