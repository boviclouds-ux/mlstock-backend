const mongoose = require('mongoose');

const UniteSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['siege', 'central', 'cooperative'], required: true },
    region_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' } // Nullable pour le siège
}, { timestamps: true });

module.exports = mongoose.model('Unite', UniteSchema);
