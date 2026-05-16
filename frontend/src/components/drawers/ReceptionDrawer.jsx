import { useState } from "react";
import { X, ClipboardCheck, AlertTriangle, FileText, XCircle, CheckCircle } from "lucide-react";

export default function ReceptionDrawer({ req, onClose, onDecision }) {
  const [dec, setDec] = useState(null);
  const r      = req.rapport;
  const hasAno = req.conformite === "anomalie";

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
                <div className={`p-1.5 rounded-lg ${hasAno ? "bg-amber-100" : "bg-blue-100"}`}>
                  <ClipboardCheck size={14} className={hasAno ? "text-amber-600" : "text-blue-600"} />
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${hasAno ? "text-amber-600" : "text-blue-600"}`}>
                  Rapport de Conformité · Réception
                </span>
              </div>
              <h2 className="text-base font-semibold text-gray-900">{req.origine}</h2>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{req.id} · Commande #{r.cmdRef}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {hasAno && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-0.5">Anomalie détectée</p>
                <p className="text-xs text-amber-700 leading-relaxed">{r.remarque}</p>
              </div>
            </div>
          )}

          {/* Quantities grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Prévu", value: r.prevu, cls: "bg-gray-50 border-gray-100 text-gray-900" },
              { label: "Reçu",  value: r.recu,  cls: r.recu < r.prevu ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-emerald-50 border-emerald-100 text-emerald-600" },
              { label: "Écart", value: r.recu < r.prevu ? `−${r.prevu - r.recu}` : "0", cls: r.recu < r.prevu ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-600" },
            ].map(({ label, value, cls }) => (
              <div key={label} className={`rounded-xl border p-3 text-center ${cls}`}>
                <p className="text-[10px] text-gray-400 mb-1">{label}</p>
                <p className="text-xl font-bold">{value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">doses</p>
              </div>
            ))}
          </div>

          {/* Magasinier report */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <FileText size={13} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">Rapport du magasinier</span>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: "Référence commande", value: `#${r.cmdRef}` },
                { label: "Magasinier",         value: r.magasinier   },
                { label: "Température",        value: r.temperature, warn: r.temperature?.includes("⚠") },
                { label: "Remarque",           value: r.remarque     },
              ].map(({ label, value, warn }) => (
                <div key={label} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <span className="text-xs font-medium text-gray-400 shrink-0">{label}</span>
                  <span className={`text-xs font-medium text-right leading-relaxed ${warn ? "text-amber-600" : "text-gray-700"}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 flex flex-col sm:flex-row gap-2">
          {hasAno ? (
            <>
              <button
                onClick={() => decide("refuse")}
                disabled={!!dec}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg border transition-all
                  ${dec === "refuse" ? "bg-gray-200 text-gray-400" : "border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"}`}
              >
                <XCircle size={15} />{dec === "refuse" ? "Lot rejeté" : "Rejeter le lot"}
              </button>
              <button
                onClick={() => decide("approuve")}
                disabled={!!dec}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all
                  ${dec === "approuve" ? "bg-amber-500 text-white" : "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"}`}
              >
                <CheckCircle size={15} />
                {dec === "approuve" ? `Intégration ${r.recu} doses ✓` : `Valider avec réserve (${r.recu} doses)`}
              </button>
            </>
          ) : (
            <button
              onClick={() => decide("approuve")}
              disabled={!!dec}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all
                ${dec === "approuve" ? "bg-emerald-500 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"}`}
            >
              <CheckCircle size={15} />
              {dec === "approuve" ? `Intégration ${r.recu} doses ✓` : "Valider & intégrer au stock"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
