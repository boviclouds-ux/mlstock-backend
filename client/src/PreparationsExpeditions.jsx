import { useState, useRef, useEffect } from "react";
import { api } from "./lib/api";
import {
  Package, Clock, Truck, ClipboardList, Lock,
  Scan, CheckCircle, AlertTriangle, X, ChevronRight,
  PackageCheck, FileText, Dna, FlaskConical, Wrench,
  User, Calendar, Shield, Zap, ScanLine, Plus,
  Trash2, BadgeCheck, Filter, Key
} from "lucide-react";



/* ─── Adaptateur Transaction API → format UI expéditions ── */
const STATUT_EXP = {
  'Brouillon':   'a_preparer',
  'En attente':  'en_attente_admin',  // picking soumis, en attente de validation OTP Admin
  'Validé':      'approuve',
  'Expédié':     'expedie',
  'Réceptionné': 'expedie',
  'Rejeté':      'a_preparer',
};
const CAT_EXP = { Semences:'semence', Azote:'azote' };

function fromApiToExpedition(t) {
  return {
    _id:         t._id,
    id:          t.reference,
    origine:     t.type === 'ORDRE_ADMIN' ? 'admin' : 'region',
    origineNote: t.motif ?? '',
    destinataire:t.uniteCible?.nom    ?? 'Hub Central',
    region:      t.uniteCible?.region ?? '—',
    statut:      STATUT_EXP[t.statut] ?? 'a_preparer',
    priorite:    t.type === 'ORDRE_ADMIN' ? 'haute' : 'normale',
    articles:    (t.lignes ?? []).map(l => ({
      label:     l.article?.designation ?? '—',
      qte:       l.quantite,
      unite:     l.article?.uniteMesure ?? '—',
      type:      CAT_EXP[l.article?.categorie] ?? 'materiel',
      articleId: l.article?._id ?? l.articleId ?? null,
    })),
    repartGenetique: Array.isArray(t.repartGenetique) ? t.repartGenetique : [],
    lotsScelles: [],
  };
}

function statutMeta(s) {
  return {
    a_preparer:       { label:"À préparer",           bg:"bg-blue-50",   text:"text-blue-700",   border:"border-blue-200",   dot:"bg-blue-500",   pulse:false },
    en_attente_admin: { label:"En attente Admin",      bg:"bg-amber-50",  text:"text-amber-700",  border:"border-amber-200",  dot:"bg-amber-500",  pulse:true  },
    approuve:         { label:"Prêt au départ",        bg:"bg-emerald-50",text:"text-emerald-700",border:"border-emerald-200",dot:"bg-emerald-500",pulse:false },
    expedie:          { label:"Expédié",               bg:"bg-gray-100",  text:"text-gray-500",   border:"border-gray-200",   dot:"bg-gray-400",   pulse:false },
  }[s] ?? {};
}

function articleIcon(type) {
  if (type === "semence")  return <Dna         size={11} className="text-blue-400 shrink-0" />;
  if (type === "azote")    return <FlaskConical size={11} className="text-cyan-500 shrink-0" />;
  return                          <Wrench      size={11} className="text-gray-400 shrink-0" />;
}

function OrigineBadge({ origine }) {
  if (origine === "admin") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-950 text-violet-200 border border-violet-800 whitespace-nowrap">
      <Zap size={9} className="text-yellow-400" /> Ordre Admin
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
      <User size={9} /> Demande Unité
    </span>
  );
}

