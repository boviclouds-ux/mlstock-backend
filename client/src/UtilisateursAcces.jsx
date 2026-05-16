// UtilisateursAcces.jsx — Gestion des comptes & sécurité · Section 5
// Règle ERP : On ne supprime jamais un compte — on suspend pour conserver la traçabilité.
import { useState, useEffect, useMemo } from "react";
import { api } from "./lib/api.js";
import Spinner from "./components/Spinner.jsx";
import {
  Users, UserCheck, UserPlus, Shield, ShieldOff,
  Ban, Key, CheckCircle, XCircle, X, Pencil,
  ChevronDown, MoreVertical, Mail, Calendar,
  Clock, Building2, AlertTriangle, Lock, Info,
} from "lucide-react";

/* ─── Référentiels ─────────────────────────────────────── */
const ROLES = [
  { key:"ADMIN_FEDERAL", label:"Admin Fédéral",    badge:"bg-violet-100 text-violet-700 border-violet-300" },
  { key:"ADMIN",         label:"Administrateur",   badge:"bg-indigo-100 text-indigo-700 border-indigo-300" },
  { key:"MAGASINIER",    label:"Magasinier",        badge:"bg-blue-100   text-blue-700   border-blue-300"   },
  { key:"UNITE",         label:"Responsable Unité", badge:"bg-emerald-100 text-emerald-700 border-emerald-300"},
];

// Entité par défaut pour les rôles administratifs / logistiques (non-Unité)
const HUB_CENTRAL = "Maroc Lait — Hub Central";
// Rôles rattachés automatiquement au Hub (pas de choix d'unité)
const isHubRole = (roleKey) => roleKey !== "UNITE";

/* ─── Helpers ──────────────────────────────────────────── */
function roleMeta(roleKey) {
  return ROLES.find(r => r.key === roleKey) ?? ROLES[2];
}

function nextUsrId(users) {
  const max = users.reduce((m, u) => Math.max(m, parseInt(u.id.split("-")[1] ?? "0", 10)), 0);
  return `USR-${String(max + 1).padStart(3, "0")}`;
}

function formatDate(dt) {
  if (!dt) return "—";
  const d = new Date(dt.replace(" ", "T"));
  const diff = Math.round((Date.now() - d) / 86400000);
  if (diff === 0) return "Aujourd'hui · " + dt.split(" ")[1];
  if (diff === 1) return "Hier";
  if (diff < 7)  return `Il y a ${diff}j`;
  return d.toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });
}

/* ─── Styles dark ──────────────────────────────────────── */
const lbl = "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";
const inp = "w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all";

