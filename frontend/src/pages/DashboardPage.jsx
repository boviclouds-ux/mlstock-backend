import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Dna, Shield, LogOut, Moon, Sun,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROLE_NAV } from "../constants/demoData";

const ROLE_BADGE = {
  admin: "bg-violet-600/20 text-violet-300 border-violet-700",
  cooperative: "bg-emerald-600/20 text-emerald-300 border-emerald-800",
  magasinier: "bg-blue-600/20 text-blue-300 border-blue-800",
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { module } = useParams();

  const [dark, setDark] = useState(false);

  if (!user) {
    navigate("/login");
    return null;
  }

  const nav = ROLE_NAV[user.key];
  const activeId = module || nav[0].id;
  const activeItem = nav.find((n) => n.id === activeId) || nav[0];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 font-sans">
        {/* ── Sidebar ── */}
        <aside className="w-64 h-screen bg-slate-900 flex flex-col fixed left-0 top-0 z-40 shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Dna size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">MLstock</p>
              <p className="text-[10px] text-slate-500 mt-0.5">MLAPP · ERP Laitier</p>
            </div>
          </div>

          {/* Role badge */}
          <div className="px-5 py-3 border-b border-slate-800">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${ROLE_BADGE[user.key]}`}
            >
              <Shield size={9} /> {user.role}
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 pb-2">
              Navigation
            </p>
            {nav.map(({ id, label, icon: Icon }) => {
              const active = activeId === id;
              return (
                <Link
                  key={id}
                  to={`/app/${id}`}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                    ${active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                >
                  <Icon size={15} className={active ? "text-white" : "text-slate-500"} />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="px-3 pb-4 border-t border-slate-800 pt-3 space-y-0.5">
            <button
              onClick={() => setDark((d) => !d)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
            >
              {dark ? (
                <Sun size={15} className="text-amber-400" />
              ) : (
                <Moon size={15} className="text-slate-500" />
              )}
              <span className="text-sm font-medium">{dark ? "Mode clair" : "Mode sombre"}</span>
            </button>

            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60">
              <div
                className={`w-8 h-8 rounded-lg ${user.couleur} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}
              >
                {user.initiales}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 leading-none truncate">
                  {user.nom}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{user.unite}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
            >
              <LogOut size={15} />
              <span className="text-sm font-medium">Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="ml-64 flex-1 min-h-screen p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {/* Page header */}
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
                  {user.role} · {user.unite}
                </p>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeItem.label}
                </h1>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Session active
              </span>
            </div>

            {/* Module placeholder */}
            <div className="rounded-2xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 p-10 text-center transition-colors shadow-sm">
              <activeItem.icon size={32} className="text-blue-400 mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                Module actif : {activeItem.label}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                Dans la version finale, ce slot affiche le composant React correspondant importé
                depuis son fichier dédié.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-xl mx-auto">
                {[
                  {
                    role: "Magasinier",
                    comp: "MagasinierCentral.jsx",
                    cls: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20",
                  },
                  {
                    role: "Coopérative",
                    comp: "EspaceCooperative.jsx",
                    cls: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20",
                  },
                  {
                    role: "Admin",
                    comp: "CentreValidations.jsx",
                    cls: "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20",
                  },
                ].map(({ role, comp, cls }) => (
                  <div key={role} className={`rounded-xl border px-4 py-3 ${cls}`}>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                      {role}
                    </p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 font-mono">
                      {comp}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
