const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    code:        { type: String,  required: true, trim: true },
    expiresAt:   { type: Date,    required: true },
    actif:       { type: Boolean, default: true  },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// TTL : MongoDB supprime automatiquement le document à expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
