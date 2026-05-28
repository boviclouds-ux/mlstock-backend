const mongoose = require('mongoose');

/* ─────────────────────────────────────────────────────────
   SINGLETON : une seule instance de ce document en base.
   Contrainte DB : singletonKey unique avec valeur 'global'.
   Utiliser Configuration.getSingleton() pour lire,
   et Configuration.updateConfig(data) pour écrire.
───────────────────────────────────────────────────────── */
const configurationSchema = new mongoose.Schema(
  {
    // Clé fixe qui garantit l'unicité du document
    singletonKey: {
      type:      String,
      default:   'global',
      unique:    true,
      immutable: true,
    },

    /* ─ Campagnes & Quotas ─ */
    campagneActive: {
      type:    String,
      trim:    true,
      default: '2025-2026',
    },
    periodeRenouvellementQuotas: {
      type:    String,
      enum:    ['Annuel', 'Semestriel', 'Trimestriel'],
      default: 'Annuel',
    },
    campagneStatut: {
      type:    String,
      enum:    ['active', 'cloturee'],
      default: 'active',
    },

    /* ─ Alertes & Seuils ─ */
    seuilAlerteGlobal: {
      type:    Number,
      min:     [0, 'Le seuil ne peut pas être négatif'],
      default: 10,
    },

    /* ─ Sécurité OTP ─ */
    dureeValiditeOTP: {
      type:    Number,
      min:     [60,  'Durée OTP minimum : 60 secondes'],
      max:     [900, 'Durée OTP maximum : 900 secondes'],
      default: 300,
    },
    authForteTransferts: {
      type:    Boolean,
      default: true,
    },

    /* ─ Notifications & Maintenance ─ */
    modeMaintenance: {
      type:    Boolean,
      default: false,
    },
    alertesSMSActives: {
      type:    Boolean,
      default: true,
    },

    /* ─ Sauvegardes ─ */
    frequenceBackup: {
      type:    String,
      enum:    ['Quotidien', 'Hebdomadaire', 'Mensuel'],
      default: 'Quotidien',
    },
    derniereBackup: {
      type:    Date,
      default: null,
    },

    /* ─ Finance & Valorisation ─ */
    methodeValorisation: {
      type:    String,
      enum:    ['CUMP', 'FIFO', 'LIFO'],
      default: 'CUMP',
    },

    /* ─ Marque Blanche / Personnalisation PDF ─ */
    nomEntreprise: {
      type:    String,
      trim:    true,
      default: 'Maroc Lait',
    },
    slogan: {
      type:    String,
      trim:    true,
      default: 'Hub Central National · Agadir',
    },
    piedDePage: {
      type:    String,
      trim:    true,
      default: '',
    },
    logoUrl: {
      type:    String,
      trim:    true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

/* ═══════════════════════════════════════════════════════════
   getSingleton()
   Retourne le document de configuration (le crée si absent).
═══════════════════════════════════════════════════════════ */
configurationSchema.statics.getSingleton = async function () {
  let config = await this.findOne({ singletonKey: 'global' });
  if (!config) {
    config = await this.create({ singletonKey: 'global' });
  }
  return config;
};

/* ═══════════════════════════════════════════════════════════
   updateConfig(data)
   Met à jour les champs passés dans data (upsert sécurisé).
═══════════════════════════════════════════════════════════ */
configurationSchema.statics.updateConfig = async function (data) {
  // Empêche d'écraser la clé singleton
  const { singletonKey: _, ...safeData } = data;

  return this.findOneAndUpdate(
    { singletonKey: 'global' },
    { $set: safeData },
    { new: true, upsert: true, runValidators: true }
  );
};

module.exports = mongoose.model('Configuration', configurationSchema);
