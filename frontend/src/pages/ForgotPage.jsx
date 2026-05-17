import { useState } from "react";
import { Link } from "react-router-dom";
import { Dna, Key, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import AuthBg from "../components/AuthBg";
import { inp } from "../constants/demoData";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [load, setLoad] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!email) return;
    setLoad(true);
    setTimeout(() => {
      setLoad(false);
      setSent(true);
    }, 1000);
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
          {!sent ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-blue-600/20 p-2 rounded-xl">
                  <Key size={18} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Réinitialisation</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Recevez un lien sécurisé par email</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Saisissez votre adresse email. Vous recevrez un lien valable{" "}
                <strong className="text-slate-300">15 minutes</strong>.
              </p>
              <form onSubmit={submit} className="space-y-3">
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@marocl.ma"
                    className={`${inp} pl-10`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!email || load}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-40"
                >
                  {load ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi…
                    </>
                  ) : (
                    "Envoyer le lien"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-base font-bold text-white mb-2">Email envoyé !</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lien envoyé à <strong className="text-slate-200">{email}</strong>. Vérifiez aussi les
                spams.
              </p>
            </div>
          )}

          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-1.5 mt-5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={12} /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