/* ─── Génération du Bon de Livraison (impression navigateur) ── */
function imprimerBL({ commande, societe, matricule, blRef, date }) {
  const lots = commande.lotsScelles ?? [];
  const totalQte = lots.length > 0
    ? lots.reduce((s, l) => s + (l.qteRetire || 0), 0)
    : commande.articles.reduce((s, a) => s + (a.qte || 0), 0);

  const lignesHtml = lots.length > 0
    ? lots.map((l, i) => {
        const couleurStyles = {
          Rouge: 'background:#fee2e2;color:#dc2626',
          Bleu:  'background:#dbeafe;color:#2563eb',
          Vert:  'background:#dcfce7;color:#16a34a',
          Jaune: 'background:#fef9c3;color:#ca8a04',
        };
        const cs = couleurStyles[l.couleur];
        const badge = cs
          ? `<span style="${cs};display:inline-block;padding:1px 8px;border-radius:99px;font-size:10px;font-weight:600">${l.couleur}</span>`
          : '—';
        return `<tr>
          <td style="width:32px;text-align:center;color:#94a3b8">${i + 1}</td>
          <td><strong>${l.article ?? l.taureau ?? '—'}</strong></td>
          <td style="font-family:monospace;font-size:11px">${l.nni ?? '—'}</td>
          <td>${badge}</td>
          <td style="font-family:monospace;font-size:11px">${l.cuve ?? '—'}</td>
          <td style="text-align:right;font-weight:700">${l.qteRetire} ${l.unite ?? 'doses'}</td>
        </tr>`;
      }).join('')
    : commande.articles.map((a, i) => `<tr>
        <td style="text-align:center;color:#94a3b8">${i + 1}</td>
        <td><strong>${a.label}</strong></td>
        <td>—</td><td>—</td><td>—</td>
        <td style="text-align:right;font-weight:700">${a.qte} ${a.unite}</td>
      </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>${blRef}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#1a1a1a;padding:15mm 18mm}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:3px solid #1e293b;margin-bottom:20px}
.logo{font-size:26px;font-weight:900;color:#1e293b;letter-spacing:-1px}.logo span{color:#2563eb}
.logo-sub{font-size:10px;color:#64748b;margin-top:3px}
.doc-tag{font-size:9px;font-weight:700;letter-spacing:2px;color:#64748b;text-transform:uppercase;text-align:right}
.doc-title{font-size:22px;font-weight:900;color:#1e293b;text-align:right;margin:2px 0}
.doc-ref{font-size:11px;color:#64748b;text-align:right;font-family:monospace}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
.mbox{border:1px solid #e2e8f0;border-radius:8px;padding:12px}
.mbox h4{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px}
.mbox p{line-height:1.65}
table{width:100%;border-collapse:collapse;margin-bottom:22px;font-size:11px}
thead tr{background:#1e293b;color:#fff}
thead th{padding:9px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:1px;font-weight:700}
thead th:last-child{text-align:right}
tbody tr:nth-child(even){background:#f8fafc}
tbody td{padding:8px 10px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
.tot{background:#1e293b!important;color:#fff!important;font-weight:700;font-size:12px}
.tot td{color:#fff!important}
.sig{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:22px}
.sbox{border:1px solid #e2e8f0;border-radius:8px;padding:14px;min-height:90px}
.sbox h4{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:3px}
.sline{border-top:1px solid #cbd5e1;margin-top:52px}
.ftr{margin-top:18px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;display:flex;justify-content:space-between}
@media print{body{padding:8mm 10mm}}
</style></head>
<body>
<div class="hdr">
  <div>
    <div class="logo">ML<span>APP</span></div>
    <div class="logo-sub">Gestion du Stock de Semences Bovines</div>
  </div>
  <div>
    <div class="doc-tag">Document officiel</div>
    <div class="doc-title">BON DE LIVRAISON</div>
    <div class="doc-ref">${blRef} &nbsp;·&nbsp; ${date}</div>
  </div>
</div>
<div class="meta">
  <div class="mbox"><h4>Expéditeur</h4><p><strong>MLAPP — Magasin Central</strong></p><p style="font-size:11px;color:#64748b">Stock Central de Semences Bovines</p></div>
  <div class="mbox"><h4>Destinataire</h4><p><strong>${commande.destinataire}</strong></p>${commande.region ? `<p style="font-size:11px;color:#64748b">${commande.region}</p>` : ''}</div>
  <div class="mbox"><h4>Transporteur</h4><p><strong>${societe}</strong></p>${matricule ? `<p style="font-size:11px;color:#64748b">Véhicule / Chauffeur : ${matricule}</p>` : ''}</div>
  <div class="mbox"><h4>Référence Ordre</h4><p><strong style="font-family:monospace">${commande.id}</strong></p><p style="font-size:11px;color:#64748b">${commande.articles.map(a => a.label).join(', ')}</p></div>
</div>
<table>
  <thead><tr>
    <th>#</th><th>Taureau / Race</th><th>NNI</th><th>Couleur Paillette</th><th>Cuve d'Origine</th><th style="text-align:right">Qté Livrée</th>
  </tr></thead>
  <tbody>
    ${lignesHtml}
    <tr class="tot"><td colspan="5" style="text-align:right;padding-right:12px;font-size:11px">TOTAL LIVRÉ</td><td style="text-align:right">${totalQte} doses</td></tr>
  </tbody>
</table>
<div class="sig">
  <div class="sbox"><h4>Magasinier Central</h4><p style="font-size:10px;color:#64748b;margin-top:3px">Nom &amp; Signature</p><div class="sline"></div></div>
  <div class="sbox"><h4>Chauffeur / Transporteur</h4><p style="font-size:10px;color:#64748b;margin-top:3px">${societe}</p><div class="sline"></div></div>
  <div class="sbox"><h4>Cachet &amp; Date</h4><p style="font-size:10px;color:#64748b;margin-top:3px">Cachet officiel</p><div class="sline"></div></div>
</div>
<div class="ftr">
  <span>Généré le ${date} · MLAPP v2.0</span>
  <span>Ce BL engage la responsabilité du transporteur à la signature.</span>
</div>
</body></html>`;

  const win = window.open('', '_blank', 'width=960,height=720');
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => { try { win.print(); } catch (_) {} }, 600);
  }
}

