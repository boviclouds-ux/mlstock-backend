const express     = require('express');
const router      = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Otp         = require('../models/Otp');
const Transaction = require('../models/Transaction');
const Lot         = require('../models/Lot');

const ADMIN_ROLES    = ['ADMIN_FEDERAL', 'ADMIN'];
const MAGASINIER_PLUS = [...ADMIN_ROLES, 'MAGASINIER'];

const POPULATE_STD = [
  { path: 'uniteCible',     select: 'nom code region type' },
  { path: 'initiatedBy',   select: 'prenom nom email role' },
  { path: 'lignes.article', select: 'code designation uniteMesure categorie' },
];

/* ═══════════════════════════════════════════════════════════
   POST /api/otp/generate
   Corps : { dureeSecondes: 900 }
   Génère un PIN à 6 chiffres, le stocke en base (TTL auto),
   retourne { code, expiresAt, dureeSecondes }.
   Invalide les anciens OTP actifs du même admin.
═══════════════════════════════════════════════════════════ */
router.post('/otp/generate', protect, authorize(...ADMIN_ROLES), async (req, res) => {
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
   Validation directe Admin → 'En attente' → 'Expédié'.
   Réservé aux Admins.
═══════════════════════════════════════════════════════════ */
router.put('/ordres/:id/valider-admin', protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id).select('statut');
    if (!tx) return res.status(404).json({ message: 'Ordre introuvable.' });

    if (tx.statut !== 'En attente') {
      return res.status(422).json({
        message: `Validation impossible : statut actuel "${tx.statut}". Seuls les ordres "En attente" peuvent être validés ici.`,
      });
    }

    // Passe à 'Validé' → le magasinier peut ensuite finaliser avec la remise transporteur
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
   Vérifie le PIN (actif + non expiré), puis passe l'ordre
   de 'En attente' à 'Expédié'. Le PIN est invalidé après usage.
   Accessible aux Magasiniers ET Admins.
═══════════════════════════════════════════════════════════ */
router.put('/ordres/:id/valider-otp', protect, authorize(...MAGASINIER_PLUS), async (req, res) => {
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

    if (tx.statut !== 'En attente') {
      return res.status(422).json({
        message: `Validation impossible : statut actuel "${tx.statut}".`,
      });
    }

    /* Invalider le PIN : usage unique */
    await Otp.findByIdAndUpdate(otp._id, { $set: { actif: false } });

    // Passe à 'Validé' → le magasinier finalise ensuite avec la remise transporteur + BL
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
   Dernière étape : enregistre les infos transporteur,
   génère la référence BL et passe l'ordre à 'Expédié'.
   Accessible Magasinier + Admin.
═══════════════════════════════════════════════════════════ */
router.put('/ordres/:id/finaliser-expedition', protect, authorize(...MAGASINIER_PLUS), async (req, res) => {
  const { societe, matricule } = req.body ?? {};
  if (!societe?.trim()) {
    return res.status(400).json({ message: 'Le nom de la société de transport est requis.' });
  }

  try {
    const tx = await Transaction.findById(req.params.id).select('statut repartGenetique');
    if (!tx) return res.status(404).json({ message: 'Ordre introuvable.' });

    if (tx.statut !== 'Validé') {
      return res.status(422).json({
        message: `Finalisation impossible : statut actuel "${tx.statut}". L'ordre doit être "Validé" (autorisation Admin/OTP requise).`,
      });
    }

    const blReference = `BL-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          statut:                  'En_transit',
          blReference,
          'transporteur.societe':   societe.trim(),
          'transporteur.matricule': (matricule ?? '').trim(),
        },
      },
      { new: true, runValidators: true }
    ).populate(POPULATE_STD);

    // Décrémentation du stock semences — une seule exécution garantie par la guard statut !== 'Validé'
    if (tx.repartGenetique?.length > 0) {
      for (const item of tx.repartGenetique) {
        // $elemMatch garantit que nni ET cuve appartiennent au même sous-document
        const lotUpdated = await Lot.findOneAndUpdate(
          { ficheTechnique: { $elemMatch: { nni: item.nni, cuve: item.cuve } } },
          { $inc: { 'ficheTechnique.$.qte': -item.qte } },
          { new: true }
        );

        if (!lotUpdated) {
          console.error('[Expédition] Lot introuvable pour décrémentation :', item);
          continue;
        }

        // Recalcul du total disponible après confirmation de l'écriture atomique
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
   Valide la réception de l'ordre par le Responsable Régional.
   L'ordre doit être en statut 'En_transit'.
   Passe définitivement le statut à 'Expedie'.
═══════════════════════════════════════════════════════════ */
router.put('/ordres/:id/reception-regionale', protect, authorize(...ADMIN_ROLES), async (req, res) => {
  const { conformite, commentaire } = req.body ?? {};

  if (typeof conformite !== 'boolean') {
    return res.status(400).json({ message: 'Le champ "conformite" (boolean) est requis.' });
  }

  try {
    const tx = await Transaction.findById(req.params.id).select('statut');
    if (!tx) return res.status(404).json({ message: 'Ordre introuvable.' });

    if (tx.statut !== 'En_transit') {
      return res.status(422).json({
        message: `Réception impossible : statut actuel "${tx.statut}". L'ordre doit être "En_transit".`,
      });
    }

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          statut:                                 'Expedie',
          'receptionRegionale.conformite':        conformite,
          'receptionRegionale.commentaire':       (commentaire ?? '').trim(),
          'receptionRegionale.validePar':         req.user._id,
          'receptionRegionale.dateValidation':    new Date(),
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
