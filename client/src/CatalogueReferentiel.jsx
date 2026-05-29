// CatalogueReferentiel.jsx — Master Data des articles · Section 5
import { useState, useMemo, useEffect } from "react";
import {
  Tags, PlusCircle, Search, Pencil, Trash2, X,
  Dna, FlaskConical, Wrench, HeartPulse, ChevronDown,
  AlertTriangle, Package, ShieldCheck, Layers, Check,
  RefreshCw,
} from "lucide-react";
import { api } from "./lib/api";

/* ─── Catégories initiales (UI locale, indépendantes de l'API) ─ */
const CATEGORIES_INIT = [
  { id: 1, nom: "Semences" },
  { id: 2, nom: "Matériel" },
  { id: 3, nom: "Santé"    },
  { id: 4, nom: "Azote"    },
];

const UNITES = [
  { label: "Paillettes",  value: "Paillettes" },
  { label: "Unité (U)",   value: "U"          },
  { label: "Kilogramme",  value: "Kg"         },
  { label: "Litre (L)",   value: "L"          },
  { label: "Doses",       value: "Doses"      },
  { label: "Boîte",       value: "Boîte"      },
];

function defaultUnite(categorie) {
  if (categorie === "Semences") return "Paillettes";
  if (categorie === "Azote")    return "L";
  return "U";
}

/* ─── Adaptateurs API ↔ UI ──────────────────────────────── */
// Normalise un document MongoDB vers la forme attendue par l'UI
function fromApi(a) {
  return {
    _id:         a._id,
    id:          a.code,            // le "code" sert d'identifiant métier visible
    code:        a.code,
    designation: a.designation,
    categorie:   a.categorie,
    unite:       a.uniteMesure,     // renommage API → UI
    uniteMesure: a.uniteMesure,
    prix:        a.valeurEstimee,   // renommage API → UI
    valeurEstimee: a.valeurEstimee,
    seuilAlerte: a.seuilAlerte ?? 0,
    stock:       0,                 // stock géré séparément (MouvementStock)
    actif:       a.actif ?? true,
  };
}

// Normalise les champs UI → payload API (POST / PUT)
function toApi(a) {
  return {
    code:          a.id,
    designation:   a.designation,
    categorie:     a.categorie,
    uniteMesure:   a.unite,
    valeurEstimee: a.prix,
    seuilAlerte:   a.seuilAlerte,
  };
}

/* ─── Helpers ──────────────────────────────────────────── */
function catIcon(nom, sz = 13) {
  if (nom === "Semences") return <Dna          size={sz} className="text-blue-400   shrink-0" />;
  if (nom === "Azote")    return <FlaskConical  size={sz} className="text-cyan-400   shrink-0" />;
  if (nom === "Santé")    return <HeartPulse    size={sz} className="text-rose-400   shrink-0" />;
  if (nom === "Matériel") return <Wrench        size={sz} className="text-slate-400  shrink-0" />;
  return                         <Tags          size={sz} className="text-violet-400 shrink-0" />;
}

const CAT_BADGE = {
  Semences: "bg-blue-50   text-blue-700   border-blue-200",
  Azote:    "bg-cyan-50   text-cyan-700   border-cyan-200",
  Matériel: "bg-slate-100 text-slate-400  border-slate-200",
  Santé:    "bg-rose-50   text-rose-700   border-rose-200",
};

function catBadge(nom) { return CAT_BADGE[nom] ?? "bg-violet-50 text-violet-700 border-violet-200"; }

function catToPrefix(cat) {
  const known = { Semences:"SEM", Matériel:"MAT", Santé:"SAN", Azote:"AZO" };
  if (known[cat]) return known[cat];
  return cat.normalize("NFD").replace(/[̀-ͯ]/g,"")
    .toUpperCase().replace(/[^A-Z]/g,"").slice(0,3).padEnd(3,"X");
}

