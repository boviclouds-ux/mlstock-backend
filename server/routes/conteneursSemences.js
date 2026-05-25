const express  = require('express');
const router   = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { getAllCuves, createCuve, updateCuve } = require('../controllers/cuveController');

// Lecture : tous les utilisateurs authentifiés
router.get('/',     protect,               getAllCuves);
// Écriture : admins uniquement
router.post('/',    protect, requireAdmin, createCuve);
router.put('/:id',  protect, requireAdmin, updateCuve);

module.exports = router;
