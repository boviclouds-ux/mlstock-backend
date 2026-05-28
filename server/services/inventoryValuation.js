/**
 * Moteur de valorisation d'inventaire — CUMP / FIFO / LIFO
 *
 * CUMP : Coût Unitaire Moyen Pondéré
 *   Tous les lots d'un article partagent le même coût unitaire (moyenne pondérée).
 *   Valeur totale = Qté totale × CUMP
 *
 * FIFO : First-In, First-Out (Premier Entré, Premier Sorti)
 *   Les lots les plus anciens sont supposés sortis en premier.
 *   Le stock restant = les lots les plus récents.
 *   → On valorise en commençant par les prix des lots les plus récents.
 *
 * LIFO : Last-In, First-Out (Dernier Entré, Premier Sorti)
 *   Les lots les plus récents sont supposés sortis en premier.
 *   Le stock restant = les lots les plus anciens.
 *   → On valorise en commençant par les prix des lots les plus anciens.
 */

/**
 * calculateInventoryValue
 *
 * @param {Array}  lots    - Tableau de lots pour UN seul article.
 *                           Chaque lot : { _id, qteDisponible, prixAchatUnitaire, createdAt }
 * @param {string} method  - 'CUMP' | 'FIFO' | 'LIFO'
 * @returns {{ totalValue, unitCost, method, breakdown }}
 */
function calculateInventoryValue(lots, method = 'CUMP') {
  const available = (lots ?? []).filter(l => (l.qteDisponible ?? 0) > 0);
  const totalQty  = available.reduce((s, l) => s + l.qteDisponible, 0);

  if (totalQty === 0) {
    return { totalValue: 0, unitCost: 0, method, breakdown: [] };
  }

  /* ── CUMP ─────────────────────────────────────────────── */
  if (method === 'CUMP') {
    const totalValue = available.reduce(
      (s, l) => s + l.qteDisponible * (l.prixAchatUnitaire ?? 0), 0
    );
    const unitCost = totalValue / totalQty;

    return {
      totalValue,
      unitCost,
      method,
      breakdown: available.map(l => ({
        lotId:     l._id,
        numLot:    l.numLot,
        qty:       l.qteDisponible,
        unitCost,
        value:     l.qteDisponible * unitCost,
      })),
    };
  }

  /* ── FIFO / LIFO ──────────────────────────────────────── */
  // FIFO → stock restant = lots les plus récents → trier DESC par date
  // LIFO → stock restant = lots les plus anciens → trier ASC par date
  const sorted = [...available].sort((a, b) =>
    method === 'FIFO'
      ? new Date(b.createdAt) - new Date(a.createdAt)   // DESC — newest first
      : new Date(a.createdAt) - new Date(b.createdAt)   // ASC  — oldest first
  );

  let remaining  = totalQty;
  let totalValue = 0;
  const breakdown = [];

  for (const lot of sorted) {
    if (remaining <= 0) {
      breakdown.push({ lotId: lot._id, numLot: lot.numLot, qty: 0, unitCost: lot.prixAchatUnitaire ?? 0, value: 0 });
      continue;
    }
    const assignedQty = Math.min(lot.qteDisponible, remaining);
    const unitCost    = lot.prixAchatUnitaire ?? 0;
    const value       = assignedQty * unitCost;
    totalValue += value;
    breakdown.push({ lotId: lot._id, numLot: lot.numLot, qty: assignedQty, unitCost, value });
    remaining -= assignedQty;
  }

  return {
    totalValue,
    unitCost: totalValue / totalQty,
    method,
    breakdown,
  };
}

/**
 * calculateAllArticlesValuation
 *
 * @param {Array}  lots    - Tous les lots (tous articles confondus).
 *                           Chaque lot doit avoir : { articleId, qteDisponible, prixAchatUnitaire, createdAt }
 * @param {string} method  - 'CUMP' | 'FIFO' | 'LIFO'
 * @returns {{ grandTotal, byArticle: { [articleId]: { totalValue, unitCost, breakdown } } }}
 */
function calculateAllArticlesValuation(lots, method = 'CUMP') {
  const byArticle = {};

  for (const lot of (lots ?? [])) {
    const key = String(lot.articleId?._id ?? lot.articleId ?? 'unknown');
    if (!byArticle[key]) byArticle[key] = [];
    byArticle[key].push(lot);
  }

  let grandTotal = 0;
  const result   = {};

  for (const [articleId, articleLots] of Object.entries(byArticle)) {
    const valuation = calculateInventoryValue(articleLots, method);
    result[articleId] = valuation;
    grandTotal += valuation.totalValue;
  }

  return { grandTotal, byArticle: result };
}

module.exports = { calculateInventoryValue, calculateAllArticlesValuation };
