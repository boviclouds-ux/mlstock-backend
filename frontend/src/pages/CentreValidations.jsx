import { useState } from "react";
import {
  Clock, CheckCircle, X, XCircle, Inbox, Package,
  AlertTriangle, ChevronDown, Eye, Calendar,
  User, ShieldAlert, Zap, ClipboardCheck, Truck, Filter,
} from "lucide-react";

import DerogationDrawer  from "../components/drawers/DerogationDrawer";
import ReceptionDrawer   from "../components/drawers/ReceptionDrawer";
import NouvelOrdreModal  from "../components/modals/NouvelOrdreModal";
import PinWidget         from "../components/PinWidget";
import { REQUETES_INIT, CONF_COLOR, typeMeta } from "../constants/validationsData";

export default function CentreValidations() {
  const [requetes,   setRequetes]   = useState(REQUETES_INIT);
  const [drawerDero, setDrawerDero] = useState(null);
  const [drawerRec,  setDrawerRec]  = useState(null);
  const [showOrdre,  setShowOrdre]  = useState(false);
  const [flashId,    setFlashId]    = useState(null);
  const [filterType, setFilterType] = useState("tous");
  const [ordresEmis, setOrdresEmis] = useState([]);

  const stats = {
    receptions:   requetes.filter((r) => r.type === "reception"   && r.statut === "en_attente").length,
    expeditions:  requetes.filter((r) => r.type === "expedition"  && r.statut === "en_attente").length,
    depassements: requetes.filter((r) => r.type === "depassement" && r.statut === "en_attente").length,
  };

  function handleDecision(id, dec) { setRequetes((p) => p.map((r) => r.id === id ? { ...r, statut: dec } : r)); flash(id); }
  function handleQuick(id, dec)    { flash(id); setTimeout(() => setRequetes((p) => p.map((r) => r.id === id ? { ...r, statut: dec } : r)), 500); }
  function flash(id)               { setFlashId(id); setTimeout(() => setFlashId(null), 800); }
  function handleNouvelOrdre(data) {
    setOrdresEmis((p) => [{
      id: `ORD-2025-${String(p.length + 42).padStart(4, "0")}`,
      dest: data.dest, urgent: data.urgent, motif: data.motif, lignes: data.lignes,
      statut: "transmis",
      date: new Date().toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    }, ...p]);
  }

  const filtered = filterType === "tous" ? requetes : requetes.filter((r) => r.type === filterType);
  const pending  = filtered.filter((r) => r.statut === "en_attente");
  const resolved = filtered.filter((r) => r.statut !== "en_attente");

  return (
    <div className="space-y-6">
      {/* Overlays */}
      {drawerDero && <DerogationDrawer req={drawerDero} onClose={() => setDrawerDero(null)} onDecision={handleDecision} />}
      {drawerRec  && <ReceptionDrawer  req={drawerRec}  onClose={() => setDrawerRec(null)}  onDecision={handleDecision} />}
      {showOrdre  && <NouvelOrdreModal onClose={() => setShowOrdre(false)} onSubmit={handleNouvelOrdre} />}

      {/* Page header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Centre de Validations & Sécurité</h1>
            <p className="text-sm text-gray-500 mt-0.5">Approbation des flux physiques et arbitrage des dérogations</p>
          </div>
          <div className="flex items-start gap-3 shrink-0">
            <button
              onClick={() => setShowOrdre(true)}
              className="flex items-center gap-2 bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap"
            >
              <Zap size={14} className="text-yellow-400" /> Nouvel Ordre de Répartition
            </button>
            <PinWidget />
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Réceptions à valider",    value: stats.receptions,   icon: Inbox,      bg: "bg-blue-50",   iconColor: "text-blue-600",   border: "border-blue-100",   onClick: () => setFilterType("reception"),   active: filterType === "reception"   },
          { label: "Expéditions en attente",  value: stats.expeditions,  icon: Package,    bg: "bg-indigo-50", iconColor: "text-indigo-600", border: "border-indigo-100", onClick: () => setFilterType("expedition"),  active: filterType === "expedition"  },
          { label: "Dépassements Quota",      value: stats.depassements, icon: ShieldAlert, bg: "bg-red-50",   iconColor: "text-red-600",    border: "border-red-100",    onClick: () => setFilterType("depassement"), active: filterType === "depassement" },
        ].map(({ label, value, icon: Icon, bg, iconColor, border, onClick, active }) => (
          <button
            key={label}
            onClick={onClick}
            className={`bg-white rounded-xl border p-4 flex items-center gap-4 text-left transition-all hover:shadow-sm ${active ? "border-blue-300 ring-1 ring-blue-200" : border + " hover:border-gray-200"}`}
          >
            <div className={`${bg} p-2.5 rounded-xl shrink-0`}><Icon size={20} className={iconColor} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 truncate">{label}</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
            </div>
            {active && <X size={14} className="text-blue-500 shrink-0" onClick={(e) => { e.stopPropagation(); setFilterType("tous"); }} />}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} className="text-gray-400 shrink-0" />
        {[
          { id: "tous",        label: "Toutes"       },
          { id: "reception",   label: "Réceptions"   },
          { id: "expedition",  label: "Expéditions"  },
          { id: "depassement", label: "Dépassements" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilterType(id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors
              ${filterType === id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">
          {pending.length} en attente · {resolved.length} traitée{resolved.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Requests table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {pending.length > 0 ? (
          <div className="overflow-x-auto"><div className="min-w-[780px]">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {["ID Requête", "Type", "Origine / Demandeur", "Détail", "État & Conformité", "Date / Heure", "Statut", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pending.map((req) => {
                  const isCrit = req.priorite === "critique";
                  const m = typeMeta(req.type);
                  return (
                    <tr
                      key={req.id}
                      style={flashId === req.id ? { animation: "rowFlash .6s ease" } : {}}
                      className={`transition-colors ${isCrit ? "bg-red-50/20 hover:bg-red-50/40" : "hover:bg-gray-50/60"}`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {isCrit && <AlertTriangle size={11} className="text-red-500 shrink-0" />}
                          <span className="text-xs font-mono font-semibold text-gray-600">{req.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${m.bg} ${m.text} ${m.border}`}>
                          <m.icon size={10} />{m.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {req.type === "reception" ? <Truck size={11} className="text-blue-300 shrink-0" /> : <User size={11} className="text-gray-300 shrink-0" />}
                          <div>
                            <span className="text-xs text-gray-700 block">{req.origine ?? req.demandeur}</span>
                            {req.pays && <span className="text-[10px] text-gray-400">{req.pays}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-[180px]"><p className="text-xs text-gray-700 truncate">{req.detail}</p></td>
                      <td className="px-4 py-3.5">
                        {req.conformite
                          ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CONF_COLOR[req.conformite]}`}>
                              {req.conformite === "conforme" ? "✅ Conforme" : "⚠️ Anomalie"}
                            </span>
                          : <span className="text-[10px] text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-xs text-gray-400"><Calendar size={11} />{req.date}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={10} />En attente Admin
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {req.type === "depassement" && (
                            <button onClick={() => setDrawerDero(req)} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors whitespace-nowrap">
                              <Eye size={11} /> Arbitrer
                            </button>
                          )}
                          {req.type === "reception" && (
                            <button
                              onClick={() => setDrawerRec(req)}
                              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap
                                ${req.conformite === "anomalie" ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                            >
                              <ClipboardCheck size={11} />{req.conformite === "anomalie" ? "Voir rapport" : "Valider"}
                            </button>
                          )}
                          {req.type === "expedition" && (
                            <button onClick={() => handleQuick(req.id, "approuve")} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap">
                              <CheckCircle size={11} /> Approuver
                            </button>
                          )}
                          <button onClick={() => handleQuick(req.id, "refuse")} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all whitespace-nowrap">
                            <XCircle size={11} /> Refuser
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="bg-emerald-50 rounded-full p-4 mb-3"><CheckCircle size={28} className="text-emerald-500" /></div>
            <p className="text-sm font-semibold text-gray-700">File d'attente vide</p>
            <p className="text-xs text-gray-400 mt-1">Toutes les requêtes ont été traitées.</p>
          </div>
        )}

        {/* Resolved rows (collapsible) */}
        {resolved.length > 0 && (
          <details className="border-t border-gray-100">
            <summary className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-400 cursor-pointer hover:bg-gray-50 select-none list-none">
              <ChevronDown size={13} />
              {resolved.length} requête{resolved.length > 1 ? "s" : ""} traitée{resolved.length > 1 ? "s" : ""}
            </summary>
            <div className="overflow-x-auto"><div className="min-w-[780px]">
              <table className="w-full"><tbody className="divide-y divide-gray-50">
                {resolved.map((req) => {
                  const m = typeMeta(req.type);
                  return (
                    <tr key={req.id} className="bg-gray-50/40 opacity-70">
                      <td className="px-4 py-3"><span className="text-xs font-mono text-gray-400">{req.id}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m.bg} ${m.text} ${m.border}`}><m.icon size={9} />{m.label}</span></td>
                      <td className="px-4 py-3 max-w-[200px]"><p className="text-xs text-gray-400 truncate">{req.detail}</p></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${req.statut === "approuve" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                          {req.statut === "approuve" ? <><CheckCircle size={9} />Approuvé</> : <><XCircle size={9} />Refusé</>}
                        </span>
                      </td>
                      <td className="px-4 py-3" colSpan={4} />
                    </tr>
                  );
                })}
              </tbody></table>
            </div></div>
          </details>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Flux actif · {requetes.length} requêtes au total
          </div>
        </div>
      </div>

      {/* Emitted orders */}
      {ordresEmis.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Zap size={14} className="text-yellow-500" />
            <h2 className="text-sm font-bold text-gray-800">Ordres de Répartition Émis</h2>
            <span className="ml-auto text-xs text-gray-400">{ordresEmis.length} ordre{ordresEmis.length > 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {ordresEmis.map((o) => (
              <div key={o.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-semibold text-gray-600">
                    {o.id}
                    {o.urgent && (
                      <span className="ml-2 text-[10px] font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-full">
                        <Zap size={8} className="inline" /> Urgent
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{o.dest} · {o.motif}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse" /> Transmis au Magasin
                </span>
                <span className="text-[10px] text-gray-400">{o.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes rowFlash{0%,100%{background:transparent}50%{background:#d1fae5}}`}</style>
    </div>
  );
}
