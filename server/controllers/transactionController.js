const Transaction = require('../models/Transaction');

/* ─── Transitions de statut autorisées ─────────────────── */
const TRANSITIONS = {
  'Brouillon':   ['En attente', 'Rejeté'],
  'En attente':  ['Validé', 'Expédié', 'Rejeté'],
  'Validé':      ['Expédié'],
  'Expédié':     ['Réceptionné'],
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
    console.log(`[Transaction] Créée : ${populated.reference} (${populated.type})`);
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
═══════════════════════════════════════════════════════════ */
const getAllTransactions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type)          filter.type          = req.query.type;
    if (req.query.statut)        filter.statut        = req.query.statut;
    if (req.query.uniteCible)    filter.uniteCible    = req.query.uniteCible;
    if (req.query.initiatedBy)   filter.initiatedBy   = req.query.initiatedBy;

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
═══════════════════════════════════════════════════════════ */
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate(POPULATE_STD);
    if (!transaction) return res.status(404).json({ message: 'Transaction introuvable.' });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   PUT /api/transactions/:id/statut
   Corps : { statut: 'Expédié' }
   runValidators: true — Mongoose vérifie l'enum du modèle.
═══════════════════════════════════════════════════════════ */
const updateTransactionStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    if (!statut) return res.status(400).json({ message: 'Le champ "statut" est requis.' });

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { statut },
      { new: true, runValidators: true }
    ).populate(POPULATE_STD);

    if (!transaction) return res.status(404).json({ message: 'Transaction introuvable.' });

    console.log(`[Transaction] ${transaction.reference} → "${statut}"`);
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
