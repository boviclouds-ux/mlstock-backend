const mongoose = require('mongoose');

const LotScelleSchema = new mongoose.Schema({
    expedition_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Expedition', required: true },
    lot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot', required: true },
    quantite_retiree: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('LotScelle', LotScelleSchema);
