import logoImg from './assets/logo.png';
import { useState } from "react";
import {
  Home, Package, User, LogOut, Moon, Sun,
  AlertTriangle, TrendingUp, TrendingDown,
  Dna, Droplets, BarChart3, Activity,
  Truck, CheckCircle, Shield, Zap,
  Bell, Settings, ChevronRight, MapPin,
  X, Key, Eye
} from "lucide-react";

/* ══════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════ */
const USER = {
  nom: "Hassan El Fassi", role: "Admin Fédéral",
  email: "h.elfassi@marocl.ma", initiales: "HF",
  region: "Siège · Rabat", dernConn: "Aujourd'hui à 08:14",
};

const REGIONS = [
  { nom:"Souss-Massa",          pct:82, doses:1240, statut:"alerte"   },
  { nom:"Casablanca-Settat",    pct:71, doses:980,  statut:"normal"   },
  { nom:"Béni Mellal-Khénifra", pct:64, doses:890,  statut:"normal"   },
  { nom:"Rabat-Salé-Kénitra",   pct:55, doses:760,  statut:"normal"   },
  { nom:"Marrakech-Safi",       pct:38, doses:520,  statut:"normal"   },
  { nom:"Laâyoune-Sakia",       pct:22, doses:310,  statut:"critique" },
];

const ACTIVITE = [
  { id:1, delta:"Il y a 8 min",  icon:Truck,         bg:"bg-blue-50 dark:bg-blue-900/60",    ring:"ring-blue-200 dark:ring-blue-800",    ic:"text-blue-600 dark:text-blue-400",    action:"Expédition envoyée",    detail:"500 doses Holstein → Coopérative Aït Si Salem", auteur:"Magasinier Benali" },
  { id:2, delta:"Il y a 42 min", icon:CheckCircle,   bg:"bg-emerald-50 dark:bg-emerald-900/60",ring:"ring-emerald-200 dark:ring-emerald-800",ic:"text-emerald-600 dark:text-emerald-400",action:"Réception validée",   detail:"1 000 doses Alta Genetics NL · CMD-891",        auteur:"Admin Fédéral"    },
  { id:3, delta:"Il y a 1h 20",  icon:AlertTriangle, bg:"bg-amber-50 dark:bg-amber-900/60",   ring:"ring-amber-200 dark:ring-amber-800",   ic:"text-amber-500 dark:text-amber-400",  action:"Dérogation accordée",  detail:"+100 doses · Unité Sakia Al Hamra",             auteur:"Admin Fédéral"    },
  { id:4, delta:"Il y a 2h 05",  icon:Zap,           bg:"bg-violet-50 dark:bg-violet-900/60", ring:"ring-violet-200 dark:ring-violet-800", ic:"text-violet-600 dark:text-violet-400",action:"Ordre prioritaire émis",detail:"Répartition Montbéliarde → Gharb Chrarda",       auteur:"Admin Fédéral"    },
  { id:5, delta:"Il y a 3h",     icon:Shield,        bg:"bg-slate-100 dark:bg-slate-700",     ring:"ring-slate-200 dark:ring-slate-600",   ic:"text-slate-500 dark:text-slate-400",  action:"PIN dérogation généré",detail:"Code 15 min · Sakia Al Hamra",                  auteur:"Admin Fédéral"    },
];

function barColor(pct, statut) {
  if (statut==="critique") return "bg-red-500";
  if (statut==="alerte"||pct>=80) return "bg-amber-400";
  if (pct>=60) return "bg-blue-500";
  return "bg-emerald-500";
}
function dotColor(statut) {
  return statut==="critique" ? "bg-red-500" : statut==="alerte" ? "bg-amber-400" : "bg-emerald-500";
}

