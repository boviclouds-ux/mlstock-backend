const Transporteur = require('../models/Transporteur');

function validationMessage(err) {
  return Object.values(err.errors).map(e => e.message).join(' | ');
}

/* GET /api/transporteurs  — ?actif=true|false */
const getAllTransporteurs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.actif !== undefined) filter.actif = req.query.actif === 'true';

    const transporteurs = await Transporteur.find(filter).sort({ nom: 1 });
    res.status(200).json(transporteurs);
  } catch (err) {
    console.error('[Transporteur] getAllTransporteurs :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* POST /api/transporteurs */
const createTransporteur = async (req, res) => {
  try {
    const transporteur = await Transporteur.create(req.body);
    res.status(201).json(transporteur);
  } catch (err) {
    if (err.code === 11000)             return res.status(409).json({ message: 'Un code transporteur identique existe déjà.' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    console.error('[Transporteur] createTransporteur :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* PUT /api/transporteurs/:id */
const updateTransporteur = async (req, res) => {
  try {
    const { code: _code, ...updates } = req.body;

    const transporteur = await Transporteur.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!transporteur) return res.status(404).json({ message: 'Transporteur introuvable.' });
    res.json(transporteur);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    console.error('[Transporteur] updateTransporteur :', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllTransporteurs, createTransporteur, updateTransporteur };
