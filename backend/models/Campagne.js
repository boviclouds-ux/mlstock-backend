const mongoose = require('mongoose');

const CampagneSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    date_debut: { type: Date, required: true },
    date_fin: { type: Date, required: true },
    statut: { type: String, enum: ['brouillon', 'active', 'cloturee'], default: 'brouillon' }
}, { timestamps: true });

module.exports = mongoose.model('Campagne', CampagneSchema);
