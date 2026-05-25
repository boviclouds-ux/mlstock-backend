import { NavLink } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import {
  LayoutDashboard, Package, Truck, Inbox, ClipboardList, Send,
  Scale, Zap, ShieldCheck, FileText, Tags, Network, Users, Settings,
  User, LogOut, Shield, MapPinCheck,
} from 'lucide-react';

/* ─── Prédicats de permission V2 ─────────────────────────── */
const isBeneficiaire = p => Boolean(p.canDemand && !p.isAdmin && !p.canDispatch);
const isOps          = p => Boolean(p.isAdmin || p.canDispatch);
const isAdminOnly    = p => Boolean(p.isAdmin);

/* ─── Groupes de navigation filtrés par permission V2 ──────── */
const NAV_GROUPS = [
  // Bloc 1 : Vue d'ensemble
  [
    { label: 'Tableau de Bord', path: '/', icon: LayoutDashboard, end: true,
      canSee: isOps },
    { label: 'Mon Espace',      path: '/', icon: LayoutDashboard, end: true,
      canSee: isBeneficiaire },
  ],
  // Bloc 2 : Gestion des Demandes (Bénéficiaires uniquement)
  [
    { label: 'Gestion des Demandes', path: '/cooperative', icon: Package,
      canSee: isBeneficiaire },
  ],
  // Bloc 3 : Logistique & Stock (Magasinier + Admin)
  [
    { label: 'Approvisionnements',         path: '/approvisionnements', icon: Truck,         canSee: isOps },
    { label: 'Réceptions & Importations',  path: '/receptions',         icon: Inbox,         canSee: isOps },
    { label: 'Inventaire Central',         path: '/magasinier',         icon: ClipboardList, canSee: isOps },
    { label: 'Préparations & Expéditions', path: '/expeditions',        icon: Send,          canSee: isOps },
  ],
  // Bloc 4 : Pilotage & Contrôle (Admin uniquement)
  [
    { label: 'Gestion des Quotas',  path: '/quotas',       icon: Scale,       canSee: isAdminOnly },
    { label: 'Ordres Admin',        path: '/ordres-admin', icon: Zap,         canSee: isAdminOnly },
    { label: 'Validations & OTP',   path: '/validations',  icon: ShieldCheck, canSee: isAdminOnly },
    { label: 'Réception Régionale', path: '/regional',     icon: MapPinCheck, canSee: isAdminOnly },
    { label: 'Traçabilité',         path: '/tracabilite',  icon: FileText,    canSee: isAdminOnly },
  ],
  // Bloc 5 : Administration (Admin uniquement)
  [
    { label: 'Catalogue & Référentiel', path: '/catalogue',     icon: Tags,     canSee: isAdminOnly },
    { label: 'Réseau & Acteurs',         path: '/reseau',        icon: Network,  canSee: isAdminOnly },
    { label: 'Utilisateurs & Accès',    path: '/utilisateurs',  icon: Users,    canSee: isAdminOnly },
    { label: 'Configuration Générale',  path: '/configuration', icon: Settings, canSee: isAdminOnly },
  ],
];

/* ─── Labels et badges dérivés des permissions V2 ────────── */
function getRoleBadgeClass(p) {
  if (!p) return 'bg-slate-600/20 text-slate-300 border-slate-700';
  if (p.isAdmin)     return 'bg-indigo-600/20 text-indigo-300 border-indigo-700';
  if (p.canDispatch) return 'bg-blue-600/20 text-blue-300 border-blue-800';
  if (p.canDemand)   return 'bg-emerald-600/20 text-emerald-300 border-emerald-800';
  return 'bg-slate-600/20 text-slate-300 border-slate-700';
}

function getRoleLabel(p) {
  if (!p) return 'Compte non configuré';
  if (p.isAdmin)     return 'Administrateur';
  if (p.canDispatch) return 'Magasinier';
  if (p.canDemand)   return 'Responsable Unité';
  return 'Compte non configuré';
}

/* ─── Lien de navigation ──────────────────────────────────── */
function NavItem({ path, icon: Icon, label, end = false, onClose }) {
  return (
    <NavLink
      to={path}
      end={end}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ` +
        (isActive
          ? 'bg-[#0DC8E8] text-[#1B2D8A] shadow-md shadow-black/20 font-semibold'
          : 'text-white/65 hover:bg-white/10 hover:text-white')
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={15} className={isActive ? 'text-[#1B2D8A] shrink-0' : 'text-white/40 shrink-0'} />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

/* ─── Composant principal ─────────────────────────────────── */
export default function Sidebar({ user, onLogout, isOpen, onClose }) {
  const permissions = user?.permissions ?? {};

  const visibleGroups = NAV_GROUPS
    .map(group => group.filter(item => item.canSee(permissions)))
    .filter(group => group.length > 0);

  return (
    <aside className={`w-64 h-screen bg-[#1B2D8A] text-white flex flex-col fixed left-0 top-0 z-40 shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

      {/* Logo — fond blanc pour neutraliser le fond du PNG */}
      <div className="bg-white px-5 py-3.5 flex items-center">
        <img src={logoImg} alt="ML STOCK" className="h-9 w-auto object-contain" />
      </div>

      {/* Badge rôle dérivé des permissions */}
      <div className="px-5 py-3 border-b border-white/10">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${getRoleBadgeClass(permissions)}`}>
          <Shield size={9} /> {getRoleLabel(permissions)}
        </span>
      </div>

      {/* Navigation par blocs (sans titres) */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {visibleGroups.map((group, i) => (
          <div key={i}>
            {i > 0 && <div className="my-2 border-t border-white/10" />}
            <div className="space-y-0.5">
              {group.map(item => (
                <NavItem key={item.path} {...item} onClose={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Pied de navigation */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1">
        <NavItem path="/profil" icon={User} label="Mon Profil" onClose={onClose} />

        {/* Carte utilisateur connecté */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/8 mt-1 border border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#0DC8E8] flex items-center justify-center text-[11px] font-bold text-[#1B2D8A] shrink-0">
            {user?.initiales}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white leading-none truncate">{user?.nom}</p>
            <p className="text-[10px] text-white/50 mt-0.5 truncate">{user?.unite}</p>
          </div>
        </div>

        {/* Bouton de déconnexion */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            bg-[#E61818]/10 border border-[#E61818]/25
            text-[#E61818]/80 hover:bg-[#E61818]/20 hover:text-white hover:border-[#E61818]/50
            transition-all duration-150 group mt-1"
        >
          <LogOut size={15} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-sm font-semibold">Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}
