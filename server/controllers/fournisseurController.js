const Fournisseur = require('../models/Fournisseur');

function validationMessage(err) {
  return Object.values(err.errors).map(e => e.message).join(' | ');
}

/* GET /api/fournisseurs  — ?actif=true|false */
const getAllFournisseurs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.actif !== undefined) filter.actif = req.query.actif === 'true';

    const fournisseurs = await Fournisseur.find(filter).sort({ nom: 1 });
    res.status(200).json(fournisseurs);
  } catch (err) {
    console.error('[Fournisseur] getAllFournisseurs :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* POST /api/fournisseurs */
const createFournisseur = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.create(req.body);
    res.status(201).json(fournisseur);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    console.error('[Fournisseur] createFournisseur :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* PUT /api/fournisseurs/:id */
const updateFournisseur = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur introuvable.' });
    res.json(fournisseur);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    console.error('[Fournisseur] updateFournisseur :', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllFournisseurs, createFournisseur, updateFournisseur };
