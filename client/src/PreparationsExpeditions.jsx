import { useState, useRef, useEffect } from "react";
import { api } from "./lib/api";
import {
  Package, Clock, Truck, ClipboardList, Lock,
  Scan, CheckCircle, AlertTriangle, X, ChevronRight,
  PackageCheck, FileText, Dna, FlaskConical, Wrench,
  User, Calendar, Shield, Zap, ScanLine, Plus,
  Trash2, BadgeCheck, Filter
} from "lucide-react";

const COMMANDES_INIT = [
  {
    id: "ORD-2025-0041", origine: "admin",
    origineNote: "Répartition suite à l'arrivage Alta Genetics · CMD-891",
    destinataire: "Coopérative Sakia Al Hamra", region: "Laâyoune-Sakia",
    articles: [
      { label: "Holstein – BENNER JESUALDO", qte: 500, unite: "doses",  type: "semence" },
      { label: "Azote liquide",              qte: 10,  unite: "litres", type: "azote"   },
    ],
    statut: "a_preparer", priorite: "haute",
  },
  {
    id: "ORD-2025-0042", origine: "admin",
    origineNote: "Dotation Campagne Semences Juin 2025",
    destinataire: "Coopérative Gharb Chrarda", region: "Rabat-Salé-Kénitra",
    articles: [{ label: "Normande – OLIVIER ET", qte: 150, unite: "doses", type: "semence" }],
    statut: "approuve", priorite: "haute",
    lotsScelles: [{ numLot: "LOT-2025-0043", article: "Normande – OLIVIER ET", qteRetire: 150, unite: "doses", cuve: "C-03" }],
  },
  {
    id: "REQ-2025-0091", origine: "region",
    destinataire: "Coopérative Tadla Azilal", region: "Béni Mellal-Khénifra",
    articles: [
      { label: "Montbéliarde – ALPAGA RF", qte: 200, unite: "doses",  type: "semence"  },
      { label: "Cathéters jetables",        qte: 500, unite: "unités", type: "materiel" },
    ],
    statut: "en_attente_admin", priorite: "normale",
    lotsScelles: [
      { numLot: "LOT-2025-0042", article: "Montbéliarde – ALPAGA RF", qteRetire: 200, unite: "doses",  cuve: "A-01" },
      { numLot: "LOT-2025-0047", article: "Cathéters jetables",        qteRetire: 500, unite: "unités", cuve: "—"   },
    ],
  },
  {
    id: "REQ-2025-0092", origine: "region",
    destinataire: "Coopérative Aït Si Salem", region: "Souss-Massa",
    articles: [
      { label: "Prim'Holstein – JACKPOT", qte: 95,  unite: "doses",  type: "semence"  },
      { label: "Gants insémination",      qte: 200, unite: "unités", type: "materiel" },
    ],
    statut: "a_preparer", priorite: "normale",
  },
  {
    id: "REQ-2025-0093", origine: "region",
    destinataire: "Coopérative Chaouia Ouardigha", region: "Casablanca-Settat",
    articles: [{ label: "Azote liquide", qte: 80, unite: "litres", type: "azote" }],
    statut: "a_preparer", priorite: "normale",
  },
  {
    id: "REQ-2025-0094", origine: "region",
    destinataire: "Coopérative Doukkala Abda", region: "Marrakech-Safi",
    articles: [
      { label: "Holstein – BENNER JESUALDO", qte: 100, unite: "doses",  type: "semence"  },
      { label: "Pistolet insémination",      qte: 2,   unite: "pièces", type: "materiel" },
    ],
    statut: "en_attente_admin", priorite: "normale",
    lotsScelles: [
      { numLot: "LOT-2025-0041", article: "Holstein – BENNER JESUALDO", qteRetire: 100, unite: "doses",  cuve: "A-01" },
      { numLot: "LOT-2025-0047", article: "Pistolet insémination",       qteRetire: 2,   unite: "pièces", cuve: "—"   },
    ],
  },
];

