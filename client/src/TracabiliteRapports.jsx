import { useState } from "react";
import {
  BarChart3, Download, Database, Shield, Activity,
  FileText, FileSpreadsheet, ChevronDown, TrendingUp,
  TrendingDown, Droplets, Package, AlertTriangle,
  CheckCircle, Info, AlertCircle, Clock, User,
  MapPin, Zap, Eye, Filter, Building2, X, Square, CheckSquare
} from "lucide-react";

/* ══════════════════════════════════════════════════════
   DONNÉES SIMULÉES
══════════════════════════════════════════════════════ */

const PERIODES   = ["Ce mois", "Ce trimestre", "Cette année", "Personnalisée..."];
const REGIONS    = ["Toutes les régions", "Souss-Massa", "Laâyoune-Sakia", "Béni Mellal-Khénifra", "Rabat-Salé-Kénitra", "Casablanca-Settat"];
const UNITES     = ["Unité Aït Si Salem", "Unité Sakia Al Hamra", "Unité Tadla Azilal", "Unité Gharb Chrarda", "Unité Chaouia Ouardigha", "Unité Doukkala Abda"];
const PERIMETRE  = ["Global (Tout le Maroc)", "Régional", "Par Unité / Coopérative"];
const ARTICLES   = ["Tous les articles", "Semences Bovines", "Azote Liquide", "Matériel & Équipements"];

const STOCKS_REGIONAUX = [
  { region: "Unité Aït Si Salem",       semences: 1240, semencesMax: 2000, azote: 820,  azoteMax: 1500, statut: "normal"   },
  { region: "Unité Sakia Al Hamra",     semences: 310,  semencesMax: 2000, azote: 180,  azoteMax: 1500, statut: "critique" },
  { region: "Unité Tadla Azilal",       semences: 890,  semencesMax: 2000, azote: 1100, azoteMax: 1500, statut: "normal"   },
  { region: "Unité Gharb Chrarda",      semences: 1560, semencesMax: 2000, azote: 650,  azoteMax: 1500, statut: "alerte"   },
  { region: "Unité Chaouia Ouardigha",  semences: 420,  semencesMax: 2000, azote: 290,  azoteMax: 1500, statut: "alerte"   },
  { region: "Unité Doukkala Abda",      semences: 1780, semencesMax: 2000, azote: 1320, azoteMax: 1500, statut: "normal"   },
];

const GRAPH_DATA = [
  { mois: "Mars",  alloue: 3200, consomme: 2100 },
  { mois: "Avr.",  alloue: 3500, consomme: 3100 },
  { mois: "Mai",   alloue: 4100, consomme: 3850 },
  { mois: "Juin",  alloue: 3800, consomme: 2960 },
];

const AUDIT_LOGS = [
  {
    id: 1,
    datetime: "2025-06-14 13:42",
    utilisateur: "Super Admin",
    role: "Administration",
    action: "Génération PIN Dérogation",
    cible: "Unité Sakia Al Hamra",
    type: "warning",
  },
  {
    id: 2,
    datetime: "2025-06-14 12:17",
    utilisateur: "Admin Fédéral",
    role: "Administration",
    action: "Réception Fournisseur Validée",
    cible: "Semex Europe FR · CMD-892",
    type: "success",
  },
  {
    id: 3,
    datetime: "2025-06-14 11:55",
    utilisateur: "Direction",
    role: "Direction Générale",
    action: "Modification Quota Global",
    cible: "Campagne Semences Juin 2025",
    type: "info",
  },
  {
    id: 4,
    datetime: "2025-06-14 11:08",
    utilisateur: "Admin Fédéral",
    role: "Administration",
    action: "Dérogation Accordée (+100 doses)",
    cible: "Unité Doukkala Abda",
    type: "warning",
  },
  {
    id: 5,
    datetime: "2025-06-14 10:34",
    utilisateur: "Magasinier · Benali",
    role: "Opérateur Stock",
    action: "Expédition Validée (600 L azote)",
    cible: "Unité Aït Si Salem",
    type: "success",
  },
  {
    id: 6,
    datetime: "2025-06-14 09:50",
    utilisateur: "Admin Fédéral",
    role: "Administration",
    action: "Tentative connexion PIN échouée",
    cible: "Session #A-0049",
    type: "error",
  },
  {
    id: 7,
    datetime: "2025-06-14 09:15",
    utilisateur: "Super Admin",
    role: "Administration",
    action: "Nouvelle Campagne Créée",
    cible: "Semences Juin 2025 · 6 unités",
    type: "info",
  },
  {
    id: 8,
    datetime: "2025-06-14 08:32",
    utilisateur: "Admin Fédéral",
    role: "Administration",
    action: "Réception Validée (1 000 doses)",
    cible: "Alta Genetics NL · CMD-891",
    type: "success",
  },
];