function nextCode(articles, categorie) {
  const prefix = catToPrefix(categorie);
  const max = articles
    .filter(a => (a.code ?? a.id ?? "").startsWith(prefix + "-"))
    .reduce((m, a) => Math.max(m, parseInt((a.code ?? a.id ?? "").split("-")[1] ?? "0", 10)), 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

/* ─── Styles dark ──────────────────────────────────────── */
const lbl = "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";
const inp = "w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all";

/* ══════════════════════════════════════════════════════════
   MODAL GESTION DES CATÉGORIES
══════════════════════════════════════════════════════════ */
function ModalCategories({ categories, articles, onApply, onClose }) {
  const [cats,    setCats]    = useState(categories.map(c => ({ ...c })));
  const [newNom,  setNewNom]  = useState("");
  const [editId,  setEditId]  = useState(null);
  const [editNom, setEditNom] = useState("");
  const [err,     setErr]     = useState("");

  function countUsage(nom) {
    return articles.filter(a => a.categorie === nom).length;
  }

  function addCat() {
    const nom = newNom.trim();
    if (!nom) return;
    if (cats.some(c => c.nom.toLowerCase() === nom.toLowerCase())) {
      setErr(`"${nom}" existe déjà.`); return;
    }
    const id = Math.max(...cats.map(c => c.id), 0) + 1;
    setCats(p => [...p, { id, nom }]);
    setNewNom(""); setErr("");
  }

  function startEdit(cat) { setEditId(cat.id); setEditNom(cat.nom); setErr(""); }

  function saveEdit() {
    const nom = editNom.trim();
    if (!nom) { setEditId(null); return; }
    if (cats.some(c => c.id !== editId && c.nom.toLowerCase() === nom.toLowerCase())) {
      setErr(`"${nom}" existe déjà.`); return;
    }
    setCats(p => p.map(c => c.id === editId ? { ...c, nom } : c));
    setEditId(null); setEditNom(""); setErr("");
  }

  function deleteCat(cat) {
    const n = countUsage(cat.nom);
    if (n > 0) {
      setErr(`"${cat.nom}" est utilisée par ${n} article${n > 1 ? "s" : ""} — impossible de la supprimer.`);
      return;
    }
    setCats(p => p.filter(c => c.id !== cat.id)); setErr("");
  }

  function handleApply() {
    const renames = {};
    categories.forEach(orig => {
      const updated = cats.find(c => c.id === orig.id);
      if (updated && updated.nom !== orig.nom) renames[orig.nom] = updated.nom;
    });
    onApply(cats, renames);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">

        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Layers size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Gestion des Catégories</p>
              <p className="text-[11px] text-slate-300 mt-0.5">{cats.length} catégorie{cats.length > 1 ? "s" : ""} actives</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-300 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {cats.map(cat => {
            const count    = countUsage(cat.nom);
            const isEditing = editId === cat.id;
            return (
              <div key={cat.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5">
                {catIcon(cat.nom, 13)}

                {isEditing ? (
                  <input
                    value={editNom}
                    onChange={e => setEditNom(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditId(null); }}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium text-white">{cat.nom}</span>
                )}

                <span className={`text-[10px] font-bold tabular-nums shrink-0 ${count > 0 ? "text-slate-400" : "text-slate-400"}`}>
                  {count} art.
                </span>

                {isEditing ? (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={saveEdit}
                      className="w-6 h-6 rounded flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 transition-colors">
                      <Check size={11} className="text-white" />
                    </button>
                    <button onClick={() => { setEditId(null); setErr(""); }}
                      className="w-6 h-6 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 transition-colors">
                      <X size={11} className="text-slate-300" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(cat)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-amber-500/20 hover:text-amber-400 transition-colors">
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => deleteCat(cat)}
                      disabled={count > 0}
                      title={count > 0 ? `${count} article(s) utilisent cette catégorie` : "Supprimer"}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Ajout + Erreur */}
        <div className="px-6 py-4 border-t border-slate-800 shrink-0 space-y-3">
          {err && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertTriangle size={11} className="text-red-400 shrink-0" />
              <p className="text-[11px] text-red-400 leading-snug">{err}</p>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={newNom}
              onChange={e => { setNewNom(e.target.value); setErr(""); }}
              onKeyDown={e => e.key === "Enter" && addCat()}
              placeholder="Nouvelle catégorie…"
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <button onClick={addCat} disabled={!newNom.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all whitespace-nowrap">
              <PlusCircle size={12} /> Ajouter
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-2.5 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-800 transition-all">
            Annuler
          </button>
          <button onClick={handleApply}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all">
            Appliquer les modifications
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL ARTICLE (Add / Edit)
══════════════════════════════════════════════════════════ */
function ModalArticle({ article, articles, categories, onClose, onSave }) {
  // Pour les articles API, isEdit se base sur la présence du _id MongoDB
  const isEdit = Boolean(article?._id ?? article?.id);

  const initialCategorie = article?.categorie ?? (categories[0]?.nom ?? "");
  const [designation, setDesignation] = useState(article?.designation ?? "");
  const [categorie,   setCategorie]   = useState(initialCategorie);
  const [unite,       setUnite]       = useState(article?.unite ?? defaultUnite(initialCategorie));
  const [prix,        setPrix]        = useState(article?.prix != null ? String(article.prix) : "");
  const [seuil,       setSeuil]       = useState(article?.seuilAlerte != null ? String(article.seuilAlerte) : "");
  const [stock,       setStock]       = useState(article?.stock       != null ? String(article.stock)       : "");

  const codePreview = isEdit ? article.id : (categorie ? nextCode(articles, categorie) : "—");

  // Prix est optionnel — validation sans lui
  const valid =
    designation.trim() &&
    categorie &&
    (prix === "" || Number(prix) >= 0) &&
    seuil !== "" && Number(seuil) >= 0 &&
    stock !== "" && Number(stock) >= 0;

  function handleSubmit() {
    if (!valid) return;
    onSave({
      _id:         article?._id,   // ObjectId MongoDB (undefined si nouvel article)
      id:          isEdit ? (article.code ?? article.id) : nextCode(articles, categorie),
      designation: designation.trim(),
      categorie,
      prix:        prix === "" ? null : Number(prix),
      unite,
      seuilAlerte: Number(seuil),
      stock:       Number(stock),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
              ${isEdit ? "bg-amber-500/15 border border-amber-500/30" : "bg-emerald-500/15 border border-emerald-500/30"}`}>
              {isEdit ? <Pencil size={16} className="text-amber-400" /> : <PlusCircle size={16} className="text-emerald-400" />}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{isEdit ? "Modifier l'article" : "Nouvel Article"}</p>
              <p className="text-[11px] text-slate-300 mt-0.5 font-mono">{codePreview}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-300 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Formulaire */}
        <div className="px-6 py-5 space-y-5">

          {/* Désignation */}
          <div>
            <label className={lbl}>Désignation</label>
            <input
              value={designation}
              onChange={e => setDesignation(e.target.value)}
              placeholder="ex: Holstein – BENNER JESUALDO"
              className={inp}
            />
          </div>

          {/* Catégorie — depuis la liste gérée */}
          <div>
            <label className={lbl}>Catégorie</label>
            <div className="relative">
              <select value={categorie} onChange={e => setCategorie(e.target.value)} className={`${inp} appearance-none`}>
                {categories.map(c => (
                  <option key={c.id} value={c.nom} className="bg-slate-800">{c.nom}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
          </div>

          {/* Unité de mesure + Valeur estimée (optionnel) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Unité de Mesure</label>
              <div className="relative">
                <select value={unite} onChange={e => setUnite(e.target.value)} className={`${inp} appearance-none`}>
                  {UNITES.map(u => (
                    <option key={u.value} value={u.value} className="bg-slate-800">{u.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`${lbl} mb-0`}>Valeur unitaire estimée (MAD)</label>
                <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Facultatif
                </span>
              </div>
              <input
                type="number" min="0" step="0.01"
                value={prix}
                onChange={e => setPrix(e.target.value)}
                placeholder="Laisser vide si subventionné"
                className={inp}
              />
            </div>
          </div>

          {/* Seuil d'alerte + Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Seuil d'alerte</label>
              <input type="number" min="0" value={seuil} onChange={e => setSeuil(e.target.value)} placeholder="ex: 50" className={inp} />
            </div>
            <div>
              <label className={lbl}>Stock initial</label>
              <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder="ex: 0" className={inp} />
            </div>
          </div>

          {/* Aperçu code + note subvention */}
          {!isEdit && categorie && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2.5">
                <Tags size={13} className="text-slate-300 shrink-0" />
                <span className="text-xs text-slate-400">Code généré automatiquement :</span>
                <span className="ml-auto text-xs font-bold font-mono text-emerald-400">{codePreview}</span>
              </div>
              {prix === "" && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                  <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-emerald-400">Cet article sera marqué comme <strong>subventionné</strong> (pas de valeur marchande).</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-2.5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-800 transition-all">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={!valid}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed
              ${isEdit ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"}`}>
            {isEdit ? <><Pencil size={13} /> Enregistrer</> : <><PlusCircle size={13} /> Ajouter l'article</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL SUPPRESSION ARTICLE
══════════════════════════════════════════════════════════ */
function ModalSupprimer({ article, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-red-900/50 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-400" />
        </div>
        <p className="text-sm font-bold text-white mb-1">Supprimer l'article ?</p>
        <p className="text-xs text-slate-400 mb-1 font-mono">{article.id}</p>
        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          <span className="text-slate-300 font-medium">{article.designation}</span> sera retiré définitivement du catalogue.
        </p>
        <div className="flex gap-2.5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-800 transition-all">
            Annuler
          </button>
          <button onClick={() => { onConfirm(article.id); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function CatalogueReferentiel({ userRole }) {
  const [articles,    setArticles]    = useState([]);
  const [categories,  setCategories]  = useState(CATEGORIES_INIT);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState(null); // erreurs GET uniquement
  const [apiError,    setApiError]    = useState(null); // erreurs POST/PUT/DELETE
  const [recherche,   setRecherche]   = useState("");
  const [catFiltre,   setCatFiltre]   = useState("Toutes");
  const [modalEdit,   setModalEdit]   = useState(null);
  const [modalSuppr,  setModalSuppr]  = useState(null);
  const [showCatMgr,  setShowCatMgr]  = useState(false);

  const isAdmin = userRole === "ADMIN";

  /* ─ Chargement initial depuis l'API ─────────────────────── */
  async function fetchArticles() {
    setLoading(true);
    setFetchError(null);
    setApiError(null);
    try {
      const data = await api.get("/api/articles?actif=true");
      const liste = Array.isArray(data) ? data : [];
      setArticles(liste.map(fromApi));

      // Synchronise les catégories avec celles présentes dans la DB
      const cats = [...new Set(liste.map(a => a.categorie))].filter(Boolean).sort();
      const merged = CATEGORIES_INIT.map(c => c.nom);
      const extras = cats.filter(c => !merged.includes(c));
      if (extras.length) {
        setCategories(prev => [
          ...prev,
          ...extras.map((nom, i) => ({ id: prev.length + i + 1, nom })),
        ]);
      }
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchArticles(); }, []);

  /* ─ Catégories uniques dans les articles (pour filtres) ─ */
  const filterCats = useMemo(() => {
    const uniques = [...new Set(articles.map(a => a.categorie))].sort();
    return ["Toutes", ...uniques];
  }, [articles]);

  /* ─ Filtrage ─ */
  const filtres = useMemo(() => articles.filter(a => {
    const matchCat = catFiltre === "Toutes" || a.categorie === catFiltre;
    const q        = recherche.toLowerCase();
    const matchQ   = !q || a.designation.toLowerCase().includes(q) || (a.code ?? a.id ?? "").toLowerCase().includes(q);
    return matchCat && matchQ;
  }), [articles, recherche, catFiltre]);

  /* ─ Mutations articles (async avec sync API) ───────────── */
  async function handleSaveArticle(article) {
    setApiError(null);
    try {
      if (article._id) {
        // Modification
        const updated = await api.put(`/api/articles/${article._id}`, toApi(article));
        setArticles(prev => prev.map(a => a._id === updated._id ? fromApi(updated) : a));
      } else {
        // Création
        const created = await api.post("/api/articles", toApi(article));
        setArticles(prev => [fromApi(created), ...prev]);
      }
    } catch (err) {
      setApiError(err.message);
    }
  }

  async function handleSupprimer(id) {
    const target = articles.find(a => a.id === id);
    if (!target?._id) return;
    setApiError(null);
    try {
      // Soft-delete : passe actif à false
      await api.put(`/api/articles/${target._id}`, { actif: false });
      setArticles(prev => prev.filter(a => a.id !== id));
      if (catFiltre !== "Toutes" && !articles.some(a => a.id !== id && a.categorie === catFiltre))
        setCatFiltre("Toutes");
    } catch (err) {
      setApiError(err.message);
    }
  }

  /* ─ Mutations catégories (locales — pas en DB pour l'instant) ─ */
  function handleCatsApply(newCats, renames) {
    setCategories(newCats);
    if (Object.keys(renames).length > 0)
      setArticles(prev => prev.map(a => renames[a.categorie] ? { ...a, categorie: renames[a.categorie] } : a));
    if (catFiltre !== "Toutes" && !newCats.some(c => c.nom === catFiltre))
      setCatFiltre("Toutes");
  }

  /* ─ Stats header ─ */
  const enAlerte     = articles.filter(a => a.seuilAlerte > 0).length; // seuil seul (stock géré ailleurs)
  const subventionnes = articles.filter(a => a.prix == null).length;

  return (
    <div className="space-y-6">

      {/* En-tête dark */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-5 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Tags size={16} className="text-white" />
              </div>
              <p className="text-base font-bold leading-none">Catalogue & Référentiel</p>
            </div>
            <p className="text-xs text-slate-400 ml-10">
              Master Data des articles · {articles.length} référence{articles.length > 1 ? "s" : ""} · {categories.length} catégorie{categories.length > 1 ? "s" : ""}
            </p>
          </div>

          {isAdmin ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowCatMgr(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 text-xs font-bold transition-all"
              >
                <Layers size={13} /> Gérer les Catégories
              </button>
              <button
                onClick={() => setModalEdit("new")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all"
              >
                <PlusCircle size={13} /> Ajouter un Article
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold bg-slate-700 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-full shrink-0">
              <ShieldCheck size={11} /> Lecture seule
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[
            { label: "Semences",      col: "text-blue-300",   val: articles.filter(a => a.categorie === "Semences").length },
            { label: "Matériel",      col: "text-slate-300",  val: articles.filter(a => a.categorie === "Matériel").length },
            { label: "Santé",         col: "text-rose-300",   val: articles.filter(a => a.categorie === "Santé").length    },
            { label: "Subventionnés", col: "text-emerald-300",val: subventionnes                                           },
            { label: "En alerte",     col: "text-amber-300",  val: enAlerte                                                },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl px-3 py-2 text-center">
              <p className={`text-xl font-bold tabular-nums ${s.col}`}>{s.val}</p>
              <p className="text-[10px] text-slate-300 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un article ou un code…"
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filterCats.map(c => (
            <button key={c} onClick={() => setCatFiltre(c)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                ${catFiltre === c
                  ? "bg-slate-800 text-white border-slate-700 shadow-sm"
                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
              {c !== "Toutes" && catIcon(c, 10)}
              {c}
              {c !== "Toutes" && (
                <span className="text-[10px] font-bold tabular-nums text-slate-400">
                  {articles.filter(a => a.categorie === c).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bandeau erreur chargement */}
      {fetchError && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={15} className="text-red-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-700">Impossible de charger le catalogue</p>
              <p className="text-[11px] text-red-500 mt-0.5">{fetchError}</p>
            </div>
          </div>
          <button onClick={fetchArticles}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold transition-all shrink-0">
            <RefreshCw size={11} /> Réessayer
          </button>
        </div>
      )}

      {/* Bandeau erreur synchronisation (POST/PUT/DELETE uniquement) */}
      {apiError && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={15} className="text-red-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-700">Erreur de synchronisation</p>
              <p className="text-[11px] text-red-500 mt-0.5">{apiError}</p>
            </div>
          </div>
          <button onClick={() => setApiError(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold transition-all shrink-0">
            <X size={11} /> Fermer
          </button>
        </div>
      )}

      {/* Tableau */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full"><div className="min-w-[680px]">
        <div className="grid grid-cols-[1fr_2.5fr_1fr_0.9fr_0.7fr_1fr_auto] gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
          {["Code", "Désignation", "Catégorie", "Valeur", "Unité de Mesure", "Seuil alerte", ""].map(h => (
            <p key={h} className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        <div className="divide-y divide-slate-50">
          {/* État chargement */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">Chargement du catalogue…</p>
              <p className="text-xs text-slate-400 mt-1">Connexion à la base de données</p>
            </div>
          ) : filtres.length === 0 ? (
            <div className="py-16 text-center">
              <Package size={28} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">
                {fetchError ? "Impossible de charger le catalogue" : "Aucun article dans le catalogue"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {fetchError ? "Vérifiez que le serveur est démarré." : "Modifiez vos filtres ou ajoutez un article."}
              </p>
            </div>
          ) : filtres.map(article => (
            <div key={article._id ?? article.id}
              className="grid grid-cols-[1fr_2.5fr_1fr_0.9fr_0.7fr_1fr_auto] gap-3 items-center px-5 py-3.5 hover:bg-slate-50/60 transition-colors">

              {/* Code */}
              <p className="text-xs font-bold font-mono text-slate-700">{article.code ?? article.id}</p>

              {/* Désignation */}
              <div className="flex items-center gap-2 min-w-0">
                {catIcon(article.categorie)}
                <p className="text-xs font-medium text-slate-800 truncate">{article.designation}</p>
              </div>

              {/* Catégorie */}
              <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${catBadge(article.categorie)}`}>
                {article.categorie}
              </span>

              {/* Valeur estimée (valeurEstimee / prix) — badge "Subventionné" si null */}
              {article.valeurEstimee != null ? (
                <p className="text-xs font-semibold text-slate-700 tabular-nums">
                  {article.valeurEstimee.toLocaleString()} <span className="text-slate-400 font-normal text-[10px]">MAD</span>
                </p>
              ) : (
                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  Subventionné
                </span>
              )}

              {/* Unité de Mesure (uniteMesure / unite) */}
              <p className="text-xs text-slate-300 font-mono">{article.uniteMesure ?? article.unite}</p>

              {/* Seuil d'alerte */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold tabular-nums text-slate-300">
                  {article.seuilAlerte}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isAdmin ? (
                  <>
                    <button onClick={() => setModalEdit(article)} title="Modifier"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-600 border border-transparent hover:border-amber-200 transition-all">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setModalSuppr(article)} title="Désactiver"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </>
                ) : <span className="w-14 h-7" />}
              </div>
            </div>
          ))}
        </div>
        </div></div>

        {!loading && filtres.length > 0 && (
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              {filtres.length} article{filtres.length > 1 ? "s" : ""}
              {catFiltre !== "Toutes" || recherche ? ` · filtrés sur ${articles.length}` : ""}
              {" · "}<span className="text-slate-400 font-mono">API MongoDB</span>
            </p>
            {subventionnes > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <ShieldCheck size={11} />
                {subventionnes} subventionné{subventionnes > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Modal gestionnaire de catégories */}
      {showCatMgr && (
        <ModalCategories
          categories={categories}
          articles={articles}
          onApply={handleCatsApply}
          onClose={() => setShowCatMgr(false)}
        />
      )}

      {/* Modal add / edit article */}
      {modalEdit && (
        <ModalArticle
          article={modalEdit === "new" ? null : modalEdit}
          articles={articles}
          categories={categories}
          onClose={() => setModalEdit(null)}
          onSave={handleSaveArticle}
        />
      )}

      {/* Modal suppression article */}
      {modalSuppr && (
        <ModalSupprimer
          article={modalSuppr}
          onClose={() => setModalSuppr(null)}
          onConfirm={handleSupprimer}
        />
      )}
    </div>
  );
}
