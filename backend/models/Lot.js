const mongoose = require('mongoose');

const LotSchema = new mongoose.Schema({
    code_lot: { type: String, required: true, unique: true },
    article_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    unite_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Unite', required: true },
    cuve_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cuve' },
    quantite_initiale: { type: Number, required: true },
    quantite_disponible: { type: Number, required: true },
    date_peremption: { type: Date },
    statut: { type: String, enum: ['disponible', 'quarantaine', 'epuise', 'perime'], default: 'disponible' }
}, { timestamps: true });

module.exports = mongoose.model('Lot', LotSchema);
