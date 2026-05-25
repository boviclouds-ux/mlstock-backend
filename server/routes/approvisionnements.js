const express  = require('express');
const router   = express.Router();
const { protect, requireAdmin, requireReceive } = require('../middleware/authMiddleware');
const {
  getAllApprovisionnements,
  createApprovisionnement,
  updateApprovisionnement,
  receptionApprovisionnement,
} = require('../controllers/approvisionnementController');

// Lecture : tous les utilisateurs authentifiés
router.get('/', protect, getAllApprovisionnements);

// Réception physique fournisseur — crée les Lots en stock
router.put('/:id/reception', protect, requireReceive, receptionApprovisionnement);

// Gestion des commandes : admins uniquement
router.post('/',   protect, requireAdmin, createApprovisionnement);
router.put('/:id', protect, requireAdmin, updateApprovisionnement);

module.exports = router;
