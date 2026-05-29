// ConfigurationGenerale.jsx — Administration Système · Section 5
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./lib/api.js";
import { METHODE_LABELS, METHODE_BADGE } from "./lib/inventoryValuation.js";
import {
  Archive, RefreshCw, Database, ShieldCheck,
  Bell, Wrench, AlertTriangle, Download, X,
  CheckCircle, Clock, Lock, ChevronDown, Zap,
  Save, WifiOff, TrendingUp, FileText, Image, UploadCloud,
} from "lucide-react";
import { clearBrandingCache } from "./lib/pdfBranding.js";

/* ══════════════════════════════════════════════════════════
   TOGGLE
══════════════════════════════════════════════════════════ */
function Toggle({ value, onChange, label, description, danger = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-200 leading-none">{label}</p>
        {description && <p className="text-[11px] text-slate-300 mt-1 leading-snug">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 mt-0.5 focus:outline-none
          ${value ? (danger ? "bg-red-500" : "bg-emerald-500") : "bg-slate-600"}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200
          ${value ? "translate-x-[18px]" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CARTE
══════════════════════════════════════════════════════════ */
function Card({ icon: Icon, iconBg, title, subtitle, children }) {
  return (
    <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3 pb-3 border-b border-slate-700/50">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={17}/>
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">{title}</p>
          {subtitle && <p className="text-[11px] text-slate-300 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-4 flex-1">
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL DOUBLE VALIDATION
══════════════════════════════════════════════════════════ */
function ModalSecurite({ action, onClose, onConfirm }) {
  const [checked, setChecked] = useState(false);
  const [code,    setCode]    = useState("");
  const isDanger = action.type === "danger";
  const valid    = checked && code.length === 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">

        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
              ${isDanger ? "bg-red-500/15 border border-red-500/30" : "bg-amber-500/15 border border-amber-500/30"}`}>
              <action.Icon size={18} className={isDanger ? "text-red-400" : "text-amber-400"}/>
            </div>
            <div>
              <p className="text-sm font-bold text-white">{action.titre}</p>
              <p className="text-[11px] text-slate-300 mt-0.5">{action.sousTitre}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors mt-0.5">
            <X size={18}/>
          </button>
        </div>

        {/* Avertissement */}
        <div className={`mx-6 mt-5 flex items-start gap-3 rounded-xl px-4 py-3
          ${isDanger ? "bg-red-500/10 border border-red-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
          <AlertTriangle size={14} className={`${isDanger ? "text-red-400" : "text-amber-400"} shrink-0 mt-0.5`}/>
          <p className={`text-[11px] leading-relaxed ${isDanger ? "text-red-300" : "text-amber-300"}`}>
            {action.avertissement}
          </p>
        </div>

        {/* Étapes */}
        <div className="px-6 py-5 space-y-5">
          {/* Étape 1 */}
          <div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Étape 1 · Prise de connaissance
            </p>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                onClick={() => setChecked(v => !v)}
                className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center shrink-0 border-2 transition-all
                  ${checked ? "bg-emerald-500 border-emerald-500" : "border-slate-600 group-hover:border-emerald-400"}`}
              >
                {checked && <CheckCircle size={10} className="text-white" strokeWidth={3}/>}
              </div>
              <span className="text-xs text-slate-300 leading-relaxed">{action.confirmLabel}</span>
            </label>
          </div>

          {/* Étape 2 */}
          <div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              Étape 2 · Code de sécurité Admin
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="• • • • • •"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg text-white text-center tracking-[0.5em] font-mono placeholder:text-slate-700 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              Entrez n'importe quel code à 6 chiffres (démonstration)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-2.5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-800 transition-all">
            Annuler
          </button>
          <button
            onClick={() => { if (valid) { onConfirm(); onClose(); } }}
            disabled={!valid}
            className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-35 disabled:cursor-not-allowed
              ${isDanger ? "bg-red-600 hover:bg-red-500" : "bg-amber-600 hover:bg-amber-500"}`}
          >
            {action.labelConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles communs dark ──────────────────────────────── */
const inpDark = "w-full bg-slate-700/60 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all";
const lbl     = "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function ConfigurationGenerale({ userRole }) {
  const navigate = useNavigate();

  /* ─ État Campagne ─ */
  const [campagneStatut,  setCampagneStatut]  = useState("active");  // active | cloturee

  /* ─ État Backups ─ */
  const [backupFreq,      setBackupFreq]      = useState("Quotidien");
  const [backupLoad,      setBackupLoad]      = useState(false);
  const [restoreLoad,     setRestoreLoad]     = useState(false);
  const [derniereBackup,  setDerniereBackup]  = useState("—");
  const restoreInputRef = useRef(null);

  /* ─ État OTP / Sécurité ─ */
  const [otpDuree,        setOtpDuree]        = useState("300");
  const [authForte,       setAuthForte]       = useState(true);

  /* ─ État Maintenance / Notifs ─ */
  const [maintenance,     setMaintenance]     = useState(false);
  const [alertesSMS,      setAlertesSMS]      = useState(true);

  /* ─ Modal ─ */
  const [modalAction,     setModalAction]     = useState(null);

  /* ─ Valorisation financière ─ */
  const [methodeValo,     setMethodeValo]     = useState('CUMP');
  const [valoLoading,     setValoLoading]     = useState(false);
  const [valoSaved,       setValoSaved]       = useState(false);

  /* ─ Marque Blanche / PDF ─ */
  const [pdfNom,          setPdfNom]          = useState('');
  const [pdfSlogan,       setPdfSlogan]       = useState('');
  const [pdfPiedDePage,   setPdfPiedDePage]   = useState('');
  const [pdfLogoUrl,      setPdfLogoUrl]      = useState('');
  const [pdfLoading,      setPdfLoading]      = useState(false);
  const [pdfSaved,        setPdfSaved]        = useState(false);

  useEffect(() => {
    api.get('/api/configuration')
      .then(cfg => {
        if (cfg?.methodeValorisation)  setMethodeValo(cfg.methodeValorisation);
        if (cfg?.frequenceBackup)      setBackupFreq(cfg.frequenceBackup);
        if (cfg?.derniereBackup) {
          const d = new Date(cfg.derniereBackup);
          setDerniereBackup(
            `${d.toLocaleDateString('fr-FR')} à ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
          );
        }
        if (cfg?.nomEntreprise)        setPdfNom(cfg.nomEntreprise);
        if (cfg?.slogan)               setPdfSlogan(cfg.slogan);
        if (cfg?.piedDePage)           setPdfPiedDePage(cfg.piedDePage);
        if (cfg?.logoUrl)              setPdfLogoUrl(cfg.logoUrl);
      })
      .catch(() => {});
  }, []);

  async function handleSaveValo() {
    setValoLoading(true);
    try {
      await api.put('/api/configuration', { methodeValorisation: methodeValo });
      setValoSaved(true);
      setTimeout(() => setValoSaved(false), 3000);
    } catch (err) {
      showFeedback(err.message ?? 'Erreur lors de la sauvegarde.', 'error');
    } finally {
      setValoLoading(false);
    }
  }

  async function handleSavePdf() {
    setPdfLoading(true);
    try {
      await api.put('/api/configuration', {
        nomEntreprise: pdfNom.trim(),
        slogan:        pdfSlogan.trim(),
        piedDePage:    pdfPiedDePage.trim(),
        logoUrl:       pdfLogoUrl.trim(),
      });
      clearBrandingCache();
      setPdfSaved(true);
      setTimeout(() => setPdfSaved(false), 3000);
    } catch (err) {
      showFeedback(err.message ?? 'Erreur lors de la sauvegarde.', 'error');
    } finally {
      setPdfLoading(false);
    }
  }

  function handleLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPdfLogoUrl(ev.target.result ?? '');
    reader.readAsDataURL(file);
  }

  /* ─ Handlers Backup / Restore ─ */
  async function handleBackup() {
    setBackupLoad(true);
    try {
      const token   = localStorage.getItem('mlstock_token');
      const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://mlstock-backend-2.onrender.com';

      const res = await fetch(`${baseUrl}/api/backup/generate`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? `Erreur ${res.status}`);
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const cd   = res.headers.get('Content-Disposition') ?? '';
      const match = cd.match(/filename="?([^";\n]+)"?/);
      a.download = match ? match[1] : `boviclouds_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);

      const now = new Date();
      setDerniereBackup(
        `${now.toLocaleDateString('fr-FR')} à ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      );
      showFeedback('Backup généré et téléchargé avec succès.', 'success');
    } catch (err) {
      showFeedback(err.message ?? 'Erreur lors de la génération du backup.', 'error');
    } finally {
      setBackupLoad(false);
    }
  }

  async function handleRestoreConfirmed(file) {
    setRestoreLoad(true);
    try {
      const text   = await file.text();
      const backup = JSON.parse(text);
      const result = await api.post('/api/backup/restore', backup);
      showFeedback(`Restauration terminée — ${Object.keys(result.results ?? {}).length} collections restaurées.`, 'success');
    } catch (err) {
      showFeedback(err.message ?? 'Erreur lors de la restauration.', 'error');
    } finally {
      setRestoreLoad(false);
    }
  }

  function handleRestoreFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';  // reset so same file can be picked again
    setModalAction({
      type:         'danger',
      Icon:         AlertTriangle,
      titre:        'Restaurer une Sauvegarde',
      sousTitre:    `Fichier : ${file.name} — opération irréversible`,
      avertissement: 'Cette opération va ÉCRASER DÉFINITIVEMENT toutes les données actuelles (comptes utilisateurs, stocks, transactions, configurations…) par celles du fichier sélectionné. Aucune récupération ne sera possible après confirmation.',
      confirmLabel: 'Je confirme avoir pris connaissance que TOUTES les données actuelles seront remplacées par celles de cette sauvegarde et que cette action est totalement irréversible.',
      labelConfirm: 'Restaurer la sauvegarde',
      onConfirm:    () => handleRestoreConfirmed(file),
    });
  }

  /* ─ Feedback temporaire ─ */
  const [feedback, setFeedback] = useState(null);
  function showFeedback(message, type = "success") {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleCloturer() {
    try {
      await api.patch("/api/quotas/cloturer");
      setCampagneStatut("cloturee");
      navigate("/quotas");
    } catch (err) {
      showFeedback(err.message ?? "Erreur lors de la clôture.", "error");
    }
  }

  async function handleReinitialiser() {
    try {
      await api.patch("/api/quotas/reinitialiser");
      navigate("/quotas");
    } catch (err) {
      showFeedback(err.message ?? "Erreur lors de la réinitialisation.", "error");
    }
  }

  /* ─ Définitions des actions sécurisées ─ */
  const ACTION_CLOTURER = {
    type: "warning",
    Icon: Archive,
    titre: "Clôturer la Campagne",
    sousTitre: "Campagne 2025-2026 — irréversible",
    avertissement: "Cette action va archiver l'ensemble des données de la campagne en cours, figer les compteurs de quotas et verrouiller les saisies. Une fois exécutée, cette opération ne peut pas être annulée.",
    confirmLabel: "Je confirme avoir pris connaissance des conséquences et j'autorise la clôture définitive de la campagne 2025-2026.",
    labelConfirm: "Clôturer la Campagne",
    onConfirm: handleCloturer,
  };

  const ACTION_REINIT = {
    type: "danger",
    Icon: RefreshCw,
    titre: "Réinitialiser les Quotas",
    sousTitre: "Remise à zéro complète — irréversible",
    avertissement: "Cette action va remettre à ZÉRO tous les compteurs de quotas pour l'ensemble des unités. Toutes les données de consommation de la campagne seront effacées définitivement.",
    confirmLabel: "Je confirme vouloir effacer TOUS les compteurs de quotas pour préparer la nouvelle campagne.",
    labelConfirm: "Réinitialiser les Quotas",
    onConfirm: handleReinitialiser,
  };

  return (
    <div className="space-y-5">

      {/* Toast feedback API */}
      {feedback && (
        <div className={`flex items-center gap-3 rounded-2xl px-5 py-3 border text-sm font-semibold
          ${feedback.type === "error"
            ? "bg-red-900/40 border-red-700/60 text-red-300"
            : "bg-emerald-900/40 border-emerald-700/60 text-emerald-300"}`}>
          {feedback.type === "error" ? <AlertTriangle size={15} className="shrink-0"/> : <CheckCircle size={15} className="shrink-0"/>}
          {feedback.message}
        </div>
      )}

      {/* En-tête dark */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <Wrench size={16} className="text-white"/>
          </div>
          <div>
            <p className="text-base font-bold leading-none">Configuration Générale</p>
            <p className="text-xs text-slate-400 mt-0.5">Gouvernance & Administration Système · Maroc Lait</p>
          </div>
        </div>
      </div>

      {/* Bannière maintenance */}
      {maintenance && (
        <div className="flex items-center gap-3 bg-red-900/40 border border-red-700/60 rounded-2xl px-5 py-3">
          <WifiOff size={16} className="text-red-400 shrink-0"/>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-300">Mode Maintenance Actif</p>
            <p className="text-xs text-red-400/80">Une bannière d'alerte est visible pour toutes les Unités connectées.</p>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-300 bg-red-500/20 border border-red-500/30 px-2.5 py-1 rounded-full animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"/>EN COURS
          </span>
        </div>
      )}

      {/* Grille 2×2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ─ CARTE 1 : Campagnes & Quotas ─────────────────── */}
        <Card
          icon={Archive}
          iconBg="bg-amber-500/15 border border-amber-500/30 text-amber-400"
          title="Campagnes & Quotas"
          subtitle="Gestion du cycle annuel d'approvisionnement"
        >
          {/* Statut campagne */}
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3">
            <div>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Exercice en cours</p>
              <p className="text-sm font-bold text-white mt-0.5">Campagne 2025-2026</p>
            </div>
            {campagneStatut === "active" ? (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"/>EN COURS
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-700 border border-slate-600 px-2.5 py-1 rounded-full">
                <Archive size={10}/> CLÔTURÉE
              </span>
            )}
          </div>

          {/* Actions */}
          {campagneStatut === "active" ? (
            <div className="space-y-2.5">
              <button
                onClick={() => setModalAction(ACTION_CLOTURER)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600/20 border border-amber-600/40 text-amber-300 text-xs font-bold hover:bg-amber-600/30 transition-all"
              >
                <Archive size={13}/> Clôturer la Campagne
              </button>
              <button
                onClick={() => setModalAction(ACTION_REINIT)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600/20 border border-red-600/40 text-red-300 text-xs font-bold hover:bg-red-600/30 transition-all"
              >
                <RefreshCw size={13}/> Réinitialiser les Quotas
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5">
              <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-0.5"/>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                La campagne est clôturée. Les données sont archivées et les compteurs figés.
                Pour démarrer un nouvel exercice, contactez la Direction IT.
              </p>
            </div>
          )}
        </Card>

        {/* ─ CARTE 2 : Sauvegardes & Données ──────────────── */}
        <Card
          icon={Database}
          iconBg="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
          title="Sauvegardes & Données"
          subtitle="Gestion des snapshots MongoDB"
        >
          {/* Dernière sauvegarde */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock size={12} className="text-emerald-400 shrink-0"/>
            <span>Dernière sauvegarde réussie :</span>
            <span className="text-emerald-300 font-semibold">{derniereBackup}</span>
          </div>

          {/* Fréquence */}
          <div>
            <label className={lbl}>Fréquence des backups automatiques</label>
            <div className="relative">
              <select
                value={backupFreq}
                onChange={e => setBackupFreq(e.target.value)}
                className={`${inpDark} appearance-none`}
              >
                {["Quotidien", "Hebdomadaire", "Mensuel"].map(f => (
                  <option key={f} value={f} className="bg-slate-800">{f}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"/>
            </div>
          </div>

          {/* Bouton backup */}
          <button
            onClick={handleBackup}
            disabled={backupLoad || restoreLoad}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold transition-all"
          >
            {backupLoad ? (
              <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Génération en cours…</>
            ) : (
              <><Download size={13}/> Générer un Backup Immédiat</>
            )}
          </button>

          <p className="text-[10px] text-slate-400 -mt-1">
            Snapshot complet des 10 collections MongoDB · Fichier JSON signé
          </p>

          {/* Séparateur + bouton restauration */}
          <div className="border-t border-slate-700/50 pt-3 space-y-2">
            <button
              onClick={() => restoreInputRef.current?.click()}
              disabled={backupLoad || restoreLoad}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-600 text-slate-400 text-xs font-semibold hover:border-amber-500/50 hover:text-amber-300 disabled:opacity-60 transition-all"
            >
              {restoreLoad ? (
                <><span className="w-3.5 h-3.5 border-2 border-slate-400/30 border-t-slate-300 rounded-full animate-spin"/>Restauration en cours…</>
              ) : (
                <><UploadCloud size={13}/> Restaurer une sauvegarde (.json)</>
              )}
            </button>
            <input
              ref={restoreInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleRestoreFileSelect}
            />
            <p className="text-[10px] text-slate-400 text-center">
              Remplace intégralement les données actuelles — action irréversible
            </p>
          </div>
        </Card>

        {/* ─ CARTE 3 : Sécurité & OTP ──────────────────────── */}
        <Card
          icon={ShieldCheck}
          iconBg="bg-violet-500/15 border border-violet-500/30 text-violet-400"
          title="Sécurité & Protocole OTP"
          subtitle="Authentification forte et codes de validation"
        >
          {/* Durée OTP */}
          <div>
            <label className={lbl}>Durée de validité des codes OTP (secondes)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="60"
                max="900"
                step="30"
                value={otpDuree}
                onChange={e => setOtpDuree(e.target.value)}
                className={`${inpDark} text-center font-mono text-lg w-32 shrink-0`}
              />
              <div className="flex-1">
                <p className="text-xs text-slate-300 font-medium">{Math.floor(Number(otpDuree) / 60)} min {Number(otpDuree) % 60 > 0 ? `${Number(otpDuree) % 60} sec` : ""}</p>
                <p className="text-[10px] text-slate-300 mt-0.5">Recommandé : 300 sec (5 min)</p>
              </div>
            </div>
            <input type="range" min="60" max="900" step="30" value={otpDuree} onChange={e => setOtpDuree(e.target.value)}
              className="w-full mt-2 accent-violet-500 cursor-pointer"/>
          </div>

          <div className="border-t border-slate-700/60 pt-3">
            <Toggle
              value={authForte}
              onChange={setAuthForte}
              label="Authentification forte pour les transferts"
              description="Exige un code OTP Admin pour valider tout ordre de transfert inter-unités supérieur au seuil critique."
            />
          </div>

          {!authForte && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 -mt-2">
              <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5"/>
              <p className="text-[11px] text-amber-300 leading-snug">Attention : désactiver l'auth forte réduit le niveau de sécurité des transferts critiques.</p>
            </div>
          )}
        </Card>

        {/* ─ CARTE 4 : Notifications & Maintenance ─────────── */}
        <Card
          icon={Bell}
          iconBg="bg-blue-500/15 border border-blue-500/30 text-blue-400"
          title="Notifications & Maintenance"
          subtitle="Alertes opérationnelles et fenêtres de maintenance"
        >
          <Toggle
            value={maintenance}
            onChange={setMaintenance}
            label="Mode Maintenance"
            description="Affiche une bannière d'alerte bloquante pour toutes les Unités connectées. Désactivez dès la fin des travaux."
            danger
          />

          {maintenance && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 -mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0"/>
              <p className="text-[11px] text-red-300 font-medium">Bannière active — visible par toutes les Unités</p>
            </div>
          )}

          <div className="border-t border-slate-700/60 pt-3">
            <Toggle
              value={alertesSMS}
              onChange={setAlertesSMS}
              label="Alertes de stock critique par SMS"
              description="Envoie un SMS automatique aux magasiniers et à la Direction lorsqu'un article passe sous son seuil d'alerte."
            />
          </div>

          {/* Bouton sauvegarder la config */}
          <button className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 text-xs font-bold transition-all">
            <Save size={13}/> Sauvegarder la configuration
          </button>
        </Card>
      </div>

      {/* ─ CARTE FINANCE : Valorisation de l'Inventaire ──── */}
      <Card
        icon={TrendingUp}
        iconBg="bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
        title="Finance — Méthode de Valorisation de l'Inventaire"
        subtitle="Règle comptable appliquée au calcul du coût du stock (CUMP / FIFO / LIFO)"
      >
        {/* Sélecteur méthode */}
        <div>
          <label className={lbl}>Méthode active de valorisation</label>
          <div className="relative">
            <select
              value={methodeValo}
              onChange={e => { setMethodeValo(e.target.value); setValoSaved(false); }}
              className={`${inpDark} appearance-none`}
            >
              {Object.entries(METHODE_LABELS).map(([k, v]) => (
                <option key={k} value={k} className="bg-slate-800">{v}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"/>
          </div>
        </div>

        {/* Explication de la méthode choisie */}
        <div className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 border ${METHODE_BADGE[methodeValo]?.bg ?? 'bg-slate-900/50'} ${METHODE_BADGE[methodeValo]?.border ?? 'border-slate-700'}`}>
          <TrendingUp size={13} className={`shrink-0 mt-0.5 ${METHODE_BADGE[methodeValo]?.text ?? 'text-slate-400'}`}/>
          <p className={`text-[11px] leading-relaxed font-medium ${METHODE_BADGE[methodeValo]?.text ?? 'text-slate-300'}`}>
            {methodeValo === 'CUMP' && <>Tous les lots d'un article partagent le même coût unitaire moyen pondéré. Méthode la plus simple et la plus répandue.</>}
            {methodeValo === 'FIFO' && <>Les lots les plus anciens sont supposés sortis en premier. Le stock restant est valorisé aux prix des acquisitions les plus récentes — favorise la valeur de marché actuelle.</>}
            {methodeValo === 'LIFO' && <>Les lots les plus récents sont supposés sortis en premier. Le stock restant est valorisé aux prix historiques les plus anciens — réduit l'impact inflationniste sur le résultat.</>}
          </p>
        </div>

        {/* Impact comptable */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { m: 'CUMP', label: 'Coût moyen',    detail: 'Simplicité comptable' },
            { m: 'FIFO', label: 'Coût récent',   detail: 'Valeur bilan élevée en inflation' },
            { m: 'LIFO', label: 'Coût historique', detail: 'Résultat fiscal optimisé' },
          ].map(({ m, label, detail }) => (
            <div key={m}
              onClick={() => { setMethodeValo(m); setValoSaved(false); }}
              className={`cursor-pointer rounded-xl px-2 py-2.5 border transition-all
                ${methodeValo === m
                  ? `${METHODE_BADGE[m].bg} ${METHODE_BADGE[m].border} ring-1 ring-offset-0 ${METHODE_BADGE[m].border}`
                  : 'bg-slate-900/40 border-slate-700 hover:border-slate-500'}`}>
              <p className={`text-xs font-bold ${methodeValo === m ? METHODE_BADGE[m].text : 'text-slate-300'}`}>{m}</p>
              <p className={`text-[10px] font-semibold mt-0.5 ${methodeValo === m ? METHODE_BADGE[m].text : 'text-slate-400'}`}>{label}</p>
              <p className="text-[9px] text-slate-300 mt-0.5 leading-tight">{detail}</p>
            </div>
          ))}
        </div>

        {/* Bouton Sauvegarder */}
        <button
          onClick={handleSaveValo}
          disabled={valoLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold transition-all"
        >
          {valoLoading ? (
            <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Enregistrement…</>
          ) : valoSaved ? (
            <><CheckCircle size={13}/> Méthode enregistrée !</>
          ) : (
            <><Save size={13}/> Appliquer la méthode {methodeValo}</>
          )}
        </button>
        <p className="text-[10px] text-slate-400 -mt-1 text-center">
          La modification est appliquée immédiatement à toutes les vues de valorisation de l'inventaire.
        </p>
      </Card>

      {/* ─ CARTE PDF : Personnalisation des Documents ──────── */}
      <Card
        icon={FileText}
        iconBg="bg-rose-500/15 border border-rose-500/30 text-rose-400"
        title="Personnalisation des Documents (PDF)"
        subtitle="Marque blanche — en-tête et pied de page de tous les exports"
      >
        {/* Aperçu logo */}
        {pdfLogoUrl && (
          <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3">
            <img src={pdfLogoUrl} alt="Logo" className="max-h-12 max-w-[160px] object-contain rounded" />
            <button onClick={() => setPdfLogoUrl('')}
              className="ml-auto text-slate-300 hover:text-red-400 transition-colors">
              <X size={14}/>
            </button>
          </div>
        )}

        {/* Upload ou URL logo */}
        <div>
          <label className={lbl}>Logo (URL ou fichier)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={pdfLogoUrl}
              onChange={e => setPdfLogoUrl(e.target.value)}
              placeholder="https://… ou laisser vide"
              className={`${inpDark} flex-1`}
            />
            <label className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-700/60 border border-slate-600 text-slate-300 text-xs font-semibold cursor-pointer hover:bg-slate-600 transition-all">
              <Image size={13}/> Importer
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
            </label>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Formats acceptés : PNG, JPG, SVG · Converti en Base64 automatiquement</p>
        </div>

        {/* Nom entreprise */}
        <div>
          <label className={lbl}>Nom de l'entreprise</label>
          <input
            type="text"
            value={pdfNom}
            onChange={e => setPdfNom(e.target.value)}
            placeholder="ex : Maroc Lait"
            className={inpDark}
          />
        </div>

        {/* Slogan */}
        <div>
          <label className={lbl}>Slogan / Sous-titre</label>
          <input
            type="text"
            value={pdfSlogan}
            onChange={e => setPdfSlogan(e.target.value)}
            placeholder="ex : Hub Central National · Agadir"
            className={inpDark}
          />
        </div>

        {/* Pied de page */}
        <div>
          <label className={lbl}>Pied de page (mentions légales, RC, IF…)</label>
          <textarea
            rows={3}
            value={pdfPiedDePage}
            onChange={e => setPdfPiedDePage(e.target.value)}
            placeholder="ex : RC : 12345 · IF : 67890 · Tél : +212 5XX XXX XXX"
            className={`${inpDark} resize-none leading-relaxed`}
          />
          <p className="text-[10px] text-slate-400 mt-1">Affiché en bas à droite de tous les documents exportés (BL, Bon de Décharge, Bon de Retrait).</p>
        </div>

        {/* Bouton sauvegarder */}
        <button
          onClick={handleSavePdf}
          disabled={pdfLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-bold transition-all"
        >
          {pdfLoading ? (
            <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Enregistrement…</>
          ) : pdfSaved ? (
            <><CheckCircle size={13}/> Configuration enregistrée !</>
          ) : (
            <><Save size={13}/> Appliquer la personnalisation</>
          )}
        </button>
        <p className="text-[10px] text-slate-400 -mt-1 text-center">
          Appliqué immédiatement sur tous les prochains exports PDF.
        </p>
      </Card>

      {/* Modal double validation */}
      {modalAction && (
        <ModalSecurite
          action={modalAction}
          onClose={() => setModalAction(null)}
          onConfirm={modalAction.onConfirm}
        />
      )}
    </div>
  );
}
