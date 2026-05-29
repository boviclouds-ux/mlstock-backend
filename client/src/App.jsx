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

/* ═══════════════════════════════════════════════════════════
   TRANSFORMATION API → FORMAT FRONTEND
   Mappe l'utilisateur renvoyé par le JWT vers la forme
   attendue par la Sidebar et les composants.
═══════════════════════════════════════════════════════════ */
/* ─── Dérivation roleKey depuis les permissions V2 ──────────
   Priorité : isAdmin > canDispatch > canDemand.
   Conservé pour la rétrocompatiblité des composants enfants
   qui reçoivent encore userRole en prop (migration progressive).
─────────────────────────────────────────────────────────── */
function deriveRoleKey(p) {
  if (!p) return 'INCONNU';
  if (p.isAdmin)     return 'ADMIN';
  if (p.canDispatch) return 'MAGASINIER';
  if (p.canDemand)   return 'UNITE';
  return 'INCONNU';
}

const ROLE_LABEL = {
  ADMIN:      'Administrateur',
  MAGASINIER: 'Magasinier Central',
  UNITE:      'Responsable Unité',
  INCONNU:    'Compte non configuré',
};

const ROLE_COULEUR = {
  ADMIN:      'bg-indigo-600',
  MAGASINIER: 'bg-blue-600',
  UNITE:      'bg-emerald-600',
  INCONNU:    'bg-slate-600',
};

function mapApiUser(u) {
  const prenom      = u.prenom ?? '';
  const nom         = u.nom    ?? '';
  const initiales   = `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase() || 'ML';
  const permissions = u.permissions ?? {};
  const roleKey     = deriveRoleKey(permissions);
  return {
    id:          u.id ?? u._id,
    nom:         [prenom, nom].filter(Boolean).join(' ') || u.email,
    email:       u.email,
    role:        ROLE_LABEL[roleKey] ?? roleKey,
    roleKey,
    permissions,
    unite:       u.entite ?? 'Maroc Lait',
    initiales,
    couleur:     ROLE_COULEUR[roleKey] ?? 'bg-slate-600',
    mfa:         u.mfa ?? false,
  };
}

const TOKEN_KEY = 'mlstock_token';
const USER_KEY  = 'mlstock_user';

/* ─── Titre de la page d'accueil selon les permissions V2 ── */
function homeTitleForPermissions(p) {
  if (!p) return 'Tableau de Bord';
  if (p.canDemand && !p.isAdmin && !p.canDispatch) return 'Mon Espace';
  if (p.canDispatch && !p.isAdmin)                  return 'Hub Central — Opérations';
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
  '/profil':             'Mon Profil',
};

/* ─── Prédicats de permission réutilisables ─────────────── */
const pAdmin  = p => Boolean(p?.isAdmin);
const pOps    = p => Boolean(p?.isAdmin || p?.canDispatch);
const pDemand = p => Boolean(p?.isAdmin || p?.canDemand);

/* ══════════════════════════════════════════════════════════
   APP LAYOUT — SIDEBAR + ROUTAGE
══════════════════════════════════════════════════════════ */
function AppLayout({ user, onLogout }) {
  const location  = useLocation();
  const rawTitle  = PAGE_TITLES[location.pathname] ?? 'MLstock';
  const pageTitle = location.pathname === '/' ? homeTitleForPermissions(user?.permissions) : rawTitle;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ferme le drawer à chaque changement de route
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  /* Enveloppe un élément dans ProtectedRoute avec un prédicat de permission */
  function guard(check, element) {
    return (
      <ProtectedRoute check={check} permissions={user?.permissions}>
        {element}
      </ProtectedRoute>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar user={user} onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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

            {/* ── Accueil : composant différent selon les permissions ── */}
            <Route path="/" element={(() => {
              const p = user?.permissions ?? {};
              if (p.canDemand && !p.isAdmin && !p.canDispatch) return <EspaceCooperative user={user} />;
              if (p.canDispatch && !p.isAdmin)                  return <DashboardMagasinier />;
              return <DashboardDirection />;
            })()} />

            {/* ── Espace Bénéficiaire ────────────────────────────── */}
            <Route path="/nouvelle-commande" element={guard(pDemand, <EspaceCooperative user={user} />)} />
            <Route path="/cooperative"       element={guard(pDemand, <EspaceCooperative user={user} />)} />

            {/* ── Logistique & Stock (Magasinier + Admin) ────────── */}
            <Route path="/approvisionnements" element={guard(p => Boolean(p?.isAdmin || p?.canDispatch || p?.canManageAppro), <ApprovisionnementsFournisseurs userRole={user?.roleKey} canManageAppro={!!user?.permissions?.canManageAppro} />)} />
            <Route path="/receptions"         element={guard(pOps, <ReceptionsImportations />)} />
            <Route path="/magasinier"         element={guard(pOps, <MagasinierCentral userRole={user?.roleKey} />)} />
            <Route path="/expeditions"        element={guard(pOps, <PreparationsExpeditions />)} />

            {/* ── Pilotage & Contrôle (Admin uniquement) ─────────── */}
            <Route path="/quotas"       element={guard(pAdmin, <GestionQuotas />)} />
            <Route path="/validations"  element={guard(pAdmin, <CentreValidations />)} />
            <Route path="/tracabilite"  element={guard(pAdmin, <TracabiliteRapports />)} />
            <Route path="/ordres-admin" element={guard(pAdmin, <OrdresAdmin />)} />

            {/* ── Administration (Admin uniquement) ──────────────── */}
            <Route path="/catalogue"    element={guard(pAdmin, <CatalogueReferentiel userRole={user?.roleKey} />)} />
            <Route path="/reseau"       element={guard(pAdmin, <ReseauGlobal userRole={user?.roleKey} />)} />
            <Route path="/utilisateurs" element={guard(pAdmin, <UtilisateursAcces userRole={user?.roleKey} />)} />

            {/* ── Configuration (Admin uniquement) ───────────────── */}
            <Route path="/configuration" element={guard(pAdmin, <ConfigurationGenerale userRole={user?.roleKey} />)} />

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

  /* ─ Restauration de session depuis localStorage ──────── */
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    // Re-valide le token en demandant les données fraîches depuis la DB.
    // Cela empêche qu'un utilisateur précédent (session périmée) soit affiché.
    fetch(`${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : 'https://mlstock-backend-2.onrender.com'}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(apiUser => {
        const frontendUser = mapApiUser(apiUser);
        localStorage.setItem(USER_KEY, JSON.stringify(frontendUser));
        setUser(frontendUser);
        setIsAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      });
  }, []);

  /* ─ Connexion ────────────────────────────────────────── */
  function handleLogin(token, apiUser) {
    const frontendUser = mapApiUser(apiUser);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY,  JSON.stringify(frontendUser));
    setUser(frontendUser);
    setIsAuthenticated(true);
  }

  /* ─ Déconnexion ──────────────────────────────────────── */
  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  }

  /* ─ Routage conditionnel ─────────────────────────────── */
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return <AppLayout user={user} onLogout={handleLogout} />;
}
