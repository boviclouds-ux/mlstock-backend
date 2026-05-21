const Transaction = require('../models/Transaction');
const Dotation    = require('../models/Dotation');
const Cooperative = require('../models/Cooperative');
const Unite       = require('../models/Unite');

/* ─── Transitions de statut autorisées ─────────────────── */
const TRANSITIONS = {
  'Brouillon':   ['En attente', 'Rejeté'],
  'En attente':  ['Validé', 'Rejeté'],
  'Validé':      ['En_transit'],
  'En_transit':  ['Expedie', 'Réceptionné'],
  'Expedie':     ['Réceptionné'],
  'Livre':       [],
  'Expédié':     ['Réceptionné'],   // rétrocompat données existantes
  'Réceptionné': [],
  'Rejeté':      [],
};

/* ─── Populate standard ─────────────────────────────────── */
const POPULATE_STD = [
  { path: 'uniteCible',      select: 'nom code region type' },
  { path: 'fournisseurCible', select: 'nom code pays'       },
  { path: 'initiatedBy',     select: 'prenom nom email role'},
  { path: 'lignes.article',  select: 'code designation uniteMesure categorie' },
];

/* ─── Helper : formate les erreurs Mongoose ────────────── */
function validationMessage(err) {
  return Object.values(err.errors).map(e => e.message).join(' | ');
}

/* ─── Helper sécurité : résout l'ObjectId Unite d'un user UNITE ──
   req.user.entite est un string (nom de l'unité).
   On cherche l'Unite active dont le nom correspond.
   Retourne null si aucune unité trouvée (compte mal configuré).
─────────────────────────────────────────────────────────────── */
async function resolveUniteId(entite) {
  if (!entite) return null;
  const unite = await Unite.findOne(
    { nom: { $regex: new RegExp(`^${entite}$`, 'i') }, actif: true }
  ).select('_id').lean();
  return unite?._id ?? null;
}

