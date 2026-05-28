const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/* ─── Génère un JWT signé ──────────────────────────────────
   Le payload contient l'id (clé DB) et entite (affichage UI).
   Les permissions ne sont pas dupliquées ici : protect() les
   recharge depuis la DB à chaque requête, garantissant que
   toute révocation d'accès prend effet immédiatement.
──────────────────────────────────────────────────────────── */
function signToken(user) {
  return jwt.sign(
    { id: user._id, entite: user.entite },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/register
   Corps : { prenom, nom, email, password, entite? }
   Crée un compte en statut "En attente", sans permissions.
   Un admin devra activer le compte et attribuer les droits.
═══════════════════════════════════════════════════════════ */
router.post('/register', async (req, res) => {
  try {
    const { prenom = '', nom, email, password, entite } = req.body;

    if (!nom || !email || !password) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont requis.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Un compte avec cet email existe déjà.' });
    }

    const user = await User.create({
      prenom,
      nom,
      email,
      password,             // hashé par le pre-save hook
      entite: entite || 'Maroc Lait — Hub Central',
      statut: 'En attente', // toujours en attente jusqu'à validation admin
      // permissions: toutes à false par défaut (défini dans le schéma)
    });

    res.status(201).json({
      message: 'Compte créé avec succès. En attente de validation par un administrateur.',
      user: {
        id:          user._id,
        prenom:      user.prenom,
        nom:         user.nom,
        email:       user.email,
        entite:      user.entite,
        statut:      user.statut,
        permissions: user.permissions,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(' | ') });
    }
    console.error('[register]', err);
    res.status(500).json({ message: 'Erreur serveur lors de la création du compte.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/login
   Corps : { email, password }
   Retourne : { token, user }
═══════════════════════════════════════════════════════════ */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    // Sélectionne explicitement le password (exclu par défaut via select:false)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const passwordOk = await user.comparePassword(password);
    if (!passwordOk) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    if (user.statut === 'En attente') {
      return res.status(403).json({
        message: 'Votre compte est en attente de validation par un administrateur.',
      });
    }
    if (user.statut === 'Suspendu') {
      return res.status(403).json({
        message: "Votre compte est suspendu. Contactez l'administration.",
      });
    }

    user.derniereConnexion = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user);

    res.json({
      token,
      user: {
        id:                user._id,
        prenom:            user.prenom,
        nom:               user.nom,
        email:             user.email,
        entite:            user.entite,
        statut:            user.statut,
        mfa:               user.mfa,
        derniereConnexion: user.derniereConnexion,
        permissions:       user.permissions,
      },
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   GET /api/auth/me
   Retourne les données fraîches de l'utilisateur connecté
   (rechargées depuis la DB par protect()).
   Utilisé au démarrage de l'app pour invalider les sessions
   périmées stockées en localStorage.
═══════════════════════════════════════════════════════════ */
router.get('/me', protect, (req, res) => {
  const u = req.user;
  res.json({
    id:                u._id,
    prenom:            u.prenom,
    nom:               u.nom,
    email:             u.email,
    entite:            u.entite,
    statut:            u.statut,
    mfa:               u.mfa,
    derniereConnexion: u.derniereConnexion,
    permissions:       u.permissions,
  });
});

module.exports = router;
