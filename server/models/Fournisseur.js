const mongoose = require('mongoose');

const fournisseurSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    nom: { type: String, required: true, trim: true },
    pays: { type: String, trim: true },
    contact: { type: String, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['laboratoire', 'equipementier', 'autre'],
    },
    actif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Fournisseur', fournisseurSchema);
