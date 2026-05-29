// CentreValidations.jsx — Centre de validations & Sécurité Admin Fédéral
import { useState, useEffect, useCallback } from "react";
import { api } from "./lib/api";
import {
  Clock, ShieldAlert, Key, CheckCircle, X, XCircle,
  Inbox, Package, AlertTriangle, ChevronDown, RefreshCw,
  FileText, User, Calendar, History, Shield, Eye,
  ChevronRight, Zap, BadgeAlert, Truck, ClipboardCheck,
  Building2, AlertCircle, Plus, Send, Trash2, Dna,
  FlaskConical, Wrench, Filter
} from "lucide-react";

/* ─── Adaptateur Transaction API → Requête Validation ── */
const TYPE_REQ_MAP = { RECEPTION:'reception', EXPEDITION:'expedition', ORDRE_ADMIN:'expedition' };

function fromApiToRequete(t) {
  const totalQte    = (t.lignes ?? []).reduce((s, l) => s + l.quantite, 0);
  const hasAnomalie = (t.lignes ?? []).some(l => ['Non conforme','Partiel'].includes(l.statutConformite));
  return {
    _id:       t._id,
    id:        t.reference,
    type:      TYPE_REQ_MAP[t.type] ?? 'expedition',
    origine:   t.fournisseurCible?.nom  ?? null,
    pays:      t.fournisseurCible?.pays ?? null,
    demandeur: t.initiatedBy
      ? `${t.initiatedBy.prenom ?? ''} ${t.initiatedBy.nom ?? ''}`.trim()
      : '—',
    detail:    t.motif?.trim() || `${(t.lignes ?? []).length} article(s) · ${totalQte} unités`,
    article:   t.lignes?.[0]?.article?.designation ?? '—',
    quantite:  totalQte,
    date:      new Date(t.createdAt).toLocaleString('fr-FR', {
      year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit',
    }),
    statut:    'en_attente',
    conformite: hasAnomalie ? 'anomalie' : t.type === 'RECEPTION' ? 'conforme' : null,
    rapport:   t.type === 'RECEPTION' ? {
      cmdRef:      t.reference,
      prevu:       totalQte,
      recu:        totalQte,
      remarque:    t.motif ?? '',
      magasinier:  t.initiatedBy ? `${t.initiatedBy.prenom ?? ''} ${t.initiatedBy.nom ?? ''}`.trim() : '—',
      temperature: 'Non renseigné',
    } : null,
  };
}

const DUREES=["Valable 15 min","Valable 1 heure","Valable aujourd'hui","Personnaliser..."];

