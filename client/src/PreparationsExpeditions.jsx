import { useState, useRef, useEffect, useMemo } from "react";
import { api } from "./lib/api";
import { getBranding } from "./lib/pdfBranding";
import DataGridV2 from './components/DataGridV2';
import {
  Package, Clock, Truck, ClipboardList, Lock,
  Scan, CheckCircle, AlertTriangle, X, ChevronRight,
  PackageCheck, FileText, Dna, FlaskConical, Wrench,
  User, Calendar, Shield, Zap, ScanLine, Plus,
  Trash2, BadgeCheck, Filter, Key, Send
} from "lucide-react";



/* ─── Adaptateur Transaction API → format UI expéditions ── */
const STATUT_EXP = {
  /* ── V1 legacy ── */
  'Brouillon':   'a_preparer',
  'En attente':  'en_attente_admin',
  'Validé':      'approuve',
  'En_transit':  'en_transit',
  'Livre':       'en_transit',
  'Expédié':     'expedie',
  'Réceptionné': 'expedie',
  'Rejeté':      'a_preparer',
  /* ── V2 workflow quotas ── */
  'Demandée':               'a_preparer',
  'Validée_BE':             'approuve',
  'Partiellement_Livrée':   'en_cours',
  'Totalement_Livrée':      'expedie',
  'Réceptionnée_Cloturée':  'expedie',
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
    repartGenetique:      Array.isArray(t.repartGenetique) ? t.repartGenetique : [],
    lotsScelles:          [],
    historiqueLivraisons: t.historiqueLivraisons ?? [],
    reliquatGlobal:       (t.repartGenetique ?? []).reduce(
      (s, g) => s + Math.max(0, (g.quantiteAutorisee ?? 0) - (g.quantiteLivree ?? 0)), 0
    ),
    aMatérielPreté:       Array.isArray(t.materielPrete) && t.materielPrete.length > 0,
    materielPrete:        Array.isArray(t.materielPrete) ? t.materielPrete : [],
    dateCreation:         t.createdAt ? new Date(t.createdAt).toISOString() : null,
  };
}

function statutMeta(s) {
  return {
    a_preparer:       { label:"À préparer",            bg:"bg-blue-50",    text:"text-blue-700",    border:"border-blue-200",    dot:"bg-blue-500",    pulse:false },
    en_attente_admin: { label:"En attente Admin",       bg:"bg-amber-50",   text:"text-amber-700",   border:"border-amber-200",   dot:"bg-amber-500",   pulse:true  },
    approuve:         { label:"Prêt à livrer",          bg:"bg-emerald-50", text:"text-emerald-700", border:"border-emerald-200", dot:"bg-emerald-500", pulse:false },
    en_cours:         { label:"Livraison en cours",     bg:"bg-blue-50",    text:"text-blue-700",    border:"border-blue-200",    dot:"bg-blue-500",    pulse:true  },
    en_transit:       { label:"En transit",              bg:"bg-amber-50",   text:"text-amber-700",   border:"border-amber-200",   dot:"bg-amber-500",   pulse:true  },
    expedie:          { label:"Livré / Expédié",        bg:"bg-gray-100",   text:"text-gray-500",    border:"border-gray-200",    dot:"bg-gray-400",    pulse:false },
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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 border border-slate-200 whitespace-nowrap">
      <User size={9} /> Demande Unité
    </span>
  );
}

