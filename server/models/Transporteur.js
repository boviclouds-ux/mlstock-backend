const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    nom:       { type: String, trim: true, default: '' },
    telephone: { type: String, trim: true, default: '' },
    email:     { type: String, trim: true, lowercase: true, default: '' },
  },
  { _id: false }
);

const transporteurSchema = new mongoose.Schema(
  {
    code: {
      type:      String,
      required:  [true, 'Le code transporteur est requis'],
      uppercase: true,
      trim:      true,
    },
    nom: {
      type:     String,
      required: [true, 'Le nom du transporteur est requis'],
      trim:     true,
    },
    type: {
      type:    String,
      enum:    ['Prestataire Externe', 'Interne Maroc Lait'],
      default: 'Prestataire Externe',
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

/* Index unique partiel : code unique seulement sur les transporteurs actifs */
transporteurSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { actif: true } }
);

module.exports = mongoose.model('Transporteur', transporteurSchema);
