import { useState } from "react";
import {
  Dna, Droplets, BarChart3, AlertTriangle, Activity,
  TrendingUp, TrendingDown, MapPin, ChevronRight,
  Truck, CheckCircle, Shield, Zap, Eye, Settings,
  Home, Package
} from "lucide-react";
import { REGIONS } from "../constants/DashboardDirection";

// const REGIONS = [
//   { nom: "Souss-Massa", pct: 82, doses: 1240, statut: "alerte" },
//   { nom: "Casablanca-Settat", pct: 71, doses: 980, statut: "normal" },
//   { nom: "Béni Mellal-Khénifra", pct: 64, doses: 890, statut: "normal" },
//   { nom: "Rabat-Salé-Kénitra", pct: 55, doses: 760, statut: "normal" },
//   { nom: "Marrakech-Safi", pct: 38, doses: 520, statut: "normal" },
//   { nom: "Laâyoune-Sakia", pct: 22, doses: 310, statut: "critique" },
// ];

const ACTIVITE = [
  { id: 1, delta: "Il y a 8 min", Icon: Truck, bg: "bg-blue-50 dark:bg-blue-900/60", ring: "ring-blue-200 dark:ring-blue-800", ic: "text-blue-600 dark:text-blue-400", action: "Expédition envoyée", detail: "500 doses Holstein → Coopérative Aït Si Salem" },
  { id: 2, delta: "Il y a 42 min", Icon: CheckCircle, bg: "bg-emerald-50 dark:bg-emerald-900/60", ring: "ring-emerald-200 dark:ring-emerald-800", ic: "text-emerald-600 dark:text-emerald-400", action: "Réception validée", detail: "1 000 doses Alta Genetics NL · CMD-891" },
  { id: 3, delta: "Il y a 1h 20", Icon: AlertTriangle, bg: "bg-amber-50 dark:bg-amber-900/60", ring: "ring-amber-200 dark:ring-amber-800", ic: "text-amber-500 dark:text-amber-400", action: "Dérogation accordée", detail: "+100 doses · Unité Sakia Al Hamra" },
  { id: 4, delta: "Il y a 2h 05", Icon: Zap, bg: "bg-violet-50 dark:bg-violet-900/60", ring: "ring-violet-200 dark:ring-violet-800", ic: "text-violet-600 dark:text-violet-400", action: "Ordre prioritaire émis", detail: "Répartition Montbéliarde → Gharb Chrarda" },
  { id: 5, delta: "Il y a 3h", Icon: Shield, bg: "bg-slate-100 dark:bg-slate-700", ring: "ring-slate-200 dark:ring-slate-600", ic: "text-slate-500 dark:text-slate-400", action: "PIN dérogation généré", detail: "Code 15 min · Sakia Al Hamra" },
];

const SEUILS = { semences: 5000, azote: 2000 };
const STOCKS = { semences: 45200, azote: 8500 };

function barColor(pct, statut) {
  if (statut === "critique") return "bg-red-500";
  if (statut === "alerte" || pct >= 80) return "bg-amber-400";
  if (pct >= 60) return "bg-blue-500";
  return "bg-emerald-500";
}
function dotColor(s) {
  return s === "critique" ? "bg-red-500" : s === "alerte" ? "bg-amber-400" : "bg-emerald-500";
}

