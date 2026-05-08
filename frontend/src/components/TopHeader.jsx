import { Dna, Moon, Sun, Bell } from "lucide-react";
import { USER } from "../constants/dashboardData";

export default function TopHeader({ dark, onToggleDark, notifCount, onOpenProfil }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-700 flex items-center justify-center">
              <Dna size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">MLstock</p>
              <p className="text-[10px] text-slate-400">MLAPP · ERP Laitier</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Dark mode toggle */}
            <button
              onClick={onToggleDark}
              className="p-2 rounded-xl transition-colors text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl transition-colors text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700">
              <Bell size={17} />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {notifCount}
                </span>
              )}
            </button>

            {/* User avatar / profile */}
            <button
              onClick={onOpenProfil}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {USER.initiales}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-none">{USER.nom}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{USER.role}</p>
              </div>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
