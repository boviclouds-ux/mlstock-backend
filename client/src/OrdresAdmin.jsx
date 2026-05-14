// OrdresAdmin.jsx — Ordres Push Administration Centrale · Section 4
import { useState, useEffect } from "react";
import { api } from "./lib/api";
import {
  Zap, Send, ShieldAlert, Plus, X,
  Dna, FlaskConical, Wrench, HeartPulse,
  ChevronDown, CheckCircle, Clock, Building2, FileText,
  AlertTriangle,
} from "lucide-react";

/* ─── Motifs statiques ──────────────────────────────── */
const MOTIFS = [
  "Campagne de vaccination",
  "Dotation exceptionnelle",
  "Urgence sanitaire",
  "Réapprovisionnement préventif",
  "Compensation dotation annuelle",
  "Autre",
];


/* ─── Adaptateurs API ───────────────────────────────── */
const CAT_TO_TYPE = { Semences:"semence", Azote:"azote", "Santé":"sante", "Santé Animale":"sante" };

function fromApiArticle(a) {
  return {
    _id:   a._id,
    label: a.designation,
    unite: a.uniteMesure ?? "unités",
    type:  CAT_TO_TYPE[a.categorie] ?? "materiel",
  };
}

function fromApiOrdre(t) {
  return {
    _id:        t._id,
    id:         t.reference,
    date:       (t.createdAt ?? new Date().toISOString()).slice(0, 10),
    uniteCible: t.uniteCible?.nom ?? "—",
    motif:      t.motif ?? "",
    articles:   (t.lignes ?? []).map(l => ({
      label: l.article?.designation ?? "—",
      qte:   l.quantite,
      unite: l.article?.uniteMesure ?? "—",
      type:  CAT_TO_TYPE[l.article?.categorie] ?? "materiel",
    })),
    statut: t.statut,
  };
}

/* ─── Helpers ───────────────────────────────────────── */
function typeIcon(type, sz = 11) {
  if (type === "semence") return <Dna         size={sz} className="text-blue-400  shrink-0" />;
  if (type === "azote")   return <FlaskConical size={sz} className="text-cyan-400  shrink-0" />;
  if (type === "sante")   return <HeartPulse   size={sz} className="text-rose-400  shrink-0" />;
  return                         <Wrench       size={sz} className="text-slate-400 shrink-0" />;
}

/* Mapping DB statut → badge (clés = valeurs Mongoose enum) */
const STATUT_UI = {
  "Validé":      { label:"En attente Magasinier", bg:"bg-amber-50",   text:"text-amber-700",   dot:"bg-amber-500"   },
  "Expédié":     { label:"Expédié",               bg:"bg-blue-50",    text:"text-blue-700",    dot:"bg-blue-500"    },
  "Réceptionné": { label:"Réceptionné",           bg:"bg-emerald-50", text:"text-emerald-700", dot:"bg-emerald-500" },
  "En attente":  { label:"En attente",            bg:"bg-gray-50",    text:"text-gray-500",    dot:"bg-gray-400"    },
};

