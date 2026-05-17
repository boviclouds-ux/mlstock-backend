const mongoose = require('mongoose');

const bonDeLivraisonSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, trim: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
    societe: { type: String, trim: true },
    matricule: { type: String, trim: true },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BonDeLivraison', bonDeLivraisonSchema);
