const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');

const ADMIN_ROLES  = ['ADMIN_FEDERAL', 'ADMIN'];
const FEDERAL_ONLY = ['ADMIN_FEDERAL'];

const ROLE_LABEL = {
  ADMIN_FEDERAL: 'Admin Fédéral',
  ADMIN:         'Administrateur',
  MAGASINIER:    'Magasinier',
  UNITE:         'Responsable Unité',
};

/* Formate un objet User Mongoose → format attendu par le frontend */
function toUserDTO(u) {
  return {
    id:                u._id,
    prenom:            u.prenom ?? '',
    nom:               u.nom,
    email:             u.email,
    roleKey:           u.role,
    entite:            u.entite,
    derniereConnexion: u.derniereConnexion
      ? u.derniereConnexion.toISOString().replace('T', ' ').slice(0, 16)
      : null,
    statut: u.statut === 'Actif' ? 'actif' : 'suspendu',
    mfa:    u.mfa ?? false,
  };
}

/* ═══════════════════════════════════════════════════════════
   GET /api/users
   Liste tous les comptes actifs/suspendus (hors "En attente")
═══════════════════════════════════════════════════════════ */
router.get('/', protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    const users = await User.find({ statut: { $ne: 'En attente' } })
      .sort({ createdAt: -1 });
    res.json(users.map(toUserDTO));
  } catch (err) {
    console.error('[GET /api/users]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   GET /api/users/demandes
   Comptes en attente de validation (⚠ avant /:id)
═══════════════════════════════════════════════════════════ */
router.get('/demandes', protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    const demandes = await User.find({ statut: 'En attente' })
      .sort({ createdAt: -1 });
    res.json(demandes.map(u => ({
      id:          u._id,
      date:        u.createdAt.toISOString().slice(0, 10),
      prenom:      u.prenom ?? '',
      nom:         u.nom,
      email:       u.email,
      roleDemande: ROLE_LABEL[u.role] ?? u.role,
      entite:      u.entite,
    })));
  } catch (err) {
    console.error('[GET /api/users/demandes]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   POST /api/users
   Création directe par un admin (compte immédiatement actif)
═══════════════════════════════════════════════════════════ */
router.post('/', protect, authorize(...FEDERAL_ONLY), async (req, res) => {
  try {
    const { prenom = '', nom, email, roleKey, entite } = req.body;
    if (!nom || !email) {
      return res.status(400).json({ message: 'Nom et email sont requis.' });
    }
    // Mot de passe temporaire aléatoire — l'admin devra déclencher une réinit.
    const tempPwd = `Mlk${Math.random().toString(36).slice(-6)}!`;
    const user = await User.create({
      prenom,
      nom,
      email,
      password: tempPwd,
      role:     roleKey || 'UNITE',
      entite:   entite  || 'Maroc Lait — Hub Central',
      statut:   'Actif',
    });
    res.status(201).json(toUserDTO(user));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }
    console.error('[POST /api/users]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   POST /api/users/demandes/:id/approve
   Valide un compte en attente (statut → Actif)
═══════════════════════════════════════════════════════════ */
router.post('/demandes/:id/approve', protect, authorize(...FEDERAL_ONLY), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { statut: 'Actif' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'Demande introuvable.' });
    res.json(toUserDTO(user));
  } catch (err) {
    console.error('[POST /api/users/demandes/:id/approve]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   DELETE /api/users/demandes/:id
   Rejette et supprime une demande (aucune traçabilité requise
   pour un compte qui n'a jamais été actif)
═══════════════════════════════════════════════════════════ */
router.delete('/demandes/:id', protect, authorize(...FEDERAL_ONLY), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Demande introuvable.' });
    if (user.statut !== 'En attente') {
      return res.status(400).json({ message: 'Seules les demandes en attente peuvent être rejetées.' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error('[DELETE /api/users/demandes/:id]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   PATCH /api/users/:id/role
   Modifie le rôle et l'entité d'un utilisateur
═══════════════════════════════════════════════════════════ */
router.patch('/:id/role', protect, authorize(...FEDERAL_ONLY), async (req, res) => {
  try {
    const { roleKey, entite } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: roleKey, entite },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json({ id: user._id, roleKey: user.role, entite: user.entite });
  } catch (err) {
    console.error('[PATCH /api/users/:id/role]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   PATCH /api/users/:id/statut
   Suspend ou réactive un compte
   Body : { statut: 'actif' | 'suspendu' }
═══════════════════════════════════════════════════════════ */
router.patch('/:id/statut', protect, authorize(...FEDERAL_ONLY), async (req, res) => {
  try {
    const { statut } = req.body;
    const mongoStatut = statut === 'actif' ? 'Actif' : 'Suspendu';
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { statut: mongoStatut },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json({ id: user._id, statut });
  } catch (err) {
    console.error('[PATCH /api/users/:id/statut]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
