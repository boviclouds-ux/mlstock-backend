const mongoose = require('mongoose');

const CommandeClientSchema = new mongoose.Schema({
    reference: { type: String, required: true, unique: true },
    cree_par_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    unite_destinataire_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Unite', required: true },
    statut: { type: String, enum: ['a_preparer', 'en_attente_admin', 'approuve', 'expedie'], default: 'a_preparer' },
    derogation_necessaire: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('CommandeClient', CommandeClientSchema);
