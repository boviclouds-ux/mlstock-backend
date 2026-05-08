const mongoose = require('mongoose');

const FournisseurSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    pays: { type: String, required: true },
    email_contact: { type: String },
    statut: { type: String, enum: ['actif', 'inactif'], default: 'actif' }
}, { timestamps: true });

module.exports = mongoose.model('Fournisseur', FournisseurSchema);
