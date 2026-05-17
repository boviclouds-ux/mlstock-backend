// ReceptionsImportations.jsx — Hub Logistique Central · Déchargements en cours
import { useState, useEffect } from "react";
import { api } from "./lib/api";
import {
  Truck, Snowflake, FlaskConical, Wrench, Dna,
  PackageCheck, ClipboardCheck, AlertTriangle, CheckCircle,
  XCircle, X, Clock, MapPin, ChevronRight, Archive,
  ScanLine, ShieldCheck, ChevronLeft, TriangleAlert,
} from "lucide-react";

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
    quai:         a.lieuStockage ?? 'Magasin Central',
    heureArrivee: a.dateArriveePrevu
      ? new Date(a.dateArriveePrevu).toLocaleDateString('fr-FR')
      : '—',
    ref_bc:   a.numeroCommande,
    chargement: (a.lignes ?? []).map(l => ({
      label:     l.label,
      qte:       l.qte,
      unite:     l.unite,
      type:      l.type,
      articleId: l.articleId,
    })),
    statut:   STATUT_APPRO_MAP[a.statut] ?? 'en_attente',
    controle: a.conformite?.resultat ? a.conformite : null,
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

/* ─── Modal Contrôle ───────────────────────────────────── */
const CHECKLIST = [
  "Température de transport vérifiée (< −196 °C pour semences)",
  "Scellés de transport intacts",
  "Quantités conformes au BL",
  "Documents douaniers présents",
  "Étiquettes et codes lots lisibles",
];

function ModalControle({ camion, onClose, onValider }) {
  const totalQteAttendue = camion.chargement.reduce((s, c) => s + c.qte, 0);
  const unite            = camion.chargement[0]?.unite ?? '';

  /* ── États ── */
  const [phase,    setPhase]    = useState('checklist'); // 'checklist' | 'litige'
  const [checks,   setChecks]   = useState(Array(CHECKLIST.length).fill(false));
  const [note,     setNote]     = useState('');
  const [decision, setDecision] = useState('partiel');   // 'partiel' | 'retour'
  const [qteRecue, setQteRecue] = useState(String(totalQteAttendue));

  const allOk      = checks.every(Boolean);
  const qteValide  = Number(qteRecue) > 0 && Number(qteRecue) <= totalQteAttendue;
  const ecart      = totalQteAttendue - Number(qteRecue || 0);

  function confirmerConforme() {
    onValider(camion.id, { decision: 'conforme', note });
    onClose();
  }

  function confirmerLitige() {
    if (!qteValide) return;
    onValider(camion.id, { decision, note, quantiteRecue: Number(qteRecue) });
    onClose();
  }

  const inp = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 hover:border-slate-300 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">

        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {phase === 'litige'
                ? <><AlertTriangle size={16} className="text-amber-500" /><p className="text-sm font-bold text-slate-800">Litige / Écart de Réception</p></>
                : <><ClipboardCheck size={16} className="text-blue-600" /><p className="text-sm font-bold text-slate-800">Contrôle Réception</p></>}
            </div>
            <p className="text-xs text-slate-500 font-mono">{camion.id} · {camion.origine}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Chargement (toujours visible) */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Articles commandés</p>
          <div className="space-y-1">
            {camion.chargement.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                {typeIcon(c.type, 12)}
                <span className="font-medium">{c.label}</span>
                <span className="ml-auto font-mono text-slate-500 font-semibold">{c.qte.toLocaleString()} {c.unite}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Phase checklist ── */}
          {phase === 'checklist' && (
            <>
              <div className="px-6 py-4 space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Checklist terrain</p>
                {CHECKLIST.map((item, i) => (
                  <label key={i} className="flex items-start gap-3 cursor-pointer group">
                    <div
                      onClick={() => setChecks(p => { const n = [...p]; n[i] = !n[i]; return n; })}
                      className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer
                        ${checks[i] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-emerald-400'}`}
                    >
                      {checks[i] && <CheckCircle size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-xs leading-relaxed ${checks[i] ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{item}</span>
                  </label>
                ))}
              </div>
              <div className="px-6 pb-4">
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Observations (optionnel) — anomalie visuelle, remarque…"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700 placeholder:text-slate-400"
                  rows={2}
                />
              </div>
            </>
          )}

          {/* ── Phase litige ── */}
          {phase === 'litige' && (
            <div className="px-6 py-5 space-y-5">

              {/* Bandeau contexte */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-0.5">Écart de réception détecté</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Indiquez la quantité réellement reçue et choisissez l'action à appliquer sur le stock.
                  </p>
                </div>
              </div>

              {/* Quantité reçue */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Quantité réellement reçue
                  <span className="ml-2 font-normal text-slate-400">(commandé : {totalQteAttendue} {unite})</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max={totalQteAttendue}
                    value={qteRecue}
                    onChange={e => setQteRecue(e.target.value)}
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

              {/* Choix d'action */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Action sur le stock</p>
                <div className="space-y-2">
                  {[
                    {
                      val: 'partiel',
                      label: 'Stocker la quantité reçue — Créer un Litige',
                      sub: 'Les articles reçus sont mis en stock. Un litige est ouvert pour l\'écart.',
                      color: 'emerald',
                    },
                    {
                      val: 'retour',
                      label: 'Refuser la livraison — Retour Fournisseur',
                      sub: 'Aucun article n\'est stocké. La commande entière est renvoyée.',
                      color: 'red',
                    },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setDecision(opt.val)}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all
                        ${decision === opt.val
                          ? opt.color === 'emerald' ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
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

              {/* Observations */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Observations / Référence du litige</label>
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Ex: BL indique 500 doses, réception physique 450 · Colis n°3 absent à l'ouverture"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-700 placeholder:text-slate-400"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0">
          {phase === 'checklist' ? (
            <div className="flex gap-2">
              <button
                onClick={() => { setPhase('litige'); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-all"
              >
                <XCircle size={13} /> Non conforme / Écart
              </button>
              <button
                onClick={confirmerConforme}
                disabled={!allOk}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <CheckCircle size={13} /> Conforme — Valider
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setPhase('checklist')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all shrink-0"
              >
                <ChevronLeft size={13} /> Retour
              </button>
              <button
                onClick={confirmerLitige}
                disabled={decision === 'partiel' && !qteValide}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed
                  ${decision === 'retour' ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'}`}
              >
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
  const [camions,  setCamions]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [apiError, setApiError] = useState(null);
  const [modal,    setModal]    = useState(null);

  useEffect(() => {
    api.get("/api/approvisionnements?statut=prevu,en_transit,a_quai&limit=100")
      .then(res => {
        const list = Array.isArray(res) ? res : [];
        setCamions(list.map(fromApiApproToCamion));
      })
      .catch(err => { setApiError(err.message); setCamions([]); })
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    enAttente:  camions.filter(c => c.statut === "en_attente").length,
    enCours:    camions.filter(c => c.statut === "en_cours").length,
    enStock:    camions.filter(c => c.statut === "en_stock").length,
    incidents:  camions.filter(c => c.statut === "incident").length,
  };

  /* ─ Validation après contrôle (checklist ou litige) ─── */
  async function handleValider(id, { decision, note = '', quantiteRecue } = {}) {
    const target = camions.find(c => c.id === id);
    if (!target?._id) return;
    setApiError(null);
    try {
      await api.put(`/api/approvisionnements/${target._id}/reception`, {
        decision,
        note,
        ...(quantiteRecue != null ? { quantiteRecue } : {}),
      });
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
