const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    code: {
      type:      String,
      required:  [true, 'Le code article est requis'],
      uppercase: true,
      trim:      true,
    },
    designation: {
      type:     String,
      required: [true, 'La désignation est requise'],
      trim:     true,
    },
    // Catégorie libre : permet les catégories personnalisées (ex: "Azote", "Équipement"…)
    categorie: {
      type:    String,
      trim:    true,
      default: 'Autre',
    },
    uniteMesure: {
      type:     String,
      required: [true, "L'unité de mesure est requise"],
      enum: {
        values:  ['U', 'Unité', 'Paillettes', 'Doses', 'Dose', 'Kg', 'L', 'Boîte'],
        message: 'Unité de mesure invalide : {VALUE}',
      },
    },
    // Optionnel : null = article subventionné / sans valeur marchande
    valeurEstimee: {
      type:    Number,
      min:     [0, 'La valeur estimée ne peut pas être négative'],
      default: null,
    },
    // Prix unitaire de vente — null = non-commercial (subventionné)
    // Utilisé par le moteur de facturation Mission 8 (Semences Sexées)
    prixVenteUnitaire: {
      type:    Number,
      min:     [0, 'Le prix de vente ne peut pas être négatif'],
      default: null,
    },
    seuilAlerte: {
      type:    Number,
      min:     [0, 'Le seuil d\'alerte ne peut pas être négatif'],
      default: 0,
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

/* ─── Virtuel : indique si l'article est subventionné ──── */
articleSchema.virtual('subventionne').get(function () {
  return this.valeurEstimee == null;
});

/* ─── Index unique partiel : code unique seulement sur les articles actifs ─
   Permet de recréer un article avec le même code après soft-delete (actif: false).
   syncIndexes() dans server.js supprime l'ancien index global et crée celui-ci. */
articleSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { actif: true } }
);

/* ─── Index texte pour la recherche ────────────────────── */
articleSchema.index({ designation: 'text', categorie: 'text' });

module.exports = mongoose.model('Article', articleSchema);