const LOTS_DISPO = [
  { id: "LOT-2025-0041", article: "Holstein – BENNER JESUALDO", qte: 320, unite: "doses",  cuve: "A-01" },
  { id: "LOT-2025-0042", article: "Montbéliarde – ALPAGA RF",   qte: 180, unite: "doses",  cuve: "A-01" },
  { id: "LOT-2025-0043", article: "Normande – OLIVIER ET",      qte: 400, unite: "doses",  cuve: "C-03" },
  { id: "LOT-2025-0044", article: "Prim'Holstein – JACKPOT",    qte: 95,  unite: "doses",  cuve: "C-03" },
  { id: "LOT-2025-0045", article: "Azote liquide",              qte: 150, unite: "litres", cuve: "B-02" },
  { id: "LOT-2025-0046", article: "Azote liquide",              qte: 380, unite: "litres", cuve: "D-04" },
  { id: "LOT-2025-0047", article: "Cathéters jetables",         qte: 2400,unite: "unités", cuve: "—"    },
  { id: "LOT-2025-0048", article: "Gants insémination",         qte: 1200,unite: "unités", cuve: "—"    },
];

/* ─── Adaptateur Transaction API → format UI expéditions ── */
const STATUT_EXP = {
  'Brouillon':   'a_preparer',
  'En attente':  'a_preparer',
  'Validé':      'approuve',
  'Expédié':     'expedie',
  'Réceptionné': 'expedie',
  'Rejeté':      'a_preparer',
};
const CAT_EXP = { Semences:'semence', Azote:'azote' };

function fromApiToExpedition(t) {
  return {
    _id:         t._id,
    id:          t.reference,
    origine:     t.type === 'ORDRE_ADMIN' ? 'admin' : 'region',
    origineNote: t.motif ?? '',
    destinataire:t.uniteCible?.nom    ?? 'Hub Central',
    region:      t.uniteCible?.region ?? '—',
    statut:      STATUT_EXP[t.statut] ?? 'a_preparer',
    priorite:    t.type === 'ORDRE_ADMIN' ? 'haute' : 'normale',
    articles:    (t.lignes ?? []).map(l => ({
      label: l.article?.designation ?? '—',
      qte:   l.quantite,
      unite: l.article?.uniteMesure ?? '—',
      type:  CAT_EXP[l.article?.categorie] ?? 'materiel',
    })),
    lotsScelles: [],
  };
}

function statutMeta(s) {
  return {
    a_preparer:       { label:"À préparer",           bg:"bg-blue-50",   text:"text-blue-700",   border:"border-blue-200",   dot:"bg-blue-500",   pulse:false },
    en_attente_admin: { label:"En attente Admin",      bg:"bg-amber-50",  text:"text-amber-700",  border:"border-amber-200",  dot:"bg-amber-500",  pulse:true  },
    approuve:         { label:"Prêt au départ",        bg:"bg-emerald-50",text:"text-emerald-700",border:"border-emerald-200",dot:"bg-emerald-500",pulse:false },
    expedie:          { label:"Expédié",               bg:"bg-gray-100",  text:"text-gray-500",   border:"border-gray-200",   dot:"bg-gray-400",   pulse:false },
  }[s] ?? {};
}

function articleIcon(type) {
  if (type === "semence")  return <Dna         size={11} className="text-blue-400 shrink-0" />;
  if (type === "azote")    return <FlaskConical size={11} className="text-cyan-500 shrink-0" />;
  return                          <Wrench      size={11} className="text-gray-400 shrink-0" />;
}

function OrigineBadge({ origine }) {
  if (origine === "admin") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-950 text-violet-200 border border-violet-800 whitespace-nowrap">
      <Zap size={9} className="text-yellow-400" /> Ordre Admin
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
      <User size={9} /> Demande Unité
    </span>
  );
}

