// App.jsx — IAM complet (Login, MFA, Register, ForgotPw) + Layout Sidebar + Routage par rôle
import { useState, useRef } from "react";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import EspaceCooperative    from './EspaceCooperative.jsx';
import MagasinierCentral    from './MagasinierCentral.jsx';
import CentreValidations    from './CentreValidations.jsx';
import DashboardDirection   from './DashboardDirection.jsx';
import TracabiliteRapports  from './TracabiliteRapports.jsx';
import PreparationsExpeditions from './PreparationsExpeditions.jsx';
import {
  Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft,
  User, Building2, AlertCircle, CheckCircle, Dna,
  RefreshCw, ChevronRight, LogOut, Home, Package,
  Truck, BarChart3, Settings, Shield, Moon, Sun,
  Bell, Key, Zap
} from "lucide-react";

/* ─── Comptes démo ─────────────────────────────────── */
const DEMO_USERS = {
  magasinier:  { nom:"Karim Benali",           email:"k.benali@marocl.ma",  role:"Magasinier Central",       unite:"Stock Central · Agadir",         initiales:"KB", couleur:"bg-blue-600",   mfa:false },
  cooperative: { nom:"Fatima Zahra El Alami",  email:"f.zahra@sah.ma",      role:"Responsable Coopérative",  unite:"Coopérative Sakia Al Hamra",     initiales:"FZ", couleur:"bg-emerald-600",mfa:false },
  admin:       { nom:"Hassan El Fassi",        email:"h.elfassi@marocl.ma", role:"Admin Fédéral",            unite:"Direction · Siège Rabat",        initiales:"HF", couleur:"bg-violet-600", mfa:true  },
};

const ROLE_NAV = {
  magasinier:  [
    { id:"quai",        path:"/quai",          label:"Quai d'arrivée",  icon:Package     },
    { id:"chambre",     path:"/chambre",        label:"Chambre Froide",  icon:Settings    },
    { id:"expeditions", path:"/expeditions",    label:"Expéditions",     icon:Truck       },
  ],
  cooperative: [
    { id:"portail",     path:"/cooperative",   label:"Mon Portail",     icon:Home        },
    { id:"receptions",  path:"/receptions",    label:"Réceptions",      icon:Package     },
    { id:"commandes",   path:"/commandes",     label:"Mes Commandes",   icon:BarChart3   },
  ],
  admin: [
    { id:"dashboard",   path:"/dashboard",     label:"Vue Nationale",   icon:Home        },
    { id:"quotas",      path:"/quotas",        label:"Quotas & Subv.",  icon:BarChart3   },
    { id:"validations", path:"/validations",   label:"Validations",     icon:ShieldCheck },
    { id:"tracabilite", path:"/tracabilite",   label:"Traçabilité",     icon:BarChart3   },
    { id:"config",      path:"/config",        label:"Configuration",   icon:Settings    },
  ],
};

/* ─── Fond Auth ────────────────────────────────────── */
function AuthBg() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage:"linear-gradient(rgba(148,163,184,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.6) 1px,transparent 1px)", backgroundSize:"40px 40px" }} />
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[100px]" />
    </div>
  );
}

const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

