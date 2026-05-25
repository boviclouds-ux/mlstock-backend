const mongoose = require('mongoose');

const ficheTechniqueSchema = new mongoose.Schema(
  {
    taureau:          { type: String, trim: true, default: '' },
    nni:              { type: String, trim: true, default: '' },
    couleur:          { type: String, trim: true, default: '' },
    qte:              { type: Number, default: 0 },
    conteneurSemence: { type: String, trim: true, default: '' }, // anciennement: cuve
  },
  { _id: false }
);

const lotSchema = new mongoose.Schema(
  {
    numLot: { type: String, required: true, unique: true, trim: true },

    typeProduit: {
      type:     String,
      required: [true, 'Le type de produit est requis'],
      enum: {
        values:  ['Conventionnelle', 'Sexée', 'Azote'],
        message: 'typeProduit invalide : {VALUE}',
      },
    },

    uniteMesure: {
      type:     String,
      required: [true, "L'unité de mesure est requise"],
      enum: {
        values:  ['Unité', 'Litre'],
        message: 'uniteMesure invalide : {VALUE}',
      },
    },

    prixAchatUnitaire: {
      type:     Number,
      required: [true, "Le prix d'achat unitaire est requis"],
      min:      [0, 'Le prix ne peut pas être négatif'],
    },

    articleId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Article',    required: true },
    cuveId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Cuve',       default: null },
    fournisseurId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Fournisseur',required: true },
    rack:         { type: String, trim: true },

    qteDisponible: { type: Number, required: true, default: 0 },
    peremption:    { type: Date,   default: null },

    statut: {
      type:     String,
      required: true,
      enum:     ['disponible', 'reserve', 'epuise', 'perime', 'quarantaine'],
      default:  'disponible',
    },

    ficheTechnique: { type: [ficheTechniqueSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lot', lotSchema);
