const mongoose = require('mongoose');

const genetiqueSchema = new mongoose.Schema(
  {
    taureau: { type: String, trim: true },
    nni: { type: String, trim: true },
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', default: null },
    refLot: { type: String, trim: true },
    couleur: { type: String, trim: true },
    qte: { type: Number, default: 0 },
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
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    cuveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cuve', default: null },
    fournisseurId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fournisseur', required: true },
    rack: { type: String, trim: true },
    qteDisponible: { type: Number, required: true, default: 0 },
    peremption: { type: Date, default: null },
    statut: {
      type: String,
      required: true,
      enum: ['disponible', 'reserve', 'epuise', 'perime', 'quarantaine'],
      default: 'disponible',
    },
    genetique: { type: [genetiqueSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lot', lotSchema);
