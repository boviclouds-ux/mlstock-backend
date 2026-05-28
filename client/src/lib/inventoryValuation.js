/**
 * Moteur de valorisation d'inventaire côté client — CUMP / FIFO / LIFO
 *
 * Miroir JS du service backend (server/services/inventoryValuation.js).
 * Utilisé dans MagasinierCentral pour calculer la colonne « Valeur Totale »
 * sans aller-retour serveur supplémentaire (les lots sont déjà chargés).
 *
 * CUMP : Coût unitaire moyen pondéré — même prix pour tous les lots d'un article.
 * FIFO : Valorise le stock restant aux prix des lots les plus récents
 *        (les plus anciens sont supposés déjà sortis).
 * LIFO : Valorise le stock restant aux prix des lots les plus anciens
 *        (les plus récents sont supposés déjà sortis).
 */

/**
 * Valorise un groupe de lots correspondant à un seul article.
 *
 * @param {Array}  lots    - Lots pour UN article :
 *                           [{ id, qte, prixAchatUnitaire, createdAt }]
 * @param {string} method  - 'CUMP' | 'FIFO' | 'LIFO'
 * @returns {{ totalValue, unitCost, lotValues: { [lotId]: { unitCost, value } } }}
 */
export function calculateInventoryValue(lots, method = 'CUMP') {
  const available = (lots ?? []).filter(l => (l.qte ?? 0) > 0);
  const totalQty  = available.reduce((s, l) => s + l.qte, 0);

  if (totalQty === 0) return { totalValue: 0, unitCost: 0, lotValues: {} };

  /* ── CUMP ───────────────────────────────────────────── */
  if (method === 'CUMP') {
    const totalValue = available.reduce(
      (s, l) => s + l.qte * (l.prixAchatUnitaire ?? 0), 0
    );
    const unitCost = totalValue / totalQty;
    const lotValues = {};
    for (const l of available) {
      lotValues[l.id] = { unitCost, value: l.qte * unitCost };
    }
    return { totalValue, unitCost, lotValues };
  }

  /* ── FIFO / LIFO ────────────────────────────────────── */
  // FIFO → stock restant = lots les plus récents → trier DESC (newest first)
  // LIFO → stock restant = lots les plus anciens → trier ASC  (oldest first)
  const sorted = [...available].sort((a, b) =>
    method === 'FIFO'
      ? new Date(b.createdAt) - new Date(a.createdAt)
      : new Date(a.createdAt) - new Date(b.createdAt)
  );

  let remaining  = totalQty;
  let totalValue = 0;
  const lotValues = {};

  for (const l of sorted) {
    const assignedQty = Math.min(l.qte, remaining);
    const unitCost    = l.prixAchatUnitaire ?? 0;
    const value       = assignedQty * unitCost;
    totalValue += value;
    // lotValues stores the EFFECTIVE value for this lot under the chosen method
    lotValues[l.id] = { unitCost, value };
    remaining -= assignedQty;
  }

  return { totalValue, unitCost: totalValue / totalQty, lotValues };
}

/**
 * Valorise tous les lots (tous articles confondus) groupés par article.
 *
 * @param {Array}  lots    - Tous les lots :
 *                           [{ id, article, qte, prixAchatUnitaire, createdAt }]
 * @param {string} method  - 'CUMP' | 'FIFO' | 'LIFO'
 * @returns {{ grandTotal, allLotValues: { [lotId]: { unitCost, value } } }}
 */
export function calculateAllValuations(lots, method = 'CUMP') {
  // Regrouper par article (nom — clé suffisante pour l'affichage)
  const byArticle = {};
  for (const lot of (lots ?? [])) {
    const key = lot.article ?? 'unknown';
    if (!byArticle[key]) byArticle[key] = [];
    byArticle[key].push(lot);
  }

  let grandTotal    = 0;
  const allLotValues = {};

  for (const articleLots of Object.values(byArticle)) {
    const { totalValue, lotValues } = calculateInventoryValue(articleLots, method);
    grandTotal += totalValue;
    Object.assign(allLotValues, lotValues);
  }

  return { grandTotal, allLotValues };
}

/** Labels affichables par méthode */
export const METHODE_LABELS = {
  CUMP: 'CUMP — Coût Moyen Pondéré',
  FIFO: 'FIFO — Premier Entré, Premier Sorti',
  LIFO: 'LIFO — Dernier Entré, Premier Sorti',
};

export const METHODE_SHORT = {
  CUMP: 'CUMP',
  FIFO: 'FIFO',
  LIFO: 'LIFO',
};

export const METHODE_BADGE = {
  CUMP: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  FIFO: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  LIFO: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
};
