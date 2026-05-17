import { Home, Package, User } from "lucide-react";

const NAV = [
  { id: "dashboard",  label: "Accueil",    Icon: Home    },
  { id: "operations", label: "Opérations", Icon: Package },
  { id: "profil",     label: "Profil",     Icon: User    },
];

export default function BottomNav({ activePage, onNav }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 transition-colors"
      style={{ boxShadow: "0 -4px 6px -1px rgba(0,0,0,.07)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-stretch justify-around h-16">
          {NAV.map(({ id, label, Icon }) => {
            const active = activePage === id && id !== "profil";
            return (
              <button
                key={id}
                onClick={() => onNav(id)}
                className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors
                  ${active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  }`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${active ? "bg-blue-50 dark:bg-blue-900/50" : ""}`}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px] font-semibold leading-none">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
