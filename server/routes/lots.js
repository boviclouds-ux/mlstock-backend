const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAllLots } = require('../controllers/lotController');

// Lecture : tous les utilisateurs authentifiés
router.get('/', protect, getAllLots);

module.exports = router;
