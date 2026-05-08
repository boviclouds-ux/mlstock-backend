const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['super_admin', 'Admin Fédéral', 'Responsable Coopérative', 'Magasinier Central'],
    },
    initiales: { type: String, uppercase: true, trim: true },
    cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cooperative', default: null },
    actif: { type: Boolean, default: true },
    derniereConnexion: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
