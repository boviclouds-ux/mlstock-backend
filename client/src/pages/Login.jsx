// Login.jsx — Portail BOVICLOUDS · Glassmorphism Premium
import logoImg from '../assets/logo.png';
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Globe } from "lucide-react";
import { api } from "../lib/api";

/* ─── Fond liquide — bleus profonds, aqua, touches d'or ──── */
function LiquidBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Couche de base — navy très profond */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #030C18 0%, #04162A 40%, #062840 70%, #030C18 100%)' }}
      />

      {/* Blob aqua principal — halo central */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.22) 0%, transparent 68%)', filter: 'blur(50px)' }}
      />

      {/* Blob teal — gauche */}
      <div
        className="absolute top-1/4 -left-40 w-[550px] h-[500px]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(15,167,155,0.20) 0%, transparent 65%)', filter: 'blur(70px)' }}
      />

      {/* Blob aqua — droite centre */}
      <div
        className="absolute top-1/2 -right-24 w-[450px] h-[400px]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(8,145,178,0.18) 0%, transparent 65%)', filter: 'blur(65px)' }}
      />

      {/* Touche d'or — bas gauche */}
      <div
        className="absolute -bottom-16 left-1/3 w-[400px] h-[280px]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(200,130,20,0.13) 0%, transparent 65%)', filter: 'blur(60px)' }}
      />

      {/* Reflet lumineux fin — haut */}
      <div
        className="absolute -top-24 right-1/3 w-[300px] h-[250px]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.12) 0%, transparent 70%)', filter: 'blur(45px)' }}
      />
    </div>
  );
}

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
      const data = await api.post("/api/auth/login", { email: email.trim().toLowerCase(), password });
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message || "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full bg-white/7 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white " +
    "placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 " +
    "focus:border-cyan-400/35 focus:bg-white/10 transition-all";

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4"
      style={{ background: '#030C18' }}
    >
      <LiquidBackground />

      {/* ── Sélecteur langue — haut droite ──────────────── */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-1.5 bg-white/8 border border-white/12 rounded-full px-3 py-1.5 hover:bg-white/12 transition-all cursor-pointer">
        <Globe size={13} className="text-white/60" />
        <span className="text-[11px] font-semibold text-white/60 tracking-wider">FR</span>
      </div>

      {/* ── Carte principale ─────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[400px]">

        {/* Bordure lumineuse dégradée */}
        <div
          className="rounded-3xl p-px shadow-2xl"
          style={{
            background: 'linear-gradient(150deg, rgba(255,255,255,0.30) 0%, rgba(6,182,212,0.20) 45%, rgba(255,255,255,0.06) 100%)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.55), 0 0 40px rgba(6,182,212,0.08)',
          }}
        >
          {/* Verre intérieur */}
          <div
            className="rounded-3xl px-8 pt-8 pb-7"
            style={{
              background: 'linear-gradient(150deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
            }}
          >

            {/* ── Logo + Marque ──────────────────────────── */}
            <div className="flex flex-col items-center mb-7">
              {/* Logo sur fond blanc pour lisibilité */}
              <div className="mb-5 bg-white/92 rounded-2xl px-4 py-2.5 shadow-xl shadow-black/30">
                <img src={logoImg} alt="ML STOCK" className="h-9 w-auto object-contain" />
              </div>

              {/* Nom de l'application */}
              <h1
                className="text-[28px] font-black text-white leading-none tracking-[0.22em] uppercase"
                style={{ textShadow: '0 0 30px rgba(6,182,212,0.35)' }}
              >
                BOVICLOUDS
              </h1>

              {/* Slogan */}
              <p className="text-[12px] font-light text-white/50 tracking-[0.18em] mt-2.5 uppercase">
                Piloter. Tracer. Performer.
              </p>
            </div>

            {/* ── Erreur ────────────────────────────────── */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/12 border border-red-400/22 rounded-xl px-3 py-2.5 mb-4">
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 leading-snug">{error}</p>
              </div>
            )}

            {/* ── Formulaire ────────────────────────────── */}
            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Email */}
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="Adresse e-mail"
                  autoComplete="email"
                  className={`${inputCls} pl-10`}
                  disabled={loading}
                />
              </div>

              {/* Mot de passe */}
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="Mot de passe"
                  autoComplete="current-password"
                  className={`${inputCls} pl-10 pr-10`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/65 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Bouton Se Connecter */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 rounded-xl text-sm font-bold text-[#03101F] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(90deg, #06B6D4 0%, #0DC8E8 55%, #22D3EE 100%)',
                  boxShadow: '0 8px 24px rgba(6,182,212,0.35), 0 2px 8px rgba(0,0,0,0.20)',
                }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#03101F]/25 border-t-[#03101F] rounded-full animate-spin" />
                    Connexion en cours…
                  </>
                ) : (
                  'Se Connecter'
                )}
              </button>
            </form>

            {/* ── Séparateur ────────────────────────────── */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 border-t border-white/10" />
              <span className="text-[10px] font-semibold text-white/28 uppercase tracking-widest whitespace-nowrap">
                Accès rapide démo
              </span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            {/* ── Comptes démo ──────────────────────────── */}
            <div className="space-y-1.5">
              {[
                { email:"admin@maroclait.ma",           role:"Admin Fédéral",     dot:"bg-violet-400" },
                { email:"magasinier@maroclait.ma",       role:"Magasinier",        dot:"bg-cyan-400"   },
                { email:"contact@taroudant-coop.ma",    role:"Responsable Unité", dot:"bg-emerald-400"},
              ].map(u => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => { setEmail(u.email); setPassword("123456"); setError(""); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-white/8 bg-white/3 hover:bg-white/7 transition-all text-left"
                >
                  <span className={`w-2 h-2 rounded-full ${u.dot} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-white/65 leading-none">{u.role}</p>
                    <p className="text-[10px] text-white/30 mt-0.5 font-mono truncate">{u.email}</p>
                  </div>
                  <span className="text-[10px] text-white/22 font-mono shrink-0">123456</span>
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* ── Pied de page ──────────────────────────────── */}
        <p className="text-center text-[10px] text-white/18 mt-5 tracking-wide">
          MLstock v1.0 · © 2026 Maroc Lait · Powered by Go Branding
        </p>
      </div>
    </div>
  );
}
