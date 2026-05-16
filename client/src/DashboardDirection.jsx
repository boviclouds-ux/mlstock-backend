import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dna, Droplets, BarChart3, AlertTriangle, Activity,
  TrendingUp, TrendingDown, MapPin, ChevronRight,
  Truck, CheckCircle, Shield, Zap, Eye, Settings, RefreshCw,
  Package
} from "lucide-react";
import Spinner from "./components/Spinner.jsx";
import { api } from "./lib/api.js";

// Seuils d'alerte — configuration métier (à terme depuis /api/config)
const SEUILS = { semences: 5000, azote: 2000 };

// Mapping type API → style visuel pour la timeline d'activité
const ACTIVITE_STYLE = {
  EXPEDITION: { Icon:Truck,         bg:"bg-blue-50 dark:bg-blue-900/60",    ring:"ring-blue-200 dark:ring-blue-800",    ic:"text-blue-600 dark:text-blue-400"    },
  RECEPTION:  { Icon:CheckCircle,   bg:"bg-emerald-50 dark:bg-emerald-900/60",ring:"ring-emerald-200 dark:ring-emerald-800",ic:"text-emerald-600 dark:text-emerald-400" },
  DEROGATION: { Icon:AlertTriangle, bg:"bg-amber-50 dark:bg-amber-900/60",   ring:"ring-amber-200 dark:ring-amber-800",   ic:"text-amber-500 dark:text-amber-400"   },
  ORDRE:      { Icon:Zap,           bg:"bg-violet-50 dark:bg-violet-900/60", ring:"ring-violet-200 dark:ring-violet-800", ic:"text-violet-600 dark:text-violet-400"  },
  PIN:        { Icon:Shield,        bg:"bg-slate-100 dark:bg-slate-700",     ring:"ring-slate-200 dark:ring-slate-600",   ic:"text-slate-500 dark:text-slate-400"   },
};

function enrichActivite(evt) {
  const s = ACTIVITE_STYLE[evt.type] ?? ACTIVITE_STYLE.PIN;
  return { ...evt, ...s };
}

