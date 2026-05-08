const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true }, // Sera hashé
  role: { 
    type: String, 
    enum: ['SuperAdmin', 'AdminFederal', 'Magasinier', 'Cooperative'],
    required: true 
  },
  uniteAffectation: { type: String }, // Ex: "Magasin Central", "Sakia Al Hamra"
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);