const Approvisionnement = require('../models/Approvisionnement');
const Lot               = require('../models/Lot');
const Cuve              = require('../models/Cuve');

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

    console.log('[Appro] BODY REÇU DU FRONTEND:', JSON.stringify(req.body, null, 2));

    const decision     = req.body?.decision ?? 'conforme';
    const note         = (req.body?.note    ?? '').trim();
    const quantiteRecue = Number(req.body?.quantiteRecue) || null;

    /* ficheTechnique envoyée par la modale de réception (niveau req.body) */
    const ficheTechBody = Array.isArray(req.body?.ficheTechnique) ? req.body.ficheTechnique : [];

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

    /* ── 2. Upsert des Cuves de l'arrivage ──────────────────
       Le frontend envoie cuves: [{ ref, capacite, niveauActuel, _id? }]
       On mappe ref → nom (champ requis du modèle Cuve).
       Si _id fourni → update ; sinon → findOneAndUpdate upsert par nom.
    ─────────────────────────────────────────────────────────── */
    const cuvesPayload  = Array.isArray(req.body?.cuves) ? req.body.cuves : [];
    const cuveRefToId   = {}; // nom (ref) → ObjectId, pour lier les lots
    const cuvesUpserted = [];

    for (const c of cuvesPayload) {
      const nom = (c.ref ?? c.nom ?? '').trim();
      if (!nom) continue;

      const cuveData = {
        nom,
        capacite:     Math.max(1, Number(c.capacite)     || 50),
        niveauActuel: Math.max(0, Number(c.niveauActuel) || 0),
      };

      try {
        const doc = c._id
          ? await Cuve.findByIdAndUpdate(c._id, cuveData, { new: true, runValidators: true })
          : await Cuve.findOneAndUpdate(
              { nom },
              { $set: cuveData },
              { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
            );
        if (doc) {
          cuvesUpserted.push(doc.nom);
          cuveRefToId[nom] = doc._id;
        }
      } catch (cuveErr) {
        console.warn(`[Appro] Cuve "${nom}" non enregistrée :`, cuveErr.message);
      }
    }

    /* ── 3. Création des Lots ────────────────────────────── */
    // Ratio de réception (1.0 pour conforme, <1.0 pour partiel)
    const ratio = decision === 'partiel' ? (quantiteRecue / totalQteAttendue) : 1;

    const lotsCreated    = [];
    const lignesIgnorees = [];

    for (const ligne of appro.lignes) {
      if (!ligne.articleId) { lignesIgnorees.push(ligne.label); continue; }

      const qteACreer = decision === 'partiel'
        ? Math.round(ligne.qte * ratio)
        : ligne.qte;

      if (qteACreer <= 0) { lignesIgnorees.push(ligne.label); continue; }

      /* Fiche technique : priorité req.body (réception) > ligne DB (commande admin) */
      const ficheTech = ficheTechBody.length > 0
        ? ficheTechBody
        : (Array.isArray(ligne.ficheTechnique) ? ligne.ficheTechnique : []);

      // Liaison cuve : cherche via cuveRef de la fiche, sinon première cuve reçue
      let cuveId = null;
      if (ligne.type === 'semence' || ligne.type === 'azote') {
        const ref = ficheTech.length > 0 ? (ficheTech[0].cuveRef ?? '') : '';
        cuveId = (ref && cuveRefToId[ref]) ? cuveRefToId[ref]
               : (Object.values(cuveRefToId)[0] ?? null);
      }

      try {
        const numLot = await generateNumLot();
        const lot = await Lot.create({
          numLot,
          type:          ligne.type ?? 'materiel',
          articleId:     ligne.articleId,
          fournisseurId: appro.fournisseurId ?? null,
          qteDisponible: qteACreer,
          statut:        'disponible',
          ...(cuveId ? { cuveId } : {}),
          /* ficheTechnique — champ unifié, mappé depuis le payload frontend */
          ...(ligne.type === 'semence' && ficheTech.length > 0 ? {
            ficheTechnique: ficheTech.map(ft => ({
              taureau: ft.taureau  ?? '',
              nni:     ft.nni      ?? '',
              couleur: ft.couleur  ?? '',
              qte:     Number(ft.quantite) || 0,
              cuve:    ft.cuveRef  ?? '',
            })),
          } : {}),
        });
        console.log(`[Appro] Lot créé : ${lot.numLot} | ficheTechnique : ${lot.ficheTechnique?.length ?? 0} ligne(s)`);
        lotsCreated.push(lot.numLot);
      } catch (lotErr) {
        console.warn(`[Appro] Lot non créé pour "${ligne.label}" :`, lotErr.message);
        lignesIgnorees.push(ligne.label);
      }
    }

    const cuvesMsg = cuvesUpserted.length > 0
      ? ` · ${cuvesUpserted.length} cuve(s) enregistrée(s) : ${cuvesUpserted.join(', ')}`
      : '';

    const msg = decision === 'partiel'
      ? `Litige enregistré · ${lotsCreated.length} lot(s) créé(s) (${quantiteRecue}/${totalQteAttendue} reçu${quantiteRecue > 1 ? 's' : ''})${cuvesMsg}.`
      : `Réception conforme · ${lotsCreated.length} lot(s) créé(s)${cuvesMsg}.`;

    res.json({ approvisionnement: appro, lotsCreated, lignesIgnorees, cuvesUpserted, message: msg });
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
