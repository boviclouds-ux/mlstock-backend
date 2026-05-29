const express       = require('express');
const router        = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const Configuration = require('../models/Configuration');
const Lot           = require('../models/Lot');
const { calculateAllArticlesValuation } = require('../services/inventoryValuation');

/* ════════════════════════════════════════════════════════════
   GET /api/configuration
   Retourne le document de configuration singleton.
════════════════════════════════════════════════════════════ */
router.get('/', protect, async (req, res) => {
  try {
    const config = await Configuration.getSingleton();
    res.json(config);
  } catch (err) {
    console.error('[Configuration] GET :', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ════════════════════════════════════════════════════════════
   PUT /api/configuration
   Met à jour un ou plusieurs champs de la configuration.
   Body : { methodeValorisation?, campagneActive?, ... }
════════════════════════════════════════════════════════════ */
router.put('/', protect, requireAdmin, async (req, res) => {
  try {
    const updated = await Configuration.updateConfig(req.body);
    res.json(updated);
  } catch (err) {
    console.error('[Configuration] PUT :', err.message);
    res.status(400).json({ message: err.message });
  }
});

/* ════════════════════════════════════════════════════════════
   GET /api/configuration/valorisation
   Retourne la valorisation complète de l'inventaire selon
   la méthode active (CUMP / FIFO / LIFO).
   Query : ?method=FIFO  (optionnel — surcharge la config)
════════════════════════════════════════════════════════════ */
router.get('/valorisation', protect, requireAdmin, async (req, res) => {
  try {
    const config = await Configuration.getSingleton();
    const method = req.query.method ?? config.methodeValorisation ?? 'CUMP';

    const lots = await Lot.find({ statut: { $in: ['disponible', 'reserve'] } })
      .populate('articleId', 'designation categorie uniteMesure')
      .lean();

    const { grandTotal, byArticle } = calculateAllArticlesValuation(lots, method);

    res.json({
      method,
      grandTotal,
      byArticle,
      lotsCount: lots.length,
    });
  } catch (err) {
    console.error('[Configuration] GET /valorisation :', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
