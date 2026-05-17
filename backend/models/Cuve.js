const mongoose = require('mongoose');

const CuveSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    capacite_max: { type: Number, required: true },
    volume_actuel: { type: Number, default: 0 },
    temperature_actuelle: { type: Number },
    statut: { type: String, enum: ['ok', 'alerte', 'critique'], default: 'ok' }
}, { timestamps: true });

module.exports = mongoose.model('Cuve', CuveSchema);
