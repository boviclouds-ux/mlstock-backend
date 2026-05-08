const mongoose = require('mongoose');

const pinSessionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cooperative', required: true },
    duree: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

pinSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PinSession', pinSessionSchema);
