const mongoose = require('mongoose');

const alerteSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['peremption', 'stock_bas', 'stock_critique', 'temperature', 'depassement'],
    },
    lotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot', default: null },
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    seuil: { type: Number, required: true },
    valeurActuelle: { type: Number, required: true },
    statut: {
      type: String,
      required: true,
      enum: ['active', 'acquittee', 'resolue'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alerte', alerteSchema);
