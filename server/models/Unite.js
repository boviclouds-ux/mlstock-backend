const mongoose = require('mongoose');

/* ─── Sous-document contact ────────────────────────────── */
const contactSchema = new mongoose.Schema(
  {
    nom:       { type: String, trim: true, default: '' },
    telephone: { type: String, trim: true, default: '' },
    email:     { type: String, trim: true, lowercase: true, default: '' },
  },
  { _id: false }
);

/* ─── Schéma principal ─────────────────────────────────── */
const uniteSchema = new mongoose.Schema(
  {
    code: {
      type:      String,
      required:  [true, 'Le code unité est requis'],
      unique:    true,
      uppercase: true,
      trim:      true,
    },
    nom: {
      type:     String,
      required: [true, "Le nom de l'unité est requis"],
      trim:     true,
    },
    region: {
      type:    String,
      trim:    true,
      default: '',
    },
    type: {
      type:    String,
      enum: {
        values:  ['COOPERATIVE', 'ENTREPRISE', 'PERSONNE_PHYSIQUE'],
        message: 'Type invalide : {VALUE}',
      },
      default: 'COOPERATIVE',
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
  {
    timestamps: true,
    toJSON:    { virtuals: true },
    toObject:  { virtuals: true },
  }
);

/* ─── Index texte pour la recherche ────────────────────── */
uniteSchema.index({ nom: 'text', region: 'text' });

module.exports = mongoose.model('Unite', uniteSchema);
