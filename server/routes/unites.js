const express    = require('express');
const router     = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllUnites,
  getUniteById,
  createUnite,
  updateUnite,
} = require('../controllers/uniteController');

const ADMIN_ROLES = ['ADMIN_FEDERAL', 'ADMIN'];

// Lecture : accessible aux rôles internes (Admin, Magasinier)
router.get('/',    protect, authorize(...ADMIN_ROLES, 'MAGASINIER'), getAllUnites);
router.get('/:id', protect, authorize(...ADMIN_ROLES, 'MAGASINIER'), getUniteById);

// Écriture : réservée aux Admins
router.post('/',   protect, authorize(...ADMIN_ROLES), createUnite);
router.put('/:id', protect, authorize(...ADMIN_ROLES), updateUnite);

module.exports = router;
