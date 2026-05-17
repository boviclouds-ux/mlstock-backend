// ─── ARCHIVE : données de démonstration — Utilisateurs & Accès ───────────────
// Ce fichier N'EST PAS importé par les composants actifs.
// Format attendu de l'API GET /api/users et GET /api/users/demandes

export const MOCK_UTILISATEURS = [
  { id:"USR-001", prenom:"Hassan",       nom:"El Fassi",   email:"h.elfassi@marocl.ma",  roleKey:"ADMIN_FEDERAL", entite:"Direction · Siège Rabat",   derniereConnexion:"2025-06-14 09:32", statut:"actif",    mfa:true  },
  { id:"USR-002", prenom:"Karim",        nom:"Benali",     email:"k.benali@marocl.ma",   roleKey:"MAGASINIER",    entite:"Stock Central · Agadir",    derniereConnexion:"2025-06-14 07:15", statut:"actif",    mfa:false },
  { id:"USR-003", prenom:"Fatima Zahra", nom:"El Alami",   email:"f.zahra@sah.ma",       roleKey:"UNITE",         entite:"Unité Sakia Al Hamra",      derniereConnexion:"2025-06-13 14:20", statut:"actif",    mfa:false },
  { id:"USR-004", prenom:"Ahmed",        nom:"Brahim",     email:"a.brahim@aitsi.ma",    roleKey:"UNITE",         entite:"Unité Aït Si Salem",        derniereConnexion:"2025-06-12 10:45", statut:"actif",    mfa:false },
  { id:"USR-005", prenom:"Nadia",        nom:"Elkhattabi", email:"n.elkhattabi@gharb.ma",roleKey:"UNITE",         entite:"Unité Gharb Chrarda",       derniereConnexion:"2025-06-10 08:00", statut:"actif",    mfa:false },
  { id:"USR-006", prenom:"Omar",         nom:"Tazi",       email:"o.tazi@marocl.ma",     roleKey:"ADMIN",         entite:"Direction · Siège Rabat",   derniereConnexion:"2025-06-09 16:30", statut:"actif",    mfa:true  },
  { id:"USR-007", prenom:"Rachid",       nom:"Moufid",     email:"r.moufid@marocl.ma",   roleKey:"MAGASINIER",    entite:"Stock Central · Agadir",    derniereConnexion:"2025-05-28 11:10", statut:"suspendu", mfa:false },
  { id:"USR-008", prenom:"Salma",        nom:"Chraibi",    email:"s.chraibi@tadla.ma",   roleKey:"UNITE",         entite:"Unité Tadla Azilal",        derniereConnexion:"2025-06-01 09:00", statut:"suspendu", mfa:false },
];

export const MOCK_DEMANDES = [
  { id:"REQ-001", date:"2025-06-13", prenom:"Youssef",  nom:"Alaoui",   email:"y.alaoui@gharb.ma",     roleDemande:"Responsable Unité", entite:"Unité Gharb Chrarda"     },
  { id:"REQ-002", date:"2025-06-12", prenom:"Zineb",    nom:"Hamdaoui", email:"z.hamdaoui@doukkala.ma",roleDemande:"Responsable Unité", entite:"Unité Doukkala Abda"     },
  { id:"REQ-003", date:"2025-06-11", prenom:"Abdelali", nom:"Zemmouri", email:"a.zemmouri@marocl.ma",  roleDemande:"Magasinier",        entite:"Stock Central · Agadir"  },
  { id:"REQ-004", date:"2025-06-10", prenom:"Houda",    nom:"Bensaid",  email:"h.bensaid@chaouia.ma",  roleDemande:"Responsable Unité", entite:"Unité Chaouia Ouardigha" },
];
