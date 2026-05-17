import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dna, Shield, ChevronRight, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import AuthBg from "../components/AuthBg";
import { DEMO_USERS } from "../constants/demoData";
import { inp } from "../constants/demoData";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [load, setLoad] = useState(false);
  const [err, setErr] = useState("");

  function demo(role) {
    setErr("");
    setLoad(true);
    setTimeout(() => {
      setLoad(false);
      login(role);
      if (DEMO_USERS[role].mfa) {
        navigate("/mfa");
      } else {
        navigate("/app");
      }
    }, 600);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <AuthBg />
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
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
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email professionnel"
                className={`${inp} pl-10`}
              />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Mot de passe"
                className={`${inp} pl-10 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            onClick={() => setErr("Utilisez les boutons démo ci-dessous.")}
            disabled={load}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 mb-4"
          >
            {load ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connexion…
              </>
            ) : (
              <>Se connecter <ChevronRight size={14} /></>
            )}
          </button>

          <div className="flex justify-between text-xs mb-5">
            <Link to="/forgot" className="text-slate-400 hover:text-blue-400 transition-colors">
              Mot de passe oublié ?
            </Link>
            <Link to="/register" className="text-slate-400 hover:text-blue-400 transition-colors">
              Demander un accès →
            </Link>
          </div>

          {/* Separator */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-900/80 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Accès démo
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {[
              {
                role: "magasinier",
                label: "Démo Magasinier",
                sub: "Quai & Chambre froide",
                cls: "bg-blue-600/10 border-blue-600/30 hover:bg-blue-600/20 text-blue-400",
                dot: "bg-blue-500",
              },
              {
                role: "cooperative",
                label: "Démo Coopérative",
                sub: "Sakia Al Hamra",
                cls: "bg-emerald-600/10 border-emerald-600/30 hover:bg-emerald-600/20 text-emerald-400",
                dot: "bg-emerald-500",
              },
              {
                role: "admin",
                label: "Démo Admin Fédéral",
                sub: "Accès sécurisé · MFA requis",
                cls: "bg-violet-600/10 border-violet-600/30 hover:bg-violet-600/20 text-violet-400",
                dot: "bg-violet-500",
              },
            ].map(({ role, label, sub, cls, dot }) => (
              <button
                key={role}
                onClick={() => demo(role)}
                disabled={load}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all ${cls}`}
              >
                <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                <div className="flex-1">
                  <p className="text-xs font-bold leading-none">{label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{sub}</p>
                </div>
                {role === "admin" && <Shield size={11} className="opacity-60 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-4">
          MLstock v2.4 · © 2025 Maroc Lait · Accès réservé
        </p>
      </div>
    </div>
  );
}
