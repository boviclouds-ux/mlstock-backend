const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/* ═══════════════════════════════════════════════════════════
   protect
   Vérifie le token JWT dans Authorization: Bearer <token>.
   Recharge toujours l'utilisateur depuis la DB pour que toute
   révocation de permissions soit effective immédiatement.
   Attache req.user (document Mongoose complet) à la requête.
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
      return res.status(403).json({ message: 'Compte en attente de validation.' });
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

/* ─── Helper interne ────────────────────────────────────────
   Construit un middleware qui refuse l'accès si aucun des
   flags n'est accordé. isAdmin bypass tous les autres checks.
──────────────────────────────────────────────────────────── */
function makePermissionGuard(flag, label) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }
    const p = req.user.permissions ?? {};
    if (p.isAdmin || p[flag]) return next();
    return res.status(403).json({
      message: `Accès refusé — permission '${label}' requise.`,
    });
  };
}

/* ═══════════════════════════════════════════════════════════
   Middlewares de permission granulaires
   Utilisation : router.get('/route', protect, requireAdmin, handler)

   Règle commune : isAdmin = super-accès (bypass tous les flags)
═══════════════════════════════════════════════════════════ */

/** Gestion globale, quotas, administration des utilisateurs */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié.' });
  }
  if (req.user.permissions?.isAdmin) return next();
  return res.status(403).json({ message: "Accès refusé — droits d'administration requis." });
};

/** Création et suivi des bons de commande (Acheteur / Demandeur) */
const requireDemand = makePermissionGuard('canDemand', 'canDemand');

/** Réception des livraisons fournisseur */
const requireReceive = makePermissionGuard('canReceive', 'canReceive');

/** Bons d'enlèvement et bons de livraison (Magasinier) */
const requireDispatch = makePermissionGuard('canDispatch', 'canDispatch');

module.exports = { protect, requireAdmin, requireDemand, requireReceive, requireDispatch };
