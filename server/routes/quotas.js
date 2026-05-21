const express     = require('express');
const router      = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Dotation     = require('../models/Dotation');
const Campagne     = require('../models/Campagne');
const Cooperative  = require('../models/Cooperative');
const Article      = require('../models/Article');
const Transaction  = require('../models/Transaction');
const Unite        = require('../models/Unite');

const ADMIN_ROLES   = ['ADMIN_FEDERAL', 'ADMIN'];
const ALLOWED_ROLES = [...ADMIN_ROLES, 'MAGASINIER'];

/* Mappe categorieId frontend → champs Article + type Campagne */
const CATEGORIE_META = {
  semences:     { label:'Semence',     uniteMesure:'Dose',  typeCampagne:'semence'  },
  consommables: { label:'Consommable', uniteMesure:'L',     typeCampagne:'azote'    },
  materiel:     { label:'Matériel',    uniteMesure:'Unité', typeCampagne:'materiel' },
};

/* Routing catégorie Article → onglet frontend */
function getTab(categorie) {
  if (!categorie) return 'consommables';
  const c = categorie.toLowerCase().trim();
  if (c.includes('semence') || c.includes('dose') || c.includes('génétique') || c.includes('genetique'))
    return 'semences';
  if (c.includes('materiel') || c.includes('matériel') || c.includes('équip') || c.includes('equip') ||
      c.includes('cuve') || c.includes('pistolet') || c.includes('microscope') || c.includes('scanner'))
    return 'materiel';
  return 'consommables';
}

