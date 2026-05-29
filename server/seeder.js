/**
 * seeder.js — Peuplement / vidage de la base MLstock
 *
 * Utilisation :
 *   node seeder.js        → vide puis injecte les données de démo
 *   node seeder.js -d     → vide uniquement (destroy mode)
 *   npm run seed          → alias node seeder.js
 *   npm run seed:destroy  → alias node seeder.js -d
 */

require('dotenv').config();
const mongoose = require('mongoose');

const User          = require('./models/User');
const Unite         = require('./models/Unite');
const Article       = require('./models/Article');
const Configuration = require('./models/Configuration');

/* ─── Couleurs ANSI pour les logs ──────────────────────── */
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  dim:    '\x1b[2m',
};
const ok  = (msg) => console.log(`${c.green}${c.bold}  ✔  ${c.reset}${msg}`);
const err = (msg) => console.log(`${c.red}${c.bold}  ✖  ${c.reset}${msg}`);
const inf = (msg) => console.log(`${c.cyan}  →  ${c.reset}${msg}`);
const sep = ()    => console.log(`${c.dim}  ${'─'.repeat(52)}${c.reset}`);

/* ═══════════════════════════════════════════════════════════
   destroyData : vide toutes les collections
═══════════════════════════════════════════════════════════ */
async function destroyData() {
  sep();
  inf('Vidage de toutes les collections…');

  await Promise.all([
    User.deleteMany({}),
    Unite.deleteMany({}),
    Article.deleteMany({}),
    Configuration.deleteMany({}),
  ]);

  ok(`${c.yellow}Toutes les collections ont été vidées.${c.reset}`);
  sep();
}

