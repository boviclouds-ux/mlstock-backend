const mongoose = require('mongoose');

const transactionLotSchema = new mongoose.Schema(
  {
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
    lotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot', required: true },
    qteRetire: { type: Number, required: true, min: 0 },
    cuve: { type: String, trim: true },
  },
  { timestamps: true }
);

transactionLotSchema.index({ transactionId: 1, lotId: 1 }, { unique: true });

module.exports = mongoose.model('TransactionLot', transactionLotSchema);