function genPin(){return String(Math.floor(1000+Math.random()*9000));}
function dureeToSec(d){if(d==="Valable 15 min")return 900;if(d==="Valable 1 heure")return 3600;if(d==="Valable aujourd'hui")return 28800;return 900;}
function fmtTime(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;if(h>0)return `${h}h ${String(m).padStart(2,"0")}m`;return `${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;}

function typeMeta(type){
  return {
    reception:  {label:"Réception",       bg:"bg-blue-50",  text:"text-blue-700",  border:"border-blue-200",  icon:Inbox   },
    expedition: {label:"Expédition",      bg:"bg-indigo-50",text:"text-indigo-700",border:"border-indigo-200",icon:Package },
    depassement:{label:"Dépassement Quota",bg:"bg-red-50",  text:"text-red-700",   border:"border-red-200",   icon:BadgeAlert},
  }[type];
}

/* ─── Widget PIN ────────────────────────────────────── */
function PinWidget(){
  const [pin,setPin]=useState(null); const [duree,setDuree]=useState(DUREES[0]); const [customDate,setCustomDate]=useState(""); const [rem,setRem]=useState(0); const [copied,setCopied]=useState(false); const [generating,setGenerating]=useState(false);
  const isCustom=duree==="Personnaliser...";
  function computeSec(){if(isCustom&&customDate){const d=Math.floor((new Date(customDate)-Date.now())/1000);return d>0?d:0;}return dureeToSec(duree);}
  const gen=useCallback(async()=>{const s=computeSec();if(s<=0)return;setGenerating(true);try{const res=await api.post('/api/otp/generate',{dureeSecondes:s});setPin(String(res?.code??genPin()));setRem(s);setCopied(false);}catch{setPin(genPin());setRem(s);setCopied(false);}finally{setGenerating(false);}},[duree,customDate]);
  useEffect(()=>{if(!pin||rem<=0)return;const t=setInterval(()=>setRem(r=>{if(r<=1){clearInterval(t);setPin(null);return 0;}return r-1;}),1000);return()=>clearInterval(t);},[pin]);
  const pct=pin?(rem/computeSec())*100:0; const urgent=rem>0&&rem<60;
  return (
    <div className="bg-blue-900 border border-blue-800 rounded-xl p-4 flex flex-col gap-3 min-w-[220px]">
      <div className="flex items-center gap-2"><div className="bg-blue-800 p-1.5 rounded-lg"><Key size={13} className="text-blue-300"/></div><span className="text-xs font-semibold text-blue-200 uppercase tracking-wide">PIN Dérogation</span></div>
      {pin?(
        <>
          <div className="flex items-center justify-between gap-3">
            <span className={`text-3xl font-mono font-bold tracking-[0.2em] transition-colors ${urgent?"text-red-300 animate-pulse":"text-white"}`}>{pin}</span>
            <button onClick={()=>{navigator.clipboard?.writeText(pin);setCopied(true);setTimeout(()=>setCopied(false),1500);}} className="text-xs text-blue-300 hover:text-white border border-blue-700 hover:border-blue-500 px-2 py-1 rounded-md transition-colors">{copied?"✓ Copié":"Copier"}</button>
          </div>
          <div><div className="flex justify-between items-center mb-1.5"><span className={`text-xs font-semibold tabular-nums ${urgent?"text-red-300":"text-blue-200"}`}>{fmtTime(rem)}</span><span className="text-[10px] text-blue-400">{duree}</span></div><div className="h-1.5 bg-blue-800 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${urgent?"bg-red-400":pct>50?"bg-emerald-400":"bg-amber-400"}`} style={{width:`${pct}%`}}/></div></div>
          <button onClick={gen} disabled={generating} className="flex items-center justify-center gap-1.5 text-xs text-blue-400 hover:text-blue-200 disabled:opacity-40 transition-colors">{generating?<><span className="w-3 h-3 border-2 border-blue-600 border-t-blue-300 rounded-full animate-spin"/>…</>:<><RefreshCw size={11}/>Régénérer</>}</button>
        </>
      ):(
        <>
          <div className="flex flex-col gap-2">
            <div className="relative"><select value={duree} onChange={e=>{setDuree(e.target.value);setCustomDate("");}} className="w-full appearance-none bg-blue-800 border border-blue-700 text-blue-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">{DUREES.map(d=><option key={d} className="bg-blue-900 text-blue-100">{d}</option>)}</select><ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none"/></div>
            {isCustom&&<div className="flex flex-col gap-1"><label className="text-[10px] text-blue-300 font-semibold uppercase tracking-wide">Valide jusqu'au</label><input type="datetime-local" value={customDate} min={new Date(Date.now()+60000).toISOString().slice(0,16)} onChange={e=>setCustomDate(e.target.value)} className="w-full bg-white/10 border border-blue-600 text-blue-50 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 [color-scheme:dark]"/></div>}
          </div>
          <button onClick={gen} disabled={(isCustom&&(!customDate||new Date(customDate)<=new Date()))||generating} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors">{generating?<><span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-white rounded-full animate-spin"/>Génération…</>:<><Zap size={12} className="text-blue-200"/>Générer PIN</>}</button>
        </>
      )}
    </div>
  );
}

