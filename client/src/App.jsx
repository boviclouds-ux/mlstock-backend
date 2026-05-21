// App.jsx — Routage principal + Authentification JWT
import logoImg from './assets/logo.png';
import { useState, useEffect } from "react";
import { Menu } from 'lucide-react';
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import ErrorBoundary    from "./ErrorBoundary.jsx";
import ProtectedRoute  from "./components/ProtectedRoute.jsx";

// ─── Pages & composants ──────────────────────────────────
import Login                        from './pages/Login.jsx';
import Sidebar                      from './components/Sidebar.jsx';
import EspaceCooperative            from './EspaceCooperative.jsx';
import MagasinierCentral            from './MagasinierCentral.jsx';
import CentreValidations            from './CentreValidations.jsx';
import DashboardDirection           from './DashboardDirection.jsx';
import DashboardMagasinier          from './DashboardMagasinier.jsx';
import TracabiliteRapports          from './TracabiliteRapports.jsx';
import PreparationsExpeditions      from './PreparationsExpeditions.jsx';
import ProfilUtilisateur            from './ProfilUtilisateur.jsx';
import ReceptionsImportations       from './ReceptionsImportations.jsx';
import ApprovisionnementsFournisseurs from './ApprovisionnementsFournisseurs.jsx';
import GestionQuotas                from './mlstock-quotas (2).jsx';
import PageEnConstruction           from './components/PageEnConstruction.jsx';
import CatalogueReferentiel         from './CatalogueReferentiel.jsx';
import ReseauGlobal                 from './ReseauGlobal.jsx';
import UtilisateursAcces            from './UtilisateursAcces.jsx';
import ConfigurationGenerale        from './ConfigurationGenerale.jsx';
import OrdresAdmin                  from './OrdresAdmin.jsx';
import ResponsableRegional          from './ResponsableRegional.jsx';

/* ═══════════════════════════════════════════════════════════
   TRANSFORMATION API → FORMAT FRONTEND
   Mappe l'utilisateur renvoyé par le JWT vers la forme
   attendue par la Sidebar et les composants.
═══════════════════════════════════════════════════════════ */
const ROLE_LABEL = {
  ADMIN_FEDERAL: 'Admin Fédéral',
  ADMIN:         'Administrateur',
  MAGASINIER:    'Magasinier Central',
  UNITE:         'Responsable Unité',
};

const ROLE_COULEUR = {
  ADMIN_FEDERAL: 'bg-violet-600',
  ADMIN:         'bg-indigo-600',
  MAGASINIER:    'bg-blue-600',
  UNITE:         'bg-emerald-600',
};

