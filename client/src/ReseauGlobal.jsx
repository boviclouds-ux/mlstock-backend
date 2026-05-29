// ReseauGlobal.jsx — Réseau & Acteurs de la chaîne · Section 5
import { useState, useMemo, useEffect } from "react";
import {
  Network, Building2, ShoppingBag, Truck,
  PlusCircle, Search, Pencil, Trash2, X,
  Phone, Mail, MapPin, ChevronDown, ShieldCheck, User,
  AlertTriangle, RefreshCw,
} from "lucide-react";
import { api } from "./lib/api";

/* ─── Régions du Maroc ─────────────────────────────────── */
const REGIONS_MA = [
  "Casablanca-Settat", "Rabat-Salé-Kénitra", "Fès-Meknès",
  "Marrakech-Safi", "Souss-Massa", "Béni Mellal-Khénifra",
  "Oriental", "Tanger-Tétouan-Al Hoceïma", "Drâa-Tafilalet",
  "Guelmim-Oued Noun", "Laâyoune-Sakia El Hamra", "Dakhla-Oued Ed-Dahab",
];

/* ─── Configuration des onglets ────────────────────────── */
const TAB_CONFIG = {
  unites: {
    label: "Unités", icon: Building2, prefix: "UNI",
    fields: [
      { key:"nom",         label:"Nom de l'unité",          placeholder:"ex: Unité Sakia Al Hamra", required:true },
      { key:"type",        label:"Type",                     type:"select", options:["Coopérative","Entreprise","Individu"], required:true },
      { key:"region",      label:"Région",                   type:"select", options:REGIONS_MA, required:true },
      { key:"responsable", label:"Interlocuteur / Responsable", placeholder:"Nom complet", required:true },
      { key:"tel",         label:"Téléphone",                placeholder:"+212 6 XX XX XX XX" },
      { key:"email",       label:"Email",                    placeholder:"responsable@unite.ma" },
    ],
  },
  fournisseurs: {
    label: "Fournisseurs", icon: ShoppingBag, prefix: "FOU",
    fields: [
      { key:"nom",         label:"Nom du fournisseur",  placeholder:"ex: Sunnylodge B.V.", required:true },
      { key:"pays",        label:"Pays d'origine",      placeholder:"ex: Pays-Bas", required:true },
      { key:"pavillon",    label:"Pavillon (drapeau)",   placeholder:"🇳🇱" },
      { key:"specialites", label:"Spécialités",          type:"multicheck", options:["Semences","Consommables","Équipement","Médicaments","Autres"], required:true },
      { key:"responsable", label:"Interlocuteur",        placeholder:"Nom du contact", required:true },
      { key:"tel",         label:"Téléphone",            placeholder:"+XX XX XX XX XX XX" },
      { key:"email",       label:"Email",                placeholder:"contact@fournisseur.com" },
    ],
  },
  transporteurs: {
    label: "Transporteurs", icon: Truck, prefix: "TRP",
    fields: [
      { key:"nom",         label:"Nom de la société",    placeholder:"ex: Trans-Atlas", required:true },
      { key:"type",        label:"Type",                  type:"select", options:["Prestataire Externe","Interne Maroc Lait"], required:true },
      { key:"responsable", label:"Responsable logistique", placeholder:"Nom du responsable", required:true },
      { key:"tel",         label:"Téléphone",             placeholder:"+212 6 XX XX XX XX" },
      { key:"email",       label:"Email",                 placeholder:"logistique@transporteur.ma" },
    ],
  },
};

/* ─── Adaptateurs API ↔ UI pour les Unités ─────────────── */
const TYPE_API_TO_UI = {
  COOPERATIVE:       "Coopérative",
  ENTREPRISE:        "Entreprise",
  PERSONNE_PHYSIQUE: "Individu",
};
const TYPE_UI_TO_API = {
  "Coopérative": "COOPERATIVE",
  "Entreprise":  "ENTREPRISE",
  "Individu":    "PERSONNE_PHYSIQUE",
};

