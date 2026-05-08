const mongoose = require('mongoose');

const QuotaSchema = new mongoose.Schema({
    campagne_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campagne', required: true },
    unite_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Unite', required: true },
    article_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    quantite_allouee: { type: Number, required: true },
    quantite_consommee: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Quota', QuotaSchema);
