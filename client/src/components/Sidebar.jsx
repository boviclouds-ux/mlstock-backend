import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Truck, Inbox, ClipboardList, Send,
  Scale, Zap, ShieldCheck, FileText, Tags, Network, Users, Settings,
  User, LogOut, Dna, Shield,
} from 'lucide-react';

/* ─── Constantes de rôle — doivent correspondre exactement aux valeurs JWT ── */
const ADMIN_FEDERAL = 'ADMIN_FEDERAL';
const ADMIN         = 'ADMIN';
const MAGASINIER    = 'MAGASINIER';
const UNITE         = 'UNITE';         // ← anciennement COOPERATIVE

/* ─── Groupes de navigation filtrés par rôle ─────────── */
const NAV_GROUPS = [
  // Bloc 1 : Vue d'ensemble
  [
    { label: 'Tableau de Bord', path: '/', icon: LayoutDashboard, end: true,
      roles: [ADMIN_FEDERAL, ADMIN, MAGASINIER] },
    { label: 'Mon Espace',      path: '/', icon: LayoutDashboard, end: true,
      roles: [UNITE] },
  ],
  // Bloc 2 : Gestion des Demandes
  [
    { label: 'Gestion des Demandes', path: '/cooperative', icon: Package,
      roles: [UNITE, ADMIN_FEDERAL] },
  ],
  // Bloc 3 : Logistique & Stock
  [
    { label: 'Approvisionnements',        path: '/approvisionnements', icon: Truck,         roles: [MAGASINIER, ADMIN_FEDERAL, ADMIN] },
    { label: 'Réceptions & Importations', path: '/receptions',         icon: Inbox,         roles: [MAGASINIER, ADMIN_FEDERAL, ADMIN] },
    { label: 'Inventaire Central',        path: '/magasinier',         icon: ClipboardList, roles: [MAGASINIER, ADMIN_FEDERAL, ADMIN] },
    { label: 'Préparations & Expéditions',path: '/expeditions',        icon: Send,          roles: [MAGASINIER, ADMIN_FEDERAL, ADMIN] },
  ],
  // Bloc 4 : Pilotage & Contrôle
  [
    { label: 'Gestion des Quotas', path: '/quotas',       icon: Scale,       roles: [ADMIN_FEDERAL, ADMIN] },
    { label: 'Ordres Admin',       path: '/ordres-admin', icon: Zap,         roles: [ADMIN_FEDERAL, ADMIN] },
    { label: 'Validations & OTP',  path: '/validations',  icon: ShieldCheck, roles: [ADMIN_FEDERAL, ADMIN] },
    { label: 'Traçabilité',        path: '/tracabilite',  icon: FileText,    roles: [ADMIN_FEDERAL, ADMIN] },
  ],
  // Bloc 5 : Administration
  [
    { label: 'Catalogue & Référentiel', path: '/catalogue',     icon: Tags,     roles: [ADMIN_FEDERAL, ADMIN] },
    { label: 'Réseau & Acteurs',         path: '/reseau',        icon: Network,  roles: [ADMIN_FEDERAL, ADMIN] },
    { label: 'Utilisateurs & Accès',    path: '/utilisateurs',  icon: Users,    roles: [ADMIN_FEDERAL, ADMIN] },
    { label: 'Configuration Générale',  path: '/configuration', icon: Settings, roles: [ADMIN_FEDERAL] },
  ],
];

const ROLE_BADGE = {
  [ADMIN_FEDERAL]: 'bg-violet-600/20 text-violet-300 border-violet-700',
  [ADMIN]:         'bg-indigo-600/20 text-indigo-300 border-indigo-700',
  [UNITE]:         'bg-emerald-600/20 text-emerald-300 border-emerald-800',
  [MAGASINIER]:    'bg-blue-600/20 text-blue-300 border-blue-800',
};

const ROLE_LABEL = {
  [ADMIN_FEDERAL]: 'Admin Fédéral',
  [ADMIN]:         'Administrateur',
  [UNITE]:         'Responsable Unité',
  [MAGASINIER]:    'Magasinier',
};

/* ─── Lien de navigation ──────────────────────────────── */
function NavItem({ path, icon: Icon, label, end = false, onClose }) {
  return (
    <NavLink
      to={path}
      end={end}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ` +
        (isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200')
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={15} className={isActive ? 'text-white shrink-0' : 'text-slate-500 shrink-0'} />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

/* ─── Composant principal ─────────────────────────────── */
export default function Sidebar({ user, userRole, onLogout, isOpen, onClose }) {
  const visibleGroups = NAV_GROUPS
    .map(group => group.filter(item => item.roles.includes(userRole)))
    .filter(group => group.length > 0);

  return (
    <aside className={`w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-40 shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <Dna size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">MLstock</p>
          <p className="text-[10px] text-slate-500 mt-0.5">MLAPP · ERP Laitier</p>
        </div>
      </div>

      {/* Badge rôle */}
      <div className="px-5 py-3 border-b border-slate-800">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${ROLE_BADGE[userRole] ?? ''}`}>
          <Shield size={9} /> {ROLE_LABEL[userRole] ?? userRole}
        </span>
      </div>

      {/* Navigation par blocs (sans titres) */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {visibleGroups.map((group, i) => (
          <div key={i}>
            {i > 0 && <div className="my-2 border-t border-slate-800/60" />}
            <div className="space-y-0.5">
              {group.map(item => (
                <NavItem key={item.path} {...item} onClose={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Pied de navigation */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-3 space-y-1">
        <NavItem path="/profil" icon={User} label="Mon Profil" onClose={onClose} />

        {/* Carte utilisateur connecté */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60 mt-1">
          <div className={`w-8 h-8 rounded-lg ${user?.couleur ?? 'bg-slate-600'} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
            {user?.initiales}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 leading-none truncate">{user?.nom}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{user?.unite}</p>
          </div>
        </div>

        {/* Bouton de déconnexion — bien visible avec fond rouge subtil */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            bg-rose-500/10 border border-rose-900/40
            text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-800
            transition-all duration-150 group mt-1"
        >
          <LogOut size={15} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-sm font-semibold">Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}
