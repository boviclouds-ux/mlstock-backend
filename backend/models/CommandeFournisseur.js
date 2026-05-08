const mongoose = require('mongoose');

const CommandeFournisseurSchema = new mongoose.Schema({
    reference: { type: String, required: true, unique: true },
    fournisseur_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Fournisseur', required: true },
    cree_par_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    statut: { type: String, enum: ['brouillon', 'envoyee', 'partiellement_recue', 'terminee'], default: 'brouillon' }
}, { timestamps: true });

module.exports = mongoose.model('CommandeFournisseur', CommandeFournisseurSchema);
