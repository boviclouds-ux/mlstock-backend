const Lot = require('../models/Lot');

/* ═══════════════════════════════════════════════════════════
   GET /api/lots
   Query params : ?type=semence  ?statut=disponible
═══════════════════════════════════════════════════════════ */
const getAllLots = async (req, res) => {
  try {
    const filter = {};
    if (req.query.statut)    filter.statut    = req.query.statut;
    if (req.query.articleId) filter.articleId = req.query.articleId;
    if (req.query.typeProduit) {
      const vals = req.query.typeProduit.split(',').map(s => s.trim()).filter(Boolean);
      filter.typeProduit = vals.length === 1 ? vals[0] : { $in: vals };
    }

    const lots = await Lot.find(filter)
      .populate('articleId', 'code designation categorie uniteMesure')
      .populate('cuveId', 'nom reference')
      .sort({ createdAt: -1 });

    res.status(200).json(lots);
  } catch (err) {
    console.error('[Lot] getAllLots :', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllLots };
