const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');

router.get('/', unitController.getAllUnits);
router.post('/', unitController.createUnit);

module.exports = router;