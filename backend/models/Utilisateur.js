const mongoose = require('mongoose');

const UtilisateurSchema = new mongoose.Schema({
    nom_complet: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'responsable_region', 'responsable_coop', 'magasinier'],
        required: true
    },
    unite_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Unite', required: true },
    mfa_enabled: { type: Boolean, default: false },
    statut: { type: String, enum: ['actif', 'en_attente', 'suspendu'], default: 'actif' },
    last_login_at: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Utilisateur', UtilisateurSchema);
