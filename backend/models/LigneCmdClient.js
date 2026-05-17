const mongoose = require('mongoose');

const LigneCmdClientSchema = new mongoose.Schema({
    commande_client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CommandeClient', required: true },
    article_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    quantite_demandee: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('LigneCmdClient', LigneCmdClientSchema);
