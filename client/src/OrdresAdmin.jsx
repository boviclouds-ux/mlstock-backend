// OrdresAdmin.jsx — Ordres Push Administration Centrale · Section 4
import { useState, useEffect, useMemo } from "react";
import { api } from "./lib/api";
import DataGridV2 from './components/DataGridV2';
import { NouvelleCommandeModal } from './EspaceCooperative.jsx';
import {
  Zap, Send, ShieldAlert, Plus, X,
  Dna, FlaskConical, Wrench, HeartPulse,
  ChevronDown, CheckCircle, Clock, Building2, FileText,
  AlertTriangle, ArrowRightLeft,
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
    motif:           t.motif ?? "",
    adminValidateur: t.initiatedBy
      ? (`${t.initiatedBy.prenom ?? ''} ${t.initiatedBy.nom ?? ''}`).trim() || '—'
      : '—',
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

/* Mapping DB statut V2 → badge */
const STATUT_UI = {
  "Brouillon":              { label:"Brouillon",            bg:"bg-gray-50",    text:"text-gray-500",    dot:"bg-gray-400"    },
  "Demandée":               { label:"En attente",           bg:"bg-gray-50",    text:"text-gray-500",    dot:"bg-gray-400"    },
  "Validée_BE":             { label:"Prêt à expédier",      bg:"bg-amber-50",   text:"text-amber-700",   dot:"bg-amber-500"   },
  "Partiellement_Livrée":  { label:"Livraison en cours",   bg:"bg-blue-50",    text:"text-blue-700",    dot:"bg-blue-500"    },
  "Totalement_Livrée":     { label:"Totalement livré",     bg:"bg-indigo-50",  text:"text-indigo-700",  dot:"bg-indigo-500"  },
  "Réceptionnée_Cloturée": { label:"Réceptionné ✓",        bg:"bg-emerald-50", text:"text-emerald-700", dot:"bg-emerald-500" },
  "Rejeté":                { label:"Rejeté",               bg:"bg-red-50",     text:"text-red-700",     dot:"bg-red-500"     },
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
const sel = "w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none";

/* ─── Impression Bon d'Enlèvement ───────────────────── */
function imprimerBE(ordre) {
  const date = new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const lignesHtml = (ordre.articles ?? []).map((a, i) => `
    <tr>
      <td style="width:32px;text-align:center;color:#94a3b8">${i + 1}</td>
      <td><strong>${a.label}</strong></td>
      <td style="text-align:right;font-weight:700">${Number(a.qte ?? 0).toLocaleString()}</td>
      <td>${a.unite ?? '—'}</td>
    </tr>`).join('');
  const totalQte = (ordre.articles ?? []).reduce((s, a) => s + Number(a.qte ?? 0), 0);
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>BE-${ordre.id}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#1a1a1a;padding:15mm 18mm}.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:3px solid #4f46e5;margin-bottom:20px}.logo{font-size:26px;font-weight:900;color:#1e293b;letter-spacing:-1px}.logo span{color:#2563eb}.logo-sub{font-size:10px;color:#64748b;margin-top:3px}.doc-tag{font-size:9px;font-weight:700;letter-spacing:2px;color:#64748b;text-transform:uppercase;text-align:right}.doc-title{font-size:22px;font-weight:900;color:#4f46e5;text-align:right;margin:2px 0}.doc-ref{font-size:11px;color:#64748b;text-align:right;font-family:monospace}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}.mbox{border:1px solid #e2e8f0;border-radius:8px;padding:12px}.mbox h4{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px}.mbox p{line-height:1.65}.motif-box{background:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:12px;margin-bottom:20px}.motif-box h4{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#7c3aed;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-bottom:22px;font-size:11px}thead tr{background:#4f46e5;color:#fff}thead th{padding:9px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:1px;font-weight:700}tbody tr:nth-child(even){background:#f8fafc}tbody td{padding:8px 10px;border-bottom:1px solid #f1f5f9}.tot{background:#4f46e5!important;color:#fff!important;font-weight:700}.tot td{color:#fff!important}.sig{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:22px}.sbox{border:1px solid #e2e8f0;border-radius:8px;padding:14px;min-height:90px}.sbox h4{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:3px}.sline{border-top:1px solid #cbd5e1;margin-top:52px}.ftr{margin-top:18px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;display:flex;justify-content:space-between}@media print{body{padding:8mm 10mm}}</style></head>
<body>
<div class="hdr"><div><div class="logo">ML<span>APP</span></div><div class="logo-sub">Gestion du Stock de Semences Bovines</div></div><div><div class="doc-tag">Document officiel · Administration Centrale</div><div class="doc-title">BON D'ENLÈVEMENT</div><div class="doc-ref">${ordre.id} &nbsp;·&nbsp; ${ordre.date ?? date}</div></div></div>
<div class="meta"><div class="mbox"><h4>Émetteur</h4><p><strong>MLAPP — Administration Centrale</strong></p><p style="font-size:11px;color:#64748b">Ordre de sortie de stock autorisé</p></div><div class="mbox"><h4>Unité Destinataire</h4><p><strong>${ordre.uniteCible ?? '—'}</strong></p></div><div class="mbox"><h4>Date d'émission</h4><p><strong>${ordre.date ?? '—'}</strong></p></div><div class="mbox"><h4>Statut</h4><p><strong>${ordre.statut ?? '—'}</strong></p></div></div>
<div class="motif-box"><h4>⚡ Motif de l'Ordre Admin</h4><p style="font-size:12px;color:#1e1b4b">${ordre.motif ?? '—'}</p></div>
<table><thead><tr><th>#</th><th>Désignation Article</th><th style="text-align:right">Quantité Autorisée</th><th>Unité</th></tr></thead>
<tbody>${lignesHtml}<tr class="tot"><td colspan="2" style="text-align:right;padding-right:12px;font-size:11px">TOTAL AUTORISÉ</td><td style="text-align:right">${totalQte.toLocaleString()}</td><td></td></tr></tbody></table>
<div class="sig"><div class="sbox"><h4>Admin Fédéral — Émetteur</h4><p style="font-size:10px;color:#64748b;margin-top:3px">Signature &amp; Cachet</p><div class="sline"></div></div><div class="sbox"><h4>Magasinier Central</h4><p style="font-size:10px;color:#64748b;margin-top:3px">Signature de prise en charge</p><div class="sline"></div></div><div class="sbox"><h4>Responsable Unité</h4><p style="font-size:10px;color:#64748b;margin-top:3px">Signature de réception</p><div class="sline"></div></div></div>
<div class="ftr"><span>Imprimé le ${date} · MLAPP v2.0</span><span>Réf Ordre : ${ordre.id} — Ce document autorise la sortie de stock.</span></div>
</body></html>`;
  const win = window.open('', '_blank', 'width=960,height=720');
  if (win) { win.document.write(html); win.document.close(); setTimeout(() => { try { win.print(); } catch (_) {} }, 600); }
}

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

  /* ─ Mode Proxy (Saisie pour coopérative) ─────────── */
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [proxyOk,        setProxyOk]        = useState(false);
  const [proxyError,     setProxyError]     = useState(null);

  /* Quota nul — l'admin saisit pour une coop tierce, pas pour lui-même */
  const PROXY_QUOTA = { semences: {alloue:0, consomme:0, unite:'doses'}, azote: {alloue:0, consomme:0, unite:'litres'} };

  /* Articles au format attendu par NouvelleCommandeModal */
  const articlesProxy = catalogue.map(a => ({ ...a, id: a._id }));

  /* ─── Chargement initial ────────────────────────── */
  useEffect(() => {
    Promise.all([
      api.get("/api/unites?actif=true&limit=200"),
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

  /* ─── Rejet d'un ordre ──────────────────────────── */
  async function handleReject(ordreId) {
    const ordre = ordres.find(o => o._id === ordreId);
    if (!ordre) return;
    try {
      await api.put(`/api/transactions/${ordreId}/statut`, { statut: 'Rejeté' });
      setOrdres(p => p.map(o => o._id === ordreId ? { ...o, statut: 'Rejeté' } : o));
    } catch (err) {
      setSubmitErr(err.message);
    }
  }

  /* ─── Commande Proxy (EXPEDITION pour une coop tierce) ─
     Crée une demande de type EXPEDITION au nom de l'admin,
     avec uniteCible = la coopérative sélectionnée dans la modale.
     La traçabilité est assurée via initiatedBy = req.user._id.
  ─────────────────────────────────────────────────────── */
  async function nouvelleCommandeProxy({ articleId, qte, motif: motifProxy, uniteCibleId }) {
    setProxyError(null);
    try {
      await api.post("/api/transactions", {
        type:   "EXPEDITION",
        statut: "En attente",
        motif:  motifProxy || "Saisie proxy — commande téléphonique coopérative",
        lignes: [{ article: articleId, quantite: qte }],
        ...(uniteCibleId ? { uniteCible: uniteCibleId } : {}),
      });
      setProxyOk(true);
      setTimeout(() => setProxyOk(false), 4000);
    } catch (err) {
      setProxyError(err.message);
    }
  }

  /* ─── Soumission ────────────────────────────────── */
  async function handleSubmit() {
    if (!formValid || submitting) return;
    setSubmitting(true);
    setSubmitErr(null);

    const payload = {
      type:       "ORDRE_ADMIN",
      statut:     "Validée_BE",          // Ordre Admin = validé d'office (belt-and-suspenders)
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

  /* ─── Filtres & colonnes DataGridV2 ─────────────── */
  const [filtreAdmin,  setFiltreAdmin]  = useState('');
  const [filtreMotif,  setFiltreMotif]  = useState('');
  const [filtreDateD,  setFiltreDateD]  = useState('');
  const [filtreDateF,  setFiltreDateF]  = useState('');

  const ordresFiltres = useMemo(() => ordres.filter(o => {
    if (filtreAdmin && o.adminValidateur !== filtreAdmin) return false;
    if (filtreMotif && o.motif !== filtreMotif) return false;
    if (filtreDateD && o.date < filtreDateD) return false;
    if (filtreDateF && o.date > filtreDateF) return false;
    return true;
  }), [ordres, filtreAdmin, filtreMotif, filtreDateD, filtreDateF]);

  const SEL_O = "text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400";

  const colonnesOrdres = [
    { key: 'id', label: 'Réf Ordre', sortable: true,
      render: (v) => (
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Zap size={10} className="text-purple-500 shrink-0" />
            <span className="text-xs font-bold font-mono text-slate-800">{v}</span>
          </div>
          <span className="text-[9px] font-bold bg-purple-50 text-purple-600 border border-purple-200 px-1.5 py-0.5 rounded-full">⚡ Ordre Admin</span>
        </div>
      ),
      exportValue: r => r.id,
    },
    { key: 'date', label: 'Date', sortable: true,
      render: (v) => (
        <div className="flex items-center gap-1 text-xs text-slate-300">
          <Clock size={10} className="text-slate-400 shrink-0" />
          {new Date(v).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' })}
        </div>
      ),
    },
    { key: 'uniteCible', label: 'Unité Cible', sortable: true,
      render: (v) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 min-w-0">
          <Building2 size={11} className="text-slate-400 shrink-0" />
          <span className="truncate">{v}</span>
        </div>
      ),
    },
    { key: 'adminValidateur', label: 'Admin Validateur', sortable: true },
    { key: 'motif', label: 'Motif de l\'opération', sortable: true,
      render: (v) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
          <FileText size={10} className="text-slate-400 shrink-0" />
          <span className="truncate">{v || '—'}</span>
        </div>
      ),
    },
    { key: 'articles', label: 'Articles',
      render: (v) => (
        <div className="space-y-0.5">
          {(v ?? []).map((a, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {typeIcon(a.type ?? 'materiel', 10)}
              <span className="text-[10px] text-slate-300 truncate">{a.label}</span>
              <span className="text-[10px] font-mono text-slate-400 ml-auto shrink-0">{Number(a.qte).toLocaleString()} {a.unite}</span>
            </div>
          ))}
        </div>
      ),
      exportValue: r => (r.articles ?? []).map(a => `${a.label} (${a.qte} ${a.unite})`).join(', '),
    },
    { key: 'statut', label: 'Statut', render: (v) => <StatutBadge statut={v} /> },
    { key: '__a', label: '',
      render: (_, r) => (
        <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
          {['Brouillon','Demandée','Validée_BE'].includes(r.statut) && (
            <button onClick={() => handleReject(r._id)}
              className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all whitespace-nowrap">
              <X size={10} /> Rejeter
            </button>
          )}
          {['Validée_BE','Partiellement_Livrée','Totalement_Livrée','Réceptionnée_Cloturée'].includes(r.statut) && (
            <button onClick={() => imprimerBE(r)}
              className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-all whitespace-nowrap">
              <FileText size={10}/> Impr. BE
            </button>
          )}
        </div>
      ),
    },
  ];

  /* ════════════════════════════════════════════════════
     RENDU
  ════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* ── Modal Saisie Proxy ────────────────────────── */}
      {showProxyModal && (
        <NouvelleCommandeModal
          quota={PROXY_QUOTA}
          onClose={() => setShowProxyModal(false)}
          onSubmit={nouvelleCommandeProxy}
          articles={articlesProxy}
          articlesLoading={loadingData}
          articlesError={null}
          uniteName={null}
          isProxy={true}
          unites={unites}
        />
      )}

      {/* ── Toast proxy succès ────────────────────────── */}
      {proxyOk && (
        <div className="flex items-center gap-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl px-5 py-3"
          style={{ animation:"fadeIn .2s ease" }}>
          <CheckCircle size={16} className="text-teal-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-teal-300">Demande proxy transmise</p>
            <p className="text-xs text-teal-400/70 mt-0.5">La commande a été enregistrée pour la coopérative sélectionnée et sera traitée par le Hub Central.</p>
          </div>
        </div>
      )}

      {/* ── Toast proxy erreur ────────────────────────── */}
      {proxyError && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-3">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-300">Erreur — Saisie Proxy</p>
            <p className="text-xs text-red-400/70 mt-0.5 truncate">{proxyError}</p>
          </div>
          <button onClick={() => setProxyError(null)} className="text-red-400 hover:text-red-300 shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* ── En-tête ─────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-5 text-white shadow-lg">
        <div className="flex items-center justify-end gap-2 mb-4">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowProxyModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-900/40 transition-all"
            >
              <ArrowRightLeft size={13} />
              Nouvelle Demande (Saisie Proxy)
            </button>
            <span className="flex items-center gap-1.5 text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/25 px-3 py-1.5 rounded-full">
              <Zap size={10} /> Autorisation Direction
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label:"Total émis",   val:ordres.length,                                                                          col:"text-purple-300" },
            { label:"À expédier",   val:ordres.filter(o => o.statut === "Validée_BE").length,                                   col:"text-amber-300"  },
            { label:"En livraison", val:ordres.filter(o => ["Partiellement_Livrée","Totalement_Livrée"].includes(o.statut)).length, col:"text-blue-300"   },
            { label:"Clôturés",     val:ordres.filter(o => o.statut === "Réceptionnée_Cloturée").length,                        col:"text-emerald-300"},
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl px-3 py-2 text-center">
              <p className={`text-xl font-bold tabular-nums ${s.col}`}>{s.val}</p>
              <p className="text-[10px] text-slate-300 mt-0.5">{s.label}</p>
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
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={lbl}>Motif de l'opération <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select value={motif} onChange={e => setMotif(e.target.value)} className={sel}>
                    <option value="" className="bg-slate-900">— Sélectionner le motif —</option>
                    {MOTIFS.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
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
                    <span className="text-xs text-slate-300 font-mono text-center">{ligne.unite ?? "—"}</span>
                    {lignes.length > 1
                      ? <button onClick={() => removeLigne(ligne._key)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-all">
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
                    className={`${sel} text-center tracking-[0.5em] text-lg font-mono placeholder:tracking-normal placeholder:text-slate-400`}
                  />
                  <p className="mt-1.5 text-[10px] text-slate-300">
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
        <DataGridV2
          columns={colonnesOrdres}
          data={ordresFiltres}
          rowKey="_id"
          title="Ordres Admin"
          exportFilename="ordres-admin"
          loading={loadingData}
          emptyMessage="Aucun ordre émis pour le moment."
          actions={
            <div className="flex flex-wrap items-center gap-1.5" onClick={e => e.stopPropagation()}>
              <select value={filtreAdmin} onChange={e => setFiltreAdmin(e.target.value)} className={SEL_O}>
                <option value="">Tout admin</option>
                {[...new Set(ordres.map(o => o.adminValidateur).filter(v => v && v !== '—'))].sort().map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <select value={filtreMotif} onChange={e => setFiltreMotif(e.target.value)} className={SEL_O}>
                <option value="">Tout motif</option>
                {MOTIFS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input type="date" value={filtreDateD} onChange={e => setFiltreDateD(e.target.value)} className={SEL_O} />
              <input type="date" value={filtreDateF} onChange={e => setFiltreDateF(e.target.value)} className={SEL_O} />
            </div>
          }
        />
      </div>
    </div>
  );
}