/* ═══════════════════════════════════════════════════════════
   POST /api/transactions
   Corps : { type, motif?, uniteCible?, fournisseurCible?, lignes[] }
   L'initiatedBy est injecté depuis req.user (JWT).
═══════════════════════════════════════════════════════════ */
const createTransaction = async (req, res) => {
  try {
    const reference = await Transaction.generateReference();

    // statut vient du body (ex: 'En attente' pour une demande Unité)
    // on ne l'écrase pas — le modèle a 'Brouillon' comme default
    const transaction = await Transaction.create({
      ...req.body,
      reference,
      initiatedBy: req.user._id,
    });

    const populated = await Transaction.findById(transaction._id).populate(POPULATE_STD);
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000)             return res.status(409).json({ message: 'Référence de transaction déjà existante.' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    // Erreurs métier du pre-save hook (ex: motif manquant sur ORDRE_ADMIN)
    res.status(400).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   GET /api/transactions
   Query params : ?type=ORDRE_ADMIN  ?statut=En+attente
                  ?uniteCible=<id>   ?initiatedBy=<id>
                  ?limit=20          ?page=1

   Cloisonnement UNITE :
   Un utilisateur avec le rôle UNITE ne voit que :
   - les transactions dont il est le destinataire (uniteCible)
   - les transactions qu'il a lui-même initiées (initiatedBy)
   Tout filtre client sur uniteCible/initiatedBy est ignoré et
   remplacé par ce filtre strict côté serveur.
═══════════════════════════════════════════════════════════ */
const getAllTransactions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type)  filter.type = req.query.type;
    if (req.query.statut) {
      // Supporte une valeur unique (?statut=Expédié)
      // OU plusieurs valeurs séparées par virgule (?statut=Expédié,Réceptionné)
      const vals = req.query.statut.split(',').map(s => s.trim()).filter(Boolean);
      filter.statut = vals.length === 1 ? vals[0] : { $in: vals };
    }
    if (req.query.uniteCible)  filter.uniteCible  = req.query.uniteCible;
    if (req.query.initiatedBy) filter.initiatedBy = req.query.initiatedBy;

    /* ── Cloisonnement strict pour le rôle UNITE ─────────────
       On écrase tout filtre client sur uniteCible/initiatedBy
       et on force un $or garantissant que l'utilisateur ne voit
       que ses propres transactions.
    ─────────────────────────────────────────────────────────── */
    if (req.user.role === 'UNITE') {
      const uniteId = await resolveUniteId(req.user.entite);
      if (!uniteId) {
        return res.status(403).json({ message: 'Unité non associée à ce compte utilisateur.' });
      }
      delete filter.uniteCible;
      delete filter.initiatedBy;
      filter.$or = [
        { uniteCible:  uniteId          },
        { initiatedBy: req.user._id     },
      ];
    }

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate(POPULATE_STD)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      data:  transactions,
    });
  } catch (err) {
    console.error('[Transaction] getAllTransactions :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   GET /api/transactions/:id

   Cloisonnement UNITE :
   Vérifie que la transaction appartient à l'unité de l'utilisateur
   (est le destinataire ou l'initiateur) avant de la retourner.
═══════════════════════════════════════════════════════════ */
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate(POPULATE_STD);
    if (!transaction) return res.status(404).json({ message: 'Transaction introuvable.' });

    /* ── Guard UNITE ─────────────────────────────────────── */
    if (req.user.role === 'UNITE') {
      const uniteId = await resolveUniteId(req.user.entite);
      if (!uniteId) {
        return res.status(403).json({ message: 'Unité non associée à ce compte utilisateur.' });
      }
      const isDestinataire = transaction.uniteCible?._id?.toString() === uniteId.toString();
      const isInitiateur   = transaction.initiatedBy?._id?.toString() === req.user._id.toString();
      if (!isDestinataire && !isInitiateur) {
        return res.status(403).json({ message: 'Accès refusé : cette transaction ne vous appartient pas.' });
      }
    }

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   PUT /api/transactions/:id/statut
   Corps : { statut: 'Expédié' }
   runValidators: true — Mongoose vérifie l'enum du modèle.

   Règle métier :
   - OPS (Admin, Magasinier) : tout changement de statut autorisé
   - UNITE                   : uniquement 'Réceptionné' (confirmation de réception physique)

   Cloisonnement UNITE :
   Avant toute écriture, vérifie que la transaction ciblée appartient
   bien à l'unité de l'utilisateur connecté (uniteCible = son unité).
   Retourne 403 si ce n'est pas le cas.
═══════════════════════════════════════════════════════════ */
const updateTransactionStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    if (!statut) return res.status(400).json({ message: 'Le champ "statut" est requis.' });

    /* ── Restriction métier + Guard sécurité UNITE ───────── */
    if (req.user?.role === 'UNITE') {
      // 1. Seul 'Réceptionné' est autorisé pour ce rôle
      if (statut !== 'Réceptionné') {
        return res.status(403).json({
          message: 'En tant que Responsable Unité, vous ne pouvez positionner que le statut "Réceptionné".',
        });
      }
      // 2. La transaction doit appartenir à l'unité de l'utilisateur
      const uniteId = await resolveUniteId(req.user.entite);
      if (!uniteId) {
        return res.status(403).json({ message: 'Unité non associée à ce compte utilisateur.' });
      }
      const existing = await Transaction.findById(req.params.id).select('uniteCible').lean();
      if (!existing) return res.status(404).json({ message: 'Transaction introuvable.' });
      if (existing.uniteCible?.toString() !== uniteId.toString()) {
        return res.status(403).json({ message: 'Accès refusé : cette transaction ne vous appartient pas.' });
      }
    }

    /* ── Seuls les Admins peuvent passer au statut "Validé" ─
       Ce statut ne peut être atteint que via la validation OTP Admin.
       Un Magasinier ne peut pas l'écrire directement.
    ─────────────────────────────────────────────────────────── */
    const ADMIN_ONLY = ['ADMIN_FEDERAL', 'ADMIN'];
    if (statut === 'Validé' && !ADMIN_ONLY.includes(req.user?.role)) {
      return res.status(403).json({
        message: 'Seul un Administrateur peut valider une expédition (statut "Validé"). Étape de validation OTP requise.',
      });
    }

    /* ── Contrôle de la transition autorisée ────────────────
       Le graphe TRANSITIONS est défini en tête de fichier.
       Tout saut d'étape (ex : Brouillon → Validé) est rejeté.
    ─────────────────────────────────────────────────────────── */
    const current = await Transaction.findById(req.params.id).select('statut').lean();
    if (!current) return res.status(404).json({ message: 'Transaction introuvable.' });

    const allowedNext = TRANSITIONS[current.statut] ?? [];
    if (!allowedNext.includes(statut)) {
      return res.status(422).json({
        message: `Transition interdite : "${current.statut}" → "${statut}". Transitions autorisées depuis ce statut : ${allowedNext.join(', ') || 'aucune'}.`,
      });
    }

    const updateData = { statut };
    if (statut === 'En attente' && Array.isArray(req.body.repartGenetique) && req.body.repartGenetique.length > 0) {
      updateData.repartGenetique = req.body.repartGenetique;
    }

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate(POPULATE_STD);

    if (!transaction) return res.status(404).json({ message: 'Transaction introuvable.' });

    /* ── Mise à jour des quotas lors de la réception d'un Ordre Admin ── */
    if (statut === 'Réceptionné' && transaction.type === 'ORDRE_ADMIN' && transaction.uniteCible) {
      try {
        const coop = await Cooperative.findOne({ nom: transaction.uniteCible.nom });
        if (coop) {
          await Promise.all(transaction.lignes.map(async ligne => {
            if (!ligne.article?._id) return;
            const dotation = await Dotation.findOne({
              cooperativeId: coop._id,
              articleId:     ligne.article._id,
              locked:        false,
            }).sort({ createdAt: -1 });
            if (!dotation) return;
            const newConsomme = dotation.consomme + ligne.quantite;
            const pct         = dotation.alloue > 0 ? (newConsomme / dotation.alloue) * 100 : 0;
            const newStatut   = pct >= 90 ? 'critique' : pct >= 75 ? 'alerte' : 'normal';
            await Dotation.findByIdAndUpdate(dotation._id, {
              $set: { consomme: newConsomme, statut: newStatut },
            });
          }));
        }
      } catch (quotaErr) {
        console.error('[Transaction] Quota update error:', quotaErr.message);
      }
    }

    res.json(transaction);
  } catch (err) {
    console.error('[Transaction] updateTransactionStatut :', err.message);
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    res.status(400).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   PUT /api/transactions/:id/conformite
   Met à jour le statutConformite de chaque ligne.
   Corps : { lignes: [{ _id: "...", statutConformite: "Conforme" }] }
   Accès : OPS_ROLES uniquement (Admin + Magasinier) — pas de UNITE.
═══════════════════════════════════════════════════════════ */
const updateConformiteTransaction = async (req, res) => {
  try {
    const { lignes } = req.body;
    if (!Array.isArray(lignes) || lignes.length === 0) {
      return res.status(400).json({ message: 'Le tableau "lignes" est requis.' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction introuvable.' });

    lignes.forEach(({ _id, statutConformite }) => {
      const ligne = transaction.lignes.id(_id);
      if (ligne && statutConformite) ligne.statutConformite = statutConformite;
    });

    await transaction.save();

    const updated = await Transaction.findById(transaction._id).populate(POPULATE_STD);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatut,
  updateConformiteTransaction,
};
