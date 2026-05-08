const mongoose = require('mongoose');

const ReclamationSchema = new mongoose.Schema({
    reference: { type: String, required: true, unique: true },
    unite_emmetrice_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Unite', required: true },
    type_incident: { type: String, required: true },
    expedition_concernee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Expedition' },
    lot_concerne_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot' },
    description: { type: String, required: true },
    statut: { type: String, enum: ['ouverte', 'resolue', 'rejetee'], default: 'ouverte' }
}, { timestamps: true });

module.exports = mongoose.model('Reclamation', ReclamationSchema);