/* ═══════════════════════════════════════════════════════════
   importData : injecte les données de démo
═══════════════════════════════════════════════════════════ */
async function importData() {

  /* ── 0. Vidage préalable ─────────────────────────────── */
  await destroyData();
  inf('Injection des données de démonstration…');
  sep();

  /* ── 1. Configuration (singleton) ───────────────────── */
  inf('Configuration système…');
  await Configuration.updateConfig({
    campagneActive:              '2025-2026',
    campagneStatut:              'active',
    periodeRenouvellementQuotas: 'Annuel',
    seuilAlerteGlobal:           15,
    dureeValiditeOTP:            300,
    authForteTransferts:         true,
    modeMaintenance:             false,
    alertesSMSActives:           true,
    frequenceBackup:             'Quotidien',
  });
  ok('Configuration : 1 document injecté (campagne 2025-2026)');

  /* ── 2. Unités ───────────────────────────────────────── */
  inf('Unités…');
  const unitesData = [
    {
      code:    'HUB-ML-001',
      nom:     'Hub Central — Maroc Lait',
      region:  'Souss-Massa',
      type:    'ENTREPRISE',
      contact: { nom: 'Karim Benali', telephone: '+212 528 24 00 10', email: 'hub.central@marocl.ma' },
      actif:   true,
    },
    {
      code:    'COOP-TAR-002',
      nom:     'Coopérative Laitière de Taroudant',
      region:  'Souss-Massa',
      type:    'COOPERATIVE',
      contact: { nom: 'Fatima Zahra El Alami', telephone: '+212 528 85 12 34', email: 'contact@taroudant-coop.ma' },
      actif:   true,
    },
    {
      code:    'FARM-ATL-003',
      nom:     'Ferme Atlas Tiznit',
      region:  'Souss-Massa',
      type:    'PERSONNE_PHYSIQUE',
      contact: { nom: 'Ahmed Brahim', telephone: '+212 661 23 45 67', email: 'a.brahim@ferme-atlas.ma' },
      actif:   true,
    },
    {
      code:    'COOP-GHB-004',
      nom:     'Coopérative Gharb Chrarda',
      region:  'Rabat-Salé-Kénitra',
      type:    'COOPERATIVE',
      contact: { nom: 'Nadia Elkhattabi', telephone: '+212 537 44 56 78', email: 'n.elkhattabi@gharb-coop.ma' },
      actif:   true,
    },
    {
      code:    'COOP-TDL-005',
      nom:     'Coopérative Tadla Azilal',
      region:  'Béni Mellal-Khénifra',
      type:    'COOPERATIVE',
      contact: { nom: 'Mohammed Kassi', telephone: '+212 523 43 21 00', email: 'm.kassi@tadla-coop.ma' },
      actif:   true,
    },
  ];
  const unites = await Unite.insertMany(unitesData);
  const hubCentral = unites.find(u => u.code === 'HUB-ML-001');
  const coopTar    = unites.find(u => u.code === 'COOP-TAR-002');
  ok(`Unités : ${unites.length} documents injectés`);

  /* ── 3. Utilisateurs ─────────────────────────────────── */
  inf('Utilisateurs (les mots de passe seront hashés automatiquement)…');
  //
  // ⚠  Les mots de passe sont passés en clair.
  //    Le pre-save hook du modèle User les hashe via bcrypt avant sauvegarde.
  //
  // ⚠  Le modèle User n'a PAS de champ 'role' — il utilise un objet
  //    'permissions' avec des booléens. Tout champ 'role' serait
  //    silencieusement supprimé par Mongoose (strict mode).
  const usersData = [
    {
      prenom: 'Hassan',
      nom:    'El Fassi',
      email:  'admin@maroclait.ma',
      password: '123456',
      entite: hubCentral.nom,
      statut: 'Actif',
      mfa:    true,
      permissions: {
        isAdmin:        true,
        canDemand:      true,
        canReceive:     true,
        canDispatch:    true,
        canManageAppro: true,
        canActAsProxy:  true,
      },
    },
    {
      prenom: 'Karim',
      nom:    'Benali',
      email:  'magasinier@maroclait.ma',
      password: '123456',
      entite: hubCentral.nom,
      statut: 'Actif',
      mfa:    false,
      permissions: {
        isAdmin:        false,
        canDemand:      false,
        canReceive:     true,
        canDispatch:    true,
        canManageAppro: false,
        canActAsProxy:  false,
      },
    },
    {
      prenom: 'Fatima Zahra',
      nom:    'El Alami',
      email:  'contact@taroudant-coop.ma',
      password: '123456',
      entite: coopTar.nom,
      statut: 'Actif',
      mfa:    false,
      permissions: {
        isAdmin:        false,
        canDemand:      true,
        canReceive:     false,
        canDispatch:    false,
        canManageAppro: false,
        canActAsProxy:  false,
      },
    },
    {
      prenom: 'Omar',
      nom:    'Tazi',
      email:  'admin2@maroclait.ma',
      password: '123456',
      entite: hubCentral.nom,
      statut: 'Actif',
      mfa:    false,
      permissions: {
        isAdmin:        true,
        canDemand:      false,
        canReceive:     false,
        canDispatch:    false,
        canManageAppro: false,
        canActAsProxy:  false,
      },
    },
    {
      prenom: 'Youssef',
      nom:    'Alaoui',
      email:  'pending@maroclait.ma',
      password: '123456',
      entite: 'Maroc Lait — Hub Central',
      statut: 'En attente',
      mfa:    false,
      permissions: {
        isAdmin:        false,
        canDemand:      false,
        canReceive:     false,
        canDispatch:    false,
        canManageAppro: false,
        canActAsProxy:  false,
      },
    },
  ];

  // insertMany ne déclenche pas les hooks — on utilise create() pour bcrypt
  const users = await User.create(usersData);
  ok(`Utilisateurs : ${users.length} documents injectés (mots de passe hashés)`);

  /* ── 4. Articles (catalogue) ─────────────────────────── */
  inf('Articles du catalogue…');
  const articlesData = [
    {
      code:          'HOL-001',
      designation:   'Semence Holstein — Taureau Jesualdo',
      categorie:     'Semences',
      uniteMesure:   'Dose',
      valeurEstimee: 450,
      seuilAlerte:   50,
      actif:         true,
    },
    {
      code:          'HOL-002',
      designation:   'Semence Holstein — DESTINED P',
      categorie:     'Semences',
      uniteMesure:   'Dose',
      valeurEstimee: 420,
      seuilAlerte:   50,
      actif:         true,
    },
    {
      code:          'MNT-001',
      designation:   'Semence Montbéliarde — ALPAGA RF',
      categorie:     'Semences',
      uniteMesure:   'Dose',
      valeurEstimee: 380,
      seuilAlerte:   40,
      actif:         true,
    },
    {
      code:          'NRM-001',
      designation:   'Semence Normande — OLIVIER ET',
      categorie:     'Semences',
      uniteMesure:   'Dose',
      valeurEstimee: null,       // dotation subventionnée
      seuilAlerte:   30,
      actif:         true,
    },
    {
      code:          'AZO-001',
      designation:   'Azote liquide industriel',
      categorie:     'Azote',
      uniteMesure:   'L',
      valeurEstimee: null,       // subventionné
      seuilAlerte:   500,
      actif:         true,
    },
    {
      code:          'MAT-010',
      designation:   'Cuve Azote Liquide 20L',
      categorie:     'Matériel',
      uniteMesure:   'Unité',
      valeurEstimee: 1200,
      seuilAlerte:   5,
      actif:         true,
    },
    {
      code:          'MAT-011',
      designation:   'Cathéters d\'insémination jetables',
      categorie:     'Matériel',
      uniteMesure:   'Unité',
      valeurEstimee: 8,
      seuilAlerte:   200,
      actif:         true,
    },
    {
      code:          'SAN-005',
      designation:   'Gants de fouille vétérinaire',
      categorie:     'Santé',
      uniteMesure:   'Boîte',
      valeurEstimee: 45,
      seuilAlerte:   10,
      actif:         true,
    },
    {
      code:          'SAN-006',
      designation:   'Antibiotiques intra-mammaires',
      categorie:     'Santé',
      uniteMesure:   'Unité',
      valeurEstimee: 85,
      seuilAlerte:   20,
      actif:         true,
    },
    {
      code:          'SAN-007',
      designation:   'Vitamines ADE injectable',
      categorie:     'Santé',
      uniteMesure:   'Unité',
      valeurEstimee: null,       // subventionné
      seuilAlerte:   30,
      actif:         true,
    },
  ];
  const articles = await Article.insertMany(articlesData);
  ok(`Articles : ${articles.length} documents injectés`);

  /* ── Récapitulatif ───────────────────────────────────── */
  sep();
  console.log(`\n${c.green}${c.bold}  ✔  Base de données peuplée avec succès !${c.reset}\n`);
  console.log(`${c.dim}  Comptes de démo (mot de passe : 123456) :${c.reset}`);
  console.log(`${c.dim}  • admin@maroclait.ma        → isAdmin: true (tous droits)${c.reset}`);
  console.log(`${c.dim}  • magasinier@maroclait.ma   → canDispatch: true, canReceive: true${c.reset}`);
  console.log(`${c.dim}  • contact@taroudant-coop.ma → canDemand: true${c.reset}`);
  console.log(`${c.dim}  • admin2@maroclait.ma       → isAdmin: true${c.reset}`);
  console.log(`${c.dim}  • pending@maroclait.ma      → En attente (tous droits: false)\n${c.reset}`);
}

/* ═══════════════════════════════════════════════════════════
   POINT D'ENTRÉE
═══════════════════════════════════════════════════════════ */
async function main() {
  const destroyOnly = process.argv[2] === '-d';

  console.log(`\n${c.cyan}${c.bold}  MLstock — Seeder v2.0${c.reset}`);
  console.log(`${c.dim}  Base : ${process.env.MONGO_URI?.split('@')[1]?.split('/')[1] ?? 'mlstock_db'}${c.reset}`);
  console.log(`${c.dim}  Mode : ${destroyOnly ? 'DESTRUCTION UNIQUEMENT' : 'INJECTION COMPLÈTE'}${c.reset}\n`);

  try {
    await mongoose.connect(process.env.MONGO_URI);
    ok('Connexion MongoDB établie');

    if (destroyOnly) {
      await destroyData();
      ok('Base de données vidée avec succès.');
    } else {
      await importData();
    }
  } catch (e) {
    err(`Erreur critique : ${e.message}`);
    console.error(e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    inf('Connexion MongoDB fermée.');
    process.exit(0);
  }
}

main();
