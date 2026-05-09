const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const router = express.Router();

/* ─── Génère un JWT signé ──────────────────────────────── */
function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, entite: user.entite },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/register
   Corps : { prenom, nom, email, password, role?, entite? }
   Crée un compte en statut "En attente" (validation admin requise)
═══════════════════════════════════════════════════════════ */
router.post('/register', async (req, res) => {
  try {
    const { prenom = '', nom, email, password, role, entite } = req.body;

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
      password,              // hashé par le pre-save hook
      role:   role   || 'UNITE',
      entite: entite || 'Maroc Lait — Hub Central',
      statut: 'En attente',  // toujours en attente jusqu'à validation admin
    });

    res.status(201).json({
      message: 'Compte créé avec succès. En attente de validation par un administrateur.',
      user: {
        id:     user._id,
        prenom: user.prenom,
        nom:    user.nom,
        email:  user.email,
        role:   user.role,
        entite: user.entite,
        statut: user.statut,
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
        message: "Votre compte est en attente de validation par un administrateur.",
      });
    }
    if (user.statut === 'Suspendu') {
      return res.status(403).json({
        message: "Votre compte est suspendu. Contactez l'administration.",
      });
    }

    // Mise à jour de la dernière connexion
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
        role:              user.role,
        entite:            user.entite,
        statut:            user.statut,
        mfa:               user.mfa,
        derniereConnexion: user.derniereConnexion,
      },
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
});

module.exports = router;
