const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
    label: { type: String, required: true },
    type: { type: String, enum: ['semence', 'azote', 'materiel'], required: true },
    unite_mesure: { type: String, enum: ['doses', 'litres', 'unites', 'pieces'], required: true },
    seuil_alerte_national: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Article', ArticleSchema);