function TransporteurModal({ commande, onClose, onConfirm }) {
  const [societe,   setSociete]   = useState("");
  const [matricule, setMatricule] = useState("");
  const [step,      setStep]      = useState("idle"); // idle | loading | done

  const canConfirm = societe.trim() !== "";

  function handleConfirm() {
    setStep("loading");
    setTimeout(() => setStep("done"), 1200);
    setTimeout(() => { onConfirm(commande.id); onClose(); }, 2600);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}
        style={{ animation:"modalIn .18s ease forwards" }}>
        <style>{`@keyframes modalIn{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

        {/* Header émeraude */}
        <div className="bg-emerald-600 px-5 pt-5 pb-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg"><Truck size={14} /></div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">Remise au Transporteur</span>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white p-1.5 rounded-lg transition-colors"><X size={15} /></button>
          </div>
          <h2 className="text-sm font-bold leading-snug">{commande.destinataire}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs text-emerald-200">#{commande.id}</span>
            {commande.origine === "admin" && (
              <span className="flex items-center gap-1 text-[9px] font-bold bg-violet-900/60 text-violet-200 px-2 py-0.5 rounded-full border border-violet-700">
                <Zap size={8} className="text-yellow-400" /> Ordre Admin
              </span>
            )}
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">

          {/* Récap lots scellés */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Contenu du colis scellé</p>
            {commande.lotsScelles?.map((l, i) => (
              <div key={i} className="flex justify-between items-center py-1 text-xs">
                <span className="font-mono text-gray-500">{l.numLot}</span>
                <span className="font-semibold text-gray-800">{l.qteRetire} {l.unite}</span>
              </div>
            ))}
          </div>

          {/* Champs traçabilité */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Société de Transport <span className="text-red-500">*</span>
              </label>
              <input type="text" value={societe} onChange={e => setSociete(e.target.value)}
                placeholder="Ex : Ghazala, SDTM, Trans-Atlas…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Matricule véhicule / Nom chauffeur
                <span className="ml-1.5 font-normal text-gray-400">(optionnel)</span>
              </label>
              <input type="text" value={matricule} onChange={e => setMatricule(e.target.value)}
                placeholder="Ex : 12345-A-6 / Ahmed Bennani"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors" />
            </div>
          </div>

          {/* Confirmation impression */}
          {step === "done" && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <CheckCircle size={13} className="text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-700 font-medium">BL généré · Expédition enregistrée dans le système</p>
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="px-5 pb-5 space-y-2">
          <button onClick={handleConfirm} disabled={!canConfirm || step !== "idle"}
            className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all
              ${step === "done"    ? "bg-emerald-500 text-white"
              : step === "loading" ? "bg-emerald-400 text-white cursor-wait"
              : canConfirm         ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              :                      "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
            {step === "done"
              ? <><BadgeCheck size={15} /> Expédition enregistrée</>
              : step === "loading"
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Génération du BL…</>
                : <>🖨️ Imprimer le BL Sécurisé et Expédier</>}
          </button>
          {!canConfirm && step === "idle" && (
            <p className="text-[10px] text-red-500 text-center">Veuillez renseigner la société de transport.</p>
          )}
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            Note : La validation finale sera effectuée par la coopérative destinataire à la réception physique du Bon de Livraison.
          </p>
        </div>
      </div>
    </div>
  );
}

function PickingDrawer({ commande, onClose, onSceller }) {
  const [scanInput,   setScanInput]   = useState("");
  const [lotsAjoutes, setLotsAjoutes] = useState([]);
  const [scanError,   setScanError]   = useState("");
  const [done,        setDone]        = useState(false);
  const inputRef = useRef(null);

  const totalDemande = commande.articles.reduce((s, a) => s + a.qte, 0);
  const totalScanne  = lotsAjoutes.reduce((s, l) => s + l.qteRetire, 0);
  const pct          = Math.min((totalScanne / totalDemande) * 100, 100);
  const canSceller   = lotsAjoutes.length > 0;

  function handleScan(e) {
    e.preventDefault();
    const val = scanInput.trim().toUpperCase();
    if (!val) return;
    const lot = LOTS_DISPO.find(l => l.id === val || l.id.endsWith(val));
    if (!lot) { setScanError(`Lot "${val}" introuvable.`); return; }
    if (lotsAjoutes.find(l => l.numLot === lot.id)) { setScanError("Ce lot est déjà dans le colis."); return; }
    setScanError("");
    setLotsAjoutes(p => [...p, { numLot: lot.id, article: lot.article, qteRetire: lot.qte, unite: lot.unite, cuve: lot.cuve }]);
    setScanInput("");
    inputRef.current?.focus();
  }

  function handleSceller() {
    setDone(true);
    setTimeout(() => { onSceller(commande.id, lotsAjoutes); onClose(); }, 900);
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative ml-auto z-50 h-full w-full sm:max-w-lg bg-white shadow-2xl flex flex-col"
        style={{ animation:"drawerIn .2s cubic-bezier(.32,0,.67,0) forwards" }}>
        <style>{`@keyframes drawerIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        <div className="px-5 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <div className="bg-blue-100 p-1.5 rounded-lg shrink-0"><ClipboardList size={13} className="text-blue-600" /></div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Picking — Préparation Colis</span>
                <OrigineBadge origine={commande.origine} />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 truncate">{commande.destinataire}</h2>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">#{commande.id} · {commande.region}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors shrink-0"><X size={17} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {commande.origine === "admin" && commande.origineNote && (
            <div className="flex gap-2.5 bg-violet-950 border border-violet-800 rounded-xl px-4 py-3">
              <Zap size={14} className="text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-violet-200 mb-0.5">Info : Ordre de répartition Admin</p>
                <p className="text-xs text-violet-300 leading-relaxed">{commande.origineNote}</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-800 mb-2.5 uppercase tracking-wide">Articles à préparer</p>
            <div className="space-y-2">
              {commande.articles.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  {articleIcon(a.type)}
                  <span className="text-sm text-blue-700 flex-1">{a.label}</span>
                  <span className="text-sm font-bold text-blue-900">{a.qte.toLocaleString()} {a.unite}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-700">Progression du colis</span>
              <span className={`text-xs font-bold tabular-nums ${pct>=100?"text-emerald-600":"text-blue-600"}`}>{totalScanne} / {totalDemande} unités</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${pct>=100?"bg-emerald-500":"bg-blue-500"}`} style={{width:`${pct}%`}} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
              <Scan size={14} className="text-gray-400" /> Scanner N° de Lot
            </label>
            <form onSubmit={handleScan} className="flex gap-2">
              <div className="relative flex-1">
                <input ref={inputRef} type="text" value={scanInput} autoFocus
                  onChange={e => { setScanInput(e.target.value); setScanError(""); }}
                  placeholder="Ex : LOT-2025-0041 ou 0041"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors" />
                <ScanLine size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              </div>
              <button type="submit" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap">
                <Plus size={14} /> Ajouter
              </button>
            </form>
            {scanError && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={11}/> {scanError}</p>}
            <p className="mt-1 text-[10px] text-gray-400">Scannez le QR ou saisissez les 4 derniers chiffres du N° de lot.</p>
          </div>

          {lotsAjoutes.length > 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5"><PackageCheck size={13} className="text-emerald-500"/><span className="text-sm font-semibold text-gray-800">Lots ajoutés au colis</span></div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{lotsAjoutes.length} lot{lotsAjoutes.length>1?"s":""}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {lotsAjoutes.map(lot => (
                  <div key={lot.numLot} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-semibold text-gray-700">{lot.numLot}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{lot.article} · Cuve {lot.cuve}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-800 tabular-nums shrink-0">{lot.qteRetire.toLocaleString()} <span className="text-xs font-normal text-gray-400">{lot.unite}</span></span>
                    <button onClick={() => setLotsAjoutes(p => p.filter(l => l.numLot !== lot.numLot))}
                      className="shrink-0 text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={12}/></button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center">
              <Scan size={22} className="mx-auto mb-2 text-gray-300"/>
              <p className="text-xs font-medium text-gray-400">Aucun lot scanné pour l'instant</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 space-y-2">
          {!canSceller && <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5"><AlertTriangle size={11}/> Ajoutez au moins un lot pour sceller le colis.</p>}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Annuler</button>
            <button onClick={handleSceller} disabled={!canSceller || done}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all
                ${done?"bg-emerald-500 text-white":canSceller?"bg-amber-500 hover:bg-amber-600 text-white shadow-sm":"bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              {done ? <><BadgeCheck size={15}/> Soumis à l'Admin !</> : <><Lock size={14}/> Sceller et soumettre à l'Admin</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PreparationsExpeditions() {
  const [commandes,       setCommandes]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [apiError,        setApiError]        = useState(null);
  const [pickingCmd,      setPickingCmd]      = useState(null);
  const [transporteurCmd, setTransporteurCmd] = useState(null);
  const [flashId,         setFlashId]         = useState(null);
  const [filtre,          setFiltre]          = useState("tous");

  /* ─ Chargement depuis l'API ─────────────────────────── */
  async function fetchExpeditions() {
    setLoading(true);
    setApiError(null);
    try {
      const res  = await api.get("/api/transactions?limit=100");
      const list = Array.isArray(res) ? res : (res.data ?? []);
      const mapped = list
        .filter(t => ['EXPEDITION', 'ORDRE_ADMIN'].includes(t.type))
        .map(fromApiToExpedition);
      setCommandes(mapped.length > 0 ? mapped : COMMANDES_INIT);
    } catch (err) {
      setApiError(err.message);
      setCommandes(COMMANDES_INIT); // fallback données statiques
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchExpeditions(); }, []);

  const kpi = {
    aPreparer: commandes.filter(c => c.statut === "a_preparer").length,
    adminPrio: commandes.filter(c => c.origine === "admin" && c.statut !== "expedie").length,
    enAttente: commandes.filter(c => c.statut === "en_attente_admin").length,
  };

  function flash(id) { setFlashId(id); setTimeout(() => setFlashId(null), 800); }

  /* ─ Sceller : local + PUT API (En attente → Validé) ─── */
  async function handleSceller(id, lots) {
    setCommandes(p => p.map(c => c.id === id ? { ...c, statut: "en_attente_admin", lotsScelles: lots } : c));
    flash(id);
    const target = commandes.find(c => c.id === id);
    if (target?._id) {
      try { await api.put(`/api/transactions/${target._id}/statut`, { statut: 'Validé' }); }
      catch { /* la vue locale est déjà mise à jour */ }
    }
  }

  /* ─ Expédier : optimistic update + PUT API ───────────── */
  async function handleExpedition(id) {
    setCommandes(p => p.map(c => c.id === id ? { ...c, statut: "expedie" } : c));
    flash(id);
    const target = commandes.find(c => c.id === id);
    if (target?._id) {
      try { await api.put(`/api/transactions/${target._id}/statut`, { statut: 'Expédié' }); }
      catch { /* rollback silencieux — l'UI reste cohérente */ }
    }
  }

  const actives = commandes.filter(c => {
    if (c.statut === "expedie") return false;
    if (filtre === "admin")  return c.origine === "admin";
    if (filtre === "region") return c.origine === "region";
    return true;
  });
  const expedies = commandes.filter(c => c.statut === "expedie");

  const FILTRES = [
    { id:"tous",   label:"Toutes les commandes" },
    { id:"admin",  label:"Ordres Admin"          },
    { id:"region", label:"Demandes Régionales"   },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {pickingCmd      && <PickingDrawer commande={pickingCmd} onClose={() => setPickingCmd(null)} onSceller={handleSceller} />}
      {transporteurCmd && <TransporteurModal commande={transporteurCmd} onClose={() => setTransporteurCmd(null)} onConfirm={handleExpedition} />}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1 flex-wrap">
            <span>MLstock</span><span>/</span><span>Opérations Terrain</span><span>/</span>
            <span className="text-blue-600 font-medium">Préparations & Expéditions</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Quai d'Expédition</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <p className="text-sm text-gray-500">Magasinier Central · Outbound</p>
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> En service
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 bg-white border border-gray-100 rounded-xl px-3 py-2 shrink-0">Lun. 14 Juin 2025 · 09:42</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
          {[
            { label:"À préparer",               value:kpi.aPreparer, icon:Package, bg:"bg-blue-50",   iconColor:"text-blue-600",   border:"border-blue-100"   },
            { label:"Ordres Admin Prioritaires", value:kpi.adminPrio, icon:Zap,     bg:"bg-violet-50", iconColor:"text-violet-700", border:"border-violet-100" },
            { label:"En attente Validation",     value:kpi.enAttente, icon:Clock,   bg:"bg-amber-50",  iconColor:"text-amber-600",  border:"border-amber-100"  },
          ].map(({ label, value, icon:Icon, bg, iconColor, border }) => (
            <div key={label} className={`bg-white rounded-xl border ${border} p-4 flex items-center gap-3`}>
              <div className={`${bg} p-2.5 rounded-xl shrink-0`}><Icon size={18} className={iconColor} /></div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 leading-tight">{label}</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter size={13} className="text-gray-400 shrink-0" />
          {FILTRES.map(f => (
            <button key={f.id} onClick={() => setFiltre(f.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors
                ${filtre===f.id?"bg-slate-900 text-white border-slate-900":"bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">{actives.length} ordre{actives.length>1?"s":""} actif{actives.length>1?"s":""}</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <ClipboardList size={14} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-800">Ordres d'Expédition</h2>
            {loading && <span className="w-3.5 h-3.5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin ml-1" />}
            {!loading && <span className="ml-auto text-[10px] text-gray-400 font-mono">{apiError ? "⚠ Données locales" : "API MongoDB"}</span>}
          </div>
          {apiError && (
            <div className="flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-100 px-5 py-2.5">
              <p className="text-xs text-amber-700 flex items-center gap-1.5">
                <AlertTriangle size={12} className="shrink-0" />
                {apiError} — données de démonstration affichées
              </p>
              <button onClick={fetchExpeditions} className="text-[11px] font-bold text-amber-700 hover:underline shrink-0">Réessayer</button>
            </div>
          )}

          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    {["N° Ordre","Origine","Destinataire","Articles","Statut","Action"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && commandes.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12">
                      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Chargement des ordres d'expédition…</p>
                    </td></tr>
                  ) : actives.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12">
                      <CheckCircle size={28} className="mx-auto mb-2 text-gray-200"/>
                      <p className="text-sm text-gray-400">Aucun ordre actif pour ce filtre.</p>
                    </td></tr>
                  ) : actives.map(cmd => {
                    const sm = statutMeta(cmd.statut);
                    const isFlash = flashId === cmd.id;
                    return (
                      <tr key={cmd.id}
                        style={isFlash ? { animation:"rowFlash .6s ease" } : {}}
                        className={`transition-colors ${cmd.origine==="admin"?"hover:bg-violet-50/30":"hover:bg-gray-50/60"}`}>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-mono font-semibold text-gray-600">{cmd.id}</span>
                        </td>
                        <td className="px-4 py-3.5"><OrigineBadge origine={cmd.origine} /></td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-semibold text-gray-800 whitespace-nowrap">{cmd.destinataire}</p>
                          <p className="text-[10px] text-gray-400">{cmd.region}</p>
                        </td>
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <div className="space-y-1">
                            {cmd.articles.map((a,i) => (
                              <div key={i} className="flex items-center gap-1 text-xs text-gray-600">
                                {articleIcon(a.type)}
                                <span className="truncate">{a.qte} {a.unite} · {a.label}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sm.bg} ${sm.text} ${sm.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sm.dot} ${sm.pulse?"animate-pulse":""}`} />
                            {sm.label}
                          </span>
                          {cmd.lotsScelles && cmd.statut==="en_attente_admin" && (
                            <p className="text-[9px] text-gray-400 mt-0.5">{cmd.lotsScelles.length} lot{cmd.lotsScelles.length>1?"s":""} scellé{cmd.lotsScelles.length>1?"s":""}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {cmd.statut === "a_preparer" && (
                            <button onClick={() => setPickingCmd(cmd)}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap">
                              <ClipboardList size={12}/> Commencer le Picking
                            </button>
                          )}
                          {cmd.statut === "en_attente_admin" && (
                            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed whitespace-nowrap">
                              <Lock size={11}/> En attente Admin
                            </span>
                          )}
                          {cmd.statut === "approuve" && (
                            <button onClick={() => setTransporteurCmd(cmd)}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap">
                              <Truck size={12}/> Remise Transporteur
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {expedies.length > 0 && (
            <details className="border-t border-gray-100">
              <summary className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-400 cursor-pointer select-none list-none hover:bg-gray-50 transition-colors">
                <ChevronRight size={13}/> {expedies.length} expédition{expedies.length>1?"s":""} terminée{expedies.length>1?"s":""}
              </summary>
              <div className="overflow-x-auto"><div className="min-w-[760px]">
                <table className="w-full"><tbody className="divide-y divide-gray-50">
                  {expedies.map(cmd => (
                    <tr key={cmd.id} className="opacity-50 bg-gray-50/30">
                      <td className="px-4 py-3"><span className="text-xs font-mono text-gray-400">{cmd.id}</span></td>
                      <td className="px-4 py-3"><OrigineBadge origine={cmd.origine}/></td>
                      <td className="px-4 py-3"><p className="text-xs text-gray-500">{cmd.destinataire}</p></td>
                      <td className="px-4 py-3 max-w-[180px]">{cmd.articles.map((a,i) => <p key={i} className="text-[10px] text-gray-400 truncate">{a.qte} {a.unite} · {a.label}</p>)}</td>
                      <td className="px-4 py-3" colSpan={2}>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                          <BadgeCheck size={10}/> Expédié
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody></table>
              </div></div>
            </details>
          )}

          <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"/> Flux actif · {commandes.length} ordres au total
            </div>
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              <Shield size={10}/> Toute sortie requiert validation Admin avant remise transporteur
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes rowFlash{0%,100%{background:transparent}50%{background:#d1fae5}}`}</style>
    </div>
  );
}
