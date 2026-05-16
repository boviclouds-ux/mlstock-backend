import { useState } from "react";
import { X, Zap, ChevronDown, Plus, Trash2, Send, CheckCircle } from "lucide-react";
import { COOPERATIVES_LIST, ARTICLES_PUSH } from "../../constants/validationsData";

export default function NouvelOrdreModal({ onClose, onSubmit }) {
  const [dest,   setDest]   = useState(COOPERATIVES_LIST[0]);
  const [urgent, setUrgent] = useState(false);
  const [motif,  setMotif]  = useState("");
  const [lignes, setLignes] = useState([{ id: 1, article: ARTICLES_PUSH[0].label, unite: ARTICLES_PUSH[0].unite, qte: "" }]);
  const [done,   setDone]   = useState(false);

  const canSave = lignes.every((l) => Number(l.qte) > 0) && motif.trim() !== "";

  function addLigne()          { setLignes((p) => [...p, { id: Date.now(), article: ARTICLES_PUSH[0].label, unite: ARTICLES_PUSH[0].unite, qte: "" }]); }
  function removeLigne(id)     { setLignes((p) => p.filter((l) => l.id !== id)); }
  function updateLigne(id, field, val) {
    setLignes((p) => p.map((l) => {
      if (l.id !== id) return l;
      if (field === "article") { const f = ARTICLES_PUSH.find((a) => a.label === val); return { ...l, article: val, unite: f?.unite ?? l.unite }; }
      return { ...l, [field]: val };
    }));
  }

  function submit() {
    setDone(true);
    setTimeout(() => { onSubmit({ dest, urgent, motif, lignes }); onClose(); }, 900);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn .18s ease forwards" }}
      >
        <style>{`@keyframes modalIn{from{transform:scale(.96);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-violet-900 p-2 rounded-xl"><Zap size={16} className="text-yellow-400" /></div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Émission d'un Ordre Prioritaire</h2>
              <p className="text-xs text-gray-400 mt-0.5">Admin Fédéral · Push vers le magasin central</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Destination */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Destinataire</label>
            <div className="relative">
              <select
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 pr-8 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-gray-300 transition-colors cursor-pointer"
              >
                {COOPERATIVES_LIST.map((c) => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Articles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-800">Articles à expédier</label>
              <span className="text-xs text-gray-400">{lignes.length} ligne{lignes.length > 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2">
              {lignes.map((ligne) => (
                <div key={ligne.id} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={ligne.article}
                      onChange={(e) => updateLigne(ligne.id, "article", e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-7 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-gray-300 transition-colors cursor-pointer"
                    >
                      {ARTICLES_PUSH.map((a) => <option key={a.label}>{a.label}</option>)}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="flex items-center gap-1 w-28 shrink-0">
                    <input
                      type="number"
                      value={ligne.qte}
                      min={0}
                      onChange={(e) => updateLigne(ligne.id, "qte", e.target.value)}
                      placeholder="Qté"
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-right font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors"
                    />
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{ligne.unite}</span>
                  </div>
                  {lignes.length > 1 && (
                    <button onClick={() => removeLigne(ligne.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addLigne} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900 hover:bg-violet-50 px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={12} /> Ajouter une ligne
            </button>
          </div>

          {/* Motif */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Motif / Contexte <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex : Répartition suite à arrivage Alta Genetics…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors"
            />
          </div>

          {/* Urgent toggle */}
          <button
            onClick={() => setUrgent((u) => !u)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${urgent ? "border-violet-500 bg-violet-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${urgent ? "bg-violet-600 border-violet-600" : "border-gray-300"}`}>
              {urgent && <CheckCircle size={12} className="text-white" />}
            </div>
            <div>
              <p className={`text-sm font-semibold ${urgent ? "text-violet-800" : "text-gray-700"}`}>
                <Zap size={12} className={`inline mr-1 ${urgent ? "text-yellow-500" : "text-gray-400"}`} />
                Urgent / Prioritaire
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Le magasinier sera notifié en priorité absolue</p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-gray-100 shrink-0 flex gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={!canSave || done}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all
              ${done ? "bg-emerald-500 text-white" : canSave ? "bg-violet-700 hover:bg-violet-800 text-white shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
          >
            {done
              ? <><CheckCircle size={15} />Ordre transmis au magasin !</>
              : <><Send size={14} />Envoyer l'ordre au Magasin Central</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
