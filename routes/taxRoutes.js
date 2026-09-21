const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');

router.get('/', taxController.getAllTaxes);
router.post('/', taxController.createTax);

module.exports = router;