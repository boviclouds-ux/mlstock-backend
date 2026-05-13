// Login.jsx — Portail d'Authentification MLStock
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Dna, AlertCircle, ChevronRight, ShieldCheck } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "https://mlstock-backend-3.onrender.com";

/* ─── Fond animé ────────────────────────────────────────── */
function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,.8) 1px,transparent 1px)," +
            "linear-gradient(90deg,rgba(148,163,184,.8) 1px,transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full bg-blue-700/15 blur-[140px]" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-violet-700/10 blur-[120px]" />
    </div>
  );
}

/* ─── Champ de formulaire ───────────────────────────────── */
const fieldCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white " +
  "placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 " +
  "focus:border-transparent transition-all";

/* ═══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════ */
export default function Login({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError("Veuillez renseigner l'email et le mot de passe."); return; }
    setError("");
    setLoading(true);

    try {
      const res  = await fetch(`${API_URL}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Identifiants incorrects.");
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <Background />

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo & Titre */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-900/50 mb-4">
            <Dna size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">MLStock</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Portail d'Authentification</p>
          <p className="text-slate-600 text-xs mt-0.5">Système Fédéral de Gestion Laitière</p>
        </div>

        {/* Carte formulaire */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl">

          <div className="mb-5">
            <h2 className="text-base font-bold text-white">Connexion</h2>
            <p className="text-slate-500 text-xs mt-0.5">Accès réservé aux utilisateurs habilités</p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5 mb-5">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400 leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="Email professionnel"
                autoComplete="email"
                className={`${fieldCls} pl-10`}
                disabled={loading}
              />
            </div>

            {/* Mot de passe */}
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="Mot de passe"
                autoComplete="current-password"
                className={`${fieldCls} pl-10 pr-10`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-3 mt-1 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-lg shadow-blue-900/30"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion en cours…
                </>
              ) : (
                <>Se connecter <ChevronRight size={14} /></>
              )}
            </button>
          </form>

          {/* Séparateur */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/8" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-900/80 px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                Comptes de démonstration
              </span>
            </div>
          </div>

          {/* Comptes démo */}
          <div className="space-y-1.5">
            {[
              { email:"admin@maroclait.ma",            role:"Admin Fédéral",     dot:"bg-violet-500" },
              { email:"magasinier@maroclait.ma",        role:"Magasinier",        dot:"bg-blue-500"   },
              { email:"contact@taroudant-coop.ma",     role:"Responsable Unité", dot:"bg-emerald-500"},
            ].map(u => (
              <button
                key={u.email}
                type="button"
                onClick={() => { setEmail(u.email); setPassword("123456"); setError(""); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-white/8 bg-white/3 hover:bg-white/6 transition-all text-left"
              >
                <span className={`w-2 h-2 rounded-full ${u.dot} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-300 leading-none">{u.role}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5 font-mono truncate">{u.email}</p>
                </div>
                <span className="text-[10px] text-slate-700 font-mono shrink-0">123456</span>
              </button>
            ))}
          </div>

          {/* Note MFA */}
          <div className="flex items-center gap-2 mt-4 px-2">
            <ShieldCheck size={11} className="text-slate-600 shrink-0" />
            <p className="text-[10px] text-slate-600 leading-snug">
              L'Admin Fédéral utilise une authentification renforcée en production.
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-4">
          MLstock v3.0 · © 2025 Maroc Lait · Accès réservé
        </p>
      </div>
    </div>
  );
}
