// DashboardMagasinier.jsx — Vue d'ensemble Hub Central pour le rôle Magasinier
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./lib/api";
import {
  Snowflake, Layers, Package, AlertTriangle, CheckCircle,
  ClipboardList, Send, Truck, RefreshCw, Zap, Dna,
  FlaskConical, Wrench, Clock, ChevronRight, Shield,
} from "lucide-react";
import Spinner from "./components/Spinner.jsx";

/* ─── Données statiques cuves (pas encore d'endpoint /api/cuves) ── */
const CUVES = [
  { id:"A", label:"Cuve A-01", desc:"Multi-races · Holstein, Montbéliarde", volume:800,  capacite:1000, temp:-196, statut:"ok"       },
  { id:"B", label:"Cuve B-02", desc:"Remplissage en cours",                 volume:150,  capacite:1000, temp:-194, statut:"critique"  },
  { id:"C", label:"Cuve C-03", desc:"Multi-races · Normande, Pie Rouge",    volume:620,  capacite:1000, temp:-196, statut:"ok"        },
  { id:"D", label:"Cuve D-04", desc:"Lots en attente validation Admin",     volume:380,  capacite:1000, temp:-195, statut:"alerte"    },
];

const LOTS_ALERTE = [
  { id:"LOT-2025-0044", article:"Prim'Holstein – JACKPOT",  jours:14, type:"semence"  },
  { id:"LOT-2025-0043", article:"Normande – OLIVIER ET",    jours:36, type:"semence"  },
  { id:"LOT-2025-0048", article:"Gants insémination",        jours:7,  type:"materiel" },
];

function typeIcon(type) {
  if (type === "semence")  return <Dna size={11} className="text-blue-400 shrink-0" />;
  if (type === "azote")    return <FlaskConical size={11} className="text-cyan-500 shrink-0" />;
  return <Wrench size={11} className="text-gray-400 shrink-0" />;
}

