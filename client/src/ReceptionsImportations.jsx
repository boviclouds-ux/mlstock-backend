// ReceptionsImportations.jsx — Hub Logistique Central · Déchargements en cours
import { useState, useEffect, useMemo } from "react";
import { api } from "./lib/api";
import DataGridV2 from './components/DataGridV2';
import {
  Truck, Snowflake, FlaskConical, Wrench, Dna,
  PackageCheck, ClipboardCheck, AlertTriangle, CheckCircle,
  XCircle, X, Clock, MapPin, ChevronRight, Archive,
  ScanLine, ShieldCheck, ChevronLeft, TriangleAlert,
  ChevronDown, Plus,
} from "lucide-react";

/* Mapping typeProduit V2 → type icône interne */
function typeFromProduit(tp) {
  if (tp === 'Conventionnelle' || tp === 'Sexée') return 'semence';
  if (tp === 'Azote') return 'azote';
  const lower = (tp ?? '').toLowerCase();
  if (lower.includes('consomm') || lower.includes('sant') || lower.includes('vaccin') || lower.includes('médic')) return 'consommable';
  return 'materiel';
}

/* ─── Adaptateur Approvisionnement API → Camion Réception ─ */
const STATUT_APPRO_MAP = {
  prevu:              'en_attente',
  en_transit:         'en_cours',
  a_quai:             'controle',
  conforme:           'en_stock',
  partiel:            'litige',
  retour_fournisseur: 'retour',
  non_conforme:       'incident',
};

