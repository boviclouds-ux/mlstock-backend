// MagasinierCentral.jsx — Interface terrain Magasinier Central
import { useState, useRef, useEffect } from "react";
import { api } from "./lib/api";
import {
  Truck, PackageCheck, AlertTriangle, CheckCircle, XCircle,
  ChevronDown, X, Snowflake, QrCode, Calendar, MapPin,
  Layers, Clock, Dna, FlaskConical, Wrench, BadgeCheck,
  ChevronRight, Plus, Trash2, ScanLine, Lock, FileText,
  Shield, Package, Zap
} from "lucide-react";

/* ─── Données ──────────────────────────────────────── */
const CUVES = [
  { id:"A", label:"Cuve Principale A-01", desc:"Multi-races · Holstein, Montbéliarde",    volume:800,  capacite:1000, temp:-196, statut:"ok"       },
  { id:"B", label:"Cuve Mobile B-02",     desc:"Remplissage en cours",                   volume:150,  capacite:1000, temp:-194, statut:"critique"  },
  { id:"C", label:"Tank Azote C-03",      desc:"Multi-races · Normande, Pie Rouge",       volume:620,  capacite:1000, temp:-196, statut:"ok"        },
  { id:"D", label:"Cuve Quarantaine D-04",desc:"Lots en attente validation Admin",        volume:380,  capacite:1000, temp:-195, statut:"alerte"    },
];

const LOTS = [
  { id:"LOT-2025-0041", article:"Holstein – BENNER JESUALDO", type:"semence", cuve:"A-01", rack:"Rack 2", qte:320, peremption:"2026-01-10" },
  { id:"LOT-2025-0042", article:"Montbéliarde – ALPAGA RF",   type:"semence", cuve:"A-01", rack:"Rack 4", qte:180, peremption:"2025-08-05" },
  { id:"LOT-2025-0043", article:"Normande – OLIVIER ET",      type:"semence", cuve:"C-03", rack:"Rack 1", qte:400, peremption:"2025-07-20" },
  { id:"LOT-2025-0044", article:"Prim'Holstein – JACKPOT",    type:"semence", cuve:"C-03", rack:"Rack 3", qte:95,  peremption:"2025-06-28" },
  { id:"LOT-2025-0045", article:"Azote liquide",              type:"azote",   cuve:"B-02", rack:"—",      qte:150, peremption:"2025-12-31" },
  { id:"LOT-2025-0046", article:"Azote liquide",              type:"azote",   cuve:"D-04", rack:"—",      qte:380, peremption:"2025-12-31" },
  { id:"LOT-2025-0047", article:"Cathéters jetables",         type:"materiel",cuve:"—",    rack:"Étagère F3", qte:2400, peremption:"2027-03-15" },
  { id:"LOT-2025-0048", article:"Gants insémination",         type:"materiel",cuve:"—",    rack:"Étagère F1", qte:1200, peremption:"2025-06-21" },
];

const COMMANDES_EXP = [
  { id:"ORD-2025-0041", origine:"admin",  destinataire:"Coopérative Sakia Al Hamra", region:"Laâyoune-Sakia",
    articles:[{label:"Holstein – BENNER JESUALDO",qte:500,unite:"doses",type:"semence"},{label:"Azote liquide",qte:10,unite:"litres",type:"azote"}],
    statut:"En attente", origineNote:"Répartition suite à l'arrivage Alta Genetics · CMD-891" },
  { id:"REQ-2025-0091", origine:"region", destinataire:"Coopérative Tadla Azilal", region:"Béni Mellal-Khénifra",
    articles:[{label:"Montbéliarde – ALPAGA RF",qte:200,unite:"doses",type:"semence"},{label:"Cathéters jetables",qte:500,unite:"unités",type:"materiel"}],
    statut:"Validé",
    lotsScelles:[{numLot:"LOT-2025-0042",article:"Montbéliarde – ALPAGA RF",qteRetire:200,unite:"doses",cuve:"A-01"},{numLot:"LOT-2025-0047",article:"Cathéters jetables",qteRetire:500,unite:"unités",cuve:"—"}] },
  { id:"ORD-2025-0042", origine:"admin",  destinataire:"Coopérative Gharb Chrarda", region:"Rabat-Salé-Kénitra",
    articles:[{label:"Normande – OLIVIER ET",qte:150,unite:"doses",type:"semence"}],
    statut:"Validé",
    lotsScelles:[{numLot:"LOT-2025-0043",article:"Normande – OLIVIER ET",qteRetire:150,unite:"doses",cuve:"C-03"}] },
];

