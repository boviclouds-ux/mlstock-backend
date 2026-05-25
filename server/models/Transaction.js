const mongoose = require('mongoose');

/* ═══════════════════════════════════════════════════════════
   Sous-documents
═══════════════════════════════════════════════════════════ */

/* ─── Ligne de transaction (articles commandés) ─────────── */
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

/* ─── Répartition génétique (par NNI / conteneur) ──────────
   Cycle de vie d'une ligne génétique :
     quantiteDemandee  → saisie par le bénéficiaire à la création
     quantiteAutorisee → fixée par l'Admin lors du Bon d'Enlèvement
     quantiteLivree    → cumulée à chaque Bon de Livraison physique
────────────────────────────────────────────────────────── */
const repartGenetiqueSchema = new mongoose.Schema(
  {
    taureau:           { type: String, trim: true, default: '' },
    nni:               { type: String, trim: true, default: '' },
    couleur:           { type: String, trim: true, default: '' },
    conteneurSemence:  { type: String, trim: true, default: '' },

    // Dénormalisé pour le moteur de facturation (Mission 8)
    typeProduit: {
      type: String,
      enum: { values: ['Conventionnelle', 'Sexée', 'Azote', ''], message: 'typeProduit invalide : {VALUE}' },
      default: '',
    },
    articleId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Article',
      default: null,
    },

    quantiteDemandee:  {
      type:    Number,
      default: 0,
      min:     [0, 'La quantité demandée ne peut pas être négative'],
    },
    quantiteAutorisee: {
      type:    Number,
      default: 0,
      min:     [0, 'La quantité autorisée ne peut pas être négative'],
    },
    quantiteLivree: {
      type:    Number,
      default: 0,
      min:     [0, 'La quantité livrée ne peut pas être négative'],
    },
  },
  { _id: false }
);

/* ─── Historique des livraisons physiques (Bons de Livraison) ──
   Une entrée = un retrait physique en magasin.
   Plusieurs entrées peuvent partager le même referenceBL si
   un seul bon couvre plusieurs conteneurs.
   La décrémentation du stock Lot est conditionnée à l'ajout
   d'une entrée ici (règle métier stricte).
────────────────────────────────────────────────────────── */
const livraisonSchema = new mongoose.Schema(
  {
    referenceBL:      {
      type:     String,
      trim:     true,
      required: [true, 'La référence BL est requise'],
    },
    dateExpedition:   { type: Date, default: Date.now },
    magasinierId:     {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Le magasinier est requis'],
    },
    conteneurSemence: { type: String, trim: true, default: '' },
    quantiteExpediee: {
      type:     Number,
      required: [true, 'La quantité expédiée est requise'],
      min:      [1, 'La quantité expédiée doit être ≥ 1'],
    },
  },
  { _id: true, timestamps: false }
);

/* ═══════════════════════════════════════════════════════════
   Schéma principal Transaction
═══════════════════════════════════════════════════════════ */
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

    /* ── Workflow linéaire strict ───────────────────────────
       Brouillon          → transaction en cours de saisie
       Demandée           → bénéficiaire a soumis sa demande
       Validée_BE         → admin a autorisé les quantités (Bon d'Enlèvement généré)
       Partiellement_Livrée → ≥ 1 BL émis, reliquat en cours
       Totalement_Livrée  → tous les BL émis (quantiteLivree = quantiteAutorisee)
       Réceptionnée_Cloturée → bénéficiaire a signé la réception finale
       Rejeté             → rejet à n'importe quelle étape
    ──────────────────────────────────────────────────────── */
    statut: {
      type:    String,
      enum: {
        values: [
          'Brouillon',
          'Demandée',
          'Validée_BE',
          'Partiellement_Livrée',
          'Totalement_Livrée',
          'Réceptionnée_Cloturée',
          'Rejeté',
        ],
        message: 'Statut invalide : {VALUE}',
      },
      default: 'Brouillon',
    },

    // Motif obligatoire pour ORDRE_ADMIN
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

    // Lignes articles (quantités commandées + conformité)
    lignes: {
      type:     [ligneSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message:   'La transaction doit contenir au moins une ligne.',
      },
    },

    // Répartition génétique avec cycle de vie complet des quantités
    repartGenetique: {
      type:    [repartGenetiqueSchema],
      default: [],
    },

    // Historique chronologique des livraisons physiques
    // Chaque entrée déclenche une décrémentation du stock Lot
    historiqueLivraisons: {
      type:    [livraisonSchema],
      default: [],
    },

    // Données du transporteur (infos de la dernière remise)
    transporteur: {
      societe:   { type: String, trim: true, default: '' },
      matricule: { type: String, trim: true, default: '' },
    },

    // Facturation automatique — déclenchée à la clôture bénéficiaire (Mission 8)
    // Non_Applicable : aucune ligne Sexée dans cet ordre
    // En_Attente     : montant calculé, en attente de règlement
    // Payée          : règlement enregistré par l'Admin
    facturation: {
      statut:           { type: String, enum: ['Non_Applicable', 'En_Attente', 'Payée'], default: 'Non_Applicable' },
      montantTotal:     { type: Number, default: 0, min: 0 },
      referenceFacture: { type: String, trim: true, default: '' },
    },

    // Clôture par le Responsable Régional
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

