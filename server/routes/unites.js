const express    = require('express');
const router     = express.Router();
const { protect, requireAdmin, requireDispatch } = require('../middleware/authMiddleware');
const {
  getAllUnites,
  getUniteById,
  createUnite,
  updateUnite,
} = require('../controllers/uniteController');

// Lecture : admin + magasinier (doit voir les unités bénéficiaires pour les BL)
router.get('/',    protect, requireDispatch, getAllUnites);
router.get('/:id', protect, requireDispatch, getUniteById);

// Écriture : réservée aux admins
router.post('/',   protect, requireAdmin, createUnite);
router.put('/:id', protect, requireAdmin, updateUnite);

module.exports = router;
