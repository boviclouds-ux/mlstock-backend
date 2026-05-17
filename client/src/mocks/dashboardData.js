// ─── ARCHIVE : données de démonstration du Tableau de Bord ───────────────────
// Ce fichier N'EST PAS importé par les composants actifs.
// Il documente le format attendu de l'API /dashboard/stats
// et sert de référence pour les tests et le développement backend.

export const MOCK_STOCKS = {
  semences: 45200,
  azote:    8500,
};

export const MOCK_REGIONS = [
  { nom:"Souss-Massa",          pct:82, doses:1240, statut:"alerte"   },
  { nom:"Casablanca-Settat",    pct:71, doses:980,  statut:"normal"   },
  { nom:"Béni Mellal-Khénifra", pct:64, doses:890,  statut:"normal"   },
  { nom:"Rabat-Salé-Kénitra",   pct:55, doses:760,  statut:"normal"   },
  { nom:"Marrakech-Safi",       pct:38, doses:520,  statut:"normal"   },
  { nom:"Laâyoune-Sakia",       pct:22, doses:310,  statut:"critique" },
];

// Format retourné par l'API (type en string, pas de référence React)
export const MOCK_ACTIVITE = [
  { id:1, type:"EXPEDITION", delta:"Il y a 8 min",  action:"Expédition envoyée",     detail:"500 doses Holstein → Coopérative Aït Si Salem" },
  { id:2, type:"RECEPTION",  delta:"Il y a 42 min", action:"Réception validée",       detail:"1 000 doses Alta Genetics NL · CMD-891"        },
  { id:3, type:"DEROGATION", delta:"Il y a 1h 20",  action:"Dérogation accordée",     detail:"+100 doses · Unité Sakia Al Hamra"              },
  { id:4, type:"ORDRE",      delta:"Il y a 2h 05",  action:"Ordre prioritaire émis",  detail:"Répartition Montbéliarde → Gharb Chrarda"       },
  { id:5, type:"PIN",        delta:"Il y a 3h",     action:"PIN dérogation généré",   detail:"Code 15 min · Sakia Al Hamra"                   },
];

export const MOCK_LOTS_ALERTE = [
  "LOT-0044 · 14j restants",
  "LOT-0048 · 7j restants",
  "LOT-0042 · 51j restants",
];

// Seuils d'alerte — configuration métier (à terme exposés par /api/config)
export const MOCK_SEUILS = { semences: 5000, azote: 2000 };