/* ═══════════════════════════════════════════════════════════
   Virtuals calculés
═══════════════════════════════════════════════════════════ */

/** Nombre de lignes articles */
transactionSchema.virtual('nbLignes').get(function () {
  return this.lignes?.length ?? 0;
});

/** Somme des quantités autorisées par l'admin (Bon d'Enlèvement global) */
transactionSchema.virtual('quantiteTotaleAutorisee').get(function () {
  return (this.repartGenetique ?? []).reduce((s, g) => s + (g.quantiteAutorisee ?? 0), 0);
});

/** Somme des quantités effectivement livrées (cumul de tous les BL) */
transactionSchema.virtual('quantiteTotaleLivree').get(function () {
  return (this.repartGenetique ?? []).reduce((s, g) => s + (g.quantiteLivree ?? 0), 0);
});

/** Reliquat = quantité autorisée non encore livrée */
transactionSchema.virtual('reliquat').get(function () {
  return (this.repartGenetique ?? []).reduce(
    (s, g) => s + Math.max(0, (g.quantiteAutorisee ?? 0) - (g.quantiteLivree ?? 0)),
    0
  );
});

/** Référence du dernier BL émis (rétrocompat frontend) */
transactionSchema.virtual('blReference').get(function () {
  const livs = this.historiqueLivraisons;
  if (!livs?.length) return null;
  return livs[livs.length - 1].referenceBL;
});

/* ═══════════════════════════════════════════════════════════
   Validation pre-save
═══════════════════════════════════════════════════════════ */
transactionSchema.pre('save', function (next) {
  if (this.type === 'ORDRE_ADMIN' && !this.motif?.trim()) {
    return next(new Error('Un Ordre Admin doit obligatoirement avoir un motif.'));
  }

  // Lors du passage à Validée_BE : s'assurer qu'au moins une quantité est autorisée
  if (this.statut === 'Validée_BE') {
    const totalAutorise = (this.repartGenetique ?? []).reduce((s, g) => s + (g.quantiteAutorisee ?? 0), 0);
    if (totalAutorise <= 0) {
      return next(new Error('Le Bon d\'Enlèvement exige au moins une quantité autorisée > 0 dans repartGenetique.'));
    }
  }

  next();
});

/* ═══════════════════════════════════════════════════════════
   Index
═══════════════════════════════════════════════════════════ */
transactionSchema.index({ type: 1, statut: 1 });
transactionSchema.index({ uniteCible: 1 });
transactionSchema.index({ initiatedBy: 1 });
transactionSchema.index({ 'historiqueLivraisons.referenceBL': 1 }); // recherche rapide par BL

/* ═══════════════════════════════════════════════════════════
   Static : génère une référence unique TRX-YYYY-XXXXX
═══════════════════════════════════════════════════════════ */
transactionSchema.statics.generateReference = async function () {
  const year  = new Date().getFullYear();
  const count = await this.countDocuments();
  return `TRX-${year}-${String(count + 1).padStart(5, '0')}`;
};

module.exports = mongoose.model('Transaction', transactionSchema);
