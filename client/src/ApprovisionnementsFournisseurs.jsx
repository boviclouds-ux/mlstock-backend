// ApprovisionnementsFournisseurs.jsx — Suivi des commandes Direction → Fournisseurs
// Règle métier : le Magasinier consulte uniquement. Seul l'Admin Fédéral crée des commandes.
import { useState, useEffect, useMemo } from "react";
import { api } from "./lib/api";
import DataGridV2 from './components/DataGridV2';
import {
  Truck, Dna, FlaskConical, Wrench, X,
  CheckCircle, XCircle, Clock, FileText,
  ShieldCheck, PlusCircle, Building2, Calendar,
  ChevronDown, Download,
} from "lucide-react";

/* Mapping typeProduit V2 → type icône interne */
function typeFromProduit(tp) {
  if (tp === 'Conventionnelle' || tp === 'Sexée') return 'semence';
  if (tp === 'Azote') return 'azote';
  return 'materiel';
}

/* Mapping catégorie article API → type interne (ne dépend PAS de typeProduit) */
function articleCatToType(cat) {
  if (cat === 'Semences') return 'semence';
  if (cat === 'Azote')    return 'azote';
  return 'materiel';
}

const TYPES_PRODUIT    = ['Conventionnelle', 'Sexée', 'Azote'];
const UNITES_MATERIEL  = ['Unité', 'Boîte', 'Kg'];   // dropdown matériel uniquement

const LIEU_STOCKAGE_DEFAUT = "Magasin Central National · Agadir";

/* ─── Adaptateur Approvisionnement API → Bon de Commande ── */
function fromApiAppro(a) {
  return {
    _id:          a._id,
    id:           a.numeroCommande,
    fournisseur:  a.fournisseurNom,
    pays:         a.fournisseurPays     ?? '—',
    pavillon:     a.fournisseurPavillon ?? '🌍',
    articles:     (a.lignes ?? []).map(l => ({
      label:             l.label,
      qte:               l.qte,
      unite:             l.uniteMesure ?? l.unite,
      type:              typeFromProduit(l.typeProduit),
      prixAchatUnitaire: l.prixAchatUnitaire ?? null,
    })),
    dateCommande: (a.createdAt ?? '').slice(0, 10),
    dateArrivee:  a.dateArriveePrevu ? a.dateArriveePrevu.slice(0, 10) : null,
    statut:       a.statut ?? 'prevu',
    transporteur: a.transporteur ?? '—',
    ref_bl:       a.refBL ?? null,
    conformite:   a.conformite?.resultat ? a.conformite : null,
    lieuStockage: a.lieuStockage,
    demandeur:    a.createdBy
      ? (`${a.createdBy.prenom ?? ''} ${a.createdBy.nom ?? ''}`).trim() || 'Admin Fédéral'
      : 'Admin Fédéral',
    montantTotal: (a.lignes ?? []).reduce(
      (s, l) => s + (Number(l.qte) * (Number(l.prixAchatUnitaire) || 0)), 0
    ),
  };
}

/* ─── Helpers ──────────────────────────────────────────── */
function typeIcon(type, sz = 11) {
  if (type === "semence")  return <Dna size={sz} className="text-blue-400 shrink-0" />;
  if (type === "azote")    return <FlaskConical size={sz} className="text-cyan-500 shrink-0" />;
  return <Wrench size={sz} className="text-slate-400 shrink-0" />;
}

