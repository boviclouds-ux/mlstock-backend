const express  = require('express');
const router   = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAllTransporteurs, createTransporteur, updateTransporteur } = require('../controllers/transporteurController');

const ADMIN_ROLES = ['ADMIN_FEDERAL', 'ADMIN'];

// Lecture : tous les utilisateurs authentifiés
router.get('/',     protect,                            getAllTransporteurs);
// Écriture : admins uniquement
router.post('/',    protect, authorize(...ADMIN_ROLES), createTransporteur);
router.put('/:id',  protect, authorize(...ADMIN_ROLES), updateTransporteur);

module.exports = router;
