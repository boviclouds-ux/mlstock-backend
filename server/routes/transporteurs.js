const express  = require('express');
const router   = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { getAllTransporteurs, createTransporteur, updateTransporteur } = require('../controllers/transporteurController');

// Lecture : tous les utilisateurs authentifiés
router.get('/',     protect,               getAllTransporteurs);
// Écriture : admins uniquement
router.post('/',    protect, requireAdmin, createTransporteur);
router.put('/:id',  protect, requireAdmin, updateTransporteur);

module.exports = router;
