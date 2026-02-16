const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/', profileController.getProfile);
router.get('/:section', profileController.getProfileSection);
router.put('/:section', profileController.updateProfileSection);

module.exports = router;
