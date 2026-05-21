import { useState } from "react";
import {
  User, Mail, Building2, Shield, Settings, Lock,
  Globe, Bell, Eye, EyeOff, Check, AlertTriangle,
  Pencil, Save, X, Sun, Moon, Key, ChevronRight
} from "lucide-react";

const UTILISATEUR = {
  nom: "Hassan El Fassi", email: "h.elfassi@marocl.ma",
  unite: "Direction · Siège Rabat", role: "Admin Fédéral",
  initiales: "HF", dateCreation: "Septembre 2023",
  dernConn: "Aujourd'hui à 08:14",
};

const LANGUES = ["Français", "العربية", "English"];

function strengthScore(pw) {
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const SL = ["","Faible","Moyen","Bon","Fort"];
const SC = ["","bg-red-500","bg-amber-400","bg-blue-500","bg-emerald-500"];
const ST = ["","text-red-600 dark:text-red-400","text-amber-600 dark:text-amber-400","text-blue-600 dark:text-blue-400","text-emerald-600 dark:text-emerald-400"];

export default function ProfilUtilisateur({ dark, onToggleDark }) {
  /* Section 1 */
  const [editMode,  setEditMode]  = useState(false);
  const [nomEdit,   setNomEdit]   = useState(UTILISATEUR.nom);
  const [emailEdit, setEmailEdit] = useState(UTILISATEUR.email);
  const [uniteEdit, setUniteEdit] = useState(UTILISATEUR.unite);
  const [saved,     setSaved]     = useState(false);

  function handleSave() { setSaved(true); setEditMode(false); setTimeout(()=>setSaved(false),2500); }

  /* Section 2 */
  const [langue,  setLangue]  = useState("Français");
  const [notifs,  setNotifs]  = useState(true);

  /* Section 3 */
  const [oldPw,    setOldPw]    = useState("");
  const [newPw,    setNewPw]    = useState("");
  const [confPw,   setConfPw]   = useState("");
  const [sOld,     setSOld]     = useState(false);
  const [sNew,     setSNew]     = useState(false);
  const [sConf,    setSConf]    = useState(false);
  const [pwSaved,  setPwSaved]  = useState(false);

  const score   = strengthScore(newPw);
  const match   = newPw && confPw && newPw === confPw;
  const noMatch = confPw && newPw !== confPw;
  const canSave = oldPw && newPw.length >= 8 && match;

  function handlePwSave() {
    if (!canSave) return;
    setPwSaved(true);
    setOldPw(""); setNewPw(""); setConfPw("");
    setTimeout(()=>setPwSaved(false),3000);
  }

  const card  = "bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 transition-colors shadow-sm";
  const lbl   = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5";
  const fld   = "w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100";
  const fldRO = fld + " cursor-default opacity-70";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Paramètres du Profil</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Gérez vos informations, préférences et sécurité.</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full dark:text-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-800">
            <Check size={12}/> Modifications enregistrées
          </span>
        )}
      </div>

      {/* Section 1 */}
      <div className={card}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <User size={15} className="text-slate-400"/>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Informations Personnelles</h2>
          </div>
          {!editMode
            ? <button onClick={()=>setEditMode(true)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-blue-900/30 transition-all"><Pencil size={12}/> Modifier</button>
            : <div className="flex gap-2">
                <button onClick={()=>{setEditMode(false);setNomEdit(UTILISATEUR.nom);setEmailEdit(UTILISATEUR.email);setUniteEdit(UTILISATEUR.unite);}} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700 transition-all"><X size={12}/> Annuler</button>
                <button onClick={handleSave} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"><Save size={12}/> Enregistrer</button>
              </div>
          }
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg">{UTILISATEUR.initiales}</div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center border-2 border-white dark:border-slate-800"><Check size={11} className="text-white"/></div>
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-bold text-slate-900 dark:text-white">{nomEdit}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800"><Shield size={9}/>{UTILISATEUR.role}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Membre depuis {UTILISATEUR.dateCreation}</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"/>Dernière connexion : {UTILISATEUR.dernConn}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Nom Complet</label>
            {editMode ? <input value={nomEdit} onChange={e=>setNomEdit(e.target.value)} className={fld}/> : <div className={fldRO}>{nomEdit}</div>}
          </div>
          <div>
            <label className={lbl}>Adresse Email</label>
            {editMode
              ? <input type="email" value={emailEdit} onChange={e=>setEmailEdit(e.target.value)} className={fld}/>
              : <div className={`${fldRO} flex items-center gap-2`}><Mail size={13} className="text-slate-400 shrink-0"/>{emailEdit}</div>}
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Unité d'affectation</label>
            {editMode
              ? <input value={uniteEdit} onChange={e=>setUniteEdit(e.target.value)} className={fld}/>
              : <div className={`${fldRO} flex items-center gap-2`}><Building2 size={13} className="text-slate-400 shrink-0"/>{uniteEdit}</div>}
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-5">
          <Settings size={15} className="text-slate-400"/>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">Préférences & Affichage</h2>
        </div>
        <div className="space-y-5">
          {/* Thème de l'interface — désactivé pour les tests V1
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Thème de l'interface</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Basculer entre le mode clair et sombre</p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl shrink-0">
              <button onClick={()=>onToggleDark(false)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!dark?"bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm":"text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                <Sun size={13}/> Clair
              </button>
              <button onClick={()=>onToggleDark(true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dark?"bg-slate-800 text-white shadow-sm":"text-slate-500 hover:text-slate-700"}`}>
                <Moon size={13}/> Sombre
              </button>
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700"/>
          */}

          {/* Langue de l'interface — désactivée pour les tests V1
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Langue de l'interface</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Actuellement : <strong className="text-slate-600 dark:text-slate-300">{langue}</strong></p>
            </div>
            <div className="relative shrink-0">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              <select value={langue} onChange={e=>setLangue(e.target.value)} className="appearance-none pl-8 pr-7 py-2 text-sm rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors border-slate-200 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                {LANGUES.map(l=><option key={l}>{l}</option>)}
              </select>
              <ChevronRight size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90"/>
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700"/>
          */}

          {/* Notifs */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><Bell size={13} className="text-slate-400"/>Notifications par email</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Alertes de quotas, réceptions et dérogations</p>
            </div>
            <button onClick={()=>setNotifs(v=>!v)} className={`relative inline-flex h-6 w-11 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 shrink-0 ${notifs?"bg-blue-600 border-blue-600":"bg-slate-200 border-slate-200 dark:bg-slate-600 dark:border-slate-600"}`}>
              <span className={`inline-block w-4 h-4 rounded-full bg-white shadow transition-transform mt-0.5 ${notifs?"translate-x-5":"translate-x-0.5"}`}/>
            </button>
          </div>
        </div>
      </div>

      {/* Section 3 */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-5">
          <Lock size={15} className="text-slate-400"/>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">Sécurité du Compte</h2>
        </div>
        <div className="space-y-4">
          {/* Champ mot de passe actuel */}
          {[
            {label:"Mot de passe actuel",val:oldPw,set:setOldPw,show:sOld,setShow:setSOld},
            {label:"Nouveau mot de passe",val:newPw,set:setNewPw,show:sNew,setShow:setSNew,isNew:true},
            {label:"Confirmer le nouveau mot de passe",val:confPw,set:setConfPw,show:sConf,setShow:setSConf,isConf:true},
          ].map(({label,val,set,show,setShow,isNew,isConf})=>(
            <div key={label}>
              <label className={lbl}>{label}</label>
              <div className="relative">
                <input type={show?"text":"password"} value={val} onChange={e=>set(e.target.value)} placeholder="••••••••"
                  className={`${fld} pr-10 ${isConf&&noMatch?"border-red-400 dark:border-red-600":isConf&&match?"border-emerald-400 dark:border-emerald-600":""}`}/>
                <button type="button" onClick={()=>setShow(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {show?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              </div>
              {isNew && newPw && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">{[1,2,3,4].map(i=><div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i<=score?SC[score]:"bg-slate-200 dark:bg-slate-600"}`}/>)}</div>
                  <p className={`text-[10px] font-semibold ${ST[score]}`}>Force : {SL[score]}</p>
                </div>
              )}
              {isConf && noMatch && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 font-semibold"><AlertTriangle size={10}/>Les mots de passe ne correspondent pas.</p>}
              {isConf && match   && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold"><Check size={10}/>Les mots de passe correspondent.</p>}
            </div>
          ))}

          {pwSaved
            ? <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-700"><Check size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0"/><p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Mot de passe mis à jour avec succès.</p></div>
            : <button onClick={handlePwSave} disabled={!canSave} className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${canSave?"bg-slate-900 hover:bg-slate-800 text-white shadow-sm dark:bg-blue-700 dark:hover:bg-blue-600":"bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500"}`}>
                <Shield size={15}/> Mettre à jour la sécurité
              </button>
          }

          {/* Règles */}
          <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Règles du mot de passe</p>
            <div className="space-y-1">
              {[
                {rule:"Minimum 8 caractères",         met:newPw.length>=8},
                {rule:"Au moins 1 majuscule",          met:/[A-Z]/.test(newPw)},
                {rule:"Au moins 1 chiffre",            met:/[0-9]/.test(newPw)},
                {rule:"Au moins 1 caractère spécial",  met:/[^A-Za-z0-9]/.test(newPw)},
              ].map(({rule,met})=>(
                <div key={rule} className="flex items-center gap-2 text-[11px]">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${met?"bg-emerald-500":"bg-slate-200 dark:bg-slate-600"}`}>
                    {met && <Check size={8} className="text-white"/>}
                  </span>
                  <span className={met?"text-emerald-600 dark:text-emerald-400 font-medium":"text-slate-400 dark:text-slate-500"}>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
