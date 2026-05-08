const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  typeMouvement: { 
    type: String, 
    enum: ['ReceptionFournisseur', 'ExpeditionUnite', 'AjustementInventaire'],
    required: true 
  },
  referenceLot: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot', required: true },
  quantite: { type: Number, required: true }, // Positif (entrée) ou Négatif (sortie)
  emetteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  destinataire: { type: String }, // Nom de la coopérative ou ID
  statut: { 
    type: String, 
    enum: ['EnTransit', 'Livre', 'Anomalie'],
    default: 'Livre' 
  },
  urlJustificatif: { type: String } // Lien vers la photo du BL ou du thermomètre
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);