import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, ChevronDown, TrendingUp, AlertTriangle, CheckCircle,
  FlaskConical, Wrench, Dna, BarChart3, Users, Package,
  X, RefreshCw, Save, Zap, Info, AlertCircle, Lock, Unlock
} from "lucide-react";
import Spinner from "./components/Spinner.jsx";
import { api } from "./lib/api.js";


const COOPERATIVES = [
  { id:1, name:"Unité Aït Si Salem",      region:"Souss-Massa"          },
  { id:2, name:"Unité Sakia Al Hamra",    region:"Laâyoune-Sakia"       },
  { id:3, name:"Unité Tadla Azilal",      region:"Béni Mellal-Khénifra" },
  { id:4, name:"Unité Gharb Chrarda",     region:"Rabat-Salé-Kénitra"   },
  { id:5, name:"Unité Chaouia Ouardigha", region:"Casablanca-Settat"    },
  { id:6, name:"Unité Doukkala Abda",     region:"Marrakech-Safi"       },
];

const GENETIQUES = [
  "Holstein – BENNER JESUALDO",
  "Holstein – DESTINED P",
  "Montbéliarde – ALPAGA RF",
  "Normande – OLIVIER ET",
  "Prim'Holstein – JACKPOT",
  "Simmental – ROMAX",
];

const CATEGORIES = {
  semences: {
    id: "semences",
    label: "Semences",
    subtitle: "Semences bovines",
    icon: Dna,
    articleLabel: "Génétique à distribuer",
    articlePlaceholder: "Holstein – BENNER JESUALDO",
    uniteLabel: "doses",
    uniteParCoop: "doses/coopérative",
    articles: [
      "Holstein – BENNER JESUALDO",
      "Holstein – DESTINED P",
      "Montbéliarde – ALPAGA RF",
      "Normande – OLIVIER ET",
      "Prim'Holstein – JACKPOT",
      "Simmental – ROMAX",
    ],
  },
  consommables: {
    id: "consommables",
    label: "Consommables",
    subtitle: "Consommables logistiques",
    icon: FlaskConical,
    articleLabel: "Consommable à distribuer",
    articlePlaceholder: "Azote liquide",
    uniteLabel: "litres / boîtes",
    uniteParCoop: "unités/coopérative",
    articles: [
      "Azote liquide (L)",
      "Gants d'insémination (unités)",
      "Paillettes de stockage (boîtes)",
      "Cathéters jetables (unités)",
      "Gaines sanitaires (boîtes)",
      "Désinfectant BoviClean (L)",
    ],
  },
  materiel: {
    id: "materiel",
    label: "Matériel & Outils",
    subtitle: "Équipements & matériel",
    icon: Wrench,
    articleLabel: "Équipement à allouer",
    articlePlaceholder: "Scanners BoviScan, Cuves 35L",
    uniteLabel: "pièces",
    uniteParCoop: "pièces/coopérative",
    articles: [
      "Cuve à azote 35L",
      "Pistolet d'insémination Minitüb",
      "Microscope portable LED",
      "Scanner BoviScan Ultra",
      "Kit de collecte embryonnaire",
      "Thermos de transport 10L",
    ],
  },
};

const MOIS_FR  = ["Janv","Févr","Mars","Avr","Mai","Juin","Juil","Août","Sept","Oct","Nov","Déc"];
const Q_MOIS   = { T1:[0,1,2], T2:[3,4,5], T3:[6,7,8], T4:[9,10,11] };

function periodeLabel(key) {
  const now = new Date();
  if (key === "Mois en cours")  return `${MOIS_FR[now.getMonth()]} ${now.getFullYear()}`;
  if (key === "Mois précédent") {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1);
    return `${MOIS_FR[prev.getMonth()]} ${prev.getFullYear()}`;
  }
  return key;
}