function StatutBadge({ statut }) {
  const m = STATUT_UI[statut] ?? { label:statut, bg:"bg-gray-50", text:"text-gray-500", dot:"bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/* ─── Styles formulaire ─────────────────────────────── */
const lbl = "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";
const sel = "w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none";

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function OrdresAdmin() {

  /* ─ Données API ───────────────────────────────────── */
  const [unites,      setUnites]      = useState([]);
  const [catalogue,   setCatalogue]   = useState([]);
  const [ordres,      setOrdres]      = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [apiError,    setApiError]    = useState(null);

  /* ─ Formulaire ────────────────────────────────────── */
  const [uniteCible, setUniteCible] = useState("");   // MongoDB _id
  const [motif,      setMotif]      = useState("");
  const [lignes,     setLignes]     = useState([]);
  const [ligneIdx,   setLigneIdx]   = useState(2);
  const [otpCode,    setOtpCode]    = useState("");

  /* ─ Feedback ──────────────────────────────────────── */
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [submitErr,  setSubmitErr]  = useState(null);

  /* ─── Chargement initial ────────────────────────── */
  useEffect(() => {
    Promise.all([
      api.get("/api/unites?limit=200"),
      api.get("/api/articles?limit=200"),
      api.get("/api/transactions?type=ORDRE_ADMIN&limit=100"),
    ])
      .then(([unitesRes, articlesRes, ordresRes]) => {
        const u = Array.isArray(unitesRes)   ? unitesRes   : (unitesRes.data   ?? []);
        const a = Array.isArray(articlesRes) ? articlesRes : (articlesRes.data ?? []);
        const o = Array.isArray(ordresRes)   ? ordresRes   : (ordresRes.data   ?? []);

        setUnites(u);

        const cat = a.filter(x => x.actif !== false).map(fromApiArticle);
        setCatalogue(cat);
        if (cat.length > 0)
          setLignes([{ _key:1, articleId:cat[0]._id, label:cat[0].label, unite:cat[0].unite, type:cat[0].type, qte:"" }]);

        setOrdres(o.map(fromApiOrdre));
      })
      .catch(err => setApiError(err.message))
      .finally(() => setLoadingData(false));
  }, []);

  /* ─── Validation ────────────────────────────────── */
  const formValid =
    uniteCible &&
    motif &&
    lignes.length > 0 &&
    lignes.every(l => l.articleId && Number(l.qte) > 0) &&
    otpCode.length === 6;

  /* ─── Gestion des lignes ────────────────────────── */
  function addLigne() {
    const first = catalogue[0];
    setLignes(p => [...p, { _key:ligneIdx, articleId:first?._id??"", label:first?.label??"", unite:first?.unite??"", type:first?.type??"materiel", qte:"" }]);
    setLigneIdx(p => p + 1);
  }
  function removeLigne(key) { setLignes(p => p.filter(l => l._key !== key)); }
  function updateLigne(key, field, value) {
    if (field === "articleId") {
      const art = catalogue.find(a => a._id === value);
      setLignes(p => p.map(l => l._key === key
        ? { ...l, articleId:value, label:art?.label??"", unite:art?.unite??"", type:art?.type??"materiel" }
        : l));
    } else {
      setLignes(p => p.map(l => l._key === key ? { ...l, [field]:value } : l));
    }
  }

  /* ─── Soumission ────────────────────────────────── */
  async function handleSubmit() {
    if (!formValid || submitting) return;
    setSubmitting(true);
    setSubmitErr(null);

    const payload = {
      type:       "ORDRE_ADMIN",
      statut:     "Validé",
      motif,
      uniteCible,
      lignes: lignes.map(l => ({ article: l.articleId, quantite: Number(l.qte) })),
    };

    try {
      const created = await api.post("/api/transactions", payload);
      setOrdres(p => [fromApiOrdre(created), ...p]);

      // Reset formulaire
      const first = catalogue[0];
      setUniteCible(""); setMotif(""); setOtpCode("");
      setLignes([{ _key:ligneIdx, articleId:first?._id??"", label:first?.label??"", unite:first?.unite??"", type:first?.type??"materiel", qte:"" }]);
      setLigneIdx(p => p + 1);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("[OrdresAdmin] handleSubmit:", err);
      setSubmitErr(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  /* ════════════════════════════════════════════════════
     RENDU
  ════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* ── En-tête ─────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-5 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Zap size={17} className="text-purple-400" />
            </div>
            <div>
              <p className="text-base font-bold leading-none">Ordres Admin</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Flux push · Administration Centrale → Unités</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/25 px-3 py-1.5 rounded-full shrink-0">
            <Zap size={10} /> Autorisation Direction
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label:"Total émis",   val:ordres.length,                                             col:"text-purple-300" },
            { label:"En attente",   val:ordres.filter(o => o.statut === "Validé").length,          col:"text-amber-300"  },
            { label:"Expédiés",     val:ordres.filter(o => o.statut === "Expédié").length,         col:"text-blue-300"   },
            { label:"Réceptionnés", val:ordres.filter(o => o.statut === "Réceptionné").length,     col:"text-emerald-300"},
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl px-3 py-2 text-center">
              <p className={`text-xl font-bold tabular-nums ${s.col}`}>{s.val}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Toast succès ─────────────────────────────── */}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-5 py-3"
          style={{ animation:"fadeIn .2s ease" }}>
          <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-300">Ordre Admin enregistré en base</p>
            <p className="text-xs text-emerald-400/70 mt-0.5">Le Magasinier Central a été notifié — l'ordre apparaît dans son tableau de bord.</p>
          </div>
        </div>
      )}

      {/* ── Erreur soumission ────────────────────────── */}
      {submitErr && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-3">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-300">Erreur lors de la soumission</p>
            <p className="text-xs text-red-400/70 mt-0.5 truncate">{submitErr}</p>
          </div>
          <button onClick={() => setSubmitErr(null)} className="text-red-400 hover:text-red-300 shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* ── Erreur chargement référentiels ───────────── */}
      {apiError && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-3">
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300 flex-1">Référentiels non disponibles · {apiError}</p>
          <button onClick={() => setApiError(null)} className="text-amber-400 hover:text-amber-300 shrink-0"><X size={13} /></button>
        </div>
      )}

      {/* ══ FORMULAIRE ══════════════════════════════════ */}
      <div className="rounded-2xl bg-slate-800 border border-slate-700 p-6 space-y-5">

        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-purple-500 shrink-0" />
          <p className="text-sm font-bold text-white">Création d'un Ordre Admin</p>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center gap-2.5 py-10">
            <span className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-400 rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Chargement des référentiels…</span>
          </div>
        ) : (
          <>
            {/* Unité cible + Motif */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Unité destinataire <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select value={uniteCible} onChange={e => setUniteCible(e.target.value)} className={sel}>
                    <option value="" className="bg-slate-900">— Sélectionner une unité —</option>
                    {unites.map(u => (
                      <option key={u._id} value={u._id} className="bg-slate-900">{u.nom}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={lbl}>Motif de l'opération <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select value={motif} onChange={e => setMotif(e.target.value)} className={sel}>
                    <option value="" className="bg-slate-900">— Sélectionner le motif —</option>
                    {MOTIFS.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Lignes d'articles */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className={`${lbl} mb-0`}>Articles à expédier <span className="text-red-400">*</span></label>
                <button
                  onClick={addLigne}
                  disabled={catalogue.length === 0}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 hover:border-purple-400/40 px-2.5 py-1 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={11} /> Ajouter une ligne
                </button>
              </div>

              <div className="space-y-2">
                {lignes.map(ligne => (
                  <div key={ligne._key}
                    className="grid grid-cols-[2fr_0.7fr_0.5fr_auto] gap-3 items-center bg-slate-900 border border-slate-600 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {typeIcon(ligne.type ?? "materiel", 13)}
                      <select
                        value={ligne.articleId}
                        onChange={e => updateLigne(ligne._key, "articleId", e.target.value)}
                        className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none cursor-pointer min-w-0"
                      >
                        {catalogue.map(c => (
                          <option key={c._id} value={c._id} className="bg-slate-900">{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="number" min="1"
                      value={ligne.qte}
                      onChange={e => updateLigne(ligne._key, "qte", e.target.value)}
                      placeholder="Qté"
                      className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                    />
                    <span className="text-xs text-slate-500 font-mono text-center">{ligne.unite ?? "—"}</span>
                    {lignes.length > 1
                      ? <button onClick={() => removeLigne(ligne._key)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-all">
                          <X size={12} />
                        </button>
                      : <span className="w-6 h-6" />}
                  </div>
                ))}
              </div>
            </div>

            {/* OTP + bouton Valider */}
            <div className="border-t border-slate-700 pt-5">
              <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
                <div>
                  <label className={lbl}>
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert size={11} className="text-purple-400" />
                      Code OTP d'autorisation Admin <span className="text-red-400">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    className={`${sel} text-center tracking-[0.5em] text-lg font-mono placeholder:tracking-normal placeholder:text-slate-600`}
                  />
                  <p className="mt-1.5 text-[10px] text-slate-500">
                    Mode Démo : Saisissez <span className="font-mono font-bold text-slate-400">123456</span> pour valider
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!formValid || submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-purple-900/30 transition-all whitespace-nowrap"
                >
                  {submitting
                    ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</>
                    : <><Send size={14} /> Valider l'Ordre</>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ══ HISTORIQUE ══════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">

        <div className="flex items-center gap-3 px-5 py-3.5 bg-slate-50 border-b border-slate-100">
          <Zap size={14} className="text-purple-500" />
          <p className="text-xs font-bold text-slate-700">Historique des Ordres Admin émis</p>
          <span className="ml-auto text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
            {ordres.length} ordre{ordres.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_0.7fr_1.4fr_1.2fr_1fr_1fr] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
          {["Réf Ordre","Date","Unité Cible","Motif","Articles","Statut"].map(h => (
            <p key={h} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        <div className="divide-y divide-slate-50">
          {!loadingData && ordres.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm font-semibold text-slate-500">Aucun ordre émis pour le moment.</p>
              <p className="text-xs text-slate-400 mt-1">Les ordres créés via le formulaire apparaîtront ici.</p>
            </div>
          )}
          {ordres.map(ordre => (
            <div key={ordre.id}
              className="grid grid-cols-[1fr_0.7fr_1.4fr_1.2fr_1fr_1fr] gap-3 items-center px-5 py-3.5 hover:bg-slate-50/60 transition-colors">

              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Zap size={10} className="text-purple-500 shrink-0" />
                  <p className="text-xs font-bold font-mono text-slate-800">{ordre.id}</p>
                </div>
                <span className="text-[9px] font-bold bg-purple-50 text-purple-600 border border-purple-200 px-1.5 py-0.5 rounded-full">
                  ⚡ Ordre Admin
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock size={10} className="text-slate-400 shrink-0" />
                {new Date(ordre.date).toLocaleDateString("fr-FR", { day:"2-digit", month:"short" })}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-700 min-w-0">
                <Building2 size={11} className="text-slate-400 shrink-0" />
                <span className="truncate">{ordre.uniteCible}</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-0">
                <FileText size={10} className="text-slate-400 shrink-0" />
                <span className="truncate">{ordre.motif}</span>
              </div>

              <div className="space-y-0.5">
                {ordre.articles.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {typeIcon(a.type ?? "materiel", 10)}
                    <span className="text-[10px] text-slate-500 truncate">{a.label}</span>
                    <span className="text-[10px] font-mono text-slate-400 ml-auto shrink-0">
                      {Number(a.qte).toLocaleString()} {a.unite}
                    </span>
                  </div>
                ))}
              </div>

              <StatutBadge statut={ordre.statut} />
            </div>
          ))}
        </div>

        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            {ordres.length} ordre{ordres.length > 1 ? "s" : ""} émis ·{" "}
            <span className="text-purple-600 font-medium">
              {ordres.filter(o => o.statut === "Validé").length} en attente de traitement
            </span>
          </p>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            {loadingData ? "Synchronisation…" : apiError ? "Données locales" : "API MongoDB"}
          </p>
        </div>
      </div>
    </div>
  );
}
