// ─── ARCHIVE : données de démonstration — Gestion des Quotas ─────────────────
// Ce fichier N'EST PAS importé par les composants actifs.
// Format attendu de l'API /quotas/data

export const MOCK_SEMENCES = [
  { id:1, cooperative:"Unité Aït Si Salem",      region:"Souss-Massa",          article:"Holstein – BENNER JESUALDO", dotation:500,  consomme:450, statut:"critique" },
  { id:2, cooperative:"Unité Sakia Al Hamra",    region:"Laâyoune-Sakia",       article:"Montbéliarde – ALPAGA RF",   dotation:320,  consomme:180, statut:"normal"   },
  { id:3, cooperative:"Unité Tadla Azilal",      region:"Béni Mellal-Khénifra", article:"Holstein – DESTINED P",      dotation:750,  consomme:620, statut:"alerte"   },
  { id:4, cooperative:"Unité Gharb Chrarda",     region:"Rabat-Salé-Kénitra",   article:"Normande – OLIVIER ET",      dotation:400,  consomme:110, statut:"normal"   },
  { id:5, cooperative:"Unité Chaouia Ouardigha", region:"Casablanca-Settat",    article:"Holstein – BENNER JESUALDO", dotation:600,  consomme:555, statut:"critique" },
  { id:6, cooperative:"Unité Doukkala Abda",     region:"Marrakech-Safi",       article:"Prim'Holstein – JACKPOT",    dotation:280,  consomme:195, statut:"alerte"   },
];

export const MOCK_CONSOMMABLES = [
  { id:1, cooperative:"Unité Aït Si Salem",   region:"Souss-Massa",          article:"Azote liquide (L)",               dotation:2000, consomme:1850, statut:"critique" },
  { id:2, cooperative:"Unité Sakia Al Hamra", region:"Laâyoune-Sakia",       article:"Gants d'insémination (unités)",   dotation:5000, consomme:2100, statut:"normal"   },
  { id:3, cooperative:"Unité Tadla Azilal",   region:"Béni Mellal-Khénifra", article:"Paillettes de stockage (boîtes)", dotation:300,  consomme:245,  statut:"alerte"   },
  { id:4, cooperative:"Unité Gharb Chrarda",  region:"Rabat-Salé-Kénitra",   article:"Cathéters jetables (unités)",     dotation:1200, consomme:300,  statut:"normal"   },
];

export const MOCK_MATERIEL = [
  { id:1, cooperative:"Unité Aït Si Salem",      region:"Souss-Massa",       article:"Cuve à azote 35L",                dotation:4,  consomme:3, statut:"alerte"   },
  { id:2, cooperative:"Unité Sakia Al Hamra",    region:"Laâyoune-Sakia",    article:"Pistolet d'insémination Minitüb", dotation:10, consomme:4, statut:"normal"   },
  { id:3, cooperative:"Unité Chaouia Ouardigha", region:"Casablanca-Settat", article:"Microscope portable LED",         dotation:2,  consomme:2, statut:"critique" },
];
