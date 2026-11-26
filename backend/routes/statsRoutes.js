const express = require('express');
const { getStats } = require('../controllers/statsController');

const router = express.Router();

// Public, used by the landing page.
router.get('/stats', getStats);

module.exports = router;
