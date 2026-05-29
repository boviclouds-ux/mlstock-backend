// ═══════════════════════════════════════════════════════════════════
// mongo-init/init.js
// Exécuté une seule fois au premier démarrage du conteneur MongoDB.
// Crée un utilisateur applicatif avec des droits MINIMAUX (readWrite
// uniquement sur la DB applicative — jamais accès à admin ou local).
// ═══════════════════════════════════════════════════════════════════

// Se connecter à la base applicative (pas admin)
const appDbName  = process.env['MONGO_INITDB_DATABASE'];
const appUser    = process.env['MONGO_APP_USER'];
const appPassword = process.env['MONGO_APP_PASSWORD'];

if (!appDbName || !appUser || !appPassword) {
  print('❌ Variables MONGO_INITDB_DATABASE / MONGO_APP_USER / MONGO_APP_PASSWORD manquantes.');
  quit(1);
}

const appDb = db.getSiblingDB(appDbName);

appDb.createUser({
  user:  appUser,
  pwd:   appPassword,
  roles: [
    { role: 'readWrite', db: appDbName },
  ],
});

print(`✅ Utilisateur applicatif '${appUser}' créé sur la base '${appDbName}'.`);
print('   Droits : readWrite uniquement — pas d\'accès à admin ou local.');