/* ══════════════════════════════════════════════════════
   ÉCRAN LOGIN
══════════════════════════════════════════════════════ */
function EcranLogin({ onLogin, onForgot, onRegister }) {
  const [email, setEmail]   = useState("");
  const [pw,    setPw]      = useState("");
  const [show,  setShow]    = useState(false);
  const [load,  setLoad]    = useState(false);
  const [err,   setErr]     = useState("");

  function demo(role) {
    setErr(""); setLoad(true);
    setTimeout(() => { setLoad(false); onLogin(role); }, 600);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <AuthBg />
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-900/50 mb-4">
            <Dna size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MLstock</h1>
          <p className="text-slate-400 text-sm mt-1">ERP Logistique · Réseau Laitier Maroc</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-1">Connexion</h2>
          <p className="text-slate-400 text-xs mb-5">Accès réservé aux utilisateurs habilités.</p>

          {err && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5 mb-4">
              <AlertCircle size={13} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{err}</p>
            </div>
          )}

          <div className="space-y-3 mb-4">
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email professionnel" className={`${inp} pl-10`} />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} placeholder="Mot de passe" className={`${inp} pl-10 pr-10`} />
              <button type="button" onClick={() => setShow(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {show ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
          </div>

          <button onClick={() => setErr("Utilisez les boutons démo ci-dessous.")} disabled={load}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 mb-4">
            {load ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Connexion…</> : <>Se connecter <ChevronRight size={14}/></>}
          </button>

          <div className="flex justify-between text-xs mb-5">
            <button onClick={onForgot} className="text-slate-400 hover:text-blue-400 transition-colors">Mot de passe oublié ?</button>
            <button onClick={onRegister} className="text-slate-400 hover:text-blue-400 transition-colors">Demander un accès →</button>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"/></div>
            <div className="relative flex justify-center"><span className="bg-slate-900/80 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Accès démo</span></div>
          </div>

          <div className="space-y-2">
            {[
              { role:"magasinier",  label:"Démo Magasinier",     sub:"Quai & Chambre froide",       cls:"bg-blue-600/10 border-blue-600/30 hover:bg-blue-600/20 text-blue-400",    dot:"bg-blue-500"    },
              { role:"cooperative", label:"Démo Coopérative",    sub:"Sakia Al Hamra",               cls:"bg-emerald-600/10 border-emerald-600/30 hover:bg-emerald-600/20 text-emerald-400",dot:"bg-emerald-500" },
              { role:"admin",       label:"Démo Admin Fédéral",  sub:"Accès sécurisé · MFA requis",  cls:"bg-violet-600/10 border-violet-600/30 hover:bg-violet-600/20 text-violet-400",  dot:"bg-violet-500"  },
            ].map(({ role, label, sub, cls, dot }) => (
              <button key={role} onClick={() => demo(role)} disabled={load}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all ${cls}`}>
                <span className={`w-2 h-2 rounded-full ${dot} shrink-0`}/>
                <div className="flex-1">
                  <p className="text-xs font-bold leading-none">{label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{sub}</p>
                </div>
                {role === "admin" && <Shield size={11} className="opacity-60 shrink-0"/>}
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-4">MLstock v2.4 · © 2025 Maroc Lait · Accès réservé</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ÉCRAN MOT DE PASSE OUBLIÉ
══════════════════════════════════════════════════════ */
function EcranForgot({ onBack }) {
  const [email, setEmail] = useState("");
  const [sent,  setSent]  = useState(false);
  const [load,  setLoad]  = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!email) return;
    setLoad(true);
    setTimeout(() => { setLoad(false); setSent(true); }, 1000);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <AuthBg />
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center"><Dna size={18} className="text-white"/></div>
          <span className="text-white font-bold text-lg">MLstock</span>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl">
          {!sent ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-blue-600/20 p-2 rounded-xl"><Key size={18} className="text-blue-400"/></div>
                <div>
                  <h2 className="text-base font-bold text-white">Réinitialisation</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Recevez un lien sécurisé par email</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Saisissez votre adresse email. Vous recevrez un lien valable <strong className="text-slate-300">15 minutes</strong>.
              </p>
              <form onSubmit={submit} className="space-y-3">
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre.email@marocl.ma" className={`${inp} pl-10`} required/>
                </div>
                <button type="submit" disabled={!email||load}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-40">
                  {load ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Envoi…</> : "Envoyer le lien"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-400"/>
              </div>
              <h2 className="text-base font-bold text-white mb-2">Email envoyé !</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lien envoyé à <strong className="text-slate-200">{email}</strong>. Vérifiez aussi les spams.
              </p>
            </div>
          )}
          <button onClick={onBack} className="w-full flex items-center justify-center gap-1.5 mt-5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft size={12}/> Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ÉCRAN DEMANDE D'ACCÈS
══════════════════════════════════════════════════════ */
function EcranRegister({ onBack }) {
  const [nom,   setNom]   = useState("");
  const [unite, setUnite] = useState("");
  const [email, setEmail] = useState("");
  const [sent,  setSent]  = useState(false);
  const [load,  setLoad]  = useState(false);

  const UNITES = ["","Magasin Central · Agadir","Direction · Siège Rabat","Coopérative Sakia Al Hamra",
    "Coopérative Aït Si Salem","Coopérative Tadla Azilal","Coopérative Gharb Chrarda",
    "Coopérative Chaouia Ouardigha","Coopérative Doukkala Abda"];

  function submit(e) {
    e.preventDefault();
    if (!nom||!unite||!email) return;
    setLoad(true);
    setTimeout(() => { setLoad(false); setSent(true); }, 1000);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <AuthBg />
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center"><Dna size={18} className="text-white"/></div>
          <span className="text-white font-bold text-lg">MLstock</span>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl">
          {!sent ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-emerald-600/20 p-2 rounded-xl"><User size={18} className="text-emerald-400"/></div>
                <div>
                  <h2 className="text-base font-bold text-white">Demande d'accès</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Soumis à la Direction IT</p>
                </div>
              </div>
              <form onSubmit={submit} className="space-y-3">
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                  <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom complet" className={`${inp} pl-10`} required/>
                </div>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10"/>
                  <select value={unite} onChange={e=>setUnite(e.target.value)} className={`${inp} pl-10 appearance-none cursor-pointer`} required>
                    {UNITES.map(u=><option key={u} value={u} className="bg-slate-800">{u||"— Sélectionner une unité —"}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email professionnel" className={`${inp} pl-10`} required/>
                </div>
                <button type="submit" disabled={!nom||!unite||!email||load}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-40">
                  {load ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Envoi…</> : "Soumettre la demande"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-400"/>
              </div>
              <h2 className="text-base font-bold text-white mb-3">Demande enregistrée</h2>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-left">
                <p className="text-xs text-emerald-300 leading-relaxed">
                  Votre demande d'accès au système MLstock a bien été soumise. Votre compte est <strong>en attente de validation</strong> par l'administration centrale. Vous recevrez un email sous 24–48h.
                </p>
              </div>
            </div>
          )}
          <button onClick={onBack} className="w-full flex items-center justify-center gap-1.5 mt-5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft size={12}/> Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ÉCRAN MFA (Admin Fédéral)
══════════════════════════════════════════════════════ */
function EcranMFA({ user, onSuccess, onBack }) {
  const [digits, setDigits] = useState(["","","","","",""]);
  const [err,    setErr]    = useState("");
  const [load,   setLoad]   = useState(false);
  const refs = [useRef(),useRef(),useRef(),useRef(),useRef(),useRef()];

  const code = digits.join("");

  function handleDigit(i, val) {
    const ch = val.replace(/\D/g,"").slice(-1);
    const next = [...digits]; next[i] = ch;
    setDigits(next); setErr("");
    if (ch && i < 5) refs[i+1].current?.focus();
    if (!ch && i > 0) refs[i-1].current?.focus();
  }

  function handleKey(i, e) {
    if (e.key==="Backspace"&&!digits[i]&&i>0) refs[i-1].current?.focus();
    if (e.key==="ArrowLeft"&&i>0) refs[i-1].current?.focus();
    if (e.key==="ArrowRight"&&i<5) refs[i+1].current?.focus();
  }

  function handlePaste(e) {
    const p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (p.length===6) { setDigits(p.split("")); refs[5].current?.focus(); }
  }

  function validate() {
    if (code.length<6) { setErr("Saisissez les 6 chiffres."); return; }
    setLoad(true);
    setTimeout(() => { setLoad(false); onSuccess(); }, 1000);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <AuthBg />
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center"><Dna size={18} className="text-white"/></div>
          <span className="text-white font-bold text-lg">MLstock</span>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <ShieldCheck size={32} className="text-violet-400"/>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-slate-900 flex items-center justify-center">
                <span className="text-[8px] font-black text-slate-900">!</span>
              </div>
            </div>
            <h2 className="text-lg font-bold text-white">Sécurité Renforcée</h2>
            <p className="text-xs text-slate-400 text-center mt-1.5 leading-relaxed max-w-[240px]">
              Bienvenue, <strong className="text-slate-200">{user.nom}</strong>. Saisissez le code OTP à 6 chiffres envoyé sur votre appareil.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-xl px-3 py-2 mb-5">
            <Shield size={12} className="text-violet-400 shrink-0"/>
            <p className="text-[10px] text-violet-300 font-medium">Admin Fédéral · Authentification à deux facteurs (2FA)</p>
          </div>

          <div className="flex gap-2 justify-center mb-2" onPaste={handlePaste}>
            {digits.map((d,i) => (
              <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e=>handleDigit(i,e.target.value)} onKeyDown={e=>handleKey(i,e)}
                className={`w-11 text-center text-xl font-bold rounded-xl border transition-all focus:outline-none focus:ring-2 py-3
                  ${d?"border-blue-500 bg-blue-500/10 text-white focus:ring-blue-500":"border-white/10 bg-white/5 text-white focus:ring-blue-500 focus:border-blue-500"}
                  ${err?"border-red-500/50":""}`}/>
            ))}
          </div>

          {err && (
            <div className="flex items-center gap-1.5 justify-center mt-2 mb-2">
              <AlertCircle size={11} className="text-red-400"/>
              <p className="text-[11px] text-red-400 font-medium">{err}</p>
            </div>
          )}
          <p className="text-center text-[10px] text-slate-500 mb-5">Entrez n'importe quels 6 chiffres (démo)</p>

          <button onClick={validate} disabled={code.length<6||load}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-40 shadow-lg shadow-violet-900/40">
            {load ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Vérification…</> : <><ShieldCheck size={15}/>Valider l'identité</>}
          </button>

          <div className="flex justify-between mt-4">
            <button onClick={() => { setDigits(["","","","","",""]); setErr(""); refs[0].current?.focus(); }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors">
              <RefreshCw size={11}/> Renvoyer
            </button>
            <button onClick={onBack} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors">
              <ArrowLeft size={11}/> Changer de compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   APP LAYOUT — SIDEBAR + ROUTAGE
══════════════════════════════════════════════════════ */
function AppLayout({ user, onLogout }) {
  const location   = useLocation();
  const [dark, setDark] = useState(false);
  const nav        = ROLE_NAV[user.key];
  const currentNav = nav.find(n => n.path === location.pathname) ?? nav[0];

  const ROLE_BADGE = {
    admin:       "bg-violet-600/20 text-violet-300 border-violet-700",
    cooperative: "bg-emerald-600/20 text-emerald-300 border-emerald-800",
    magasinier:  "bg-blue-600/20 text-blue-300 border-blue-800",
  };

  return (
    <div className={dark ? "dark" : ""}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 font-sans">

        {/* Sidebar — toujours sombre */}
        <aside className="w-64 h-screen bg-slate-900 flex flex-col fixed left-0 top-0 z-40 shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Dna size={18} className="text-white"/>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">MLstock</p>
              <p className="text-[10px] text-slate-500 mt-0.5">MLAPP · ERP Laitier</p>
            </div>
          </div>

          {/* Badge rôle */}
          <div className="px-5 py-3 border-b border-slate-800">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${ROLE_BADGE[user.key]}`}>
              <Shield size={9}/> {user.role}
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 pb-2">Navigation</p>
            {nav.map(({ id, path, label, icon:Icon }) => {
              const active = location.pathname === path;
              return (
                <Link key={id} to={path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                    ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
                  <Icon size={15} className={active ? "text-white" : "text-slate-500"}/>
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer sidebar */}
          <div className="px-3 pb-4 border-t border-slate-800 pt-3 space-y-0.5">
            <button onClick={() => setDark(d=>!d)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all">
              {dark ? <Sun size={15} className="text-amber-400"/> : <Moon size={15} className="text-slate-500"/>}
              <span className="text-sm font-medium">{dark ? "Mode clair" : "Mode sombre"}</span>
            </button>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60">
              <div className={`w-8 h-8 rounded-lg ${user.couleur} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                {user.initiales}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 leading-none truncate">{user.nom}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{user.unite}</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all">
              <LogOut size={15}/>
              <span className="text-sm font-medium">Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Contenu */}
        <main className="ml-64 flex-1 min-h-screen p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {/* En-tête page */}
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
                  {user.role} · {user.unite}
                </p>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {currentNav?.label}
                </h1>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"/>
                Session active
              </span>
            </div>

            {/* Routage des modules */}
            <Routes>
              <Route path="/"             element={<Navigate to="/cooperative" replace />} />
              <Route path="/cooperative"  element={<EspaceCooperative />} />
              <Route path="/receptions"   element={<EspaceCooperative />} />
              <Route path="/commandes"    element={<EspaceCooperative />} />
              <Route path="/quai"         element={<MagasinierCentral />} />
              <Route path="/chambre"      element={<MagasinierCentral />} />
              <Route path="/expeditions"  element={<PreparationsExpeditions />} />
              <Route path="/dashboard"    element={<DashboardDirection />} />
              <Route path="/quotas"       element={<DashboardDirection />} />
              <Route path="/validations"  element={<CentreValidations />} />
              <Route path="/tracabilite"  element={<TracabiliteRapports />} />
              <Route path="/config"       element={<DashboardDirection />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   APP ROOT — MOTEUR IAM
══════════════════════════════════════════════════════ */
export default function App() {
  const [vue,     setVue]     = useState("login");
  const [userKey, setUserKey] = useState(null);

  function handleLogin(roleKey) {
    if (DEMO_USERS[roleKey].mfa) { setUserKey(roleKey); setVue("mfa"); }
    else { setUserKey(roleKey); setVue("app"); }
  }

  function logout() { setUserKey(null); setVue("login"); }

  const user = userKey ? { ...DEMO_USERS[userKey], key: userKey } : null;

  if (vue==="login")    return <EcranLogin onLogin={handleLogin} onForgot={()=>setVue("forgot")} onRegister={()=>setVue("register")}/>;
  if (vue==="forgot")   return <EcranForgot onBack={()=>setVue("login")}/>;
  if (vue==="register") return <EcranRegister onBack={()=>setVue("login")}/>;
  if (vue==="mfa")      return <EcranMFA user={user} onSuccess={()=>setVue("app")} onBack={()=>setVue("login")}/>;
  if (vue==="app")      return <AppLayout user={user} onLogout={logout}/>;
  return null;
}