function mapApiUser(u) {
  const prenom    = u.prenom ?? '';
  const nom       = u.nom    ?? '';
  const initiales = `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase() || 'ML';
  return {
    id:        u.id   ?? u._id,
    nom:       [prenom, nom].filter(Boolean).join(' ') || u.email,
    email:     u.email,
    role:      ROLE_LABEL[u.role]   ?? u.role,
    roleKey:   u.role,
    unite:     u.entite ?? 'Maroc Lait',
    initiales,
    couleur:   ROLE_COULEUR[u.role] ?? 'bg-slate-600',
    mfa:       u.mfa ?? false,
  };
}

const TOKEN_KEY = 'mlstock_token';
const USER_KEY  = 'mlstock_user';

/* ─── Titre de la page d'accueil selon le rôle ─────────── */
function homeTitleForRole(roleKey) {
  if (roleKey === 'UNITE')     return 'Mon Espace';
  if (roleKey === 'MAGASINIER') return 'Hub Central — Opérations';
  return 'Tableau de Bord';
}

/* ─── Titres de page ────────────────────────────────────── */
const PAGE_TITLES = {
  '/':                   'Tableau de Bord', // remplacé dynamiquement ci-dessous
  '/nouvelle-commande':  'Nouvelle Commande',
  '/cooperative':        'Mes Demandes',
  '/approvisionnements': 'Approvisionnements Fournisseurs',
  '/receptions':         'Réceptions & Importations',
  '/magasinier':         'Inventaire Central',
  '/expeditions':        'Préparations & Expéditions',
  '/quotas':             'Gestion des Quotas',
  '/validations':        'Validations & Alertes OTP',
  '/tracabilite':        'Traçabilité & Rapports',
  '/catalogue':          'Catalogue & Référentiel',
  '/reseau':             'Réseau & Acteurs',
  '/utilisateurs':       'Utilisateurs & Accès',
  '/configuration':      'Configuration Générale',
  '/ordres-admin':       'Ordres Admin',
  '/regional':           'Réception Régionale',
  '/profil':             'Mon Profil',
};

/* ─── Groupes de rôles réutilisables ────────────────────── */
const ADMIN_ROLES = ['ADMIN_FEDERAL', 'ADMIN'];
const OPS_ROLES   = ['MAGASINIER', 'ADMIN_FEDERAL', 'ADMIN'];
const ALL_ROLES   = ['ADMIN_FEDERAL', 'ADMIN', 'MAGASINIER', 'UNITE'];

/* ══════════════════════════════════════════════════════════
   APP LAYOUT — SIDEBAR + ROUTAGE
══════════════════════════════════════════════════════════ */
function AppLayout({ user, userRole, onLogout }) {
  const location  = useLocation();
  const rawTitle  = PAGE_TITLES[location.pathname] ?? 'MLstock';
  const pageTitle = location.pathname === '/' ? homeTitleForRole(userRole) : rawTitle;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ferme le drawer à chaque changement de route
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  /* Enveloppe un élément dans ProtectedRoute avec les rôles donnés */
  function guard(roles, element) {
    return (
      <ProtectedRoute roles={roles} userRole={userRole}>
        {element}
      </ProtectedRoute>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar user={user} userRole={userRole} onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="md:ml-64 flex-1 min-h-screen p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">

          {/* En-tête de page */}
          <div className="mb-7 flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                  {user.role} · {user.unite}
                </p>
                <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
              </div>
            </div>
          </div>

          {/* Routage des modules */}
          <ErrorBoundary key={location.pathname}>
          <Routes>

            {/* ── Accueil : composant différent selon le rôle JWT ── */}
            <Route path="/" element={
              userRole === 'UNITE'      ? <EspaceCooperative user={user} /> :
              userRole === 'MAGASINIER' ? <DashboardMagasinier /> :
                                          <DashboardDirection />
            } />

            {/* ── Espace Unité ───────────────────────────────────── */}
            <Route path="/nouvelle-commande" element={guard(['UNITE'], <EspaceCooperative user={user} />)} />
            <Route path="/cooperative"       element={guard(['UNITE'], <EspaceCooperative user={user} />)} />

            {/* ── Logistique & Stock (Magasinier + Admins) ──────── */}
            <Route path="/approvisionnements" element={guard(OPS_ROLES, <ApprovisionnementsFournisseurs userRole={userRole} />)} />
            <Route path="/receptions"         element={guard(OPS_ROLES, <ReceptionsImportations />)} />
            <Route path="/magasinier"         element={guard(OPS_ROLES, <MagasinierCentral userRole={userRole} />)} />
            <Route path="/expeditions"        element={guard(OPS_ROLES, <PreparationsExpeditions />)} />

            {/* ── Pilotage & Contrôle (Admins uniquement) ────────── */}
            <Route path="/quotas"       element={guard(ADMIN_ROLES, <GestionQuotas />)} />
            <Route path="/validations"  element={guard(ADMIN_ROLES, <CentreValidations />)} />
            <Route path="/tracabilite"  element={guard(ADMIN_ROLES, <TracabiliteRapports />)} />
            <Route path="/ordres-admin" element={guard(ADMIN_ROLES, <OrdresAdmin />)} />

            {/* ── Administration (Admins uniquement) ─────────────── */}
            <Route path="/catalogue"    element={guard(ADMIN_ROLES, <CatalogueReferentiel userRole={userRole} />)} />
            <Route path="/reseau"       element={guard(ADMIN_ROLES, <ReseauGlobal userRole={userRole} />)} />
            <Route path="/utilisateurs" element={guard(ADMIN_ROLES, <UtilisateursAcces userRole={userRole} />)} />

            {/* ── Réception Régionale (Admins) ────────────────────── */}
            <Route path="/regional" element={guard(ADMIN_ROLES, <ResponsableRegional />)} />

            {/* ── Admin Fédéral uniquement ────────────────────────── */}
            <Route path="/configuration" element={guard(['ADMIN_FEDERAL'], <ConfigurationGenerale userRole={userRole} />)} />

            {/* ── Accessible à tous les rôles authentifiés ────────── */}
            <Route path="/profil" element={<ProfilUtilisateur />} />

            {/* ── Redirection si un utilisateur connecté tape /login ── */}
            <Route path="/login" element={<Navigate to="/" replace />} />

          </Routes>
          </ErrorBoundary>

        </div>
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   APP ROOT
══════════════════════════════════════════════════════════ */
export default function App() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user,            setUser]            = useState(null);
  const [userRole,        setUserRole]        = useState(null);

  /* ─ Restauration de session depuis localStorage ──────── */
  useEffect(() => {
    const token     = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (!token || !savedUser) return;

    try {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setUserRole(userData.roleKey);
      setIsAuthenticated(true);
    } catch {
      // Données corrompues → on nettoie
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  /* ─ Connexion ────────────────────────────────────────── */
  function handleLogin(token, apiUser) {
    const frontendUser = mapApiUser(apiUser);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY,  JSON.stringify(frontendUser));
    setUser(frontendUser);
    setUserRole(apiUser.role);
    setIsAuthenticated(true);
  }

  /* ─ Déconnexion ──────────────────────────────────────── */
  function handleLogout() {
    // 1. Supprimer toutes les données de session persistées
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // 2. Réinitialiser le state global d'authentification
    setUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
    // 3. Rediriger vers la page de connexion (replace évite le retour arrière)
    navigate('/login', { replace: true });
  }

  /* ─ Routage conditionnel ─────────────────────────────── */
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return <AppLayout user={user} userRole={userRole} onLogout={handleLogout} />;
}
