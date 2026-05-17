import { useState } from "react";
import { Link } from "react-router-dom";
import { Dna, User, Building2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import AuthBg from "../components/AuthBg";
import { inp } from "../constants/demoData";

const UNITES = [
  "",
  "Magasin Central · Agadir",
  "Direction · Siège Rabat",
  "Coopérative Sakia Al Hamra",
  "Coopérative Aït Si Salem",
  "Coopérative Tadla Azilal",
  "Coopérative Gharb Chrarda",
  "Coopérative Chaouia Ouardigha",
  "Coopérative Doukkala Abda",
];

export default function RegisterPage() {
  const [nom, setNom] = useState("");
  const [unite, setUnite] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [load, setLoad] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!nom || !unite || !email) return;
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
                <div className="bg-emerald-600/20 p-2 rounded-xl">
                  <User size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Demande d'accès</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Soumis à la Direction IT</p>
                </div>
              </div>
              <form onSubmit={submit} className="space-y-3">
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Nom complet"
                    className={`${inp} pl-10`}
                    required
                  />
                </div>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" />
                  <select
                    value={unite}
                    onChange={(e) => setUnite(e.target.value)}
                    className={`${inp} pl-10 appearance-none cursor-pointer`}
                    required
                  >
                    {UNITES.map((u) => (
                      <option key={u} value={u} className="bg-slate-800">
                        {u || "— Sélectionner une unité —"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email professionnel"
                    className={`${inp} pl-10`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!nom || !unite || !email || load}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-40"
                >
                  {load ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi…
                    </>
                  ) : (
                    "Soumettre la demande"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-base font-bold text-white mb-3">Demande enregistrée</h2>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-left">
                <p className="text-xs text-emerald-300 leading-relaxed">
                  Votre demande d'accès au système MLstock a bien été soumise. Votre compte est{" "}
                  <strong>en attente de validation</strong> par l'administration centrale. Vous
                  recevrez un email sous 24–48h.
                </p>
              </div>
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