function filterByPeriode(rows, key) {
  if (!key || key === "Toutes les périodes") return rows;
  const label = periodeLabel(key);
  const qMatch   = label.match(/^(T[1-4])\s+(\d{4})$/);
  const yrMatch  = label.match(/^Année\s+(\d{4})$/);
  if (qMatch)  {
    const idxs   = Q_MOIS[qMatch[1]] ?? [];
    const labels = idxs.map(i => `${MOIS_FR[i]} ${qMatch[2]}`);
    return rows.filter(r => r.periode && labels.includes(r.periode));
  }
  if (yrMatch) return rows.filter(r => r.periode?.includes(yrMatch[1]));
  return rows.filter(r => r.periode === label);
}

const periodes = ["Toutes les périodes","Mois en cours","Mois précédent","T1 2025","T2 2025","Année 2025"];
const regions  = ["Toutes les régions","Souss-Massa","Laâyoune-Sakia","Béni Mellal-Khénifra","Rabat-Salé-Kénitra","Casablanca-Settat","Marrakech-Safi"];
const tabs     = [
  { id:"semences",     label:"Semences",         icon:Dna         },
  { id:"consommables", label:"Consommables",      icon:FlaskConical },
  { id:"materiel",     label:"Matériel & Outils", icon:Wrench      },
];

