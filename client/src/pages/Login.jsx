// Login.jsx — MLstock · Split-screen design
import logoImg from '../assets/logo.png';
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { api } from "../lib/api";

/* ═══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════ */
export default function Login({ onLogin }) {
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [rememberMe, setRememberMe] = useState(false);

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

  const underlineInput =
    "w-full border-0 border-b border-gray-200 py-2.5 pr-8 text-sm text-gray-800 " +
    "placeholder:text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors bg-transparent";

  return (
    <div className="min-h-screen flex">

      {/* ── PANNEAU GAUCHE : Formulaire ─────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-14 lg:px-16 xl:px-24 bg-white min-h-screen pt-14 pb-10">

        {/* Logo — centré, légèrement agrandi */}
        <div className="mb-10 flex justify-center">
          <img src={logoImg} alt="MLstock" className="h-14 w-auto object-contain" />
        </div>

        {/* Titre */}
        <h1 className="text-[2rem] font-bold text-gray-900 leading-tight mb-2">
          Bienvenue sur MLstock.
        </h1>
        <p className="text-sm text-gray-400 mb-10">Entrez vos informations pour continuer</p>

        {/* Bandeau erreur */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-6">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 leading-snug">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">

          {/* E-mail */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">E-mail</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="jean.dupont@example.com"
                autoComplete="email"
                disabled={loading}
                className={underlineInput}
              />
              <Mail size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Mot de passe</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="Saisissez votre mot de passe…"
                autoComplete="current-password"
                disabled={loading}
                className={underlineInput}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Lock size={16} />}
              </button>
            </div>
          </div>

          {/* Se souvenir de moi + Mot de passe oublié */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => setRememberMe(v => !v)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  rememberMe ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 bg-white'
                }`}
              >
                {rememberMe && <span className="w-2 h-2 bg-white rounded-full" />}
              </button>
              <span className="text-sm text-gray-600">Se souvenir de moi</span>
            </label>
            <button type="button" className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors">
              Mot de passe oublié ?
            </button>
          </div>

          {/* Se connecter + S'inscrire */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion…
                </>
              ) : 'Se connecter'}
            </button>
            <button
              type="button"
              className="flex-1 py-3 rounded-full text-sm font-semibold text-gray-400 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              S'inscrire
            </button>
          </div>
        </form>

        {/* ── Accès démo rapide ─────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <p className="text-[10px] uppercase tracking-widest text-gray-300 mb-3">Accès démo rapide</p>
          <div className="space-y-1.5">
            {[
              { email: "admin@maroclait.ma",        role: "Admin Fédéral",     dot: "bg-violet-400" },
              { email: "magasinier@maroclait.ma",   role: "Magasinier",        dot: "bg-indigo-400" },
              { email: "contact@taroudant-coop.ma", role: "Responsable Unité", dot: "bg-emerald-400" },
            ].map(u => (
              <button
                key={u.email}
                type="button"
                onClick={() => { setEmail(u.email); setPassword("123456"); setError(""); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all text-left"
              >
                <span className={`w-2 h-2 rounded-full ${u.dot} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-gray-600 leading-none">{u.role}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-mono truncate">{u.email}</p>
                </div>
                <span className="text-[10px] text-gray-300 font-mono shrink-0">123456</span>
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] text-gray-200 mt-6">
            MLstock v1.0 · © 2026 Maroc Lait · Powered by Go Branding
          </p>
        </div>
      </div>

      {/* ── PANNEAU DROIT : Photo entrepôt ──────────────── */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        {/* Photo Unsplash — entrepôt logistique */}
        <img
          src="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1400&q=80"
          alt="Gestion de stock et logistique"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Voile indigo pour maintenir la charte graphique */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.72) 0%, rgba(99,102,241,0.60) 60%, rgba(67,56,202,0.75) 100%)' }}
        />
        {/* Texte de marque superposé */}
        <div className="absolute bottom-10 left-10 right-10 z-10">
          <p className="text-white/90 text-2xl font-bold leading-snug">
            Piloter. Tracer.<br />Performer.
          </p>
          <p className="text-white/50 text-sm mt-2">
            Gestion de stock intelligente pour les coopératives laitières.
          </p>
        </div>
      </div>

    </div>
  );
}
