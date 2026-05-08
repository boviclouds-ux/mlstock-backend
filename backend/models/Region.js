const mongoose = require('mongoose');

const RegionSchema = new mongoose.Schema({
    nom: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Region', RegionSchema);