/* ─── Modale Remise au Transporteur + Génération BL ───── */
function TransporteurModal({ commande, onClose, onConfirm }) {
  const [societe,       setSociete]       = useState("");
  const [matricule,     setMatricule]     = useState("");
  const [step,          setStep]          = useState("idle"); // idle | loading | done
  const [blRef,         setBlRef]         = useState(null);
  const [error,         setError]         = useState(null);
  const [transporteurs, setTransporteurs] = useState([]);

  useEffect(() => {
    api.get('/api/transporteurs')
      .then(res => setTransporteurs(Array.isArray(res) ? res : (res.data ?? [])))
      .catch(() => {});
  }, []);

  const canConfirm = societe.trim() !== "";

  async function handleConfirm() {
    if (!canConfirm || step !== "idle") return;
    setStep("loading");
    setError(null);
    try {
      const res = await api.put(`/api/ordres/${commande._id}/finaliser-expedition`, { societe, matricule });
      const ref = res?.blReference ?? `BL-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
      setBlRef(ref);
      setStep("done");
      onConfirm(commande.id);
    } catch (err) {
      setError(err.message ?? "Erreur lors de la finalisation de l'expédition.");
      setStep("idle");
    }
  }

  function handlePrintBL() {
    imprimerBL({
      commande,
      societe,
      matricule,
      blRef,
      date: new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4"
      onClick={step !== "done" ? onClose : undefined}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}
        style={{ animation:"modalIn .18s ease forwards" }}>
        <style>{`@keyframes modalIn{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

        {/* Header émeraude */}
        <div className="bg-emerald-600 px-5 pt-5 pb-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg"><Truck size={14} /></div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">Remise au Transporteur</span>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white p-1.5 rounded-lg transition-colors"><X size={15} /></button>
          </div>
          <h2 className="text-sm font-bold leading-snug">{commande.destinataire}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs text-emerald-200">#{commande.id}</span>
            {commande.origine === "admin" && (
              <span className="flex items-center gap-1 text-[9px] font-bold bg-violet-900/60 text-violet-200 px-2 py-0.5 rounded-full border border-violet-700">
                <Zap size={8} className="text-yellow-400" /> Ordre Admin
              </span>
            )}
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          {step !== "done" ? (
            <>
              {/* Récap lots scellés */}
              {commande.lotsScelles?.length > 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Contenu du colis scellé</p>
                  {commande.lotsScelles.map((l, i) => (
                    <div key={i} className="flex justify-between items-center py-1 text-xs">
                      <span className="text-gray-600 truncate">{l.article ?? l.taureau ?? l.numLot ?? '—'}</span>
                      <span className="font-semibold text-gray-800 shrink-0 ml-2">{l.qteRetire} {l.unite}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Champs traçabilité */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Société de Transport <span className="text-red-500">*</span>
                  </label>
                  <input type="text" list="transporteurs-list" value={societe} onChange={e => setSociete(e.target.value)}
                    placeholder="Ex : Ghazala, SDTM, Trans-Atlas…"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors" />
                  <datalist id="transporteurs-list">
                    {transporteurs.map(t => (
                      <option key={t._id ?? t.nom} value={t.nom} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Matricule véhicule / Nom chauffeur
                    <span className="ml-1.5 font-normal text-gray-400">(optionnel)</span>
                  </label>
                  <input type="text" value={matricule} onChange={e => setMatricule(e.target.value)}
                    placeholder="Ex : 12345-A-6 / Ahmed Bennani"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <AlertTriangle size={13} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-700 font-medium">{error}</p>
                </div>
              )}
            </>
          ) : (
            /* ── Confirmation finale ── */
            <div className="text-center space-y-3 py-2">
              <div className="flex items-center justify-center">
                <div className="bg-emerald-100 rounded-full p-4">
                  <BadgeCheck size={28} className="text-emerald-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Expédition enregistrée !</p>
                <p className="text-xs text-gray-500 mt-1.5">
                  Référence BL : <span className="font-mono font-semibold text-gray-700">{blRef}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{societe}{matricule ? ` · ${matricule}` : ''}</p>
              </div>
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="px-5 pb-5 space-y-2">
          {step !== "done" ? (
            <>
              <button onClick={handleConfirm} disabled={!canConfirm || step !== "idle"}
                className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all
                  ${step === "loading" ? "bg-emerald-400 text-white cursor-wait"
                  : canConfirm         ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  :                      "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                {step === "loading"
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</>
                  : <>🚚 Valider l'expédition & Générer le BL</>}
              </button>
              {!canConfirm && step === "idle" && (
                <p className="text-[10px] text-red-500 text-center">Veuillez renseigner la société de transport.</p>
              )}
              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                Le BL sera disponible immédiatement après validation.
              </p>
            </>
          ) : (
            <>
              <button onClick={handlePrintBL}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors">
                🖨️ Télécharger / Imprimer le BL
              </button>
              <button onClick={onClose}
                className="w-full flex items-center justify-center py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Fermer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Algorithme de répartition équitable ─────────────── */
function groupParTaureau(lots) {
  const map = {};
  lots.forEach(lot => {
    const cle = lot.nni || lot.codeNni || lot.taureau || lot.nomTaureau || lot._id || lot.id;
    if (!map[cle]) map[cle] = {
      cle,
      taureau:    lot.taureau    ?? lot.nomTaureau ?? '—',
      nni:        lot.nni        ?? lot.codeNni    ?? '—',
      couleur:    lot.couleur    ?? '—',
      numLot:     lot.numeroLot  ?? lot.id         ?? cle,
      cuve:       lot.cuve       ?? lot.refCuve    ?? '—',
      stockDispo: 0,
      unite:      lot.unite ?? lot.uniteMesure ?? 'doses',
    };
    map[cle].stockDispo += Number(lot.quantite ?? lot.qte ?? lot.quantiteRestante ?? 0);
  });
  return Object.values(map).filter(t => t.stockDispo > 0);
}

function calculerRepartition(taureaux, totalQte) {
  const n = taureaux.length;
  if (n === 0) return [];
  const base  = Math.floor(totalQte / n);
  const reste = totalQte % n; // les `reste` premiers taureaux reçoivent base+1
  return taureaux.map((t, i) => ({
    ...t,
    qteCalculee: i < reste ? base + 1 : base,
    qteRetire:   i < reste ? base + 1 : base,
  }));
}

/* ─── PickingDrawer ────────────────────────────────────── */
function PickingDrawer({ commande, onClose, onSceller }) {
  const hasSemence      = commande.articles.some(a => a.type === 'semence');
  const semenceArticle  = commande.articles.find(a => a.type === 'semence');
  const totalDemande    = commande.articles.reduce((s, a) => s + a.qte, 0);
  const totalSemDem     = semenceArticle?.qte ?? 0;

  /* ── État scan (non-semence) ── */
  const [scanInput,     setScanInput]     = useState("");
  const [lotsAjoutes,   setLotsAjoutes]   = useState([]);
  const [scanError,     setScanError]     = useState("");
  const [lotsDispoScan, setLotsDispoScan] = useState([]);
  const inputRef = useRef(null);

  /* Chargement des lots disponibles pour le scan (non-semence uniquement) */
  useEffect(() => {
    if (hasSemence) return;
    api.get('/api/lots?limit=200')
      .then(res => {
        const raw = Array.isArray(res) ? res : (res.data ?? []);
        setLotsDispoScan(raw.map(l => ({
          id:      l.numeroLot  ?? l._id ?? l.id,
          article: l.article    ?? l.designation ?? l.label ?? '—',
          qte:     l.quantite   ?? l.qte ?? 0,
          unite:   l.unite      ?? l.uniteMesure ?? '—',
          cuve:    l.cuve       ?? l.refCuve     ?? '—',
        })));
      })
      .catch(() => setLotsDispoScan([]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── État répartition (semence) ── */
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockError,   setStockError]   = useState(null);
  const [lignesRep,    setLignesRep]    = useState([]);

  /* ── Commun ── */
  const [done, setDone] = useState(false);

  /* Chargement stock au montage si semences */
  useEffect(() => {
    if (!hasSemence) return;
    chargerEtRepartir();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function chargerEtRepartir() {
    /* Cas 1 : répartition pré-définie par l'Admin Fédéral via les Quotas → utiliser directement */
    if (commande.repartGenetique?.length > 0) {
      setLignesRep(commande.repartGenetique.map(g => ({
        cle:         g.nni || g.taureau || String(Math.random()),
        taureau:     g.taureau  ?? '—',
        nni:         g.nni      ?? '—',
        couleur:     g.couleur  ?? '—',
        numLot:      '',
        cuve:        '—',
        stockDispo:  g.qte,
        qteCalculee: g.qte,
        qteRetire:   g.qte,
        unite:       semenceArticle?.unite ?? 'doses',
      })));
      return;
    }

    /* Cas 2 : calculer automatiquement depuis le stock disponible */
    setLoadingStock(true);
    setStockError(null);
    try {
      const qs  = semenceArticle?.articleId
        ? `/api/lots?articleId=${semenceArticle.articleId}&limit=200`
        : `/api/lots?type=semence&limit=200`;
      const res  = await api.get(qs);
      const lots = Array.isArray(res) ? res : (res.data ?? []);
      const taureaux = groupParTaureau(lots);
      setLignesRep(calculerRepartition(taureaux, totalSemDem));
    } catch (err) {
      setStockError(err.message);
      setLignesRep([]);
    } finally {
      setLoadingStock(false);
    }
  }

  function updateQteRep(cle, val) {
    setLignesRep(p => p.map(l =>
      l.cle === cle ? { ...l, qteRetire: Math.max(0, Number(val) || 0) } : l
    ));
  }

  /* Validations */
  const totalSaisiRep  = lignesRep.reduce((s, l) => s + (Number(l.qteRetire) || 0), 0);
  const ecartRep       = totalSemDem - totalSaisiRep;
  const canScellerRep  = lignesRep.length > 0 && ecartRep === 0;

  const totalScanne    = lotsAjoutes.reduce((s, l) => s + l.qteRetire, 0);
  const pct            = totalDemande > 0 ? Math.min((totalScanne / totalDemande) * 100, 100) : 0;
  const canScellerScan = lotsAjoutes.length > 0;

  const canScellerFinal = hasSemence ? canScellerRep : canScellerScan;

  /* Scan */
  function handleScan(e) {
    e.preventDefault();
    const val = scanInput.trim().toUpperCase();
    if (!val) return;
    const lot = lotsDispoScan.find(l => l.id === val || String(l.id).endsWith(val));
    if (!lot)  { setScanError(`Lot "${val}" introuvable${lotsDispoScan.length === 0 ? ' (chargement API en cours ou échec)' : ''}.`); return; }
    if (lotsAjoutes.find(l => l.numLot === lot.id)) { setScanError("Ce lot est déjà dans le colis."); return; }
    setScanError("");
    const qteDefaut = Math.min(lot.qte, Math.max(0, totalDemande - totalScanne));
    setLotsAjoutes(p => [...p, { numLot: lot.id, article: lot.article, qteRetire: qteDefaut, qteMax: lot.qte, unite: lot.unite, cuve: lot.cuve }]);
    setScanInput("");
    inputRef.current?.focus();
  }

  function updateQteLot(numLot, valeur) {
    setLotsAjoutes(p => p.map(l =>
      l.numLot === numLot ? { ...l, qteRetire: Math.min(Math.max(0, valeur), l.qteMax) } : l
    ));
  }

  function handleSceller() {
    setDone(true);
    const lots = hasSemence
      ? lignesRep.map(l => ({ numLot: l.numLot, article: l.taureau, taureau: l.taureau, nni: l.nni, couleur: l.couleur, qteRetire: Number(l.qteRetire), qteMax: l.stockDispo, unite: l.unite, cuve: l.cuve }))
      : lotsAjoutes;
    setTimeout(() => { onSceller(commande.id, lots); onClose(); }, 900);
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative ml-auto z-50 h-full w-full sm:max-w-lg bg-white shadow-2xl flex flex-col"
        style={{ animation:"drawerIn .2s cubic-bezier(.32,0,.67,0) forwards" }}>
        <style>{`@keyframes drawerIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* En-tête */}
        <div className="px-5 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <div className="bg-blue-100 p-1.5 rounded-lg shrink-0"><ClipboardList size={13} className="text-blue-600" /></div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                  {hasSemence ? 'Répartition Génétique — Picking' : 'Picking — Préparation Colis'}
                </span>
                <OrigineBadge origine={commande.origine} />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 truncate">{commande.destinataire}</h2>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">#{commande.id} · {commande.region}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors shrink-0"><X size={17} /></button>
          </div>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Bandeau Admin */}
          {commande.origine === "admin" && commande.origineNote && (
            <div className="flex gap-2.5 bg-violet-950 border border-violet-800 rounded-xl px-4 py-3">
              <Zap size={14} className="text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-violet-200 mb-0.5">Info : Ordre de répartition Admin</p>
                <p className="text-xs text-violet-300 leading-relaxed">{commande.origineNote}</p>
              </div>
            </div>
          )}

          {/* Articles à préparer */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-800 mb-2.5 uppercase tracking-wide">Articles à préparer</p>
            <div className="space-y-2">
              {commande.articles.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  {articleIcon(a.type)}
                  <span className="text-sm text-blue-700 flex-1">{a.label}</span>
                  <span className="text-sm font-bold text-blue-900">{a.qte.toLocaleString()} {a.unite}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ══ Mode répartition génétique ══ */}
          {hasSemence && (
            <>
              {/* Info algorithme — source admin ou automatique */}
              <div className={`flex gap-2.5 rounded-xl px-4 py-3 border ${commande.repartGenetique?.length > 0 ? 'bg-violet-950 border-violet-800' : 'bg-slate-900 border-slate-700'}`}>
                <Dna size={14} className={`shrink-0 mt-0.5 ${commande.repartGenetique?.length > 0 ? 'text-violet-300' : 'text-blue-400'}`} />
                <div>
                  <p className={`text-xs font-bold mb-0.5 ${commande.repartGenetique?.length > 0 ? 'text-violet-100' : 'text-slate-100'}`}>
                    {commande.repartGenetique?.length > 0
                      ? '⚡ Répartition définie par l\'Admin Fédéral'
                      : 'Répartition équitable automatique'}
                  </p>
                  <p className={`text-xs leading-relaxed ${commande.repartGenetique?.length > 0 ? 'text-violet-300' : 'text-slate-400'}`}>
                    {commande.repartGenetique?.length > 0
                      ? 'Quantités imposées par la subvention — modifiables en cas de force majeure, le total doit rester exact.'
                      : 'Doses pré-calculées en parts égales par taureau (NNI) — ajustez si nécessaire, le total doit rester égal à la commande.'}
                  </p>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-700">Total attribué</span>
                  <span className={`text-xs font-bold tabular-nums ${ecartRep === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                    {totalSaisiRep.toLocaleString()} / {totalSemDem.toLocaleString()} {semenceArticle?.unite ?? 'doses'}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${ecartRep === 0 ? "bg-emerald-500" : totalSaisiRep > totalSemDem ? "bg-red-500" : "bg-amber-400"}`}
                    style={{ width: `${Math.min(totalSemDem > 0 ? (totalSaisiRep / totalSemDem) * 100 : 0, 100)}%` }}
                  />
                </div>
                {ecartRep !== 0 && (
                  <p className={`mt-1.5 text-xs flex items-center gap-1 font-semibold ${ecartRep > 0 ? "text-amber-600" : "text-red-600"}`}>
                    <AlertTriangle size={11} />
                    {ecartRep > 0
                      ? `Il manque ${ecartRep} dose${ecartRep > 1 ? 's' : ''} — ajustez les quantités`
                      : `${Math.abs(ecartRep)} dose${Math.abs(ecartRep) > 1 ? 's' : ''} en trop`}
                  </p>
                )}
              </div>

              {/* Chargement */}
              {loadingStock && (
                <div className="flex items-center justify-center gap-3 py-8 bg-white rounded-xl border border-gray-100">
                  <span className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">Chargement du stock disponible…</span>
                </div>
              )}

              {/* Erreur API stock */}
              {stockError && !loadingStock && (
                <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={13} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-700">{stockError}</p>
                  </div>
                  <button onClick={chargerEtRepartir}
                    className="text-xs font-bold text-red-600 hover:underline shrink-0">Réessayer</button>
                </div>
              )}

              {/* Tableau de répartition */}
              {!loadingStock && lignesRep.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Dna size={13} className="text-blue-500" />
                      <span className="text-xs font-bold text-gray-700">Répartition par Taureau</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                      {lignesRep.length} taureau{lignesRep.length > 1 ? 'x' : ''}
                    </span>
                  </div>

                  {/* En-têtes colonnes */}
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2 bg-gray-50/50 border-b border-gray-100">
                    {['Taureau / NNI', 'Cuve', 'Stock', 'Qté'].map(h => (
                      <span key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider last:text-right">{h}</span>
                    ))}
                  </div>

                  <div className="divide-y divide-gray-50">
                    {lignesRep.map((ligne) => {
                      const estModifie = ligne.qteRetire !== ligne.qteCalculee;
                      return (
                        <div key={ligne.cle}
                          className={`grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-4 py-3 transition-colors ${estModifie ? 'bg-amber-50/50' : 'hover:bg-gray-50/60'}`}>

                          {/* Taureau */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-semibold text-gray-800 truncate">{ligne.taureau}</p>
                              {ligne.couleur !== '—' && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0
                                  ${ligne.couleur === 'Rouge'  ? 'bg-red-50 text-red-700 border-red-200' :
                                    ligne.couleur === 'Bleu'   ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    ligne.couleur === 'Vert'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    ligne.couleur === 'Jaune'  ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                  {ligne.couleur}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{ligne.nni}</p>
                          </div>

                          <span className="text-[11px] font-mono text-gray-500 shrink-0">{ligne.cuve}</span>
                          <span className="text-[11px] text-gray-400 tabular-nums shrink-0">{ligne.stockDispo.toLocaleString()}</span>

                          <div className="flex flex-col items-end gap-0.5 shrink-0">
                            <input
                              type="number"
                              min={0}
                              max={ligne.stockDispo}
                              value={ligne.qteRetire}
                              onChange={e => updateQteRep(ligne.cle, parseInt(e.target.value, 10) || 0)}
                              className={`w-20 text-right text-sm font-bold border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 tabular-nums transition-colors
                                ${estModifie
                                  ? 'border-amber-300 bg-amber-50 text-amber-800 focus:ring-amber-400'
                                  : 'border-gray-200 text-gray-800 bg-white focus:ring-blue-400'}`}
                            />
                            {estModifie && (
                              <span className="text-[9px] text-amber-500 font-semibold">
                                calculé : {ligne.qteCalculee}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pied de tableau — total */}
                  <div className={`flex items-center justify-between px-4 py-2.5 border-t transition-colors ${ecartRep === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                    <span className={`text-xs font-bold ${ecartRep === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>Total</span>
                    <span className={`text-sm font-bold tabular-nums flex items-center gap-1.5 ${ecartRep === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {totalSaisiRep.toLocaleString()} / {totalSemDem.toLocaleString()} {semenceArticle?.unite ?? 'doses'}
                      {ecartRep === 0 && <CheckCircle size={12} />}
                    </span>
                  </div>
                </div>
              )}

              {/* Aucun lot en stock */}
              {!loadingStock && !stockError && lignesRep.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center">
                  <Dna size={22} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-medium text-gray-400">Aucun lot de semences trouvé en stock</p>
                  <button onClick={chargerEtRepartir} className="mt-2 text-xs text-blue-600 hover:underline font-semibold">
                    Actualiser le stock
                  </button>
                </div>
              )}
            </>
          )}

          {/* ══ Mode scan (non-semence) ══ */}
          {!hasSemence && (
            <>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-700">Progression du colis</span>
                  <span className={`text-xs font-bold tabular-nums ${pct >= 100 ? "text-emerald-600" : "text-blue-600"}`}>{totalScanne} / {totalDemande} unités</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                  <Scan size={14} className="text-gray-400" /> Scanner N° de Lot
                </label>
                <form onSubmit={handleScan} className="flex gap-2">
                  <div className="relative flex-1">
                    <input ref={inputRef} type="text" value={scanInput} autoFocus
                      onChange={e => { setScanInput(e.target.value); setScanError(""); }}
                      placeholder="Ex : LOT-2025-0041 ou 0041"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 placeholder:text-gray-300 transition-colors" />
                    <ScanLine size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                  </div>
                  <button type="submit" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap">
                    <Plus size={14} /> Ajouter
                  </button>
                </form>
                {scanError && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={11}/> {scanError}</p>}
                <p className="mt-1 text-[10px] text-gray-400">Scannez le QR ou saisissez les 4 derniers chiffres du N° de lot.</p>
              </div>

              {lotsAjoutes.length > 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5"><PackageCheck size={13} className="text-emerald-500"/><span className="text-sm font-semibold text-gray-800">Lots ajoutés au colis</span></div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{lotsAjoutes.length} lot{lotsAjoutes.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {lotsAjoutes.map(lot => (
                      <div key={lot.numLot} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono font-semibold text-gray-700">{lot.numLot}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{lot.article} · Cuve {lot.cuve}</p>
                          <p className="text-[9px] text-gray-300 mt-0.5">Stock dispo : {lot.qteMax.toLocaleString()} {lot.unite}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input type="number" min={1} max={lot.qteMax} value={lot.qteRetire}
                            onChange={e => updateQteLot(lot.numLot, parseInt(e.target.value, 10) || 0)}
                            className="w-20 text-right text-sm font-bold text-gray-800 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 tabular-nums" />
                          <span className="text-xs text-gray-400">{lot.unite}</span>
                        </div>
                        <button onClick={() => setLotsAjoutes(p => p.filter(l => l.numLot !== lot.numLot))}
                          className="shrink-0 text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={12}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center">
                  <Scan size={22} className="mx-auto mb-2 text-gray-300"/>
                  <p className="text-xs font-medium text-gray-400">Aucun lot scanné pour l'instant</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pied */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 space-y-2">
          {hasSemence && ecartRep !== 0 && lignesRep.length > 0 && (
            <p className="text-xs text-amber-600 text-center flex items-center justify-center gap-1.5 font-semibold">
              <AlertTriangle size={11}/>
              Écart de {Math.abs(ecartRep)} dose{Math.abs(ecartRep) > 1 ? 's' : ''} — le total doit être exactement {totalSemDem}.
            </p>
          )}
          {!hasSemence && !canScellerScan && (
            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
              <AlertTriangle size={11}/> Ajoutez au moins un lot pour sceller le colis.
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Annuler</button>
            <button onClick={handleSceller} disabled={!canScellerFinal || done}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all
                ${done              ? "bg-emerald-500 text-white"
                : canScellerFinal   ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                :                     "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              {done
                ? <><BadgeCheck size={15}/> Soumis à l'Admin !</>
                : <><Lock size={14}/> Sceller et soumettre à l'Admin</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Modale Dérogation OTP ────────────────────────────── */
function OtpModal({ commande, onClose, onSuccess }) {
  const [pin,     setPin]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.put(`/api/ordres/${commande._id}/valider-otp`, { pin: pin.trim() });
      onSuccess(commande.id);
      onClose();
    } catch (err) {
      setError(err.message ?? 'PIN invalide ou expiré. Contactez l\'Administrateur.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()} style={{ animation:"modalIn .18s ease forwards" }}>
        <style>{`@keyframes modalIn{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

        <div className="bg-amber-600 px-5 pt-5 pb-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg"><Key size={14} /></div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-100">Dérogation Admin</span>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white p-1.5 rounded-lg transition-colors"><X size={15} /></button>
          </div>
          <h2 className="text-sm font-bold leading-snug">{commande.destinataire}</h2>
          <span className="font-mono text-xs text-amber-200">#{commande.id}</span>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Saisissez le PIN de dérogation communiqué par l'Administrateur Fédéral pour débloquer cet ordre directement depuis le quai.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">PIN de Dérogation</label>
            <input
              type="text"
              value={pin}
              onChange={e => { setPin(e.target.value); setError(null); }}
              placeholder="Ex : 482917"
              maxLength={8}
              autoFocus
              className="w-full text-center text-2xl font-mono font-bold tracking-[0.3em] border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 hover:border-gray-300 placeholder:text-gray-200 placeholder:text-base placeholder:tracking-normal transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertTriangle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          <button type="submit" disabled={!pin.trim() || loading}
            className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all
              ${loading         ? "bg-amber-400 text-white cursor-wait"
              : pin.trim()      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              :                   "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Vérification…</>
              : <><CheckCircle size={15} /> Débloquer l'ordre</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PreparationsExpeditions() {
  const [commandes,       setCommandes]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [apiError,        setApiError]        = useState(null);
  const [pickingCmd,      setPickingCmd]      = useState(null);
  const [transporteurCmd, setTransporteurCmd] = useState(null);
  const [otpCmd,          setOtpCmd]          = useState(null);
  const [flashId,         setFlashId]         = useState(null);
  const [filtre,          setFiltre]          = useState("tous");

  /* ─ Chargement depuis l'API ─────────────────────────── */
  async function fetchExpeditions() {
    setLoading(true);
    setApiError(null);
    try {
      const res  = await api.get("/api/transactions?limit=100");
      const list = Array.isArray(res) ? res : (res.data ?? []);
      const mapped = list
        .filter(t => ['EXPEDITION', 'ORDRE_ADMIN'].includes(t.type))
        .map(fromApiToExpedition);
      setCommandes(mapped);
    } catch (err) {
      setApiError(err.message);
      setCommandes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchExpeditions(); }, []);

  const kpi = {
    aPreparer: commandes.filter(c => c.statut === "a_preparer").length,
    adminPrio: commandes.filter(c => c.origine === "admin" && c.statut !== "expedie").length,
    enAttente: commandes.filter(c => c.statut === "en_attente_admin").length,
  };

  function flash(id) { setFlashId(id); setTimeout(() => setFlashId(null), 800); }

  /* ─ Sceller : local + PUT API (Brouillon → En attente Admin) ─── */
  async function handleSceller(id, lots) {
    setCommandes(p => p.map(c => c.id === id ? { ...c, statut: "en_attente_admin", lotsScelles: lots } : c));
    flash(id);
    const target = commandes.find(c => c.id === id);
    if (target?._id) {
      try { await api.put(`/api/transactions/${target._id}/statut`, { statut: 'En attente' }); }
      catch { /* la vue locale est déjà mise à jour */ }
    }
  }

  /* ─ Déblocage OTP : passe à Validé → affiche "Remise Transporteur" ─ */
  function handleOtpSuccess(id) {
    setCommandes(p => p.map(c => c.id === id ? { ...c, statut: "approuve" } : c));
    flash(id);
  }

  /* ─ Expédier : MAJ locale (API déjà appelée par TransporteurModal) ─ */
  function handleExpedition(id) {
    setCommandes(p => p.map(c => c.id === id ? { ...c, statut: "expedie" } : c));
    flash(id);
  }

  const actives = commandes.filter(c => {
    if (c.statut === "expedie") return false;
    if (filtre === "admin")  return c.origine === "admin";
    if (filtre === "region") return c.origine === "region";
    return true;
  });
  const expedies = commandes.filter(c => c.statut === "expedie");

  const FILTRES = [
    { id:"tous",   label:"Toutes les commandes" },
    { id:"admin",  label:"Ordres Admin"          },
    { id:"region", label:"Demandes Régionales"   },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {pickingCmd      && <PickingDrawer commande={pickingCmd} onClose={() => setPickingCmd(null)} onSceller={handleSceller} />}
      {transporteurCmd && <TransporteurModal commande={transporteurCmd} onClose={() => setTransporteurCmd(null)} onConfirm={handleExpedition} />}
      {otpCmd          && <OtpModal commande={otpCmd} onClose={() => setOtpCmd(null)} onSuccess={handleOtpSuccess} />}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1 flex-wrap">
            <span>MLstock</span><span>/</span><span>Opérations Terrain</span><span>/</span>
            <span className="text-blue-600 font-medium">Préparations & Expéditions</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Quai d'Expédition</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <p className="text-sm text-gray-500">Magasinier Central · Outbound</p>
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> En service
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 bg-white border border-gray-100 rounded-xl px-3 py-2 shrink-0">Lun. 14 Juin 2025 · 09:42</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
          {[
            { label:"À préparer",               value:kpi.aPreparer, icon:Package, bg:"bg-blue-50",   iconColor:"text-blue-600",   border:"border-blue-100"   },
            { label:"Ordres Admin Prioritaires", value:kpi.adminPrio, icon:Zap,     bg:"bg-violet-50", iconColor:"text-violet-700", border:"border-violet-100" },
            { label:"En attente Validation",     value:kpi.enAttente, icon:Clock,   bg:"bg-amber-50",  iconColor:"text-amber-600",  border:"border-amber-100"  },
          ].map(({ label, value, icon:Icon, bg, iconColor, border }) => (
            <div key={label} className={`bg-white rounded-xl border ${border} p-4 flex items-center gap-3`}>
              <div className={`${bg} p-2.5 rounded-xl shrink-0`}><Icon size={18} className={iconColor} /></div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 leading-tight">{label}</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter size={13} className="text-gray-400 shrink-0" />
          {FILTRES.map(f => (
            <button key={f.id} onClick={() => setFiltre(f.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors
                ${filtre===f.id?"bg-slate-900 text-white border-slate-900":"bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">{actives.length} ordre{actives.length>1?"s":""} actif{actives.length>1?"s":""}</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <ClipboardList size={14} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-800">Ordres d'Expédition</h2>
            {loading && <span className="w-3.5 h-3.5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin ml-1" />}
            {!loading && <span className="ml-auto text-[10px] text-gray-400 font-mono">{apiError ? "⚠ Données locales" : "API MongoDB"}</span>}
          </div>
          {apiError && (
            <div className="flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-100 px-5 py-2.5">
              <p className="text-xs text-amber-700 flex items-center gap-1.5">
                <AlertTriangle size={12} className="shrink-0" />
                {apiError} — données de démonstration affichées
              </p>
              <button onClick={fetchExpeditions} className="text-[11px] font-bold text-amber-700 hover:underline shrink-0">Réessayer</button>
            </div>
          )}

          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    {["N° Ordre","Origine","Destinataire","Articles","Statut","Action"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && commandes.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12">
                      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Chargement des ordres d'expédition…</p>
                    </td></tr>
                  ) : actives.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12">
                      <CheckCircle size={28} className="mx-auto mb-2 text-gray-200"/>
                      <p className="text-sm text-gray-400">Aucun ordre actif pour ce filtre.</p>
                    </td></tr>
                  ) : actives.map(cmd => {
                    const sm = statutMeta(cmd.statut);
                    const isFlash = flashId === cmd.id;
                    return (
                      <tr key={cmd.id}
                        style={isFlash ? { animation:"rowFlash .6s ease" } : {}}
                        className={`transition-colors ${cmd.origine==="admin"?"hover:bg-violet-50/30":"hover:bg-gray-50/60"}`}>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-mono font-semibold text-gray-600">{cmd.id}</span>
                        </td>
                        <td className="px-4 py-3.5"><OrigineBadge origine={cmd.origine} /></td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-semibold text-gray-800 whitespace-nowrap">{cmd.destinataire}</p>
                          <p className="text-[10px] text-gray-400">{cmd.region}</p>
                        </td>
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <div className="space-y-1">
                            {cmd.articles.map((a,i) => (
                              <div key={i} className="flex items-center gap-1 text-xs text-gray-600">
                                {articleIcon(a.type)}
                                <span className="truncate">{a.qte} {a.unite} · {a.label}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sm.bg} ${sm.text} ${sm.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sm.dot} ${sm.pulse?"animate-pulse":""}`} />
                            {sm.label}
                          </span>
                          {cmd.lotsScelles && cmd.statut==="en_attente_admin" && (
                            <p className="text-[9px] text-gray-400 mt-0.5">{cmd.lotsScelles.length} lot{cmd.lotsScelles.length>1?"s":""} scellé{cmd.lotsScelles.length>1?"s":""}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {cmd.statut === "a_preparer" && (
                            <button onClick={() => setPickingCmd(cmd)}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap">
                              <ClipboardList size={12}/> Commencer le Picking
                            </button>
                          )}
                          {cmd.statut === "en_attente_admin" && (
                            <button onClick={() => setOtpCmd(cmd)}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors whitespace-nowrap"
                              title="Saisir le PIN de dérogation Admin">
                              <Key size={11}/> En attente Admin
                            </button>
                          )}
                          {cmd.statut === "approuve" && (
                            <button onClick={() => setTransporteurCmd(cmd)}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap">
                              <Truck size={12}/> Remise Transporteur
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {expedies.length > 0 && (
            <details className="border-t border-gray-100">
              <summary className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-400 cursor-pointer select-none list-none hover:bg-gray-50 transition-colors">
                <ChevronRight size={13}/> {expedies.length} expédition{expedies.length>1?"s":""} terminée{expedies.length>1?"s":""}
              </summary>
              <div className="overflow-x-auto"><div className="min-w-[760px]">
                <table className="w-full"><tbody className="divide-y divide-gray-50">
                  {expedies.map(cmd => (
                    <tr key={cmd.id} className="opacity-50 bg-gray-50/30">
                      <td className="px-4 py-3"><span className="text-xs font-mono text-gray-400">{cmd.id}</span></td>
                      <td className="px-4 py-3"><OrigineBadge origine={cmd.origine}/></td>
                      <td className="px-4 py-3"><p className="text-xs text-gray-500">{cmd.destinataire}</p></td>
                      <td className="px-4 py-3 max-w-[180px]">{cmd.articles.map((a,i) => <p key={i} className="text-[10px] text-gray-400 truncate">{a.qte} {a.unite} · {a.label}</p>)}</td>
                      <td className="px-4 py-3" colSpan={2}>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                          <BadgeCheck size={10}/> Expédié
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody></table>
              </div></div>
            </details>
          )}

          <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"/> Flux actif · {commandes.length} ordres au total
            </div>
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              <Shield size={10}/> Toute sortie requiert validation Admin avant remise transporteur
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes rowFlash{0%,100%{background:transparent}50%{background:#d1fae5}}`}</style>
    </div>
  );
}
