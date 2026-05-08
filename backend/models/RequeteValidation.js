const mongoose = require('mongoose');

const RequeteValidationSchema = new mongoose.Schema({
    type: { type: String, enum: ['reception', 'expedition', 'derogation'], required: true },
    reference_id: { type: mongoose.Schema.Types.ObjectId, required: true }, // Polymorphique
    unite_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Unite', required: true },
    statut: { type: String, enum: ['en_attente', 'approuve', 'refuse'], default: 'en_attente' }
}, { timestamps: true });

module.exports = mongoose.model('RequeteValidation', RequeteValidationSchema);
