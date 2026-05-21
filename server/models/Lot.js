const mongoose = require('mongoose');

/* Schéma des lignes de fiche technique — nom exact utilisé par le frontend */
const ficheTechniqueSchema = new mongoose.Schema(
  {
    taureau: { type: String, trim: true, default: '' },
    nni:     { type: String, trim: true, default: '' },
    couleur: { type: String, trim: true, default: '' },
    qte:     { type: Number, default: 0 },
    cuve:    { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const lotSchema = new mongoose.Schema(
  {
    numLot: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['semence', 'azote', 'materiel'],
    },
    articleId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Article',      required: true },
    cuveId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Cuve',         default: null },
    fournisseurId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fournisseur',  default: null },
    rack:          { type: String, trim: true },
    qteDisponible: { type: Number, required: true, default: 0 },
    peremption:    { type: Date,   default: null },
    statut: {
      type: String,
      required: true,
      enum: ['disponible', 'reserve', 'epuise', 'perime', 'quarantaine'],
      default: 'disponible',
    },
    /* Fiche technique semences — champ unifié avec le frontend */
    ficheTechnique: { type: [ficheTechniqueSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lot', lotSchema);
