import { useState, useEffect, useMemo } from "react";
import { api } from "./lib/api";
import DataGridV2 from './components/DataGridV2';
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

const PERIODES  = ["Ce mois", "Ce trimestre", "Cette année", "Personnalisée..."];
const PERIMETRE = ["Global (Tout le Maroc)", "Régional", "Par Unité / Coopérative"];

const TX_TO_AUDIT = {
  RECEPTION:   { action:"Réception enregistrée",     type:"success" },
  EXPEDITION:  { action:"Expédition transmise",       type:"info"    },
  ORDRE_ADMIN: { action:"Ordre Admin émis",           type:"warning" },
};

function fromTxToAudit(t, idx) {
  const meta = TX_TO_AUDIT[t.type] ?? { action: t.type, type: "info" };
  const dest = t.uniteCible?.nom || t.fournisseurCible?.nom || '—';
  return {
    id:          t._id ?? idx,
    datetime:    new Date(t.createdAt).toLocaleString('fr-FR', { year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit' }),
    utilisateur: t.initiatedBy ? `${t.initiatedBy.prenom ?? ''} ${t.initiatedBy.nom ?? ''}`.trim() : '—',
    role:        t.initiatedBy?.role ?? '—',
    action:      meta.action,
    cible:       `${t.reference} → ${dest}`,
    type:        meta.type,
    ip:          t.clientIp ?? t.ip ?? '—',
    module:      t.type === 'RECEPTION' ? 'Réceptions' : t.type === 'EXPEDITION' ? 'Expéditions' : 'Ordres Admin',
  };
}

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
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
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
  const [article,    setArticle]    = useState("Tous les articles");
  const [auditFilter, setAuditFilter] = useState("tous");
  const [exportModal, setExportModal] = useState(null);

  /* ── Données dynamiques ── */
  const [stocks,        setStocks]        = useState({});
  const [stocksRegion,  setStocksRegion]  = useState([]);
  const [auditLogs,     setAuditLogs]     = useState([]);
  const [unitesList,    setUnitesList]    = useState([]);
  const [regionsList,   setRegionsList]   = useState([]);
  const [articlesList,  setArticlesList]  = useState(["Tous les articles"]);
  const [isLoading,     setIsLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard/stats'),
      api.get('/api/transactions?limit=10'),
      api.get('/api/unites?limit=200'),
      api.get('/api/articles?limit=200'),
    ]).then(([statsRes, txRes, unitesRes, articlesRes]) => {
      /* Stats dashboard */
      setStocks(statsRes.stocks ?? {});
      setStocksRegion(statsRes.regions ?? []);

      /* Audit logs depuis transactions */
      const txList = Array.isArray(txRes) ? txRes : (txRes.data ?? []);
      setAuditLogs(txList.map(fromTxToAudit));

      /* Filtres unités */
      const unites = Array.isArray(unitesRes) ? unitesRes : (unitesRes.data ?? []);
      const noms   = unites.map(u => u.nom).filter(Boolean);
      const regions = [...new Set(unites.map(u => u.region).filter(Boolean))];
      setUnitesList(noms);
      setRegionsList(regions);

      /* Filtres articles */
      const arts = Array.isArray(articlesRes) ? articlesRes : (articlesRes.data ?? []);
      setArticlesList(["Tous les articles", ...arts.map(a => a.designation).filter(Boolean)]);
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const selectionOptions =
    perimetre === "Régional"               ? regionsList :
    perimetre === "Par Unité / Coopérative" ? unitesList  : [];
  const showSelection = selectionOptions.length > 0;

  const filtersSummary = {
    periode,
    perimetre,
    selection: showSelection && selection ? selection : perimetre,
    article,
  };

  const filteredLogs = auditFilter === "tous"
    ? auditLogs
    : auditLogs.filter(l => l.type === auditFilter);

  const [filtreUtilisateur, setFiltreUtilisateur] = useState('');
  const [filtreModule,      setFiltreModule]      = useState('');
  const [filtreCriticite,   setFiltreCriticite]   = useState('');

  const auditFiltres = useMemo(() => filteredLogs.filter(l => {
    if (filtreUtilisateur && l.utilisateur !== filtreUtilisateur) return false;
    if (filtreModule      && l.module      !== filtreModule)      return false;
    if (filtreCriticite   && l.type        !== filtreCriticite)   return false;
    return true;
  }), [filteredLogs, filtreUtilisateur, filtreModule, filtreCriticite]);

  const SEL_T = "text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400";

  const colonnesAudit = [
    {
      key: 'id', label: '#', minWidth: 48,
      render: (_v, _r, i) => (
        <span className="text-xs font-mono text-gray-300">{String(i + 1).padStart(3, '0')}</span>
      ),
      exportValue: (_r, i) => String(i + 1).padStart(3, '0'),
    },
    {
      key: 'datetime', label: 'Date / Heure', sortable: true,
      render: v => (
        <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
          <Clock size={10} className="text-gray-300 shrink-0" />{v}
        </div>
      ),
    },
    {
      key: 'utilisateur', label: 'Utilisateur', sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <User size={9} className="text-slate-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-800 whitespace-nowrap">{v}</p>
            <p className="text-[10px] text-gray-400">{row.role}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'module', label: 'Module', sortable: true,
      render: v => <span className="text-xs text-gray-500">{v}</span>,
    },
    {
      key: 'ip', label: 'Adresse IP',
      render: v => <span className="text-xs font-mono text-gray-400">{v}</span>,
    },
    {
      key: 'action', label: 'Action Réalisée',
      render: v => <p className="text-xs text-gray-700 whitespace-nowrap">{v}</p>,
    },
    {
      key: 'cible', label: 'Cible',
      render: v => (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={10} className="text-gray-300 shrink-0" />
          <span className="whitespace-nowrap">{v}</span>
        </div>
      ),
    },
    {
      key: 'type', label: 'Statut',
      render: v => <AuditBadge type={v} />,
      exportValue: row => row.type,
    },
  ];

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
                    {selectionOptions.length === 0
                      ? <option>Aucune donnée</option>
                      : selectionOptions.map(o => <option key={o}>{o}</option>)
                    }
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
                  {articlesList.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Résumé actif */}
            <div className="ml-auto flex items-center gap-2 pb-0.5 flex-wrap justify-end">
              {[
                perimetre !== PERIMETRE[0] ? perimetre.split(" ")[0] : null,
                selection || null,
                article !== "Tous les articles" ? article : null,
              ].filter(Boolean).map(tag => (
                <span key={tag} className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
              {perimetre === PERIMETRE[0] && article === "Tous les articles" && (
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
              value: isLoading ? '…' : (stocks.semences?.toLocaleString() ?? '—'),
              unit: "doses",
              icon: Database, bg: "bg-blue-50", iconColor: "text-blue-600",
            },
            {
              label: "Stock Central Azote",
              value: isLoading ? '…' : (stocks.azote?.toLocaleString() ?? '—'),
              unit: "litres",
              icon: Droplets, bg: "bg-cyan-50", iconColor: "text-cyan-600",
            },
            {
              label: "Taux Consommation Quota",
              value: isLoading ? '…' : (stocks.quotaPct != null ? `${stocks.quotaPct}%` : '—'),
              unit: "alloué",
              icon: BarChart3, bg: "bg-indigo-50", iconColor: "text-indigo-600",
            },
            {
              label: "Activité logistique",
              value: isLoading ? '…' : auditLogs.length,
              unit: "transactions",
              icon: Activity, bg: "bg-emerald-50", iconColor: "text-emerald-600",
            },
          ].map(({ label, value, unit, icon: Icon, bg, iconColor }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3">
              <div className={`${bg} p-2.5 rounded-xl w-fit`}>
                <Icon size={18} className={iconColor} />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                  {value} <span className="text-sm font-normal text-gray-400">{unit}</span>
                </p>
              </div>
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
              {isLoading ? (
                <div className="flex items-center justify-center gap-3 py-10">
                  <span className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">Chargement…</span>
                </div>
              ) : stocksRegion.length === 0 ? (
                <div className="py-10 text-center">
                  <MapPin size={28} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-sm text-gray-400 font-medium">Aucune donnée régionale</p>
                  <p className="text-xs text-gray-300 mt-1">Les données apparaîtront après la première campagne.</p>
                </div>
              ) : stocksRegion.map(({ nom, doses, pct, statut }) => {
                const alerteRegion = statut === "critique" || statut === "alerte";
                const initials = nom.replace("Unité ", "").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={nom}
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
                        <p className={`text-xs font-semibold ${statut === "critique" ? "text-red-700" : "text-gray-800"}`}>{nom}</p>
                        {alerteRegion && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                            ${statut === "critique" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                            {statut === "critique" ? "⚠ Critique" : "↓ Alerte"}
                          </span>
                        )}
                      </div>
                      <MiniStockBar value={doses} max={Math.max(doses, 1)} statut={statut} label={`${pct}% consommé`} unit="doses" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-2.5 border-t border-gray-50 bg-gray-50/40">
              <p className="text-[10px] text-gray-400">
                {stocksRegion.filter(s => s.statut === "critique").length} région(s) critique ·{" "}
                {stocksRegion.filter(s => s.statut === "alerte").length} en alerte
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
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-100 rounded-xl">
                <BarChart3 size={28} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400 font-medium">Graphique de consommation</p>
                <p className="text-xs text-gray-300 mt-1">Disponible après l'enregistrement des campagnes mensuelles.</p>
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
          <DataGridV2
            columns={colonnesAudit}
            data={auditFiltres}
            rowKey="id"
            title="Registre d'Audit"
            exportFilename="audit-tracabilite"
            loading={isLoading}
            emptyMessage="Aucune activité enregistrée pour le moment."
            actions={
              <div className="flex flex-wrap items-center gap-1.5" onClick={e => e.stopPropagation()}>
                <select value={filtreUtilisateur} onChange={e => setFiltreUtilisateur(e.target.value)} className={SEL_T}>
                  <option value="">Tout utilisateur</option>
                  {[...new Set(auditLogs.map(l => l.utilisateur).filter(v => v && v !== '—'))].sort().map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <select value={filtreModule} onChange={e => setFiltreModule(e.target.value)} className={SEL_T}>
                  <option value="">Tout module</option>
                  {['Réceptions', 'Expéditions', 'Ordres Admin'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select value={filtreCriticite} onChange={e => setFiltreCriticite(e.target.value)} className={SEL_T}>
                  <option value="">Toute criticité</option>
                  {[{v:'success',l:'Succès'},{v:'info',l:'Info'},{v:'warning',l:'Attention'},{v:'error',l:'Erreur'}].map(({v,l}) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            }
          />
          <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Chiffrement SHA-256 · Horodatage certifié
          </div>
        </div>

      </div>
    </div>
  );
}
