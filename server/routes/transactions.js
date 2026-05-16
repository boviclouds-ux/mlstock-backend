const express    = require('express');
const router     = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatut,
  updateConformiteTransaction,
} = require('../controllers/transactionController');

const ADMIN_ROLES    = ['ADMIN_FEDERAL', 'ADMIN'];
const OPS_ROLES      = [...ADMIN_ROLES, 'MAGASINIER'];        // opérationnels terrain
const ALL_ROLES      = [...OPS_ROLES,   'UNITE'];              // tout le monde connecté
// UNITE peut confirmer la réception physique (Expédié → Réceptionné uniquement)
const STATUT_ROLES   = [...OPS_ROLES,   'UNITE'];

// Lecture
router.get('/',    protect, authorize(...ALL_ROLES), getAllTransactions);
router.get('/:id', protect, authorize(...ALL_ROLES), getTransactionById);

// Création : Admins créent les ORDRE_ADMIN, Unités créent les demandes (EXPEDITION)
router.post('/', protect, authorize(...ALL_ROLES), createTransaction);

// Changement de statut :
// - OPS_ROLES (Admin + Magasinier) : tous les changements de statut
// - UNITE : autorisé uniquement pour confirmer la réception (Expédié → Réceptionné)
//   La restriction métier est appliquée dans le contrôleur.
router.put('/:id/statut',     protect, authorize(...STATUT_ROLES), updateTransactionStatut);

// Conformité des lignes : Admin ou Magasinier après réception physique
router.put('/:id/conformite', protect, authorize(...OPS_ROLES), updateConformiteTransaction);

module.exports = router;
