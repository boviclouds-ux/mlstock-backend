const mongoose    = require('mongoose');
const Transaction = require('../models/Transaction');
const Lot         = require('../models/Lot');
const Article     = require('../models/Article');
const Dotation    = require('../models/Dotation');
const Cooperative = require('../models/Cooperative');
const Unite       = require('../models/Unite');

/* ─── Graphe de transitions autorisées (workflow V2 linéaire) ──
   Chaque clé = statut courant ; valeur = statuts suivants légaux.
   Tout saut d'étape est rejeté avec HTTP 422.
────────────────────────────────────────────────────────── */
const TRANSITIONS = {
  'Brouillon':             ['Demandée', 'Rejeté'],
  'Demandée':              ['Validée_BE', 'Rejeté'],
  'Validée_BE':            ['Partiellement_Livrée', 'Totalement_Livrée'],
  'Partiellement_Livrée':  ['Partiellement_Livrée', 'Totalement_Livrée'],
  'Totalement_Livrée':     ['Réceptionnée_Cloturée'],
  'Réceptionnée_Cloturée': [],
  'Rejeté':                [],
};

/* ─── Populate standard ─────────────────────────────────── */
const POPULATE_STD = [
  { path: 'uniteCible',      select: 'nom code region type'           },
  { path: 'fournisseurCible', select: 'nom code pays'                 },
  { path: 'initiatedBy',     select: 'prenom nom email permissions'   },
  { path: 'lignes.article',  select: 'code designation uniteMesure categorie' },
];

/* ─── Helper : formate les erreurs Mongoose ────────────── */
function validationMessage(err) {
  return Object.values(err.errors).map(e => e.message).join(' | ');
}

/* ─── Helper : identifie un bénéficiaire (demandeur cloîsonné) ──
   Un bénéficiaire = canDemand SANS isAdmin NI canDispatch.
   Ces utilisateurs ne voient que leurs propres transactions.
─────────────────────────────────────────────────────────────── */
function isBeneficiaire(user) {
  const p = user?.permissions ?? {};
  return Boolean(p.canDemand && !p.isAdmin && !p.canDispatch);
}

