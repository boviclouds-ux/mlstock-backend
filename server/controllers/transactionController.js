const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const TransactionLot = require('../models/TransactionLot');
const Lot = require('../models/Lot');
const MouvementStock = require('../models/MouvementStock');

/* ─── Génère une référence unique TRX-YYYY-XXXXX ─────── */
async function generateReference() {
  const year = new Date().getFullYear();
  const count = await Transaction.countDocuments();
  return `TRX-${year}-${String(count + 1).padStart(5, '0')}`;
}

/* ─── Transitions de statut autorisées ──────────────── */
const TRANSITIONS = {
  brouillon: ['en_cours', 'annulee'],
  en_cours:  ['validee', 'annulee'],
  validee:   [],
  annulee:   [],
};

/* ─── POST /api/transactions ─────────────────────────── */
const createTransaction = async (req, res) => {
  try {
    const reference = await generateReference();
    const transaction = new Transaction({ ...req.body, reference });
    const saved = await transaction.save();

    console.log(`[Transaction] Créée : ${saved.reference} (${saved.type})`);
    res.status(201).json(saved);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Référence de transaction déjà existante.' });
    }
    res.status(400).json({ message: err.message });
  }
};

/* ─── GET /api/transactions ──────────────────────────── */
const getAllTransactions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type)           filter.type = req.query.type;
    if (req.query.statut)         filter.statut = req.query.statut;
    if (req.query.cooperativeId)  filter.cooperativeId = req.query.cooperativeId;

    const transactions = await Transaction.find(filter)
      .populate('cooperativeId', 'nom code region')
      .populate('initiatedBy', 'nom email role initiales')
      .populate('fournisseurId', 'nom code pays')
      .sort({ createdAt: -1 });

    /* Enrichit chaque transaction avec ses lots & articles associés */
    const ids = transactions.map(t => t._id);
    const transactionLots = await TransactionLot.find({ transactionId: { $in: ids } })
      .populate({ path: 'lotId', select: 'numLot type qteDisponible statut', populate: { path: 'articleId', select: 'code categorie unite' } });

    const lotsMap = {};
    transactionLots.forEach(tl => {
      const tid = tl.transactionId.toString();
      if (!lotsMap[tid]) lotsMap[tid] = [];
      lotsMap[tid].push(tl);
    });

    const result = transactions.map(t => ({
      ...t.toObject(),
      lots: lotsMap[t._id.toString()] || [],
    }));

    res.json(result);
  } catch (err) {
    console.error('[Transaction] getAllTransactions :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─── GET /api/transactions/:id ──────────────────────── */
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('cooperativeId', 'nom code region')
      .populate('initiatedBy', 'nom email role initiales')
      .populate('fournisseurId', 'nom code pays');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction introuvable.' });
    }

    const lots = await TransactionLot.find({ transactionId: transaction._id })
      .populate({ path: 'lotId', populate: [{ path: 'articleId' }, { path: 'fournisseurId', select: 'nom code' }] });

    res.json({ ...transaction.toObject(), lots });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── PATCH /api/transactions/:id/statut ─────────────── */
const updateTransactionStatus = async (req, res) => {
  try {
    const { statut, motifDerogation } = req.body;

    if (!statut) {
      return res.status(400).json({ message: 'Le champ "statut" est requis.' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction introuvable.' });
    }

    const allowed = TRANSITIONS[transaction.statut];
    if (!allowed.includes(statut)) {
      return res.status(422).json({
        message: `Transition invalide : "${transaction.statut}" → "${statut}".`,
        transitions_autorisees: allowed,
      });
    }

    transaction.statut = statut;

    /* Si une dérogation est fournie, l'ajoute à l'historique */
    if (motifDerogation) {
      transaction.derogation.totalDerogations += 1;
      transaction.derogation.historique.push({
        motif: motifDerogation,
        date: new Date(),
        userId: req.body.userId || null,
      });
    }

    const updated = await transaction.save();
    console.log(`[Transaction] Statut mis à jour : ${updated.reference} → ${statut}`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── PATCH /api/transactions/:id/lots ───────────────── */
const addLotsToTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { lots, userId } = req.body;

    if (!lots || !Array.isArray(lots) || lots.length === 0) {
      return res.status(400).json({ message: 'Le tableau "lots" est requis et ne peut pas être vide.' });
    }

    const transaction = await Transaction.findById(req.params.id).session(session);
    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Transaction introuvable.' });
    }

    if (transaction.statut === 'validee' || transaction.statut === 'annulee') {
      await session.abortTransaction();
      return res.status(422).json({ message: `Impossible d'ajouter des lots à une transaction "${transaction.statut}".` });
    }

    const createdLinks = [];
    const mouvements = [];

    for (const { lotId, qteRetire, cuve } of lots) {
      if (!lotId || !qteRetire || qteRetire <= 0) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Entrée invalide pour le lot ${lotId} : qteRetire doit être > 0.` });
      }

      const lot = await Lot.findById(lotId).session(session);
      if (!lot) {
        await session.abortTransaction();
        return res.status(404).json({ message: `Lot introuvable : ${lotId}` });
      }

      if (lot.qteDisponible < qteRetire) {
        await session.abortTransaction();
        return res.status(422).json({
          message: `Stock insuffisant pour le lot ${lot.numLot}. Disponible : ${lot.qteDisponible}, demandé : ${qteRetire}.`,
        });
      }

      /* Crée le lien Transaction ↔ Lot */
      const [link] = await TransactionLot.create([{ transactionId: transaction._id, lotId, qteRetire, cuve }], { session });
      createdLinks.push(link);

      /* Décrémente le stock du lot */
      lot.qteDisponible -= qteRetire;
      if (lot.qteDisponible === 0) lot.statut = 'epuise';
      await lot.save({ session });

      /* Trace le mouvement dans le Grand Livre */
      mouvements.push({
        lotId,
        userId: userId || null,
        typeMouvement: transaction.type === 'reception' ? 'entree' : 'sortie',
        quantite: qteRetire,
        referenceDocument: transaction.reference,
      });
    }

    await MouvementStock.insertMany(mouvements, { session });

    /* Passe la transaction en cours si elle était en brouillon */
    if (transaction.statut === 'brouillon') {
      transaction.statut = 'en_cours';
      await transaction.save({ session });
    }

    await session.commitTransaction();
    console.log(`[Transaction] ${createdLinks.length} lot(s) ajouté(s) à ${transaction.reference}`);

    res.json({
      message: `${createdLinks.length} lot(s) ajouté(s) avec succès.`,
      transaction: transaction.reference,
      statut: transaction.statut,
      lots: createdLinks,
    });
  } catch (err) {
    await session.abortTransaction();
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Un ou plusieurs lots sont déjà liés à cette transaction.' });
    }
    console.error('[Transaction] addLotsToTransaction :', err.message);
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatus,
  addLotsToTransaction,
};