/* ─── Bon de Retrait Fournisseur — Flux Déporté Azote ─────── */
async function imprimerBonRetraitFournisseur({ commande, blRef, date }) {
  const win     = window.open('', '_blank', 'width=960,height=720');
  const b       = await getBranding();
  const logoHdr = b.logoUrl
    ? `<img src="${b.logoUrl}" alt="${b.nomEntreprise}" style="max-height:55px;max-width:200px;object-fit:contain;display:block" /><p style="margin:3px 0 0;font-size:11px;color:#64748b">${b.slogan}</p>`
    : `<h1 style="margin:0;font-size:22px;font-weight:900;color:#0891b2;letter-spacing:-0.5px">${b.nomEntreprise}</h1><p style="margin:3px 0 0;font-size:11px;color:#64748b">${b.slogan}</p>`;
  const lignesHtml = commande.articles
    .filter(a => a.type === 'azote')
    .map((a, i) => `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #ecfeff;">${i + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ecfeff;font-weight:600;">${a.label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ecfeff;text-align:center;font-family:monospace;font-weight:700;">${a.qte.toLocaleString('fr-FR')} ${a.unite}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ecfeff;text-align:center;font-size:10px;color:#0891b2;">Chez prestataire</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Bon de Retrait ${blRef ?? ''}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:28px 32px;margin:0}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0891b2;padding-bottom:18px;margin-bottom:24px}
  .logo h1{margin:0;font-size:22px;font-weight:900;color:#0891b2;letter-spacing:-0.5px}
  .logo p{margin:3px 0 0;font-size:11px;color:#64748b}
  .doc-info{text-align:right}
  .doc-info .type{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#64748b}
  .doc-info .title{font-size:18px;font-weight:900;color:#0891b2;margin:2px 0}
  .doc-info .ref{font-size:11px;color:#64748b;font-family:monospace}
  .alert{background:#ecfeff;border:2px solid #0891b2;border-radius:8px;padding:14px 18px;margin-bottom:22px;display:flex;gap:12px;align-items:flex-start}
  .alert-icon{font-size:20px;line-height:1}
  .alert h3{margin:0 0 4px;font-size:12px;font-weight:700;color:#0e7490}
  .alert p{margin:0;font-size:11px;color:#164e63;line-height:1.5}
  .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px}
  .mbox{border:1px solid #cffafe;border-radius:8px;padding:13px 15px;background:#f0fdff}
  .mbox h4{margin:0 0 7px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0891b2}
  .mbox p{margin:2px 0;font-size:11px;color:#164e63}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  thead tr{background:#0891b2;color:#fff}
  thead th{padding:9px 12px;font-size:9px;text-transform:uppercase;letter-spacing:1px;font-weight:700;text-align:left}
  thead th:last-child{text-align:center}
  tbody tr:nth-child(even){background:#f0fdff}
  .signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:28px}
  .sig-box{border:1px solid #cffafe;border-radius:8px;padding:13px 15px;min-height:80px;background:#f0fdff}
  .sig-box h4{margin:0 0 3px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0891b2}
  .sig-box p{margin:0;font-size:10px;color:#64748b}
  .sig-line{border-top:1px solid #0891b2;margin-top:44px}
  .footer{margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;display:flex;justify-content:space-between}
  @media print{body{padding:12mm 15mm}}
</style></head><body>
<div class="header">
  <div class="logo">
    ${logoHdr}
  </div>
  <div class="doc-info">
    <div class="type">Document officiel</div>
    <div class="title">BON D'AUTORISATION DE RETRAIT</div>
    <div class="ref">${blRef ?? '—'} &nbsp;·&nbsp; ${date}</div>
  </div>
</div>

<div class="alert">
  <div class="alert-icon">🚚</div>
  <div>
    <h3>Flux Déporté — Azote Liquide (Drop-Shipping)</h3>
    <p>Ce produit n'est <strong>pas stocké au Hub Central</strong>. Le porteur de ce bon est autorisé par la Direction de ${b.nomEntreprise} à retirer les quantités indiquées ci-dessous directement auprès du prestataire externe désigné, sur présentation de ce document et d'une pièce d'identité.</p>
  </div>
</div>

<div class="meta-grid">
  <div class="mbox">
    <h4>Émis par</h4>
    <p><strong>${b.nomEntreprise}</strong></p>
    <p>${b.slogan}</p>
    <p style="margin-top:6px;font-size:10px;color:#0e7490">Réf. Ordre : <strong style="font-family:monospace">${commande.id}</strong></p>
  </div>
  <div class="mbox">
    <h4>Bénéficiaire Autorisé</h4>
    <p><strong>${commande.destinataire}</strong></p>
    ${commande.region ? `<p style="font-size:11px;color:#64748b">${commande.region}</p>` : ''}
  </div>
  <div class="mbox" style="border-color:#fed7aa;background:#fff7ed">
    <h4 style="color:#c2410c">Prestataire Fournisseur</h4>
    <p style="color:#9a3412"><strong>À compléter par le magasinier :</strong></p>
    <p style="color:#9a3412;font-size:10px">Nom / Raison sociale : _______________</p>
    <p style="color:#9a3412;font-size:10px">Adresse : _________________________</p>
  </div>
  <div class="mbox">
    <h4>Validité</h4>
    <p>Date d'émission : <strong>${date}</strong></p>
    <p style="font-size:10px;color:#0e7490;margin-top:4px">Ce bon est valable 30 jours à compter de la date d'émission.</p>
  </div>
</div>

<table>
  <thead><tr>
    <th style="width:36px">#</th>
    <th>Désignation Produit</th>
    <th style="text-align:center">Quantité Autorisée</th>
    <th style="text-align:center">Lieu de Retrait</th>
  </tr></thead>
  <tbody>
    ${lignesHtml}
  </tbody>
</table>

<div class="signatures">
  <div class="sig-box">
    <h4>Magasinier — Hub Central</h4>
    <p>Nom &amp; Signature</p>
    <div class="sig-line"></div>
  </div>
  <div class="sig-box">
    <h4>Responsable Unité Bénéficiaire</h4>
    <p>Signature &amp; Cachet</p>
    <div class="sig-line"></div>
  </div>
  <div class="sig-box" style="border-color:#fed7aa;background:#fff7ed">
    <h4 style="color:#c2410c">Prestataire Fournisseur</h4>
    <p style="color:#9a3412">Bon remis — Tampon Prestataire</p>
    <div class="sig-line" style="border-top-color:#c2410c"></div>
  </div>
</div>
<div class="footer">
  <span>Généré le ${date}</span>
  <span>${b.piedDePage || b.nomEntreprise}</span>
</div>
</body></html>`;

  if (win) { win.document.write(html); win.document.close(); setTimeout(() => { try { win.print(); } catch (_) {} }, 600); }
}

/* ─── Bon de Décharge — Prêt de Matériel ───────────────── */
async function imprimerBonDecharge({ commande, materielPrete, date }) {
  const win     = window.open('', '_blank', 'width=960,height=720');
  const b       = await getBranding();
  const logoHdr = b.logoUrl
    ? `<img src="${b.logoUrl}" alt="${b.nomEntreprise}" style="max-height:55px;max-width:200px;object-fit:contain;display:block" /><p style="margin:3px 0 0;font-size:11px;color:#64748b">${b.slogan}</p>`
    : `<h1 style="margin:0;font-size:22px;font-weight:900;color:#d97706">${b.nomEntreprise}</h1><p style="margin:3px 0 0;font-size:11px;color:#64748b">${b.slogan}</p>`;
  const lignesHtml = materielPrete.map((m, i) => `<tr>
    <td style="padding:9px 12px;border-bottom:1px solid #fff7ed;">${i + 1}</td>
    <td style="padding:9px 12px;border-bottom:1px solid #fff7ed;font-weight:600;font-family:monospace;">${m.conteneurNom || m.conteneurRef}</td>
    <td style="padding:9px 12px;border-bottom:1px solid #fff7ed;">${m.description || '—'}</td>
    <td style="padding:9px 12px;border-bottom:1px solid #fff7ed;text-align:center;color:#b45309">${m.dateRetourPrevu ? new Date(m.dateRetourPrevu).toLocaleDateString('fr-FR') : 'À convenir'}</td>
  </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Bon de Décharge ${commande.id}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:28px 32px;margin:0}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #d97706;padding-bottom:18px;margin-bottom:24px}
  .logo h1{margin:0;font-size:22px;font-weight:900;color:#d97706}
  .logo p{margin:3px 0 0;font-size:11px;color:#64748b}
  .doc-info .type{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#64748b;text-align:right}
  .doc-info .title{font-size:18px;font-weight:900;color:#d97706;text-align:right;margin:2px 0}
  .doc-info .ref{font-size:11px;color:#64748b;font-family:monospace;text-align:right}
  .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px}
  .mbox{border:1px solid #fde68a;border-radius:8px;padding:13px 15px;background:#fffbeb}
  .mbox h4{margin:0 0 7px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#b45309}
  .mbox p{margin:2px 0;font-size:11px;color:#78350f}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}
  thead tr{background:#d97706;color:#fff}
  thead th{padding:9px 12px;font-size:9px;text-transform:uppercase;letter-spacing:1px;font-weight:700;text-align:left}
  tbody tr:nth-child(even){background:#fffbeb}
  .clause{background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin-bottom:22px;font-size:11px;color:#78350f;line-height:1.6}
  .clause strong{color:#b45309}
  .signatures{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px}
  .sig-box{border:1px solid #fde68a;border-radius:8px;padding:14px 15px;min-height:90px;background:#fffbeb}
  .sig-box h4{margin:0 0 3px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#b45309}
  .sig-box p{margin:0;font-size:10px;color:#78350f}
  .sig-line{border-top:1px solid #d97706;margin-top:50px}
  .footer{margin-top:22px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;display:flex;justify-content:space-between}
  @media print{body{padding:12mm 15mm}}
</style></head><body>
<div class="header">
  <div class="logo">
    ${logoHdr}
  </div>
  <div class="doc-info">
    <div class="type">Document officiel</div>
    <div class="title">BON DE DÉCHARGE — PRÊT DE MATÉRIEL</div>
    <div class="ref">Réf. Ordre : ${commande.id} &nbsp;·&nbsp; ${date}</div>
  </div>
</div>

<div class="meta-grid">
  <div class="mbox">
    <h4>Cédant (Magasin Central)</h4>
    <p><strong>${b.nomEntreprise}</strong></p>
    <p>${b.slogan}</p>
  </div>
  <div class="mbox">
    <h4>Emprunteur (Bénéficiaire)</h4>
    <p><strong>${commande.destinataire}</strong></p>
    ${commande.region ? `<p>${commande.region}</p>` : ''}
    <p style="font-size:10px;margin-top:4px">Lié à la commande : <strong style="font-family:monospace">${commande.id}</strong></p>
  </div>
</div>

<table>
  <thead><tr>
    <th style="width:32px">#</th>
    <th>Référence Conteneur</th>
    <th>Désignation / Description</th>
    <th style="text-align:center">Retour Prévu</th>
  </tr></thead>
  <tbody>
    ${lignesHtml}
    <tr style="background:#d97706!important">
      <td colspan="4" style="padding:8px 12px;color:#fff;font-size:10px;font-weight:700;text-align:right">
        ${materielPrete.length} conteneur${materielPrete.length > 1 ? 's' : ''} prêté${materielPrete.length > 1 ? 's' : ''}
      </td>
    </tr>
  </tbody>
</table>

<div class="clause">
  <strong>Clause de responsabilité :</strong> L'emprunteur désigné ci-dessus reconnaît avoir reçu le(s) conteneur(s) listés en bon état de fonctionnement. Il s'engage à les restituer dans un état équivalent à la date de retour convenue. Tout endommagement ou perte sera à la charge de l'emprunteur. Ce matériel reste la propriété exclusive de ${b.nomEntreprise}.
</div>

<div class="signatures">
  <div class="sig-box">
    <h4>Magasinier Central — Cédant</h4>
    <p>Nom, signature &amp; date</p>
    <div class="sig-line"></div>
  </div>
  <div class="sig-box">
    <h4>Responsable Unité — Emprunteur</h4>
    <p>Signature &amp; cachet officiel</p>
    <div class="sig-line"></div>
  </div>
</div>

<div class="footer">
  <span>Généré le ${date}</span>
  <span>${b.piedDePage || b.nomEntreprise}</span>
</div>
</body></html>`;

  if (win) { win.document.write(html); win.document.close(); setTimeout(() => { try { win.print(); } catch (_) {} }, 600); }
}

/* ─── Génération du Bon de Livraison (impression navigateur) ── */
async function imprimerBL({ commande, societe, matricule, blRef, date }) {
  const win     = window.open('', '_blank', 'width=960,height=720');
  const b       = await getBranding();
  const histBL = commande.historiqueLivraisons ?? [];
  const lots = (commande.lotsScelles?.length > 0)
    ? commande.lotsScelles
    : histBL.map(h => ({
        taureau:          '—',
        nni:              '—',
        couleur:          '—',
        conteneurSemence: h.conteneurSemence ?? '—',
        qteRetire:        h.quantiteExpediee ?? 0,
        unite:            'doses',
      }));
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
          <td style="font-family:monospace;font-size:11px">${l.conteneurSemence ?? l.cuve ?? '—'}</td>
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
    ${b.logoUrl
      ? `<img src="${b.logoUrl}" alt="${b.nomEntreprise}" style="max-height:55px;max-width:200px;object-fit:contain;display:block" /><div class="logo-sub">${b.slogan}</div>`
      : `<div class="logo">${b.nomEntreprise}</div><div class="logo-sub">${b.slogan}</div>`
    }
  </div>
  <div>
    <div class="doc-tag">Document officiel</div>
    <div class="doc-title">BON DE LIVRAISON</div>
    <div class="doc-ref">${blRef} &nbsp;·&nbsp; ${date}</div>
  </div>
</div>
<div class="meta">
  <div class="mbox"><h4>Expéditeur</h4><p><strong>${b.nomEntreprise} — Magasin Central</strong></p><p style="font-size:11px;color:#64748b">${b.slogan}</p></div>
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
  <span>Généré le ${date}</span>
  <span>${b.piedDePage || b.nomEntreprise}</span>
</div>
</body></html>`;

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
    const fiches = Array.isArray(lot.ficheTechnique) ? lot.ficheTechnique : [];
    if (fiches.length > 0) {
      /* V2 : chaque entrée ficheTechnique = une ligne de picking distincte */
      fiches.forEach(f => {
        const cle = f.nni || f.taureau || f.conteneurSemence || `${lot._id}-${f.conteneurSemence}`;
        if (!map[cle]) map[cle] = {
          cle,
          taureau:          f.taureau          ?? '',
          nni:              f.nni              ?? '',
          couleur:          f.couleur          ?? '',
          numLot:           lot.numLot         ?? '',
          conteneurSemence: f.conteneurSemence ?? '',
          stockDispo:       0,
          unite:            lot.uniteMesure    ?? 'doses',
        };
        map[cle].stockDispo += Number(f.qte ?? 0);
      });
    } else {
      /* V1 fallback : champs au niveau du lot */
      const cle = lot.nni || lot.taureau || lot._id || lot.id;
      if (!map[cle]) map[cle] = {
        cle,
        taureau:          lot.taureau   ?? '',
        nni:              lot.nni       ?? '',
        couleur:          lot.couleur   ?? '',
        numLot:           lot.numLot    ?? '',
        conteneurSemence: lot.cuve      ?? '',
        stockDispo:       0,
        unite:            lot.uniteMesure ?? 'doses',
      };
      map[cle].stockDispo += Number(lot.qteDisponible ?? lot.qte ?? 0);
    }
  });
  return Object.values(map).filter(t => t.stockDispo > 0);
}

function calculerRepartition(taureaux, totalQte) {
  const n = taureaux.length;
  if (n === 0) return [];
  const base  = Math.floor(totalQte / n);
  const reste = totalQte % n;
  return taureaux.map((t, i) => {
    const ideal     = i < reste ? base + 1 : base;
    const qteRetire = Math.min(ideal, t.stockDispo); // ne dépasse pas le stock physique
    return {
      ...t,
      reliquat:    t.stockDispo, // reliquat = stock physique disponible
      qteCalculee: ideal,
      qteRetire,
    };
  });
}

/* ─── PickingDrawer ────────────────────────────────────── */
function PickingDrawer({ commande, onClose, onSceller }) {
  // hasSemence : vrai si article semence OU si repartGenetique existe (ORDRE_ADMIN sans categorie peuplée)
  const hasSemence      = (commande.articles ?? []).some(a => a.type === 'semence')
                          || (commande.repartGenetique?.length > 0);
  const isAzoteDeporte  = (commande.articles ?? []).every(a => a.type === 'azote') && !hasSemence;
  const semenceArticle  = (commande.articles ?? []).find(a => a.type === 'semence');
  const totalDemande    = (commande.articles ?? []).reduce((s, a) => s + (a.qte || 0), 0);
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
  const [loadingStock,    setLoadingStock]    = useState(false);
  const [stockError,      setStockError]      = useState(null);
  const [lignesRep,       setLignesRep]       = useState([]);
  const [lotsDispoSemence, setLotsDispoSemence] = useState([]); // options pour les selects conteneur

  /* ── Commun ── */
  const [done,             setDone]             = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [scellerError,     setScellerError]     = useState(null);
  const [blRef,            setBlRef]            = useState(null);
  const [pretToggle,       setPretToggle]       = useState(false);
  const [materielPrete,    setMaterielPrete]    = useState([{ conteneurRef: '', conteneurNom: '', description: '', dateRetourPrevu: '' }]);
  const [conteneursDispo,  setConteneursDispo]  = useState([]);
  const [loadingConteneurs,setLoadingConteneurs]= useState(false);

  /* Chargement stock au montage si semences */
  useEffect(() => {
    if (!hasSemence) return;
    chargerEtRepartir();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Charge les conteneurs disponibles quand le toggle "Prêt" est activé */
  useEffect(() => {
    if (!pretToggle || conteneursDispo.length > 0) return;
    setLoadingConteneurs(true);
    api.get('/api/conteneurs-semences?statutPret=Disponible&limit=100')
      .then(res => setConteneursDispo(Array.isArray(res) ? res : (res.data ?? [])))
      .catch(() => {})
      .finally(() => setLoadingConteneurs(false));
  }, [pretToggle]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Déclenche l'impression automatique du bon dès que la livraison est enregistrée */
  useEffect(() => {
    if (!done) return;
    const date = new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    if (isAzoteDeporte || hasAzoteLines) {
      imprimerBonRetraitFournisseur({ commande, blRef: blRef ?? commande.id, date });
    } else if (hasSemence) {
      imprimerBL({ commande, societe: '—', matricule: '', blRef: blRef ?? commande.id, date });
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  async function chargerEtRepartir() {
    /* Cas 1 : quota V2 depuis repartGenetique (ORDRE_ADMIN ou EXPEDITION validée BE) */
    if (commande.repartGenetique?.length > 0) {
      setLignesRep(commande.repartGenetique.map((g, idx) => {
        const autorisee = (g.quantiteAutorisee ?? g.quantiteDemandee ?? g.qte) || 0;
        const livree    = (g.quantiteLivree ?? 0) || 0;
        const reliquat  = Math.max(0, autorisee - livree);
        const prefilled = (g.conteneurSemence ?? g.cuve ?? '').trim();
        return {
          /* cle stable : pas de Math.random() — on utilise l'index comme fallback */
          cle:               g.nni || g.taureau || `quota-${idx}`,
          taureau:           g.taureau          ?? '',
          nni:               g.nni              ?? '',
          couleur:           g.couleur          ?? '',
          conteneurSemence:  prefilled,
          quantiteAutorisee: autorisee,
          quantiteLivree:    livree,
          reliquat,
          qteRetire:         reliquat,
          unite:             semenceArticle?.unite ?? 'doses',
          isEditable:        !prefilled, // true = magasinier doit choisir le conteneur
          typeProduit:       g.typeProduit ?? '',
          articleId:         g.articleId  ?? null,
        };
      }));

      /* Charger les lots physiques pour alimenter le <select> conteneur */
      const artId = commande.articles?.find(a => a.type === 'semence')?.articleId
        ?? commande.repartGenetique[0]?.articleId;
      if (artId) {
        setLoadingStock(true);
        try {
          const res = await api.get(`/api/lots?articleId=${artId}&limit=200`);
          const raw = Array.isArray(res) ? res : (res.data ?? []);
          const opts = [];
          raw.forEach(lot => {
            (lot.ficheTechnique ?? []).forEach(f => {
              if (Number(f.qte ?? 0) > 0 && f.conteneurSemence) {
                opts.push({
                  conteneurSemence: f.conteneurSemence,
                  taureau:          f.taureau ?? '',
                  nni:              f.nni     ?? '',
                  qte:              f.qte,
                });
              }
            });
          });
          setLotsDispoSemence(opts);
        } catch {
          /* non-fatal : l'input texte reste disponible comme fallback */
        } finally {
          setLoadingStock(false);
        }
      }
      return;
    }

    /* Cas 2 : stock physique disponible (EXPEDITION sans quota admin) */
    setLoadingStock(true);
    setStockError(null);
    try {
      const qs  = semenceArticle?.articleId
        ? `/api/lots?articleId=${semenceArticle.articleId}&limit=200`
        : `/api/lots?typeProduit=Conventionnelle,Sexée&limit=200`;
      const res  = await api.get(qs);
      const lots = Array.isArray(res) ? res : (res.data ?? []);
      const taureaux = groupParTaureau(lots);
      /* isEditable: false → conteneurSemence pré-rempli depuis ficheTechnique */
      setLignesRep(calculerRepartition(taureaux, totalSemDem).map(l => ({
        ...l,
        isEditable: false,
      })));
    } catch (err) {
      setStockError(err.message);
      setLignesRep([]);
    } finally {
      setLoadingStock(false);
    }
  }

  function updateQteRep(cle, val) {
    setLignesRep(p => p.map(l =>
      l.cle === cle
        ? { ...l, qteRetire: Math.min(l.reliquat ?? Infinity, Math.max(0, Number(val) || 0)) }
        : l
    ));
  }

  function handleConteneurChange(cle, val) {
    setLignesRep(prev => prev.map(l => l.cle === cle ? { ...l, conteneurSemence: val } : l));
  }

  /* Validations */
  const totalSaisiRep    = lignesRep.reduce((s, l) => s + (Number(l.qteRetire) || 0), 0);
  const totalReliquat    = lignesRep.reduce((s, l) => s + (l.reliquat ?? 0), 0);
  const hasOverLimit     = lignesRep.some(l => Number(l.qteRetire) > (l.reliquat ?? 0));
  const hasGeneticLines  = lignesRep.some(l => l.taureau || l.nni);
  /* Ligne de type Azote/Consommables : pas de conteneur local requis (flux déporté) */
  const isAzoteLigne = (l) => {
    const tp = (l.typeProduit ?? '').toLowerCase();
    if (tp === 'azote' || tp === 'consommables') return true;
    const artMatch = (commande.articles ?? []).find(a =>
      a.articleId && l.articleId && String(a.articleId) === String(l.articleId)
    );
    return artMatch?.type === 'azote';
  };
  /* Bloque uniquement si on essaie d'expédier une ligne sans conteneur assigné — Azote exempt */
  const hasEmptyConteneur = lignesRep.some(l =>
    Number(l.qteRetire) > 0 && !l.conteneurSemence?.trim() && !isAzoteLigne(l)
  );
  const canScellerRep    = lignesRep.length > 0 && totalSaisiRep > 0 && !hasOverLimit && !hasEmptyConteneur;

  const totalScanne    = lotsAjoutes.reduce((s, l) => s + l.qteRetire, 0);
  const pct            = totalDemande > 0 ? Math.min((totalScanne / totalDemande) * 100, 100) : 0;
  const canScellerScan = lotsAjoutes.length > 0;

  const hasAzoteLines    = lignesRep.some(l => isAzoteLigne(l));
  const validMaterielCount = pretToggle ? materielPrete.filter(m => m.conteneurRef.trim()).length : 0;
  const canScellerFinal = isAzoteDeporte
    ? !saving && !done
    : hasSemence ? canScellerRep : canScellerScan;

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

  async function handleSceller() {
    if (saving || done) return;
    setSaving(true);
    setScellerError(null);
    const validMateriel = pretToggle ? materielPrete.filter(m => m.conteneurRef.trim()) : [];
    try {
      if (isAzoteDeporte) {
        const azoteLots = commande.articles
          .filter(a => a.type === 'azote')
          .map(a => ({ conteneurSemence: '', quantiteExpediee: a.qte }));
        const result = await onSceller(commande.id, azoteLots, { isDeporte: true, materielPrete: validMateriel });
        setBlRef(result?.blRef ?? null);
      } else {
        const lots = hasSemence
          ? lignesRep.map(l => ({
              taureau:          l.taureau,
              nni:              l.nni,
              couleur:          l.couleur,
              conteneurSemence: l.conteneurSemence,
              reliquat:         l.reliquat,
              qteRetire:        Number(l.qteRetire),
              unite:            l.unite,
              // isAzoteLigne() est la source de vérité : l.typeProduit peut être vide
              // si le serveur ne le peuple pas — on force 'Azote' quand la fonction détecte
              // une ligne Azote (via articleId ↔ commande.articles[].type === 'azote')
              typeProduit:      isAzoteLigne(l) ? 'Azote' : (l.typeProduit ?? ''),
              articleId:        l.articleId  ?? null,
            }))
          : lotsAjoutes;
        const res = await onSceller(commande.id, lots, { materielPrete: validMateriel });
        setBlRef(res?.blRef ?? null);
      }
      setDone(true);
    } catch (err) {
      setScellerError(err?.message ?? "Erreur lors de l'enregistrement de la livraison.");
    } finally {
      setSaving(false);
    }
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

          {/* Bandeau Flux Déporté Azote */}
          {isAzoteDeporte && (
            <div className="flex gap-2.5 bg-cyan-950 border border-cyan-700 rounded-xl px-4 py-3">
              <FlaskConical size={14} className="text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-cyan-100 mb-0.5">Flux Déporté — Azote Liquide</p>
                <p className="text-xs text-cyan-300 leading-relaxed">
                  Ce produit n'est <strong className="text-cyan-100">pas stocké au Hub Central</strong>. Aucun scan de conteneur requis. Un Bon d'Autorisation de Retrait sera généré pour le prestataire externe.
                </p>
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
                      ? '⚡ Répartition définie par l\'Administrateur'
                      : 'Répartition équitable automatique'}
                  </p>
                  <p className={`text-xs leading-relaxed ${commande.repartGenetique?.length > 0 ? 'text-violet-300' : 'text-slate-400'}`}>
                    {commande.repartGenetique?.length > 0
                      ? 'Quantités imposées par la subvention — modifiables en cas de force majeure, le total doit rester exact.'
                      : 'Doses pré-calculées en parts égales par taureau (NNI) — ajustez si nécessaire, le total doit rester égal à la commande.'}
                  </p>
                </div>
              </div>

              {/* Barre de progression livraison */}
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-700">À expédier cette session</span>
                  <span className={`text-xs font-bold tabular-nums ${hasOverLimit ? "text-red-600" : totalSaisiRep > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                    {totalSaisiRep.toLocaleString()} / {totalReliquat.toLocaleString()} {semenceArticle?.unite ?? 'doses'} restantes
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${hasOverLimit ? "bg-red-500" : totalSaisiRep > 0 ? "bg-emerald-500" : "bg-gray-200"}`}
                    style={{ width: `${Math.min(totalReliquat > 0 ? (totalSaisiRep / totalReliquat) * 100 : 0, 100)}%` }}
                  />
                </div>
                {hasOverLimit && (
                  <p className="mt-1.5 text-xs flex items-center gap-1 font-semibold text-red-600">
                    <AlertTriangle size={11} />
                    Une ou plusieurs quantités dépassent le reliquat autorisé.
                  </p>
                )}
                {!hasOverLimit && totalSaisiRep === 0 && totalReliquat > 0 && (
                  <p className="mt-1.5 text-xs text-amber-600 font-semibold flex items-center gap-1">
                    <AlertTriangle size={11} /> Saisissez au moins une quantité à expédier.
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
                      <Dna size={13} className={hasGeneticLines ? "text-blue-500" : "text-cyan-500"} />
                      <span className="text-xs font-bold text-gray-700">
                        {hasGeneticLines ? 'Répartition par Taureau' : "Détails de l'expédition"}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                      {hasGeneticLines
                        ? `${lignesRep.length} taureau${lignesRep.length > 1 ? 'x' : ''}`
                        : `${lignesRep.length} ligne${lignesRep.length > 1 ? 's' : ''}`}
                    </span>
                  </div>

                  {/* En-têtes colonnes */}
                  <div className={`grid ${hasGeneticLines ? 'grid-cols-[1fr_auto_auto_auto]' : 'grid-cols-[auto_auto_auto]'} gap-3 px-4 py-2 bg-gray-50/50 border-b border-gray-100`}>
                    {(hasGeneticLines
                      ? ['Taureau / NNI', 'Conteneur', 'Autorisé · Livré · Reliquat', 'À expédier']
                      : ['Conteneur', 'Autorisé · Livré · Reliquat', 'À expédier']
                    ).map(h => (
                      <span key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider last:text-right">{h}</span>
                    ))}
                  </div>

                  <div className="divide-y divide-gray-50">
                    {lignesRep.map((ligne) => {
                      const overLimit  = Number(ligne.qteRetire) > (ligne.reliquat ?? 0);
                      const isPartial  = ligne.reliquat > 0 && Number(ligne.qteRetire) < ligne.reliquat && Number(ligne.qteRetire) > 0;
                      const azote      = isAzoteLigne(ligne);
                      return (
                        <div key={ligne.cle}
                          className={`grid ${hasGeneticLines ? 'grid-cols-[1fr_auto_auto_auto]' : 'grid-cols-[auto_auto_auto]'} gap-3 items-center px-4 py-3 transition-colors
                            ${overLimit ? 'bg-red-50/60' : isPartial ? 'bg-amber-50/40' : 'hover:bg-gray-50/60'}`}>

                          {/* Taureau / NNI — masqué pour les tables sans lignes génétiques */}
                          {hasGeneticLines && (
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-semibold text-gray-800 truncate">{ligne.taureau || '—'}</p>
                                {ligne.couleur && ligne.couleur !== '—' && (
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
                          )}

                          {/* Conteneur — badge fixe pour Azote (retrait externe), select/span pour Semence */}
                          {azote ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg px-2 py-1 shrink-0 whitespace-nowrap">
                              <FlaskConical size={9} /> Retrait Externe (Fournisseur)
                            </span>
                          ) : (ligne.conteneurSemence && !ligne.isEditable) ? (
                            <span className="text-[11px] font-mono text-gray-500 shrink-0 max-w-[80px] truncate">
                              {ligne.conteneurSemence}
                            </span>
                          ) : (() => {
                            const optsLine = lotsDispoSemence.filter(o =>
                              (!ligne.nni     || !o.nni     || o.nni     === ligne.nni) &&
                              (!ligne.taureau || !o.taureau || o.taureau === ligne.taureau)
                            );
                            return (
                              <select
                                value={ligne.conteneurSemence || ''}
                                onChange={e => handleConteneurChange(ligne.cle, e.target.value)}
                                className="w-28 text-[10px] font-mono border border-amber-300 bg-amber-50 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 text-amber-800 shrink-0">
                                <option value="">— Choisir Conteneur —</option>
                                {optsLine.length > 0
                                  ? optsLine.map(o => (
                                      <option key={o.conteneurSemence} value={o.conteneurSemence}>
                                        {o.conteneurSemence} (Dispo : {o.qte})
                                      </option>
                                    ))
                                  : <option value="" disabled>Aucun stock disponible</option>
                                }
                              </select>
                            );
                          })()}

                          {/* Autorisé · Livré · Reliquat */}
                          <div className="text-right shrink-0 space-y-0.5">
                            <p className="text-[10px] text-gray-400 tabular-nums">
                              <span className="text-gray-300">Aut. </span>{(ligne.quantiteAutorisee ?? 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-400 tabular-nums">
                              <span className="text-gray-300">Livr. </span>{(ligne.quantiteLivree ?? 0).toLocaleString()}
                            </p>
                            <p className={`text-[10px] font-bold tabular-nums ${ligne.reliquat > 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                              {ligne.reliquat > 0 ? `Rel. ${ligne.reliquat.toLocaleString()}` : '✓ Soldé'}
                            </p>
                          </div>

                          {/* Input à expédier */}
                          <div className="flex flex-col items-end gap-0.5 shrink-0">
                            <input
                              type="number"
                              min={0}
                              max={ligne.reliquat ?? 0}
                              value={ligne.qteRetire}
                              disabled={ligne.reliquat <= 0}
                              onChange={e => updateQteRep(ligne.cle, parseInt(e.target.value, 10) || 0)}
                              className={`w-20 text-right text-sm font-bold border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 tabular-nums transition-colors
                                ${ligne.reliquat <= 0  ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' :
                                  overLimit            ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-400' :
                                  isPartial            ? 'border-amber-300 bg-amber-50 text-amber-800 focus:ring-amber-400' :
                                                         'border-gray-200 text-gray-800 bg-white focus:ring-blue-400'}`}
                            />
                            {overLimit && (
                              <span className="text-[9px] text-red-600 font-semibold">max {ligne.reliquat}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pied de tableau — total session */}
                  <div className={`flex items-center justify-between px-4 py-2.5 border-t transition-colors
                    ${hasOverLimit ? 'bg-red-50 border-red-100' : canScellerRep ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                    <span className={`text-xs font-bold ${hasOverLimit ? 'text-red-700' : canScellerRep ? 'text-emerald-700' : 'text-amber-700'}`}>
                      Cette livraison
                    </span>
                    <span className={`text-sm font-bold tabular-nums flex items-center gap-1.5
                      ${hasOverLimit ? 'text-red-700' : canScellerRep ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {totalSaisiRep.toLocaleString()} {semenceArticle?.unite ?? 'doses'}
                      {canScellerRep && !hasOverLimit && <CheckCircle size={12} />}
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

          {/* ══ Mode scan (non-semence, non-azote déporté) ══ */}
          {!hasSemence && !isAzoteDeporte && (
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

          {/* ══ Prêt de Matériel (toggle pour semences + azote déporté) ══ */}
          {(hasSemence || isAzoteDeporte) && !done && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setPretToggle(p => !p)}
                className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${pretToggle ? 'bg-amber-50 border-b border-amber-100' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${pretToggle ? 'bg-amber-100' : 'bg-gray-100'}`}>
                    <Package size={12} className={pretToggle ? 'text-amber-700' : 'text-gray-400'} />
                  </div>
                  <span className={`text-xs font-bold ${pretToggle ? 'text-amber-800' : 'text-gray-600'}`}>
                    Prêt de Matériel (Bon de Décharge)
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pretToggle ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                  {pretToggle ? 'Activé' : 'Optionnel'}
                </span>
              </button>

              {pretToggle && (
                <div className="px-4 py-4 space-y-3">
                  <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                    Un conteneur de transport est prêté au bénéficiaire. Un Bon de Décharge sera généré à la clôture.
                  </p>
                  {loadingConteneurs && (
                    <div className="flex items-center gap-2 py-2">
                      <span className="w-3.5 h-3.5 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                      <span className="text-xs text-gray-400">Chargement des conteneurs…</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {materielPrete.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-amber-50/50 border border-amber-100 rounded-xl p-3">
                        <div className="flex-1 space-y-2 min-w-0">
                          <div>
                            <label className="block text-[10px] font-bold text-amber-800 mb-1 uppercase tracking-wide">Réf. Conteneur *</label>
                            {conteneursDispo.length > 0 ? (
                              <select
                                value={item.conteneurRef}
                                onChange={e => {
                                  const sel = conteneursDispo.find(c => String(c._id) === e.target.value);
                                  setMaterielPrete(p => p.map((m, i) => i === idx ? { ...m, conteneurRef: e.target.value, conteneurNom: sel?.nom ?? '' } : m));
                                }}
                                className="w-full text-xs font-mono border border-amber-200 bg-white rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800">
                                <option value="">— Choisir —</option>
                                {conteneursDispo.map(c => (
                                  <option key={c._id} value={c._id}>{c.nom}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={item.conteneurRef}
                                onChange={e => setMaterielPrete(p => p.map((m, i) => i === idx ? { ...m, conteneurRef: e.target.value } : m))}
                                placeholder="Ex : CNT-2025-001"
                                className="w-full text-xs font-mono border border-amber-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-gray-300"
                              />
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-amber-800 mb-1 uppercase tracking-wide">Description</label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={e => setMaterielPrete(p => p.map((m, i) => i === idx ? { ...m, description: e.target.value } : m))}
                                placeholder="Ex : Cuve azote 50L"
                                className="w-full text-xs border border-amber-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-gray-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-amber-800 mb-1 uppercase tracking-wide">Retour prévu</label>
                              <input
                                type="date"
                                value={item.dateRetourPrevu}
                                onChange={e => setMaterielPrete(p => p.map((m, i) => i === idx ? { ...m, dateRetourPrevu: e.target.value } : m))}
                                className="w-full text-xs border border-amber-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                            </div>
                          </div>
                        </div>
                        {materielPrete.length > 1 && (
                          <button onClick={() => setMaterielPrete(p => p.filter((_, i) => i !== idx))}
                            className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0 mt-1">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setMaterielPrete(p => [...p, { conteneurRef: '', conteneurNom: '', description: '', dateRetourPrevu: '' }])}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 px-3 py-1.5 rounded-lg border border-dashed border-amber-300 hover:border-amber-400 hover:bg-amber-50 transition-colors">
                    <Plus size={12} /> Ajouter un conteneur
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 space-y-2">
          {scellerError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertTriangle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-700 font-medium">{scellerError}</p>
            </div>
          )}
          {!done && hasSemence && hasOverLimit && (
            <p className="text-xs text-red-600 text-center flex items-center justify-center gap-1.5 font-semibold">
              <AlertTriangle size={11}/>
              Quantité saisie dépasse le reliquat autorisé — corrigez avant de valider.
            </p>
          )}
          {!done && hasSemence && !hasOverLimit && hasEmptyConteneur && (
            <p className="text-xs text-amber-600 text-center flex items-center justify-center gap-1.5 font-semibold">
              <AlertTriangle size={11}/>
              Renseignez le conteneur semence pour chaque ligne avant de valider.
            </p>
          )}
          {!done && hasSemence && !hasOverLimit && totalSaisiRep === 0 && lignesRep.length > 0 && (
            <p className="text-xs text-amber-600 text-center flex items-center justify-center gap-1.5 font-semibold">
              <AlertTriangle size={11}/> Saisissez au moins une quantité à expédier.
            </p>
          )}
          {!done && !hasSemence && !isAzoteDeporte && !canScellerScan && (
            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
              <AlertTriangle size={11}/> Ajoutez au moins un lot pour sceller le colis.
            </p>
          )}

          {done ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="bg-emerald-100 rounded-full p-1.5">
                  <BadgeCheck size={16} className="text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-emerald-700">Livraison enregistrée !</p>
                  <p className="text-[10px] text-emerald-500">Document imprimé automatiquement</p>
                </div>
              </div>
              {(isAzoteDeporte || hasAzoteLines) && (
                <button onClick={() => imprimerBonRetraitFournisseur({
                  commande,
                  blRef: blRef ?? commande.id,
                  date: new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
                })} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white transition-colors">
                  <FileText size={14}/> Réimprimer — Bon de Retrait Azote
                </button>
              )}
              {hasSemence && !hasAzoteLines && (
                <button onClick={() => imprimerBL({
                  commande,
                  societe: '—', matricule: '',
                  blRef: blRef ?? commande.id,
                  date: new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
                })} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                  <FileText size={14}/> Réimprimer — Bon de Livraison (BL)
                </button>
              )}
              {validMaterielCount > 0 && (
                <button onClick={() => imprimerBonDecharge({
                  commande,
                  materielPrete: materielPrete.filter(m => m.conteneurRef.trim()),
                  date: new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
                })} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors">
                  <FileText size={14}/> Bon de Décharge — Prêt de Matériel
                </button>
              )}
              <button onClick={onClose} className="w-full flex items-center justify-center py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Fermer
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleSceller} disabled={!canScellerFinal || saving}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all
                  ${saving            ? "bg-blue-400 text-white cursor-wait"
                  : canScellerFinal   ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  :                     "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</>
                  : isAzoteDeporte
                  ? <><FlaskConical size={14}/> Valider l'enlèvement Azote</>
                  : hasSemence
                  ? <><Send size={14}/> Enregistrer la livraison</>
                  : <><Lock size={14}/> Sceller et soumettre à l'Admin</>}
              </button>
            </div>
          )}
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
        .filter(t =>
          ['EXPEDITION', 'ORDRE_ADMIN'].includes(t.type) ||
          (Array.isArray(t.repartGenetique) && t.repartGenetique.length > 0 &&
           ['Validée_BE', 'Partiellement_Livrée'].includes(t.statut))
        )
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

  const DONE_STATUTS = ["expedie", "en_transit"];
  const kpi = {
    aPreparer: commandes.filter(c => c.statut === "a_preparer").length,
    adminPrio: commandes.filter(c => c.origine === "admin" && !DONE_STATUTS.includes(c.statut)).length,
    enAttente: commandes.filter(c => c.statut === "en_attente_admin").length,
  };

  function flash(id) { setFlashId(id); setTimeout(() => setFlashId(null), 800); }

  /* ─ Livraison partielle V2 (semences/azote) ou scellement V1 (non-semence) ── */
  async function handleSceller(id, lots, options = {}) {
    const { isDeporte = false, materielPrete = [] } = options;
    const target = commandes.find(c => c.id === id);

    /* ── Cas Azote Déporté → POST /livraisons avec isDeporte:true ── */
    if (isDeporte && target?._id) {
      const payload = {
        lignes:       lots.map(l => ({ conteneurSemence: '', quantiteExpediee: Number(l.quantiteExpediee) })),
        isDeporte:    true,
        materielPrete,
      };
      const result   = await api.post(`/api/transactions/${target._id}/livraisons`, payload);
      const statutBd = result?.statut ?? 'Totalement_Livrée';
      setCommandes(p => p.map(c => c.id !== id ? c : {
        ...c,
        statut:               statutBd === 'Totalement_Livrée' ? 'expedie' : 'en_cours',
        historiqueLivraisons: result?.transaction?.historiqueLivraisons ?? c.historiqueLivraisons,
      }));
      flash(id);
      return { blRef: result?.blReference ?? result?.referenceBL ?? null };
    }

    /* ── Cas V2 : semences avec repartGenetique → POST /livraisons ── */
    const isSemenceLivraison = lots.length > 0 && lots[0].conteneurSemence !== undefined;
    if (isSemenceLivraison && target?._id) {
      const lignes = lots
        .filter(l => Number(l.qteRetire) > 0)
        .map(l => ({
          ...(l.nni       && l.nni       !== '—' && l.nni       !== '' ? { nni:        l.nni        } : {}),
          ...(l.taureau   && l.taureau   !== '—' && l.taureau   !== '' ? { taureau:    l.taureau    } : {}),
          ...(l.typeProduit                                             ? { typeProduit: l.typeProduit } : {}),
          ...(l.articleId                                               ? { articleId:  l.articleId  } : {}),
          conteneurSemence: (l.conteneurSemence && l.conteneurSemence !== '—') ? l.conteneurSemence.trim() : '',
          quantiteExpediee: Number(l.qteRetire),
        }));
      if (!lignes.length) return;
      const result   = await api.post(`/api/transactions/${target._id}/livraisons`, { lignes, materielPrete });
      const statutBd = result?.statut ?? 'Partiellement_Livrée';
      const isDone   = statutBd === 'Totalement_Livrée';
      setCommandes(p => p.map(c => c.id !== id ? c : {
        ...c,
        statut:               isDone ? 'expedie' : 'en_cours',
        repartGenetique:      result?.transaction?.repartGenetique ?? c.repartGenetique,
        historiqueLivraisons: result?.transaction?.historiqueLivraisons ?? c.historiqueLivraisons,
      }));
      flash(id);
      return { blRef: result?.blReference ?? null };
    }

    /* ── Cas V1 : non-semence → PUT statut legacy ── */
    setCommandes(p => p.map(c => c.id === id ? { ...c, statut: "en_attente_admin", lotsScelles: lots } : c));
    flash(id);
    if (target?._id) {
      const repartPayload = lots
        .filter(l => l.nni)
        .map(l => ({
          taureau: l.taureau ?? '',
          nni:     l.nni,
          couleur: l.couleur ?? '',
          cuve:    l.cuve    ?? '',
          qte:     Number(l.qteRetire) || 0,
        }));
      try {
        await api.put(`/api/transactions/${target._id}/statut`, {
          statut: 'En attente',
          ...(repartPayload.length > 0 ? { repartGenetique: repartPayload } : {}),
        });
      } catch { /* vue locale déjà mise à jour */ }
    }
  }

  /* ─ Déblocage OTP : passe à Validé → affiche "Remise Transporteur" ─ */
  function handleOtpSuccess(id) {
    setCommandes(p => p.map(c => c.id === id ? { ...c, statut: "approuve" } : c));
    flash(id);
  }

  /* ─ Expédier : MAJ locale — ordre passe En_transit (API déjà appelée) ─ */
  function handleExpedition(id) {
    setCommandes(p => p.map(c => c.id === id ? { ...c, statut: "en_transit" } : c));
    flash(id);
  }

  const actives = commandes.filter(c => {
    if (DONE_STATUTS.includes(c.statut)) return false;
    if (filtre === "admin")  return c.origine === "admin";
    if (filtre === "region") return c.origine === "region";
    return true;
  });
  const expedies = commandes.filter(c => DONE_STATUTS.includes(c.statut));

  const FILTRES = [
    { id:"tous",   label:"Toutes les commandes" },
    { id:"admin",  label:"Ordres Admin"          },
    { id:"region", label:"Demandes Régionales"   },
  ];

  const [filtreDestinataire, setFiltreDestinataire] = useState('');
  const [filtreStatutExp,    setFiltreStatutExp]    = useState('');
  const [filtreDateExp,      setFiltreDateExp]      = useState('');

  const activeFiltres = useMemo(() => actives.filter(c => {
    if (filtreDestinataire && c.destinataire !== filtreDestinataire) return false;
    if (filtreStatutExp    && c.statut       !== filtreStatutExp)    return false;
    if (filtreDateExp      && c.dateCreation && c.dateCreation.slice(0,10) < filtreDateExp) return false;
    return true;
  }), [actives, filtreDestinataire, filtreStatutExp, filtreDateExp]);

  const SEL_E = "text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400";

  const colonnesActives = [
    {
      key: 'id', label: 'N° Ordre', sortable: true,
      render: v => <span className="text-xs font-mono font-semibold text-gray-600">{v}</span>,
    },
    {
      key: 'origine', label: 'Origine',
      render: v => <OrigineBadge origine={v} />,
    },
    {
      key: 'destinataire', label: 'Destinataire', sortable: true,
      render: (v, row) => (
        <div>
          <p className="text-xs font-semibold text-gray-800 whitespace-nowrap">{v}</p>
          <p className="text-[10px] text-gray-400">{row.region}</p>
        </div>
      ),
    },
    {
      key: 'articles', label: 'Articles',
      render: v => (
        <div className="space-y-1">
          {(v ?? []).map((a, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-gray-600">
              {articleIcon(a.type)}
              <span className="truncate">{a.qte} {a.unite} · {a.label}</span>
            </div>
          ))}
        </div>
      ),
      exportValue: row => (row.articles ?? []).map(a => `${a.qte} ${a.unite} ${a.label}`).join(', '),
    },
    {
      key: 'reliquatGlobal', label: 'Reliquat', sortable: true, align: 'right',
      render: v => (
        <span className={`text-xs font-mono font-semibold ${v > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
          {v > 0 ? v.toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'aMatérielPreté', label: 'Matériel prêté',
      render: v => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${v ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
          {v ? 'Oui' : 'Non'}
        </span>
      ),
    },
    {
      key: 'statut', label: 'Statut', sortable: true,
      render: (v, row) => {
        const sm = statutMeta(v);
        return (
          <div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sm.bg} ${sm.text} ${sm.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sm.dot} ${sm.pulse ? 'animate-pulse' : ''}`} />
              {sm.label}
            </span>
            {row.lotsScelles && v === 'en_attente_admin' && (
              <p className="text-[9px] text-gray-400 mt-0.5">{row.lotsScelles.length} lot{row.lotsScelles.length > 1 ? 's' : ''} scellé{row.lotsScelles.length > 1 ? 's' : ''}</p>
            )}
          </div>
        );
      },
    },
    {
      key: '__a', label: 'Action',
      render: (_v, cmd) => {
        const isAzoteCmd = cmd.articles.length > 0
          && !cmd.articles.some(a => a.type === 'semence')
          && cmd.articles.some(a => a.type === 'azote');
        return (
          <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
            {cmd.statut === 'a_preparer' && (
              <button onClick={() => setPickingCmd(cmd)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-white transition-colors whitespace-nowrap
                  ${isAzoteCmd ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isAzoteCmd
                  ? <><FlaskConical size={12}/> Générer le Retrait Externe</>
                  : <><ClipboardList size={12}/> Commencer le Picking</>}
              </button>
            )}
            {cmd.statut === 'en_cours' && (
              <>
                <button onClick={() => setPickingCmd(cmd)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors whitespace-nowrap">
                  <Send size={12}/> {isAzoteCmd ? 'Compléter le retrait' : 'Livraison partielle'}
                </button>
                {cmd.historiqueLivraisons?.length > 0 && (
                  isAzoteCmd ? (
                    <button onClick={() => imprimerBonRetraitFournisseur({
                      commande: cmd,
                      blRef: cmd.historiqueLivraisons[cmd.historiqueLivraisons.length - 1]?.referenceBL ?? cmd.id,
                      date: new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }),
                    })} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-cyan-200 text-cyan-600 hover:bg-cyan-50 transition-colors whitespace-nowrap">
                      <FileText size={11}/> Bon de Retrait
                    </button>
                  ) : (
                    <button onClick={() => imprimerBL({
                      commande: cmd, societe: '—', matricule: '',
                      blRef: cmd.historiqueLivraisons[cmd.historiqueLivraisons.length - 1]?.referenceBL ?? cmd.id,
                      date: new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }),
                    })} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors whitespace-nowrap">
                      <FileText size={11}/> Réimpr. BL
                    </button>
                  )
                )}
              </>
            )}
            {cmd.statut === 'approuve' && (
              isAzoteCmd ? (
                <button onClick={() => setPickingCmd(cmd)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white transition-colors whitespace-nowrap">
                  <FlaskConical size={12}/> Générer le Retrait Externe
                </button>
              ) : (
                <div className="flex flex-col gap-1">
                  {cmd.repartGenetique?.length > 0 && (
                    <button onClick={() => setPickingCmd(cmd)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap">
                      <Send size={12}/> Démarrer la livraison
                    </button>
                  )}
                  <button onClick={() => setTransporteurCmd(cmd)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap">
                    <Truck size={12}/> Remise Transporteur
                  </button>
                </div>
              )
            )}
            {cmd.statut === 'en_attente_admin' && (
              <button onClick={() => setOtpCmd(cmd)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors whitespace-nowrap"
                title="Saisir le PIN de dérogation Admin">
                <Key size={11}/> En attente Admin
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const colonnesExpedies = [
    {
      key: 'id', label: 'N° Ordre', sortable: true,
      render: v => <span className="text-xs font-mono text-gray-400">{v}</span>,
    },
    {
      key: 'origine', label: 'Origine',
      render: v => <OrigineBadge origine={v} />,
    },
    {
      key: 'destinataire', label: 'Destinataire', sortable: true,
      render: v => <p className="text-xs text-gray-500">{v}</p>,
    },
    {
      key: 'articles', label: 'Articles',
      render: v => (v ?? []).map((a, i) => (
        <p key={i} className="text-[10px] text-gray-400 truncate">{a.qte} {a.unite} · {a.label}</p>
      )),
      exportValue: row => (row.articles ?? []).map(a => `${a.qte} ${a.unite} ${a.label}`).join(', '),
    },
    {
      key: 'statut', label: 'Statut',
      render: v => v === 'en_transit' ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
          <Truck size={10}/> En transit
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
          <BadgeCheck size={10}/> Expédié
        </span>
      ),
    },
    {
      key: '__a', label: 'Document',
      render: (_v, cmd) => {
        const isAzoteCmd = cmd.articles.length > 0
          && !cmd.articles.some(a => a.type === 'semence')
          && cmd.articles.some(a => a.type === 'azote');
        if (!cmd.historiqueLivraisons?.length) return null;
        const blRef = cmd.historiqueLivraisons[cmd.historiqueLivraisons.length - 1]?.referenceBL ?? cmd.id;
        const date  = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
        const bonDechargeBtn = cmd.aMatérielPreté ? (
          <button
            onClick={e => {
              e.stopPropagation();
              imprimerBonDecharge({ commande: cmd, materielPrete: cmd.materielPrete, date });
            }}
            className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-600 hover:border-amber-400 hover:bg-amber-50 transition-all whitespace-nowrap">
            <Package size={11}/> Bon de Décharge
          </button>
        ) : null;

        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {isAzoteCmd ? (
              <button onClick={e => { e.stopPropagation(); imprimerBonRetraitFournisseur({ commande: cmd, blRef, date }); }}
                className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-cyan-200 text-cyan-600 hover:border-cyan-400 hover:bg-cyan-50 transition-all whitespace-nowrap">
                <FileText size={11}/> Bon de Retrait
              </button>
            ) : (
              <button onClick={e => { e.stopPropagation(); imprimerBL({ commande: cmd, societe: '—', matricule: '', blRef, date }); }}
                className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all whitespace-nowrap">
                <FileText size={11}/> BL
              </button>
            )}
            {bonDechargeBtn}
          </div>
        );
      },
    },
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

          <DataGridV2
            columns={colonnesActives}
            data={activeFiltres}
            rowKey="id"
            title="Ordres d'Expédition"
            exportFilename="expeditions-actives"
            loading={loading && commandes.length === 0}
            emptyMessage="Aucun ordre actif pour ce filtre."
            actions={
              <div className="flex flex-wrap items-center gap-1.5" onClick={e => e.stopPropagation()}>
                <select value={filtreDestinataire} onChange={e => setFiltreDestinataire(e.target.value)} className={SEL_E}>
                  <option value="">Tout destinataire</option>
                  {[...new Set(actives.map(c => c.destinataire).filter(Boolean))].sort().map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select value={filtreStatutExp} onChange={e => setFiltreStatutExp(e.target.value)} className={SEL_E}>
                  <option value="">Tout statut</option>
                  {['a_preparer','en_cours','approuve','en_attente_admin'].map(s => (
                    <option key={s} value={s}>{statutMeta(s).label}</option>
                  ))}
                </select>
                <input type="date" value={filtreDateExp} onChange={e => setFiltreDateExp(e.target.value)} className={SEL_E} />
              </div>
            }
          />

          {expedies.length > 0 && (
            <details className="border-t border-gray-100">
              <summary className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-400 cursor-pointer select-none list-none hover:bg-gray-50 transition-colors">
                <ChevronRight size={13}/> {expedies.length} ordre{expedies.length>1?"s":""} en transit / expédié{expedies.length>1?"s":""}
              </summary>
              <DataGridV2
                columns={colonnesExpedies}
                data={expedies}
                rowKey="id"
                title="Ordres Expédiés"
                exportFilename="expeditions-historique"
                loading={false}
                emptyMessage="Aucun ordre expédié."
              />
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
