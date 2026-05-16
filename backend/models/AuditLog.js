const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    utilisateur_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    action: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed } // Stockage JSON libre de l'état avant/après
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
