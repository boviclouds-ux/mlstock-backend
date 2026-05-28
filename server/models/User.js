const mongoose = require('mongoose');
const bcrypt    = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    prenom: {
      type: String,
      trim: true,
      default: '',
    },
    nom: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Format email invalide'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [6, 'Minimum 6 caractères'],
      select: false, // jamais renvoyé par défaut dans les requêtes
    },
    permissions: {
      canDemand:      { type: Boolean, default: false }, // Acheteur / Demandeur
      canReceive:     { type: Boolean, default: false }, // Réceptionneur fournisseur
      canDispatch:    { type: Boolean, default: false }, // Magasinier — bons d'enlèvement et BL
      canManageAppro: { type: Boolean, default: false }, // Gestionnaire d'Approvisionnement
      isAdmin:        { type: Boolean, default: false }, // Gestion globale et quotas
      canActAsProxy:  { type: Boolean, default: false }, // Saisie déléguée pour coopératives externes
    },
    entite: {
      type: String,
      trim: true,
      default: 'Maroc Lait — Hub Central',
    },
    statut: {
      type: String,
      enum: ['Actif', 'Suspendu', 'En attente'],
      default: 'En attente',
    },
    mfa: {
      type: Boolean,
      default: false,
    },
    derniereConnexion: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

/* ─── Hashage du mot de passe avant sauvegarde ─────────── */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ─── Méthode de comparaison mot de passe ──────────────── */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ─── Supprime le password des réponses JSON ────────────── */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
