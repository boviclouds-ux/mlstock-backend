import { useState } from "react";
import { X, ShieldAlert, History, AlertTriangle, XCircle, CheckCircle } from "lucide-react";

export default function DerogationDrawer({ req, onClose, onDecision }) {
  const [dec, setDec] = useState(null);
  const pct = Math.round((req.consomme / req.quota) * 100);

  function decide(d) {
    setDec(d);
    setTimeout(() => { onDecision(req.id, d); onClose(); }, 900);
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className="relative ml-auto z-50 h-full w-full sm:max-w-xl bg-white shadow-2xl flex flex-col"
        style={{ animation: "drawerIn .2s cubic-bezier(.32,0,.67,0) forwards" }}
      >
        <style>{`@keyframes drawerIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div className="px-5 pt-6 pb-5 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="bg-red-100 p-1.5 rounded-lg"><ShieldAlert size={14} className="text-red-600" /></div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Dérogation Quota · Arbitrage</span>
              </div>
              <h2 className="text-base font-semibold text-gray-900">{req.unite}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{req.id} · {req.date}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Alert */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-800 mb-1">Quota 100% consommé</p>
            <p className="text-xs text-red-700 leading-relaxed">
              <strong>{req.unite}</strong> a consommé {req.consomme} doses sur quota {req.quota}.
              Demande exceptionnelle de <strong>{req.quantite} doses supplémentaires</strong>.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Quota alloué",    value: req.quota,           cls: "bg-gray-50 border-gray-100 text-gray-900"    },
              { label: "Consommé",        value: req.consomme,        cls: "bg-red-50 border-red-100 text-red-600"       },
              { label: "Demande except.", value: `+${req.quantite}`,  cls: "bg-amber-50 border-amber-100 text-amber-600" },
            ].map(({ label, value, cls }) => (
              <div key={label} className={`rounded-xl border p-3 text-center ${cls}`}>
                <p className="text-[10px] text-gray-400 mb-1">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-700">Taux de consommation</span>
              <span className="text-xs font-bold text-red-600">{pct}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>

          {/* Derogation history */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={14} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">Historique des dérogations</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${req.totalDerogations >= 3 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                {req.totalDerogations} ce mois
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {req.historique.map((h, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs font-medium text-gray-600">{h.mois}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{h.derogations} demande{h.derogations > 1 ? "s" : ""}</span>
                    <span className={`text-xs font-semibold ${h.accordees === h.derogations ? "text-emerald-600" : h.accordees > 0 ? "text-amber-600" : "text-gray-400"}`}>
                      {h.accordees} accordée{h.accordees > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {req.totalDerogations >= 3 && (
              <div className="px-4 py-2.5 bg-red-50 border-t border-red-100 flex items-start gap-2">
                <AlertTriangle size={12} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700">
                  Seuil de vigilance atteint : <strong>{req.totalDerogations} dérogations</strong>. Un refus est recommandé.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => decide("refuse")}
            disabled={!!dec}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg border transition-all
              ${dec === "refuse" ? "bg-gray-200 text-gray-400" : "border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"}`}
          >
            <XCircle size={15} />{dec === "refuse" ? "Refus enregistré" : "Refuser la dérogation"}
          </button>
          <button
            onClick={() => decide("approuve")}
            disabled={!!dec}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all
              ${dec === "approuve" ? "bg-emerald-500 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"}`}
          >
            <CheckCircle size={15} />{dec === "approuve" ? "Dérogation accordée ✓" : "Accorder la dérogation"}
          </button>
        </div>
      </div>
    </div>
  );
}
