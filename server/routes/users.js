const express = require('express');
const router  = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');

/* Formate un objet User Mongoose → format attendu par le frontend */
function toUserDTO(u) {
  return {
    id:                u._id,
    prenom:            u.prenom ?? '',
    nom:               u.nom,
    email:             u.email,
    entite:            u.entite,
    permissions:       u.permissions,
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
router.get('/', protect, requireAdmin, async (req, res) => {
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
router.get('/demandes', protect, requireAdmin, async (req, res) => {
  try {
    const demandes = await User.find({ statut: 'En attente' })
      .sort({ createdAt: -1 });
    res.json(demandes.map(u => ({
      id:          u._id,
      date:        u.createdAt.toISOString().slice(0, 10),
      prenom:      u.prenom ?? '',
      nom:         u.nom,
      email:       u.email,
      entite:      u.entite,
      permissions: u.permissions,
    })));
  } catch (err) {
    console.error('[GET /api/users/demandes]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   POST /api/users
   Création directe par un admin (compte immédiatement actif,
   sans permissions — l'admin les attribue via PATCH /:id/permissions)
═══════════════════════════════════════════════════════════ */
router.post('/', protect, requireAdmin, async (req, res) => {
  try {
    const { prenom = '', nom, email, entite, permissions = {} } = req.body;
    if (!nom || !email) {
      return res.status(400).json({ message: 'Nom et email sont requis.' });
    }
    // Mot de passe temporaire aléatoire — l'admin devra déclencher une réinit.
    const tempPwd = `Mlk${Math.random().toString(36).slice(-6)}!`;
    const user = await User.create({
      prenom,
      nom,
      email,
      password:    tempPwd,
      entite:      entite || 'Maroc Lait — Hub Central',
      statut:      'Actif',
      permissions: {
        canDemand:      permissions.canDemand      ?? false,
        canReceive:     permissions.canReceive     ?? false,
        canDispatch:    permissions.canDispatch    ?? false,
        canManageAppro: permissions.canManageAppro ?? false,
        isAdmin:        permissions.isAdmin        ?? false,
        canActAsProxy:  permissions.canActAsProxy  ?? false,
      },
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
router.post('/demandes/:id/approve', protect, requireAdmin, async (req, res) => {
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
   Rejette et supprime une demande
═══════════════════════════════════════════════════════════ */
router.delete('/demandes/:id', protect, requireAdmin, async (req, res) => {
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
   PATCH /api/users/:id/permissions
   Attribue ou révoque les permissions d'un utilisateur
   Body : { canDemand?, canReceive?, canDispatch?, isAdmin? }
═══════════════════════════════════════════════════════════ */
router.patch('/:id/permissions', protect, requireAdmin, async (req, res) => {
  try {
    const { canDemand, canReceive, canDispatch, canManageAppro, isAdmin, canActAsProxy, entite } = req.body;
    const patch = {};
    if (canDemand      !== undefined) patch['permissions.canDemand']      = canDemand;
    if (canReceive     !== undefined) patch['permissions.canReceive']     = canReceive;
    if (canDispatch    !== undefined) patch['permissions.canDispatch']    = canDispatch;
    if (canManageAppro !== undefined) patch['permissions.canManageAppro'] = canManageAppro;
    if (isAdmin        !== undefined) patch['permissions.isAdmin']        = isAdmin;
    if (canActAsProxy  !== undefined) patch['permissions.canActAsProxy']  = canActAsProxy;
    if (entite         !== undefined) patch['entite']                     = entite;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: patch },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json({ id: user._id, permissions: user.permissions, entite: user.entite });
  } catch (err) {
    console.error('[PATCH /api/users/:id/permissions]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   PATCH /api/users/:id/statut
   Suspend ou réactive un compte
   Body : { statut: 'actif' | 'suspendu' }
═══════════════════════════════════════════════════════════ */
router.patch('/:id/statut', protect, requireAdmin, async (req, res) => {
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
