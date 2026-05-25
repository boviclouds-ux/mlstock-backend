const express     = require('express');
const router      = express.Router();
const { protect, requireAdmin, requireDispatch } = require('../middleware/authMiddleware');
const Otp         = require('../models/Otp');
const Transaction = require('../models/Transaction');
const Lot         = require('../models/Lot');

const POPULATE_STD = [
  { path: 'uniteCible',     select: 'nom code region type'         },
  { path: 'initiatedBy',   select: 'prenom nom email permissions'  },
  { path: 'lignes.article', select: 'code designation uniteMesure categorie' },
];

/* ═══════════════════════════════════════════════════════════
   POST /api/otp/generate
   Corps : { dureeSecondes: 900 }
   Génère un PIN à 6 chiffres (TTL auto), invalide les anciens.
   Réservé aux Administrateurs.
═══════════════════════════════════════════════════════════ */
router.post('/otp/generate', protect, requireAdmin, async (req, res) => {
  try {
    const dureeSecondes = Math.max(60, Math.min(86400, Number(req.body?.dureeSecondes) || 900));
    const code      = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + dureeSecondes * 1000);

    await Otp.updateMany(
      { generatedBy: req.user._id, actif: true },
      { $set: { actif: false } }
    );

    const otp = await Otp.create({ code, expiresAt, actif: true, generatedBy: req.user._id });

    return res.status(201).json({ code: otp.code, expiresAt: otp.expiresAt, dureeSecondes });
  } catch (err) {
    console.error('[POST /api/otp/generate]', err.message);
    return res.status(500).json({ message: 'Erreur lors de la génération du PIN.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   PUT /api/ordres/:id/valider-admin
   Validation directe Admin → 'En attente' → 'Validé'.
═══════════════════════════════════════════════════════════ */
router.put('/ordres/:id/valider-admin', protect, requireAdmin, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id).select('statut');
    if (!tx) return res.status(404).json({ message: 'Ordre introuvable.' });

    if (tx.statut !== 'Demandée') {
      return res.status(422).json({
        message: `Validation impossible : statut actuel "${tx.statut}". Seuls les ordres "Demandée" peuvent être validés ici.`,
      });
    }

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: { statut: 'Validé' } },
      { new: true, runValidators: true }
    ).populate(POPULATE_STD);

    return res.status(200).json(updated);
  } catch (err) {
    console.error('[PUT /api/ordres/:id/valider-admin]', err.message);
    return res.status(500).json({ message: 'Erreur serveur lors de la validation admin.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   PUT /api/ordres/:id/valider-otp
   Corps : { pin: "482917" }
   Vérifie le PIN, passe l'ordre 'En attente' → 'Validé'.
   Le PIN est invalidé après usage (usage unique).

   Accessible à tout utilisateur authentifié porteur d'un PIN valide :
   le PIN lui-même constitue l'autorisation (signature virtuelle).
   Cela permet au magasinier ET au bénéficiaire de l'utiliser.
═══════════════════════════════════════════════════════════ */
router.put('/ordres/:id/valider-otp', protect, async (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ message: 'Le champ "pin" est requis.' });

  try {
    const otp = await Otp.findOne({
      code:      String(pin).trim(),
      actif:     true,
      expiresAt: { $gt: new Date() },
    });

    if (!otp) {
      return res.status(401).json({
        message: "PIN invalide ou expiré. Demandez un nouveau PIN à l'Administrateur.",
      });
    }

    const tx = await Transaction.findById(req.params.id).select('statut');
    if (!tx) return res.status(404).json({ message: 'Ordre introuvable.' });

    if (tx.statut !== 'Demandée') {
      return res.status(422).json({
        message: `Validation OTP impossible : statut actuel "${tx.statut}". L'ordre doit être "Demandée".`,
      });
    }

    await Otp.findByIdAndUpdate(otp._id, { $set: { actif: false } });

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: { statut: 'Validé' } },
      { new: true, runValidators: true }
    ).populate(POPULATE_STD);

    return res.status(200).json(updated);
  } catch (err) {
    console.error('[PUT /api/ordres/:id/valider-otp]', err.message);
    return res.status(500).json({ message: 'Erreur serveur lors de la validation OTP.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   PUT /api/ordres/:id/finaliser-expedition
   Corps : { societe: "Trans-Atlas", matricule: "12345-A-6" }
   Enregistre les infos transporteur, génère la référence BL,
   passe l'ordre 'Validé' → 'En_transit' et décrémente les stocks.
   Accessible au Magasinier (requireDispatch).
═══════════════════════════════════════════════════════════ */
router.put('/ordres/:id/finaliser-expedition', protect, requireDispatch, async (req, res) => {
  const { societe, matricule } = req.body ?? {};
  if (!societe?.trim()) {
    return res.status(400).json({ message: 'Le nom de la société de transport est requis.' });
  }

  try {
    const tx = await Transaction.findById(req.params.id).select('statut repartGenetique');
    if (!tx) return res.status(404).json({ message: 'Ordre introuvable.' });

    if (tx.statut !== 'Validée_BE') {
      return res.status(422).json({
        message: `Finalisation impossible : statut actuel "${tx.statut}". L'ordre doit être "Validée_BE" (Bon d'Enlèvement émis).`,
      });
    }

    const blReference = `BL-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          statut:                   'En_transit',
          blReference,
          'transporteur.societe':   societe.trim(),
          'transporteur.matricule': (matricule ?? '').trim(),
        },
      },
      { new: true, runValidators: true }
    ).populate(POPULATE_STD);

    /* ── Décrémentation du stock semences ────────────────────
       La guard statut !== 'Validé' garantit une seule exécution.
       $elemMatch : nni ET conteneurSemence doivent appartenir
       au même sous-document ficheTechnique.
    ─────────────────────────────────────────────────────────── */
    if (tx.repartGenetique?.length > 0) {
      for (const item of tx.repartGenetique) {
        const lotUpdated = await Lot.findOneAndUpdate(
          {
            ficheTechnique: {
              $elemMatch: {
                nni:              item.nni,
                conteneurSemence: item.conteneurSemence,
              },
            },
          },
          { $inc: { 'ficheTechnique.$.qte': -item.qte } },
          { new: true }
        );

        if (!lotUpdated) {
          console.error('[Expédition] Lot introuvable pour décrémentation :', item);
          continue;
        }

        const newTotal = lotUpdated.ficheTechnique.reduce((s, f) => s + (f.qte || 0), 0);
        await Lot.findByIdAndUpdate(lotUpdated._id, { $set: { qteDisponible: newTotal } });
      }
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error('[PUT /api/ordres/:id/finaliser-expedition]', err.message);
    return res.status(500).json({ message: "Erreur serveur lors de la finalisation de l'expédition." });
  }
});

/* ═══════════════════════════════════════════════════════════
   PUT /api/ordres/:id/reception-regionale
   Corps : { conformite (Boolean), commentaire (String) }
   Valide la réception régionale. L'ordre doit être 'En_transit'.
   Passe définitivement le statut à 'Expedie'.
   Réservé aux Administrateurs.
═══════════════════════════════════════════════════════════ */
router.put('/ordres/:id/reception-regionale', protect, requireAdmin, async (req, res) => {
  const { conformite, commentaire } = req.body ?? {};

  if (typeof conformite !== 'boolean') {
    return res.status(400).json({ message: 'Le champ "conformite" (boolean) est requis.' });
  }

  try {
    const tx = await Transaction.findById(req.params.id).select('statut');
    if (!tx) return res.status(404).json({ message: 'Ordre introuvable.' });

    if (!['Partiellement_Livrée', 'Totalement_Livrée'].includes(tx.statut)) {
      return res.status(422).json({
        message: `Réception impossible : statut actuel "${tx.statut}". L'ordre doit être "Partiellement_Livrée" ou "Totalement_Livrée".`,
      });
    }

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          statut:                              'Expedie',
          'receptionRegionale.conformite':     conformite,
          'receptionRegionale.commentaire':    (commentaire ?? '').trim(),
          'receptionRegionale.validePar':      req.user._id,
          'receptionRegionale.dateValidation': new Date(),
        },
      },
      { new: true, runValidators: true }
    ).populate(POPULATE_STD);

    return res.status(200).json(updated);
  } catch (err) {
    console.error('[PUT /api/ordres/:id/reception-regionale]', err.message);
    return res.status(500).json({ message: 'Erreur serveur lors de la réception régionale.' });
  }
});

module.exports = router;
