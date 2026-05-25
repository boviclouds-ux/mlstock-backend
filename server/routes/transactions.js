const express    = require('express');
const router     = express.Router();
const { protect, requireAdmin, requireDemand, requireDispatch } = require('../middleware/authMiddleware');
const {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatut,
  updateConformiteTransaction,
  creerLivraison,
  clotureBeneficiaire,
} = require('../controllers/transactionController');

// Lecture : tous les utilisateurs authentifiés
// (le cloisonnement bénéficiaire est géré dans le contrôleur)
router.get('/',    protect, getAllTransactions);
router.get('/:id', protect, getTransactionById);

// Création : bénéficiaires (demande) + admins (ORDRE_ADMIN)
// requireDemand laisse passer canDemand et isAdmin
router.post('/', protect, requireDemand, createTransaction);

// Changement de statut : bénéficiaires (Réceptionné) + magasiniers + admins
// La restriction métier fine (qui peut poser quel statut) est dans le contrôleur
router.put('/:id/statut', protect, requireDemand, updateTransactionStatut);

// Conformité des lignes : magasinier + admin uniquement
router.put('/:id/conformite', protect, requireDispatch, updateConformiteTransaction);

// Moteur de livraison (Bon de Livraison) : magasinier uniquement
// Atomique via session Mongoose — nécessite un replica set MongoDB
router.post('/:id/livraisons', protect, requireDispatch, creerLivraison);

// Clôture finale + facturation automatique : bénéficiaire (ou admin)
// Déclenche le moteur de facturation Sexée (Mission 8)
router.put('/:id/cloture-beneficiaire', protect, requireDemand, clotureBeneficiaire);

module.exports = router;