/* ══════════════════════════════════════════════════════════
   MODAL CONFIRMATION GÉNÉRIQUE (suspend, reset pw)
══════════════════════════════════════════════════════════ */
function ModalConfirm({ icon: Icon, iconCls, titre, message, labelConfirm, btnCls, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${iconCls}`}>
          <Icon size={22}/>
        </div>
        <p className="text-sm font-bold text-white mb-2">{titre}</p>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-800 transition-all">Annuler</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-all ${btnCls}`}>{labelConfirm}</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL MODIFIER RÔLE
══════════════════════════════════════════════════════════ */
function ModalModifierRole({ user, unites, onClose, onSave }) {
  const firstUnite = unites[0]?.nom ?? "";

  const [roleKey, setRoleKey] = useState(user.roleKey);
  const [entite,  setEntite]  = useState(
    isHubRole(user.roleKey) ? HUB_CENTRAL : (user.entite ?? firstUnite)
  );

  function handleRoleChange(newKey) {
    setRoleKey(newKey);
    setEntite(isHubRole(newKey) ? HUB_CENTRAL : firstUnite);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">

        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Shield size={16} className="text-amber-400"/>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Modifier le rôle</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{user.prenom} {user.nom} · {user.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors mt-0.5"><X size={18}/></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={lbl}>Nouveau rôle</label>
            <div className="relative">
              <select value={roleKey} onChange={e => handleRoleChange(e.target.value)} className={`${inp} appearance-none`}>
                {ROLES.map(r => <option key={r.key} value={r.key} className="bg-slate-800">{r.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
            </div>
          </div>

          {/* Entité — verrouillée si rôle Hub, dropdown dynamique si Unité */}
          <div>
            <label className={lbl}>Entité rattachée</label>
            {isHubRole(roleKey) ? (
              <div className="flex items-center gap-2 bg-slate-800/30 border border-slate-700/50 rounded-xl px-3 py-2.5">
                <Building2 size={13} className="text-slate-600 shrink-0"/>
                <span className="text-sm text-slate-500 flex-1">{HUB_CENTRAL}</span>
                <Lock size={11} className="text-slate-600 shrink-0"/>
              </div>
            ) : (
              <div className="relative">
                <select value={entite} onChange={e => setEntite(e.target.value)} className={`${inp} appearance-none`} disabled={unites.length === 0}>
                  {unites.length === 0 ? (
                    <option value="" className="bg-slate-800">Chargement des unités…</option>
                  ) : (
                    unites.map(u => (
                      <option key={u._id} value={u.nom} className="bg-slate-800">
                        {u.nom}{u.region ? ` · ${u.region}` : ""}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
              </div>
            )}
            {isHubRole(roleKey) && (
              <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-slate-500 leading-snug">
                <Info size={10} className="shrink-0 mt-0.5"/>
                Le personnel administratif et logistique est rattaché par défaut au siège national.
              </p>
            )}
            {!isHubRole(roleKey) && unites.length === 0 && (
              <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-400 leading-snug">
                <AlertTriangle size={10} className="shrink-0 mt-0.5"/>
                Aucune unité dans la base. Créez d'abord une unité dans Réseau & Acteurs.
              </p>
            )}
          </div>

          {roleKey === "ADMIN_FEDERAL" && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
              <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5"/>
              <p className="text-[11px] text-amber-300 leading-relaxed">Ce rôle accorde un accès complet au système, incluant les données sensibles et les ordres de validation.</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-800 transition-all">Annuler</button>
          <button onClick={() => { onSave(user.id, roleKey, entite); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all">
            Enregistrer les droits
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL NOUVEL UTILISATEUR
══════════════════════════════════════════════════════════ */
function ModalNouvelUtilisateur({ unites, onClose, onSave }) {
  const firstUnite = unites[0]?.nom ?? "";

  const [prenom,  setPrenom]  = useState("");
  const [nom,     setNom]     = useState("");
  const [email,   setEmail]   = useState("");
  const [roleKey, setRoleKey] = useState("MAGASINIER");
  const [entite,  setEntite]  = useState(firstUnite);

  const hubRole      = isHubRole(roleKey);
  const entiteFinale = hubRole ? HUB_CENTRAL : entite;

  function handleRoleChange(newKey) {
    setRoleKey(newKey);
    if (!isHubRole(newKey)) setEntite(firstUnite);
  }

  const valid = prenom.trim() && nom.trim() && email.includes("@");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg">

        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <UserPlus size={16} className="text-emerald-400"/>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Nouvel Utilisateur</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Création de compte avec accès immédiat</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors mt-0.5"><X size={18}/></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Prénom <span className="text-red-500">*</span></label>
              <input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="ex: Karim" className={inp}/>
            </div>
            <div>
              <label className={lbl}>Nom <span className="text-red-500">*</span></label>
              <input value={nom} onChange={e => setNom(e.target.value)} placeholder="ex: Benali" className={inp}/>
            </div>
          </div>
          <div>
            <label className={lbl}>Email professionnel <span className="text-red-500">*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ex: k.benali@marocl.ma" className={inp}/>
          </div>
          {/* Rôle */}
          <div>
            <label className={lbl}>Rôle</label>
            <div className="relative">
              <select value={roleKey} onChange={e => handleRoleChange(e.target.value)} className={`${inp} appearance-none`}>
                {ROLES.map(r => <option key={r.key} value={r.key} className="bg-slate-800">{r.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
            </div>
          </div>

          {/* Entité — verrouillée si rôle Hub, dropdown actif si Unité */}
          <div>
            <label className={lbl}>Entité rattachée</label>
            {hubRole ? (
              <div className="flex items-center gap-2 bg-slate-800/30 border border-slate-700/50 rounded-xl px-3 py-2.5">
                <Building2 size={13} className="text-slate-600 shrink-0"/>
                <span className="text-sm text-slate-500 flex-1">{HUB_CENTRAL}</span>
                <Lock size={11} className="text-slate-600 shrink-0"/>
              </div>
            ) : (
              <div className="relative">
                <select value={entite} onChange={e => setEntite(e.target.value)} className={`${inp} appearance-none`} disabled={unites.length === 0}>
                  {unites.length === 0 ? (
                    <option value="" className="bg-slate-800">Aucune unité disponible</option>
                  ) : (
                    unites.map(u => (
                      <option key={u._id} value={u.nom} className="bg-slate-800">
                        {u.nom}{u.region ? ` · ${u.region}` : ""}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
              </div>
            )}
            {hubRole && (
              <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-slate-500 leading-snug">
                <Info size={10} className="shrink-0 mt-0.5"/>
                Le personnel administratif et logistique est rattaché par défaut au siège national.
              </p>
            )}
            {!hubRole && unites.length === 0 && (
              <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-400 leading-snug">
                <AlertTriangle size={10} className="shrink-0 mt-0.5"/>
                Aucune unité dans la base. Créez d'abord une unité dans Réseau & Acteurs.
              </p>
            )}
          </div>
          <div className="flex items-start gap-2 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5">
            <Lock size={12} className="text-slate-500 shrink-0 mt-0.5"/>
            <p className="text-[11px] text-slate-400 leading-relaxed">Un email d'invitation avec un lien de définition de mot de passe sera envoyé automatiquement.</p>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-800 transition-all">Annuler</button>
          <button onClick={() => { if (valid) { onSave({ prenom, nom, email, roleKey, entite: entiteFinale }); onClose(); } }}
            disabled={!valid}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all">
            <UserPlus size={13}/> Créer le compte
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DROPDOWN ACTIONS (par ligne utilisateur)
══════════════════════════════════════════════════════════ */
function DropdownActions({ user, isOpen, onToggle, onModifierRole, onResetPw, onSuspend }) {
  return (
    <div className="relative shrink-0">
      <button
        onClick={e => { e.stopPropagation(); onToggle(); }}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 border border-transparent hover:border-slate-200 transition-all"
      >
        <MoreVertical size={14}/>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-9 w-52 bg-white rounded-xl border border-slate-200 shadow-xl z-30 overflow-hidden">
          <button
            onClick={() => { onModifierRole(); onToggle(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Shield size={13} className="text-amber-500"/> Modifier le rôle
          </button>
          <button
            onClick={() => { onResetPw(); onToggle(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Key size={13} className="text-blue-500"/> Forcer réinit. mot de passe
          </button>
          <div className="border-t border-slate-100"/>
          <button
            onClick={() => { onSuspend(); onToggle(); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors
              ${user.statut === "suspendu"
                ? "text-emerald-700 hover:bg-emerald-50"
                : "text-red-600 hover:bg-red-50"}`}
          >
            {user.statut === "suspendu"
              ? <><CheckCircle size={13}/> Réactiver le compte</>
              : <><Ban size={13}/> Suspendre le compte</>}
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function UtilisateursAcces({ userRole }) {
  const [activeTab,      setActiveTab]      = useState("annuaire");
  const [users,          setUsers]          = useState([]);
  const [demandes,       setDemandes]       = useState([]);
  const [unites,         setUnites]         = useState([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [error,          setError]          = useState(null);
  const [apiError,       setApiError]       = useState(null);  // erreurs mutations
  const [openMenuId,     setOpenMenuId]     = useState(null);
  const [modalAdd,       setModalAdd]       = useState(false);
  const [modalRole,      setModalRole]      = useState(null);
  const [modalResetPw,   setModalResetPw]   = useState(null);
  const [modalSuspend,   setModalSuspend]   = useState(null);
  const [modalRejet,     setModalRejet]     = useState(null);
  const [recherche,      setRecherche]      = useState("");

  const isAdmin = userRole === "ADMIN_FEDERAL";

  /* ─ Chargement initial ─ */
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      api.get("/api/users"),
      api.get("/api/users/demandes"),
      api.get("/api/unites?actif=true").catch(() => []),
    ])
      .then(([usersData, demandesData, unitesData]) => {
        if (cancelled) return;
        setUsers(Array.isArray(usersData) ? usersData : []);
        setDemandes(Array.isArray(demandesData) ? demandesData : []);
        setUnites(Array.isArray(unitesData) ? unitesData : []);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message ?? "Impossible de charger les utilisateurs.");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, []);

  /* ─ Filtrage ─ */
  const filteredUsers = useMemo(() => {
    const q = recherche.toLowerCase();
    return q
      ? users.filter(u => `${u.prenom} ${u.nom} ${u.email} ${u.entite}`.toLowerCase().includes(q))
      : users;
  }, [users, recherche]);

  /* ─ Mutations utilisateurs ─ */
  function handleAddUser({ prenom, nom, email, roleKey, entite }) {
    const optimistic = {
      id: nextUsrId(users), prenom, nom, email, roleKey, entite,
      derniereConnexion: null, statut: "actif", mfa: false,
    };
    setUsers(prev => [optimistic, ...prev]);
    api.post("/api/users", { prenom, nom, email, roleKey, entite })
      .catch(err => setApiError(err.message ?? "Erreur lors de la création du compte."));
  }

  function handleModifierRole(userId, newRoleKey, newEntite) {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, roleKey: newRoleKey, entite: newEntite } : u
    ));
    api.patch(`/api/users/${userId}/role`, { roleKey: newRoleKey, entite: newEntite })
      .catch(err => setApiError(err.message ?? "Erreur lors de la modification du rôle."));
  }

  function handleToggleSuspend(userId) {
    const user = users.find(u => u.id === userId);
    const newStatut = user?.statut === "suspendu" ? "actif" : "suspendu";
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, statut: newStatut } : u
    ));
    api.patch(`/api/users/${userId}/statut`, { statut: newStatut })
      .catch(err => setApiError(err.message ?? "Erreur lors du changement de statut."));
  }

  /* ─ Mutations demandes ─ */
  function handleApprouver(demande) {
    const roleKey = ROLES.find(r => r.label === demande.roleDemande)?.key ?? "UNITE";
    const optimistic = {
      id: nextUsrId(users), prenom: demande.prenom, nom: demande.nom,
      email: demande.email, roleKey, entite: demande.entite,
      derniereConnexion: null, statut: "actif", mfa: false,
    };
    setUsers(prev => [optimistic, ...prev]);
    setDemandes(prev => prev.filter(d => d.id !== demande.id));
    api.post(`/api/users/demandes/${demande.id}/approve`, {})
      .catch(err => setApiError(err.message ?? "Erreur lors de l'approbation."));
  }

  function handleRejeter(demandeId) {
    setDemandes(prev => prev.filter(d => d.id !== demandeId));
    api.del(`/api/users/demandes/${demandeId}`)
      .catch(err => setApiError(err.message ?? "Erreur lors du rejet."));
  }

  /* ─ Stats ─ */
  const nbActifs    = users.filter(u => u.statut === "actif").length;
  const nbSuspendus = users.filter(u => u.statut === "suspendu").length;

  const hdrCls = "px-5 py-3 bg-slate-50 border-b border-slate-100";
  const hdr    = "text-[10px] font-bold text-slate-500 uppercase tracking-wider";
  const rowCls = "px-5 py-3.5 hover:bg-slate-50/60 transition-colors";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-800 h-36 animate-pulse" />
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm h-64 animate-pulse" />
        <div className="flex justify-center pt-4">
          <Spinner label="Chargement des utilisateurs…" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <div className="p-4 rounded-full bg-red-50 border border-red-100 mb-4">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 mb-1">Impossible de charger les utilisateurs</h2>
        <p className="text-xs text-slate-500 mb-5 max-w-xs leading-relaxed">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          <Key size={13} /> Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" onClick={() => openMenuId && setOpenMenuId(null)}>

      {/* Bannière erreur mutations */}
      {apiError && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle size={14} className="shrink-0" />
            {apiError}
          </div>
          <button onClick={() => setApiError(null)} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* En-tête dark */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-5 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Users size={16} className="text-white"/>
              </div>
              <p className="text-base font-bold leading-none">Utilisateurs & Accès</p>
            </div>
            <p className="text-xs text-slate-400 ml-10">Annuaire sécurisé · Gestion IAM · {users.length} comptes</p>
          </div>

          {isAdmin && (
            <button
              onClick={e => { e.stopPropagation(); setModalAdd(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all shrink-0"
            >
              <UserPlus size={13}/> Nouvel Utilisateur
            </button>
          )}
        </div>

        {/* Stats + Onglets */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key:"annuaire",  label:"Annuaire Actif",     Icon:UserCheck,  count:users.length    },
              { key:"demandes",  label:"Demandes",            Icon:UserPlus,   count:demandes.length },
            ].map(({ key, label, Icon, count }) => (
              <button key={key} onClick={() => { setActiveTab(key); setRecherche(""); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
                  ${activeTab === key
                    ? "bg-white/15 text-white border border-white/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"}`}>
                <Icon size={13}/>
                {label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums
                    ${key === "demandes" && count > 0
                      ? "bg-amber-500/30 text-amber-300"
                      : activeTab === key ? "text-slate-300" : "text-slate-600"}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {[
              { label:"Actifs",    val:nbActifs,    cls:"text-emerald-300" },
              { label:"Suspendus", val:nbSuspendus, cls:"text-red-300"     },
              { label:"En attente",val:demandes.length, cls:"text-amber-300" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-xl px-3 py-1.5 text-center min-w-16">
                <p className={`text-lg font-bold tabular-nums ${s.cls}`}>{s.val}</p>
                <p className="text-[9px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ONGLET ANNUAIRE ──────────────────────────────── */}
      {activeTab === "annuaire" && (
        <>
          {/* Recherche */}
          <div className="relative">
            <Users size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher par nom, email, entité…"
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"/>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full"><div className="min-w-[600px]">
            <div className={`grid grid-cols-[1.5fr_0.9fr_1.1fr_1fr_0.9fr_auto] gap-3 ${hdrCls}`}>
              {["Utilisateur","Rôle","Entité","Dernière connexion","Statut",""].map(h => <p key={h} className={hdr}>{h}</p>)}
            </div>

            <div className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <div className="py-14 text-center">
                  <Users size={32} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-sm font-medium text-slate-400">
                    {recherche
                      ? `Aucun résultat pour « ${recherche} »`
                      : "Aucun utilisateur enregistré pour le moment"}
                  </p>
                  {!recherche && <p className="text-xs text-slate-300 mt-1">Les comptes apparaîtront ici dès leur création.</p>}
                </div>
              ) : filteredUsers.map(user => {
                const role    = roleMeta(user.roleKey);
                const isActif = user.statut === "actif";
                return (
                  <div key={user.id}
                    className={`grid grid-cols-[1.5fr_0.9fr_1.1fr_1fr_0.9fr_auto] gap-3 items-center ${rowCls}
                      ${!isActif ? "opacity-60 bg-slate-50/80" : ""}`}
                    onClick={e => e.stopPropagation()}>

                    {/* Utilisateur */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0
                          ${user.roleKey === "ADMIN_FEDERAL" ? "bg-violet-500" :
                            user.roleKey === "ADMIN"          ? "bg-indigo-500" :
                            user.roleKey === "MAGASINIER"     ? "bg-blue-500"   : "bg-emerald-500"}`}>
                          {user.prenom[0]}{user.nom[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{user.prenom} {user.nom}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Mail size={9} className="text-slate-400 shrink-0"/>
                            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-9">
                        <span className="text-[9px] font-mono text-slate-400">{user.id}</span>
                        {user.mfa && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full">
                            <Shield size={8}/> MFA
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rôle */}
                    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${role.badge}`}>
                      {role.label}
                    </span>

                    {/* Entité */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-0">
                      <Building2 size={10} className="text-slate-400 shrink-0"/>
                      <span className="truncate">{user.entite}</span>
                    </div>

                    {/* Dernière connexion */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock size={10} className="text-slate-400 shrink-0"/>
                      {formatDate(user.derniereConnexion)}
                    </div>

                    {/* Statut */}
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full
                      ${isActif ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActif ? "bg-emerald-500" : "bg-red-500"}`}/>
                      {isActif ? "Actif" : "Suspendu"}
                    </span>

                    {/* Actions */}
                    {isAdmin ? (
                      <DropdownActions
                        user={user}
                        isOpen={openMenuId === user.id}
                        onToggle={() => setOpenMenuId(prev => prev === user.id ? null : user.id)}
                        onModifierRole={() => setModalRole(user)}
                        onResetPw={() => setModalResetPw(user)}
                        onSuspend={() => setModalSuspend(user)}
                      />
                    ) : <span className="w-7 h-7"/>}
                  </div>
                );
              })}
            </div>

            </div></div>
            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100">
              <p className="text-[11px] text-slate-400">
                {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? "s" : ""}
                {recherche ? ` · filtrés sur ${users.length}` : ""}
                {" · "}<span className="text-slate-500 italic">Les comptes ne sont jamais supprimés — suspension uniquement.</span>
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── ONGLET DEMANDES ─────────────────────────────── */}
      {activeTab === "demandes" && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-x-auto">
          {demandes.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle size={28} className="text-emerald-300 mx-auto mb-3"/>
              <p className="text-sm font-semibold text-slate-500">Aucune demande en attente</p>
              <p className="text-xs text-slate-400 mt-1">Toutes les inscriptions ont été traitées.</p>
            </div>
          ) : (
            <>
              <div className={`grid grid-cols-[0.7fr_1.4fr_1.4fr_1fr_1fr_auto] gap-3 ${hdrCls}`}>
                {["Date","Demandeur","Email","Rôle demandé","Entité","Actions"].map(h => <p key={h} className={hdr}>{h}</p>)}
              </div>
              <div className="divide-y divide-slate-50">
                {demandes.map(d => (
                  <div key={d.id} className={`grid grid-cols-[0.7fr_1.4fr_1.4fr_1fr_1fr_auto] gap-3 items-center ${rowCls}`}>

                    <div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Calendar size={10} className="text-slate-400 shrink-0"/>
                        {new Date(d.date).toLocaleDateString("fr-FR", { day:"2-digit", month:"short" })}
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{d.id}</p>
                    </div>

                    <p className="text-xs font-semibold text-slate-800">{d.prenom} {d.nom}</p>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
                      <Mail size={10} className="text-slate-400 shrink-0"/>
                      <span className="truncate">{d.email}</span>
                    </div>

                    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border
                      ${ROLES.find(r => r.label === d.roleDemande)?.badge ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {d.roleDemande}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-0">
                      <Building2 size={10} className="text-slate-400 shrink-0"/>
                      <span className="truncate">{d.entite}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleApprouver(d)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100 transition-all">
                        <CheckCircle size={12}/> Approuver
                      </button>
                      <button onClick={() => setModalRejet(d)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold hover:bg-red-100 transition-all">
                        <XCircle size={12}/> Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-2.5 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
                <AlertTriangle size={11} className="text-amber-500"/>
                <p className="text-[11px] text-amber-700 font-semibold">
                  {demandes.length} demande{demandes.length > 1 ? "s" : ""} en attente d'approbation
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Modals ──────────────────────────────────────── */}
      {modalAdd && (
        <ModalNouvelUtilisateur
          unites={unites}
          onClose={() => setModalAdd(false)}
          onSave={handleAddUser}
        />
      )}
      {modalRole && (
        <ModalModifierRole
          user={modalRole}
          unites={unites}
          onClose={() => setModalRole(null)}
          onSave={handleModifierRole}
        />
      )}
      {modalResetPw && (
        <ModalConfirm
          icon={Key}
          iconCls="bg-blue-500/15 border border-blue-500/30 text-blue-400"
          titre="Forcer la réinitialisation ?"
          message={`Un email de réinitialisation sécurisé sera envoyé à ${modalResetPw.email}. Le compte restera actif jusqu'au changement effectif.`}
          labelConfirm="Envoyer le lien"
          btnCls="bg-blue-600 hover:bg-blue-500"
          onClose={() => setModalResetPw(null)}
          onConfirm={() => {}}
        />
      )}
      {modalSuspend && (
        <ModalConfirm
          icon={modalSuspend.statut === "suspendu" ? CheckCircle : Ban}
          iconCls={modalSuspend.statut === "suspendu"
            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
            : "bg-red-500/15 border border-red-500/30 text-red-400"}
          titre={modalSuspend.statut === "suspendu" ? "Réactiver le compte ?" : "Suspendre le compte ?"}
          message={modalSuspend.statut === "suspendu"
            ? `${modalSuspend.prenom} ${modalSuspend.nom} retrouvera l'accès complet au système.`
            : `${modalSuspend.prenom} ${modalSuspend.nom} ne pourra plus se connecter. Le compte et son historique sont conservés.`}
          labelConfirm={modalSuspend.statut === "suspendu" ? "Réactiver" : "Suspendre"}
          btnCls={modalSuspend.statut === "suspendu" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"}
          onClose={() => setModalSuspend(null)}
          onConfirm={() => handleToggleSuspend(modalSuspend.id)}
        />
      )}
      {modalRejet && (
        <ModalConfirm
          icon={XCircle}
          iconCls="bg-red-500/15 border border-red-500/30 text-red-400"
          titre="Rejeter la demande ?"
          message={`La demande de ${modalRejet.prenom} ${modalRejet.nom} sera refusée. Un email de notification lui sera envoyé.`}
          labelConfirm="Rejeter la demande"
          btnCls="bg-red-600 hover:bg-red-500"
          onClose={() => setModalRejet(null)}
          onConfirm={() => handleRejeter(modalRejet.id)}
        />
      )}
    </div>
  );
}
