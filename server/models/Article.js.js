const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  codeArticle: { type: String, required: true, unique: true }, // Ex: HOL-01
  nom: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Semence', 'Azote', 'Consommable'],
    required: true 
  },
  uniteMesure: { type: String, required: true }, // Doses, Litres
  seuilAlerte: { type: Number, required: true }, // Stock minimum
  seuilCritique: { type: Number, required: true } // Rupture imminente
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);