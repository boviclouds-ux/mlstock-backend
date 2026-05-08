const mongoose = require('mongoose');

const ReceptionFournisseurSchema = new mongoose.Schema({
    commande_fournisseur_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CommandeFournisseur', required: true },
    reference_bon_livraison: { type: String, required: true },
    statut_controle: { type: String, enum: ['conforme', 'anomalie'], required: true },
    date_reception: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ReceptionFournisseur', ReceptionFournisseurSchema);
