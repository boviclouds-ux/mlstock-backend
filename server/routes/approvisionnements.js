const express  = require('express');
const router   = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllApprovisionnements,
  createApprovisionnement,
  updateApprovisionnement,
  receptionApprovisionnement,
} = require('../controllers/approvisionnementController');

const ADMIN_ROLES = ['ADMIN_FEDERAL', 'ADMIN'];
const OPS_ROLES   = [...ADMIN_ROLES, 'MAGASINIER'];

// Lecture : tous les utilisateurs authentifiés
router.get('/',              protect,                           getAllApprovisionnements);
// Réception physique (Magasinier + Admins) — crée les lots en stock
router.put('/:id/reception', protect, authorize(...OPS_ROLES), receptionApprovisionnement);
// Mise à jour générale (statut, conformité) : admins uniquement
router.post('/',             protect, authorize(...ADMIN_ROLES), createApprovisionnement);
router.put('/:id',           protect, authorize(...ADMIN_ROLES), updateApprovisionnement);

module.exports = router;
