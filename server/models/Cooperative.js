const mongoose = require('mongoose');

const cooperativeSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    region: { type: String, required: true, trim: true },
    actif: { type: Boolean, default: true },
    capaciteAzoteL: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cooperative', cooperativeSchema);
