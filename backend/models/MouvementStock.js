const mongoose = require('mongoose');

const MouvementStockSchema = new mongoose.Schema({
    lot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot', required: true },
    utilisateur_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    type_mouvement: { type: String, enum: ['entree', 'sortie', 'ajustement', 'perte'], required: true },
    quantite: { type: Number, required: true }, // Positif ou négatif
    reference_document: { type: String }, // Ex: ID d'une expédition ou réception
    date_mouvement: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('MouvementStock', MouvementStockSchema);
