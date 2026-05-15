const Lot = require('../models/Lot');

/* ═══════════════════════════════════════════════════════════
   GET /api/lots
   Query params : ?type=semence  ?statut=disponible
═══════════════════════════════════════════════════════════ */
const getAllLots = async (req, res) => {
  try {
    const filter = {};
    if (req.query.statut) filter.statut = req.query.statut;
    if (req.query.type)   filter.type   = req.query.type;

    const lots = await Lot.find(filter)
      .populate('articleId', 'code designation categorie uniteMesure')
      .sort({ createdAt: -1 });

    res.status(200).json(lots);
  } catch (err) {
    console.error('[Lot] getAllLots :', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllLots };
