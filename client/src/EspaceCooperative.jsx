// EspaceCooperative.jsx — Portail Responsable Coopérative
import { useState, useEffect } from "react";
import {
  ClipboardCheck, Truck, BarChart3, Send, AlertCircle,
  CheckCircle, X, ChevronDown, Dna, FlaskConical, Wrench,
  BadgeCheck, AlertTriangle, Plus, History, Calendar,
  MapPin, QrCode, ScanLine, ShieldCheck, Droplets,
  ChevronRight, FileSearch, Download, ImagePlus
} from "lucide-react";

/* ─── Données ──────────────────────────────────────── */
const COOP = {
  nom:"Sakia Al Hamra", region:"Laâyoune-Sakia", code:"COOP-SAH-007",
  quota:{ semences:{alloue:1200,consomme:850,unite:"doses"}, azote:{alloue:2000,consomme:720,unite:"litres"} },
};


const COULEUR_DOT={rouge:"bg-red-500",jaune:"bg-yellow-400",bleu:"bg-blue-500",vert:"bg-green-500",rose:"bg-pink-400",gris:"bg-gray-400"};

const RECEPTIONS=[
  { id:"EXP-2025-0042", dateEnvoi:"2025-06-13", articles:[{label:"Normande – OLIVIER ET",qte:150,unite:"doses"}],
    transporteur:"SDTM Maroc", matricule:"32841-B-5", statut:"en_transit",
    ficheTechnique:[{taureau:"OLIVIER ET",nni:"FR7291048",race:"Normande",refLot:"ML-FR-043",couleur:"vert",qte:90},{taureau:"RIGOLO NL",nni:"FR7291102",race:"Normande",refLot:"ML-FR-044",couleur:"rouge",qte:60}] },
  { id:"EXP-2025-0039", dateEnvoi:"2025-06-10", articles:[{label:"Holstein – BENNER JESUALDO",qte:200,unite:"doses"},{label:"Azote liquide",qte:80,unite:"litres"}],
    transporteur:"Trans-Atlas", matricule:"18204-A-6", statut:"en_transit",
    ficheTechnique:[{taureau:"BENNER JESUALDO",nni:"NL9283741",race:"Holstein",refLot:"ML-NL-041",couleur:"bleu",qte:120},{taureau:"DESTINED P",nni:"NL9283800",race:"Holstein",refLot:"ML-NL-042",couleur:"jaune",qte:80}] },
  { id:"EXP-2025-0031", dateEnvoi:"2025-06-05", articles:[{label:"Cathéters jetables",qte:500,unite:"unités"}],
    transporteur:"Ghazala Transport", matricule:"55012-D-3", statut:"receptionne", conformite:"conforme", ficheTechnique:null },
];

const COMMANDES=[
  {id:"CMD-COOP-0091",date:"2025-06-12",articles:[{label:"Holstein – BENNER JESUALDO",qte:100,unite:"doses"}],statut:"approuve",derogation:false},
  {id:"CMD-COOP-0088",date:"2025-06-08",articles:[{label:"Azote liquide",qte:200,unite:"litres"}],statut:"en_preparation",derogation:false},
  {id:"CMD-COOP-0083",date:"2025-06-01",articles:[{label:"Montbéliarde – ALPAGA RF",qte:150,unite:"doses"}],statut:"livre",derogation:false},
  {id:"CMD-COOP-0079",date:"2025-05-24",articles:[{label:"Prim'Holstein – JACKPOT",qte:95,unite:"doses"}],statut:"livre",derogation:false},
];

/* ─── Helpers ───────────────────────────────────────── */
function statutCmd(s){
  return {
    en_attente:    {label:"En attente Admin", bg:"bg-gray-100",   text:"text-gray-600",   border:"border-gray-200",   dot:"bg-gray-400",   pulse:false},
    approuve:      {label:"Approuvé",         bg:"bg-blue-50",    text:"text-blue-700",   border:"border-blue-200",   dot:"bg-blue-500",   pulse:false},
    en_preparation:{label:"En préparation",   bg:"bg-amber-50",   text:"text-amber-700",  border:"border-amber-200",  dot:"bg-amber-500",  pulse:true },
    livre:         {label:"Livré",            bg:"bg-emerald-50", text:"text-emerald-700",border:"border-emerald-200",dot:"bg-emerald-500",pulse:false},
  }[s]??{};
}