/* ─── Drawer Dérogation ─────────────────────────────── */
function DerogationDrawer({req,onClose,onDecision}){
  const [dec,setDec]=useState(null);
  const pct = req.quota > 0 ? Math.round((req.consomme / req.quota) * 100) : 0;
  function decide(d){setDec(d);setTimeout(()=>{onDecision(req.id,d);onClose();},900);}
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose}/>
      <div className="relative ml-auto z-50 h-full w-full sm:max-w-xl bg-white shadow-2xl flex flex-col" style={{animation:"drawerIn .2s cubic-bezier(.32,0,.67,0) forwards"}}>
        <style>{`@keyframes drawerIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
        <div className="px-5 pt-6 pb-5 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div><div className="flex items-center gap-2 mb-1.5"><div className="bg-red-100 p-1.5 rounded-lg"><ShieldAlert size={14} className="text-red-600"/></div><span className="text-xs font-bold text-red-600 uppercase tracking-widest">Dérogation Quota · Arbitrage</span></div><h2 className="text-base font-semibold text-gray-900">{req.unite}</h2><p className="text-xs text-gray-400 mt-0.5">{req.id} · {req.date}</p></div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"><X size={17}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4"><p className="text-sm font-semibold text-red-800 mb-1">Quota 100% consommé</p><p className="text-xs text-red-700 leading-relaxed"><strong>{req.unite}</strong> a consommé {req.consomme} doses sur quota {req.quota}. Demande exceptionnelle de <strong>{req.quantite} doses supplémentaires</strong>.</p></div>
          <div className="grid grid-cols-3 gap-3">
            {[{label:"Quota alloué",value:req.quota,cls:"bg-gray-50 border-gray-100 text-gray-900"},{label:"Consommé",value:req.consomme,cls:"bg-red-50 border-red-100 text-red-600"},{label:"Demande except.",value:`+${req.quantite}`,cls:"bg-amber-50 border-amber-100 text-amber-600"}].map(({label,value,cls})=>(
              <div key={label} className={`rounded-xl border p-3 text-center ${cls}`}><p className="text-[10px] text-gray-400 mb-1">{label}</p><p className={`text-xl font-bold`}>{value}</p></div>
            ))}
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2"><span className="text-xs font-semibold text-gray-700">Taux de consommation</span><span className="text-xs font-bold text-red-600">{pct}%</span></div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1.5"><div className="h-full bg-red-500 rounded-full" style={{width:`${Math.min(pct,100)}%`}}/></div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2"><History size={14} className="text-gray-400"/><span className="text-sm font-semibold text-gray-800">Historique des dérogations</span></div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${req.totalDerogations>=3?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"}`}>{req.totalDerogations} ce mois</span>
            </div>
            <div className="divide-y divide-gray-50">{req.historique.map((h,i)=><div key={i} className="flex items-center justify-between px-4 py-2.5"><span className="text-xs font-medium text-gray-600">{h.mois}</span><div className="flex items-center gap-3"><span className="text-xs text-gray-400">{h.derogations} demande{h.derogations>1?"s":""}</span><span className={`text-xs font-semibold ${h.accordees===h.derogations?"text-emerald-600":h.accordees>0?"text-amber-600":"text-gray-400"}`}>{h.accordees} accordée{h.accordees>1?"s":""}</span></div></div>)}</div>
            {req.totalDerogations>=3&&<div className="px-4 py-2.5 bg-red-50 border-t border-red-100 flex items-start gap-2"><AlertTriangle size={12} className="text-red-500 mt-0.5 shrink-0"/><p className="text-xs text-red-700">Seuil de vigilance atteint : <strong>{req.totalDerogations} dérogations</strong>. Un refus est recommandé.</p></div>}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 flex flex-col sm:flex-row gap-2">
          <button onClick={()=>decide("refuse")} disabled={!!dec} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg border transition-all ${dec==="refuse"?"bg-gray-200 text-gray-400":"border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"}`}><XCircle size={15}/>{dec==="refuse"?"Refus enregistré":"Refuser la dérogation"}</button>
          <button onClick={()=>decide("approuve")} disabled={!!dec} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${dec==="approuve"?"bg-emerald-500 text-white":"bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"}`}><CheckCircle size={15}/>{dec==="approuve"?"Dérogation accordée ✓":"Accorder la dérogation"}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Drawer Réception Fournisseur ──────────────────── */
