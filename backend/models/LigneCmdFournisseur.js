const mongoose = require('mongoose');

const LigneCmdFournisseurSchema = new mongoose.Schema({
    commande_fournisseur_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CommandeFournisseur', required: true },
    article_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    quantite_demandee: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('LigneCmdFournisseur', LigneCmdFournisseurSchema);
