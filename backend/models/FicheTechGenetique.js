const mongoose = require('mongoose');

const FicheTechGenetiqueSchema = new mongoose.Schema({
    expedition_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Expedition', required: true },
    taureau: { type: String, required: true },
    nni: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('FicheTechGenetique', FicheTechGenetiqueSchema);