function ReceptionDrawer({req,onClose,onDecision}){
  const [dec,setDec]=useState(null); const r=req.rapport; const hasAno=req.conformite==="anomalie";
  function decide(d){setDec(d);setTimeout(()=>{onDecision(req.id,d);onClose();},900);}
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose}/>
      <div className="relative ml-auto z-50 h-full w-full sm:max-w-xl bg-white shadow-2xl flex flex-col" style={{animation:"drawerIn .2s cubic-bezier(.32,0,.67,0) forwards"}}>
        <div className="px-5 pt-6 pb-5 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div><div className="flex items-center gap-2 mb-1.5"><div className={`p-1.5 rounded-lg ${hasAno?"bg-amber-100":"bg-blue-100"}`}><ClipboardCheck size={14} className={hasAno?"text-amber-600":"text-blue-600"}/></div><span className={`text-xs font-bold uppercase tracking-widest ${hasAno?"text-amber-600":"text-blue-600"}`}>Rapport de Conformité · Réception</span></div><h2 className="text-base font-semibold text-gray-900">{req.origine}</h2><p className="text-xs text-gray-400 mt-0.5 font-mono">{req.id} · Commande #{r.cmdRef}</p></div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"><X size={17}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {hasAno&&<div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3"><AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5"/><div><p className="text-sm font-semibold text-amber-800 mb-0.5">Anomalie détectée</p><p className="text-xs text-amber-700 leading-relaxed">{r.remarque}</p></div></div>}
          <div className="grid grid-cols-3 gap-3">
            {[{label:"Prévu",value:r.prevu,cls:"bg-gray-50 border-gray-100 text-gray-900"},{label:"Reçu",value:r.recu,cls:r.recu<r.prevu?"bg-amber-50 border-amber-100 text-amber-600":"bg-emerald-50 border-emerald-100 text-emerald-600"},{label:"Écart",value:r.recu<r.prevu?`−${r.prevu-r.recu}`:"0",cls:r.recu<r.prevu?"bg-red-50 border-red-100 text-red-600":"bg-emerald-50 border-emerald-100 text-emerald-600"}].map(({label,value,cls})=>(
              <div key={label} className={`rounded-xl border p-3 text-center ${cls}`}><p className="text-[10px] text-gray-400 mb-1">{label}</p><p className="text-xl font-bold">{value}</p><p className="text-[10px] text-gray-400 mt-0.5">doses</p></div>
            ))}
          </div>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2"><FileText size={13} className="text-gray-400"/><span className="text-sm font-semibold text-gray-800">Rapport du magasinier</span></div>
            <div className="divide-y divide-gray-50">
              {[{label:"Référence commande",value:`#${r.cmdRef}`},{label:"Magasinier",value:r.magasinier},{label:"Température",value:r.temperature,warn:r.temperature?.includes("⚠")},{label:"Remarque",value:r.remarque}].map(({label,value,warn})=>(
                <div key={label} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <span className="text-xs font-medium text-gray-400 shrink-0">{label}</span>
                  <span className={`text-xs font-medium text-right leading-relaxed ${warn?"text-amber-600":"text-gray-700"}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 flex flex-col sm:flex-row gap-2">
          {hasAno?(
            <><button onClick={()=>decide("refuse")} disabled={!!dec} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg border transition-all ${dec==="refuse"?"bg-gray-200 text-gray-400":"border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"}`}><XCircle size={15}/>{dec==="refuse"?"Lot rejeté":"Rejeter le lot"}</button>
            <button onClick={()=>decide("approuve")} disabled={!!dec} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${dec==="approuve"?"bg-amber-500 text-white":"bg-amber-500 hover:bg-amber-600 text-white shadow-sm"}`}><CheckCircle size={15}/>{dec==="approuve"?`Intégration ${r.recu} doses ✓`:`Valider avec réserve (${r.recu} doses)`}</button></>
          ):(
            <button onClick={()=>decide("approuve")} disabled={!!dec} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${dec==="approuve"?"bg-emerald-500 text-white":"bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"}`}><CheckCircle size={15}/>{dec==="approuve"?`Intégration ${r.recu} doses ✓`:`Valider & intégrer au stock`}</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Modale Nouvel Ordre ───────────────────────────── */
function NouvelOrdreModal({onClose,onSubmit}){
  const [unites,        setUnites]        = useState([]);
  const [loadingUnites, setLoadingUnites] = useState(true);
  const [dest,          setDest]          = useState(null);
  const [articles,       setArticles]       = useState([]);
  const [loadingArticles,setLoadingArticles]= useState(true);
  const [urgent,setUrgent]=useState(false); const [motif,setMotif]=useState("");
  const [lignes,setLignes]=useState([{id:1,articleId:null,article:"",unite:"",qte:""}]);
  const [done,setDone]=useState(false);

  useEffect(()=>{
    api.get("/api/unites?actif=true")
      .then(res=>{ const list=Array.isArray(res)?res:(res.data??[]); setUnites(list); if(list.length>0)setDest(list[0]); })
      .catch(()=>{})
      .finally(()=>setLoadingUnites(false));
  },[]);

  useEffect(()=>{
    api.get("/api/articles?actif=true")
      .then(res=>{ const list=Array.isArray(res)?res:(res.data??[]); setArticles(list); if(list.length>0){const f=list[0];setLignes([{id:1,articleId:f._id,article:f.designation,unite:f.uniteMesure,qte:""}]);} })
      .catch(()=>{})
      .finally(()=>setLoadingArticles(false));
  },[]);

  const canSave=!!dest&&lignes.every(l=>!!l.articleId&&Number(l.qte)>0)&&motif.trim()!=="";
  function addLigne(){const f=articles[0];setLignes(p=>[...p,{id:Date.now(),articleId:f?._id??null,article:f?.designation??"",unite:f?.uniteMesure??"",qte:""}]);}
  function removeLigne(id){setLignes(p=>p.filter(l=>l.id!==id));}
  function updateLigne(id,field,val){setLignes(p=>p.map(l=>{if(l.id!==id)return l;if(field==="articleId"){const a=articles.find(a=>a._id===val);return{...l,articleId:val,article:a?.designation??"",unite:a?.uniteMesure??l.unite};}return{...l,[field]:val};}));}
  function submit(){setDone(true);setTimeout(()=>{onSubmit({dest,urgent,motif,lignes});onClose();},900);}
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden" onClick={e=>e.stopPropagation()} style={{animation:"modalIn .18s ease forwards"}}>
        <style>{`@keyframes modalIn{from{transform:scale(.96);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3"><div className="bg-violet-900 p-2 rounded-xl"><Zap size={16} className="text-yellow-400"/></div><div><h2 className="text-base font-semibold text-gray-900">Émission d'un Ordre Prioritaire</h2><p className="text-xs text-gray-400 mt-0.5">Admin Fédéral · Push vers le magasin central</p></div></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><X size={17}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div><label className="block text-sm font-semibold text-gray-800 mb-1.5">Destinataire</label><div className="relative"><select value={dest?._id??""} onChange={e=>{const u=unites.find(u=>u._id===e.target.value);if(u)setDest(u);}} disabled={loadingUnites} className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 pr-8 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-gray-300 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait">{loadingUnites?<option value="" disabled>Chargement des unités…</option>:unites.length===0?<option value="" disabled>Aucune unité active</option>:unites.map(u=><option key={u._id} value={u._id}>{u.nom}{u.region?` — ${u.region}`:""}</option>)}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/></div></div>
          <div>
            <div className="flex items-center justify-between mb-2"><label className="text-sm font-semibold text-gray-800">Articles à expédier</label><span className="text-xs text-gray-400">{lignes.length} ligne{lignes.length>1?"s":""}</span></div>
            <div className="space-y-2">
              {lignes.map((ligne)=>(
                <div key={ligne.id} className="flex items-center gap-2">
                  <div className="relative flex-1"><select value={ligne.articleId??""} onChange={e=>updateLigne(ligne.id,"articleId",e.target.value)} disabled={loadingArticles} className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-7 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-gray-300 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait">{loadingArticles?<option value="" disabled>Chargement…</option>:articles.length===0?<option value="" disabled>Aucun article actif</option>:articles.map(a=><option key={a._id} value={a._id}>{a.designation} ({a.uniteMesure})</option>)}</select><ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/></div>
                  <div className="flex items-center gap-1 w-28 shrink-0"><input type="number" value={ligne.qte} min={0} onChange={e=>updateLigne(ligne.id,"qte",e.target.value)} placeholder="Qté" className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-right font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors"/><span className="text-[10px] text-gray-400 whitespace-nowrap">{ligne.unite}</span></div>
                  {lignes.length>1&&<button onClick={()=>removeLigne(ligne.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={13}/></button>}
                </div>
              ))}
            </div>
            <button onClick={addLigne} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900 hover:bg-violet-50 px-3 py-1.5 rounded-lg transition-colors"><Plus size={12}/>Ajouter une ligne</button>
          </div>
          <div><label className="block text-sm font-semibold text-gray-800 mb-1.5">Motif / Contexte <span className="text-red-500">*</span></label><textarea rows={2} value={motif} onChange={e=>setMotif(e.target.value)} placeholder="Ex : Répartition suite à arrivage Alta Genetics…" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors"/></div>
          <button onClick={()=>setUrgent(u=>!u)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${urgent?"border-violet-500 bg-violet-50":"border-gray-200 bg-white hover:border-gray-300"}`}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${urgent?"bg-violet-600 border-violet-600":"border-gray-300"}`}>{urgent&&<CheckCircle size={12} className="text-white"/>}</div>
            <div><p className={`text-sm font-semibold ${urgent?"text-violet-800":"text-gray-700"}`}><Zap size={12} className={`inline mr-1 ${urgent?"text-yellow-500":"text-gray-400"}`}/>Urgent / Prioritaire</p><p className="text-xs text-gray-400 mt-0.5">Le magasinier sera notifié en priorité absolue</p></div>
          </button>
        </div>
        <div className="px-6 pb-5 pt-3 border-t border-gray-100 shrink-0 flex gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Annuler</button>
          <button onClick={submit} disabled={!canSave||done} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${done?"bg-emerald-500 text-white":canSave?"bg-violet-700 hover:bg-violet-800 text-white shadow-sm":"bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
            {done?<><CheckCircle size={15}/>Ordre transmis au magasin !</>:<><Send size={14}/>Envoyer l'ordre au Magasin Central</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════ */
export default function CentreValidations(){
  const [requetes,    setRequetes]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [actionError, setActionError] = useState(null);
  const [drawerDero,  setDrawerDero]  = useState(null);
  const [drawerRec,   setDrawerRec]   = useState(null);
  const [showOrdre,   setShowOrdre]   = useState(false);
  const [flashId,     setFlashId]     = useState(null);
  const [filterType,  setFilterType]  = useState("tous");
  const [ordresEmis,  setOrdresEmis]  = useState([]);

  useEffect(() => {
    api.get("/api/transactions?statut=En%20attente&limit=100")
      .then(res => {
        const list = Array.isArray(res) ? res : (res.data ?? []);
        // On inclut les ORDRE_ADMIN "En attente" : le magasinier a terminé le picking
        // et attend la validation admin. Ce n'est pas circulaire — c'est l'étape suivante.
        setRequetes(list.map(fromApiToRequete));
      })
      .catch(() => setRequetes([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    receptions:   requetes.filter(r => r.type === "reception"   && r.statut === "en_attente").length,
    expeditions:  requetes.filter(r => r.type === "expedition"  && r.statut === "en_attente").length,
    depassements: requetes.filter(r => r.type === "depassement" && r.statut === "en_attente").length,
  };

  /* Mapping décision UI → statut Mongoose selon le type de requête */
  function resolveStatutApi(type, dec) {
    if (dec === 'refuse') return 'Rejeté';
    return type === 'reception' ? 'Réceptionné' : 'Validé';
  }

  /* Décision via drawer (Dérogation ou Réception) — update state APRÈS succès API */
  async function handleDecision(id, dec) {
    setActionError(null);
    const target = requetes.find(r => r.id === id);
    if (target?._id) {
      try {
        await api.put(`/api/transactions/${target._id}/statut`, {
          statut: resolveStatutApi(target.type, dec),
        });
      } catch (err) {
        setActionError(err.message);
        return; // ne pas mettre à jour l'UI si l'API échoue
      }
    }
    setRequetes(p => p.map(r => r.id === id ? { ...r, statut: dec } : r));
    flash(id);
  }

  /* Approbation / refus rapide inline — update state APRÈS succès API */
  async function handleQuick(id, dec) {
    setActionError(null);
    const target = requetes.find(r => r.id === id);
    if (target?._id) {
      try {
        await api.put(`/api/transactions/${target._id}/statut`, {
          statut: resolveStatutApi(target.type, dec),
        });
      } catch (err) {
        setActionError(err.message);
        return;
      }
    }
    flash(id);
    setRequetes(p => p.map(r => r.id === id ? { ...r, statut: dec } : r));
  }

  function flash(id) { setFlashId(id); setTimeout(() => setFlashId(null), 800); }

  /* Validation directe Admin → Expédié (nouveau flux double-validation) */
  async function handleValiderAdmin(id) {
    setActionError(null);
    const target = requetes.find(r => r.id === id);
    if (!target?._id) return;
    try {
      await api.put(`/api/ordres/${target._id}/valider-admin`);
      flash(id);
      setRequetes(p => p.filter(r => r.id !== id));
    } catch (err) {
      setActionError(err.message ?? 'Erreur lors de la validation admin.');
    }
  }

  function handleNouvelOrdre(data){setOrdresEmis(p=>[{id:`ORD-2025-${String(p.length+42).padStart(4,"0")}`,dest:data.dest,urgent:data.urgent,motif:data.motif,lignes:data.lignes,statut:"transmis",date:new Date().toLocaleString("fr-FR",{hour:"2-digit",minute:"2-digit"})}, ...p]);}

  const filtered=filterType==="tous"?requetes:requetes.filter(r=>r.type===filterType);
  const pending=filtered.filter(r=>r.statut==="en_attente");
  const resolved=filtered.filter(r=>r.statut!=="en_attente");

  const CONF_COLOR={conforme:"bg-emerald-50 text-emerald-700 border-emerald-200",anomalie:"bg-amber-50 text-amber-700 border-amber-200"};

  return (
    <div className="space-y-6">
      {drawerDero&&<DerogationDrawer req={drawerDero} onClose={()=>setDrawerDero(null)} onDecision={handleDecision}/>}
      {drawerRec&&<ReceptionDrawer req={drawerRec} onClose={()=>setDrawerRec(null)} onDecision={handleDecision}/>}
      {showOrdre&&<NouvelOrdreModal onClose={()=>setShowOrdre(false)} onSubmit={handleNouvelOrdre}/>}

      {/* Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-end gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 w-full sm:w-auto">
            <button onClick={()=>setShowOrdre(true)} className="flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
              <Zap size={14} className="text-yellow-400"/>Nouvel Ordre de Répartition
            </button>
            <div className="w-full sm:w-auto"><PinWidget/></div>
          </div>
        </div>
      </div>

      {/* Bandeau erreur action */}
      {actionError && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={14} className="text-red-500 shrink-0" />
            <p className="text-xs font-semibold text-red-700">{actionError}</p>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[{label:"Réceptions à valider",value:stats.receptions,icon:Inbox,bg:"bg-blue-50",iconColor:"text-blue-600",border:"border-blue-100",onClick:()=>setFilterType("reception"),active:filterType==="reception"},
          {label:"Expéditions en attente",value:stats.expeditions,icon:Package,bg:"bg-indigo-50",iconColor:"text-indigo-600",border:"border-indigo-100",onClick:()=>setFilterType("expedition"),active:filterType==="expedition"},
          {label:"Dépassements Quota",value:stats.depassements,icon:ShieldAlert,bg:"bg-red-50",iconColor:"text-red-600",border:"border-red-100",onClick:()=>setFilterType("depassement"),active:filterType==="depassement"},
        ].map(({label,value,icon:Icon,bg,iconColor,border,onClick,active})=>(
          <button key={label} onClick={onClick} className={`bg-white rounded-xl border p-4 flex items-center gap-4 text-left transition-all hover:shadow-sm ${active?"border-blue-300 ring-1 ring-blue-200":border+" hover:border-gray-200"}`}>
            <div className={`${bg} p-2.5 rounded-xl shrink-0`}><Icon size={20} className={iconColor}/></div>
            <div className="flex-1 min-w-0"><p className="text-xs text-gray-400 truncate">{label}</p><p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p></div>
            {active&&<ChevronRight size={14} className="text-blue-500 shrink-0"/>}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} className="text-gray-400 shrink-0"/>
        {[{id:"tous",label:"Toutes"},{id:"reception",label:"Réceptions"},{id:"expedition",label:"Expéditions"},{id:"depassement",label:"Dépassements"}].map(({id,label})=>(
          <button key={id} onClick={()=>setFilterType(id)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${filterType===id?"bg-slate-900 text-white border-slate-900":"bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>{label}</button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{pending.length} en attente · {resolved.length} traitée{resolved.length>1?"s":""}</span>
      </div>

      {/* Tableau requêtes */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading?(<div className="flex items-center justify-center gap-3 py-12"><span className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"/><span className="text-sm text-gray-400">Chargement des requêtes…</span></div>):pending.length>0?(
          <div className="overflow-x-auto"><div className="min-w-[780px]">
            <table className="w-full">
              <thead><tr className="bg-gray-50/80 border-b border-gray-100">{["ID Requête","Type","Origine / Demandeur","Détail","État & Conformité","Date / Heure","Statut","Actions"].map(h=><th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {pending.map(req=>{
                  const isCrit=req.priorite==="critique"; const m=typeMeta(req.type);
                  return (
                    <tr key={req.id} style={flashId===req.id?{animation:"rowFlash .6s ease"}:{}} className={`transition-colors ${isCrit?"bg-red-50/20 hover:bg-red-50/40":"hover:bg-gray-50/60"}`}>
                      <td className="px-4 py-3.5"><div className="flex items-center gap-1.5">{isCrit&&<AlertTriangle size={11} className="text-red-500 shrink-0"/>}<span className="text-xs font-mono font-semibold text-gray-600">{req.id}</span></div></td>
                      <td className="px-4 py-3.5"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${m.bg} ${m.text} ${m.border}`}><m.icon size={10}/>{m.label}</span></td>
                      <td className="px-4 py-3.5"><div className="flex items-center gap-1.5">{req.type==="reception"?<Truck size={11} className="text-blue-300 shrink-0"/>:<User size={11} className="text-gray-300 shrink-0"/>}<div><span className="text-xs text-gray-700 block">{req.origine??req.demandeur}</span>{req.pays&&<span className="text-[10px] text-gray-400">{req.pays}</span>}</div></div></td>
                      <td className="px-4 py-3.5 max-w-[180px]"><p className="text-xs text-gray-700 truncate">{req.detail}</p></td>
                      <td className="px-4 py-3.5">{req.conformite?<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CONF_COLOR[req.conformite]}`}>{req.conformite==="conforme"?"✅ Conforme":"⚠️ Anomalie"}</span>:<span className="text-[10px] text-gray-300">—</span>}</td>
                      <td className="px-4 py-3.5"><div className="flex items-center gap-1 text-xs text-gray-400"><Calendar size={11}/>{req.date}</div></td>
                      <td className="px-4 py-3.5"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock size={10}/>En attente Admin</span></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {req.type==="depassement"&&<button onClick={()=>setDrawerDero(req)} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors whitespace-nowrap"><Eye size={11}/>Arbitrer</button>}
                          {req.type==="reception"&&<button onClick={()=>setDrawerRec(req)} className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${req.conformite==="anomalie"?"bg-amber-500 hover:bg-amber-600 text-white":"bg-blue-600 hover:bg-blue-700 text-white"}`}><ClipboardCheck size={11}/>{req.conformite==="anomalie"?"Voir rapport":"Valider"}</button>}
                          {req.type==="expedition"&&<button onClick={()=>handleValiderAdmin(req.id)} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap"><CheckCircle size={11}/>Valider</button>}
                          <button onClick={()=>handleQuick(req.id,"refuse")} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all whitespace-nowrap"><XCircle size={11}/>Refuser</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
        ):(
          <div className="flex flex-col items-center justify-center py-14 text-center"><div className="bg-emerald-50 rounded-full p-4 mb-3"><CheckCircle size={28} className="text-emerald-500"/></div><p className="text-sm font-semibold text-gray-700">File d'attente vide</p><p className="text-xs text-gray-400 mt-1">Aucune requête en attente de validation.</p></div>
        )}
        {resolved.length>0&&(
          <details className="border-t border-gray-100">
            <summary className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-400 cursor-pointer hover:bg-gray-50 select-none list-none"><ChevronDown size={13}/>{resolved.length} requête{resolved.length>1?"s":""} traitée{resolved.length>1?"s":""}</summary>
            <div className="overflow-x-auto"><div className="min-w-[780px]"><table className="w-full"><tbody className="divide-y divide-gray-50">
              {resolved.map(req=>{const m=typeMeta(req.type);return(<tr key={req.id} className="bg-gray-50/40 opacity-70"><td className="px-4 py-3"><span className="text-xs font-mono text-gray-400">{req.id}</span></td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m.bg} ${m.text} ${m.border}`}><m.icon size={9}/>{m.label}</span></td><td className="px-4 py-3 max-w-[200px]"><p className="text-xs text-gray-400 truncate">{req.detail}</p></td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${req.statut==="approuve"?"bg-emerald-50 text-emerald-700 border-emerald-200":"bg-gray-100 text-gray-500 border-gray-200"}`}>{req.statut==="approuve"?<><CheckCircle size={9}/>Approuvé</>:<><XCircle size={9}/>Refusé</>}</span></td><td className="px-4 py-3" colSpan={4}/></tr>);})}</tbody></table></div></div>
          </details>
        )}
        <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"/>Flux actif · {requetes.length} requêtes au total</div>
        </div>
      </div>

      {/* Ordres émis */}
      {ordresEmis.length>0&&(
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2"><Zap size={14} className="text-yellow-500"/><h2 className="text-sm font-bold text-gray-800">Ordres de Répartition Émis</h2><span className="ml-auto text-xs text-gray-400">{ordresEmis.length} ordre{ordresEmis.length>1?"s":""}</span></div>
          <div className="divide-y divide-gray-50">
            {ordresEmis.map(o=>(
              <div key={o.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0"><p className="text-xs font-mono font-semibold text-gray-600">{o.id}{o.urgent&&<span className="ml-2 text-[10px] font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-full"><Zap size={8} className="inline"/>Urgent</span>}</p><p className="text-xs text-gray-500 mt-0.5">{o.dest?.nom ?? o.dest} · {o.motif}</p></div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse"/>Transmis au Magasin</span>
                <span className="text-[10px] text-gray-400">{o.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`@keyframes rowFlash{0%,100%{background:transparent}50%{background:#d1fae5}}`}</style>
    </div>
  );
}