/* ─── Helper sécurité : résout l'ObjectId Unite d'un bénéficiaire ──
   user.entite est un string (nom de l'unité).
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
    res.status(400).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   GET /api/transactions
   Query params : ?type=ORDRE_ADMIN  ?statut=En+attente
                  ?uniteCible=<id>   ?initiatedBy=<id>
                  ?limit=20          ?page=1

   Cloisonnement bénéficiaire :
   Un utilisateur canDemand (sans isAdmin ni canDispatch) ne voit que :
   - les transactions dont il est le destinataire (uniteCible)
   - les transactions qu'il a lui-même initiées (initiatedBy)
   Tout filtre client sur uniteCible/initiatedBy est ignoré et
   remplacé par ce filtre strict côté serveur.
═══════════════════════════════════════════════════════════ */
const getAllTransactions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type)   filter.type  = req.query.type;
    if (req.query.statut) {
      const vals = req.query.statut.split(',').map(s => s.trim()).filter(Boolean);
      filter.statut = vals.length === 1 ? vals[0] : { $in: vals };
    }
    if (req.query.uniteCible)  filter.uniteCible  = req.query.uniteCible;
    if (req.query.initiatedBy) filter.initiatedBy = req.query.initiatedBy;

    /* ── Cloisonnement strict pour les bénéficiaires ─────── */
    if (isBeneficiaire(req.user)) {
      const uniteId = await resolveUniteId(req.user.entite);
      if (!uniteId) {
        return res.status(403).json({ message: 'Unité non associée à ce compte utilisateur.' });
      }
      delete filter.uniteCible;
      delete filter.initiatedBy;
      filter.$or = [
        { uniteCible:  uniteId      },
        { initiatedBy: req.user._id },
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

   Cloisonnement bénéficiaire :
   Vérifie que la transaction appartient à l'unité de l'utilisateur
   avant de la retourner.
═══════════════════════════════════════════════════════════ */
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate(POPULATE_STD);
    if (!transaction) return res.status(404).json({ message: 'Transaction introuvable.' });

    /* ── Guard bénéficiaire ──────────────────────────────── */
    if (isBeneficiaire(req.user)) {
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
   Corps : { statut: 'Réceptionné' }

   Règles métier :
   - isAdmin              : tous les changements de statut
   - canDispatch          : tous les changements hors 'Validé'
   - canDemand (bénéf.)   : uniquement 'Réceptionné' + vérification d'appartenance
   - 'Validé' est exclusif à isAdmin (nécessite validation OTP Admin)

   Graphe de transitions autorisées : cf. constante TRANSITIONS.
═══════════════════════════════════════════════════════════ */
const updateTransactionStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    if (!statut) return res.status(400).json({ message: 'Le champ "statut" est requis.' });

    const p = req.user?.permissions ?? {};

    /* ── Restriction bénéficiaire ────────────────────────────
       La clôture finale (Réceptionnée_Cloturée) doit obligatoirement
       passer par PUT /cloture-beneficiaire qui déclenche la facturation.
       Ce chemin générique est réservé aux admins / magasiniers.
    ─────────────────────────────────────────────────────────── */
    if (isBeneficiaire(req.user)) {
      return res.status(403).json({
        message: 'Les bénéficiaires doivent utiliser PUT /api/transactions/:id/cloture-beneficiaire pour clôturer une transaction.',
      });
    }

    /* ── Seuls les Admins peuvent poser "Validée_BE" ────────
       Ce statut génère le Bon d'Enlèvement. Il nécessite une
       autorisation explicite admin (OTP ou validation directe).
    ─────────────────────────────────────────────────────────── */
    if (statut === 'Validée_BE' && !p.isAdmin) {
      return res.status(403).json({
        message: 'Seul un Administrateur peut émettre un Bon d\'Enlèvement (statut "Validée_BE").',
      });
    }

    /* ── Contrôle de la transition autorisée ────────────── */
    const current = await Transaction.findById(req.params.id).select('statut').lean();
    if (!current) return res.status(404).json({ message: 'Transaction introuvable.' });

    const allowedNext = TRANSITIONS[current.statut] ?? [];
    if (!allowedNext.includes(statut)) {
      return res.status(422).json({
        message: `Transition interdite : "${current.statut}" → "${statut}". Autorisées : ${allowedNext.join(', ') || 'aucune'}.`,
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

    /* ── Mise à jour des quotas lors de la clôture d'un Ordre Admin ── */
    if (statut === 'Réceptionnée_Cloturée' && transaction.type === 'ORDRE_ADMIN' && transaction.uniteCible) {
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
   Accès : canDispatch + isAdmin uniquement.
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

/* ─── Helper : génère une référence BL unique ───────────── */
function generateBLReference() {
  const d        = new Date();
  const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const suffix   = String(Math.floor(1000 + Math.random() * 9000));
  return `BL-${yyyymmdd}-${suffix}`;
}

/* ═══════════════════════════════════════════════════════════
   POST /api/transactions/:id/livraisons
   Corps : tableau de lignes ou objet unique
     [{ nni?, taureau?, conteneurSemence, quantiteExpediee }]

   Moteur de livraison physique (Bon de Livraison).
   Opération atomique via session Mongoose :
     A — Décrémente ficheTechnique.$.qte dans le Lot
     B — Incrémente repartGenetique[x].quantiteLivree
     C — Push dans historiqueLivraisons
   Puis recalcule le reliquat global et met à jour le statut.

   Pré-requis MongoDB : replica set (MongoDB Atlas, ou rs local)
═══════════════════════════════════════════════════════════ */
const creerLivraison = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    /* ── 0. Chargement et verrou de la transaction ────────── */
    const tx = await Transaction.findById(req.params.id).session(session);
    if (!tx) {
      throw Object.assign(new Error('Transaction introuvable.'), { status: 404 });
    }

    if (!['Validée_BE', 'Partiellement_Livrée'].includes(tx.statut)) {
      throw Object.assign(
        new Error(`Livraison impossible : statut actuel "${tx.statut}". Requis : "Validée_BE" ou "Partiellement_Livrée".`),
        { status: 422 }
      );
    }

    /* ── 1. Normalisation du payload ─────────────────────── */
    const lignes = Array.isArray(req.body) ? req.body : [req.body];

    if (!lignes.length || !lignes[0]) {
      throw Object.assign(
        new Error('Le payload doit contenir au moins une ligne { nni|taureau, conteneurSemence, quantiteExpediee }.'),
        { status: 400 }
      );
    }

    /* ── 2. Référence BL unique pour ce groupe de livraisons ─ */
    const referenceBL = generateBLReference();

    /* ── 3. Boucle de traitement par ligne ───────────────── */
    for (const item of lignes) {
      const nni              = (item.nni         ?? '').trim();
      const taureau          = (item.taureau      ?? '').trim();
      const conteneurSemence = (item.conteneurSemence ?? '').trim();
      const quantiteExpediee = Number(item.quantiteExpediee);

      // Validation de base
      if (!nni && !taureau) {
        throw Object.assign(
          new Error('Chaque ligne doit contenir "nni" ou "taureau".'),
          { status: 400 }
        );
      }
      if (!quantiteExpediee || quantiteExpediee <= 0) {
        throw Object.assign(
          new Error(`"quantiteExpediee" doit être > 0 (reçu : ${item.quantiteExpediee}).`),
          { status: 400 }
        );
      }

      /* ── 3a. Ligne génétique correspondante dans repartGenetique ─ */
      const gEntry = tx.repartGenetique.find(g =>
        nni ? g.nni === nni : (taureau && g.taureau === taureau)
      );

      if (!gEntry) {
        throw Object.assign(
          new Error(`Ligne génétique introuvable pour "${nni || taureau}" dans cette transaction.`),
          { status: 422 }
        );
      }

      /* ── 3b. Vérification du reliquat autorisé ────────────
         Le reliquat = ce que l'admin a autorisé MOINS ce déjà livré.
         La quantité expédiée ne peut pas dépasser ce reliquat.
      ──────────────────────────────────────────────────────── */
      const reliquatLigne = (gEntry.quantiteAutorisee ?? 0) - (gEntry.quantiteLivree ?? 0);

      if (quantiteExpediee > reliquatLigne) {
        throw Object.assign(
          new Error(
            `Quantité expédiée (${quantiteExpediee}) dépasse le reliquat autorisé` +
            ` (${reliquatLigne}) pour "${gEntry.nni || gEntry.taureau}".`
          ),
          { status: 422 }
        );
      }

      /* ── Action A : Décrémentation atomique du stock Lot ───
         La condition qte: { $gte } dans $elemMatch garantit que
         le stock ne passe jamais en négatif, même sous concurrence.
         Si le document ne correspond pas (stock insuffisant ou lot
         introuvable), findOneAndUpdate renvoie null → erreur.
      ──────────────────────────────────────────────────────── */
      const lotMatcher = nni
        ? { nni, conteneurSemence, qte: { $gte: quantiteExpediee } }
        : { taureau, conteneurSemence, qte: { $gte: quantiteExpediee } };

      const lotFilter = nni
        ? { 'elem.nni': nni, 'elem.conteneurSemence': conteneurSemence }
        : { 'elem.taureau': taureau, 'elem.conteneurSemence': conteneurSemence };

      const lotUpdated = await Lot.findOneAndUpdate(
        {
          statut:         { $in: ['disponible', 'reserve'] },
          ficheTechnique: { $elemMatch: lotMatcher },
        },
        { $inc: { 'ficheTechnique.$[elem].qte': -quantiteExpediee } },
        { arrayFilters: [lotFilter], new: true, session }
      );

      if (!lotUpdated) {
        throw Object.assign(
          new Error(
            `Stock physique insuffisant ou lot introuvable` +
            ` pour NNI "${nni || taureau}" / conteneur "${conteneurSemence}".`
          ),
          { status: 422 }
        );
      }

      /* Recalcule qteDisponible et marque épuisé si vide */
      const newQteDisponible = lotUpdated.ficheTechnique.reduce(
        (s, f) => s + Math.max(0, f.qte ?? 0), 0
      );
      await Lot.findByIdAndUpdate(
        lotUpdated._id,
        {
          $set: {
            qteDisponible: newQteDisponible,
            ...(newQteDisponible === 0 ? { statut: 'epuise' } : {}),
          },
        },
        { session }
      );

      /* ── Action B : Incrémentation de quantiteLivree ───────
         Mutation directe du sous-document Mongoose (en mémoire).
         tx.save({ session }) committera cet état en fin de boucle.
      ──────────────────────────────────────────────────────── */
      gEntry.quantiteLivree = (gEntry.quantiteLivree ?? 0) + quantiteExpediee;

      /* ── Action C : Entrée dans historiqueLivraisons ──────── */
      tx.historiqueLivraisons.push({
        referenceBL,
        dateExpedition:   new Date(),
        magasinierId:     req.user._id,
        conteneurSemence,
        quantiteExpediee,
      });
    }

    /* ── 4. Recalcul du reliquat global et mise à jour statut ─ */
    const reliquatGlobal = tx.repartGenetique.reduce(
      (s, g) => s + Math.max(0, (g.quantiteAutorisee ?? 0) - (g.quantiteLivree ?? 0)),
      0
    );

    tx.statut = reliquatGlobal === 0 ? 'Totalement_Livrée' : 'Partiellement_Livrée';

    /* markModified : Mongoose ne détecte pas les mutations profondes
       sur les tableaux de sous-documents automatiquement. */
    tx.markModified('repartGenetique');
    tx.markModified('historiqueLivraisons');
    await tx.save({ session });

    /* ── 5. Commit atomique ───────────────────────────────── */
    await session.commitTransaction();

    const populated = await Transaction.findById(tx._id).populate(POPULATE_STD);

    const suffix = reliquatGlobal > 0
      ? ` Reliquat restant : ${reliquatGlobal} dose(s).`
      : ' Livraison totale — en attente de signature bénéficiaire.';

    return res.status(201).json({
      message:     `BL ${referenceBL} enregistré. Statut → ${tx.statut}.${suffix}`,
      referenceBL,
      statut:      tx.statut,
      reliquat:    reliquatGlobal,
      transaction: populated,
    });

  } catch (err) {
    await session.abortTransaction();
    console.error('[Transaction] creerLivraison :', err.message);

    const httpStatus = err.status ?? (
      err.message.includes('introuvable') ? 422 :
      err.message.includes('insuffisant') ? 422 : 500
    );
    return res.status(httpStatus).json({ message: err.message });

  } finally {
    session.endSession();
  }
};

/* ─── Helper : génère une référence de facture ──────────── */
function generateFactureReference() {
  const d        = new Date();
  const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const suffix   = String(Math.floor(1000 + Math.random() * 9000));
  return `FAC-${yyyymmdd}-${suffix}`;
}

/* ═══════════════════════════════════════════════════════════
   PUT /api/transactions/:id/cloture-beneficiaire
   Clôture finale par le bénéficiaire. Requiert statut
   "Totalement_Livrée". Déclenche la facturation automatique
   si des lignes Sexées sont présentes (Mission 8).

   Logique facturation :
   - Pour chaque ligne repartGenetique avec typeProduit === 'Sexée'
     et articleId → montantTotal += quantiteLivree × prixVenteUnitaire
   - Si montantTotal > 0 → facturation.statut = 'En_Attente'
                           + referenceFacture générée
   - Sinon              → facturation.statut = 'Non_Applicable'

   Statut final : Réceptionnée_Cloturée (dans tous les cas).
   Accès : requireDemand (bénéficiaire clôture sa propre transaction).
═══════════════════════════════════════════════════════════ */
const clotureBeneficiaire = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction introuvable.' });

    /* ── Guard appartenance bénéficiaire ─────────────────────
       Un bénéficiaire ne peut clôturer que sa propre transaction.
       Les admins/magasiniers passent sans vérification d'appartenance.
    ─────────────────────────────────────────────────────────── */
    if (isBeneficiaire(req.user)) {
      const uniteId = await resolveUniteId(req.user.entite);
      if (!uniteId) {
        return res.status(403).json({ message: 'Unité non associée à ce compte utilisateur.' });
      }
      if (tx.uniteCible?.toString() !== uniteId.toString()) {
        return res.status(403).json({ message: 'Accès refusé : cette transaction ne vous appartient pas.' });
      }
    }

    /* ── Guard statut : seule Totalement_Livrée est clôturable ─ */
    if (tx.statut !== 'Totalement_Livrée') {
      return res.status(422).json({
        message: `Clôture impossible : statut actuel "${tx.statut}". La transaction doit être "Totalement_Livrée".`,
      });
    }

    /* ── Calcul du montant facturable (lignes Sexées uniquement) ─
       On collecte les articleId uniques pour éviter N requêtes.
    ─────────────────────────────────────────────────────────── */
    const sexeeLines = tx.repartGenetique.filter(
      g => g.typeProduit === 'Sexée' && g.articleId && (g.quantiteLivree ?? 0) > 0
    );

    let montantTotal = 0;

    if (sexeeLines.length > 0) {
      // Déduplique les articleId pour un seul batch DB
      const articleIds = [...new Set(sexeeLines.map(g => g.articleId.toString()))];

      const articles = await Article.find(
        { _id: { $in: articleIds } },
        { prixVenteUnitaire: 1 }
      ).lean();

      const prixMap = {};
      articles.forEach(a => { prixMap[a._id.toString()] = a.prixVenteUnitaire ?? 0; });

      for (const g of sexeeLines) {
        const prix = prixMap[g.articleId.toString()] ?? 0;
        montantTotal += (g.quantiteLivree ?? 0) * prix;
      }
    }

    /* ── Mise à jour atomique ────────────────────────────── */
    const facturationUpdate = montantTotal > 0
      ? {
          'facturation.statut':           'En_Attente',
          'facturation.montantTotal':     Math.round(montantTotal * 100) / 100,
          'facturation.referenceFacture': generateFactureReference(),
        }
      : {
          'facturation.statut':           'Non_Applicable',
          'facturation.montantTotal':     0,
          'facturation.referenceFacture': '',
        };

    const updated = await Transaction.findByIdAndUpdate(
      tx._id,
      { $set: { statut: 'Réceptionnée_Cloturée', ...facturationUpdate } },
      { new: true, runValidators: true }
    ).populate(POPULATE_STD);

    return res.status(200).json({
      message:     `Transaction clôturée. Facturation : ${updated.facturation.statut}.`,
      facturation: updated.facturation,
      transaction: updated,
    });

  } catch (err) {
    console.error('[Transaction] clotureBeneficiaire :', err.message);
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatut,
  updateConformiteTransaction,
  creerLivraison,
  clotureBeneficiaire,
};
