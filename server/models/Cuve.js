const mongoose = require('mongoose');

const cuveSchema = new mongoose.Schema(
  {
    nom: {
      type:     String,
      required: [true, 'Le nom de la cuve est requis'],
      trim:     true,
    },
    capacite: {
      type:     Number,
      required: [true, 'La capacité est requise'],
      min:      [1, 'La capacité doit être supérieure à 0'],
    },
    niveauActuel: {
      type:    Number,
      default: 0,
      min:     [0, 'Le niveau ne peut pas être négatif'],
    },
    statut: {
      type:    String,
      enum:    ['ok', 'alerte', 'critique'],
      default: 'ok',
    },
    description: {
      type:    String,
      trim:    true,
      default: '',
    },
    statutPret: {
      type:    String,
      enum:    ['Disponible', 'En Prêt'],
      default: 'Disponible',
    },
    localisationActuelle: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Unite',
      default: null,
    },
  },
  { timestamps: true }
);

/* Calcul automatique du statut avant chaque sauvegarde */
cuveSchema.pre('save', function (next) {
  const pct = this.capacite > 0 ? (this.niveauActuel / this.capacite) * 100 : 0;
  this.statut = pct < 15 ? 'critique' : pct < 30 ? 'alerte' : 'ok';
  next();
});

module.exports = mongoose.model('Cuve', cuveSchema);