const STATUT_BADGE = {
  'Brouillon':   'bg-gray-100 text-gray-600',
  'En attente':  'bg-blue-50 text-blue-700',
  'Validé':      'bg-emerald-50 text-emerald-700',
  'Expédié':     'bg-indigo-50 text-indigo-700',
  'Réceptionné': 'bg-teal-50 text-teal-700',
  'Rejeté':      'bg-red-50 text-red-600',
};
const STATUT_LABEL = {
  'Brouillon':   'Brouillon',
  'En attente':  'À préparer',
  'Validé':      'Prêt au départ',
  'Expédié':     'Expédié',
  'Réceptionné': 'Réceptionné',
  'Rejeté':      'Rejeté',
};
function StatutBadgeTiny({ statut }) {
  const cls = STATUT_BADGE[statut] ?? 'bg-gray-100 text-gray-500';
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${cls}`}>
      {STATUT_LABEL[statut] ?? statut}
    </span>
  );
}

function barColor(pct, statut) {
  if (statut==="critique") return "bg-red-500";
  if (statut==="alerte"||pct>=80) return "bg-amber-400";
  if (pct>=60) return "bg-blue-500";
  return "bg-emerald-500";
}
function dotColor(s) {
  return s==="critique"?"bg-red-500":s==="alerte"?"bg-amber-400":"bg-emerald-500";
}

export default function DashboardDirection() {
  const today = new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const navigate = useNavigate();
  const card = "rounded-2xl border p-5 flex flex-col gap-3 transition-colors bg-white border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700";

  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);
  const [stocks,     setStocks]     = useState({});
  const [regions,    setRegions]    = useState([]);
  const [activite,   setActivite]   = useState([]);
  const [lotsAlerte, setLotsAlerte] = useState([]);
  const [cuves,      setCuves]      = useState([]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      api.get("/api/dashboard/stats"),
      api.get("/api/cuves").catch(() => []),
    ]).then(([data, cuvesData]) => {
      if (cancelled) return;
      setStocks(data.stocks ?? {});
      setRegions(data.regions ?? []);
      setActivite((data.activite ?? []).map(enrichActivite));
      setLotsAlerte(data.alertes?.lots ?? []);
      setCuves(Array.isArray(cuvesData) ? cuvesData : []);
    }).catch(err => {
      if (cancelled) return;
      setError(err.message ?? "Impossible de charger les données.");
    }).finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, []);

  /* ── État chargement ────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded-xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 flex flex-col gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-7 w-24 rounded-lg bg-slate-100 animate-pulse" />
              <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm h-64 animate-pulse" />
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm h-64 animate-pulse" />
        </div>
        <div className="flex justify-center pt-4">
          <Spinner label="Chargement du tableau de bord…" />
        </div>
      </div>
    );
  }

  /* ── État erreur ────────────────────────────────────────── */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <div className="p-4 rounded-full bg-red-50 border border-red-100 mb-4">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 mb-1">Impossible de charger le tableau de bord</h2>
        <p className="text-xs text-slate-500 mb-5 max-w-xs leading-relaxed">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          <RefreshCw size={13} /> Réessayer
        </button>
      </div>
    );
  }

  /* ── Calculs KPI ─────────────────────────────────────────── */
  // > 0 : alerte seulement si le stock existe et est sous le seuil.
  // Couvre les deux backends : null (nouveau) et 0 (ancien) signifient tous les deux "aucune donnée".
  const alertesSeuils = [];
  if (stocks.semences > 0 && stocks.semences < SEUILS.semences)
    alertesSeuils.push(`Semences : ${stocks.semences.toLocaleString()} doses (seuil ${SEUILS.semences.toLocaleString()})`);
  if (stocks.azote > 0 && stocks.azote < SEUILS.azote)
    alertesSeuils.push(`Azote : ${stocks.azote.toLocaleString()} L (seuil ${SEUILS.azote.toLocaleString()} L)`);
  const totalAlertes = alertesSeuils.length + lotsAlerte.length;

  // Cuve la plus critique pour l'indicateur de la carte Azote
  const cuveEnAlerte = cuves.find(c => c.statut === 'critique') ?? cuves.find(c => c.statut === 'alerte');

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">MLAPP · Admin Fédéral</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Vue d'ensemble Nationale</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{today.charAt(0).toUpperCase()+today.slice(1)}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto
          text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40
          border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          {regions.length > 0 ? `Flux actif · ${regions.length} régions` : "En attente de données"}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className={card}>
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/50"><Dna size={20} className="text-blue-600 dark:text-blue-400" /></div>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-emerald-600 bg-emerald-50 border border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-800">
              <TrendingUp size={9} /> +3.2%
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Stock Central Semences</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 leading-none">
              {stocks.semences?.toLocaleString() ?? '—'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">doses · Seuil alerte : {SEUILS.semences.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Au-dessus du seuil</span>
          </div>
        </div>

        <div className={card}>
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/50"><Droplets size={20} className="text-cyan-600 dark:text-cyan-400" /></div>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-red-500 bg-red-50 border border-red-100 dark:text-red-400 dark:bg-red-900/40 dark:border-red-800">
              <TrendingDown size={9} /> −1.8%
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Stock Azote National</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 leading-none">
              {stocks.azote?.toLocaleString() ?? '—'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">litres · Seuil alerte : {SEUILS.azote.toLocaleString()} L</p>
          </div>
          <div className="flex items-center gap-1.5">
            {cuveEnAlerte ? (
              <>
                <span className={`w-2 h-2 rounded-full shrink-0 ${cuveEnAlerte.statut === 'critique' ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />
                <span className={`text-[10px] font-semibold ${cuveEnAlerte.statut === 'critique' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  Surveiller {cuveEnAlerte.nom}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Niveaux nominaux</span>
              </>
            )}
          </div>
        </div>

        <div className={card}>
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/50"><BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400" /></div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-700">Mois en cours</span>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Consommation Quota National</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 leading-none">
              {stocks.quotaPct != null ? `${stocks.quotaPct}%` : '—'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">alloué sur quota national</p>
          </div>
          {stocks.quotaPct != null ? (
            <div>
              <div className="h-1.5 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900/60">
                <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{width:`${stocks.quotaPct}%`}} />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{100 - stocks.quotaPct}% de quota restant</p>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400">Aucune donnée disponible pour le moment</p>
          )}
        </div>

        <div className="rounded-2xl border p-5 flex flex-col gap-3 transition-colors bg-white border-red-100 shadow-sm shadow-red-50 dark:bg-slate-800 dark:border-red-900/60">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/40"><AlertTriangle size={20} className="text-red-500 dark:text-red-400" /></div>
            {totalAlertes > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50">
                Action requise
              </span>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Alertes Critiques</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums mt-0.5 leading-none">{totalAlertes}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">lots & seuils dépassés</p>
          </div>
          {lotsAlerte.length > 0 ? (
            <div className="space-y-1">
              {lotsAlerte.slice(0,2).map(l => (
                <div key={l} className="flex items-center gap-1.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" /> {l}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Aucune alerte active</p>
          )}
        </div>
      </div>

      {/* Zone centrale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Régions */}
        <div className="rounded-2xl border overflow-hidden transition-colors bg-white border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-slate-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Consommation par Région</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Semences · Mois en cours</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[["bg-emerald-500","Normal"],["bg-amber-400","Alerte"],["bg-red-500","Critique"]].map(([c,l])=>(
                <span key={l} className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <span className={`w-2 h-2 rounded-sm ${c} inline-block`}/>{l}
                </span>
              ))}
            </div>
          </div>

          <div className="px-5 py-5 space-y-4">
            {regions.length === 0 ? (
              <div className="py-8 text-center">
                <MapPin size={28} className="mx-auto mb-2 text-slate-200" />
                <p className="text-sm text-slate-400 font-medium">Aucune donnée disponible pour le moment</p>
                <p className="text-xs text-slate-300 mt-1">Les données régionales apparaîtront ici dès la synchronisation.</p>
              </div>
            ) : regions.map(r=>(
              <div key={r.nom} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor(r.statut)}`}/>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{r.nom}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">{r.doses.toLocaleString()} doses</span>
                    <span className={`text-xs font-bold tabular-nums w-9 text-right ${r.statut==="critique"?"text-red-600 dark:text-red-400":r.statut==="alerte"?"text-amber-600 dark:text-amber-400":"text-slate-700 dark:text-slate-200"}`}>
                      {r.pct}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                  <div className={`h-full rounded-full transition-all duration-700 ${barColor(r.pct,r.statut)}`} style={{width:`${r.pct}%`}}/>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500">{regions.length} région{regions.length !== 1 ? "s" : ""} · Données J-1</span>
            <span className="text-xs font-semibold text-red-500 dark:text-red-400">
              {regions.filter(r=>r.statut==="critique").length} critique · {regions.filter(r=>r.statut==="alerte").length} alerte
            </span>
          </div>
        </div>

        {/* Timeline activité */}
        <div className="rounded-2xl border overflow-hidden transition-colors bg-white border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-slate-400"/>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Activité Logistique en Direct</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Dernières actions MLAPP</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"/>Live
            </span>
          </div>

          <div className="px-5 py-5">
            {activite.length === 0 ? (
              <div className="py-8 text-center">
                <Activity size={28} className="mx-auto mb-2 text-slate-200" />
                <p className="text-sm text-slate-400 font-medium">Aucune activité pour le moment</p>
                <p className="text-xs text-slate-300 mt-1">Les événements logistiques apparaîtront ici en temps réel.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-100 dark:bg-slate-700"/>
                <div className="space-y-5">
                  {activite.map(evt=>(
                    <div key={evt.id} className="relative flex gap-3.5 items-start">
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-2 ${evt.bg} ${evt.ring}`}>
                        <evt.Icon size={13} className={evt.ic}/>
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{evt.action}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">{evt.delta}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{evt.detail}</p>
                          {evt.statut && <StatutBadgeTiny statut={evt.statut} />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => navigate('/tracabilite')}
              className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:opacity-75 transition-opacity">
              Voir l'historique complet <ChevronRight size={12}/>
            </button>
          </div>
        </div>
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:"Gestion des Quotas",    sub:"Admin Fédéral",   bg:"bg-blue-600   hover:bg-blue-700",   icon:BarChart3,   path:"/quotas"      },
          {label:"Centre de Validations", sub:"En attente",      bg:"bg-amber-500  hover:bg-amber-600",  icon:CheckCircle, path:"/validations"  },
          {label:"Traçabilité",           sub:"Logs & Rapports", bg:"bg-slate-700  hover:bg-slate-800",  icon:Eye,         path:"/tracabilite"  },
          {label:"Configuration",         sub:"Super Admin",     bg:"bg-violet-700 hover:bg-violet-800", icon:Settings,    path:"/configuration"},
        ].map(({label,sub,bg,icon:Icon,path})=>(
          <button key={label} onClick={() => navigate(path)} className={`${bg} text-white rounded-2xl p-4 flex flex-col gap-2.5 text-left transition-colors shadow-sm`}>
            <Icon size={18} className="text-white/80"/>
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
