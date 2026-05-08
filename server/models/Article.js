const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    categorie: {
      type: String,
      required: true,
      enum: ['semence', 'azote', 'materiel'],
    },
    unite: { type: String, required: true, trim: true },
    stockable: { type: Boolean, default: true },
    actif: { type: Boolean, default: true },
    seuilAlerte: { type: Number, default: 0 },
    seuilCritique: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Article', articleSchema);