/* Génère un code court unique suffixé par timestamp base-36 */
function uniqCode(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

/* ═══════════════════════════════════════════════════════════
   GET /api/quotas/data
   Répond TOUJOURS status 200 + { semences, consommables, materiel }
   Chaque ligne inclut le champ `periode` (depuis Campagne.periode)
   pour que le frontend puisse filtrer par période.

   Cloisonnement UNITE :
   Un utilisateur de rôle UNITE ne reçoit que les dotations
   associées à sa propre coopérative (identifiée par user.entite).
═══════════════════════════════════════════════════════════ */
router.get('/data', protect, authorize(...ALLOWED_ROLES, 'UNITE'), async (req, res) => {
  const result = { semences: [], consommables: [], materiel: [] };

  try {
    /* ── Filtre MongoDB : UNITE → ses dotations uniquement ── */
    const dbFilter = {};
    if (req.user.role === 'UNITE') {
      const coop = await Cooperative.findOne({ nom: req.user.entite }).lean();
      if (!coop) return res.status(200).json(result); // aucune coop trouvée → tableau vide
      dbFilter.cooperativeId = coop._id;
    }

    const dotations = await Dotation.find(dbFilter)
      .populate('cooperativeId', 'nom region')
      .populate('articleId',     'designation categorie')
      .populate('campagneId',    'periode')
      .lean();

    dotations.forEach(d => {
      const tab = getTab(d.articleId?.categorie);
      if (!result[tab]) return;
      result[tab].push({
        id:          d._id,
        cooperative: d.cooperativeId?.nom         ?? 'Coopérative inconnue',
        region:      d.cooperativeId?.region       ?? '',
        article:     d.articleId?.designation      ?? 'Article inconnu',
        dotation:    d.alloue   ?? 0,
        consomme:    d.consomme ?? 0,
        statut:      d.statut   ?? 'normal',
        periode:     d.campagneId?.periode         ?? null,
      });
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('[GET /api/quotas/data]', err);
    return res.status(200).json(result);
  }
});

/* ═══════════════════════════════════════════════════════════
   POST /api/quotas
   Crée une Campagne + les Dotations associées dans MongoDB.

   Corps attendu :
   {
     categorieId : "semences" | "consommables" | "materiel"
     article     : "Holstein – BENNER JESUALDO"   (designation)
     volumeTotal : 1000
     periode     : "Juin 2026"
     lignes      : [{ cooperative, region, alloue }, ...]
   }
═══════════════════════════════════════════════════════════ */
router.post('/', protect, authorize(...ADMIN_ROLES), async (req, res) => {
  const { categorieId, article, volumeTotal, periode, lignes } = req.body;

  /* ── Validation minimale ─────────────────────────────── */
  if (!categorieId || !article || !volumeTotal || !periode || !Array.isArray(lignes) || lignes.length === 0) {
    return res.status(400).json({ message: 'Champs obligatoires manquants (categorieId, article, volumeTotal, periode, lignes).' });
  }

  const meta = CATEGORIE_META[categorieId];
  if (!meta) {
    return res.status(400).json({ message: `categorieId invalide : ${categorieId}` });
  }

  try {
    /* 1. Find-or-create Article ───────────────────────── */
    let articleDoc = await Article.findOne({ designation: article });
    if (!articleDoc) {
      try {
        articleDoc = await Article.create({
          code:        uniqCode(meta.label.slice(0, 3).toUpperCase()),
          designation: article,
          categorie:   meta.label,
          uniteMesure: meta.uniteMesure,
        });
      } catch (e) {
        // Race condition — essai de re-lecture
        articleDoc = await Article.findOne({ designation: article });
        if (!articleDoc) throw e;
      }
    }

    /* 2. Créer la Campagne ─────────────────────────────── */
    const campagne = await Campagne.create({
      nom:         `${article} — ${periode}`,
      periode,
      type:        meta.typeCampagne,
      volumeTotal: Number(volumeTotal),
      statut:      'active',
      articleId:   articleDoc._id,
      createdBy:   req.user._id,
    });

    /* 3. Find-or-create Cooperatives + créer Dotations ── */
    const dotationsCreees = [];

    for (const ligne of lignes) {
      if (!ligne.cooperative) continue;

      /* Find-or-create Cooperative par nom */
      let coop = await Cooperative.findOne({ nom: ligne.cooperative });
      if (!coop) {
        try {
          coop = await Cooperative.create({
            nom:    ligne.cooperative,
            code:   uniqCode('COOP'),
            region: ligne.region ?? 'Inconnue',
          });
        } catch (e) {
          coop = await Cooperative.findOne({ nom: ligne.cooperative });
          if (!coop) throw e;
        }
      }

      /* Upsert Dotation — évite les doublons si relance */
      const dotation = await Dotation.findOneAndUpdate(
        { cooperativeId: coop._id, campagneId: campagne._id, articleId: articleDoc._id },
        {
          $set: {
            alloue:   Number(ligne.alloue) || 0,
            consomme: 0,
            statut:   'normal',
            locked:   false,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      dotationsCreees.push(dotation._id);
    }

    /* 4. Créer les Ordres d'Expédition (ORDRE_ADMIN) pour le Magasinier ─
       Un ordre par coopérative, avec la répartition génétique pré-calculée.
       Uniquement pour les campagnes de type semence.
    ─────────────────────────────────────────────────────────────────────── */
    const ordresCreees = [];
    if (meta.typeCampagne === 'semence') {
      for (const ligne of lignes) {
        if (!ligne.alloue || ligne.alloue <= 0) continue;

        /* Recherche de l'Unite correspondant à la coopérative (correspondance nom) */
        const escapedNom = ligne.cooperative.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const unite = await Unite.findOne({
          nom:   { $regex: new RegExp(escapedNom, 'i') },
          actif: true,
        });

        if (!unite) {
          console.warn(`[Quotas] Unite introuvable pour "${ligne.cooperative}" — ordre non créé`);
          continue;
        }

        try {
          const reference = await Transaction.generateReference();
          const tx = await Transaction.create({
            reference,
            type:           'ORDRE_ADMIN',
            statut:         'Brouillon',
            motif:          `Subvention — ${campagne.nom} · ${ligne.alloue} doses`,
            uniteCible:     unite._id,
            initiatedBy:    req.user._id,
            lignes: [{
              article:  articleDoc._id,
              quantite: Number(ligne.alloue),
            }],
            repartGenetique: Array.isArray(ligne.repartGenetique)
              ? ligne.repartGenetique.map(g => ({
                  taureau: g.taureau ?? '',
                  nni:     g.nni     ?? '',
                  couleur: g.couleur ?? '',
                  qte:     Number(g.qte) || 0,
                }))
              : [],
          });
          ordresCreees.push(tx.reference);
        } catch (txErr) {
          console.warn(`[Quotas] Ordre non créé pour "${ligne.cooperative}" :`, txErr.message);
        }
      }
    }

    return res.status(201).json({
      message:         `Campagne "${campagne.nom}" créée avec ${dotationsCreees.length} dotation(s) et ${ordresCreees.length} ordre(s) d'expédition.`,
      campagneId:      campagne._id,
      periode:         campagne.periode,
      dotationsCreees: dotationsCreees.length,
      ordresCreees:    ordresCreees.length,
      references:      ordresCreees,
    });

  } catch (err) {
    console.error('[POST /api/quotas]', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la création de la campagne.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   PATCH /api/quotas/reinitialiser
   Remet à zéro consomme + statut sur toutes les Dotations
   dont la campagne est encore active.
═══════════════════════════════════════════════════════════ */
router.patch('/reinitialiser', protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    const result = await Dotation.deleteMany({});

    return res.status(200).json({
      message: `Réinitialisation effectuée : ${result.deletedCount} dotation(s) supprimée(s). Le tableau est vierge.`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error('[PATCH /api/quotas/reinitialiser]', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   PATCH /api/quotas/cloturer
   Passe toutes les campagnes actives en statut 'cloturee'
   et verrouille leurs dotations.
═══════════════════════════════════════════════════════════ */
router.patch('/cloturer', protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    const campagnesResult = await Campagne.updateMany(
      { statut: { $nin: ['cloturee', 'archivee'] } },
      { $set: { statut: 'cloturee' } }
    );

    const dotationsResult = await Dotation.updateMany(
      { locked: false },
      { $set: { locked: true } }
    );

    return res.status(200).json({
      message: `Clôture effectuée : ${campagnesResult.modifiedCount} campagne(s) clôturée(s), ${dotationsResult.modifiedCount} dotation(s) verrouillée(s).`,
      campagnesClot:    campagnesResult.modifiedCount,
      dotationsLocked:  dotationsResult.modifiedCount,
    });
  } catch (err) {
    console.error('[PATCH /api/quotas/cloturer]', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la clôture.' });
  }
});

module.exports = router;
