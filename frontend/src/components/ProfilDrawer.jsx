import { useState } from "react";
import { Shield, Moon, Sun, LogOut, Key, X, CheckCircle } from "lucide-react";
import { USER } from "../constants/dashboardData";

const inp = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
  border-slate-200 bg-white text-slate-800 placeholder:text-slate-300
  dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500`;

export default function ProfilDrawer({ dark, onToggleDark, onClose }) {
  const [showPw, setShowPw] = useState(false);
  const [oldPw,  setOldPw]  = useState("");
  const [newPw,  setNewPw]  = useState("");
  const [pwDone, setPwDone] = useState(false);

  function handlePw() {
    if (!oldPw || !newPw) return;
    setPwDone(true);
    setTimeout(() => {
      setPwDone(false);
      setShowPw(false);
      setOldPw("");
      setNewPw("");
    }, 1800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl
          bg-white dark:bg-slate-800 transition-colors"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUp .22s cubic-bezier(.32,0,.67,0) forwards" }}
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <span className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-600" />
        </div>

        {/* Header gradient */}
        <div className="relative px-6 pt-5 pb-6 bg-gradient-to-br from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0">
              {USER.initiales}
            </div>
            <div>
              <p className="text-white font-bold text-base">{USER.nom}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full mt-1">
                <Shield size={9} /> {USER.role}
              </span>
              <p className="text-slate-400 text-xs mt-1">{USER.email}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-2">
          {[
            { label: "Région / Poste",       value: USER.region   },
            { label: "Dernière connexion",    value: USER.dernConn },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-400">{label}</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{value}</span>
            </div>
          ))}

          {/* Dark mode toggle */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-500" />}
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {dark ? "Mode clair" : "Mode sombre"}
                </p>
                <p className="text-[10px] text-slate-400">
                  {dark ? "Passer en thème clair" : "Passer en thème sombre"}
                </p>
              </div>
            </div>
            <button
              onClick={onToggleDark}
              aria-label="Toggle dark mode"
              className={`relative inline-flex h-6 w-11 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                ${dark ? "bg-blue-600 border-blue-600" : "bg-slate-200 border-slate-200"}`}
            >
              <span
                className={`inline-block w-4 h-4 rounded-full bg-white shadow transition-transform mt-0.5
                  ${dark ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </div>

          {/* Password */}
          {!showPw ? (
            <button
              onClick={() => setShowPw(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all
                border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Key size={14} className="text-slate-400" /> Changer mon mot de passe
            </button>
          ) : pwDone ? (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl border
              bg-emerald-50 border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-700">
              <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Mot de passe mis à jour !
              </span>
            </div>
          ) : (
            <div className="space-y-2 p-3 rounded-xl border bg-slate-50 border-slate-100 dark:bg-slate-700/50 dark:border-slate-600">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Changer le mot de passe
              </p>
              <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)}
                placeholder="Mot de passe actuel" className={inp} />
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                placeholder="Nouveau mot de passe" className={inp} />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setShowPw(false); setOldPw(""); setNewPw(""); }}
                  className="px-3 py-1.5 text-xs border rounded-lg transition-colors border-slate-200 text-slate-500 hover:bg-white dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handlePw}
                  disabled={!oldPw || !newPw}
                  className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}

          {/* Logout */}
          <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors
            text-red-600 hover:bg-red-50 border border-red-100
            dark:text-red-400 dark:hover:bg-red-900/30 dark:border-red-900">
            <LogOut size={14} /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