function distribute(total, n) {
  const base = Math.floor(total / n);
  const rem  = total % n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

function ProgressBar({ dotation, consomme, statut }) {
  const pct = dotation > 0 ? Math.min((consomme / dotation) * 100, 100) : 0;
  const c = {
    normal:   { bar:"bg-emerald-500", track:"bg-emerald-100", text:"text-emerald-700" },
    alerte:   { bar:"bg-amber-500",   track:"bg-amber-100",   text:"text-amber-700"   },
    critique: { bar:"bg-red-500",     track:"bg-red-100",     text:"text-red-700"     },
  }[statut];
  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 h-2 rounded-full ${c.track}`}>
        <div className={`h-2 rounded-full transition-all duration-500 ${c.bar}`} style={{ width:`${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${c.text}`}>{Math.round(pct)}%</span>
    </div>
  );
}

function StatutBadge({ statut }) {
  const cfg = {
    normal:   { bg:"bg-emerald-50", text:"text-emerald-700", border:"border-emerald-200", icon:CheckCircle,   label:"Normal"   },
    alerte:   { bg:"bg-amber-50",   text:"text-amber-700",   border:"border-amber-200",   icon:AlertTriangle, label:"Alerte"   },
    critique: { bg:"bg-red-50",     text:"text-red-700",     border:"border-red-200",     icon:TrendingUp,    label:"Critique" },
  }[statut];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <cfg.icon size={11} />{cfg.label}
    </span>
  );
}

function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-gray-300 transition-colors">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

function AjusterModal({ row, onClose, onSave }) {
  const [val, setVal] = useState(row.dotation);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Ajuster la dotation</h3>
        <p className="text-sm text-gray-500 mb-4">{row.cooperative} — {row.article}</p>
        <div className="bg-gray-50 rounded-lg p-3 mb-4 flex justify-between text-sm">
          <span className="text-gray-500">Consommé actuel</span>
          <span className="font-semibold text-gray-800">{row.consomme} / {row.dotation}</span>
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouvelle dotation</label>
        <input type="number" value={val} onChange={e => setVal(Number(e.target.value))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {val < row.consomme && (
          <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
            <AlertTriangle size={12} /> La dotation ne peut pas être inférieure au consommé.
          </p>
        )}
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
          <button onClick={() => { onSave(val); onClose(); }} disabled={val < row.consomme}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DRAWER — NOUVELLE CAMPAGNE
══════════════════════════════════════════════════════ */
function NouvelleCampagneDrawer({ onClose, onCreated }) {
  const now = new Date();
  const periodeDefaut = `${MOIS_FR[now.getMonth()]} ${now.getFullYear()}`;
  const monthInputDefaut = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [categorieId,  setCategorieId]  = useState("semences");
  const cat = CATEGORIES[categorieId];
  const [genetique,    setGenetique]    = useState(CATEGORIES.semences.articles[0]);
  const [volumeTotal,  setVolumeTotal]  = useState(1000);
  const [periode,      setPeriode]      = useState(periodeDefaut);
  const [step,         setStep]         = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState(null);

  function handleCategorieChange(id) {
    setCategorieId(id);
    setGenetique(CATEGORIES[id].articles[0]);
  }
  const [dotations,   setDotations]   = useState(() => distribute(1000, COOPERATIVES.length));
  const [locked,      setLocked]      = useState(() => Array(COOPERATIVES.length).fill(false));
  const [recalcFlash, setRecalcFlash] = useState(false);
  const [lockFlash,   setLockFlash]   = useState(null); // index of last redistributed flash
  const [validated,   setValidated]   = useState(false);

  const distribue  = dotations.reduce((a, v) => a + (Number(v) || 0), 0);
  const reste      = volumeTotal - distribue;
  const isBalanced = reste === 0;

  /* Redistribue le reliquat entre les lignes non-verrouillées */
  function redistributeFree(nextDotations, nextLocked) {
    const lockedSum = nextDotations.reduce((s, v, i) => s + (nextLocked[i] ? (Number(v) || 0) : 0), 0);
    const freeIdxs  = nextLocked.map((l, i) => l ? null : i).filter(i => i !== null);
    if (freeIdxs.length === 0) return nextDotations;
    const toDistribute = Math.max(0, volumeTotal - lockedSum);
    const distributed  = distribute(toDistribute, freeIdxs.length);
    const result = [...nextDotations];
    freeIdxs.forEach((idx, j) => { result[idx] = distributed[j]; });
    return result;
  }

  /* Recalcul équitable global (respecte les verrous) */
  const recalculate = useCallback(() => {
    setDotations(prev => redistributeFree(prev, locked));
    setRecalcFlash(true);
    setTimeout(() => setRecalcFlash(false), 600);
  }, [volumeTotal, locked]);

  useEffect(() => { if (step === 2) recalculate(); }, [volumeTotal]);

  function goToStep2() {
    const d = distribute(volumeTotal, COOPERATIVES.length);
    setDotations(d);
    setLocked(Array(COOPERATIVES.length).fill(false));
    setStep(2);
  }

  async function handleValidate() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await api.post('/api/quotas', {
        categorieId,
        article:     genetique,
        volumeTotal: Number(volumeTotal),
        periode,
        lignes: COOPERATIVES.map((coop, idx) => ({
          cooperative: coop.name,
          region:      coop.region,
          alloue:      Number(dotations[idx]) || 0,
        })),
      });
      setValidated(true);
      setTimeout(() => { onCreated?.(); onClose(); }, 1200);
    } catch (err) {
      setSubmitError(err.message ?? "Erreur lors de la création de la campagne.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* Frappe : met à jour la valeur brute SANS verrouiller ni redistribuer */
  function handleTyping(idx, raw) {
    const next = [...dotations];
    next[idx]  = raw === "" ? "" : Math.max(0, Number(raw));
    setDotations(next);
  }

  /* Blur : verrouille + redistribue le reliquat sur les lignes libres */
  function handleBlur(idx) {
    if (locked[idx]) return;                     // déjà verrouillé, rien à faire
    const nextLock  = [...locked]; nextLock[idx] = true;
    const nextDot   = redistributeFree([...dotations], nextLock);
    setDotations(nextDot);
    setLocked(nextLock);
    setLockFlash(idx);
    setTimeout(() => setLockFlash(null), 700);
  }

  /* Clic cadenas : toggle verrou + redistribue si on verrouille */
  function toggleLock(idx) {
    const nextLock = [...locked];
    nextLock[idx]  = !nextLock[idx];
    let nextDot    = [...dotations];
    if (nextLock[idx]) {
      // on verrouille → redistribue le reliquat sur les libres
      nextDot = redistributeFree(nextDot, nextLock);
    }
    setDotations(nextDot);
    setLocked(nextLock);
    setLockFlash(idx);
    setTimeout(() => setLockFlash(null), 700);
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

      {/* drawer panel */}
      <div className="relative ml-auto z-50 h-full w-full sm:max-w-2xl bg-white shadow-2xl flex flex-col"
        style={{ animation:"drawerIn .2s cubic-bezier(.32,0,.67,0) forwards" }}>

        <style>{`
          @keyframes drawerIn { from { transform:translateX(100%) } to { transform:translateX(0) } }
          @keyframes rowFlash { 0%,100%{background:transparent} 50%{background:#d1fae5} }
          .row-flash { animation: rowFlash .55s ease; }
        `}</style>

        {/* ── En-tête ────────────────────────────── */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1.5">
              Admin Fédéral · Subventions
            </p>
            <h2 className="text-lg font-semibold text-gray-900 leading-tight">
              Nouvelle Répartition de Subvention
            </h2>
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
              <cat.icon size={13} className="text-gray-400" />
              {cat.subtitle} — Campagne <span className="text-gray-600 font-medium ml-1">{periode || "—"}</span>
            </p>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* ── Stepper ────────────────────────────── */}
        <div className="flex items-center gap-4 px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-gray-50/60 shrink-0">
          {[{ n:1, label:"Définition" }, { n:2, label:"Répartition" }].map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors shrink-0
                ${step === n ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : step > n  ? "bg-emerald-500 text-white"
                  : "bg-gray-200 text-gray-500"}`}>
                {step > n ? <CheckCircle size={13} /> : n}
              </div>
              <span className={`text-xs font-medium ${step===n?"text-blue-700":step>n?"text-emerald-600":"text-gray-400"}`}>{label}</span>
              {i === 0 && (
                <div className={`ml-2 h-px w-8 transition-colors ${step > 1 ? "bg-emerald-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
          <div className="ml-auto text-xs text-gray-400">
            Étape <span className="font-semibold text-gray-600">{step}</span> / 2
          </div>
        </div>

        {/* ── Corps ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">

          {/* ═══ ÉTAPE 1 : Définition ═══ */}
          {step === 1 && (
            <div className="space-y-5">

              {/* Sélecteur de catégorie — pilules */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Catégorie de la dotation
                </label>
                <div className="flex gap-2 flex-wrap">
                  {Object.values(CATEGORIES).map(({ id, label, icon: CatIcon }) => {
                    const active = categorieId === id;
                    return (
                      <button key={id} onClick={() => handleCategorieChange(id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all
                          ${active
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"}`}>
                        <CatIcon size={14} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bandeau logique intelligente */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <div className="bg-blue-100 rounded-lg p-1.5 shrink-0 self-start">
                  <Zap size={15} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-0.5">Répartition automatique activée</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Le système distribuera équitablement le volume total entre les <strong className="font-semibold">{COOPERATIVES.length} coopératives actives</strong>. Vous pourrez ajuster chaque quota individuellement à l'étape suivante.
                  </p>
                </div>
              </div>

              {/* Article dynamique */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  {cat.articleLabel}
                </label>
                <div className="relative">
                  <cat.icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select value={genetique} onChange={e => setGenetique(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-lg pl-9 pr-9 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition-colors">
                    {cat.articles.map(g => <option key={g}>{g}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Volume */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Volume Total Subventionné
                  <span className="ml-1.5 font-normal text-gray-400 text-xs">({cat.uniteLabel})</span>
                </label>
                <div className="flex items-stretch gap-3">
                  <input type="number" value={volumeTotal} min={1}
                    onChange={e => setVolumeTotal(Math.max(1, Number(e.target.value)))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors" />
                  <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-xs text-gray-400">÷ {COOPERATIVES.length} =</span>
                    <span className="text-sm font-bold text-gray-700 tabular-nums">
                      ≈ {Math.floor(volumeTotal / COOPERATIVES.length)}
                    </span>
                    <span className="text-xs text-gray-400">{cat.uniteParCoop}</span>
                  </div>
                </div>
              </div>

              {/* Période */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Période de campagne
                </label>
                <input type="month" defaultValue={monthInputDefaut}
                  onChange={e => {
                    const [y, m] = e.target.value.split("-");
                    setPeriode(`${MOIS_FR[+m - 1]} ${y}`);
                  }}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 hover:border-gray-300 transition-colors" />
              </div>

            </div>
          )}

          {/* ═══ ÉTAPE 2 : Répartition ═══ */}
          {step === 2 && (
            <div className="space-y-5">

              {/* ── Bandeau de Contrôle Intelligent ── */}
              <div className={`rounded-xl border p-4 transition-colors ${isBalanced ? "bg-white border-gray-100" : "bg-red-50/70 border-red-200"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isBalanced ? "bg-emerald-500" : "bg-red-500"}`} />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Contrôle de la répartition
                    </span>
                  </div>
                  {!isBalanced && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
                      <AlertCircle size={11} /> Déséquilibre détecté
                    </span>
                  )}
                  {isBalanced && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      <CheckCircle size={11} /> Équilibré
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label:"Volume Total",    value:volumeTotal, note:"subventionné",
                      textColor:"text-gray-900", bg:"bg-gray-50 border-gray-100" },
                    { label:"Total Distribué", value:distribue,   note:"alloué aux unités",
                      textColor:"text-blue-700", bg:"bg-blue-50 border-blue-100" },
                    { label:"Reste à allouer", value:reste,       note: isBalanced ? "parfaitement équilibré" : "à corriger",
                      textColor: isBalanced ? "text-emerald-600" : "text-red-600",
                      bg: isBalanced ? "bg-emerald-50 border-emerald-200" : "bg-red-100 border-red-300" },
                  ].map(({ label, value, note, textColor, bg }) => (
                    <div key={label} className={`rounded-lg p-3.5 border text-center ${bg}`}>
                      <p className="text-xs text-gray-400 mb-1.5 font-medium">{label}</p>
                      <p className={`text-2xl font-bold tabular-nums leading-none ${textColor}`}>{value}</p>
                      <p className="text-[10px] text-gray-400 mt-1.5">{note}</p>
                    </div>
                  ))}
                </div>

                {!isBalanced && (
                  <div className="mt-3.5 flex items-start gap-2 bg-red-100/60 rounded-lg px-3 py-2.5">
                    <Info size={12} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700 leading-relaxed">
                      Le total distribué (<strong className="font-semibold">{distribue}</strong>) ne correspond pas au volume subventionné (<strong className="font-semibold">{volumeTotal}</strong>).
                      Ajustez les dotations ou utilisez <strong className="font-semibold">"Recalculer l'équité"</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* ── Tableau interactif ── */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Répartition par coopérative</p>
                    <p className="text-xs text-gray-400 mt-0.5">{genetique}</p>
                  </div>
                  <button onClick={recalculate}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all
                      ${recalcFlash
                        ? "border-emerald-400 text-emerald-700 bg-emerald-50"
                        : "border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"}`}>
                    <RefreshCw size={12} className={recalcFlash ? "animate-spin text-emerald-500" : ""} />
                    Recalculer l'équité
                  </button>
                </div>

                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Coopérative</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 hidden sm:table-cell">Région</th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 w-36">Dotation ({cat.uniteLabel})</th>
                      <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-2.5 w-12">Verrou</th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 w-16">Part %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {COOPERATIVES.map((coop, idx) => {
                      const val      = dotations[idx];
                      const numVal   = Number(val) || 0;
                      const pct      = volumeTotal > 0 ? ((numVal / volumeTotal) * 100).toFixed(1) : "0.0";
                      const isLocked = locked[idx];
                      const isFlashing = lockFlash === idx;
                      const initials = coop.name.replace("Unité ", "").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                      return (
                        <tr key={coop.id}
                          className={`transition-colors ${recalcFlash && !isLocked ? "row-flash" : isFlashing ? "row-flash" : isLocked ? "bg-slate-50/80" : "hover:bg-gray-50/50"}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors
                                ${isLocked ? "bg-slate-200 text-slate-500" : "bg-blue-50 text-blue-600"}`}>
                                {initials}
                              </div>
                              <div>
                                <span className={`text-sm font-medium transition-colors ${isLocked ? "text-gray-500" : "text-gray-800"}`}>
                                  {coop.name}
                                </span>
                                {isLocked && (
                                  <span className="ml-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">verrouillé</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{coop.region}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <input type="number" value={val} min={0}
                                readOnly={isLocked}
                                onChange={e => !isLocked && handleTyping(idx, e.target.value)}
                                onBlur={() => handleBlur(idx)}
                                className={`w-24 border rounded-lg px-2.5 py-1.5 text-sm text-right font-semibold tabular-nums transition-all
                                  ${isLocked
                                    ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300"}`} />
                            </div>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <button onClick={() => toggleLock(idx)} title={isLocked ? "Déverrouiller" : "Verrouiller"}
                              className={`w-7 h-7 rounded-md flex items-center justify-center mx-auto transition-all
                                ${isLocked
                                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                  : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"}`}>
                              {isLocked
                                ? <Lock size={12} />
                                : <Unlock size={12} />}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-xs font-semibold tabular-nums ${isLocked ? "text-slate-400" : "text-gray-500"}`}>{pct}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50/80 border-t border-gray-200">
                      <td colSpan={2} className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Total</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-bold tabular-nums ${isBalanced ? "text-emerald-600" : "text-red-600"}`}>{distribue}</span>
                        <span className="text-xs text-gray-400 ml-1.5">/ {volumeTotal}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-bold ${isBalanced ? "text-emerald-600" : "text-red-600"}`}>
                          {volumeTotal > 0 ? ((distribue / volumeTotal) * 100).toFixed(1) : "0.0"}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex gap-2">
                <Info size={12} className="shrink-0 mt-0.5 text-gray-400" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  Les dotations seront créées avec le statut <span className="font-semibold text-gray-600">Planifié</span>. Elles deviendront actives dès confirmation par chaque coopérative.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Pied de la modale ──────────────────── */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-white flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
            Annuler
          </button>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            {/* Erreur de soumission */}
            {submitError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                <AlertCircle size={13} className="shrink-0" />
                {submitError}
              </div>
            )}
            <div className="flex items-center gap-2">
              {step === 2 && (
                <button onClick={() => setStep(1)} disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40">
                  ← Retour
                </button>
              )}
              {step === 1 ? (
                <button onClick={goToStep2}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  Configurer la répartition →
                </button>
              ) : (
                <button onClick={handleValidate} disabled={!isBalanced || validated || isSubmitting}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200
                    ${validated
                      ? "bg-emerald-500 text-white"
                      : isBalanced && !isSubmitting
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                  {validated
                    ? <><CheckCircle size={15} /> Campagne créée !</>
                    : isSubmitting
                      ? <><RefreshCw size={15} className="animate-spin" /> Enregistrement…</>
                      : <><Save size={15} /> Valider la répartition</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════ */
export default function GestionQuotas() {
  const [activeTab,    setActiveTab]    = useState("semences");
  const [periode,      setPeriode]      = useState(periodes[0]);  // "Toutes les périodes"
  const [region,       setRegion]       = useState(regions[0]);
  const [ajusterRow,   setAjusterRow]   = useState(null);
  const [showCampagne, setShowCampagne] = useState(true);
  const [data,       setData]       = useState({ semences:[], consommables:[], materiel:[] });
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);

  /* Fonction de chargement réutilisable — appelée au mount ET après chaque création */
  const fetchData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    api.get("/api/quotas/data")
      .then(payload => {
        const safe = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
        setData({
          semences:     Array.isArray(safe.semences)     ? safe.semences     : [],
          consommables: Array.isArray(safe.consommables) ? safe.consommables : [],
          materiel:     Array.isArray(safe.materiel)     ? safe.materiel     : [],
        });
      })
      .catch(err => setError(err.message ?? "Impossible de charger les données de quotas."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* Filtrage : région puis période */
  const allRows  = data[activeTab];
  const byRegion = region === regions[0] ? allRows : allRows.filter(r => r.region === region);
  const rows     = filterByPeriode(byRegion, periode);
  const total      = rows.reduce((a, r) => a + r.dotation, 0);
  const totalConso = rows.reduce((a, r) => a + r.consomme, 0);
  const critiques  = rows.filter(r => r.statut === "critique").length;
  const alertes    = rows.filter(r => r.statut === "alerte").length;

  function handleSave(id, newDotation) {
    setData(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(r => {
        if (r.id !== id) return r;
        const pct    = newDotation > 0 ? (r.consomme / newDotation) * 100 : 0;
        const statut = pct >= 90 ? "critique" : pct >= 75 ? "alerte" : "normal";
        return { ...r, dotation: newDotation, statut };
      })
    }));
  }

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6">
        <div className="grid grid-cols-3 gap-3 w-full max-w-2xl">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 h-24 animate-pulse" />
          ))}
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm w-full max-w-2xl h-48 animate-pulse" />
        <Spinner label="Chargement des quotas…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <div className="p-4 rounded-full bg-red-50 border border-red-100 mb-4">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 mb-1">Impossible de charger les données de quotas</h2>
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {showCampagne && (
        <NouvelleCampagneDrawer
          onClose={() => setShowCampagne(false)}
          onCreated={() => { setShowCampagne(false); fetchData(); }}
        />
      )}

      {ajusterRow && (
        <AjusterModal row={ajusterRow} onClose={() => setAjusterRow(null)}
          onSave={v => { handleSave(ajusterRow.id, v); setAjusterRow(null); }} />
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1 flex-wrap">
                <span>MLstock</span><span>/</span><span>Administration Fédérale</span><span>/</span>
                <span className="text-blue-600 font-medium">Quotas & Subventions</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Gestion des Quotas & Subventions</h1>
              <p className="text-sm text-gray-500 mt-0.5">Répartition des dotations par coopérative régionale</p>
            </div>
            <button onClick={() => setShowCampagne(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm sm:shrink-0 w-full sm:w-auto">
              <Plus size={15} /> Nouvelle Campagne
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={periode} onChange={setPeriode} options={periodes} />
            <Select value={region}  onChange={setRegion}  options={regions}  />
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label:"Dotation totale", value:total.toLocaleString(),                              icon:Package,       color:"text-blue-600",   bg:"bg-blue-50"   },
            { label:"Consommé",        value:`${Math.round((totalConso/total)*100)||0}%`,          icon:BarChart3,     color:"text-indigo-600", bg:"bg-indigo-50" },
            { label:"En alerte",       value:alertes,                                             icon:AlertTriangle, color:"text-amber-600",  bg:"bg-amber-50"  },
            { label:"Critiques",       value:critiques,                                           icon:TrendingUp,    color:"text-red-600",    bg:"bg-red-50"    },
          ].map(({ label, value, icon:Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={`${bg} p-2 rounded-lg`}><Icon size={18} className={color} /></div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-lg font-semibold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 px-4">
            {tabs.map(({ id, label, icon:Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors
                  ${activeTab===id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                <Icon size={15} />{label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto -mx-px">
            <div className="min-w-[640px]">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  {["Coopérative","Article / Génétique","Dotation","Consommé","Progression","Statut","Action"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14">
                      <Package size={32} className="mx-auto mb-2 text-gray-200" />
                      <p className="text-sm font-medium text-gray-400">Aucune donnée disponible pour le moment</p>
                      <p className="text-xs text-gray-300 mt-1">Les quotas apparaîtront ici dès que l'API aura fourni des données.</p>
                    </td>
                  </tr>
                ) : rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-sm text-gray-900">{row.cooperative}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{row.region}</div>
                    </td>
                    <td className="px-5 py-4"><span className="text-sm text-gray-700">{row.article}</span></td>
                    <td className="px-5 py-4"><span className="text-sm font-semibold text-gray-900">{row.dotation.toLocaleString()}</span></td>
                    <td className="px-5 py-4"><span className="text-sm text-gray-700">{row.consomme.toLocaleString()}</span></td>
                    <td className="px-5 py-4 min-w-[180px]">
                      <ProgressBar dotation={row.dotation} consomme={row.consomme} statut={row.statut} />
                    </td>
                    <td className="px-5 py-4"><StatutBadge statut={row.statut} /></td>
                    <td className="px-5 py-4">
                      <button onClick={() => setAjusterRow(row)}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <Pencil size={12} /> Ajuster
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">{rows.length} coopérative{rows.length>1?"s":""} affichée{rows.length>1?"s":""}</span>
            <span className="text-xs text-gray-400">
              Total consommé : <span className="font-semibold text-gray-700">{totalConso.toLocaleString()} / {total.toLocaleString()}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