const STATUT_META = {
  prevu:        { label: "Prévu",         bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400"   },
  en_transit:   { label: "En transit",    bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500"    },
  a_quai:       { label: "À quai",        bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500"   },
  conforme:     { label: "Conforme",      bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  non_conforme: { label: "Non conforme",  bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500"     },
};

function StatutBadge({ statut }) {
  const m = STATUT_META[statut] ?? STATUT_META.prevu;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function dateRelative(ds) {
  if (!ds) return { label: "—", urgent: false, past: false };
  const diff = Math.round((new Date(ds) - new Date()) / 86400000);
  if (diff < 0)   return { label: `Il y a ${Math.abs(diff)}j`, urgent: false, past: true  };
  if (diff === 0) return { label: "Aujourd'hui",                urgent: true,  past: false };
  if (diff <= 3)  return { label: `Dans ${diff}j`,             urgent: true,  past: false };
  return { label: new Date(ds).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), urgent: false, past: false };
}


/* ─── Champ de formulaire stylisé (dark) ────────────────── */
const labelCls  = "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";
const inputCls  = "w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none";

const COULEURS_PAILLETTE = ['Rouge', 'Jaune', 'Vert', 'Bleu', 'Rose', 'Orange', 'Blanc', 'Noir'];

const RACES_BOVINES = [
  'Holstein', "Prim'Holstein", 'Montbéliarde', 'Brune des Alpes',
  'Normande', 'Jersiaise', 'Simmental', 'Tarentaise', 'Abondance',
  'Charolaise', 'Limousine', "Blonde d'Aquitaine", 'Autres',
];

/* ─── Modal Nouvelle Commande (Admin Fédéral) ───────────── */
function ModalNouvelleCommande({ onClose, onAjouter }) {
  /* ── Listes dynamiques ── */
  const [fournisseurs,  setFournisseurs]  = useState([]);
  const [articles,      setArticles]      = useState([]);
  const [loadingLists,  setLoadingLists]  = useState(true);
  const [listError,     setListError]     = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/api/fournisseurs?actif=true").catch(() => []),
      api.get("/api/articles?actif=true").catch(() => []),
    ]).then(([f, a]) => {
      setFournisseurs(Array.isArray(f) ? f : []);
      setArticles(Array.isArray(a) ? a : []);
    }).catch(err => setListError(err.message))
      .finally(() => setLoadingLists(false));
  }, []);

  /* ── Saisie formulaire ── */
  const [fournisseurId, setFournisseurId] = useState("");
  const [articleId,     setArticleId]     = useState("");
  const [qte,           setQte]           = useState("");
  const [dateArrivee,   setDateArrivee]   = useState("");

  const [typeProduit,       setTypeProduit]       = useState("");
  const [prixAchatUnitaire, setPrixAchatUnitaire] = useState("");
  const [uniteMateriel,     setUniteMateriel]     = useState("Unité");

  const fournisseurObj = fournisseurs.find(f => f._id === fournisseurId) ?? null;
  const articleObj     = articles.find(a => a._id === articleId) ?? null;
  // articleType est dérivé de la catégorie article, PAS du typeProduit saisi
  const articleType    = articleObj ? articleCatToType(articleObj.categorie) : null;
  const isSemence      = articleType === 'semence';
  const isAzote        = articleType === 'azote';
  // Pour les non-semences, typeProduit est auto-dérivé (Azote → 'Azote', autre → catégorie brute)
  const effectiveTypeProduit = isSemence ? typeProduit
    : isAzote ? 'Azote'
    : (articleObj?.categorie ?? '');
  const uniteMesure    = isSemence ? 'Paillette' : isAzote ? 'Litre' : uniteMateriel;
  // Le garde valid ne bloque plus sur typeProduit pour le matériel classique
  const valid          = fournisseurId && articleId &&
    (articleType !== 'semence' || typeProduit) &&
    Number(qte) > 0 && dateArrivee && prixAchatUnitaire !== '';

  /* ── Fiche Technique Cuve — visible si type = semence ── */
  const [ficheTechnique, setFicheTechnique] = useState([]);
  const ficheTotal = ficheTechnique.reduce((s, r) => s + (Number(r.quantite) || 0), 0);
  const addFicheLigne    = () => setFicheTechnique(p => [...p, { race: '', taureau: '', nni: '', couleur: 'Rouge', quantite: '' }]);
  const removeFicheLigne = (i) => setFicheTechnique(p => p.filter((_, idx) => idx !== i));
  const updateFicheLigne = (i, key, val) =>
    setFicheTechnique(p => p.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

  useEffect(() => { setFicheTechnique([]); setTypeProduit(""); setPrixAchatUnitaire(""); setUniteMateriel("Unité"); }, [articleId]);

  /* Catégories uniques pour les optgroups */
  const categoriesUniques = [...new Set(articles.map(a => a.categorie))].sort();

  const [saving,      setSaving]      = useState(false);
  const [submitError, setSubmitError] = useState(null);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!valid || !fournisseurObj || !articleObj || saving) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await onAjouter({
        fournisseurId:       fournisseurObj._id  ?? null,
        fournisseurNom:      fournisseurObj.nom,
        fournisseurPays:     fournisseurObj.pays     ?? '',
        fournisseurPavillon: fournisseurObj.pavillon ?? '🌍',
        lignes: [{
          articleId:         articleObj._id ?? null,
          label:             articleObj.designation,
          qte:               Number(qte),
          typeProduit:       effectiveTypeProduit,
          uniteMesure,
          prixAchatUnitaire: Number(prixAchatUnitaire),
          ...(isSemence && ficheTechnique.length > 0 ? {
            ficheTechnique: ficheTechnique.map(r => ({
              race:     r.race,
              taureau:  r.taureau,
              nni:      r.nni,
              couleur:  r.couleur,
              quantite: Number(r.quantite) || 0,
            })),
          } : {}),
        }],
        dateArriveePrevu: dateArrivee || null,
        lieuStockage:     LIEU_STOCKAGE_DEFAUT,
      });
      onClose();
    } catch (err) {
      setSubmitError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <PlusCircle size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Nouvelle Commande Fournisseur</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Réf. <span className="font-mono text-slate-400">BC-{new Date().getFullYear()}-auto</span> · Direction Générale</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Formulaire */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

          {/* Erreurs */}
          {(listError || submitError) && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              <span className="text-xs text-red-400">{submitError ?? listError}</span>
            </div>
          )}

          {/* Fournisseur */}
          <div>
            <label className={labelCls}>Fournisseur</label>
            <div className="relative">
              <select
                value={fournisseurId}
                onChange={e => setFournisseurId(e.target.value)}
                disabled={loadingLists}
                className={inputCls}
              >
                <option value="" className="bg-slate-800">
                  {loadingLists ? "Chargement…" : fournisseurs.length === 0 ? "Aucun fournisseur enregistré" : "— Sélectionner un fournisseur —"}
                </option>
                {fournisseurs.map(f => (
                  <option key={f._id} value={f._id} className="bg-slate-800">
                    {f.nom}{f.pays ? ` · ${f.pays}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Article */}
          <div>
            <label className={labelCls}>Article / Équipement</label>
            <div className="relative">
              <select
                value={articleId}
                onChange={e => setArticleId(e.target.value)}
                disabled={loadingLists}
                className={inputCls}
              >
                <option value="" className="bg-slate-800">
                  {loadingLists ? "Chargement…" : articles.length === 0 ? "Aucun article dans le catalogue" : "— Sélectionner dans le catalogue —"}
                </option>
                {categoriesUniques.map(cat => (
                  <optgroup key={cat} label={cat} className="bg-slate-800 text-slate-400">
                    {articles.filter(a => a.categorie === cat).map(a => (
                      <option key={a._id} value={a._id} className="bg-slate-800 text-white">
                        {a.designation}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
            {articleObj && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                {typeIcon(articleType, 10)}
                <span>{articleObj.designation}</span>
              </div>
            )}
          </div>

          {/* Type Produit — visible uniquement pour les semences */}
          {isSemence && (
            <div>
              <label className={labelCls}>Type de semence <span className="text-red-400">*</span></label>
              <div className="relative">
                <select
                  value={typeProduit}
                  onChange={e => setTypeProduit(e.target.value)}
                  className={inputCls}
                >
                  <option value="" className="bg-slate-800">— Conventionnelle ou Sexée ? —</option>
                  {['Conventionnelle', 'Sexée'].map(t => (
                    <option key={t} value={t} className="bg-slate-800">{t}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Prix Achat + Unité Mesure */}
          {articleObj && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Prix d'achat unitaire (DH) <span className="text-red-400">*</span></label>
                <input
                  type="number" min="0" step="0.01" value={prixAchatUnitaire}
                  onChange={e => setPrixAchatUnitaire(e.target.value)}
                  placeholder="ex: 125.00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Unité de mesure</label>
                {(isSemence || isAzote) ? (
                  <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2.5">
                    <span className="text-sm text-slate-400">{uniteMesure}</span>
                    <span className="ml-auto text-[10px] font-bold text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full shrink-0">Auto</span>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={uniteMateriel}
                      onChange={e => setUniteMateriel(e.target.value)}
                      className={inputCls}
                    >
                      {UNITES_MATERIEL.map(u => (
                        <option key={u} value={u} className="bg-slate-800">{u}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quantité + Date côte à côte */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Quantité</label>
              <input
                type="number" min="1" value={qte} onChange={e => setQte(e.target.value)}
                placeholder={`ex: 500 ${articleObj?.uniteMesure ?? "unités"}`}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Date d'arrivée prévue</label>
              <input
                type="date" value={dateArrivee} onChange={e => setDateArrivee(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className={inputCls}
              />
            </div>
          </div>

          {/* ── Fiche Technique Conteneur Semence (semences uniquement) ── */}
          {isSemence && (
            <div className="border border-slate-700 rounded-xl overflow-hidden">

              {/* En-tête */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Dna size={13} className="text-blue-400" />
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Fiche Technique du Conteneur Semence</p>
                </div>
                <button type="button" onClick={addFicheLigne}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                  <PlusCircle size={12} /> Ajouter un taureau
                </button>
              </div>

              {/* Indicateur de concordance des totaux */}
              {Number(qte) > 0 && ficheTechnique.length > 0 && (
                <div className={`px-4 py-1.5 text-[11px] font-semibold flex items-center justify-between border-b border-slate-700
                  ${ficheTotal === Number(qte) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  <span>Total paillettes saisies</span>
                  <span className="font-mono">{ficheTotal} / {Number(qte).toLocaleString()} doses</span>
                </div>
              )}

              {/* Lignes de la fiche */}
              <div className="divide-y divide-slate-700/50 max-h-52 overflow-y-auto">
                {ficheTechnique.length === 0 ? (
                  <p className="px-4 py-4 text-xs text-slate-500 text-center italic">
                    Aucun taureau — cliquez «&nbsp;Ajouter&nbsp;» pour renseigner la cuve.
                  </p>
                ) : ficheTechnique.map((row, i) => (
                  <div key={i} className="px-4 py-3 space-y-2">
                    {/* Race (dropdown) */}
                    <div className="relative">
                      <select
                        value={row.race}
                        onChange={e => updateFicheLigne(i, 'race', e.target.value)}
                        className={inputCls}
                      >
                        <option value="" className="bg-slate-800">— Race bovine —</option>
                        {RACES_BOVINES.map(r => (
                          <option key={r} value={r} className="bg-slate-800">{r}</option>
                        ))}
                      </select>
                      <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                    {/* Taureau + NNI */}
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={row.taureau}
                        onChange={e => updateFicheLigne(i, 'taureau', e.target.value)}
                        placeholder="Nom du Taureau"
                        className={inputCls}
                      />
                      <input
                        value={row.nni}
                        onChange={e => updateFicheLigne(i, 'nni', e.target.value)}
                        placeholder="Code NNI"
                        className={inputCls}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          value={row.couleur}
                          onChange={e => updateFicheLigne(i, 'couleur', e.target.value)}
                          className={inputCls}
                        >
                          {COULEURS_PAILLETTE.map(c => (
                            <option key={c} value={c} className="bg-slate-800">{c}</option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                      <input
                        type="number" min="1"
                        value={row.quantite}
                        onChange={e => updateFicheLigne(i, 'quantite', e.target.value)}
                        placeholder="Qté"
                        className="w-20 shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-right font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => removeFicheLigne(i)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lieu de stockage — lecture seule */}
          <div>
            <label className={labelCls}>Lieu de stockage</label>
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2.5">
              <Building2 size={13} className="text-slate-500 shrink-0" />
              <span className="text-sm text-slate-400">{LIEU_STOCKAGE_DEFAUT}</span>
              <span className="ml-auto text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                Par défaut
              </span>
            </div>
          </div>
        </div>

        {/* Récapitulatif si formulaire valide */}
        {valid && fournisseurObj && articleObj && (
          <div className="mx-6 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">Récapitulatif commande</p>
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              {typeIcon(articleType, 11)}
              <span className="flex-1">{articleObj.designation}</span>
              <span className="font-mono font-bold">{Number(qte).toLocaleString()} {uniteMesure}</span>
            </div>
            <p className="text-[11px] text-emerald-400/70 mt-1">
              🌍 {fournisseurObj.nom} · Arrivée le {new Date(dateArrivee).toLocaleDateString("fr-FR")}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-5 pt-3 flex gap-2.5 shrink-0 border-t border-slate-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-800 transition-all">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!valid || loadingLists || saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enregistrement…</>
              : loadingLists
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Chargement…</>
              : <><PlusCircle size={13} /> Créer la commande</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal Conformité ─────────────────────────────────── */
function ModalConformite({ bc, onClose, onSave }) {
  const [resultat, setResultat] = useState(bc.conformite?.resultat ?? "conforme");
  const [note,     setNote]     = useState(bc.conformite?.note     ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ShieldCheck size={15} className="text-blue-600" />
              <p className="text-sm font-bold text-slate-800">Notation de Conformité</p>
            </div>
            <p className="text-xs text-slate-500 font-mono">{bc.id} · {bc.fournisseur}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Contenu du bon · BL {bc.ref_bl}</p>
          <div className="space-y-1">
            {bc.articles.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                {typeIcon(a.type, 12)}
                <span className="flex-1">{a.label}</span>
                <span className="font-mono text-slate-500">{a.qte.toLocaleString()} {a.unite}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Résultat du contrôle</p>
            <div className="flex gap-2">
              <button onClick={() => setResultat("conforme")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all
                  ${resultat === "conforme" ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                <CheckCircle size={13} /> Conforme
              </button>
              <button onClick={() => setResultat("non_conforme")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all
                  ${resultat === "non_conforme" ? "bg-red-600 border-red-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                <XCircle size={13} /> Non conforme
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Observations</p>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Écart de quantité, anomalie, référence du litige…"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700 placeholder:text-slate-400"
              rows={3} />
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all">
            Annuler
          </button>
          <button onClick={() => { onSave(bc.id, resultat, note); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Composant principal ──────────────────────────────── */
/* ─── Impression BC Fournisseur (HTML → Print) ──────────── */
function imprimerBC(bc) {
  const lignes = bc.articles.map(a => {
    const pu   = a.prixAchatUnitaire != null ? Number(a.prixAchatUnitaire) : null;
    const total = pu != null ? (pu * a.qte).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—';
    const puFmt = pu != null ? pu.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—';
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0e8de;">${a.label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0e8de;text-align:center;">${a.qte.toLocaleString('fr-FR')} ${a.unite}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0e8de;text-align:right;">${puFmt} MAD</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0e8de;text-align:right;font-weight:600;">${total} MAD</td>
      </tr>`;
  }).join('');

  const totalGeneral = bc.articles.reduce((s, a) => {
    const pu = a.prixAchatUnitaire != null ? Number(a.prixAchatUnitaire) : 0;
    return s + pu * a.qte;
  }, 0);

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>BC ${bc.id}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 32px; color: #1a1a1a; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #ea580c; padding-bottom: 20px; margin-bottom: 24px; }
  .logo-zone h1 { margin: 0; font-size: 22px; color: #ea580c; letter-spacing: -0.5px; }
  .logo-zone p  { margin: 2px 0 0; color: #6b7280; font-size: 11px; }
  .bc-ref { text-align: right; }
  .bc-ref .num  { font-size: 18px; font-weight: 700; color: #1a1a1a; }
  .bc-ref .date { color: #6b7280; font-size: 11px; margin-top: 4px; }
  .fournisseur-block { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
  .fournisseur-block h3 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #ea580c; }
  .fournisseur-block p  { margin: 3px 0; color: #374151; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #ea580c; color: #fff; }
  thead th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
  thead th:not(:first-child) { text-align: center; }
  thead th:last-child { text-align: right; }
  tbody tr:nth-child(even) { background: #fafafa; }
  .total-row td { padding: 10px 12px; font-weight: 700; font-size: 14px; border-top: 2px solid #ea580c; }
  .signatures { display: flex; justify-content: space-between; margin-top: 40px; gap: 32px; }
  .sig-box { flex: 1; border-top: 1px solid #d1d5db; padding-top: 10px; }
  .sig-box p { margin: 0; font-size: 11px; color: #6b7280; }
  .sig-box .name { margin-top: 32px; font-size: 12px; color: #1a1a1a; font-weight: 600; }
  .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>
  <div class="header">
    <div class="logo-zone">
      <h1>Maroc Lait</h1>
      <p>Hub Central National · Agadir</p>
      <p style="margin-top:6px;font-size:11px;color:#374151;">Bon de Commande Fournisseur</p>
    </div>
    <div class="bc-ref">
      <div class="num">${bc.id}</div>
      <div class="date">Date commande : ${bc.dateCommande || '—'}</div>
      ${bc.dateArrivee ? `<div class="date">Arrivée prévue : ${bc.dateArrivee}</div>` : ''}
    </div>
  </div>

  <div class="fournisseur-block">
    <h3>Fournisseur</h3>
    <p><strong>${bc.pavillon} ${bc.fournisseur}</strong></p>
    <p>Pays : ${bc.pays}</p>
    ${bc.transporteur && bc.transporteur !== '—' ? `<p>Transporteur : ${bc.transporteur}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Désignation</th>
        <th style="text-align:center;">Quantité</th>
        <th style="text-align:right;">Prix unitaire</th>
        <th style="text-align:right;">Montant HT</th>
      </tr>
    </thead>
    <tbody>
      ${lignes}
      <tr class="total-row">
        <td colspan="3" style="text-align:right;color:#ea580c;">TOTAL HT</td>
        <td style="text-align:right;color:#ea580c;">${totalGeneral.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
      </tr>
    </tbody>
  </table>

  <div class="signatures">
    <div class="sig-box">
      <p>Établi par</p>
      <div class="name">Direction Générale · Maroc Lait</div>
    </div>
    <div class="sig-box">
      <p>Lu et approuvé — Fournisseur</p>
      <div class="name">${bc.fournisseur}</div>
    </div>
  </div>

  <div class="footer">Document généré par MLstock · ${new Date().toLocaleDateString('fr-FR')} — Usage interne confidentiel</div>
</body></html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 600);
}

export default function ApprovisionnementsFournisseurs({ userRole, canManageAppro = false }) {
  const [bons,        setBons]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [apiError,    setApiError]    = useState(null);
  const [modal,       setModal]       = useState(null);
  const [showNouveau, setShowNouveau] = useState(false);

  useEffect(() => {
    api.get("/api/approvisionnements?limit=100")
      .then(res => setBons(Array.isArray(res) ? res.map(fromApiAppro) : []))
      .catch(err => setApiError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = userRole === "ADMIN" || canManageAppro;

  /* ─ Conformité — PUT + optimistic update ─────────────── */
  async function handleSave(id, resultat, note) {
    setBons(prev => prev.map(bc =>
      bc.id !== id ? bc : { ...bc, statut: resultat, conformite: { resultat, note } }
    ));
    const target = bons.find(bc => bc.id === id);
    if (target?._id) {
      api.put(`/api/approvisionnements/${target._id}`, {
        statut:     resultat,
        conformite: { resultat, note },
      }).catch(err => setApiError(err.message));
    }
  }

  /* ─ Ajout — POST réel, lève une exception si échec ────── */
  async function handleAjouter(payload) {
    const created = await api.post('/api/approvisionnements', payload);
    setBons(prev => [fromApiAppro(created), ...prev]);
  }

  const counts = {
    prevus:     bons.filter(b => b.statut === "prevu").length,
    enTransit:  bons.filter(b => b.statut === "en_transit").length,
    aQuai:      bons.filter(b => b.statut === "a_quai").length,
    conformes:  bons.filter(b => b.statut === "conforme").length,
    incidents:  bons.filter(b => b.statut === "non_conforme").length,
  };

  const [filtreFournisseur, setFiltreFournisseur] = useState('');
  const [filtreStatut,      setFiltreStatut]      = useState('');
  const [filtreDateD,       setFiltreDateD]       = useState('');
  const [filtreDateF,       setFiltreDateF]       = useState('');

  const bonsFiltres = useMemo(() => bons.filter(b => {
    if (filtreFournisseur && b.fournisseur !== filtreFournisseur) return false;
    if (filtreStatut      && b.statut      !== filtreStatut)      return false;
    if (filtreDateD && b.dateArrivee && b.dateArrivee.slice(0,10) < filtreDateD) return false;
    if (filtreDateF && b.dateArrivee && b.dateArrivee.slice(0,10) > filtreDateF) return false;
    return true;
  }), [bons, filtreFournisseur, filtreStatut, filtreDateD, filtreDateF]);

  const SEL_A = "text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400";

  const colonnesAppro = [
    {
      key: 'id', label: 'N° BC', sortable: true,
      render: (v, row) => (
        <div>
          <p className="text-xs font-bold font-mono text-slate-800">{v}</p>
          {row.ref_bl
            ? <p className="text-[10px] text-slate-400 mt-0.5 font-mono">BL {row.ref_bl}</p>
            : row.statut === 'prevu' && <p className="text-[10px] text-slate-400 mt-0.5">BL à recevoir</p>}
        </div>
      ),
    },
    {
      key: 'fournisseur', label: 'Fournisseur', sortable: true,
      render: (v, row) => (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">{row.pavillon}</span>
            <p className="text-xs font-semibold text-slate-800">{v}</p>
          </div>
          <div className="space-y-0.5">
            {row.articles.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {typeIcon(a.type, 10)}
                <span className="text-[11px] text-slate-500 truncate">{a.label}</span>
                <span className="text-[11px] font-mono text-slate-400 ml-auto shrink-0">{a.qte.toLocaleString()} {a.unite}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      exportValue: row => row.fournisseur,
    },
    {
      key: 'demandeur', label: 'Demandeur', sortable: true,
      render: v => <span className="text-xs text-slate-600">{v}</span>,
    },
    {
      key: 'dateArrivee', label: 'Arrivée prévue', sortable: true,
      render: (_v, row) => {
        const arr = dateRelative(row.dateArrivee);
        return (
          <div>
            <p className={`text-xs font-semibold tabular-nums ${arr.urgent ? 'text-amber-600' : arr.past ? 'text-slate-400' : 'text-slate-700'}`}>
              {arr.label}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Clock size={9} /> {row.transporteur}
            </p>
          </div>
        );
      },
      exportValue: row => row.dateArrivee ? new Date(row.dateArrivee).toLocaleDateString('fr-FR') : '—',
    },
    {
      key: 'montantTotal', label: 'Montant Total', sortable: true, align: 'right',
      render: v => (
        <span className="text-xs font-mono font-semibold text-slate-700">
          {v > 0 ? v.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }) : '—'}
        </span>
      ),
      exportValue: row => row.montantTotal > 0 ? String(row.montantTotal) : '0',
    },
    {
      key: 'statut', label: 'Statut', sortable: true,
      render: v => <StatutBadge statut={v} />,
      exportValue: row => STATUT_META[row.statut]?.label ?? row.statut,
    },
    {
      key: '__a', label: 'Action',
      render: (_v, row) => {
        const termine = row.statut === 'conforme' || row.statut === 'non_conforme';
        return (
          <div className="flex flex-col items-end gap-1.5" onClick={e => e.stopPropagation()}>
            {row.statut === 'prevu' ? (
              <span className="text-[11px] text-slate-400 italic">En attente expédition</span>
            ) : termine ? (
              <button onClick={() => setModal(row)}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 underline underline-offset-2 transition-colors">
                Modifier
              </button>
            ) : (
              <button onClick={() => setModal(row)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-500 transition-all whitespace-nowrap">
                <ShieldCheck size={11} /> Noter conformité
              </button>
            )}
            <button onClick={() => imprimerBC(row)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-600 text-[10px] font-semibold hover:bg-orange-100 transition-colors whitespace-nowrap">
              <Download size={10} /> Télécharger BC
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-5 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Truck size={16} className="text-white" />
              </div>
              <p className="text-base font-bold leading-none">Approvisionnements Fournisseurs</p>
            </div>
            <p className="text-xs text-slate-400 ml-10">Commandes émises par la Direction · Hub Central</p>
          </div>

          {/* Bouton conditionnel ADMIN */}
          {isAdmin ? (
            <button
              onClick={() => setShowNouveau(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all shrink-0"
            >
              <PlusCircle size={14} />
              Nouvelle Commande Fournisseur
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold bg-slate-700 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-full shrink-0">
              <FileText size={11} />
              Consultation uniquement
            </div>
          )}
        </div>

        {/* Compteurs */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[
            { label: "Prévus",     val: counts.prevus,    col: "text-slate-300"   },
            { label: "En transit", val: counts.enTransit, col: "text-blue-300"    },
            { label: "À quai",     val: counts.aQuai,     col: "text-amber-300"   },
            { label: "Conformes",  val: counts.conformes, col: "text-emerald-300" },
            { label: "Litiges",    val: counts.incidents, col: "text-red-300"     },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl px-3 py-2 text-center">
              <p className={`text-xl font-bold tabular-nums ${s.col}`}>{s.val}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <DataGridV2
          columns={colonnesAppro}
          data={bonsFiltres}
          rowKey="id"
          title="Approvisionnements Fournisseurs"
          exportFilename="approvisionnements-fournisseurs"
          loading={loading}
          emptyMessage="Aucune commande fournisseur pour le moment."
          actions={
            <div className="flex flex-wrap items-center gap-1.5" onClick={e => e.stopPropagation()}>
              <select value={filtreFournisseur} onChange={e => setFiltreFournisseur(e.target.value)} className={SEL_A}>
                <option value="">Tout fournisseur</option>
                {[...new Set(bons.map(b => b.fournisseur).filter(Boolean))].sort().map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} className={SEL_A}>
                <option value="">Tout statut</option>
                {Object.entries(STATUT_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <input type="date" value={filtreDateD} onChange={e => setFiltreDateD(e.target.value)} className={SEL_A} />
              <input type="date" value={filtreDateF} onChange={e => setFiltreDateF(e.target.value)} className={SEL_A} />
            </div>
          }
        />
      </div>

      {/* Modal nouvelle commande */}
      {showNouveau && (
        <ModalNouvelleCommande
          onClose={() => setShowNouveau(false)}
          onAjouter={handleAjouter}
        />
      )}

      {/* Modal conformité */}
      {modal && (
        <ModalConformite
          bc={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
