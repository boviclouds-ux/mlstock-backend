import { Truck, CheckCircle, AlertTriangle, Zap, Shield } from "lucide-react";

export const USER = {
  nom: "Hassan El Fassi",
  role: "Admin Fédéral",
  email: "h.elfassi@marocl.ma",
  initiales: "HF",
  region: "Siège · Rabat",
  dernConn: "Aujourd'hui à 08:14",
};

export const REGIONS = [
  { nom: "Souss-Massa",          pct: 82, doses: 1240, statut: "alerte"   },
  { nom: "Casablanca-Settat",    pct: 71, doses: 980,  statut: "normal"   },
  { nom: "Béni Mellal-Khénifra", pct: 64, doses: 890,  statut: "normal"   },
  { nom: "Rabat-Salé-Kénitra",   pct: 55, doses: 760,  statut: "normal"   },
  { nom: "Marrakech-Safi",       pct: 38, doses: 520,  statut: "normal"   },
  { nom: "Laâyoune-Sakia",       pct: 22, doses: 310,  statut: "critique" },
];

export const ACTIVITE = [
  { id: 1, delta: "Il y a 8 min",  icon: Truck,         bg: "bg-blue-50 dark:bg-blue-900/60",    ring: "ring-blue-200 dark:ring-blue-800",    ic: "text-blue-600 dark:text-blue-400",    action: "Expédition envoyée",    detail: "500 doses Holstein → Coopérative Aït Si Salem", auteur: "Magasinier Benali" },
  { id: 2, delta: "Il y a 42 min", icon: CheckCircle,   bg: "bg-emerald-50 dark:bg-emerald-900/60", ring: "ring-emerald-200 dark:ring-emerald-800", ic: "text-emerald-600 dark:text-emerald-400", action: "Réception validée",   detail: "1 000 doses Alta Genetics NL · CMD-891",       auteur: "Admin Fédéral"    },
  { id: 3, delta: "Il y a 1h 20",  icon: AlertTriangle, bg: "bg-amber-50 dark:bg-amber-900/60",   ring: "ring-amber-200 dark:ring-amber-800",   ic: "text-amber-500 dark:text-amber-400",  action: "Dérogation accordée",  detail: "+100 doses · Unité Sakia Al Hamra",            auteur: "Admin Fédéral"    },
  { id: 4, delta: "Il y a 2h 05",  icon: Zap,           bg: "bg-violet-50 dark:bg-violet-900/60", ring: "ring-violet-200 dark:ring-violet-800", ic: "text-violet-600 dark:text-violet-400", action: "Ordre prioritaire émis", detail: "Répartition Montbéliarde → Gharb Chrarda",      auteur: "Admin Fédéral"    },
  { id: 5, delta: "Il y a 3h",     icon: Shield,        bg: "bg-slate-100 dark:bg-slate-700",     ring: "ring-slate-200 dark:ring-slate-600",   ic: "text-slate-500 dark:text-slate-400",  action: "PIN dérogation généré", detail: "Code 15 min · Sakia Al Hamra",                 auteur: "Admin Fédéral"    },
];

export function barColor(pct, statut) {
  if (statut === "critique") return "bg-red-500";
  if (statut === "alerte" || pct >= 80) return "bg-amber-400";
  if (pct >= 60) return "bg-blue-500";
  return "bg-emerald-500";
}

export function dotColor(statut) {
  return statut === "critique"
    ? "bg-red-500"
    : statut === "alerte"
    ? "bg-amber-400"
    : "bg-emerald-500";
}
