// ApprovisionnementsFournisseurs.jsx — Suivi des commandes Direction → Fournisseurs
// Règle métier : le Magasinier consulte uniquement. Seul l'Admin Fédéral crée des commandes.
import { useState, useEffect } from "react";
import { api } from "./lib/api";
import {
  Truck, Dna, FlaskConical, Wrench, X,
  CheckCircle, XCircle, Clock, FileText,
  ShieldCheck, PlusCircle, Building2, Calendar,
  ChevronDown,
} from "lucide-react";

/* ─── Référentiels ─────────────────────────────────────── */
const FOURNISSEURS = [
  { nom: "Alta Genetics France", pays: "France",     pavillon: "🇫🇷" },
  { nom: "Sunnylodge B.V.",      pays: "Pays-Bas",   pavillon: "🇳🇱" },
  { nom: "Nedap Livestock Mgmt.",pays: "Pays-Bas",   pavillon: "🇳🇱" },
  { nom: "CryoBio France",       pays: "France",     pavillon: "🇫🇷" },
  { nom: "Semex Alliance",       pays: "Canada",     pavillon: "🇨🇦" },
  { nom: "Al Amine Logistique",  pays: "Maroc",      pavillon: "🇲🇦" },
];

const CATALOGUE = [
  { label: "Holstein – BENNER JESUALDO",   unite: "doses",  type: "semence"  },
  { label: "Montbéliarde – ALPAGA RF",     unite: "doses",  type: "semence"  },
  { label: "Normande – OLIVIER ET",        unite: "doses",  type: "semence"  },
  { label: "Prim'Holstein – JACKPOT",      unite: "doses",  type: "semence"  },
  { label: "Holstein – DESTINED P",        unite: "doses",  type: "semence"  },
  { label: "Azote liquide industriel",     unite: "litres", type: "azote"    },
  { label: "Cathéters d'insémination",     unite: "unités", type: "materiel" },
  { label: "Gants insémination",           unite: "unités", type: "materiel" },
  { label: "Paillettes de congélation",    unite: "boîtes", type: "materiel" },
];

const LIEU_STOCKAGE_DEFAUT = "Magasin Central National · Agadir";

/* ─── Adaptateur Transaction API → Bon de Commande ─────── */
const STATUT_BC_MAP = {
  'Brouillon':   'prevu',
  'En attente':  'en_transit',
  'Validé':      'a_quai',
  'Expédié':     'conforme',
  'Réceptionné': 'conforme',
  'Rejeté':      'non_conforme',
};

function fromApiToBC(t) {
  const catToType = { Semences:'semence', Azote:'azote' };
  return {
    _id:         t._id,
    id:          t.reference,
    fournisseur: t.fournisseurCible?.nom  ?? '—',
    pays:        t.fournisseurCible?.pays ?? '—',
    pavillon:    '🌍',
    articles: (t.lignes ?? []).map(l => ({
      label: l.article?.designation ?? '—',
      qte:   l.quantite,
      unite: l.article?.uniteMesure  ?? '—',
      type:  catToType[l.article?.categorie] ?? 'materiel',
    })),
    dateCommande: (t.createdAt ?? '').slice(0, 10),
    dateArrivee:  null,
    statut:       STATUT_BC_MAP[t.statut] ?? 'prevu',
    transporteur: '—',
    ref_bl:       null,
    conformite:   null,
    lieuStockage: LIEU_STOCKAGE_DEFAUT,
  };
}

/* ─── Helpers ──────────────────────────────────────────── */
function typeIcon(type, sz = 11) {
  if (type === "semence")  return <Dna size={sz} className="text-blue-400 shrink-0" />;
  if (type === "azote")    return <FlaskConical size={sz} className="text-cyan-500 shrink-0" />;
  return <Wrench size={sz} className="text-slate-400 shrink-0" />;
}

