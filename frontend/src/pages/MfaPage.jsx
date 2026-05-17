import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dna, ShieldCheck, Shield, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import AuthBg from "../components/AuthBg";
import { useAuth } from "../context/AuthContext";

export default function MfaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [err, setErr] = useState("");
  const [load, setLoad] = useState(false);

  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const code = digits.join("");

  function handleDigit(i, val) {
    const ch = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    setErr("");
    if (ch && i < 5) refs[i + 1].current?.focus();
    if (!ch && i > 0) refs[i - 1].current?.focus();
  }

  function handleKey(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs[i - 1].current?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs[i - 1].current?.focus();
    if (e.key === "ArrowRight" && i < 5) refs[i + 1].current?.focus();
  }

  function handlePaste(e) {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (p.length === 6) {
      setDigits(p.split(""));
      refs[5].current?.focus();
    }
  }

  function validate() {
    if (code.length < 6) {
      setErr("Saisissez les 6 chiffres.");
      return;
    }
    setLoad(true);
    setTimeout(() => {
      setLoad(false);
      navigate("/app");
    }, 1000);
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <AuthBg />
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Dna size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">MLstock</span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <ShieldCheck size={32} className="text-violet-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-slate-900 flex items-center justify-center">
                <span className="text-[8px] font-black text-slate-900">!</span>
              </div>
            </div>
            <h2 className="text-lg font-bold text-white">Sécurité Renforcée</h2>
            <p className="text-xs text-slate-400 text-center mt-1.5 leading-relaxed max-w-[240px]">
              Bienvenue, <strong className="text-slate-200">{user.nom}</strong>. Saisissez le code
              OTP à 6 chiffres envoyé sur votre appareil.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-xl px-3 py-2 mb-5">
            <Shield size={12} className="text-violet-400 shrink-0" />
            <p className="text-[10px] text-violet-300 font-medium">
              Admin Fédéral · Authentification à deux facteurs (2FA)
            </p>
          </div>

          <div className="flex gap-2 justify-center mb-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={refs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKey(i, e)}
                className={`w-11 text-center text-xl font-bold rounded-xl border transition-all focus:outline-none focus:ring-2 py-3
                  ${d ? "border-blue-500 bg-blue-500/10 text-white focus:ring-blue-500" : "border-white/10 bg-white/5 text-white focus:ring-blue-500 focus:border-blue-500"}
                  ${err ? "border-red-500/50" : ""}`}
              />
            ))}
          </div>

          {err && (
            <div className="flex items-center gap-1.5 justify-center mt-2 mb-2">
              <AlertCircle size={11} className="text-red-400" />
              <p className="text-[11px] text-red-400 font-medium">{err}</p>
            </div>
          )}
          <p className="text-center text-[10px] text-slate-500 mb-5">
            Entrez n'importe quels 6 chiffres (démo)
          </p>

          <button
            onClick={validate}
            disabled={code.length < 6 || load}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-40 shadow-lg shadow-violet-900/40"
          >
            {load ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Vérification…
              </>
            ) : (
              <>
                <ShieldCheck size={15} />
                Valider l'identité
              </>
            )}
          </button>

          <div className="flex justify-between mt-4">
            <button
              onClick={() => {
                setDigits(["", "", "", "", "", ""]);
                setErr("");
                refs[0].current?.focus();
              }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw size={11} /> Renvoyer
            </button>
            <Link
              to="/login"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft size={11} /> Changer de compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
