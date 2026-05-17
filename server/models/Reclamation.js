const mongoose = require('mongoose');

const reclamationSchema = new mongoose.Schema(
  {
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
    motif: { type: String, required: true, trim: true },
    statut: {
      type: String,
      required: true,
      enum: ['ouverte', 'en_cours', 'resolue', 'rejetee'],
      default: 'ouverte',
    },
    photoUrl: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reclamation', reclamationSchema);