function articleIcon(type,sz=12){
  if(type==="semence")  return <Dna size={sz} className="text-blue-400 shrink-0"/>;
  if(type==="azote")    return <FlaskConical size={sz} className="text-cyan-500 shrink-0"/>;
  return <Wrench size={sz} className="text-gray-400 shrink-0"/>;
}

/* ─── Composant Barre Quota ─────────────────────────── */
function QuotaBar({label,alloue,consomme,unite,icon:Icon,iconColor,trackColor,barColor}){
  const pct=Math.min(Math.round((consomme/alloue)*100),100);
  const reste=alloue-consomme;
  const urgent=pct>=90, alerte=pct>=75;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${trackColor}`}><Icon size={18} className={iconColor}/></div>
          <div><p className="text-xs text-gray-400 font-medium">{label}</p><p className="text-lg font-bold text-gray-900 tabular-nums leading-tight">{consomme.toLocaleString()} <span className="text-sm font-normal text-gray-400">/ {alloue.toLocaleString()} {unite}</span></p></div>
        </div>
        <div className="text-right shrink-0"><p className={`text-2xl font-bold tabular-nums ${urgent?"text-red-600":alerte?"text-amber-600":"text-gray-900"}`}>{pct}%</p><p className="text-[10px] text-gray-400 mt-0.5">consommé</p></div>
      </div>
      <div className="space-y-1.5">
        <div className={`h-3 rounded-full ${trackColor} overflow-hidden`}>
          <div className={`h-full rounded-full transition-all duration-700 ${urgent?"bg-red-500":alerte?"bg-amber-400":barColor}`} style={{width:`${pct}%`}}/>
        </div>
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>0</span>
          <span className={`font-semibold ${urgent?"text-red-600":alerte?"text-amber-600":"text-emerald-600"}`}>{reste.toLocaleString()} {unite} restantes</span>
          <span>{alloue.toLocaleString()}</span>
        </div>
      </div>
      {urgent&&<div className="mt-3 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2"><AlertTriangle size={11} className="text-red-500 shrink-0"/><p className="text-xs text-red-700 font-medium">Quota critique — dérogation nécessaire pour toute nouvelle demande.</p></div>}
    </div>
  );
}

/* ─── Modale Réception ──────────────────────────────── */
function ReceptionModal({expedition,onClose,onValider}){
  const [codeBL,setCodeBL]=useState(""); const [conformite,setConformite]=useState("conforme"); const [commentaire,setCommentaire]=useState(""); const [done,setDone]=useState(false);
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e=>e.stopPropagation()} style={{animation:"modalIn .18s ease forwards"}}>
        <style>{`@keyframes modalIn{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5"><div className="bg-blue-100 p-1.5 rounded-lg"><ClipboardCheck size={15} className="text-blue-600"/></div><div><h2 className="text-sm font-semibold text-gray-900">Validation de Réception</h2><p className="text-xs text-gray-400 font-mono mt-0.5">#{expedition.id} · {expedition.transporteur}</p></div></div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><X size={15}/></button>
          </div>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-2">Articles reçus</p>
            {expedition.articles.map((a,i)=><div key={i} className="flex justify-between text-sm"><span className="text-blue-700">{a.label}</span><span className="font-bold text-blue-900">{a.qte} {a.unite}</span></div>)}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5"><QrCode size={13} className="text-gray-400"/>Code de contrôle (QR / Code BL)</label>
            <div className="relative"><input type="text" value={codeBL} onChange={e=>setCodeBL(e.target.value)} placeholder="Scannez ou saisissez le code BL"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors"/>
              <ScanLine size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">État de la marchandise</label>
            <div className="grid grid-cols-2 gap-2">
              {[{id:"conforme",label:"✅ Conforme",sub:"Lot en ordre",active:"border-emerald-400 bg-emerald-50",icon:CheckCircle,ic:"text-emerald-600"},{id:"anomalie",label:"⚠️ Anomalie",sub:"Problème constaté",active:"border-amber-400 bg-amber-50",icon:AlertTriangle,ic:"text-amber-600"}].map(({id,label,sub,active,icon:Icon,ic})=>(
                <button key={id} onClick={()=>setConformite(id)} className={`p-3 rounded-xl border-2 text-left transition-all ${conformite===id?active:"border-gray-200 bg-white hover:border-gray-300"}`}>
                  <Icon size={15} className={conformite===id?ic:"text-gray-300"}/><p className={`text-xs font-bold mt-1 ${conformite===id?"":"text-gray-600"}`}>{label}</p><p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Commentaires <span className="font-normal text-gray-400">(optionnel)</span></label>
            <textarea rows={2} value={commentaire} onChange={e=>setCommentaire(e.target.value)} placeholder="Ex : 2 paillettes cassées…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5"><ImagePlus size={14} className="text-gray-400"/>📸 Photo du lot <span className="font-normal text-gray-400 text-xs">(Recommandé si anomalie)</span></label>
            <label className={`flex flex-col items-center gap-2 border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition-all ${conformite==="anomalie"?"border-amber-300 bg-amber-50/40 hover:bg-amber-50":"border-gray-200 bg-gray-50/40 hover:bg-gray-50"}`}>
              <ImagePlus size={22} className={conformite==="anomalie"?"text-amber-400":"text-gray-300"}/>
              <span className="text-xs font-medium text-gray-500">Cliquer pour choisir un fichier</span>
              <input type="file" accept="image/jpeg,image/png" className="sr-only"/>
            </label>
            <p className="mt-1 text-[10px] text-gray-400">Format JPG / PNG · Justifie les dommages ou écarts.</p>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Annuler</button>
          <button onClick={()=>{setDone(true);setTimeout(()=>{onValider(expedition.id,conformite);onClose();},900);}} disabled={!codeBL.trim()||done}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${done?"bg-emerald-500 text-white":codeBL.trim()?conformite==="anomalie"?"bg-amber-500 hover:bg-amber-600 text-white":"bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm":"bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
            {done?<><BadgeCheck size={15}/>Réception confirmée</>:conformite==="anomalie"?<><AlertTriangle size={14}/>Valider avec anomalie</>:<><ShieldCheck size={14}/>Confirmer la Réception Finale</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modale Fiche Technique ────────────────────────── */
function FicheTechniqueModal({expedition,onClose}){
  const [dl,setDl]=useState(false);
  const lignes=expedition.ficheTechnique??[];
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={e=>e.stopPropagation()} style={{animation:"modalIn .18s ease forwards"}}>
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5"><div className="bg-blue-100 p-1.5 rounded-lg"><FileSearch size={15} className="text-blue-600"/></div><div><h2 className="text-sm font-semibold text-gray-900">Fiche Technique Génétique</h2><p className="text-xs text-gray-400 font-mono mt-0.5">#{expedition.id} · {expedition.dateEnvoi}</p></div></div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><X size={15}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-3">
            <Truck size={16} className="text-blue-500 shrink-0 mt-0.5"/>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-blue-800">{expedition.id} · {expedition.transporteur}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">{expedition.articles.map((a,i)=><span key={i} className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{a.qte} {a.unite} · {a.label}</span>)}</div>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5"><Dna size={13} className="text-blue-400"/><span className="text-sm font-semibold text-gray-800">Lignées génétiques</span></div>
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{lignes.length} taureau{lignes.length>1?"x":""} · {lignes.reduce((s,l)=>s+l.qte,0)} doses</span>
            </div>
            <div className="divide-y divide-gray-50">
              {lignes.map((l,i)=>{
                const dot=COULEUR_DOT[l.couleur]??"bg-gray-300";
                return (
                  <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                    <div className="shrink-0 flex flex-col items-center gap-1"><span className={`w-5 h-5 rounded-full shadow-sm ${dot}`}/><span className="text-[8px] text-gray-400 capitalize leading-none">{l.couleur}</span></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-bold text-gray-900">{l.taureau}</p><span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">{l.race}</span></div>
                      <div className="flex items-center gap-3 mt-0.5"><span className="text-[10px] text-gray-400 font-mono">NNI : {l.nni}</span><span className="text-[10px] text-gray-400 font-mono">Réf. : {l.refLot}</span></div>
                    </div>
                    <div className="shrink-0 text-right"><p className="text-base font-bold text-gray-900 tabular-nums">{l.qte}</p><p className="text-[10px] text-gray-400">doses</p></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Légende des couleurs</p>
            <div className="flex flex-wrap gap-2">
              {lignes.map((l,i)=><span key={i} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-full"><span className={`w-3 h-3 rounded-full ${COULEUR_DOT[l.couleur]??"bg-gray-300"}`}/>{l.couleur.charAt(0).toUpperCase()+l.couleur.slice(1)} → {l.taureau}</span>)}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 pt-3 border-t border-gray-100 shrink-0 flex gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Fermer</button>
          <button onClick={()=>{setDl(true);setTimeout(()=>setDl(false),2000);}} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${dl?"bg-emerald-500 text-white":"bg-slate-800 hover:bg-slate-900 text-white shadow-sm"}`}>
            {dl?<><BadgeCheck size={15}/>Fiche téléchargée !</>:<><Download size={14}/>Télécharger la fiche (PDF)</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modale Nouvelle Commande ──────────────────────── */
function NouvelleCommandeModal({quota,onClose,onSubmit,articles,articlesLoading,articlesError}){
  const [article,setArticle]=useState(null); const [qte,setQte]=useState(""); const [motif,setMotif]=useState(""); const [done,setDone]=useState(false);
  useEffect(()=>{if(articles.length>0)setArticle(articles[0]);},[articles]);
  const quotaRestant=article?.type==="semence"?quota.semences.alloue-quota.semences.consomme:article?.type==="azote"?quota.azote.alloue-quota.azote.consomme:null;
  const needsDero=quotaRestant!==null&&Number(qte)>quotaRestant;
  function changeArticle(label){const f=articles.find(a=>a.label===label);if(f){setArticle(f);setQte("");}}
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e=>e.stopPropagation()} style={{animation:"modalIn .18s ease forwards"}}>
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5"><div className="bg-blue-100 p-1.5 rounded-lg"><Send size={14} className="text-blue-600"/></div><div><h2 className="text-sm font-semibold text-gray-900">Nouvelle Demande</h2><p className="text-xs text-gray-400 mt-0.5">Sakia Al Hamra → Admin Fédéral</p></div></div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><X size={15}/></button>
          </div>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Article demandé</label>
            <div className="relative">
              <select value={article?.label??""} onChange={e=>changeArticle(e.target.value)} disabled={articlesLoading||!!articlesError} className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 pr-8 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors cursor-pointer disabled:opacity-50">
                {articlesLoading&&<option>Chargement…</option>}
                {articlesError&&<option>Erreur de chargement</option>}
                {!articlesLoading&&!articlesError&&articles.map(a=><option key={a.id}>{a.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Quantité <span className="font-normal text-gray-400 text-xs">({article?.unite})</span></label>
            <div className="flex items-center gap-2">
              <input type="number" value={qte} min={0} onChange={e=>setQte(e.target.value)} placeholder="0"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-base font-bold text-gray-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors"/>
              {quotaRestant!==null&&<div className="text-right shrink-0"><p className="text-[10px] text-gray-400">Quota restant</p><p className={`text-sm font-bold tabular-nums ${quotaRestant<=0?"text-red-600":quotaRestant<100?"text-amber-600":"text-emerald-600"}`}>{quotaRestant} {article.unite}</p></div>}
            </div>
          </div>
          {needsDero&&(
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5"/>
              <div><p className="text-xs font-bold text-amber-800 mb-0.5">Dérogation nécessaire</p><p className="text-xs text-amber-700 leading-relaxed">Cette demande dépasse votre quota restant de <strong>{Number(qte)-quotaRestant} {article.unite}</strong>. Une dérogation sera automatiquement soumise à l'Admin Fédéral.</p></div>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Motif <span className="font-normal text-gray-400">(optionnel)</span></label>
            <textarea rows={2} value={motif} onChange={e=>setMotif(e.target.value)} placeholder="Ex : Hausse des inséminations prévue ce trimestre…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors"/>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Annuler</button>
          <button onClick={()=>{setDone(true);setTimeout(()=>{onSubmit({article:article.label,qte:Number(qte),unite:article.unite,derogation:needsDero,motif});onClose();},900);}} disabled={!Number(qte)||done}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${done?"bg-emerald-500 text-white":Number(qte)?needsDero?"bg-amber-500 hover:bg-amber-600 text-white":"bg-blue-600 hover:bg-blue-700 text-white shadow-sm":"bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
            {done?<><BadgeCheck size={15}/>Demande envoyée !</>:needsDero?<><AlertCircle size={14}/>Envoyer avec dérogation</>:<><Send size={14}/>Envoyer la demande</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════ */
export default function EspaceCooperative(){
  const [activeTab,setActiveTab]=useState("receptions");
  const [receptions,setReceptions]=useState(RECEPTIONS);
  const [commandes,setCommandes]=useState(COMMANDES);
  const [recModal,setRecModal]=useState(null);
  const [ficheModal,setFicheModal]=useState(null);
  const [showCommande,setShowCommande]=useState(false);
  const [quota]=useState(COOP.quota);
  const [articles,setArticles]=useState([]);
  const [articlesLoading,setArticlesLoading]=useState(false);
  const [articlesError,setArticlesError]=useState(null);

  useEffect(()=>{
    setArticlesLoading(true);
    fetch("http://localhost:5000/api/articles")
      .then(res=>{if(!res.ok)throw new Error(`Erreur serveur (${res.status})`);return res.json();})
      .then(data=>setArticles(data.filter(a=>a.actif).map(a=>({id:a._id,label:a.code,type:a.categorie,unite:a.unite}))))
      .catch(err=>setArticlesError(err.message))
      .finally(()=>setArticlesLoading(false));
  },[]);

  function validerReception(id,conformite){setReceptions(p=>p.map(r=>r.id===id?{...r,statut:"receptionne",conformite}:r));}
  function nouvelleCommande({article,qte,unite,derogation,motif}){
    setCommandes(p=>[{id:`CMD-COOP-${String(p.length+92).padStart(4,"0")}`,date:"2025-06-14",articles:[{label:article,qte,unite}],statut:"en_attente",derogation},...p]);
  }

  const enTransit=receptions.filter(r=>r.statut==="en_transit");
  const receptionnees=receptions.filter(r=>r.statut==="receptionne");

  return (
    <div className="space-y-6">
      {recModal&&<ReceptionModal expedition={recModal} onClose={()=>setRecModal(null)} onValider={validerReception}/>}
      {ficheModal&&<FicheTechniqueModal expedition={ficheModal} onClose={()=>setFicheModal(null)}/>}
      {showCommande&&<NouvelleCommandeModal quota={quota} onClose={()=>setShowCommande(false)} onSubmit={nouvelleCommande} articles={articles} articlesLoading={articlesLoading} articlesError={articlesError}/>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">Portail : <span className="text-blue-700">{COOP.nom}</span></h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"/>Unité Active
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">{COOP.region} · <span className="font-mono">{COOP.code}</span></p>
        </div>
        <button onClick={()=>setShowCommande(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap">
          <Plus size={15}/>Nouvelle Demande
        </button>
      </div>

      {/* Quotas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuotaBar label="Quota Annuel Semences" alloue={quota.semences.alloue} consomme={quota.semences.consomme} unite={quota.semences.unite} icon={Dna} iconColor="text-blue-600" trackColor="bg-blue-50" barColor="bg-blue-500"/>
        <QuotaBar label="Quota Azote Liquide" alloue={quota.azote.alloue} consomme={quota.azote.consomme} unite={quota.azote.unite} icon={Droplets} iconColor="text-cyan-600" trackColor="bg-cyan-50" barColor="bg-cyan-500"/>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-white border border-gray-100 rounded-2xl p-1.5">
        {[{id:"receptions",label:"Réceptions & Conformité",icon:ClipboardCheck,count:enTransit.length},{id:"commandes",label:"Mes Commandes",icon:History,count:commandes.filter(c=>["en_attente","approuve"].includes(c.statut)).length}].map(({id,label,icon:Icon,count})=>(
          <button key={id} onClick={()=>setActiveTab(id)}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${activeTab===id?"bg-blue-600 text-white shadow-sm":"text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
            <Icon size={15}/>{label}
            {count>0&&<span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${activeTab===id?"bg-white/25 text-white":"bg-blue-100 text-blue-700"}`}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Onglet Réceptions */}
      {activeTab==="receptions"&&(
        <div className="space-y-4">
          {enTransit.length>0?(
            <div>
              <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block"/><h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">En transit — {enTransit.length} livraison{enTransit.length>1?"s":""}</h2></div>
              <div className="space-y-2">
                {enTransit.map(exp=>(
                  <div key={exp.id} className="bg-white rounded-2xl border border-blue-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm shadow-blue-50">
                    <div className="bg-blue-50 p-3 rounded-xl shrink-0"><Truck size={20} className="text-blue-500"/></div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900 font-mono">{exp.id}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block"/>En transit</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={11}/>Envoyé le {exp.dateEnvoi}</span>
                        <span className="flex items-center gap-1"><Truck size={11} className="text-gray-300"/>{exp.transporteur} · {exp.matricule}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">{exp.articles.map((a,i)=><span key={i} className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.qte} {a.unite} · {a.label}</span>)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {exp.ficheTechnique&&<button onClick={()=>setFicheModal(exp)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all whitespace-nowrap"><FileSearch size={13}/>Fiche Technique</button>}
                      <button onClick={()=>setRecModal(exp)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"><ClipboardCheck size={13}/>Valider la Réception</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ):(
            <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center"><Truck size={32} className="mx-auto mb-2 text-gray-200"/><p className="text-sm font-semibold text-gray-400">Aucune livraison en cours</p></div>
          )}
          {receptionnees.length>0&&(
            <details className="mt-2">
              <summary className="flex items-center gap-2 text-xs font-semibold text-gray-400 cursor-pointer select-none list-none hover:text-gray-600">
                <ChevronRight size={13}/>{receptionnees.length} livraison{receptionnees.length>1?"s":""} réceptionnée{receptionnees.length>1?"s":""}
              </summary>
              <div className="space-y-2 mt-2">
                {receptionnees.map(exp=>(
                  <div key={exp.id} className="bg-gray-50/60 rounded-2xl border border-gray-100 p-4 flex items-center gap-3 opacity-70">
                    <div className="bg-emerald-50 p-2.5 rounded-xl shrink-0"><BadgeCheck size={16} className="text-emerald-500"/></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-semibold text-gray-500">{exp.id}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${exp.conformite==="conforme"?"bg-emerald-50 text-emerald-700 border-emerald-200":"bg-amber-50 text-amber-700 border-amber-200"}`}>{exp.conformite==="conforme"?"✅ Conforme":"⚠️ Anomalie"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Onglet Commandes */}
      {activeTab==="commandes"&&(
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2"><History size={14} className="text-gray-400"/><h2 className="text-sm font-bold text-gray-800">Mes Commandes & Historique</h2></div>
            <button onClick={()=>setShowCommande(true)} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"><Plus size={12}/>Nouvelle demande</button>
          </div>
          <div className="overflow-x-auto"><div className="min-w-[580px]">
            <table className="w-full">
              <thead><tr className="bg-gray-50/80 border-b border-gray-100">{["N° Commande","Date","Articles","Statut","Dérogation"].map(h=><th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {commandes.map(cmd=>{
                  const sm=statutCmd(cmd.statut);
                  return (
                    <tr key={cmd.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3.5"><span className="text-xs font-mono font-semibold text-gray-600">{cmd.id}</span></td>
                      <td className="px-4 py-3.5"><span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={10} className="text-gray-300"/>{cmd.date}</span></td>
                      <td className="px-4 py-3.5 max-w-[200px]">{cmd.articles.map((a,i)=><div key={i} className="flex items-center gap-1 text-xs text-gray-700">{articleIcon(a.type,10)}<span className="font-semibold tabular-nums">{a.qte}</span><span className="text-gray-400">{a.unite}</span><span className="truncate">{a.label}</span></div>)}</td>
                      <td className="px-4 py-3.5"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sm.bg} ${sm.text} ${sm.border}`}><span className={`w-1.5 h-1.5 rounded-full ${sm.dot} ${sm.pulse?"animate-pulse":""}`}/>{sm.label}</span></td>
                      <td className="px-4 py-3.5">{cmd.derogation?<span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><AlertTriangle size={9}/>Dérogation</span>:<span className="text-[10px] text-gray-300">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
          <div className="px-5 py-3 border-t border-gray-100 flex justify-between">
            <span className="text-xs text-gray-400">{commandes.length} commandes au total</span>
            <span className="text-xs text-gray-400">{commandes.filter(c=>c.derogation).length} avec dérogation</span>
          </div>
        </div>
      )}
    </div>
  );
}
