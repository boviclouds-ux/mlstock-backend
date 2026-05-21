const mongoose = require('mongoose');

/* ─── Sous-document ligne de transaction ───────────────── */
const ligneSchema = new mongoose.Schema(
  {
    article: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Article',
      required: [true, "L'article est requis dans chaque ligne"],
    },
    quantite: {
      type:     Number,
      required: [true, 'La quantité est requise'],
      min:      [1, 'La quantité doit être supérieure à 0'],
    },
    statutConformite: {
      type:    String,
      enum:    ['En attente', 'Conforme', 'Non conforme', 'Partiel'],
      default: 'En attente',
    },
  },
  { _id: true, timestamps: false }
);

/* ─── Schéma principal ─────────────────────────────────── */
const transactionSchema = new mongoose.Schema(
  {
    reference: {
      type:     String,
      required: [true, 'La référence est requise'],
      unique:   true,
      trim:     true,
    },
    type: {
      type:     String,
      required: [true, 'Le type de transaction est requis'],
      enum: {
        values:  ['RECEPTION', 'EXPEDITION', 'ORDRE_ADMIN'],
        message: 'Type invalide : {VALUE}',
      },
    },
    statut: {
      type:    String,
      enum: {
        values:  ['Brouillon', 'En attente', 'Validé', 'En_transit', 'Expedie', 'Livre', 'Expédié', 'Réceptionné', 'Rejeté'],
        message: 'Statut invalide : {VALUE}',
      },
      default: 'Brouillon',
    },
    // Motif obligatoire pour ORDRE_ADMIN, libre pour les autres types
    motif: {
      type:    String,
      trim:    true,
      default: '',
    },
    // Unité destinataire (Expédition / Ordre Admin)
    uniteCible: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Unite',
      default: null,
    },
    // Fournisseur source (Réception uniquement)
    fournisseurCible: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Fournisseur',
      default: null,
    },
    // Utilisateur ayant initié la transaction
    initiatedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, "L'initiateur est requis"],
    },
    // Lignes détail (articles + quantités + conformité)
    lignes: {
      type:     [ligneSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message:   'La transaction doit contenir au moins une ligne.',
      },
    },
    // Répartition génétique définie par l'Admin Fédéral (quotas/subventions)
    repartGenetique: {
      type: [{
        taureau: { type: String, trim: true, default: '' },
        nni:     { type: String, trim: true, default: '' },
        couleur: { type: String, trim: true, default: '' },
        cuve:    { type: String, trim: true, default: '' },
        qte:     { type: Number, default: 0 },
      }],
      default: [],
    },
    // Données renseignées lors de la remise au transporteur (étape finale)
    transporteur: {
      societe:   { type: String, trim: true, default: '' },
      matricule: { type: String, trim: true, default: '' },
    },
    blReference: { type: String, trim: true, default: null },

    // Validation de réception par le Responsable Régional
    receptionRegionale: {
      conformite:     { type: Boolean, default: null },
      commentaire:    { type: String,  trim: true, default: '' },
      validePar:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      dateValidation: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
    toJSON:    { virtuals: true },
    toObject:  { virtuals: true },
  }
);

/* ─── Virtuel : nombre total d'articles ─────────────────── */
transactionSchema.virtual('nbLignes').get(function () {
  return this.lignes?.length ?? 0;
});

/* ─── Validation : Ordre Admin doit avoir un motif ─────── */
transactionSchema.pre('save', function (next) {
  if (this.type === 'ORDRE_ADMIN' && !this.motif?.trim()) {
    return next(new Error("Un Ordre Admin doit obligatoirement avoir un motif."));
  }
  next();
});

/* ─── Index de recherche fréquente ─────────────────────── */
transactionSchema.index({ type: 1, statut: 1 });
transactionSchema.index({ uniteCible: 1 });
transactionSchema.index({ initiatedBy: 1 });

/* ─── Génère une référence unique TRX-YYYY-XXXXX ────────── */
transactionSchema.statics.generateReference = async function () {
  const year  = new Date().getFullYear();
  const count = await this.countDocuments();
  return `TRX-${year}-${String(count + 1).padStart(5, '0')}`;
};

module.exports = mongoose.model('Transaction', transactionSchema);
