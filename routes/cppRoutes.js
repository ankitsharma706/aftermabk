const express = require('express');
const router = express.Router();
const cppController = require('../controllers/cppController');
const { validateFileName } = require('../middleware/security');

router.post('/compile', validateFileName, cppController.compile);
router.post('/run', validateFileName, cppController.run);

module.exports = router;
