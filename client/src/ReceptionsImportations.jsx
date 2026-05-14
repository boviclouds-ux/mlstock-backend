// ReceptionsImportations.jsx — Hub Logistique Central · Déchargements en cours
import { useState, useEffect } from "react";
import { api } from "./lib/api";
import {
  Truck, Snowflake, FlaskConical, Wrench, Dna,
  PackageCheck, ClipboardCheck, AlertTriangle, CheckCircle,
  XCircle, X, Clock, MapPin, ChevronRight, Archive,
  ScanLine, ShieldCheck,
} from "lucide-react";

/* ─── Adaptateur Transaction API → Camion Réception ───── */
const STATUT_CAMION_MAP = {
  'Brouillon':   'en_attente',
  'En attente':  'en_cours',
  'Validé':      'controle',
  'Expédié':     'en_stock',
  'Réceptionné': 'en_stock',
  'Rejeté':      'incident',
};

function fromApiToCamion(t) {
  const catToType = { Semences:'semence', Azote:'azote' };
  return {
    _id:          t._id,
    id:           t.reference,
    matricule:    '—',
    transporteur: '—',
    origine:      t.fournisseurCible?.nom ? `Transit ${t.fournisseurCible.nom}` : '—',
    quai:         'Quai A',
    heureArrivee: new Date(t.createdAt).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }),
    ref_bc:       t.reference,
    chargement:   (t.lignes ?? []).map(l => ({
      label: l.article?.designation ?? '—',
      qte:   l.quantite,
      unite: l.article?.uniteMesure  ?? '—',
      type:  catToType[l.article?.categorie] ?? 'materiel',
    })),
    statut:   STATUT_CAMION_MAP[t.statut] ?? 'en_attente',
    controle: null,
  };
}

/* ─── Helpers ──────────────────────────────────────────── */
function typeIcon(type, sz = 11) {
  if (type === "semence")  return <Dna size={sz} className="text-blue-400 shrink-0" />;
  if (type === "azote")    return <FlaskConical size={sz} className="text-cyan-500 shrink-0" />;
  return <Wrench size={sz} className="text-slate-400 shrink-0" />;
}

const STATUT_META = {
  en_attente: { label: "En attente",        bg: "bg-slate-100",    text: "text-slate-600",   dot: "bg-slate-400"   },
  en_cours:   { label: "Déchargement",      bg: "bg-blue-50",      text: "text-blue-700",    dot: "bg-blue-500"    },
  controle:   { label: "À contrôler",       bg: "bg-amber-50",     text: "text-amber-700",   dot: "bg-amber-500"   },
  en_stock:   { label: "Mis en stock",      bg: "bg-emerald-50",   text: "text-emerald-700", dot: "bg-emerald-500" },
  incident:   { label: "Incident",          bg: "bg-red-50",       text: "text-red-700",     dot: "bg-red-500"     },
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
  const [checks, setChecks] = useState(Array(CHECKLIST.length).fill(false));
  const [note,   setNote]   = useState("");
  const [result, setResult] = useState(null);

  const allOk = checks.every(Boolean);

  function valider(res) {
    setResult(res);
    onValider(camion.id, res, note);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* En-tête modal */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ClipboardCheck size={16} className="text-blue-600" />
              <p className="text-sm font-bold text-slate-800">Contrôle Réception</p>
            </div>
            <p className="text-xs text-slate-500 font-mono">{camion.id} · {camion.matricule}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Chargement */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Articles à contrôler</p>
          <div className="space-y-1">
            {camion.chargement.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                {typeIcon(c.type, 12)}
                <span className="font-medium">{c.label}</span>
                <span className="ml-auto font-mono text-slate-500">{c.qte.toLocaleString()} {c.unite}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div className="px-6 py-4 space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Checklist terrain</p>
          {CHECKLIST.map((item, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer group">
              <div
                onClick={() => setChecks(p => { const n=[...p]; n[i]=!n[i]; return n; })}
                className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer
                  ${checks[i] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-emerald-400'}`}
              >
                {checks[i] && <CheckCircle size={10} className="text-white" strokeWidth={3} />}
              </div>
              <span className={`text-xs leading-relaxed ${checks[i] ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{item}</span>
            </label>
          ))}
        </div>

        {/* Note */}
        <div className="px-6 pb-4">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Observations (optionnel) — écart de quantité, anomalie visuelle…"
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700 placeholder:text-slate-400"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-2">
          <button
            onClick={() => valider("non_conforme")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-all"
          >
            <XCircle size={13} /> Non conforme
          </button>
          <button
            onClick={() => valider("conforme")}
            disabled={!allOk}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <CheckCircle size={13} /> Conforme — Valider
          </button>
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
    api.get("/api/transactions?type=RECEPTION&limit=100")
      .then(res => {
        const list = Array.isArray(res) ? res : (res.data ?? []);
        setCamions(list.map(fromApiToCamion));
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

  function handleValider(id, resultat, note) {
    setCamions(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        controle: { resultat, note },
        statut: resultat === "conforme" ? "en_stock" : "incident",
      };
    }));
  }

  function mettreEnStock(id) {
    setCamions(prev => prev.map(c =>
      c.id === id ? { ...c, statut: "en_stock", controle: { resultat: "conforme", note: "Mise en stock directe." } } : c
    ));
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
            <p className="text-sm font-semibold text-slate-600">Aucune réception en cours</p>
            <p className="text-xs text-slate-400 mt-1">Les arrivages du jour apparaîtront ici dès leur enregistrement.</p>
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