const STATUT_META = {
  prevu:        { label: "Prévu",         bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400"   },
  en_transit:   { label: "En transit",    bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500"    },
  a_quai:       { label: "À quai",        bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500"   },
  conforme:     { label: "Conforme",      bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  non_conforme: { label: "Non conforme",  bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500"     },
};

function StatutBadge({ statut }) {
  const m = STATUT_META[statut] ?? STATUT_META.prevu;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function dateRelative(ds) {
  if (!ds) return { label: "—", urgent: false, past: false };
  const diff = Math.round((new Date(ds) - new Date()) / 86400000);
  if (diff < 0)   return { label: `Il y a ${Math.abs(diff)}j`, urgent: false, past: true  };
  if (diff === 0) return { label: "Aujourd'hui",                urgent: true,  past: false };
  if (diff <= 3)  return { label: `Dans ${diff}j`,             urgent: true,  past: false };
  return { label: new Date(ds).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), urgent: false, past: false };
}

function nextBcId(bons) {
  const nums = bons.map(b => parseInt(b.id.split("-")[2], 10)).filter(n => !isNaN(n));
  const max  = nums.length ? Math.max(...nums) : 0;
  return `BC-${new Date().getFullYear()}-${String(max + 1).padStart(4, "0")}`;
}

/* ─── Champ de formulaire stylisé (dark) ────────────────── */
const labelCls  = "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";
const inputCls  = "w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none";

/* ─── Modal Nouvelle Commande (Admin Fédéral) ───────────── */
function ModalNouvelleCommande({ onClose, onAjouter, nextId }) {
  const [fournisseurNom, setFournisseurNom] = useState("");
  const [articleLabel,   setArticleLabel]   = useState("");
  const [qte,            setQte]            = useState("");
  const [dateArrivee,    setDateArrivee]     = useState("");

  const fournisseurObj = FOURNISSEURS.find(f => f.nom === fournisseurNom);
  const articleObj     = CATALOGUE.find(a => a.label === articleLabel);
  const valid          = fournisseurNom && articleLabel && qte > 0 && dateArrivee;

  function handleSubmit() {
    if (!valid) return;
    onAjouter({
      id:            nextId,
      fournisseur:   fournisseurObj.nom,
      pays:          fournisseurObj.pays,
      pavillon:      fournisseurObj.pavillon,
      articles:      [{ label: articleObj.label, qte: Number(qte), unite: articleObj.unite, type: articleObj.type }],
      dateCommande:  new Date().toISOString().slice(0, 10),
      dateArrivee,
      statut:        "prevu",
      transporteur:  "À confirmer",
      ref_bl:        null,
      conformite:    null,
      lieuStockage:  LIEU_STOCKAGE_DEFAUT,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg">

        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <PlusCircle size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Nouvelle Commande Fournisseur</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Réf. <span className="font-mono text-slate-400">{nextId}</span> · Direction Générale</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Formulaire */}
        <div className="px-6 py-5 space-y-5">

          {/* Fournisseur */}
          <div>
            <label className={labelCls}>Fournisseur</label>
            <div className="relative">
              <select value={fournisseurNom} onChange={e => setFournisseurNom(e.target.value)} className={inputCls}>
                <option value="" className="bg-slate-800">— Sélectionner un fournisseur —</option>
                {FOURNISSEURS.map(f => (
                  <option key={f.nom} value={f.nom} className="bg-slate-800">{f.pavillon} {f.nom} · {f.pays}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Article */}
          <div>
            <label className={labelCls}>Article / Équipement</label>
            <div className="relative">
              <select value={articleLabel} onChange={e => setArticleLabel(e.target.value)} className={inputCls}>
                <option value="" className="bg-slate-800">— Sélectionner dans le catalogue —</option>
                {["semence", "azote", "materiel"].map(cat => {
                  const items = CATALOGUE.filter(a => a.type === cat);
                  const titre = cat === "semence" ? "Semences bovines" : cat === "azote" ? "Azote" : "Matériel";
                  return (
                    <optgroup key={cat} label={titre} className="bg-slate-800 text-slate-400">
                      {items.map(a => (
                        <option key={a.label} value={a.label} className="bg-slate-800 text-white">{a.label}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
            {articleObj && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                {typeIcon(articleObj.type, 10)}
                <span>Unité : <span className="text-slate-400 font-medium">{articleObj.unite}</span></span>
              </div>
            )}
          </div>

          {/* Quantité + Date côte à côte */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Quantité</label>
              <input
                type="number" min="1" value={qte} onChange={e => setQte(e.target.value)}
                placeholder={`ex: 500 ${articleObj?.unite ?? "unités"}`}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Date d'arrivée prévue</label>
              <input
                type="date" value={dateArrivee} onChange={e => setDateArrivee(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Lieu de stockage — lecture seule */}
          <div>
            <label className={labelCls}>Lieu de stockage</label>
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2.5">
              <Building2 size={13} className="text-slate-500 shrink-0" />
              <span className="text-sm text-slate-400">{LIEU_STOCKAGE_DEFAUT}</span>
              <span className="ml-auto text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                Par défaut
              </span>
            </div>
          </div>
        </div>

        {/* Récapitulatif si formulaire valide */}
        {valid && (
          <div className="mx-6 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">Récapitulatif commande</p>
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              {typeIcon(articleObj?.type, 11)}
              <span className="flex-1">{articleLabel}</span>
              <span className="font-mono font-bold">{Number(qte).toLocaleString()} {articleObj?.unite}</span>
            </div>
            <p className="text-[11px] text-emerald-400/70 mt-1">
              {fournisseurObj?.pavillon} {fournisseurNom} · Arrivée le {new Date(dateArrivee).toLocaleDateString("fr-FR")}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-800 transition-all">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!valid}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <PlusCircle size={13} /> Créer la commande
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal Conformité ─────────────────────────────────── */
function ModalConformite({ bc, onClose, onSave }) {
  const [resultat, setResultat] = useState(bc.conformite?.resultat ?? "conforme");
  const [note,     setNote]     = useState(bc.conformite?.note     ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ShieldCheck size={15} className="text-blue-600" />
              <p className="text-sm font-bold text-slate-800">Notation de Conformité</p>
            </div>
            <p className="text-xs text-slate-500 font-mono">{bc.id} · {bc.fournisseur}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Contenu du bon · BL {bc.ref_bl}</p>
          <div className="space-y-1">
            {bc.articles.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                {typeIcon(a.type, 12)}
                <span className="flex-1">{a.label}</span>
                <span className="font-mono text-slate-500">{a.qte.toLocaleString()} {a.unite}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Résultat du contrôle</p>
            <div className="flex gap-2">
              <button onClick={() => setResultat("conforme")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all
                  ${resultat === "conforme" ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                <CheckCircle size={13} /> Conforme
              </button>
              <button onClick={() => setResultat("non_conforme")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all
                  ${resultat === "non_conforme" ? "bg-red-600 border-red-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                <XCircle size={13} /> Non conforme
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Observations</p>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Écart de quantité, anomalie, référence du litige…"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700 placeholder:text-slate-400"
              rows={3} />
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all">
            Annuler
          </button>
          <button onClick={() => { onSave(bc.id, resultat, note); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Composant principal ──────────────────────────────── */
export default function ApprovisionnementsFournisseurs({ userRole }) {
  const [bons,        setBons]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [apiError,    setApiError]    = useState(null);
  const [modal,       setModal]       = useState(null);
  const [showNouveau, setShowNouveau] = useState(false);

  useEffect(() => {
    api.get("/api/transactions?type=RECEPTION&limit=100")
      .then(res => {
        const list = Array.isArray(res) ? res : (res.data ?? []);
        setBons(list.map(fromApiToBC));
      })
      .catch(err => { setApiError(err.message); setBons([]); })
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = userRole === "ADMIN_FEDERAL";

  function handleSave(id, resultat, note) {
    setBons(prev => prev.map(bc =>
      bc.id !== id ? bc : { ...bc, statut: resultat, conformite: { resultat, note } }
    ));
  }

  function handleAjouter(nouveauBc) {
    setBons(prev => [nouveauBc, ...prev]);
  }

  const counts = {
    prevus:     bons.filter(b => b.statut === "prevu").length,
    enTransit:  bons.filter(b => b.statut === "en_transit").length,
    aQuai:      bons.filter(b => b.statut === "a_quai").length,
    conformes:  bons.filter(b => b.statut === "conforme").length,
    incidents:  bons.filter(b => b.statut === "non_conforme").length,
  };

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-5 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Truck size={16} className="text-white" />
              </div>
              <p className="text-base font-bold leading-none">Approvisionnements Fournisseurs</p>
            </div>
            <p className="text-xs text-slate-400 ml-10">Commandes émises par la Direction · Hub Central</p>
          </div>

          {/* Bouton conditionnel ADMIN_FEDERAL */}
          {isAdmin ? (
            <button
              onClick={() => setShowNouveau(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all shrink-0"
            >
              <PlusCircle size={14} />
              Nouvelle Commande Fournisseur
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold bg-slate-700 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-full shrink-0">
              <FileText size={11} />
              Consultation uniquement
            </div>
          )}
        </div>

        {/* Compteurs */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[
            { label: "Prévus",     val: counts.prevus,    col: "text-slate-300"   },
            { label: "En transit", val: counts.enTransit, col: "text-blue-300"    },
            { label: "À quai",     val: counts.aQuai,     col: "text-amber-300"   },
            { label: "Conformes",  val: counts.conformes, col: "text-emerald-300" },
            { label: "Litiges",    val: counts.incidents, col: "text-red-300"     },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl px-3 py-2 text-center">
              <p className={`text-xl font-bold tabular-nums ${s.col}`}>{s.val}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-x-auto">

        <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100">
          {["N° BC", "Fournisseur", "Arrivée prévue", "Statut", ""].map(h => (
            <p key={h} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-12">
              <span className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-sm text-slate-400">Chargement des commandes…</span>
            </div>
          ) : bons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Truck size={32} className="text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-600">Aucune commande fournisseur pour le moment</p>
              <p className="text-xs text-slate-400 mt-1">Les bons de commande émis vers les fournisseurs apparaîtront ici.</p>
              {apiError && <p className="text-xs text-red-400 mt-2">{apiError}</p>}
            </div>
          ) : bons.map(bc => {
            const arr = dateRelative(bc.dateArrivee);
            const termine = bc.statut === "conforme" || bc.statut === "non_conforme";
            return (
              <div key={bc.id} className={`grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-slate-50/60 transition-colors
                ${bc.statut === "prevu" ? "bg-slate-50/40" : ""}`}>

                {/* N° BC */}
                <div>
                  <p className="text-xs font-bold font-mono text-slate-800">{bc.id}</p>
                  {bc.ref_bl
                    ? <p className="text-[10px] text-slate-400 mt-0.5 font-mono">BL {bc.ref_bl}</p>
                    : bc.statut === "prevu" && <p className="text-[10px] text-slate-400 mt-0.5">BL à recevoir</p>
                  }
                </div>

                {/* Fournisseur + articles */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{bc.pavillon}</span>
                    <p className="text-xs font-semibold text-slate-800">{bc.fournisseur}</p>
                  </div>
                  <div className="space-y-0.5">
                    {bc.articles.map((a, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        {typeIcon(a.type, 10)}
                        <span className="text-[11px] text-slate-500 truncate">{a.label}</span>
                        <span className="text-[11px] font-mono text-slate-400 ml-auto shrink-0">{a.qte.toLocaleString()} {a.unite}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <p className={`text-xs font-semibold tabular-nums
                    ${arr.urgent ? "text-amber-600" : arr.past ? "text-slate-400" : "text-slate-700"}`}>
                    {arr.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock size={9} /> {bc.transporteur}
                  </p>
                </div>

                {/* Statut */}
                <div>
                  <StatutBadge statut={bc.statut} />
                  {bc.conformite?.note && (
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[160px] truncate leading-snug" title={bc.conformite.note}>
                      {bc.conformite.note}
                    </p>
                  )}
                </div>

                {/* Action */}
                <div className="shrink-0">
                  {bc.statut === "prevu" ? (
                    <span className="text-[11px] text-slate-400 italic">En attente expédition</span>
                  ) : termine ? (
                    <button onClick={() => setModal(bc)}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 underline underline-offset-2 transition-colors">
                      Modifier
                    </button>
                  ) : (
                    <button onClick={() => setModal(bc)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-500 transition-all whitespace-nowrap">
                      <ShieldCheck size={11} /> Noter conformité
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal nouvelle commande */}
      {showNouveau && (
        <ModalNouvelleCommande
          nextId={nextBcId(bons)}
          onClose={() => setShowNouveau(false)}
          onAjouter={handleAjouter}
        />
      )}

      {/* Modal conformité */}
      {modal && (
        <ModalConformite
          bc={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
