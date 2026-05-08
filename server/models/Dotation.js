const mongoose = require('mongoose');

const dotationSchema = new mongoose.Schema(
  {
    cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cooperative', required: true },
    campagneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campagne', required: true },
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    alloue: { type: Number, required: true, min: 0 },
    consomme: { type: Number, default: 0, min: 0 },
    statut: {
      type: String,
      required: true,
      enum: ['normal', 'alerte', 'critique'],
      default: 'normal',
    },
    locked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

dotationSchema.index({ cooperativeId: 1, campagneId: 1, articleId: 1 }, { unique: true });

module.exports = mongoose.model('Dotation', dotationSchema);
