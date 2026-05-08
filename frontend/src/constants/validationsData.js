import { Inbox, Package, BadgeAlert } from "lucide-react";

export const REQUETES_INIT = [
  {
    id: "REQ-2025-0840", type: "reception", origine: "Semex Europe FR", pays: "France",
    demandeur: "Magasinier · Stock Central",
    detail: "Réception 500 doses Montbéliarde – ALPAGA RF", article: "Montbéliarde – ALPAGA RF",
    quantite: 490, date: "2025-06-14 07:15", statut: "en_attente", conformite: "anomalie",
    rapport: { cmdRef: "CMD-892", prevu: 500, recu: 490, remarque: "10 doses endommagées (choc thermique). Mises en quarantaine.", magasinier: "Karim Benali", temperature: "-185 °C (⚠ écart détecté)" },
  },
  {
    id: "REQ-2025-0841", type: "reception", origine: "Alta Genetics NL", pays: "Pays-Bas",
    demandeur: "Magasinier · Stock Central",
    detail: "Réception 1 000 doses Holstein – BENNER JESUALDO", article: "Holstein – BENNER JESUALDO",
    quantite: 1000, date: "2025-06-14 08:32", statut: "en_attente", conformite: "conforme",
    rapport: { cmdRef: "CMD-891", prevu: 1000, recu: 1000, remarque: "Livraison complète. Aucune anomalie.", magasinier: "Karim Benali", temperature: "-196 °C (OK)" },
  },
  {
    id: "REQ-2025-0842", type: "depassement", demandeur: "Unité Sakia Al Hamra",
    detail: "Demande 600 doses — Quota: 500", article: "Montbéliarde – ALPAGA RF",
    quantite: 100, quota: 500, consomme: 500, date: "2025-06-14 09:15", statut: "en_attente",
    priorite: "critique", unite: "Unité Sakia Al Hamra",
    historique: [{ mois: "Avril 2025", derogations: 1, accordees: 1 }, { mois: "Mai 2025", derogations: 2, accordees: 2 }, { mois: "Juin 2025", derogations: 1, accordees: 0 }],
    totalDerogations: 3,
  },
  {
    id: "REQ-2025-0843", type: "expedition", demandeur: "Magasinier · Tadla Azilal",
    detail: "Expédition 200 gants insémination", article: "Gants d'insémination",
    quantite: 200, date: "2025-06-14 09:48", statut: "en_attente",
  },
  {
    id: "REQ-2025-0844", type: "depassement", demandeur: "Unité Doukkala Abda",
    detail: "Demande 380 doses — Quota: 280", article: "Prim'Holstein – JACKPOT",
    quantite: 100, quota: 280, consomme: 280, date: "2025-06-14 10:22", statut: "en_attente",
    priorite: "critique", unite: "Unité Doukkala Abda",
    historique: [{ mois: "Avril 2025", derogations: 0, accordees: 0 }, { mois: "Mai 2025", derogations: 1, accordees: 1 }, { mois: "Juin 2025", derogations: 1, accordees: 0 }],
    totalDerogations: 1,
  },
  {
    id: "REQ-2025-0845", type: "expedition", demandeur: "Magasinier · Gharb Chrarda",
    detail: "Expédition 8 cuves azote 35L", article: "Cuves azote 35L",
    quantite: 8, date: "2025-06-14 10:05", statut: "en_attente",
  },
];

export const COOPERATIVES_LIST = [
  "Coopérative Sakia Al Hamra", "Coopérative Aït Si Salem", "Coopérative Tadla Azilal",
  "Coopérative Gharb Chrarda", "Coopérative Chaouia Ouardigha", "Coopérative Doukkala Abda",
];

export const ARTICLES_PUSH = [
  { label: "Holstein – BENNER JESUALDO", unite: "doses" },
  { label: "Montbéliarde – ALPAGA RF",   unite: "doses" },
  { label: "Azote liquide",              unite: "litres" },
  { label: "Cathéters jetables",         unite: "unités" },
];

export const DUREES = ["Valable 15 min", "Valable 1 heure", "Valable aujourd'hui", "Personnaliser..."];

export const CONF_COLOR = {
  conforme: "bg-emerald-50 text-emerald-700 border-emerald-200",
  anomalie: "bg-amber-50 text-amber-700 border-amber-200",
};

export function genPin()       { return String(Math.floor(1000 + Math.random() * 9000)); }
export function dureeToSec(d)  { if (d === "Valable 15 min") return 900; if (d === "Valable 1 heure") return 3600; if (d === "Valable aujourd'hui") return 28800; return 900; }
export function fmtTime(s)     { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60; if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`; return `${String(m).padStart(2, "0")}:${String(sc).padStart(2, "0")}`; }

export function typeMeta(type) {
  return {
    reception:   { label: "Réception",         bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   icon: Inbox      },
    expedition:  { label: "Expédition",         bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", icon: Package    },
    depassement: { label: "Dépassement Quota",  bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    icon: BadgeAlert },
  }[type];
}
