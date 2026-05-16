const mongoose = require('mongoose');

const ligneSchema = new mongoose.Schema(
  {
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', default: null },
    label:     { type: String, required: true, trim: true },
    qte:       { type: Number, required: true, min: [1, 'La quantité doit être ≥ 1'] },
    unite:     { type: String, trim: true, default: 'U' },
    type:      { type: String, enum: ['semence', 'azote', 'materiel'], default: 'materiel' },
  },
  { _id: false }
);

const conformiteSchema = new mongoose.Schema(
  {
    resultat:         { type: String, enum: ['conforme', 'partiel', 'retour', 'non_conforme'], default: null },
    note:             { type: String, trim: true, default: '' },
    quantiteAttendue: { type: Number, default: null },  // total commandé
    quantiteRecue:    { type: Number, default: null },  // réellement réceptionné
  },
  { _id: false }
);

const approvisionnementSchema = new mongoose.Schema(
  {
    numeroCommande:      { type: String, required: true, unique: true, uppercase: true, trim: true },
    fournisseurId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Fournisseur', default: null },
    fournisseurNom:      { type: String, required: true, trim: true },
    fournisseurPays:     { type: String, trim: true, default: '' },
    fournisseurPavillon: { type: String, trim: true, default: '🌍' },
    lignes:              { type: [ligneSchema], required: true, validate: { validator: v => v.length > 0, message: 'Au moins une ligne est requise' } },
    dateArriveePrevu:    { type: Date, default: null },
    statut:              { type: String, enum: ['prevu', 'en_transit', 'a_quai', 'conforme', 'partiel', 'retour_fournisseur', 'non_conforme'], default: 'prevu' },
    transporteur:        { type: String, trim: true, default: 'À confirmer' },
    refBL:               { type: String, trim: true, default: null },
    lieuStockage:        { type: String, trim: true, default: 'Magasin Central National · Agadir' },
    conformite:          { type: conformiteSchema, default: null },
  },
  { timestamps: true }
);

/* Auto-génère le numéro BC-YYYY-XXXX si absent */
approvisionnementSchema.statics.generateNumero = async function () {
  const year  = new Date().getFullYear();
  const count = await this.countDocuments({ numeroCommande: { $regex: `^BC-${year}-` } });
  return `BC-${year}-${String(count + 1).padStart(4, '0')}`;
};

module.exports = mongoose.model('Approvisionnement', approvisionnementSchema);
