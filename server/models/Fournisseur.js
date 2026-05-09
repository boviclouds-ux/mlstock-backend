const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    nom:       { type: String, trim: true, default: '' },
    telephone: { type: String, trim: true, default: '' },
    email:     { type: String, trim: true, lowercase: true, default: '' },
  },
  { _id: false }
);

const fournisseurSchema = new mongoose.Schema(
  {
    nom: {
      type:     String,
      required: [true, 'Le nom du fournisseur est requis'],
      trim:     true,
    },
    pays: {
      type:    String,
      trim:    true,
      default: '',
    },
    specialite: {
      type:    String,
      trim:    true,
      default: 'Autres',
    },
    contact: {
      type:    contactSchema,
      default: () => ({}),
    },
    actif: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Fournisseur', fournisseurSchema);
