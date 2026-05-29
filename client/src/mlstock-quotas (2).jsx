import { useState, useEffect, useCallback, Fragment } from "react";
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
  { id:"simulateur",   label:"Simulateur de Répartition", icon:BarChart3   },
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

/* ─── Algorithme répartition génétique équitable ─────── */
function calculerRepartitionGenetique(taureaux, totalQte) {
  const n = taureaux.length;
  if (n === 0 || totalQte === 0) return [];
  const base  = Math.floor(totalQte / n);
  const reste = totalQte % n;
  return taureaux.map((t, i) => ({
    taureau:     t.taureau,
    nni:         t.nni,
    couleur:     t.couleur,
    stockDispo:  t.stockDispo,
    qte:         i < reste ? base + 1 : base,
    qteCalculee: i < reste ? base + 1 : base,
  }));
}

/* ══════════════════════════════════════════════════════
   DRAWER — NOUVELLE CAMPAGNE
══════════════════════════════════════════════════════ */
function NouvelleCampagneDrawer({ onClose, onCreated, coopList = [], articleMap = {} }) {
  const now = new Date();
  const periodeDefaut = `${MOIS_FR[now.getMonth()]} ${now.getFullYear()}`;
  const monthInputDefaut = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [categorieId,  setCategorieId]  = useState("semences");
  const cat = CATEGORIES[categorieId];
  const [genetique,    setGenetique]    = useState((articleMap?.semences ?? [])[0] ?? '');
  const [volumeTotal,  setVolumeTotal]  = useState(1000);
  const [periode,      setPeriode]      = useState(periodeDefaut);
  const [step,         setStep]         = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState(null);

  function handleCategorieChange(id) {
    setCategorieId(id);
    setGenetique((articleMap?.[id] ?? [])[0] ?? '');
  }
  const [dotations,   setDotations]   = useState(() => distribute(1000, coopList.length || 1));
  const [locked,      setLocked]      = useState(() => Array(coopList.length).fill(false));
  const [recalcFlash, setRecalcFlash] = useState(false);
  const [lockFlash,   setLockFlash]   = useState(null); // index of last redistributed flash
  const [validated,   setValidated]   = useState(false);
  const [taureaux,        setTaureaux]        = useState([]);
  const [loadingTaureaux, setLoadingTaureaux] = useState(false);
  const [repartGen,       setRepartGen]       = useState({});

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

  /* Recalcul génétique automatique quand les dotations ou les taureaux changent */
  useEffect(() => {
    if (taureaux.length === 0 || step !== 2) return;
    const genRep = {};
    dotations.forEach((d, idx) => {
      genRep[idx] = calculerRepartitionGenetique(taureaux, Number(d) || 0);
    });
    setRepartGen(genRep);
  }, [dotations, taureaux, step]); // eslint-disable-line react-hooks/exhaustive-deps

  async function goToStep2() {
    const n = coopList.length || 1;
    const d = distribute(volumeTotal, n);
    setDotations(d);
    setLocked(Array(coopList.length).fill(false));
    setStep(2);

    if (categorieId === 'semences') {
      setLoadingTaureaux(true);
      try {
        const res  = await api.get('/api/lots?type=semence&limit=200');
        const lots = Array.isArray(res) ? res : (res.data ?? []);
        const map  = {};
        lots.forEach(lot => {
          (lot.ficheTechnique ?? []).forEach(g => {
            const key = g.nni || g.taureau;
            if (!key) return;
            if (!map[key]) map[key] = { taureau: g.taureau ?? key, nni: g.nni ?? key, couleur: g.couleur ?? '—', stockDispo: 0 };
            map[key].stockDispo += Number(g.qte) || 0;
          });
        });
        setTaureaux(Object.values(map).filter(t => t.stockDispo > 0));
      } catch {
        setTaureaux([]);
        setRepartGen({});
      } finally {
        setLoadingTaureaux(false);
      }
    }
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
        lignes: coopList.map((coop, idx) => ({
          cooperative:     coop.name,
          region:          coop.region,
          alloue:          Number(dotations[idx]) || 0,
          ...(repartGen[idx]?.length > 0 ? {
            repartGenetique: repartGen[idx].map(g => ({
              taureau: g.taureau, nni: g.nni, couleur: g.couleur, qte: Number(g.qte) || 0,
            })),
          } : {}),
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
                    Le système distribuera équitablement le volume total entre les <strong className="font-semibold">{coopList.length} coopérative{coopList.length !== 1 ? 's' : ''} active{coopList.length !== 1 ? 's' : ''}</strong>. Vous pourrez ajuster chaque quota individuellement à l'étape suivante.
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
                    {(articleMap?.[categorieId] ?? []).length === 0
                      ? <option value="">— Aucun article en base —</option>
                      : (articleMap?.[categorieId] ?? []).map(g => <option key={g}>{g}</option>)
                    }
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
                    <span className="text-xs text-gray-400">÷ {coopList.length} =</span>
                    <span className="text-sm font-bold text-gray-700 tabular-nums">
                      ≈ {coopList.length > 0 ? Math.floor(volumeTotal / coopList.length) : 0}
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
                    {coopList.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Aucune unité enregistrée en base.</td></tr>
                    ) : coopList.map((coop, idx) => {
                      const val        = dotations[idx];
                      const numVal     = Number(val) || 0;
                      const pct        = volumeTotal > 0 ? ((numVal / volumeTotal) * 100).toFixed(1) : "0.0";
                      const isLocked   = locked[idx];
                      const isFlashing = lockFlash === idx;
                      const initials   = coop.name.replace("Unité ", "").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                      const genLines   = repartGen[idx] ?? [];
                      const genTotal   = genLines.reduce((s, g) => s + (Number(g.qte) || 0), 0);
                      const genOk      = taureaux.length === 0 || genTotal === numVal;
                      const showGen    = taureaux.length > 0 && categorieId === 'semences';
                      return (
                        <Fragment key={coop.id}>
                          {/* ── Ligne principale coopérative ── */}
                          <tr className={`transition-colors ${recalcFlash && !isLocked ? "row-flash" : isFlashing ? "row-flash" : isLocked ? "bg-slate-50/80" : "hover:bg-gray-50/50"}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors
                                  ${isLocked ? "bg-slate-200 text-slate-300" : "bg-blue-50 text-blue-600"}`}>
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
                                {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`text-xs font-semibold tabular-nums ${isLocked ? "text-slate-400" : "text-gray-500"}`}>{pct}%</span>
                            </td>
                          </tr>

                          {/* ── Sous-lignes par taureau (semences uniquement) ── */}
                          {showGen && genLines.map((gen, gIdx) => {
                            const modifie = gen.qte !== gen.qteCalculee;
                            return (
                              <tr key={`${coop.id}-g${gIdx}`} className={`border-b border-dashed border-gray-100 ${modifie ? 'bg-amber-50/30' : 'bg-blue-50/20'}`}>
                                <td className="px-4 py-1.5 pl-12">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Dna size={9} className="text-blue-400 shrink-0" />
                                    <span className="text-[11px] text-gray-700 font-medium">{gen.taureau}</span>
                                    {gen.couleur !== '—' && (
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0
                                        ${gen.couleur === 'Rouge'  ? 'bg-red-50 text-red-700 border-red-200' :
                                          gen.couleur === 'Bleu'   ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                          gen.couleur === 'Vert'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                          gen.couleur === 'Jaune'  ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                          'bg-gray-100 text-gray-600 border-gray-200'}`}>{gen.couleur}</span>
                                    )}
                                  </div>
                                  <p className="text-[9px] text-gray-400 pl-3.5 mt-0.5 font-mono">{gen.nni}</p>
                                </td>
                                <td className="px-4 py-1.5 text-[10px] text-gray-400 hidden sm:table-cell">
                                  Stock: {gen.stockDispo ?? '—'} doses
                                </td>
                                <td className="px-4 py-1.5">
                                  <div className="flex flex-col items-end">
                                    <input type="number" value={gen.qte} min={0}
                                      onChange={e => {
                                        const newQte = Math.max(0, Number(e.target.value) || 0);
                                        setRepartGen(prev => {
                                          const updated = [...(prev[idx] ?? [])];
                                          updated[gIdx] = { ...updated[gIdx], qte: newQte };
                                          return { ...prev, [idx]: updated };
                                        });
                                      }}
                                      className={`w-20 border rounded-lg px-2 py-1 text-xs text-right font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all
                                        ${modifie ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-gray-200 text-gray-600'}`}
                                    />
                                    {modifie && <span className="text-[9px] text-amber-500 mt-0.5">calculé: {gen.qteCalculee}</span>}
                                  </div>
                                </td>
                                <td className="px-2 py-1.5" />
                                <td className="px-4 py-1.5 text-right">
                                  <span className="text-[10px] text-gray-400 tabular-nums">
                                    {numVal > 0 ? ((Number(gen.qte) / numVal) * 100).toFixed(0) : 0}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Indicateur de balance génétique par coopérative */}
                          {showGen && (
                            <tr key={`${coop.id}-gtot`} className="bg-gray-50/30">
                              <td colSpan={5} className="px-4 py-1 pl-12 border-b border-gray-100">
                                <span className={`text-[10px] font-semibold ${genOk ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {loadingTaureaux
                                    ? 'Chargement du stock génétique…'
                                    : genOk
                                    ? '✓ Répartition génétique équilibrée'
                                    : `Sous-total : ${genTotal} / ${numVal} doses — écart : ${numVal - genTotal}`}
                                </span>
                              </td>
                            </tr>
                          )}
                        </Fragment>
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
                <button onClick={goToStep2} disabled={loadingTaureaux}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-colors shadow-sm
                    ${loadingTaureaux ? 'bg-blue-400 cursor-wait text-white' : 'text-white bg-blue-600 hover:bg-blue-700'}`}>
                  {loadingTaureaux
                    ? <><RefreshCw size={15} className="animate-spin" /> Chargement du stock…</>
                    : <>Configurer la répartition →</>}
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
   SIMULATEUR DE RÉPARTITION PONDÉRÉE — Mission 9
══════════════════════════════════════════════════════ */
function SimulateurPonderation({ coopList = [], articleMap = {} }) {
  const now        = new Date();
  const monthInput = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [categorieId,  setCategorieId]  = useState('semences');
  const [article,      setArticle]      = useState(() => (articleMap?.semences ?? [])[0] ?? '');
  const [enveloppe,    setEnveloppe]    = useState(1000);
  const [periodeLabel, setPeriodeLabel] = useState(`${MOIS_FR[now.getMonth()]} ${now.getFullYear()}`);
  const [criteres,     setCriteres]     = useState([
    { id: 1, nom: 'Cheptel (têtes)',            poids: 60 },
    { id: 2, nom: 'Production laitière (L/an)', poids: 40 },
  ]);
  const [nextId,     setNextId]     = useState(3);
  const [matrice,    setMatrice]    = useState({});
  const [quotasManu, setQuotasManu] = useState({});
  const [isApplying, setIsApplying] = useState(false);
  const [applyDone,  setApplyDone]  = useState(false);
  const [applyError, setApplyError] = useState(null);

  /* Sync article quand catégorie ou articleMap change */
  useEffect(() => {
    setArticle(a => {
      const arts = articleMap?.[categorieId] ?? [];
      return arts.includes(a) ? a : (arts[0] ?? '');
    });
  }, [categorieId, articleMap]);

  /* ── Poids ─────────────────────────────────────────── */
  const totalPoids = criteres.reduce((s, c) => s + (Number(c.poids) || 0), 0);
  const poidsOk    = Math.abs(totalPoids - 100) < 0.5;

  function addCritere() {
    const remaining = Math.max(0, Math.round(100 - totalPoids));
    setCriteres(p => [...p, { id: nextId, nom: '', poids: remaining }]);
    setNextId(n => n + 1);
  }

  function removeCritere(id) {
    setCriteres(p => p.filter(c => c.id !== id));
    setMatrice(prev => {
      const next = {};
      Object.keys(prev).forEach(coopId => {
        const row = { ...(prev[coopId] ?? {}) };
        delete row[id];
        next[coopId] = row;
      });
      return next;
    });
  }

  function updateCritere(id, field, raw) {
    setCriteres(p => p.map(c => {
      if (c.id !== id) return c;
      if (field === 'poids') {
        const v = raw === '' ? '' : Math.min(100, Math.max(0, Number(raw)));
        return { ...c, poids: v };
      }
      return { ...c, [field]: raw };
    }));
  }

  /* ── Matrice ────────────────────────────────────────── */
  function setCell(coopId, critereId, raw) {
    const val = raw === '' ? '' : Math.max(0, Number(raw));
    setMatrice(p => ({ ...p, [coopId]: { ...(p[coopId] ?? {}), [critereId]: val } }));
    setQuotasManu(p => { const n = { ...p }; delete n[coopId]; return n; });
  }

  /* ── Moteur de calcul (temps réel) ─────────────────── */
  const computed = coopList.map(coop => {
    const vals = matrice[coop.id] ?? {};
    let score = 0;
    criteres.forEach(c => { score += (Number(vals[c.id]) || 0) * (Number(c.poids) || 0) / 100; });
    return { coop, score };
  });
  const totalScore = computed.reduce((s, x) => s + x.score, 0);

  const suggestions = computed.map(({ coop, score }) => ({
    coopId:    coop.id,
    suggested: totalScore > 0 ? Math.round(enveloppe * (score / totalScore)) : 0,
    score,
    pct:       totalScore > 0 ? (score / totalScore * 100).toFixed(1) : '0.0',
  }));

  function getQF(coopId) {
    if (quotasManu[coopId] !== undefined) return quotasManu[coopId];
    return suggestions.find(s => s.coopId === coopId)?.suggested ?? 0;
  }

  const totalFinal   = coopList.reduce((s, c) => s + (Number(getQF(c.id)) || 0), 0);
  const balance      = enveloppe - totalFinal;
  const isBalancedOk = Math.abs(balance) <= 1;

  /* ── Application ────────────────────────────────────── */
  async function handleApply() {
    if (!poidsOk || coopList.length === 0) return;
    setIsApplying(true);
    setApplyError(null);
    try {
      await api.post('/api/quotas', {
        categorieId,
        article,
        volumeTotal: Number(enveloppe),
        periode:     periodeLabel,
        lignes: coopList.map(coop => ({
          cooperative: coop.name,
          region:      coop.region,
          alloue:      Number(getQF(coop.id)) || 0,
        })),
      });
      setApplyDone(true);
      setTimeout(() => setApplyDone(false), 3000);
    } catch (err) {
      setApplyError(err.message ?? "Erreur lors de la création de la campagne.");
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="p-5 space-y-5">

      {/* ── Bandeau ──────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-xl p-4 flex gap-3">
        <div className="bg-violet-100 rounded-lg p-1.5 shrink-0 self-start mt-0.5">
          <BarChart3 size={14} className="text-violet-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-violet-900 mb-0.5">Moteur de Répartition Pondérée</p>
          <p className="text-xs text-violet-700 leading-relaxed">
            Définissez vos critères et leurs poids, saisissez les valeurs par coopérative, et obtenez les quotas calculés par :
            <span className="font-mono ml-1 text-violet-900 bg-violet-100 px-1.5 py-0.5 rounded text-[11px]">
              Quota = Enveloppe × (Score Coop / Score Total)
            </span>
          </p>
        </div>
      </div>

      {/* ── Paramètres campagne ───────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Paramètres de campagne</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Catégorie</label>
            <div className="relative">
              <select value={categorieId} onChange={e => setCategorieId(e.target.value)}
                className="w-full appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white hover:border-gray-300">
                {Object.values(CATEGORIES).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Article</label>
            <div className="relative">
              <select value={article} onChange={e => setArticle(e.target.value)}
                className="w-full appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white hover:border-gray-300">
                {(articleMap?.[categorieId] ?? []).length === 0
                  ? <option value="">— Aucun article —</option>
                  : (articleMap?.[categorieId] ?? []).map(a => <option key={a}>{a}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Enveloppe globale (doses)</label>
            <input type="number" value={enveloppe} min={1}
              onChange={e => setEnveloppe(Math.max(1, Number(e.target.value) || 1))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-gray-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Période</label>
            <input type="month" defaultValue={monthInput}
              onChange={e => {
                const [y, m] = e.target.value.split('-');
                if (y && m) setPeriodeLabel(`${MOIS_FR[+m - 1]} ${y}`);
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-gray-300" />
          </div>
        </div>
      </div>

      {/* ── Critères de pondération ───────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-800">Critères de pondération</p>
            <p className="text-xs text-gray-400 mt-0.5">Chaque critère a un poids en % — la somme doit être 100 %</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
              poidsOk
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {poidsOk ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
              Total : {totalPoids.toFixed(0)} %
            </span>
            <button onClick={addCritere}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 transition-all">
              <Plus size={12} /> Ajouter un critère
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {criteres.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/40 transition-colors">
              <div className="w-5 h-5 rounded-full bg-violet-50 flex items-center justify-center text-[10px] font-bold text-violet-500 shrink-0">
                {i + 1}
              </div>
              <input type="text" value={c.nom}
                placeholder={`Critère ${i + 1} (ex : Cheptel, Lait, Contribution…)`}
                onChange={e => updateCritere(c.id, 'nom', e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-gray-300 hover:border-gray-300" />
              <div className="relative w-24 shrink-0">
                <input type="number" value={c.poids} min={0} max={100}
                  onChange={e => updateCritere(c.id, 'poids', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 pr-7 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-violet-400 hover:border-gray-300" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">%</span>
              </div>
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                <div className="h-1.5 bg-violet-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Number(c.poids) || 0)}%` }} />
              </div>
              <button onClick={() => removeCritere(c.id)} disabled={criteres.length <= 1}
                className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 p-0.5">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {!poidsOk && (
          <div className="px-4 py-2.5 bg-red-50 border-t border-red-100 flex items-center gap-2">
            <AlertCircle size={12} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-700">
              Total actuel : <strong>{totalPoids.toFixed(0)} %</strong> — ajustez les coefficients pour atteindre exactement <strong>100 %</strong>.
            </p>
          </div>
        )}
      </div>

      {/* ── Matrice de saisie ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-800">Matrice de saisie</p>
            <p className="text-xs text-gray-400 mt-0.5">Valeur brute de chaque critère par coopérative — les quotas se calculent en temps réel</p>
          </div>
          <button onClick={() => setQuotasManu({})}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 hover:bg-violet-50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-violet-200 transition-all">
            <RefreshCw size={11} /> Resync suggestions
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 min-w-[180px]">
                  Coopérative
                </th>
                {criteres.map((c, i) => (
                  <th key={c.id} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5 min-w-[130px]">
                    <span className="block truncate max-w-[120px] mx-auto">{c.nom || `Critère ${i + 1}`}</span>
                    <span className="text-violet-500 font-bold normal-case tracking-normal text-[11px]">
                      ({Number(c.poids) || 0} %)
                    </span>
                  </th>
                ))}
                <th className="text-center text-xs font-semibold text-violet-600 uppercase tracking-wide px-3 py-2.5 min-w-[90px] bg-violet-50/60">
                  Score
                </th>
                <th className="text-center text-xs font-semibold text-blue-600 uppercase tracking-wide px-3 py-2.5 min-w-[90px] bg-blue-50/60">
                  Suggéré
                </th>
                <th className="text-center text-xs font-semibold text-gray-700 uppercase tracking-wide px-3 py-2.5 min-w-[110px]">
                  Quota Final
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coopList.length === 0 ? (
                <tr>
                  <td colSpan={criteres.length + 4} className="text-center py-10">
                    <Users size={28} className="mx-auto mb-2 text-gray-200" />
                    <p className="text-sm text-gray-400">Aucune coopérative chargée depuis la base.</p>
                  </td>
                </tr>
              ) : coopList.map(coop => {
                const s       = suggestions.find(x => x.coopId === coop.id);
                const qf      = getQF(coop.id);
                const isManu  = quotasManu[coop.id] !== undefined;
                const diverge = isManu && Number(quotasManu[coop.id]) !== (s?.suggested ?? 0);
                const initials = coop.name.replace(/^Unité\s*/i, '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <tr key={coop.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-violet-50 flex items-center justify-center text-[10px] font-bold text-violet-600 shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 leading-tight">{coop.name}</p>
                          <p className="text-[10px] text-gray-400">{coop.region}</p>
                        </div>
                      </div>
                    </td>
                    {criteres.map(c => (
                      <td key={c.id} className="px-3 py-2.5 text-center">
                        <input type="number" min={0} placeholder="0"
                          value={matrice[coop.id]?.[c.id] ?? ''}
                          onChange={e => setCell(coop.id, c.id, e.target.value)}
                          className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent hover:border-gray-300 transition-colors" />
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-center bg-violet-50/30">
                      <p className="text-sm font-bold text-violet-700 tabular-nums">{(s?.score ?? 0).toFixed(1)}</p>
                      <p className="text-[10px] text-violet-400">{s?.pct ?? '0.0'} %</p>
                    </td>
                    <td className="px-3 py-2.5 text-center bg-blue-50/30">
                      <p className="text-sm font-bold text-blue-700 tabular-nums">{s?.suggested ?? 0}</p>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <input type="number" min={0} value={qf}
                          onChange={e => {
                            const v = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                            setQuotasManu(p => ({ ...p, [coop.id]: v }));
                          }}
                          className={`w-24 border rounded-lg px-2 py-1.5 text-sm text-center font-semibold tabular-nums focus:outline-none focus:ring-2 transition-colors
                            ${diverge
                              ? 'border-amber-300 bg-amber-50 text-amber-800 focus:ring-amber-400'
                              : 'border-gray-200 text-gray-800 focus:ring-violet-400 hover:border-gray-300'}`} />
                        {diverge && (
                          <span className="text-[9px] text-amber-500">suggéré : {s?.suggested}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                <td className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Totaux</td>
                {criteres.map(c => <td key={c.id} />)}
                <td className="px-3 py-3 text-center bg-violet-50/30">
                  <p className="text-sm font-bold text-violet-700 tabular-nums">{totalScore.toFixed(1)}</p>
                </td>
                <td className="px-3 py-3 text-center bg-blue-50/30">
                  <p className="text-sm font-bold text-blue-700 tabular-nums">
                    {suggestions.reduce((s, x) => s + x.suggested, 0)}
                  </p>
                </td>
                <td className="px-3 py-3 text-center">
                  <p className={`text-sm font-bold tabular-nums ${isBalancedOk ? 'text-emerald-600' : 'text-red-600'}`}>
                    {totalFinal}
                  </p>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Résumé + Appliquer ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            {
              label: 'Enveloppe',
              value: enveloppe.toLocaleString(),
              color: 'text-gray-900',
              bg:    'bg-gray-50 border-gray-200',
            },
            {
              label: 'Alloué',
              value: totalFinal.toLocaleString(),
              color: isBalancedOk ? 'text-emerald-700' : 'text-red-600',
              bg:    isBalancedOk ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200',
            },
            {
              label: 'Balance',
              value: balance >= 0 ? `+${balance}` : String(balance),
              color: isBalancedOk ? 'text-emerald-700' : 'text-red-600',
              bg:    isBalancedOk ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200',
            },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-xl border p-3.5 text-center ${bg}`}>
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Consommation de l'enveloppe</span>
            <span className="font-semibold tabular-nums">
              {enveloppe > 0 ? Math.round((totalFinal / enveloppe) * 100) : 0} %
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${
                isBalancedOk ? 'bg-emerald-500' : totalFinal > enveloppe ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, enveloppe > 0 ? (totalFinal / enveloppe) * 100 : 0)}%` }}
            />
          </div>
        </div>

        {applyError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 text-xs text-red-700">
            <AlertCircle size={13} className="shrink-0" /> {applyError}
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="text-xs text-gray-400 max-w-sm leading-relaxed">
            {!poidsOk && (
              <span className="text-red-600 font-medium block mb-1">
                ⚠ La somme des poids est {totalPoids.toFixed(0)} % — corrigez avant de valider.
              </span>
            )}
            {coopList.length === 0 && (
              <span className="text-amber-600 font-medium block mb-1">⚠ Aucune coopérative chargée.</span>
            )}
            Cliquez <strong>Appliquer</strong> pour créer la campagne avec ces quotas pondérés.
            Les Ordres d'Expédition seront générés automatiquement pour chaque unité.
          </div>
          <button onClick={handleApply}
            disabled={!poidsOk || isApplying || applyDone || coopList.length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm shrink-0
              ${applyDone
                ? 'bg-emerald-500 text-white'
                : isApplying
                  ? 'bg-violet-400 text-white cursor-wait'
                  : !poidsOk || coopList.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-violet-600 hover:bg-violet-700 text-white'}`}>
            {applyDone
              ? <><CheckCircle size={15} /> Campagne créée !</>
              : isApplying
                ? <><RefreshCw size={15} className="animate-spin" /> Création…</>
                : <><Save size={15} /> Appliquer les quotas</>}
          </button>
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
  const [showCampagne, setShowCampagne] = useState(false);
  const [data,       setData]       = useState({ semences:[], consommables:[], materiel:[] });
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);
  const [coopList,   setCoopList]   = useState([]);
  const [articleMap, setArticleMap] = useState({
    semences:     CATEGORIES.semences.articles,
    consommables: CATEGORIES.consommables.articles,
    materiel:     CATEGORIES.materiel.articles,
  });

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

  useEffect(() => {
    Promise.all([
      api.get('/api/unites?actif=true&limit=200'),
      api.get('/api/articles?actif=true&limit=200'),
    ]).then(([unitesRes, articlesRes]) => {
      const unites = Array.isArray(unitesRes) ? unitesRes : (unitesRes.data ?? []);
      if (unites.length > 0) {
        /* Déduplication par nom : évite les doublons si plusieurs docs Unite
           portent le même nom en base (artefacts de jeux de données de test). */
        const seen = new Set();
        const unique = unites.filter(u => {
          if (seen.has(u.nom)) return false;
          seen.add(u.nom);
          return true;
        });
        setCoopList(unique.map(u => ({ id: u._id, name: u.nom, region: u.region ?? '—' })));
      }

      const arts = Array.isArray(articlesRes) ? articlesRes : (articlesRes.data ?? []);
      if (arts.length > 0) {
        const m = { semences: [], consommables: [], materiel: [] };
        arts.forEach(a => {
          const c = (a.categorie ?? '').toLowerCase();
          if (c.includes('semence') || c.includes('dose') || c.includes('génétique') || c.includes('genetique'))
            m.semences.push(a.designation);
          else if (c.includes('matériel') || c.includes('materiel') || c.includes('équip') || c.includes('equip') || c.includes('cuve'))
            m.materiel.push(a.designation);
          else
            m.consommables.push(a.designation);
        });
        setArticleMap(m);
      }
    }).catch(() => {});
  }, []);

  /* Filtrage : région puis période */
  const allRows  = data[activeTab] ?? [];
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
        <p className="text-xs text-slate-300 mb-5 max-w-xs leading-relaxed">{error}</p>
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
          coopList={coopList}
          articleMap={articleMap}
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
          {activeTab !== 'simulateur' && (
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={periode} onChange={setPeriode} options={periodes} />
              <Select value={region}  onChange={setRegion}  options={regions}  />
            </div>
          )}
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
            {tabs.map(({ id, label, icon:Icon }) => {
              const isActive = activeTab === id;
              const activeClass = id === 'simulateur'
                ? 'border-violet-600 text-violet-600'
                : 'border-blue-600 text-blue-600';
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors
                    ${isActive ? activeClass : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  <Icon size={15} />{label}
                </button>
              );
            })}
          </div>

          {activeTab === 'simulateur' ? (
            <SimulateurPonderation coopList={coopList} articleMap={articleMap} />
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