export default function DashboardDirection() {
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const card = "rounded-2xl border p-5 flex flex-col gap-3 transition-colors bg-white border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700";

  const alertesSeuils = [];
  if (STOCKS.semences < SEUILS.semences) alertesSeuils.push(`Semences : ${STOCKS.semences.toLocaleString()} doses (seuil ${SEUILS.semences.toLocaleString()})`);
  if (STOCKS.azote < SEUILS.azote) alertesSeuils.push(`Azote : ${STOCKS.azote.toLocaleString()} L (seuil ${SEUILS.azote.toLocaleString()})`);
  const lotsAlerte = ["LOT-0044 · 14j restants", "LOT-0048 · 7j restants", "LOT-0042 · 51j restants"];
  const totalAlertes = alertesSeuils.length + lotsAlerte.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">MLAPP · Admin Fédéral</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Vue d'ensemble Nationale</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{today.charAt(0).toUpperCase() + today.slice(1)}</p>
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
        <div className={card}>
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/50"><Dna size={20} className="text-blue-600 dark:text-blue-400" /></div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-400 bg-slate-100 dark:text-slate-500 dark:bg-slate-700">
              —
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Stock Central Semences</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 leading-none">{STOCKS.semences.toLocaleString()}</p>
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
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-400 bg-slate-100 dark:text-slate-500 dark:bg-slate-700">
              —
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Stock Azote National</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 leading-none">{STOCKS.azote.toLocaleString()}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">litres · Seuil alerte : {SEUILS.azote.toLocaleString()} L</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Surveiller Cuve B-02</span>
          </div>
        </div>

        <div className={card}>
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/50"><BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400" /></div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-700">Mois en cours</span>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Consommation Quota National</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 leading-none">68%</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">alloué sur quota national</p>
          </div>
          <div>
            <div className="h-1.5 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900/60">
              <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width: "68%" }} />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">32% de quota restant</p>
          </div>
        </div>

        <div className="rounded-2xl border p-5 flex flex-col gap-3 transition-colors bg-white border-red-100 shadow-sm shadow-red-50 dark:bg-slate-800 dark:border-red-900/60">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/40"><AlertTriangle size={20} className="text-red-500 dark:text-red-400" /></div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50">
              Action requise
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Alertes Critiques</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums mt-0.5 leading-none">{totalAlertes}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">lots & seuils dépassés</p>
          </div>
          <div className="space-y-1">
            {lotsAlerte.slice(0, 2).map(l => (
              <div key={l} className="flex items-center gap-1.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" /> {l}
              </div>
            ))}
          </div>
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
              {[["bg-emerald-500", "Normal"], ["bg-amber-400", "Alerte"], ["bg-red-500", "Critique"]].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <span className={`w-2 h-2 rounded-sm ${c} inline-block`} />{l}
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
                    <span className={`text-xs font-bold tabular-nums w-9 text-right ${r.statut === "critique" ? "text-red-600 dark:text-red-400" : r.statut === "alerte" ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-200"}`}>
                      {r.pct}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                  <div className={`h-full rounded-full transition-all duration-700 ${barColor(r.pct, r.statut)}`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500">6 régions · Données J-1</span>
            <span className="text-xs font-semibold text-red-500 dark:text-red-400">1 critique · 1 alerte</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border overflow-hidden transition-colors bg-white border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-slate-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Activité Logistique en Direct</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Dernières actions MLAPP</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />Live
            </span>
          </div>
          <div className="px-5 py-5">
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-100 dark:bg-slate-700" />
              <div className="space-y-5">
                {ACTIVITE.map(evt => (
                  <div key={evt.id} className="relative flex gap-3.5 items-start">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-2 ${evt.bg} ${evt.ring}`}>
                      <evt.Icon size={13} className={evt.ic} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{evt.action}</p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">{evt.delta}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{evt.detail}</p>
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
          { label: "Gestion des Quotas", sub: "Admin Fédéral", bg: "bg-blue-600   hover:bg-blue-700", icon: BarChart3 },
          { label: "Centre de Validations", sub: "3 en attente", bg: "bg-amber-500  hover:bg-amber-600", icon: CheckCircle },
          { label: "Traçabilité", sub: "Logs & Rapports", bg: "bg-slate-700  hover:bg-slate-800", icon: Eye },
          { label: "Configuration", sub: "Super Admin", bg: "bg-violet-700 hover:bg-violet-800", icon: Settings },
        ].map(({ label, sub, bg, icon: Icon }) => (
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
