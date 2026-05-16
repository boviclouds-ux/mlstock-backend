const mongoose = require('mongoose');

const PinDerogationSchema = new mongoose.Schema({
    code_pin: { type: String, required: true },
    unite_cible_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Unite', required: true },
    valide_jusqu_a: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('PinDerogation', PinDerogationSchema);
