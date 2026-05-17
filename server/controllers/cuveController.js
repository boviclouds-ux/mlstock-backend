const Cuve = require('../models/Cuve');

function validationMessage(err) {
  return Object.values(err.errors).map(e => e.message).join(' | ');
}

/* GET /api/cuves */
const getAllCuves = async (req, res) => {
  try {
    const cuves = await Cuve.find().sort({ nom: 1 });
    res.status(200).json(cuves);
  } catch (err) {
    console.error('[Cuve] getAllCuves :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* POST /api/cuves */
const createCuve = async (req, res) => {
  try {
    const cuve = new Cuve(req.body);
    await cuve.save(); // déclenche le pre-save hook (calcul statut)
    res.status(201).json(cuve);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    console.error('[Cuve] createCuve :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* PUT /api/cuves/:id */
const updateCuve = async (req, res) => {
  try {
    const cuve = await Cuve.findById(req.params.id);
    if (!cuve) return res.status(404).json({ message: 'Cuve introuvable.' });

    Object.assign(cuve, req.body);
    await cuve.save(); // déclenche le pre-save hook
    res.json(cuve);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    console.error('[Cuve] updateCuve :', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllCuves, createCuve, updateCuve };
