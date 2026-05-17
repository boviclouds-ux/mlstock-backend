const Unite = require('../models/Unite');

/* ─── Helper : formate les erreurs Mongoose ────────────── */
function validationMessage(err) {
  return Object.values(err.errors).map(e => e.message).join(' | ');
}

/* ═══════════════════════════════════════════════════════════
   GET /api/unites
   Query params : ?actif=true|false  ?type=COOPERATIVE  ?region=xxx
═══════════════════════════════════════════════════════════ */
const getAllUnites = async (req, res) => {
  try {
    const filter = {};
    if (req.query.actif   !== undefined) filter.actif  = req.query.actif === 'true';
    if (req.query.type)                  filter.type   = req.query.type;
    if (req.query.region)                filter.region = new RegExp(req.query.region, 'i');

    const unites = await Unite.find(filter).sort({ nom: 1 });
    res.json(unites);
  } catch (err) {
    console.error('[Unite] getAllUnites :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   GET /api/unites/:id
═══════════════════════════════════════════════════════════ */
const getUniteById = async (req, res) => {
  try {
    const unite = await Unite.findById(req.params.id);
    if (!unite) return res.status(404).json({ message: 'Unité introuvable.' });
    res.json(unite);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   POST /api/unites
   Corps : { code, nom, region, type, contact, actif }
═══════════════════════════════════════════════════════════ */
const createUnite = async (req, res) => {
  try {
    const unite = await Unite.create(req.body);
    res.status(201).json(unite);
  } catch (err) {
    if (err.code === 11000)          return res.status(409).json({ message: 'Un code unité identique existe déjà.' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    console.error('[Unite] createUnite :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   PUT /api/unites/:id
   Permet de mettre à jour nom, region, type, contact, actif.
   Le champ "code" est protégé (ne peut pas être modifié).
═══════════════════════════════════════════════════════════ */
const updateUnite = async (req, res) => {
  try {
    // Empêche la réécriture du code unique
    const { code: _code, ...updates } = req.body;

    const unite = await Unite.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!unite) return res.status(404).json({ message: 'Unité introuvable.' });
    res.json(unite);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    console.error('[Unite] updateUnite :', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllUnites, getUniteById, createUnite, updateUnite };
