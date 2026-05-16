const Approvisionnement = require('../models/Approvisionnement');
const Lot               = require('../models/Lot');

function validationMessage(err) {
  return Object.values(err.errors).map(e => e.message).join(' | ');
}

/* Auto-génère un numéro de lot LOT-YYYY-XXXX */
async function generateNumLot() {
  const year  = new Date().getFullYear();
  const count = await Lot.countDocuments({ numLot: { $regex: `^LOT-${year}-` } });
  return `LOT-${year}-${String(count + 1).padStart(4, '0')}`;
}

/* ═══════════════════════════════════════════════════════════
   GET /api/approvisionnements
   Query : ?statut=prevu            (valeur unique)
           ?statut=prevu,en_transit (valeurs multiples séparées par virgule)
           ?limit=100
═══════════════════════════════════════════════════════════ */
const getAllApprovisionnements = async (req, res) => {
  try {
    const filter = {};
    if (req.query.statut) {
      const vals = req.query.statut.split(',').map(s => s.trim()).filter(Boolean);
      filter.statut = vals.length === 1 ? vals[0] : { $in: vals };
    }

    const limit = Math.min(200, parseInt(req.query.limit) || 100);

    const list = await Approvisionnement.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json(list);
  } catch (err) {
    console.error('[Appro] getAll :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   POST /api/approvisionnements
═══════════════════════════════════════════════════════════ */
const createApprovisionnement = async (req, res) => {
  try {
    const numeroCommande = await Approvisionnement.generateNumero();
    const appro = await Approvisionnement.create({ ...req.body, numeroCommande });
    res.status(201).json(appro);
  } catch (err) {
    if (err.code === 11000)             return res.status(409).json({ message: 'Numéro de commande déjà existant.' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    console.error('[Appro] create :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   PUT /api/approvisionnements/:id
   Utilisé pour : mise à jour du statut et de la conformité.
═══════════════════════════════════════════════════════════ */
const updateApprovisionnement = async (req, res) => {
  try {
    // Protège numeroCommande et lignes contre une réécriture accidentelle
    const { numeroCommande: _n, lignes: _l, ...updates } = req.body;

    const appro = await Approvisionnement.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!appro) return res.status(404).json({ message: 'Commande introuvable.' });
    res.json(appro);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    console.error('[Appro] update :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   PUT /api/approvisionnements/:id/reception
   Body : {
     decision     : 'conforme' | 'partiel' | 'retour'   (défaut: 'conforme')
     note         : string                               (optionnel)
     quantiteRecue: number                               (requis si decision='partiel')
   }

   Décision conforme  → Lots créés avec quantité commandée     · statut = 'conforme'
   Décision partiel   → Lots créés avec quantiteRecue (ratio)  · statut = 'partiel'
   Décision retour    → Aucun lot créé (retour fournisseur)    · statut = 'retour_fournisseur'
═══════════════════════════════════════════════════════════ */
const receptionApprovisionnement = async (req, res) => {
  try {
    const appro = await Approvisionnement.findById(req.params.id);
    if (!appro) return res.status(404).json({ message: 'Commande introuvable.' });

    const STATUTS_FINAUX = ['conforme', 'partiel', 'retour_fournisseur'];
    if (STATUTS_FINAUX.includes(appro.statut)) {
      return res.status(400).json({ message: 'Cette commande a déjà été traitée.' });
    }

    const decision     = req.body?.decision ?? 'conforme';
    const note         = (req.body?.note    ?? '').trim();
    const quantiteRecue = Number(req.body?.quantiteRecue) || null;

    // Quantité totale commandée (somme de toutes les lignes)
    const totalQteAttendue = appro.lignes.reduce((s, l) => s + l.qte, 0);

    /* ── 1. Mise à jour du statut ────────────────────────── */
    if (decision === 'retour') {
      appro.statut    = 'retour_fournisseur';
      appro.conformite = { resultat: 'retour', note, quantiteAttendue: totalQteAttendue, quantiteRecue: 0 };
      await appro.save();
      return res.json({
        approvisionnement: appro,
        lotsCreated: [],
        message: 'Retour fournisseur enregistré. Aucun lot créé.',
      });
    }

    if (decision === 'partiel') {
      if (!quantiteRecue || quantiteRecue <= 0) {
        return res.status(400).json({ message: 'La quantité réellement reçue doit être > 0.' });
      }
      if (quantiteRecue > totalQteAttendue) {
        return res.status(400).json({ message: 'La quantité reçue ne peut pas dépasser la quantité commandée.' });
      }
      appro.statut    = 'partiel';
      appro.conformite = { resultat: 'partiel', note, quantiteAttendue: totalQteAttendue, quantiteRecue };
    } else {
      // conforme
      appro.statut    = 'conforme';
      appro.conformite = { resultat: 'conforme', note, quantiteAttendue: totalQteAttendue, quantiteRecue: totalQteAttendue };
    }
    await appro.save();

    /* ── 2. Création des Lots ────────────────────────────── */
    // Ratio de réception (1.0 pour conforme, <1.0 pour partiel)
    const ratio = decision === 'partiel' ? (quantiteRecue / totalQteAttendue) : 1;

    const lotsCreated   = [];
    const lignesIgnorees = [];

    for (const ligne of appro.lignes) {
      if (!ligne.articleId) { lignesIgnorees.push(ligne.label); continue; }

      const qteACreer = decision === 'partiel'
        ? Math.round(ligne.qte * ratio)
        : ligne.qte;

      if (qteACreer <= 0) { lignesIgnorees.push(ligne.label); continue; }

      try {
        const numLot = await generateNumLot();
        const lot = await Lot.create({
          numLot,
          type:          ligne.type ?? 'materiel',
          articleId:     ligne.articleId,
          fournisseurId: appro.fournisseurId ?? null,
          qteDisponible: qteACreer,
          statut:        'disponible',
        });
        lotsCreated.push(lot.numLot);
      } catch (lotErr) {
        console.warn(`[Appro] Lot non créé pour "${ligne.label}" :`, lotErr.message);
        lignesIgnorees.push(ligne.label);
      }
    }

    const msg = decision === 'partiel'
      ? `Litige enregistré · ${lotsCreated.length} lot(s) créé(s) (${quantiteRecue}/${totalQteAttendue} reçu${quantiteRecue > 1 ? 's' : ''}).`
      : `Réception conforme · ${lotsCreated.length} lot(s) créé(s).`;

    res.json({ approvisionnement: appro, lotsCreated, lignesIgnorees, message: msg });
  } catch (err) {
    console.error('[Appro] reception :', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllApprovisionnements,
  createApprovisionnement,
  updateApprovisionnement,
  receptionApprovisionnement,
};
