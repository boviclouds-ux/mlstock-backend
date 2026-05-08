const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema(
  {
    societe: { type: String, trim: true },
    matricule: { type: String, trim: true },
  },
  { _id: false }
);

const derogationHistoriqueSchema = new mongoose.Schema(
  {
    motif: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const derogationSchema = new mongoose.Schema(
  {
    motif: { type: String, trim: true },
    totalDerogations: { type: Number, default: 0 },
    historique: { type: [derogationHistoriqueSchema], default: [] },
  },
  { _id: false }
);

const rapportSchema = new mongoose.Schema(
  {
    cmdRef: { type: String, trim: true },
    prevu: { type: Number, default: 0 },
    recu: { type: Number, default: 0 },
    manquant: { type: Number, default: 0 },
    remarque: { type: String, trim: true },
    temperature: { type: Number, default: null },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['reception', 'expedition', 'depassement'],
    },
    statut: {
      type: String,
      required: true,
      enum: ['brouillon', 'en_cours', 'validee', 'annulee'],
      default: 'brouillon',
    },
    conformite: {
      type: String,
      enum: ['conforme', 'non_conforme', 'partielle', null],
      default: null,
    },
    priorite: {
      type: String,
      enum: ['normale', 'urgente', 'critique'],
      default: 'normale',
    },
    origine: { type: String, trim: true },
    origineNote: { type: String, trim: true },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cooperative', required: true },
    fournisseurId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fournisseur', default: null },
    transport: { type: transportSchema, default: () => ({}) },
    derogation: { type: derogationSchema, default: () => ({}) },
    rapport: { type: rapportSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