function fromApiUnite(u) {
  return {
    _id:         u._id,
    id:          u.code,
    code:        u.code,
    nom:         u.nom,
    region:      u.region      ?? "",
    type:        TYPE_API_TO_UI[u.type] ?? u.type,
    responsable: u.contact?.nom       ?? "",
    tel:         u.contact?.telephone ?? "",
    email:       u.contact?.email     ?? "",
    actif:       u.actif ?? true,
  };
}

function toApiUnite(code, form) {
  return {
    code,
    nom:     form.nom,
    region:  form.region,
    type:    TYPE_UI_TO_API[form.type] ?? "COOPERATIVE",
    contact: {
      nom:       form.responsable ?? "",
      telephone: form.tel         ?? "",
      email:     form.email       ?? "",
    },
  };
}

/* ─── Adaptateurs Fournisseur ─────────────────────────── */
function fromApiFournisseur(f) {
  // backward compat: old docs may have specialite (string) instead of specialites (array)
  const specialites = Array.isArray(f.specialites) && f.specialites.length > 0
    ? f.specialites
    : f.specialite ? [f.specialite] : ['Autres'];
  return {
    _id:         f._id,
    id:          f.code,
    code:        f.code,
    nom:         f.nom,
    pays:        f.pays        ?? "",
    pavillon:    f.pavillon    ?? "🌍",
    specialites,
    responsable: f.contact?.nom       ?? "",
    tel:         f.contact?.telephone ?? "",
    email:       f.contact?.email     ?? "",
    actif:       f.actif ?? true,
  };
}
function toApiFournisseur(code, form) {
  return {
    code,
    nom:        form.nom,
    pays:       form.pays      ?? "",
    pavillon:   form.pavillon  ?? "🌍",
    specialites: Array.isArray(form.specialites) ? form.specialites : [],
    contact: {
      nom:       form.responsable ?? "",
      telephone: form.tel         ?? "",
      email:     form.email       ?? "",
    },
  };
}

/* ─── Adaptateurs Transporteur ───────────────────────── */
function fromApiTransporteur(t) {
  return {
    _id:         t._id,
    id:          t.code,
    code:        t.code,
    nom:         t.nom,
    type:        t.type        ?? "Prestataire Externe",
    responsable: t.contact?.nom       ?? "",
    tel:         t.contact?.telephone ?? "",
    email:       t.contact?.email     ?? "",
    actif:       t.actif ?? true,
  };
}
function toApiTransporteur(code, form) {
  return {
    code,
    nom:  form.nom,
    type: form.type,
    contact: {
      nom:       form.responsable ?? "",
      telephone: form.tel         ?? "",
      email:     form.email       ?? "",
    },
  };
}

/* ─── Helpers ──────────────────────────────────────────── */
const getFlagEmoji = (code) => {
  if (!code || code.length !== 2) return code;
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return code;
  return upper.replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
};

