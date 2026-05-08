const mongoose = require('mongoose');

const mouvementStockSchema = new mongoose.Schema(
  {
    lotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    typeMouvement: {
      type: String,
      required: true,
      enum: ['entree', 'sortie', 'ajustement', 'perte'],
    },
    quantite: { type: Number, required: true },
    referenceDocument: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

mouvementStockSchema.index({ lotId: 1, createdAt: -1 });
mouvementStockSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('MouvementStock', mouvementStockSchema);