/* ══════════════════════════════════════════════════════
   PROFIL DRAWER
══════════════════════════════════════════════════════ */
function ProfilDrawer({ dark, onToggleDark, onClose }) {
  const [showPw, setShowPw] = useState(false);
  const [oldPw,  setOldPw]  = useState("");
  const [newPw,  setNewPw]  = useState("");
  const [pwDone, setPwDone] = useState(false);

  function handlePw() {
    if (!oldPw || !newPw) return;
    setPwDone(true);
    setTimeout(() => { setPwDone(false); setShowPw(false); setOldPw(""); setNewPw(""); }, 1800);
  }

  const inp = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
    border-slate-200 bg-white text-slate-800 placeholder:text-slate-300
    dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl
        bg-white dark:bg-slate-800 transition-colors"
        onClick={e => e.stopPropagation()}
        style={{ animation:"slideUp .22s cubic-bezier(.32,0,.67,0) forwards" }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <span className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-600" />
        </div>

        {/* Header gradient */}
        <div className="relative px-6 pt-5 pb-6 bg-gradient-to-br from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800">
          <button onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
            <X size={16} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0">
              {USER.initiales}
            </div>
            <div>
              <p className="text-white font-bold text-base">{USER.nom}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full mt-1">
                <Shield size={9} /> {USER.role}
              </span>
              <p className="text-slate-400 text-xs mt-1">{USER.email}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-2">

          {[{ label:"Région / Poste", value:USER.region }, { label:"Dernière connexion", value:USER.dernConn }].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-400">{label}</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{value}</span>
            </div>
          ))}

          {/* Dark mode toggle */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-500" />}
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{dark ? "Mode clair" : "Mode sombre"}</p>
                <p className="text-[10px] text-slate-400">{dark ? "Passer en thème clair" : "Passer en thème sombre"}</p>
              </div>
            </div>
            <button onClick={onToggleDark} aria-label="Toggle dark mode"
              className={`relative inline-flex h-6 w-11 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                ${dark ? "bg-blue-600 border-blue-600" : "bg-slate-200 border-slate-200"}`}>
              <span className={`inline-block w-4 h-4 rounded-full bg-white shadow transition-transform mt-0.5
                ${dark ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* Password */}
          {!showPw ? (
            <button onClick={() => setShowPw(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all
                border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
              <Key size={14} className="text-slate-400" /> Changer mon mot de passe
            </button>
          ) : pwDone ? (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl border
              bg-emerald-50 border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-700">
              <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Mot de passe mis à jour !</span>
            </div>
          ) : (
            <div className="space-y-2 p-3 rounded-xl border bg-slate-50 border-slate-100 dark:bg-slate-700/50 dark:border-slate-600">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Changer le mot de passe</p>
              <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="Mot de passe actuel" className={inp} />
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Nouveau mot de passe" className={inp} />
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowPw(false); setOldPw(""); setNewPw(""); }}
                  className="px-3 py-1.5 text-xs border rounded-lg transition-colors border-slate-200 text-slate-500 hover:bg-white dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-600">Annuler</button>
                <button onClick={handlePw} disabled={!oldPw||!newPw}
                  className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Confirmer</button>
              </div>
            </div>
          )}

          {/* Logout */}
          <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors
            text-red-600 hover:bg-red-50 border border-red-100
            dark:text-red-400 dark:hover:bg-red-900/30 dark:border-red-900">
            <LogOut size={14} /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DASHBOARD DIRECTION
══════════════════════════════════════════════════════ */
function DashboardDirection() {
  const today = new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  /* ── KPI card style tokens ── */
  const card = "rounded-2xl border p-5 flex flex-col gap-3 transition-colors bg-white border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">MLAPP · Admin Fédéral</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Vue d'ensemble Nationale</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {today.charAt(0).toUpperCase() + today.slice(1)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto
          text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40
          border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Flux actif · 6 coopératives
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* Semences */}
        <div className={card}>
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/50"><img src={logoImg} alt="Logo" className="w-10 h-auto" /></div>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-emerald-600 bg-emerald-50 border border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-800">
              <TrendingUp size={9} /> +3.2%
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Stock Central Semences</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 leading-none">45 200</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">doses disponibles</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Niveau optimal</span>
          </div>
        </div>

        {/* Azote */}
        <div className={card}>
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/50"><Droplets size={20} className="text-cyan-600 dark:text-cyan-400" /></div>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-red-500 bg-red-50 border border-red-100 dark:text-red-400 dark:bg-red-900/40 dark:border-red-800">
              <TrendingDown size={9} /> −1.8%
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Stock Azote National</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 leading-none">8 500</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">litres disponibles</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Surveiller Cuve B</span>
          </div>
        </div>

        {/* Quota */}
        <div className={card}>
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/50"><BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400" /></div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-700">
              Mois en cours
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Consommation Quota National</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 leading-none">68%</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">alloué sur quota national</p>
          </div>
          <div>
            <div className="h-1.5 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900/60">
              <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width:"68%" }} />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">32% de quota restant</p>
          </div>
        </div>

        {/* Alertes — carte rouge pulsante */}
        <div className="rounded-2xl border p-5 flex flex-col gap-3 transition-colors bg-white border-red-100 shadow-sm shadow-red-50 dark:bg-slate-800 dark:border-red-900/60">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/40"><AlertTriangle size={20} className="text-red-500 dark:text-red-400" /></div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50">
              Action requise
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Alertes Critiques</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums mt-0.5 leading-none">3</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">lots sous le seuil minimum</p>
          </div>
          <div className="space-y-1">
            {["LOT-0044 · 14j restants","LOT-0048 · 7j restants"].map(l => (
              <div key={l} className="flex items-center gap-1.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" /> {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone centrale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Consommation régions */}
        <div className="rounded-2xl border overflow-hidden transition-colors bg-white border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-slate-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Consommation par Région</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Semences · Mois en cours</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[["bg-emerald-500","Normal"],["bg-amber-400","Alerte"],["bg-red-500","Critique"]].map(([c,l]) => (
                <span key={l} className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <span className={`w-2 h-2 rounded-sm ${c} inline-block`} /> {l}
                </span>
              ))}
            </div>
          </div>

          <div className="px-5 py-5 space-y-4">
            {REGIONS.map(r => (
              <div key={r.nom} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor(r.statut)}`} />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{r.nom}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">{r.doses.toLocaleString()} doses</span>
                    <span className={`text-xs font-bold tabular-nums w-9 text-right
                      ${r.statut==="critique" ? "text-red-600 dark:text-red-400"
                        : r.statut==="alerte" ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-700 dark:text-slate-200"}`}>
                      {r.pct}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                  <div className={`h-full rounded-full transition-all duration-700 ${barColor(r.pct, r.statut)}`}
                    style={{ width:`${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500">6 régions · Données J-1</span>
            <span className="text-xs font-semibold text-red-500 dark:text-red-400">1 critique · 1 alerte</span>
          </div>
        </div>

        {/* Activité en direct */}
        <div className="rounded-2xl border overflow-hidden transition-colors bg-white border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-slate-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Activité Logistique en Direct</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Dernières actions sur MLAPP</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Live
            </span>
          </div>

          <div className="px-5 py-5">
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-100 dark:bg-slate-700" />
              <div className="space-y-5">
                {ACTIVITE.map(evt => (
                  <div key={evt.id} className="relative flex gap-3.5 items-start">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-2 ${evt.bg} ${evt.ring}`}>
                      <evt.icon size={13} className={evt.ic} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{evt.action}</p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">{evt.delta}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{evt.detail}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{evt.auteur}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700">
            <button className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:opacity-75 transition-opacity">
              Voir l'historique complet <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Gestion des Quotas",    sub:"Admin Fédéral",   bg:"bg-blue-600   hover:bg-blue-700",   icon:BarChart3   },
          { label:"Centre de Validations", sub:"3 en attente",    bg:"bg-amber-500  hover:bg-amber-600",  icon:CheckCircle },
          { label:"Traçabilité",           sub:"Logs & Rapports", bg:"bg-slate-700  hover:bg-slate-800",  icon:Eye         },
          { label:"Configuration",         sub:"Super Admin",     bg:"bg-violet-700 hover:bg-violet-800", icon:Settings    },
        ].map(({ label, sub, bg, icon:Icon }) => (
          <button key={label} className={`${bg} text-white rounded-2xl p-4 flex flex-col gap-2.5 text-left transition-colors shadow-sm`}>
            <Icon size={18} className="text-white/80" />
            <div>
              <p className="text-xs font-bold leading-tight">{label}</p>
              <p className="text-[10px] text-white/60 mt-0.5">{sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   APP LAYOUT
══════════════════════════════════════════════════════ */
export default function AppLayout() {
  const [dark,       setDark]       = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [showProfil, setShowProfil] = useState(false);
  const [notifCount]                = useState(3);

  const NAV = [
    { id:"dashboard",  label:"Accueil",    Icon:Home    },
    { id:"operations", label:"Opérations", Icon:Package },
    { id:"profil",     label:"Profil",     Icon:User    },
  ];

  function handleNav(id) {
    if (id === "profil") { setShowProfil(true); return; }
    setActivePage(id);
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 font-sans">

        {showProfil && (
          <div className={dark ? "dark" : ""}>
            <ProfilDrawer dark={dark} onToggleDark={() => setDark(d=>!d)} onClose={() => setShowProfil(false)} />
          </div>
        )}

        {/* Top header */}
        <header className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-700 flex items-center justify-center">
                  <img src={logoImg} alt="Logo" className="w-10 h-auto" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">MLstock</p>
                  <p className="text-[10px] text-slate-400">MLAPP · ERP Laitier</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button onClick={() => setDark(d=>!d)}
                  className="p-2 rounded-xl transition-colors text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700">
                  {dark ? <Sun size={17} /> : <Moon size={17} />}
                </button>
                <button className="relative p-2 rounded-xl transition-colors text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700">
                  <Bell size={17} />
                  {notifCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">{notifCount}</span>
                  )}
                </button>
                <button onClick={() => setShowProfil(true)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                    {USER.initiales}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-none">{USER.nom}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{USER.role}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="pt-14">
          {activePage === "dashboard" && <DashboardDirection />}
          {activePage === "operations" && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 pb-28 text-center">
              <div className="rounded-2xl border py-16 bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700 transition-colors">
                <Package size={40} className="mx-auto mb-3 text-slate-200 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Module Opérations</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Sélectionnez une section depuis le menu</p>
              </div>
            </div>
          )}
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 transition-colors"
          style={{ boxShadow:"0 -4px 6px -1px rgba(0,0,0,.07)" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-stretch justify-around h-16">
              {NAV.map(({ id, label, Icon }) => {
                const active = activePage === id && id !== "profil";
                return (
                  <button key={id} onClick={() => handleNav(id)}
                    className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors
                      ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"}`}>
                    <div className={`p-1.5 rounded-xl transition-colors ${active ? "bg-blue-50 dark:bg-blue-900/50" : ""}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-semibold leading-none">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