function nextId(data, prefix) {
  const max = data.reduce((m, d) => Math.max(m, parseInt(d.id.split("-")[1] ?? "0", 10)), 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

const TYPE_UNITE   = { "Coopérative":"bg-emerald-50 text-emerald-700 border-emerald-200", "Entreprise":"bg-blue-50 text-blue-700 border-blue-200", "Individu":"bg-slate-100 text-slate-400 border-slate-200" };
const SPEC_BADGE   = { "Semences":"bg-blue-50 text-blue-700 border-blue-200", "Consommables":"bg-cyan-50 text-cyan-700 border-cyan-200", "Équipement":"bg-violet-50 text-violet-700 border-violet-200", "Médicaments":"bg-rose-50 text-rose-700 border-rose-200", "Autres":"bg-slate-100 text-slate-400 border-slate-200" };
const TYPE_TRP     = { "Interne Maroc Lait":"bg-emerald-50 text-emerald-700 border-emerald-200", "Prestataire Externe":"bg-amber-50 text-amber-700 border-amber-200" };

function badge(map, val) {
  return <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[val] ?? "bg-slate-100 text-slate-400 border-slate-200"}`}>{val}</span>;
}

/* ─── Cellule Coordonnées ──────────────────────────────── */
function Coords({ tel, email }) {
  return (
    <div className="space-y-0.5">
      {tel   && <div className="flex items-center gap-1.5 text-[11px] text-slate-400"><Phone size={10} className="text-slate-400 shrink-0" />{tel}</div>}
      {email && <div className="flex items-center gap-1.5 text-[11px] text-slate-300"><Mail  size={10} className="text-slate-400 shrink-0" /><span className="truncate max-w-[160px]">{email}</span></div>}
      {!tel && !email && <span className="text-[11px] text-slate-400">—</span>}
    </div>
  );
}

/* ─── Boutons d'action (ligne) ─────────────────────────── */
function RowActions({ isAdmin, onEdit, onDelete }) {
  if (!isAdmin) return <span className="w-14 h-7" />;
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button onClick={onEdit}   className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-600 border border-transparent hover:border-amber-200 transition-all"><Pencil size={13}/></button>
      <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50   hover:text-red-600   border border-transparent hover:border-red-200   transition-all"><Trash2 size={13}/></button>
    </div>
  );
}

/* ─── Styles dark formulaire ───────────────────────────── */
const lbl = "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";
const inp = "w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all";

/* ══════════════════════════════════════════════════════════
   MODAL SAISIE (générique, piloté par TAB_CONFIG.fields)
══════════════════════════════════════════════════════════ */
function ModalSaisie({ tab, item, allData, onClose, onSave }) {
  const cfg    = TAB_CONFIG[tab];
  const isEdit = Boolean(item?._id ?? item?.id);

  const initForm = () => {
    const f = {};
    cfg.fields.forEach(field => {
      if (field.type === "multicheck") {
        f[field.key] = Array.isArray(item?.[field.key]) ? item[field.key] : (item?.[field.key] ? [item[field.key]] : []);
      } else {
        f[field.key] = item?.[field.key] ?? (field.type === "select" ? field.options[0] : "");
      }
    });
    return f;
  };

  const [form, setForm] = useState(initForm);
  const set = (k, v) => setForm(p => ({ ...p, [k]: k === "pavillon" ? getFlagEmoji(v) : v }));
  const toggleCheck = (k, val) => setForm(p => {
    const arr = Array.isArray(p[k]) ? p[k] : [];
    return { ...p, [k]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
  });

  const valid = cfg.fields.filter(f => f.required).every(f => {
    if (f.type === "multicheck") return Array.isArray(form[f.key]) && form[f.key].length > 0;
    return String(form[f.key] ?? "").trim();
  });
  const codePreview = isEdit ? item.id : nextId(allData, cfg.prefix);

  function handleSubmit() {
    if (!valid) return;
    onSave({
      _id: item?._id,                                     // ObjectId MongoDB (undefined si nouveau)
      id:  isEdit ? (item.code ?? item.id) : nextId(allData, cfg.prefix),
      ...form,
    });
    onClose();
  }

  const Icon = cfg.icon;

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
              <p className="text-sm font-bold text-white">{isEdit ? `Modifier ${cfg.label.slice(0,-1)}` : `Nouveau ${cfg.label.slice(0,-1)}`}</p>
              <p className="text-[11px] text-slate-300 mt-0.5 font-mono">{codePreview}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-300 transition-colors mt-0.5"><X size={18}/></button>
        </div>

        {/* Champs */}
        <div className="px-6 py-5 space-y-4">
          {/* Grille 2 colonnes pour tel + email (derniers champs) */}
          {cfg.fields.map((field, i) => {
            const isLastPair = i >= cfg.fields.length - 2 && ["tel","email"].includes(field.key);
            if (isLastPair && field.key === "tel") {
              const emailField = cfg.fields.find(f => f.key === "email");
              return (
                <div key="contact-pair" className="grid grid-cols-2 gap-4">
                  {[field, emailField].filter(Boolean).map(f => (
                    <div key={f.key}>
                      <label className={lbl}>{f.label}</label>
                      <input value={form[f.key] ?? ""} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} className={inp} />
                    </div>
                  ))}
                </div>
              );
            }
            if (isLastPair && field.key === "email") return null; // déjà rendu dans la paire

            return (
              <div key={field.key}>
                <label className={lbl}>{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>
                {field.type === "multicheck" ? (
                  <div className="flex flex-wrap gap-2">
                    {field.options.map(opt => {
                      const checked = Array.isArray(form[field.key]) && form[field.key].includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleCheck(field.key, opt)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                            ${checked
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'}`}
                        >
                          <span className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 transition-all
                            ${checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>
                            {checked && <span className="text-[8px] font-black text-white leading-none">✓</span>}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : field.type === "select" ? (
                  <div className="relative">
                    <select value={form[field.key] ?? ""} onChange={e => set(field.key, e.target.value)} className={`${inp} appearance-none`}>
                      {field.options.map(o => <option key={o} value={o} className="bg-slate-800">{o}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"/>
                  </div>
                ) : (
                  <input value={form[field.key] ?? ""} onChange={e => set(field.key, e.target.value)} placeholder={field.placeholder} className={inp} />
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-800 transition-all">Annuler</button>
          <button onClick={handleSubmit} disabled={!valid}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed
              ${isEdit ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"}`}>
            {isEdit ? <><Pencil size={13}/> Enregistrer</> : <><PlusCircle size={13}/> Ajouter</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal Suppression ────────────────────────────────── */
function ModalSupprimer({ item, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-red-900/50 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-400"/>
        </div>
        <p className="text-sm font-bold text-white mb-1">Supprimer cet enregistrement ?</p>
        <p className="text-xs text-slate-400 font-mono mb-1">{item.id}</p>
        <p className="text-xs text-slate-300 font-medium mb-5">{item.nom}</p>
        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-800 transition-all">Annuler</button>
          <button onClick={() => { onConfirm(item.id); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all">Supprimer</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TABLES PAR ONGLET
══════════════════════════════════════════════════════════ */
const rowCls = "px-5 py-3.5 hover:bg-slate-50/60 transition-colors";
const hdr    = "text-[10px] font-bold text-slate-300 uppercase tracking-wider";
const hdrCls = "px-5 py-3 bg-slate-50 border-b border-slate-100";

function TableUnites({ data, isAdmin, onEdit, onDelete }) {
  return (
    <>
      <div className={`grid grid-cols-[1fr_0.8fr_1.1fr_1fr_1.4fr_auto] gap-3 ${hdrCls}`}>
        {["Unité","Type","Région","Responsable","Coordonnées",""].map(h => <p key={h} className={hdr}>{h}</p>)}
      </div>
      <div className="divide-y divide-slate-50">
        {data.map(u => (
          <div key={u.id} className={`grid grid-cols-[1fr_0.8fr_1.1fr_1fr_1.4fr_auto] gap-3 items-center ${rowCls}`}>
            <div><p className="text-xs font-bold text-slate-800">{u.nom}</p><p className="text-[10px] text-slate-400 font-mono">{u.id}</p></div>
            {badge(TYPE_UNITE, u.type)}
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><MapPin size={10} className="text-slate-400 shrink-0"/>{u.region}</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-700"><User size={10} className="text-slate-400 shrink-0"/>{u.responsable}</div>
            <Coords tel={u.tel} email={u.email}/>
            <RowActions isAdmin={isAdmin} onEdit={() => onEdit(u)} onDelete={() => onDelete(u)}/>
          </div>
        ))}
      </div>
    </>
  );
}

function TableFournisseurs({ data, isAdmin, onEdit, onDelete }) {
  return (
    <>
      <div className={`grid grid-cols-[1.4fr_0.8fr_1fr_1fr_1.4fr_auto] gap-3 ${hdrCls}`}>
        {["Fournisseur","Pays","Spécialités","Interlocuteur","Coordonnées",""].map(h => <p key={h} className={hdr}>{h}</p>)}
      </div>
      <div className="divide-y divide-slate-50">
        {data.map(f => (
          <div key={f.id} className={`grid grid-cols-[1.4fr_0.8fr_1fr_1fr_1.4fr_auto] gap-3 items-center ${rowCls}`}>
            <div><p className="text-xs font-bold text-slate-800">{f.nom}</p><p className="text-[10px] text-slate-400 font-mono">{f.id}</p></div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="text-sm shrink-0">{f.pavillon}</span>{f.pays}</div>
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(f.specialites) ? f.specialites : [f.specialites ?? 'Autres']).map(s => (
                <span key={s}>{badge(SPEC_BADGE, s)}</span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-700"><User size={10} className="text-slate-400 shrink-0"/>{f.responsable}</div>
            <Coords tel={f.tel} email={f.email}/>
            <RowActions isAdmin={isAdmin} onEdit={() => onEdit(f)} onDelete={() => onDelete(f)}/>
          </div>
        ))}
      </div>
    </>
  );
}

function TableTransporteurs({ data, isAdmin, onEdit, onDelete }) {
  return (
    <>
      <div className={`grid grid-cols-[1.5fr_1.2fr_1.2fr_1.5fr_auto] gap-3 ${hdrCls}`}>
        {["Transporteur","Type","Responsable logistique","Coordonnées",""].map(h => <p key={h} className={hdr}>{h}</p>)}
      </div>
      <div className="divide-y divide-slate-50">
        {data.map(t => (
          <div key={t.id} className={`grid grid-cols-[1.5fr_1.2fr_1.2fr_1.5fr_auto] gap-3 items-center ${rowCls}`}>
            <div><p className="text-xs font-bold text-slate-800">{t.nom}</p><p className="text-[10px] text-slate-400 font-mono">{t.id}</p></div>
            {badge(TYPE_TRP, t.type)}
            <div className="flex items-center gap-1.5 text-xs text-slate-700"><User size={10} className="text-slate-400 shrink-0"/>{t.responsable}</div>
            <Coords tel={t.tel} email={t.email}/>
            <RowActions isAdmin={isAdmin} onEdit={() => onEdit(t)} onDelete={() => onDelete(t)}/>
          </div>
        ))}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function ReseauGlobal({ userRole }) {
  const [activeTab,     setActiveTab]     = useState("unites");

  // Unités
  const [unites,             setUnites]             = useState([]);
  const [loadingUnites,      setLoadingUnites]      = useState(true);
  const [errorUnites,        setErrorUnites]        = useState(null);

  // Fournisseurs
  const [fournisseurs,       setFournisseurs]       = useState([]);
  const [loadingFournisseurs, setLoadingFournisseurs] = useState(true);
  const [errorFournisseurs,   setErrorFournisseurs]   = useState(null);

  // Transporteurs
  const [transporteurs,      setTransporteurs]      = useState([]);
  const [loadingTransporteurs, setLoadingTransporteurs] = useState(true);
  const [errorTransporteurs,   setErrorTransporteurs]   = useState(null);

  const [recherche,   setRecherche]   = useState("");
  const [modalSaisie, setModalSaisie] = useState(null);
  const [modalSuppr,  setModalSuppr]  = useState(null);
  const [syncError,   setSyncError]   = useState(null);  // erreurs POST/PUT

  const isAdmin = userRole === "ADMIN";

  /* ─ Chargements initiaux ─────────────────────────────── */
  async function fetchUnites() {
    setLoadingUnites(true); setErrorUnites(null);
    try   { const d = await api.get("/api/unites?actif=true"); setUnites(Array.isArray(d) ? d.map(fromApiUnite) : []); }
    catch (err) { setErrorUnites(err.message); }
    finally     { setLoadingUnites(false); }
  }
  async function fetchFournisseurs() {
    setLoadingFournisseurs(true); setErrorFournisseurs(null);
    try   { const d = await api.get("/api/fournisseurs?actif=true"); setFournisseurs(Array.isArray(d) ? d.map(fromApiFournisseur) : []); }
    catch (err) { setErrorFournisseurs(err.message); }
    finally     { setLoadingFournisseurs(false); }
  }
  async function fetchTransporteurs() {
    setLoadingTransporteurs(true); setErrorTransporteurs(null);
    try   { const d = await api.get("/api/transporteurs?actif=true"); setTransporteurs(Array.isArray(d) ? d.map(fromApiTransporteur) : []); }
    catch (err) { setErrorTransporteurs(err.message); }
    finally     { setLoadingTransporteurs(false); }
  }

  useEffect(() => {
    fetchUnites();
    fetchFournisseurs();
    fetchTransporteurs();
  }, []);

  /* ─ Données / loading / erreur selon onglet actif ─────── */
  const dataMap    = { unites, fournisseurs, transporteurs };
  const loadingMap = { unites: loadingUnites, fournisseurs: loadingFournisseurs, transporteurs: loadingTransporteurs };
  const errorMap   = { unites: errorUnites,   fournisseurs: errorFournisseurs,   transporteurs: errorTransporteurs   };
  const refetchMap = { unites: fetchUnites,   fournisseurs: fetchFournisseurs,   transporteurs: fetchTransporteurs   };

  const current       = dataMap[activeTab];
  const isLoadingTab  = loadingMap[activeTab];
  const errorTab      = errorMap[activeTab];

  const filtered = useMemo(() => {
    const q = recherche.toLowerCase();
    return q ? current.filter(d =>
      d.nom?.toLowerCase().includes(q)         ||
      d.responsable?.toLowerCase().includes(q) ||
      d.region?.toLowerCase().includes(q)      ||
      d.pays?.toLowerCase().includes(q)
    ) : current;
  }, [current, recherche]);

  /* ─ Sauvegarde (POST / PUT selon onglet) ─────────────── */
  async function handleSave(item) {
    setSyncError(null);
    try {
      if (activeTab === "unites") {
        if (item._id) {
          const updated = await api.put(`/api/unites/${item._id}`, toApiUnite(item.id, item));
          setUnites(prev => prev.map(u => u._id === updated._id ? fromApiUnite(updated) : u));
        } else {
          const created = await api.post("/api/unites", toApiUnite(item.id, item));
          setUnites(prev => [fromApiUnite(created), ...prev]);
        }
      } else if (activeTab === "fournisseurs") {
        if (item._id) {
          const updated = await api.put(`/api/fournisseurs/${item._id}`, toApiFournisseur(item.id, item));
          setFournisseurs(prev => prev.map(f => f._id === updated._id ? fromApiFournisseur(updated) : f));
        } else {
          const created = await api.post("/api/fournisseurs", toApiFournisseur(item.id, item));
          setFournisseurs(prev => [fromApiFournisseur(created), ...prev]);
        }
      } else {
        if (item._id) {
          const updated = await api.put(`/api/transporteurs/${item._id}`, toApiTransporteur(item.id, item));
          setTransporteurs(prev => prev.map(t => t._id === updated._id ? fromApiTransporteur(updated) : t));
        } else {
          const created = await api.post("/api/transporteurs", toApiTransporteur(item.id, item));
          setTransporteurs(prev => [fromApiTransporteur(created), ...prev]);
        }
      }
    } catch (err) {
      setSyncError(err.message);
    }
  }

  /* ─ Suppression (soft-delete PUT actif:false) ─────────── */
  async function handleDelete(id) {
    setSyncError(null);
    try {
      if (activeTab === "unites") {
        const target = unites.find(u => u.id === id);
        if (!target?._id) return;
        await api.put(`/api/unites/${target._id}`, { actif: false });
        setUnites(prev => prev.filter(u => u.id !== id));
      } else if (activeTab === "fournisseurs") {
        const target = fournisseurs.find(f => f.id === id);
        if (!target?._id) return;
        await api.put(`/api/fournisseurs/${target._id}`, { actif: false });
        setFournisseurs(prev => prev.filter(f => f.id !== id));
      } else {
        const target = transporteurs.find(t => t.id === id);
        if (!target?._id) return;
        await api.put(`/api/transporteurs/${target._id}`, { actif: false });
        setTransporteurs(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      setSyncError(err.message);
    }
  }

  const cfg = TAB_CONFIG[activeTab];
  const tabs = [
    { key:"unites",        label:"Unités",       Icon:Building2  },
    { key:"fournisseurs",  label:"Fournisseurs",  Icon:ShoppingBag},
    { key:"transporteurs", label:"Transporteurs", Icon:Truck      },
  ];

  return (
    <div className="space-y-6">

      {/* En-tête dark */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-5 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
          {isAdmin ? (
            <button
              onClick={() => setModalSaisie({ item: null })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all shrink-0"
            >
              <PlusCircle size={13}/> Ajouter {cfg.label === "Unités" ? "une Unité" : cfg.label === "Fournisseurs" ? "un Fournisseur" : "un Transporteur"}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold bg-slate-700 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-full shrink-0">
              <ShieldCheck size={11}/> Lecture seule
            </div>
          )}
        </div>

        {/* Onglets */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setRecherche(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
                ${activeTab === key
                  ? "bg-white/15 text-white border border-white/20 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"}`}
            >
              <Icon size={13}/> {label}
              <span className={`text-[10px] font-bold tabular-nums ${activeTab === key ? "text-slate-300" : "text-slate-400"}`}>
                {dataMap[key].length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bandeau erreur chargement (onglet actif) */}
      {errorTab && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={15} className="text-red-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-700">Erreur de chargement</p>
              <p className="text-[11px] text-red-500 mt-0.5">{errorTab}</p>
            </div>
          </div>
          <button onClick={refetchMap[activeTab]}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold transition-all shrink-0">
            <RefreshCw size={11} /> Réessayer
          </button>
        </div>
      )}

      {/* Bandeau erreur synchronisation (POST/PUT/DELETE) */}
      {syncError && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={15} className="text-red-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-700">Erreur de synchronisation</p>
              <p className="text-[11px] text-red-500 mt-0.5">{syncError}</p>
            </div>
          </div>
          <button onClick={() => setSyncError(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold transition-all shrink-0">
            <X size={11} /> Fermer
          </button>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="relative">
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
        <input
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder={`Rechercher dans les ${cfg.label.toLowerCase()}…`}
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
      </div>

      {/* Tableau actif */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">

        {/* Spinner — commun aux 3 onglets */}
        {isLoadingTab ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">Chargement des {TAB_CONFIG[activeTab].label.toLowerCase()}…</p>
            <p className="text-xs text-slate-400 mt-1">Connexion à la base de données</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Network size={28} className="text-slate-300 mx-auto mb-3"/>
            <p className="text-sm font-semibold text-slate-300">
              {errorTab ? "Impossible de charger les données" : `Aucun ${TAB_CONFIG[activeTab].label.slice(0,-1).toLowerCase()} enregistré`}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {errorTab ? "Vérifiez que le serveur est démarré." : "Modifiez votre recherche ou ajoutez un enregistrement."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full"><div className="min-w-[560px]">
            {activeTab === "unites"        && <TableUnites        data={filtered} isAdmin={isAdmin} onEdit={item => setModalSaisie({ item })} onDelete={item => setModalSuppr(item)}/>}
            {activeTab === "fournisseurs"   && <TableFournisseurs  data={filtered} isAdmin={isAdmin} onEdit={item => setModalSaisie({ item })} onDelete={item => setModalSuppr(item)}/>}
            {activeTab === "transporteurs"  && <TableTransporteurs data={filtered} isAdmin={isAdmin} onEdit={item => setModalSaisie({ item })} onDelete={item => setModalSuppr(item)}/>}
          </div></div>
        )}

        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            {isLoadingTab ? "Chargement…" : `${filtered.length} enregistrement${filtered.length > 1 ? "s" : ""}${recherche ? ` · filtrés sur ${current.length}` : ""}`}
          </p>
          {!isLoadingTab && (
            <span className="text-[10px] text-slate-400 font-mono">API MongoDB</span>
          )}
        </div>
      </div>

      {/* Modals */}
      {modalSaisie && (
        <ModalSaisie
          tab={activeTab}
          item={modalSaisie.item}
          allData={current}
          onClose={() => setModalSaisie(null)}
          onSave={handleSave}
        />
      )}
      {modalSuppr && (
        <ModalSupprimer
          item={modalSuppr}
          onClose={() => setModalSuppr(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