const today = new Date("2025-06-14");
const joursRestants = ds => Math.round((new Date(ds)-today)/86400000);

/* ─── Helpers ──────────────────────────────────────── */
function typeIcon(type, sz=11) {
  if (type==="semence")  return <Dna size={sz} className="text-blue-400 shrink-0"/>;
  if (type==="azote")    return <FlaskConical size={sz} className="text-cyan-500 shrink-0"/>;
  return <Wrench size={sz} className="text-gray-400 shrink-0"/>;
}

function peremptionMeta(ds) {
  const j=joursRestants(ds);
  if (j<=14) return {color:"text-red-600",bg:"bg-red-50",border:"border-red-200",label:`⚠ ${j}j`,urgent:true};
  if (j<=45) return {color:"text-amber-600",bg:"bg-amber-50",border:"border-amber-200",label:`${j}j`,urgent:false};
  return {color:"text-gray-400",bg:"",border:"",label:ds,urgent:false};
}

/* Mapping DB statut → badge UI (clés = valeurs Mongoose enum) */
const STATUT_UI = {
  'Brouillon':   { label:'Brouillon',        bg:'bg-gray-50',    text:'text-gray-600',    border:'border-gray-200',   dot:'bg-gray-400'    },
  'En attente':  { label:'À préparer',       bg:'bg-blue-50',    text:'text-blue-700',    border:'border-blue-200',   dot:'bg-blue-500'    },
  'Validé':      { label:'Prêt au départ',   bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-200',dot:'bg-emerald-500'  },
  'Expédié':     { label:'Expédié',          bg:'bg-indigo-50',  text:'text-indigo-700',  border:'border-indigo-200', dot:'bg-indigo-500'   },
  'Réceptionné': { label:'Réceptionné',      bg:'bg-teal-50',    text:'text-teal-700',    border:'border-teal-200',   dot:'bg-teal-500'     },
  'Rejeté':      { label:'Rejeté',           bg:'bg-red-50',     text:'text-red-700',     border:'border-red-200',    dot:'bg-red-500'      },
};
function statutExp(s) { return STATUT_UI[s] ?? { label: s, bg:'bg-gray-50', text:'text-gray-500', border:'border-gray-200', dot:'bg-gray-400' }; }

/* ─── Carte Cuve ────────────────────────────────────── */
function CuveCard({cuve}) {
  const pct=Math.round((cuve.volume/cuve.capacite)*100);
  const isCrit=cuve.statut==="critique", isAl=cuve.statut==="alerte";
  const barC=isCrit?"bg-red-500":isAl?"bg-amber-400":"bg-cyan-500";
  const bgC=isCrit?"bg-red-50/40 border-red-200":isAl?"bg-amber-50/40 border-amber-200":"bg-white border-gray-100";
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${bgC}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isCrit?"bg-red-100":isAl?"bg-amber-100":"bg-cyan-50"}`}>
            <Snowflake size={14} className={isCrit?"text-red-500":isAl?"text-amber-500":"text-cyan-600"}/>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 leading-tight">{cuve.label}</p>
            <p className="text-[10px] text-gray-400 font-mono">{cuve.temp}°C</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{cuve.desc}</p>
          </div>
        </div>
        {(isCrit||isAl)&&<span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCrit?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"}`}>{isCrit?"CRITIQUE":"ALERTE"}</span>}
      </div>
      <div className="flex items-end gap-3">
        <div className="relative w-7 rounded-lg overflow-hidden bg-gray-100 shrink-0" style={{height:72}}>
          <div className={`absolute bottom-0 left-0 right-0 rounded-b-lg transition-all duration-700 ${barC}`} style={{height:`${pct}%`}}/>
        </div>
        <div className="flex-1">
          <p className={`text-2xl font-bold tabular-nums ${isCrit?"text-red-600":isAl?"text-amber-600":"text-gray-900"}`}>{pct}%</p>
          <p className="text-xs text-gray-400">{cuve.volume.toLocaleString()} / {cuve.capacite.toLocaleString()} L</p>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barC}`} style={{width:`${pct}%`}}/>
      </div>
    </div>
  );
}

/* ─── Drawer Picking ────────────────────────────────── */
function PickingDrawer({commande,onClose,onSceller}) {
  const [scan,setScan]=useState(""); const [lots,setLots]=useState([]); const [err,setErr]=useState(""); const [done,setDone]=useState(false);
  const ref=useRef();
  const totalDem=commande.articles.reduce((s,a)=>s+a.qte,0);
  const totalScan=lots.reduce((s,l)=>s+l.qteRetire,0);
  const pct=Math.min((totalScan/totalDem)*100,100);
  function handleScan(e){
    e.preventDefault(); const val=scan.trim().toUpperCase();
    if(!val)return;
    const lot=LOTS.find(l=>l.id===val||l.id.endsWith(val));
    if(!lot){setErr(`Lot "${val}" introuvable.`);return;}
    if(lots.find(l=>l.numLot===lot.id)){setErr("Lot déjà ajouté.");return;}
    setErr(""); setLots(p=>[...p,{numLot:lot.id,article:lot.article,qteRetire:lot.qte,unite:lot.type==="semence"?"doses":lot.type==="azote"?"litres":"unités",cuve:lot.cuve}]); setScan(""); ref.current?.focus();
  }
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose}/>
      <div className="relative ml-auto z-50 h-full w-full sm:max-w-lg bg-white shadow-2xl flex flex-col" style={{animation:"drawerIn .2s cubic-bezier(.32,0,.67,0) forwards"}}>
        <style>{`@keyframes drawerIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
        <div className="px-5 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="bg-blue-100 p-1.5 rounded-lg"><PackageCheck size={13} className="text-blue-600"/></div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Picking — Préparation Colis</span>
                {commande.origine==="admin"&&<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-950 text-violet-200 border border-violet-800"><Zap size={8} className="text-yellow-400"/>Ordre Admin</span>}
              </div>
              <h2 className="text-sm font-semibold text-gray-900">{commande.destinataire}</h2>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">#{commande.id}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"><X size={17}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {commande.origine==="admin"&&commande.origineNote&&(
            <div className="flex gap-2.5 bg-violet-950 border border-violet-800 rounded-xl px-4 py-3">
              <Zap size={14} className="text-yellow-400 shrink-0 mt-0.5"/>
              <div><p className="text-xs font-bold text-violet-200 mb-0.5">Info : Ordre de répartition Admin</p><p className="text-xs text-violet-300">{commande.origineNote}</p></div>
            </div>
          )}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">Articles à préparer</p>
            {commande.articles.map((a,i)=>(
              <div key={i} className="flex items-center gap-2">{typeIcon(a.type)}<span className="text-sm text-blue-700 flex-1">{a.label}</span><span className="text-sm font-bold text-blue-900">{a.qte} {a.unite}</span></div>
            ))}
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-700">Progression</span>
              <span className={`text-xs font-bold tabular-nums ${pct>=100?"text-emerald-600":"text-blue-600"}`}>{totalScan}/{totalDem}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${pct>=100?"bg-emerald-500":"bg-blue-500"}`} style={{width:`${pct}%`}}/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5"><ScanLine size={14} className="text-gray-400"/>Scanner N° de Lot</label>
            <form onSubmit={handleScan} className="flex gap-2">
              <div className="relative flex-1">
                <input ref={ref} type="text" value={scan} onChange={e=>{setScan(e.target.value);setErr("");}} placeholder="LOT-2025-0041 ou 0041" autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors"/>
                <ScanLine size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300"/>
              </div>
              <button type="submit" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"><Plus size={14}/>Ajouter</button>
            </form>
            {err&&<p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={11}/>{err}</p>}
          </div>
          {lots.length>0?(
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5"><PackageCheck size={13} className="text-emerald-500"/><span className="text-sm font-semibold text-gray-800">Lots ajoutés</span></div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{lots.length} lot{lots.length>1?"s":""}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {lots.map(l=>(
                  <div key={l.numLot} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0"><p className="text-xs font-mono font-semibold text-gray-700">{l.numLot}</p><p className="text-[10px] text-gray-400 mt-0.5 truncate">{l.article} · Cuve {l.cuve}</p></div>
                    <span className="text-sm font-bold text-gray-800 tabular-nums shrink-0">{l.qteRetire.toLocaleString()} <span className="text-xs font-normal text-gray-400">{l.unite}</span></span>
                    <button onClick={()=>setLots(p=>p.filter(x=>x.numLot!==l.numLot))} className="shrink-0 text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={12}/></button>
                  </div>
                ))}
              </div>
            </div>
          ):(
            <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center"><ScanLine size={22} className="mx-auto mb-2 text-gray-300"/><p className="text-xs text-gray-400">Aucun lot scanné</p></div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 flex gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Annuler</button>
          <button onClick={()=>{setDone(true);setTimeout(()=>{onSceller(commande.id,lots);onClose();},900);}} disabled={lots.length===0||done}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${done?"bg-emerald-500 text-white":lots.length>0?"bg-amber-500 hover:bg-amber-600 text-white shadow-sm":"bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
            {done?<><BadgeCheck size={15}/>Soumis à l'Admin !</>:<><Lock size={14}/>Sceller et soumettre à l'Admin</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modale Transporteur ───────────────────────────── */
function TransporteurModal({commande,onClose,onConfirm}) {
  const [societe,setSociete]=useState(""); const [matricule,setMatricule]=useState(""); const [step,setStep]=useState("idle");
  const canGo=societe.trim()!=="";
  function confirm(){setStep("loading");setTimeout(()=>setStep("done"),1200);setTimeout(()=>{onConfirm(commande.id);onClose();},2600);}
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e=>e.stopPropagation()} style={{animation:"modalIn .18s ease forwards"}}>
        <style>{`@keyframes modalIn{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        <div className="bg-emerald-600 px-5 pt-5 pb-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><div className="bg-white/20 p-1.5 rounded-lg"><Truck size={14}/></div><span className="text-xs font-bold uppercase tracking-widest text-emerald-100">Remise au Transporteur</span></div>
            <button onClick={onClose} className="text-white/60 hover:text-white p-1.5 rounded-lg"><X size={15}/></button>
          </div>
          <h2 className="text-sm font-bold">{commande.destinataire}</h2>
          <p className="font-mono text-xs text-emerald-200 mt-0.5">#{commande.id}</p>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Contenu scellé</p>
            {commande.lotsScelles?.map((l,i)=>(
              <div key={i} className="flex justify-between text-xs py-0.5"><span className="font-mono text-gray-500">{l.numLot}</span><span className="font-semibold text-gray-800">{l.qteRetire} {l.unite}</span></div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Société de Transport <span className="text-red-500">*</span></label>
            <input value={societe} onChange={e=>setSociete(e.target.value)} placeholder="Ex : Ghazala, SDTM Maroc…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Matricule / Nom chauffeur <span className="text-gray-400">(optionnel)</span></label>
            <input value={matricule} onChange={e=>setMatricule(e.target.value)} placeholder="Ex : 32841-B-5 / Ahmed Bennani"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors"/>
          </div>
          {step==="done"&&<div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3"><CheckCircle size={13} className="text-emerald-600 shrink-0"/><p className="text-xs text-emerald-700 font-medium">BL généré · Expédition enregistrée</p></div>}
        </div>
        <div className="px-5 pb-5 space-y-2">
          <button onClick={confirm} disabled={!canGo||step!=="idle"}
            className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all
              ${step==="done"?"bg-emerald-500 text-white":step==="loading"?"bg-emerald-400 text-white cursor-wait":canGo?"bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm":"bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
            {step==="done"?<><BadgeCheck size={15}/>Expédition enregistrée</>:step==="loading"?<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Génération BL…</>:<>🖨️ Imprimer le BL Sécurisé et Expédier</>}
          </button>
          {!canGo&&<p className="text-[10px] text-red-500 text-center">Veuillez renseigner la société de transport.</p>}
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">La validation finale sera effectuée par la coopérative destinataire à la réception physique du BL.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Adaptateur API Transaction → format UI Magasinier ─ */
function fromApiTransaction(t) {
  return {
    _id:         t._id,
    id:          t.reference,
    origine:     t.type === 'ORDRE_ADMIN' ? 'admin' : 'region',
    origineNote: t.motif ?? '',
    destinataire:t.uniteCible?.nom    ?? 'Hub Central',
    region:      t.uniteCible?.region ?? '—',
    statut:      t.statut,          // valeur brute Mongoose — jamais de alias UI
    articles:    (t.lignes ?? []).map(l => ({
      label: l.article?.designation ?? '—',
      qte:   l.quantite,
      unite: l.article?.uniteMesure ?? '—',
      type:  { Semences:'semence', Azote:'azote' }[l.article?.categorie] ?? 'materiel',
    })),
    lotsScelles: [],
  };
}

/* ══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════ */
const Zap2 = Zap; // alias pour éviter le conflit
export default function MagasinierCentral() {
  const [activeTab,    setActiveTab]    = useState("chambre");
  const [pickingCmd,   setPickingCmd]   = useState(null);
  const [transportCmd, setTransportCmd] = useState(null);
  const [commandes,    setCommandes]    = useState(COMMANDES_EXP);
  const [loadingCmd,   setLoadingCmd]   = useState(false);
  const [errorCmd,     setErrorCmd]     = useState(null);
  const [toast,        setToast]        = useState(null);  // { ok, msg }

  function showToast(ok, msg) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  }

  /* ─ Récupération des transactions au montage ──────── */
  useEffect(() => {
    setLoadingCmd(true);
    // Récupère tous les flux actifs (EXPEDITION + ORDRE_ADMIN)
    api.get("/api/transactions?limit=100")
      .then(res => {
        // getAllTransactions renvoie { data: [...], total } ou un tableau direct
        const list = Array.isArray(res) ? res : (res.data ?? []);
        const mapped = list
          .filter(t => ['EXPEDITION','ORDRE_ADMIN'].includes(t.type))
          .map(fromApiTransaction);
        if (mapped.length > 0) setCommandes(mapped);
      })
      .catch(err => {
        setErrorCmd(err.message);
        // Fallback : les données statiques COMMANDES_EXP restent
      })
      .finally(() => setLoadingCmd(false));
  }, []);

  /* Sceller = soumettre les lots + passer en "Validé" (prêt au départ) */
  function handleSceller(id, lots) {
    setCommandes(p => p.map(c => c.id === id ? { ...c, lotsScelles: lots } : c));
    handleUpdateStatut(id, 'Validé');
  }

  /* ═════════════════════════════════════════════════════
     handleUpdateStatut — PUT /statut avec valeur enum DB
     Optimistic update immédiat + rollback sur erreur.
  ═════════════════════════════════════════════════════ */
  async function handleUpdateStatut(cmdId, nouveauStatut) {
    const target = commandes.find(c => c.id === cmdId);
    if (!target) return;

    const prevStatut = target.statut;

    // Optimistic update : on stocke directement la valeur DB
    setCommandes(p => p.map(c => c.id === cmdId ? { ...c, statut: nouveauStatut } : c));

    if (!target._id) {
      showToast(true, `Statut mis à jour (local) → ${nouveauStatut}`);
      return;
    }

    try {
      await api.put(`/api/transactions/${target._id}/statut`, { statut: nouveauStatut });
      showToast(true, `Commande ${cmdId} — "${nouveauStatut}" enregistré en base.`);
    } catch (err) {
      console.error('[MagasinierCentral] handleUpdateStatut failed:', err);
      // Rollback si l'API échoue
      setCommandes(p => p.map(c => c.id === cmdId ? { ...c, statut: prevStatut } : c));
      showToast(false, `Échec : ${err.message}`);
    }
  }

  async function handleExpedition(id) { await handleUpdateStatut(id, 'Expédié'); }

  const actives = commandes.filter(c => c.statut !== 'Expédié' && c.statut !== 'Réceptionné');
  return (
    <div className="space-y-6">
      {pickingCmd&&<PickingDrawer commande={pickingCmd} onClose={()=>setPickingCmd(null)} onSceller={handleSceller}/>}
      {transportCmd&&<TransporteurModal commande={transportCmd} onClose={()=>setTransportCmd(null)} onConfirm={handleExpedition}/>}

      {/* Toast confirmation action */}
      {toast && (
        <div className={`flex items-center gap-3 rounded-2xl px-5 py-3 shadow-sm border
          ${toast.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
          style={{ animation:'fadeIn .2s ease' }}>
          <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {toast.ok
            ? <CheckCircle size={15} className="text-emerald-500 shrink-0" />
            : <AlertTriangle size={15} className="text-red-500 shrink-0" />}
          <p className={`text-xs font-semibold ${toast.ok ? 'text-emerald-700' : 'text-red-700'}`}>
            {toast.msg}
          </p>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600 shrink-0">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-white border border-gray-100 rounded-2xl p-1.5">
        {[{id:"chambre",label:"Chambre Froide & Lots",icon:Snowflake},{id:"expeditions",label:"Quai d'Expédition",icon:Package}].map(({id,label,icon:Icon})=>(
          <button key={id} onClick={()=>setActiveTab(id)}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${activeTab===id?"bg-blue-600 text-white shadow-sm":"text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
            <Icon size={15}/>{label}
          </button>
        ))}
      </div>

      {/* Chambre Froide */}
      {activeTab==="chambre"&&(
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3"><Snowflake size={14} className="text-cyan-500"/><h2 className="text-sm font-bold text-gray-700">Cuves d'Azote Liquide</h2><span className="text-xs text-gray-400 ml-auto">Cible : −196°C</span></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{CUVES.map(c=><CuveCard key={c.id} cuve={c}/>)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2"><Layers size={15} className="text-gray-400"/><div><h2 className="text-sm font-bold text-gray-800">Registre des Lots</h2><p className="text-xs text-gray-400 mt-0.5">{LOTS.length} lots actifs</p></div></div>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>≤14j</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>≤45j</span>
              </div>
            </div>
            <div className="overflow-x-auto"><div className="min-w-[580px]">
              <table className="w-full">
                <thead><tr className="bg-gray-50/80 border-b border-gray-100">{["N° de Lot","Article","Emplacement","Qté","Péremption"].map(h=><th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {LOTS.map(lot=>{
                    const pm=peremptionMeta(lot.peremption);
                    return (
                      <tr key={lot.id} className={`hover:bg-gray-50/60 transition-colors ${pm.urgent?"bg-red-50/20":""}`}>
                        <td className="px-4 py-3"><span className="text-xs font-mono font-semibold text-gray-600">{lot.id}</span></td>
                        <td className="px-4 py-3"><div className="flex items-center gap-1.5">{typeIcon(lot.type)}<span className="text-xs text-gray-700">{lot.article}</span></div></td>
                        <td className="px-4 py-3"><div className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={10} className="text-gray-300 shrink-0"/>{lot.cuve!=="—"?`${lot.cuve} · `:""}{lot.rack}</div></td>
                        <td className="px-4 py-3"><span className="text-sm font-bold text-gray-800 tabular-nums">{lot.qte.toLocaleString()}</span></td>
                        <td className="px-4 py-3">
                          {pm.urgent?<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${pm.bg} ${pm.color} ${pm.border}`}><AlertTriangle size={10}/>{pm.label} restants</span>
                          :joursRestants(lot.peremption)<=45?<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${pm.bg} ${pm.color} ${pm.border}`}><Clock size={10}/>{pm.label}j</span>
                          :<span className="text-xs text-gray-400 font-mono">{lot.peremption}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div></div>
          </div>
        </div>
      )}

      {/* Expéditions */}
      {activeTab==="expeditions"&&(
        <div className="space-y-3">

          {/* Bandeau erreur API */}
          {errorCmd&&(
            <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={14} className="text-red-500 shrink-0"/>
                <div>
                  <p className="text-xs font-bold text-red-700">Synchronisation partielle</p>
                  <p className="text-[11px] text-red-500">{errorCmd} — données statiques affichées.</p>
                </div>
              </div>
              <button onClick={()=>setErrorCmd(null)} className="text-red-400 hover:text-red-600 shrink-0"><X size={14}/></button>
            </div>
          )}

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Package size={14} className="text-gray-400"/>
            <h2 className="text-sm font-bold text-gray-800">Ordres d'Expédition</h2>
            {loadingCmd&&<span className="w-3.5 h-3.5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin ml-1"/>}
            <span className="ml-auto text-xs text-gray-400">{actives.length} actif{actives.length>1?"s":""}</span>
          </div>
          <div className="overflow-x-auto"><div className="min-w-[720px]">
            <table className="w-full">
              <thead><tr className="bg-gray-50/80 border-b border-gray-100">{["N° Ordre","Origine","Destinataire","Articles","Statut","Action"].map(h=><th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {actives.map(cmd=>{
                  const sm=statutExp(cmd.statut);
                  return (
                    <tr key={cmd.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3.5"><span className="text-xs font-mono font-semibold text-gray-600">{cmd.id}</span></td>
                      <td className="px-4 py-3.5">
                        {cmd.origine==="admin"
                          ?<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-950 text-violet-200 border border-violet-800"><Zap2 size={9} className="text-yellow-400"/>Ordre Admin</span>
                          :<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">Demande Unité</span>}
                      </td>
                      <td className="px-4 py-3.5"><p className="text-xs font-semibold text-gray-800">{cmd.destinataire}</p><p className="text-[10px] text-gray-400">{cmd.region}</p></td>
                      <td className="px-4 py-3.5 max-w-[180px]">
                        {cmd.articles.map((a,i)=><div key={i} className="flex items-center gap-1 text-xs text-gray-600">{typeIcon(a.type)}<span className="truncate">{a.qte} {a.unite} · {a.label}</span></div>)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sm.bg} ${sm.text} ${sm.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sm.dot} ${cmd.statut==="En attente"?"animate-pulse":""}`}/>
                          {sm.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {/* En attente / Brouillon → picking ou expédition directe */}
                        {(cmd.statut === 'En attente' || cmd.statut === 'Brouillon') && (
                          <div className="flex flex-col gap-1">
                            <button onClick={() => setPickingCmd(cmd)}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap">
                              <PackageCheck size={12}/> Commencer le Picking
                            </button>
                            <button onClick={() => handleUpdateStatut(cmd.id, 'Expédié')}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 transition-colors whitespace-nowrap">
                              <Truck size={11}/> Valider & Expédier
                            </button>
                          </div>
                        )}
                        {/* Validé (lots scellés) → remise au transporteur → Expédié */}
                        {cmd.statut === 'Validé' && (
                          <button onClick={() => setTransportCmd(cmd)}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap">
                            <Truck size={12}/> Remise Transporteur
                          </button>
                        )}
                        {/* Rejeté */}
                        {cmd.statut === 'Rejeté' && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-red-50 text-red-500 border border-red-200 cursor-not-allowed whitespace-nowrap">
                            <XCircle size={11}/> Rejeté
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"/>Flux actif
            </div>
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              <Shield size={10}/>
              {loadingCmd ? "Synchronisation…" : errorCmd ? "Données locales" : "API MongoDB"}
            </p>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
