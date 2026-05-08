const mongoose = require('mongoose');

const campagneSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    periode: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['semence', 'azote', 'materiel'],
    },
    volumeTotal: { type: Number, default: 0 },
    statut: {
      type: String,
      required: true,
      enum: ['brouillon', 'active', 'cloturee', 'archivee'],
      default: 'brouillon',
    },
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campagne', campagneSchema);