function fromApiApproToCamion(a) {
  return {
    _id:          a._id,
    id:           a.numeroCommande,
    matricule:    a.transporteur ?? '—',
    transporteur: `${a.fournisseurPavillon ?? '🌍'} ${a.fournisseurNom}`,
    origine:      `${a.fournisseurNom}${a.fournisseurPays ? ' · ' + a.fournisseurPays : ''}`,
    pavillon:     a.fournisseurPavillon ?? '🌍',
    pays:         a.fournisseurPays     ?? '',
    quai:         a.lieuStockage ?? 'Magasin Central',
    heureArrivee: a.dateArriveePrevu
      ? new Date(a.dateArriveePrevu).toLocaleDateString('fr-FR')
      : '—',
    dateEntreeStock: a.updatedAt
      ? new Date(a.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—',
    ref_bc:   a.numeroCommande,
    chargement: (a.lignes ?? []).map(l => ({
      label:          l.label,
      qte:            l.qte,
      unite:          l.uniteMesure ?? l.unite,
      type:           typeFromProduit(l.typeProduit),
      articleId:      l.articleId,
      ficheTechnique: l.ficheTechnique ?? [],
    })),
    statut:          STATUT_APPRO_MAP[a.statut] ?? 'en_attente',
    controle:        a.conformite?.resultat ? a.conformite : null,
    dateReception:   a.updatedAt
      ? new Date(a.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—',
    receptionnaire:  a.receptionnaire?.nom ?? a.updatedBy?.nom ?? '—',
    refBcFournisseur: a.refBL ?? a.numeroCommande,
  };
}

/* ─── Helpers ──────────────────────────────────────────── */
function typeIcon(type, sz = 11) {
  if (type === "semence")  return <Dna size={sz} className="text-blue-400 shrink-0" />;
  if (type === "azote")    return <FlaskConical size={sz} className="text-cyan-500 shrink-0" />;
  return <Wrench size={sz} className="text-slate-400 shrink-0" />;
}

const STATUT_META = {
  en_attente: { label: "En attente",         bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400"   },
  en_cours:   { label: "Déchargement",       bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500"    },
  controle:   { label: "À contrôler",        bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500"   },
  en_stock:   { label: "Mis en stock",       bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  litige:     { label: "Litige — Partiel",   bg: "bg-orange-50",   text: "text-orange-700",  dot: "bg-orange-500"  },
  retour:     { label: "Retour Fournisseur", bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-400"     },
  incident:   { label: "Incident",           bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500"     },
};

function StatutBadge({ statut }) {
  const m = STATUT_META[statut] ?? STATUT_META.en_attente;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${m.bg} ${m.text} border-current/20`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/* ─── Constantes Semences ──────────────────────────────── */
const ETAT_CUVE          = ['Bon état', 'Moyen', 'Endommagé'];
const COULEURS_PAILLETTE = ['Rouge', 'Jaune', 'Vert', 'Bleu', 'Rose', 'Orange', 'Blanc', 'Noir'];
const COULEUR_HEX = {
  Rouge: '#EF4444', Jaune: '#EAB308', Vert: '#22C55E', Bleu: '#3B82F6',
  Rose:  '#EC4899', Orange: '#F97316', Blanc: '#F1F5F9', Noir: '#1E293B',
};

/* ─── Checklist dynamique ──────────────────────────────── */
const CHECKLIST_ITEMS = [
  {
    id: 'temperature',
    label: 'Température de transport vérifiée (< −196 °C pour semences)',
    show: (camion) => camion.chargement.some(c => c.type === 'semence'),
  },
  { id: 'scelles',    label: 'Scellés de transport intacts',      show: () => true },
  { id: 'quantites',  label: 'Quantités conformes au BL',          show: () => true },
  {
    id: 'douane',
    label: 'Documents douaniers présents',
    show: (camion) => {
      const flag = camion.pavillon ?? '';
      const pays = (camion.pays ?? '').toLowerCase();
      return flag !== '🇲🇦' && !pays.includes('maroc');
    },
  },
  { id: 'etiquettes', label: 'Étiquettes et codes lots lisibles',  show: () => true },
];

function ModalControle({ camion, onClose, onValider }) {
  const totalQteAttendue = camion.chargement.reduce((s, c) => s + c.qte, 0);
  const unite            = camion.chargement[0]?.unite ?? '';
  const hasSemence       = camion.chargement.some(c => c.type === 'semence');
  const semenceLigne     = camion.chargement.find(c => c.type === 'semence');
  const showPeremption   = camion.chargement.some(c => c.type === 'semence' || c.type === 'consommable');
  const ficheAdmin       = semenceLigne?.ficheTechnique ?? [];
  const hasFicheAdmin    = ficheAdmin.length > 0;

  const visibleItems = CHECKLIST_ITEMS.filter(item => item.show(camion));

  /* ── États communs ── */
  const [phase,    setPhase]    = useState('checklist'); // 'checklist' | 'semences' | 'litige'
  const [checks,   setChecks]   = useState(() => visibleItems.map(() => false));
  const [note,     setNote]     = useState('');

  /* ── État litige ── */
  const [decision,       setDecision]       = useState('partiel');
  const [qteRecue,       setQteRecue]       = useState(String(totalQteAttendue));
  const [datePeremption, setDatePeremption] = useState('');

  /* ── État cuves ── */
  const [cuves, setCuves] = useState([{ ref: '', etat: 'Bon état', capacite: 50, niveauActuel: 50 }]);
  const [cuvesExistantes, setCuvesExistantes] = useState([]);
  const [loadingCuves,    setLoadingCuves]    = useState(false);

  const addCuve    = () => setCuves(p => [...p, { ref: '', etat: 'Bon état', capacite: 50, niveauActuel: 50 }]);
  const removeCuve = (i) => setCuves(p => p.filter((_, idx) => idx !== i));
  const updateCuve = (i, key, val) =>
    setCuves(p => p.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

  /* Chargement des cuves existantes dès l'entrée dans la phase semences */
  useEffect(() => {
    if (phase !== 'semences' || cuvesExistantes.length > 0) return;
    setLoadingCuves(true);
    api.get('/api/conteneurs-semences?actif=true&limit=100')
      .then(res => { const list = Array.isArray(res) ? res : (res.data ?? []); setCuvesExistantes(list); })
      .catch(() => setCuvesExistantes([]))
      .finally(() => setLoadingCuves(false));
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function ajouterCuveExistante(cuveId) {
    if (!cuveId) return;
    const c = cuvesExistantes.find(x => x._id === cuveId);
    if (!c) return;
    if (cuves.find(x => x.ref === (c.reference ?? c.ref ?? c._id))) return; // déjà présente
    setCuves(p => [...p, {
      _id:      c._id,
      ref:      c.reference ?? c.ref ?? c._id,
      etat:     c.etat       ?? 'Bon état',
      capacite:     c.capacite     ?? 50,
      niveauActuel: c.niveauActuel ?? 50,
      existante: true,
    }]);
  }

  /* ── État fiche technique ── */
  const [ficheLines, setFicheLines] = useState(() =>
    hasFicheAdmin
      ? ficheAdmin.map(f => ({ race: f.race ?? '', taureau: f.taureau ?? '', nni: f.nni ?? '', couleur: f.couleur ?? 'Rouge', quantite: String(f.quantite ?? ''), cuveRef: '' }))
      : []
  );
  const addFicheLine    = () => setFicheLines(p => [...p, { race: '', taureau: '', nni: '', couleur: 'Rouge', quantite: '', cuveRef: '' }]);
  const removeFicheLine = (i) => setFicheLines(p => p.filter((_, idx) => idx !== i));
  const updateFicheLine = (i, key, val) =>
    setFicheLines(p => p.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

  /* ── Validations ── */
  const allOk      = checks.every(Boolean);
  const cuvesOk    = cuves.length > 0 && cuves.every(c => c.ref.trim());
  const ficheOk    = ficheLines.length > 0 && ficheLines.every(l => l.cuveRef);
  const semencesOk = !hasSemence || (cuvesOk && ficheOk);
  const qteValide  = Number(qteRecue) > 0 && Number(qteRecue) <= totalQteAttendue;
  const ecart      = totalQteAttendue - Number(qteRecue || 0);

  /* Options de cuves pour le select d'association */
  const cuveOptions = cuves
    .map(c => c.ref.trim() ? { value: c.ref.trim(), label: `🧊 ${c.ref.trim()}` } : null)
    .filter(Boolean);

  /* ── Actions ── */
  function handleChecklistNext() {
    if (hasSemence) { setPhase('semences'); return; }
    onValider(camion.id, { decision: 'conforme', note, ...(datePeremption ? { datePeremption } : {}) });
    onClose();
  }

  function confirmerSemences() {
    if (!semencesOk) return;
    onValider(camion.id, {
      decision: 'conforme',
      note,
      ...(datePeremption ? { datePeremption } : {}),
      cuves: cuves.map(c => ({
        ...(c._id ? { _id: c._id } : {}),
        ref:      c.ref.trim(),
        etat:     c.etat,
        capacite:     Number(c.capacite)     || 50,
        niveauActuel: Number(c.niveauActuel) || 50,
      })),
      ficheTechnique: ficheLines.map(l => ({
        race:     l.race ?? '',
        taureau:  l.taureau,
        nni:      l.nni,
        couleur:  l.couleur,
        quantite: Number(l.quantite) || 0,
        cuveRef:  l.cuveRef,
      })),
    });
    onClose();
  }

  function confirmerLitige() {
    if (!qteValide) return;
    onValider(camion.id, { decision, note, quantiteRecue: Number(qteRecue) });
    onClose();
  }

  const inp   = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 hover:border-slate-300 transition-colors";
  const inpSm = "bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">

        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {phase === 'litige'
                ? <><AlertTriangle size={16} className="text-amber-500 shrink-0" /><p className="text-sm font-bold text-slate-800">Litige / Écart de Réception</p></>
                : phase === 'semences'
                ? <><Snowflake size={16} className="text-cyan-500 shrink-0" /><p className="text-sm font-bold text-slate-800">Conteneurs & Traçabilité Génétique</p></>
                : <><ClipboardCheck size={16} className="text-blue-600 shrink-0" /><p className="text-sm font-bold text-slate-800">Contrôle Réception</p></>}
            </div>
            <p className="text-xs text-slate-500 font-mono truncate">{camion.id} · {camion.origine}</p>
            {/* Indicateur d'étapes (semences seulement) */}
            {hasSemence && phase !== 'litige' && (
              <div className="flex items-center gap-1.5 mt-1.5">
                {[
                  { key: 'checklist', label: '① Contrôle'         },
                  { key: 'semences',  label: '② Conteneurs & Génétique' },
                ].map((step, i) => (
                  <div key={step.key} className="flex items-center gap-1">
                    {i > 0 && <div className={`w-5 h-px ${phase === 'semences' ? 'bg-cyan-300' : 'bg-slate-200'}`} />}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors
                      ${phase === step.key
                        ? 'bg-cyan-100 text-cyan-700'
                        : i < ['checklist', 'semences'].indexOf(phase)
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Récap chargement */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Articles commandés</p>
          <div className="space-y-1">
            {camion.chargement.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                {typeIcon(c.type, 12)}
                <span className="font-medium flex-1">{c.label}</span>
                <span className="font-mono text-slate-500 font-semibold shrink-0">{c.qte.toLocaleString()} {c.unite}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto">

          {/* ══ Phase checklist ══ */}
          {phase === 'checklist' && (
            <>
              <div className="px-6 py-4 space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Checklist terrain</p>
                {visibleItems.map((item, i) => (
                  <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                    <div
                      onClick={() => setChecks(p => { const n = [...p]; n[i] = !n[i]; return n; })}
                      className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer
                        ${checks[i] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-emerald-400'}`}
                    >
                      {checks[i] && <CheckCircle size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-xs leading-relaxed ${checks[i] ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{item.label}</span>
                  </label>
                ))}
              </div>
              <div className="px-6 pb-4 space-y-3">
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Observations (optionnel) — anomalie visuelle, remarque…"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700 placeholder:text-slate-400"
                  rows={2}
                />
                {showPeremption && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Date de péremption <span className="font-normal normal-case text-slate-400">(Optionnel)</span>
                    </label>
                    <input
                      type="date"
                      value={datePeremption}
                      onChange={e => setDatePeremption(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors w-full"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══ Phase semences ══ */}
          {phase === 'semences' && (
            <div className="px-6 py-4 space-y-5">

              {/* ── Module 1 : Cuves ── */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Snowflake size={13} className="text-cyan-500" />
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Contenants — Conteneurs Semences réceptionnés</p>
                  </div>
                  <button type="button" onClick={addCuve}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    <Plus size={12} /> Nouveau conteneur
                  </button>
                </div>

                {/* Sélecteur de cuve existante */}
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                  <div className="relative">
                    <select
                      defaultValue=""
                      onChange={e => { ajouterCuveExistante(e.target.value); e.target.value = ''; }}
                      className={`${inpSm} appearance-none pr-6`}
                      disabled={loadingCuves}
                    >
                      <option value="">
                        {loadingCuves ? 'Chargement du parc…' : cuvesExistantes.length === 0 ? '— Aucun conteneur dans le parc —' : '🧊 Sélectionner un conteneur existant du parc…'}
                      </option>
                      {cuvesExistantes.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.reference ?? c.ref} · {c.niveauActuel ?? '?'} / {c.capacite ?? '?'} L · {c.etat ?? 'Bon état'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {cuves.some(c => !c.ref.trim()) && (
                  <div className="px-4 py-1.5 bg-red-50 border-b border-red-100">
                    <p className="text-[11px] text-red-600 font-medium">La référence de chaque cuve est obligatoire.</p>
                  </div>
                )}

                <div className="divide-y divide-slate-100">
                  {cuves.map((cuve, i) => (
                    <div key={i} className="px-4 py-3 space-y-2">
                      {/* Ligne 1 : réf + état + supprimer */}
                      <div className="flex items-center gap-2">
                        <input
                          value={cuve.ref}
                          onChange={e => updateCuve(i, 'ref', e.target.value)}
                          placeholder="Réf. cuve (ex: VG-12)"
                          readOnly={cuve.existante}
                          className={`${inpSm} flex-1 font-mono
                            ${cuve.existante ? 'opacity-60 cursor-default' : ''}
                            ${!cuve.ref.trim() ? 'border-red-300 focus:ring-red-400' : 'border-emerald-300'}`}
                        />
                        <div className="relative w-28 shrink-0">
                          <select
                            value={cuve.etat}
                            onChange={e => updateCuve(i, 'etat', e.target.value)}
                            className={`${inpSm} appearance-none pr-6`}
                          >
                            {ETAT_CUVE.map(e => <option key={e}>{e}</option>)}
                          </select>
                          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        {cuves.length > 1 && (
                          <button onClick={() => removeCuve(i)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all shrink-0">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      {/* Ligne 2 : capacité + niveau azote */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Capacité (L)
                          </label>
                          <input
                            type="number" min="1"
                            value={cuve.capacite}
                            onChange={e => updateCuve(i, 'capacite', e.target.value)}
                            className={`${inpSm} text-right font-mono ${cuve.existante ? 'opacity-60 cursor-default' : ''}`}
                            readOnly={cuve.existante}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Niveau azote (L)
                          </label>
                          <input
                            type="number" min="0" max={cuve.capacite}
                            value={cuve.niveauActuel}
                            onChange={e => updateCuve(i, 'niveauActuel', e.target.value)}
                            className={`${inpSm} text-right font-mono`}
                          />
                        </div>
                      </div>
                      {/* Jauge de niveau en temps réel */}
                      {Number(cuve.capacite) > 0 && (
                        <div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                (Number(cuve.niveauActuel) / Number(cuve.capacite)) > 0.5 ? 'bg-cyan-500' :
                                (Number(cuve.niveauActuel) / Number(cuve.capacite)) > 0.2 ? 'bg-amber-400' : 'bg-red-500'}`}
                              style={{ width: `${Math.min((Number(cuve.niveauActuel) / Number(cuve.capacite)) * 100, 100)}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5 text-right">
                            {Math.round((Number(cuve.niveauActuel) / Number(cuve.capacite)) * 100)}% · {cuve.niveauActuel} / {cuve.capacite} L
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Module 2 : Fiche Technique ── */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Dna size={13} className="text-blue-500" />
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Fiche Technique — Génétique
                    </p>
                    {hasFicheAdmin && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  {!hasFicheAdmin && (
                    <button type="button" onClick={addFicheLine}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      <Plus size={12} /> Ajouter
                    </button>
                  )}
                </div>

                {ficheLines.length === 0 && (
                  <p className="px-4 py-4 text-xs text-slate-400 text-center italic">
                    {hasFicheAdmin
                      ? 'Aucune ligne dans la fiche Admin.'
                      : 'Cliquez « Ajouter » pour saisir la génétique de la cuve.'}
                  </p>
                )}

                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {ficheLines.map((row, i) => (
                    <div key={i} className="px-4 py-3 space-y-2">
                      {/* Infos taureau — lecture seule si Admin, saisie sinon */}
                      {hasFicheAdmin ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Dna size={10} className="text-blue-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700">{row.taureau || '—'}</span>
                          {row.nni && <span className="text-[11px] text-slate-400">· {row.nni}</span>}
                          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0
                            ${row.couleur === 'Rouge'  ? 'bg-red-50 text-red-700 border-red-200' :
                              row.couleur === 'Bleu'   ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              row.couleur === 'Vert'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              row.couleur === 'Jaune'  ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {row.couleur}
                          </span>
                          <span className="ml-auto font-mono text-xs text-slate-500 shrink-0">{row.quantite} doses</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input value={row.taureau} onChange={e => updateFicheLine(i, 'taureau', e.target.value)}
                              placeholder="Nom du Taureau" className={inpSm} />
                            <input value={row.nni} onChange={e => updateFicheLine(i, 'nni', e.target.value)}
                              placeholder="Code NNI / Race" className={inpSm} />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <span
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-slate-400/30 pointer-events-none z-10 shrink-0"
                                style={{ backgroundColor: COULEUR_HEX[row.couleur] ?? '#94a3b8' }}
                              />
                              <select value={row.couleur} onChange={e => updateFicheLine(i, 'couleur', e.target.value)}
                                className={`${inpSm} appearance-none pr-6 pl-7`}>
                                {COULEURS_PAILLETTE.map(c => (
                                  <option key={c} value={c} style={{ backgroundColor: COULEUR_HEX[c] ?? '#fff', color: c === 'Blanc' ? '#374151' : '#1e293b', fontWeight: 600 }}>{c}</option>
                                ))}
                              </select>
                              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <input type="number" min="1" value={row.quantite}
                              onChange={e => updateFicheLine(i, 'quantite', e.target.value)}
                              placeholder="Qté"
                              className="w-16 shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right font-mono" />
                            <button onClick={() => removeFicheLine(i)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all shrink-0">
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Association cuve — toujours requise */}
                      <div className="relative">
                        <select
                          value={row.cuveRef}
                          onChange={e => updateFicheLine(i, 'cuveRef', e.target.value)}
                          className={`${inpSm} appearance-none pr-6 font-mono
                            ${!row.cuveRef
                              ? 'border-amber-300 bg-amber-50/50 focus:ring-amber-400'
                              : 'border-emerald-300 bg-emerald-50/30'}`}
                        >
                          <option value="">🧊 — Associer à une cuve —</option>
                          {cuveOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  ))}
                </div>

                {ficheLines.length > 0 && !ficheOk && (
                  <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-200">
                    <p className="text-[11px] text-amber-700 font-medium">Chaque ligne de génétique doit être associée à une cuve.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ Phase litige ══ */}
          {phase === 'litige' && (
            <div className="px-6 py-5 space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-0.5">Écart de réception détecté</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Indiquez la quantité réellement reçue et choisissez l'action à appliquer sur le stock.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Quantité réellement reçue
                  <span className="ml-2 font-normal text-slate-400">(commandé : {totalQteAttendue} {unite})</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max={totalQteAttendue}
                    value={qteRecue} onChange={e => setQteRecue(e.target.value)}
                    className={`${inp} text-right font-mono font-semibold ${!qteValide && qteRecue !== '' ? 'border-red-300 focus:ring-red-400' : ''}`}
                  />
                  <span className="text-sm text-slate-500 shrink-0">{unite}</span>
                </div>
                {qteValide && ecart > 0 && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={11} />
                    Écart : <strong>{ecart} {unite} manquant{ecart > 1 ? 's' : ''}</strong> ({Math.round((ecart / totalQteAttendue) * 100)}%)
                  </p>
                )}
                {!qteValide && qteRecue !== '' && (
                  <p className="text-xs text-red-500 mt-1.5">La quantité doit être entre 1 et {totalQteAttendue}.</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Action sur le stock</p>
                <div className="space-y-2">
                  {[
                    { val: 'partiel', label: 'Stocker la quantité reçue — Créer un Litige', sub: "Les articles reçus sont mis en stock. Un litige est ouvert pour l'écart.", color: 'emerald' },
                    { val: 'retour',  label: 'Refuser la livraison — Retour Fournisseur',   sub: "Aucun article n'est stocké. La commande entière est renvoyée.",          color: 'red'     },
                  ].map(opt => (
                    <button key={opt.val} onClick={() => setDecision(opt.val)}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all
                        ${decision === opt.val
                          ? opt.color === 'emerald' ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all
                        ${decision === opt.val
                          ? opt.color === 'emerald' ? 'border-emerald-500 bg-emerald-500' : 'border-red-500 bg-red-500'
                          : 'border-slate-300'}`}>
                        {decision === opt.val && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${decision === opt.val
                          ? opt.color === 'emerald' ? 'text-emerald-800' : 'text-red-800'
                          : 'text-slate-700'}`}>{opt.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Observations / Référence du litige</label>
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Ex: BL indique 500 doses, réception physique 450 · Colis n°3 absent à l'ouverture"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-700 placeholder:text-slate-400"
                  rows={3} />
              </div>
            </div>
          )}
        </div>

        {/* Barre d'actions */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0">

          {phase === 'checklist' && (
            <div className="flex gap-2">
              <button onClick={() => setPhase('litige')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-all">
                <XCircle size={13} /> Non conforme / Écart
              </button>
              <button onClick={handleChecklistNext} disabled={!allOk}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {hasSemence
                  ? <><ChevronRight size={13} /> Suivant — Conteneurs & Génétique</>
                  : <><CheckCircle size={13} /> Conforme — Valider</>}
              </button>
            </div>
          )}

          {phase === 'semences' && (
            <div className="flex gap-2">
              <button onClick={() => setPhase('checklist')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all shrink-0">
                <ChevronLeft size={13} /> Retour
              </button>
              <button onClick={confirmerSemences} disabled={!semencesOk}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <CheckCircle size={13} /> Valider la Réception Complète
              </button>
            </div>
          )}

          {phase === 'litige' && (
            <div className="flex gap-2">
              <button onClick={() => setPhase('checklist')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all shrink-0">
                <ChevronLeft size={13} /> Retour
              </button>
              <button onClick={confirmerLitige} disabled={decision === 'partiel' && !qteValide}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed
                  ${decision === 'retour' ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'}`}>
                {decision === 'retour'
                  ? <><XCircle size={13} /> Confirmer le Retour Fournisseur</>
                  : <><PackageCheck size={13} /> Stocker {qteValide ? Number(qteRecue).toLocaleString() : '…'} {unite} & Créer le Litige</>}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ─── Composant principal ──────────────────────────────── */
export default function ReceptionsImportations() {
  const [camions,         setCamions]         = useState([]);
  const [historique,      setHistorique]      = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [loadingHist,     setLoadingHist]     = useState(true);
  const [showHistorique,  setShowHistorique]  = useState(false);
  const [apiError,        setApiError]        = useState(null);
  const [modal,           setModal]           = useState(null);

  useEffect(() => {
    api.get("/api/approvisionnements?statut=prevu,en_transit,a_quai&limit=100")
      .then(res => {
        const list = Array.isArray(res) ? res : [];
        setCamions(list.map(fromApiApproToCamion));
      })
      .catch(err => { setApiError(err.message); setCamions([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get("/api/approvisionnements?statut=conforme,partiel,retour_fournisseur,non_conforme&limit=50")
      .then(res => {
        const list = Array.isArray(res) ? res : [];
        setHistorique(list.map(fromApiApproToCamion));
      })
      .catch(() => setHistorique([]))
      .finally(() => setLoadingHist(false));
  }, []);

  const counts = {
    enAttente:  camions.filter(c => c.statut === "en_attente").length,
    enCours:    camions.filter(c => c.statut === "en_cours").length,
    enStock:    camions.filter(c => c.statut === "en_stock").length,
    incidents:  camions.filter(c => c.statut === "incident").length,
  };

  /* ─ Validation après contrôle (checklist ou litige) ─── */
  async function handleValider(id, { decision, note = '', quantiteRecue, cuves, ficheTechnique, datePeremption } = {}) {
    const target = camions.find(c => c.id === id);
    if (!target?._id) return;
    setApiError(null);
    try {
      const payload = {
        decision,
        note,
        ...(quantiteRecue != null  ? { quantiteRecue }  : {}),
        ...(cuves?.length          ? { conteneurs: cuves }           : {}),
        ...(ficheTechnique?.length ? { ficheTechnique }  : {}),
        ...(datePeremption         ? { datePeremption }  : {}),
      };
      console.log('PAYLOAD ENVOYÉ AU BACKEND:', payload);
      await api.put(`/api/approvisionnements/${target._id}/reception`, payload);
      // Statut UI selon la décision
      const statutUi = { conforme: 'en_stock', partiel: 'litige', retour: 'retour' }[decision] ?? 'incident';
      setCamions(prev => prev.map(c =>
        c.id !== id ? c : { ...c, controle: { resultat: decision, note }, statut: statutUi }
      ));
    } catch (err) {
      setApiError(err.message);
    }
  }

  /* ─ Mise en stock directe (sans checklist) ──────────── */
  async function mettreEnStock(id) {
    const target = camions.find(c => c.id === id);
    if (!target?._id) return;
    setApiError(null);
    try {
      await api.put(`/api/approvisionnements/${target._id}/reception`, {
        note: 'Mise en stock directe.',
      });
      // Mise à jour UI après succès API
      setCamions(prev => prev.map(c =>
        c.id === id
          ? { ...c, statut: 'en_stock', controle: { resultat: 'conforme', note: 'Mise en stock directe.' } }
          : c
      ));
    } catch (err) {
      setApiError(err.message);
    }
  }

  const [filtreReceptionnaire, setFiltreReceptionnaire] = useState('');
  const [filtreFournisseurH,   setFiltreFournisseurH]   = useState('');
  const [filtreDateH,          setFiltreDateH]          = useState('');

  const historiqueFiltres = useMemo(() => historique.filter(h => {
    if (filtreReceptionnaire && h.receptionnaire !== filtreReceptionnaire) return false;
    if (filtreFournisseurH   && h.origine         !== filtreFournisseurH)  return false;
    if (filtreDateH          && h.dateReception   && h.dateReception.slice(0,10) < filtreDateH) return false;
    return true;
  }), [historique, filtreReceptionnaire, filtreFournisseurH, filtreDateH]);

  const SEL_R = "text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400";

  const colonnesHistorique = [
    {
      key: 'id', label: 'N° BC', sortable: true,
      render: v => <p className="text-xs font-bold font-mono text-slate-700">{v}</p>,
    },
    {
      key: 'origine', label: 'Fournisseur', sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-sm shrink-0">{row.pavillon}</span>
          <p className="text-xs text-slate-700 truncate">{v}</p>
        </div>
      ),
    },
    {
      key: 'chargement', label: 'Articles',
      render: v => (
        <div className="space-y-0.5">
          {(v ?? []).map((c, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {typeIcon(c.type, 10)}
              <span className="text-[11px] text-slate-500 truncate">{c.label}</span>
              <span className="text-[11px] font-mono text-slate-400 ml-auto shrink-0">{c.qte?.toLocaleString()} {c.unite}</span>
            </div>
          ))}
        </div>
      ),
      exportValue: row => (row.chargement ?? []).map(c => `${c.label} x${c.qte}`).join(', '),
    },
    {
      key: 'receptionnaire', label: 'Réceptionnaire', sortable: true,
      render: v => <span className="text-xs text-slate-600">{v}</span>,
    },
    {
      key: 'refBcFournisseur', label: 'N° BC Fournisseur',
      render: v => <span className="text-xs font-mono text-slate-500">{v ?? '—'}</span>,
    },
    {
      key: 'statut', label: 'Statut final', sortable: true,
      render: v => <StatutBadge statut={v} />,
      exportValue: row => row.statut,
    },
    {
      key: 'dateReception', label: 'Date réelle réception', sortable: true,
      render: v => (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <PackageCheck size={11} className="text-emerald-500 shrink-0" />
          {v ? new Date(v).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
        </div>
      ),
      exportValue: row => row.dateReception ? new Date(row.dateReception).toLocaleDateString('fr-FR') : '—',
    },
  ];

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-5 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Archive size={16} className="text-white" />
              </div>
              <p className="text-base font-bold leading-none">Hub Logistique Central</p>
            </div>
            <p className="text-xs text-slate-400 ml-10">Maroc Lait · Magasin National · Agadir</p>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Quai actif
          </span>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[
            { label: "En attente",   val: counts.enAttente,  col: "text-slate-300" },
            { label: "Déchargement", val: counts.enCours,    col: "text-blue-300"  },
            { label: "Mis en stock", val: counts.enStock,    col: "text-emerald-300" },
            { label: "Incidents",    val: counts.incidents,  col: "text-red-300"   },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl px-3 py-2 text-center">
              <p className={`text-xl font-bold tabular-nums ${s.col}`}>{s.val}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bandeau erreur API */}
      {apiError && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={14} className="text-red-500 shrink-0" />
            <p className="text-xs font-semibold text-red-700">{apiError}</p>
          </div>
          <button onClick={() => setApiError(null)} className="text-red-400 hover:text-red-600 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Liste des camions */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-10 bg-white rounded-2xl border border-slate-100">
            <span className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Chargement des réceptions…</span>
          </div>
        ) : camions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center bg-white rounded-2xl border border-slate-100">
            <Archive size={32} className="text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Aucune commande en attente de réception</p>
            <p className="text-xs text-slate-400 mt-1">Les commandes fournisseurs au statut "Prévu" ou "En transit" apparaîtront ici.</p>
            {apiError && <p className="text-xs text-red-400 mt-2">{apiError}</p>}
          </div>
        ) : camions.map(camion => {
          const isTermine = camion.statut === "en_stock" || camion.statut === "incident";
          return (
            <div
              key={camion.id}
              className={`rounded-2xl border bg-white shadow-sm transition-all
                ${camion.statut === "incident" ? "border-red-200" :
                  camion.statut === "en_cours"  ? "border-blue-200" : "border-slate-100"}`}
            >
              <div className="p-5">
                {/* Ligne principale */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0
                      ${camion.statut === "incident" ? "bg-red-50" :
                        camion.statut === "en_cours"  ? "bg-blue-50" : "bg-slate-50"}`}>
                      <Truck size={18} className={
                        camion.statut === "incident" ? "text-red-500" :
                        camion.statut === "en_cours"  ? "text-blue-600" : "text-slate-400"
                      } />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-slate-800 font-mono">{camion.matricule}</p>
                        <StatutBadge statut={camion.statut} />
                      </div>
                      <p className="text-xs text-slate-500">{camion.transporteur}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-slate-400">{camion.id}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5 text-slate-400">
                      <Clock size={10} />
                      <span className="text-[11px]">Arrivée {camion.heureArrivee}</span>
                    </div>
                  </div>
                </div>

                {/* Origine + Quai */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin size={11} className="text-slate-400 shrink-0" />
                    <span>{camion.origine}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                    {camion.quai}
                  </span>
                </div>

                {/* Chargement */}
                <div className="bg-slate-50 rounded-xl px-4 py-3 mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Chargement · Réf. {camion.ref_bc}</p>
                  <div className="space-y-1.5">
                    {camion.chargement.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {typeIcon(c.type, 12)}
                        <span className="text-xs text-slate-700 flex-1">{c.label}</span>
                        <span className="text-xs font-mono font-semibold text-slate-600">{c.qte.toLocaleString()} {c.unite}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Note de contrôle (si disponible) */}
                {camion.controle && (
                  <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4 text-xs
                    ${camion.controle.resultat === "conforme"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-red-50 border border-red-200 text-red-700"}`}>
                    {camion.controle.resultat === "conforme"
                      ? <CheckCircle size={13} className="shrink-0 mt-0.5" />
                      : <AlertTriangle size={13} className="shrink-0 mt-0.5" />}
                    <span>{camion.controle.note || "Contrôle enregistré."}</span>
                  </div>
                )}

                {/* Actions */}
                {!isTermine && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModal(camion)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-all"
                    >
                      <ClipboardCheck size={13} /> Contrôler
                    </button>
                    <button
                      onClick={() => mettreEnStock(camion.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all"
                    >
                      <PackageCheck size={13} /> Mettre en stock
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Historique des Réceptions ═══ */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setShowHistorique(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Archive size={14} className="text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800">Historique des Réceptions</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Commandes clôturées · {loadingHist ? '…' : historique.length} entrée{historique.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${showHistorique ? 'rotate-180' : ''}`} />
        </button>

        {showHistorique && (
          <div className="border-t border-slate-100">
            <DataGridV2
              columns={colonnesHistorique}
              data={historiqueFiltres}
              rowKey="id"
              title="Historique Réceptions"
              exportFilename="historique-receptions"
              loading={loadingHist}
              emptyMessage="Aucune réception clôturée pour le moment."
              actions={
                <div className="flex flex-wrap items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <select value={filtreReceptionnaire} onChange={e => setFiltreReceptionnaire(e.target.value)} className={SEL_R}>
                    <option value="">Tout réceptionnaire</option>
                    {[...new Set(historique.map(h => h.receptionnaire).filter(v => v && v !== '—'))].sort().map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <select value={filtreFournisseurH} onChange={e => setFiltreFournisseurH(e.target.value)} className={SEL_R}>
                    <option value="">Tout fournisseur</option>
                    {[...new Set(historique.map(h => h.origine).filter(Boolean))].sort().map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <input type="date" value={filtreDateH} onChange={e => setFiltreDateH(e.target.value)} className={SEL_R} />
                </div>
              }
            />
          </div>
        )}
      </div>

      {/* Modal contrôle */}
      {modal && (
        <ModalControle
          camion={modal}
          onClose={() => setModal(null)}
          onValider={handleValider}
        />
      )}
    </div>
  );
}
