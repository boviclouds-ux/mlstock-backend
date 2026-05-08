const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatus,
  addLotsToTransaction,
} = require('../controllers/transactionController');

router.post('/',              createTransaction);
router.get('/',               getAllTransactions);
router.get('/:id',            getTransactionById);
router.patch('/:id/statut',   updateTransactionStatus);
router.patch('/:id/lots',     addLotsToTransaction);

module.exports = router;
