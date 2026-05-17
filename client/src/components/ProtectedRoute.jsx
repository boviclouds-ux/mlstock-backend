import { Navigate } from 'react-router-dom';

/**
 * Protège une route en vérifiant le rôle JWT stocké dans l'état App.
 *
 * Props :
 *   roles    — tableau des roleKey autorisés (ex: ['ADMIN_FEDERAL', 'ADMIN'])
 *   userRole — roleKey de l'utilisateur connecté (vient du state App)
 *   children — la page à rendre si le rôle est autorisé
 *
 * Comportement si accès refusé :
 *   Redirige vers "/" avec replace — l'accueil rend le bon composant selon
 *   le rôle (DashboardDirection / MagasinierCentral / EspaceCooperative),
 *   donc la redirection reste cohérente pour tous les rôles.
 */
export default function ProtectedRoute({ roles, userRole, children }) {
  if (!roles || !roles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
