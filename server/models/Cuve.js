const mongoose = require('mongoose');

const cuveSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    volumeActuelL: { type: Number, default: 0 },
    capaciteMaxL: { type: Number, required: true },
    temperatureC: { type: Number, default: null },
    statut: {
      type: String,
      required: true,
      enum: ['disponible', 'en_service', 'maintenance', 'hors_service'],
      default: 'disponible',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cuve', cuveSchema);