/* ══════════════════════════════════════════════════════
   HELPERS & SOUS-COMPOSANTS
══════════════════════════════════════════════════════ */

function Select({ value, onChange, options, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-gray-300 transition-colors">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

function AuditBadge({ type }) {
  const cfg = {
    success: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle,  label: "Succès"     },
    warning: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   icon: AlertTriangle, label: "Attention"  },
    error:   { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     icon: AlertCircle,  label: "Erreur"     },
    info:    { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    icon: Info,         label: "Info"       },
  }[type] ?? {};
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <cfg.icon size={10} />{cfg.label}
    </span>
  );
}

function MiniStockBar({ value, max, statut, label, unit }) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = statut === "critique" ? "bg-red-500"
    : pct < 35 ? "bg-red-400"
    : pct < 55 ? "bg-amber-400"
    : "bg-emerald-500";
  const trackColor = statut === "critique" ? "bg-red-100"
    : pct < 35 ? "bg-red-50"
    : pct < 55 ? "bg-amber-50"
    : "bg-emerald-50";
  const textColor = statut === "critique" ? "text-red-600"
    : pct < 35 ? "text-red-500"
    : pct < 55 ? "text-amber-600"
    : "text-gray-600";

  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-gray-400 font-medium">{label}</span>
        <span className={`text-[10px] font-bold tabular-nums ${textColor}`}>
          {value.toLocaleString()} {unit}
        </span>
      </div>
      <div className={`h-1.5 rounded-full ${trackColor}`}>
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MODALE D'EXPORT
══════════════════════════════════════════════════════ */
function ExportModal({ format, filters, onClose }) {
  const [sections, setSections] = useState({
    stocks:     true,
    graphiques: true,
    audit:      false,
  });
  const [generating, setGenerating] = useState(false);
  const [done,       setDone]       = useState(false);

  const sectionLabels = {
    stocks:     { label: "État des stocks régionaux",          icon: Database      },
    graphiques: { label: "Graphiques de consommation",         icon: BarChart3     },
    audit:      { label: "Registre d'audit de sécurité",       icon: Shield        },
  };

  const countSelected = Object.values(sections).filter(Boolean).length;

  function toggle(key) {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleGenerate() {
    if (countSelected === 0) return;
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setDone(true); }, 1600);
    setTimeout(() => { onClose(); }, 2800);
  }

  const isPdf = format === "pdf";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: "modalIn .18s cubic-bezier(.32,0,.67,0) forwards" }}>

        <style>{`@keyframes modalIn{from{transform:scale(.96);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

        {/* En-tête */}
        <div className={`px-6 pt-5 pb-4 flex items-start justify-between border-b border-gray-100`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isPdf ? "bg-gray-100" : "bg-emerald-50"}`}>
              {isPdf ? <FileText size={18} className="text-gray-600" /> : <FileSpreadsheet size={18} className="text-emerald-600" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Configuration de l'Export</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Format : <span className="font-semibold text-gray-600">{isPdf ? "PDF" : "Excel / CSV"}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Résumé des filtres */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">Filtres appliqués</p>
            {[
              { label: "Période",   value: filters.periode   },
              { label: "Périmètre", value: filters.perimetre },
              { label: "Sélection", value: filters.selection || "—" },
              { label: "Article",   value: filters.article   },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-xs text-blue-600 font-medium">{label}</span>
                <span className="text-xs font-semibold text-blue-900 text-right">{value}</span>
              </div>
            ))}
          </div>

          {/* Sections à inclure */}
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2.5">Contenu du document</p>
            <div className="space-y-2">
              {Object.entries(sectionLabels).map(([key, { label, icon: Icon }]) => (
                <button key={key} onClick={() => toggle(key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                    ${sections[key]
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${sections[key] ? "bg-blue-600" : "bg-gray-100"}`}>
                    <Icon size={13} className={sections[key] ? "text-white" : "text-gray-400"} />
                  </div>
                  <span className={`flex-1 text-sm font-medium ${sections[key] ? "text-blue-800" : "text-gray-600"}`}>
                    {label}
                  </span>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all
                    ${sections[key] ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                    {sections[key] && <CheckCircle size={10} className="text-white" />}
                  </div>
                </button>
              ))}
            </div>
            {countSelected === 0 && (
              <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={11} /> Sélectionnez au moins une section.
              </p>
            )}
          </div>
        </div>

        {/* Pied */}
        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleGenerate} disabled={countSelected === 0 || generating || done}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all
              ${done
                ? "bg-emerald-500 text-white"
                : generating
                  ? "bg-blue-400 text-white cursor-wait"
                  : countSelected === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isPdf
                      ? "bg-gray-800 hover:bg-gray-900 text-white shadow-sm"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"}`}>
            {done
              ? <><CheckCircle size={15} /> Document prêt — téléchargement…</>
              : generating
                ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Génération en cours…</>
                : <><Download size={15} /> Générer le document ({countSelected} section{countSelected > 1 ? "s" : ""})</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════ */
export default function TracabiliteRapports() {
  /* ── Filtres avancés ── */
  const [periode,    setPeriode]    = useState(PERIODES[0]);
  const [perimetre,  setPerimetre]  = useState(PERIMETRE[0]);
  const [selection,  setSelection]  = useState("");
  const [article,    setArticle]    = useState(ARTICLES[0]);

  /* ── Export modal ── */
  const [exportModal, setExportModal] = useState(null); // null | "pdf" | "excel"

  /* ── Audit ── */
  const [auditFilter, setAuditFilter] = useState("tous");

  /* ── Sélection dynamique selon périmètre ── */
  const selectionOptions =
    perimetre === "Régional"               ? REGIONS.slice(1) :
    perimetre === "Par Unité / Coopérative" ? UNITES           : [];
  const showSelection = selectionOptions.length > 0;

  /* Résumé filtres pour la modale */
  const filtersSummary = {
    periode,
    perimetre,
    selection: showSelection && selection ? selection : perimetre,
    article,
  };

  const graphMax = Math.max(...GRAPH_DATA.map(d => d.alloue)) * 1.1;

  const filteredLogs = auditFilter === "tous"
    ? AUDIT_LOGS
    : AUDIT_LOGS.filter(l => l.type === auditFilter);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── Modale Export ── */}
      {exportModal && (
        <ExportModal
          format={exportModal}
          filters={filtersSummary}
          onClose={() => setExportModal(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* ── Header ───────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1 flex-wrap">
                <span>MLstock</span><span>/</span>
                <span>Administration Fédérale</span><span>/</span>
                <span className="text-blue-600 font-medium">Traçabilité & Rapports</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Tableau de Bord & État des Stocks</h1>
              <p className="text-sm text-gray-500 mt-0.5">Vue exécutive · Stocks, consommation et audit de sécurité</p>
            </div>

            {/* Boutons Export → ouvrent la modale */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setExportModal("pdf")}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
                <FileText size={14} /> Exporter PDF
              </button>
              <button onClick={() => setExportModal("excel")}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all">
                <FileSpreadsheet size={14} /> Export Excel / CSV
              </button>
            </div>
          </div>

          {/* ── Barre de filtres avancés ─────────── */}
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-wrap items-end gap-3">
            <Filter size={13} className="text-gray-400 shrink-0 mb-2.5" />

            {/* Période */}
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Période</label>
              <div className="relative">
                <select value={periode} onChange={e => setPeriode(e.target.value)}
                  className="appearance-none w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors cursor-pointer">
                  {PERIODES.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Périmètre */}
            <div className="flex flex-col gap-1 min-w-[180px]">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Périmètre</label>
              <div className="relative">
                <select value={perimetre}
                  onChange={e => { setPerimetre(e.target.value); setSelection(""); }}
                  className="appearance-none w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors cursor-pointer">
                  {PERIMETRE.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Sélection dynamique */}
            {showSelection && (
              <div className="flex flex-col gap-1 min-w-[200px]">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  {perimetre === "Régional" ? "Région" : "Unité / Coopérative"}
                </label>
                <div className="relative">
                  <select value={selection} onChange={e => setSelection(e.target.value)}
                    className="appearance-none w-full bg-white border border-blue-300 text-gray-700 text-sm rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors cursor-pointer">
                    <option value="">— Sélectionner —</option>
                    {selectionOptions.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Article */}
            <div className="flex flex-col gap-1 min-w-[170px]">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Article</label>
              <div className="relative">
                <select value={article} onChange={e => setArticle(e.target.value)}
                  className="appearance-none w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors cursor-pointer">
                  {ARTICLES.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Résumé actif */}
            <div className="ml-auto flex items-center gap-2 pb-0.5 flex-wrap justify-end">
              {[
                perimetre !== PERIMETRE[0] ? perimetre.split(" ")[0] : null,
                selection || null,
                article !== ARTICLES[0] ? article : null,
              ].filter(Boolean).map(tag => (
                <span key={tag} className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
              {perimetre === PERIMETRE[0] && article === ARTICLES[0] && (
                <span className="text-[10px] text-gray-400">Vue globale</span>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI 4 colonnes ───────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: "Stock Central Semences",
              value: "45 200",
              unit: "doses",
              icon: Database,
              bg: "bg-blue-50", iconColor: "text-blue-600",
              trend: "+3.2%", trendUp: true,
              sub: "Capacité totale : 80 000 doses",
            },
            {
              label: "Stock Central Azote",
              value: "8 500",
              unit: "litres",
              icon: Droplets,
              bg: "bg-cyan-50", iconColor: "text-cyan-600",
              trend: "−1.8%", trendUp: false,
              sub: "Seuil critique : 2 000 L",
            },
            {
              label: "Taux Consommation Quota",
              value: "78%",
              unit: "alloué",
              icon: BarChart3,
              bg: "bg-indigo-50", iconColor: "text-indigo-600",
              trend: "+5 pts", trendUp: true,
              sub: "Reste : 22% non consommé",
            },
            {
              label: "Indice Sécurité OTP/PIN",
              value: "98%",
              unit: "succès",
              icon: Shield,
              bg: "bg-emerald-50", iconColor: "text-emerald-600",
              trend: "−1 échec", trendUp: false,
              sub: "1 tentative invalide · J-0",
            },
          ].map(({ label, value, unit, icon: Icon, bg, iconColor, trend, trendUp, sub }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className={`${bg} p-2.5 rounded-xl shrink-0`}>
                  <Icon size={18} className={iconColor} />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
                  {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {trend}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                  {value} <span className="text-sm font-normal text-gray-400">{unit}</span>
                </p>
              </div>
              <p className="text-[10px] text-gray-400 border-t border-gray-50 pt-2">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Zone centrale : stocks + graphique ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ── Colonne gauche : Stocks régionaux ── */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">État des Stocks Régionaux</h2>
                <p className="text-xs text-gray-400 mt-0.5">Inventaire décentralisé · Niveau de remplissage</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Normal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Alerte</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critique</span>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {STOCKS_REGIONAUX.map(({ region, semences, semencesMax, azote, azoteMax, statut }) => {
                const alerteRegion = statut === "critique" || statut === "alerte";
                const initials = region.replace("Unité ", "").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={region}
                    className={`px-5 py-3.5 flex gap-3 items-start transition-colors hover:bg-gray-50/60
                      ${statut === "critique" ? "bg-red-50/30" : ""}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5
                      ${statut === "critique" ? "bg-red-100 text-red-600"
                        : statut === "alerte" ? "bg-amber-100 text-amber-700"
                        : "bg-blue-50 text-blue-600"}`}>
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className={`text-xs font-semibold ${statut === "critique" ? "text-red-700" : "text-gray-800"}`}>
                            {region}
                          </p>
                        </div>
                        {alerteRegion && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                            ${statut === "critique" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                            {statut === "critique" ? "⚠ Rupture imminente" : "↓ Niveau bas"}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4">
                        <MiniStockBar value={semences} max={semencesMax} statut={statut} label="Semences" unit="doses" />
                        <MiniStockBar value={azote}    max={azoteMax}    statut={statut} label="Azote"    unit="L"     />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-2.5 border-t border-gray-50 bg-gray-50/40">
              <p className="text-[10px] text-gray-400">
                {STOCKS_REGIONAUX.filter(s => s.statut === "critique").length} unité(s) en rupture imminente ·{" "}
                {STOCKS_REGIONAUX.filter(s => s.statut === "alerte").length} en alerte
              </p>
            </div>
          </div>

          {/* ── Colonne droite : Graphique consommation ── */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Consommation vs Quotas Alloués</h2>
                <p className="text-xs text-gray-400 mt-0.5">4 derniers mois · Semences (doses)</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-500 shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-200 inline-block" /> Alloué
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" /> Consommé
                </span>
              </div>
            </div>

            <div className="px-5 py-5">
              {/* Axe Y labels */}
              <div className="flex flex-col gap-0 mb-2">
                <div className="flex items-end gap-3 h-52">
                  {/* Axe Y */}
                  <div className="flex flex-col justify-between items-end h-full pb-6 shrink-0">
                    {[4500, 3000, 1500, 0].map(v => (
                      <span key={v} className="text-[10px] text-gray-300 tabular-nums">{v.toLocaleString()}</span>
                    ))}
                  </div>

                  {/* Barres */}
                  <div className="flex-1 flex items-end justify-around gap-2 h-full">
                    {GRAPH_DATA.map(({ mois, alloue, consomme }) => {
                      const hAlloue    = (alloue    / graphMax) * 100;
                      const hConsomme  = (consomme  / graphMax) * 100;
                      const pctConso   = Math.round((consomme / alloue) * 100);
                      const overUsed   = pctConso >= 95;
                      return (
                        <div key={mois} className="flex flex-col items-center gap-1.5 flex-1 h-full group">
                          {/* Tooltip hover */}
                          <div className="relative flex items-end justify-center gap-1 flex-1 w-full">
                            {/* Bulle tooltip */}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10
                              bg-slate-900 text-white text-[10px] rounded-lg px-2.5 py-1.5 whitespace-nowrap pointer-events-none shadow-lg">
                              <div className="font-semibold mb-0.5">{mois}</div>
                              <div>Alloué : {alloue.toLocaleString()}</div>
                              <div>Consommé : {consomme.toLocaleString()} ({pctConso}%)</div>
                            </div>

                            {/* Barre allouée (fond) */}
                            <div className="relative w-full flex items-end h-full">
                              <div
                                className="w-full bg-blue-100 rounded-t-md relative overflow-hidden"
                                style={{ height: `${hAlloue}%` }}>
                                {/* Barre consommée (superposée) */}
                                <div
                                  className={`absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-700
                                    ${overUsed ? "bg-amber-500" : "bg-blue-600"}`}
                                  style={{ height: `${(consomme / alloue) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Label mois */}
                          <span className="text-[10px] font-medium text-gray-500">{mois}</span>

                          {/* Pct */}
                          <span className={`text-[10px] font-bold tabular-nums ${overUsed ? "text-amber-600" : "text-blue-600"}`}>
                            {pctConso}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Résumé sous le graphique */}
              <div className="mt-4 grid grid-cols-2 gap-2 pt-4 border-t border-gray-50">
                {[
                  { label:"Total alloué",    value: GRAPH_DATA.reduce((a,d) => a + d.alloue,   0).toLocaleString(), unit:"doses", color:"text-blue-600"   },
                  { label:"Total consommé",  value: GRAPH_DATA.reduce((a,d) => a + d.consomme, 0).toLocaleString(), unit:"doses", color:"text-blue-900"   },
                  { label:"Pic de consomm.", value: Math.max(...GRAPH_DATA.map(d => d.consomme)).toLocaleString(),   unit:"doses · Mai", color:"text-amber-600" },
                  { label:"Taux moyen",      value: `${Math.round(GRAPH_DATA.reduce((a,d) => a + (d.consomme/d.alloue)*100, 0) / GRAPH_DATA.length)}%`,
                    unit:"sur 4 mois", color:"text-indigo-600" },
                ].map(({ label, value, unit, color }) => (
                  <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-400">{label}</p>
                    <p className={`text-sm font-bold ${color} tabular-nums`}>{value} <span className="text-[10px] font-normal text-gray-400">{unit}</span></p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Registre d'Audit Inaltérable ─────────── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-slate-900 p-1.5 rounded-lg">
                <Shield size={14} className="text-blue-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Registre d'Audit Inaltérable</h2>
                <p className="text-xs text-gray-400 mt-0.5">Journal de sécurité · Lecture seule · Infalsifiable</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtre type */}
              {[
                { id:"tous",    label:"Tous"      },
                { id:"success", label:"Succès"    },
                { id:"warning", label:"Attention" },
                { id:"error",   label:"Erreurs"   },
                { id:"info",    label:"Info"      },
              ].map(({ id, label }) => (
                <button key={id} onClick={() => setAuditFilter(id)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors
                    ${auditFilter === id
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    {["#","Date / Heure","Utilisateur","Action Réalisée","Cible","Statut"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLogs.map((log, i) => (
                    <tr key={log.id} className={`transition-colors hover:bg-gray-50/60
                      ${log.type === "error" ? "bg-red-50/20" : ""}`}>
                      <td className="px-4 py-3 text-xs font-mono text-gray-300">
                        {String(log.id).padStart(3, "0")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={10} className="text-gray-300 shrink-0" />
                          {log.datetime}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <User size={9} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-800 whitespace-nowrap">{log.utilisateur}</p>
                            <p className="text-[10px] text-gray-400">{log.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700 whitespace-nowrap">{log.action}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={10} className="text-gray-300 shrink-0" />
                          <span className="whitespace-nowrap">{log.cible}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AuditBadge type={log.type} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              {filteredLogs.length} événement{filteredLogs.length > 1 ? "s" : ""} · Chiffrement SHA-256 · Horodatage certifié
            </div>
            <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              <Download size={12} /> Exporter le registre
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
