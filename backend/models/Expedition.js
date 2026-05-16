const mongoose = require('mongoose');

const ExpeditionSchema = new mongoose.Schema({
    reference: { type: String, required: true, unique: true },
    commande_client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CommandeClient', required: true },
    societe_transport: { type: String, required: true },
    date_envoi: { type: Date },
    conformite_reception: { type: String, enum: ['conforme', 'anomalie'] }
}, { timestamps: true });

module.exports = mongoose.model('Expedition', ExpeditionSchema);
