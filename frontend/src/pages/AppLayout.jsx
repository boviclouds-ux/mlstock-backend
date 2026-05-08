import { useState } from "react";
import { Package } from "lucide-react";
import TopHeader from "../components/TopHeader";
import BottomNav from "../components/BottomNav";
import ProfilDrawer from "../components/ProfilDrawer";
import DashboardDirection from "../components/DashboardDirection";

export default function AppLayout() {
  const [dark, setDark] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [showProfil, setShowProfil] = useState(false);
  const [notifCount] = useState(3);

  function handleNav(id) {
    if (id === "profil") { setShowProfil(true); return; }
    setActivePage(id);
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 font-sans">

        {/* Profile drawer overlay */}
        {showProfil && (
          <div className={dark ? "dark" : ""}>
            <ProfilDrawer
              dark={dark}
              onToggleDark={() => setDark((d) => !d)}
              onClose={() => setShowProfil(false)}
            />
          </div>
        )}

        {/* Fixed top bar */}
        <TopHeader
          dark={dark}
          onToggleDark={() => setDark((d) => !d)}
          notifCount={notifCount}
          onOpenProfil={() => setShowProfil(true)}
        />

        {/* Page content */}
        <main className="pt-14">
          {activePage === "dashboard" && <DashboardDirection />}

          {activePage === "operations" && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 pb-28 text-center">
              <div className="rounded-2xl border py-16 bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700 transition-colors">
                <Package size={40} className="mx-auto mb-3 text-slate-200 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Module Opérations</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
                  Sélectionnez une section depuis le menu
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Fixed bottom nav */}
        <BottomNav activePage={activePage} onNav={handleNav} />

        {/* Slide-up animation keyframe */}
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
