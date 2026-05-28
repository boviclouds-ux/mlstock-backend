const Approvisionnement = require('../models/Approvisionnement');
const Lot               = require('../models/Lot');
const Cuve              = require('../models/Cuve');

const TYPES_SEMENCE = ['Conventionnelle', 'Sexée'];
const TYPES_VALIDES = [...TYPES_SEMENCE, 'Azote'];

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
   Mise à jour du statut et de la conformité.
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
     decision          : 'conforme' | 'partiel' | 'retour'  (défaut: 'conforme')
     note              : string                              (optionnel)
     quantiteRecue     : number                              (requis si decision='partiel')
     ficheTechnique    : [{ taureau, nni, couleur, quantite, cuveRef }]
     conteneurs        : [{ ref, capacite, niveauActuel, _id? }]
   }

   Décision conforme  → Lots créés avec quantité commandée    · statut = 'conforme'
   Décision partiel   → Lots créés avec quantiteRecue (ratio) · statut = 'partiel'
   Décision retour    → Aucun lot créé (retour fournisseur)   · statut = 'retour_fournisseur'

   Chaque Lot créé porte obligatoirement :
     typeProduit, uniteMesure, prixAchatUnitaire (depuis la ligne de commande)
     fournisseurId (depuis l'approvisionnement)
═══════════════════════════════════════════════════════════ */
const receptionApprovisionnement = async (req, res) => {
  try {
    const appro = await Approvisionnement.findById(req.params.id);
    if (!appro) return res.status(404).json({ message: 'Commande introuvable.' });

    const STATUTS_FINAUX = ['conforme', 'partiel', 'retour_fournisseur'];
    if (STATUTS_FINAUX.includes(appro.statut)) {
      return res.status(400).json({ message: 'Cette commande a déjà été traitée.' });
    }

    const decision      = req.body?.decision ?? 'conforme';
    const note          = (req.body?.note ?? '').trim();
    const quantiteRecue = Number(req.body?.quantiteRecue) || null;

    /* Fiche technique envoyée par la modale de réception */
    const ficheTechBody = Array.isArray(req.body?.ficheTechnique) ? req.body.ficheTechnique : [];

    const totalQteAttendue = appro.lignes.reduce((s, l) => s + l.qte, 0);

    /* ── 1. Mise à jour du statut ────────────────────────── */
    if (decision === 'retour') {
      appro.statut     = 'retour_fournisseur';
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
      appro.statut     = 'partiel';
      appro.conformite = { resultat: 'partiel', note, quantiteAttendue: totalQteAttendue, quantiteRecue };
    } else {
      appro.statut     = 'conforme';
      appro.conformite = { resultat: 'conforme', note, quantiteAttendue: totalQteAttendue, quantiteRecue: totalQteAttendue };
    }
    await appro.save();

    /* ── 2. Upsert des Conteneurs Semences de l'arrivage ────
       Le frontend envoie conteneurs: [{ ref, capacite, niveauActuel, _id? }]
       On mappe ref → nom (champ requis du modèle Cuve).
       Si _id fourni → update ; sinon → findOneAndUpdate upsert par nom.
    ─────────────────────────────────────────────────────────── */
    const conteneursPayload  = Array.isArray(req.body?.conteneurs)         ? req.body.conteneurs
                             : Array.isArray(req.body?.conteneursSemences) ? req.body.conteneursSemences
                             : Array.isArray(req.body?.cuves)              ? req.body.cuves  // rétrocompat
                             : [];
    const conteneurRefToId   = {}; // nom → ObjectId, pour lier les lots
    const conteneursUpserted = [];

    for (const c of conteneursPayload) {
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
          conteneursUpserted.push(doc.nom);
          conteneurRefToId[nom] = doc._id;
        }
      } catch (conteneurErr) {
        console.warn(`[Appro] Conteneur "${nom}" non enregistré :`, conteneurErr.message);
      }
    }

    /* ── 3. Création des Lots ────────────────────────────────
       Chaque Lot reçoit les champs financiers et de nomenclature
       obligatoires définis dans le schéma V2.
    ─────────────────────────────────────────────────────────── */
    const ratio = decision === 'partiel' ? (quantiteRecue / totalQteAttendue) : 1;

    const lotsCreated    = [];
    const lignesIgnorees = [];

    for (const ligne of appro.lignes) {
      if (!ligne.articleId) {
        lignesIgnorees.push(ligne.label);
        continue;
      }

      // Ignore les lignes sans typeProduit valide (ex : anciennes données 'materiel')
      if (!TYPES_VALIDES.includes(ligne.typeProduit)) {
        console.warn(`[Appro] Ligne "${ligne.label}" ignorée — typeProduit invalide : ${ligne.typeProduit}`);
        lignesIgnorees.push(ligne.label);
        continue;
      }

      const qteACreer = decision === 'partiel'
        ? Math.round(ligne.qte * ratio)
        : ligne.qte;

      if (qteACreer <= 0) { lignesIgnorees.push(ligne.label); continue; }

      /* Fiche technique : priorité req.body (réception) > ligne DB (commande admin) */
      const ficheTech = ficheTechBody.length > 0
        ? ficheTechBody
        : (Array.isArray(ligne.ficheTechnique) ? ligne.ficheTechnique : []);

      /* Liaison conteneur semence : cherche via cuveRef de la fiche, sinon premier conteneur reçu */
      let cuveId = null;
      if (TYPES_VALIDES.includes(ligne.typeProduit)) {
        const ref = ficheTech.length > 0 ? (ficheTech[0].cuveRef ?? '') : '';
        cuveId = (ref && conteneurRefToId[ref]) ? conteneurRefToId[ref]
               : (Object.values(conteneurRefToId)[0] ?? null);
      }

      try {
        const numLot = await generateNumLot();
        const peremption = req.body?.datePeremption ? new Date(req.body.datePeremption) : null;

        const lot = await Lot.create({
          numLot,
          typeProduit:       ligne.typeProduit,
          uniteMesure:       ligne.uniteMesure,
          prixAchatUnitaire: ligne.prixAchatUnitaire,
          articleId:         ligne.articleId,
          fournisseurId:     appro.fournisseurId,
          qteDisponible:     qteACreer,
          statut:            'disponible',
          ...(cuveId     ? { cuveId }     : {}),
          ...(peremption ? { peremption } : {}),
          /* ficheTechnique — uniquement pour les semences génétiques */
          ...(TYPES_SEMENCE.includes(ligne.typeProduit) && ficheTech.length > 0 ? {
            ficheTechnique: ficheTech.map(ft => ({
              race:             ft.race     ?? '',
              taureau:          ft.taureau  ?? '',
              nni:              ft.nni      ?? '',
              couleur:          ft.couleur  ?? '',
              qte:              Number(ft.quantite) || 0,
              conteneurSemence: ft.cuveRef  ?? '',
            })),
          } : {}),
        });
        console.log(`[Appro] Lot créé : ${lot.numLot} | typeProduit : ${lot.typeProduit} | ficheTechnique : ${lot.ficheTechnique?.length ?? 0} ligne(s)`);
        lotsCreated.push(lot.numLot);
      } catch (lotErr) {
        console.warn(`[Appro] Lot non créé pour "${ligne.label}" :`, lotErr.message);
        lignesIgnorees.push(ligne.label);
      }
    }

    const conteneursMsg = conteneursUpserted.length > 0
      ? ` · ${conteneursUpserted.length} conteneur(s) semences enregistré(s) : ${conteneursUpserted.join(', ')}`
      : '';

    const msg = decision === 'partiel'
      ? `Litige enregistré · ${lotsCreated.length} lot(s) créé(s) (${quantiteRecue}/${totalQteAttendue} reçu${quantiteRecue > 1 ? 's' : ''})${conteneursMsg}.`
      : `Réception conforme · ${lotsCreated.length} lot(s) créé(s)${conteneursMsg}.`;

    res.json({ approvisionnement: appro, lotsCreated, lignesIgnorees, conteneursUpserted, message: msg });
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
