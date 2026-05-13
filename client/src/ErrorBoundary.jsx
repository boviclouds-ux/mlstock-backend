import React from "react";
import { AlertTriangle, RefreshCw, Terminal } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetail: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] caught:", error.message, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, showDetail } = this.state;
    const code = `ERR_${Date.now().toString(36).toUpperCase()}`;

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">

          {/* Bande de statut */}
          <div className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-xs font-mono font-bold tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
            SYSTÈME — ERREUR CRITIQUE
          </div>

          <div className="p-8 text-center">
            {/* Icône */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border-2 border-red-100 mb-6">
              <AlertTriangle size={28} className="text-red-500" />
            </div>

            {/* Titre */}
            <h2 className="text-lg font-extrabold text-slate-900 mb-2 tracking-tight">
              Module hors service
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-xs mx-auto">
              Une erreur inattendue a interrompu le chargement de ce module.
              Rafraîchissez la page ou contactez le support.
            </p>

            {/* Code d'erreur */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg mb-6 font-mono text-xs text-slate-500 border border-slate-200">
              <Terminal size={12} />
              {code}
            </div>

            {/* Détail optionnel */}
            {error?.message && (
              <div className="mb-6 text-left">
                <button
                  onClick={() => this.setState(s => ({ showDetail: !s.showDetail }))}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
                >
                  {showDetail ? "Masquer" : "Voir"} le détail technique
                </button>
                {showDetail && (
                  <pre className="mt-2 p-3 bg-slate-950 text-red-400 text-xs rounded-xl font-mono leading-relaxed overflow-auto max-h-28 border border-slate-800">
                    {error.message}
                  </pre>
                )}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-sm font-bold rounded-xl transition-colors shadow-md"
            >
              <RefreshCw size={14} />
              Rafraîchir la page
            </button>
          </div>

          {/* Pied de page */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-mono">
              MLstock · Si le problème persiste, contactez votre administrateur
            </p>
          </div>
        </div>
      </div>
    );
  }
}
