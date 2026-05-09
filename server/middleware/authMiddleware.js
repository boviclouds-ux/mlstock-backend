const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/* ═══════════════════════════════════════════════════════════
   protect
   Vérifie le token JWT dans Authorization: Bearer <token>
   Attache req.user à chaque requête protégée
═══════════════════════════════════════════════════════════ */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès refusé — token manquant.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }

    if (user.statut === 'Suspendu') {
      return res.status(403).json({ message: 'Compte suspendu.' });
    }
    if (user.statut === 'En attente') {
      return res.status(403).json({ message: "Compte en attente de validation." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expirée — veuillez vous reconnecter.' });
    }
    return res.status(401).json({ message: 'Token invalide.' });
  }
};

/* ═══════════════════════════════════════════════════════════
   authorize(...roles)
   Utilisation : router.get('/route', protect, authorize('ADMIN_FEDERAL'), handler)
   Retourne 403 si le rôle de l'utilisateur n'est pas dans la liste
═══════════════════════════════════════════════════════════ */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Accès refusé — rôle '${req.user.role}' insuffisant. Requis : ${roles.join(', ')}.`,
    });
  }
  next();
};

module.exports = { protect, authorize };
