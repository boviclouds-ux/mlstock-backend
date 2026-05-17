const express  = require('express');
const router   = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAllFournisseurs, createFournisseur, updateFournisseur } = require('../controllers/fournisseurController');

const ADMIN_ROLES = ['ADMIN_FEDERAL', 'ADMIN'];

// Lecture : tous les utilisateurs authentifiés
router.get('/',     protect,                            getAllFournisseurs);
// Écriture : admins uniquement
router.post('/',    protect, authorize(...ADMIN_ROLES), createFournisseur);
router.put('/:id',  protect, authorize(...ADMIN_ROLES), updateFournisseur);

module.exports = router;
