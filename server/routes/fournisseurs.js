const express  = require('express');
const router   = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { getAllFournisseurs, createFournisseur, updateFournisseur } = require('../controllers/fournisseurController');

// Lecture : tous les utilisateurs authentifiés
router.get('/',     protect,               getAllFournisseurs);
// Écriture : admins uniquement
router.post('/',    protect, requireAdmin, createFournisseur);
router.put('/:id',  protect, requireAdmin, updateFournisseur);

module.exports = router;
