const mongoose = require('mongoose');

const lotSchema = new mongoose.Schema({
  referenceArticle: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  numeroLot: { type: String, required: true, unique: true },
  quantiteInitiale: { type: Number, required: true },
  quantiteActuelle: { type: Number, required: true },
  datePeremption: { type: Date, required: true },
  emplacementCuve: { type: String } // Ex: Cuve A - Tiroir 3
}, { timestamps: true });

module.exports = mongoose.model('Lot', lotSchema);