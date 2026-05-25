import { Navigate } from 'react-router-dom';

/**
 * Protège une route par vérification des permissions V2.
 *
 * Props :
 *   check       — fonction (permissions) => boolean.
 *                 Reçoit l'objet permissions { canDemand, canReceive, canDispatch, isAdmin }.
 *   permissions — objet permissions de l'utilisateur connecté (depuis user.permissions).
 *   children    — la page à rendre si la vérification réussit.
 *
 * Comportement si accès refusé :
 *   Redirige vers "/" avec replace — l'accueil affiche le bon composant
 *   selon les permissions (DashboardDirection / DashboardMagasinier / EspaceCooperative).
 */
export default function ProtectedRoute({ check, permissions, children }) {
  if (!check || !check(permissions ?? {})) {
    return <Navigate to="/" replace />;
  }
  return children;
}
