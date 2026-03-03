const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctor);

module.exports = router;
