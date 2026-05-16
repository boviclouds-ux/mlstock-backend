const express  = require('express');
const router   = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAllCuves, createCuve, updateCuve } = require('../controllers/cuveController');

const ADMIN_ROLES = ['ADMIN_FEDERAL', 'ADMIN'];

// Lecture : tous les utilisateurs authentifiés
router.get('/',     protect,                          getAllCuves);
// Écriture : admins uniquement
router.post('/',    protect, authorize(...ADMIN_ROLES), createCuve);
router.put('/:id',  protect, authorize(...ADMIN_ROLES), updateCuve);

module.exports = router;