const STATUT_UI = {
  'En attente': { label:'À préparer',     bg:'bg-blue-50',    text:'text-blue-700',    dot:'bg-blue-500'    },
  'Validé':     { label:'Prêt au départ', bg:'bg-emerald-50', text:'text-emerald-700', dot:'bg-emerald-500'  },
  'Brouillon':  { label:'Brouillon',      bg:'bg-gray-50',    text:'text-gray-600',    dot:'bg-gray-400'    },
};

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function DashboardMagasinier() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday:"long", day:"numeric", month:"long", year:"numeric"
  });

  const [commandes,  setCommandes]  = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    api.get("/api/transactions?limit=20")
      .then(res => {
        const list = Array.isArray(res) ? res : (res.data ?? []);
        setCommandes(list.filter(t => ['EXPEDITION','ORDRE_ADMIN'].includes(t.type)));
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  /* ── KPIs ─────────────────────────────────────────────── */
  const enAttente  = commandes.filter(c => c.statut === 'En attente' || c.statut === 'Brouillon').length;
  const prets      = commandes.filter(c => c.statut === 'Validé').length;
  const cuvesOk    = CUVES.filter(c => c.statut === "ok").length;
  const cuvesAlert = CUVES.filter(c => c.statut !== "ok").length;
  const totalLots  = 8; // à remplacer par count API quand /api/lots sera disponible

  const card = "rounded-2xl border bg-white border-slate-100 shadow-sm p-5 flex flex-col gap-3";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded-xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm h-52 animate-pulse" />
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm h-52 animate-pulse" />
        </div>
        <div className="flex justify-center pt-2">
          <Spinner label="Chargement du tableau de bord…" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── En-tête ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Hub Central · Magasinier</p>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Vue d'ensemble Opérationnelle</h1>
          <p className="text-sm text-slate-500 mt-0.5">{today.charAt(0).toUpperCase() + today.slice(1)}</p>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold
          text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Hub actif · {CUVES.length} cuves
        </div>
      </div>

      {/* Bannière erreur API (non bloquante) */}
      {error && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
          <AlertTriangle size={13} className="shrink-0" />
          Synchronisation partielle — {error}
        </div>
      )}

      {/* ── KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Lots actifs */}
        <div className={card}>
          <div className="p-2.5 rounded-xl bg-blue-50 w-fit">
            <Layers size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Lots en stock</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5 leading-none">{totalLots}</p>
            <p className="text-xs text-slate-400 mt-0.5">lots actifs recensés</p>
          </div>
          <button onClick={() => navigate('/magasinier')}
            className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:opacity-75 transition-opacity">
            Voir registre <ChevronRight size={10} />
          </button>
        </div>

        {/* Cuves */}
        <div className={cuvesAlert > 0
          ? "rounded-2xl border bg-white border-amber-200 shadow-sm shadow-amber-50 p-5 flex flex-col gap-3"
          : card}>
          <div className={`p-2.5 rounded-xl w-fit ${cuvesAlert > 0 ? "bg-amber-50" : "bg-cyan-50"}`}>
            <Snowflake size={20} className={cuvesAlert > 0 ? "text-amber-500" : "text-cyan-600"} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Cuves d'azote</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5 leading-none">{CUVES.length}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-emerald-600 font-semibold">{cuvesOk} OK</span>
              {cuvesAlert > 0 && (
                <span className="text-xs text-amber-600 font-semibold">{cuvesAlert} alerte{cuvesAlert > 1 ? "s" : ""}</span>
              )}
            </div>
          </div>
          <button onClick={() => navigate('/magasinier')}
            className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:opacity-75 transition-opacity">
            Gérer les cuves <ChevronRight size={10} />
          </button>
        </div>

        {/* Ordres en attente */}
        <div className={enAttente > 0
          ? "rounded-2xl border bg-white border-blue-100 shadow-sm p-5 flex flex-col gap-3"
          : card}>
          <div className="p-2.5 rounded-xl bg-indigo-50 w-fit">
            <Package size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Ordres à traiter</p>
            <p className={`text-2xl font-bold tabular-nums mt-0.5 leading-none ${enAttente > 0 ? "text-blue-600" : "text-slate-900"}`}>
              {enAttente}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{prets} prêt{prets > 1 ? "s" : ""} au départ</p>
          </div>
          <button onClick={() => navigate('/expeditions')}
            className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:opacity-75 transition-opacity">
            Voir expéditions <ChevronRight size={10} />
          </button>
        </div>

        {/* Alertes péremption */}
        <div className={LOTS_ALERTE.length > 0
          ? "rounded-2xl border bg-white border-red-100 shadow-sm shadow-red-50 p-5 flex flex-col gap-3"
          : card}>
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-red-50 w-fit">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            {LOTS_ALERTE.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse text-red-600 bg-red-100">
                Action requise
              </span>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Lots proches péremption</p>
            <p className="text-2xl font-bold text-red-600 tabular-nums mt-0.5 leading-none">{LOTS_ALERTE.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">dans les 45 prochains jours</p>
          </div>
          <button onClick={() => navigate('/magasinier')}
            className="flex items-center gap-1 text-[10px] font-semibold text-red-500 hover:opacity-75 transition-opacity">
            Voir registre <ChevronRight size={10} />
          </button>
        </div>
      </div>

      {/* ── Zone centrale ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* État des cuves */}
        <div className="rounded-2xl border bg-white border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Snowflake size={14} className="text-slate-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-800">Cuves d'Azote — État Temps Réel</h2>
                <p className="text-xs text-slate-400 mt-0.5">Cible : −196°C</p>
              </div>
            </div>
          </div>
          <div className="px-5 py-5 space-y-3">
            {CUVES.map(c => {
              const pct    = Math.round((c.volume / c.capacite) * 100);
              const isCrit = c.statut === "critique";
              const isAl   = c.statut === "alerte";
              const barC   = isCrit ? "bg-red-500" : isAl ? "bg-amber-400" : "bg-cyan-500";
              const textC  = isCrit ? "text-red-600" : isAl ? "text-amber-600" : "text-slate-700";
              return (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isCrit ? "bg-red-500 animate-pulse" : isAl ? "bg-amber-400" : "bg-emerald-500"}`} />
                      <span className="text-xs font-semibold text-slate-700">{c.label}</span>
                      {(isCrit || isAl) && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isCrit ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                          {isCrit ? "CRITIQUE" : "ALERTE"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{c.temp}°C</span>
                      <span className={`font-bold tabular-nums ${textC}`}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-slate-100">
                    <div className={`h-full rounded-full transition-all duration-700 ${barC}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400">{c.volume.toLocaleString()} / {c.capacite.toLocaleString()} L · {c.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-slate-100">
            <button onClick={() => navigate('/magasinier')}
              className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-blue-600 hover:opacity-75 transition-opacity">
              Gérer la chambre froide <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Ordres urgents + alertes péremption */}
        <div className="flex flex-col gap-4">

          {/* Ordres à traiter */}
          <div className="rounded-2xl border bg-white border-slate-100 shadow-sm overflow-hidden flex-1">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={14} className="text-slate-400" />
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Ordres en Attente</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Derniers ordres actifs</p>
                </div>
              </div>
              {isLoading && <RefreshCw size={12} className="text-slate-400 animate-spin" />}
            </div>
            <div className="px-5 py-3 space-y-2.5">
              {commandes.filter(c => ['En attente','Brouillon','Validé'].includes(c.statut)).slice(0, 3).length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle size={24} className="mx-auto mb-2 text-emerald-300" />
                  <p className="text-xs font-medium text-slate-400">Aucun ordre en attente</p>
                  <p className="text-[10px] text-slate-300 mt-1">Toutes les expéditions sont traitées.</p>
                </div>
              ) : (
                commandes.filter(c => ['En attente','Brouillon','Validé'].includes(c.statut)).slice(0, 3).map(cmd => {
                  const sm = STATUT_UI[cmd.statut] ?? { label: cmd.statut, bg:'bg-gray-50', text:'text-gray-600', dot:'bg-gray-400' };
                  return (
                    <div key={cmd._id ?? cmd.reference} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {cmd.type === 'ORDRE_ADMIN'
                            ? <Zap size={11} className="text-violet-500 shrink-0" />
                            : <Truck size={11} className="text-blue-400 shrink-0" />}
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {cmd.uniteCible?.nom ?? 'Destination inconnue'}
                          </p>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{cmd.reference}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${sm.bg} ${sm.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                        {sm.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="px-5 py-3 border-t border-slate-100">
              <button onClick={() => navigate('/expeditions')}
                className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-blue-600 hover:opacity-75 transition-opacity">
                Gérer toutes les expéditions <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Alertes péremption */}
          <div className="rounded-2xl border bg-white border-red-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-red-50 flex items-center gap-2">
              <AlertTriangle size={13} className="text-red-400" />
              <h2 className="text-sm font-bold text-slate-800">Lots proches péremption</h2>
            </div>
            <div className="px-5 py-3 space-y-2">
              {LOTS_ALERTE.map(l => (
                <div key={l.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {typeIcon(l.type)}
                    <span className="text-xs text-slate-700 truncate">{l.article}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Clock size={10} className="text-slate-400" />
                    <span className={`text-xs font-bold tabular-nums ${l.jours <= 14 ? "text-red-600" : "text-amber-600"}`}>
                      {l.jours}j
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Accès rapides ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Chambre Froide & Lots",  sub:"Cuves · Registre", bg:"bg-cyan-600 hover:bg-cyan-700",    icon:Snowflake,     path:"/magasinier"       },
          { label:"Quai d'Expédition",      sub:`${enAttente} à traiter`, bg:"bg-blue-600 hover:bg-blue-700",    icon:Send,          path:"/expeditions"      },
          { label:"Réceptions",             sub:"Entrées stock",    bg:"bg-slate-700 hover:bg-slate-800",  icon:ClipboardList, path:"/receptions"       },
          { label:"Approvisionnements",     sub:"Fournisseurs",     bg:"bg-indigo-700 hover:bg-indigo-800",icon:Truck,         path:"/approvisionnements"},
        ].map(({ label, sub, bg, icon: Icon, path }) => (
          <button key={path} onClick={() => navigate(path)}
            className={`${bg} text-white rounded-2xl p-4 flex flex-col gap-2.5 text-left transition-colors shadow-sm`}>
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
