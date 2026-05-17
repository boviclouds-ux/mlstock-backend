const express     = require('express');
const router      = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Lot         = require('../models/Lot');
const Dotation    = require('../models/Dotation');
const Transaction = require('../models/Transaction');

const ADMIN_ROLES = ['ADMIN_FEDERAL', 'ADMIN'];

/* Convertit un timestamp en texte relatif (ex: "Il y a 42 min") */
function formatDelta(date) {
  const diffMs  = Date.now() - new Date(date).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1)  return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24)   return `Il y a ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `Il y a ${diffD}j`;
}

/* Mappe le type Transaction → type activité frontend */
const TX_TO_TYPE = {
  RECEPTION:   'RECEPTION',
  EXPEDITION:  'EXPEDITION',
  ORDRE_ADMIN: 'ORDRE',
};

const TX_TO_ACTION = {
  RECEPTION:   'Réception validée',
  EXPEDITION:  'Expédition envoyée',
  ORDRE_ADMIN: 'Ordre prioritaire émis',
};

/* ═══════════════════════════════════════════════════════════
   GET /api/dashboard/stats
   Agrège : stocks lots, consommation régionale (Dotations),
   activité récente (Transactions), alertes péremption (Lots)
═══════════════════════════════════════════════════════════ */
router.get('/stats', protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    /* ── Stocks centraux ──────────────────────────────────── */
    const [semAgg, azoteAgg, dotAgg] = await Promise.all([
      Lot.aggregate([
        { $match: { type: 'semence', statut: { $in: ['disponible', 'reserve'] } } },
        { $group: { _id: null, total: { $sum: '$qteDisponible' } } },
      ]),
      Lot.aggregate([
        { $match: { type: 'azote', statut: { $in: ['disponible', 'reserve'] } } },
        { $group: { _id: null, total: { $sum: '$qteDisponible' } } },
      ]),
      Dotation.aggregate([
        { $group: { _id: null, totalAlloue: { $sum: '$alloue' }, totalConso: { $sum: '$consomme' } } },
      ]),
    ]);

    const totalAlloue = dotAgg[0]?.totalAlloue ?? 0;
    const totalConso  = dotAgg[0]?.totalConso  ?? 0;
    const quotaPct    = totalAlloue > 0 ? Math.round((totalConso / totalAlloue) * 100) : null;

    // null = aucun lot en DB (≠ 0 qui signifie stock réellement épuisé)
    const stocks = {
      semences: semAgg.length   > 0 ? semAgg[0].total   : null,
      azote:    azoteAgg.length > 0 ? azoteAgg[0].total : null,
      quotaPct,
    };

    /* ── Régions (depuis Dotations + Cooperatives) ────────── */
    const dotations = await Dotation.find()
      .populate('cooperativeId', 'nom region')
      .lean();

    const regionMap = {};
    dotations.forEach(d => {
      const nomRegion = d.cooperativeId?.region ?? 'Inconnue';
      if (!regionMap[nomRegion]) {
        regionMap[nomRegion] = { nom: nomRegion, dosesConsomme: 0, alloue: 0 };
      }
      regionMap[nomRegion].dosesConsomme += d.consomme  || 0;
      regionMap[nomRegion].alloue        += d.alloue    || 0;
    });

    const regions = Object.values(regionMap).map(r => {
      const pct    = r.alloue > 0 ? Math.round((r.dosesConsomme / r.alloue) * 100) : 0;
      const statut = pct >= 90 ? 'critique' : pct >= 75 ? 'alerte' : 'normal';
      return { nom: r.nom, doses: r.dosesConsomme, pct, statut };
    });

    /* ── Activité logistique (10 dernières transactions) ──── */
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('uniteCible',      'nom region')
      .populate('fournisseurCible', 'nom')
      .lean();

    const activite = transactions.map(t => {
      const dest   = t.uniteCible?.nom || t.fournisseurCible?.nom || '';
      const detail = dest
        ? `${t.reference} → ${dest}`
        : t.reference;
      return {
        id:     t._id,
        type:   TX_TO_TYPE[t.type]   ?? 'PIN',
        delta:  formatDelta(t.createdAt),
        action: TX_TO_ACTION[t.type] ?? t.type,
        detail,
        statut: t.statut ?? null,
        reference: t.reference,
      };
    });

    /* ── Alertes péremption (lots expirés dans < 60 jours) ── */
    const now          = new Date();
    const horizon60j   = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const lotsAlerte = await Lot.find({
      statut:    { $in: ['disponible', 'reserve'] },
      peremption: { $gte: now, $lte: horizon60j },
    })
      .select('numLot peremption')
      .sort({ peremption: 1 })
      .limit(5)
      .lean();

    const lots = lotsAlerte.map(l => {
      const jours = Math.ceil((new Date(l.peremption) - now) / 86400000);
      return `${l.numLot} · ${jours}j restants`;
    });

    res.json({ stocks, regions, activite, alertes: { lots } });
  } catch (err) {
    console.error('[GET /api/dashboard/stats]', err);
    res.status(500).json({ message: 'Erreur serveur lors du chargement du tableau de bord.' });
  }
});

module.exports = router;
