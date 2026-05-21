require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

/* ═══════════════════════════════════════════════════════════
   CONFIGURATION CORS
   Seules les origines explicitement listées dans ALLOWED_ORIGINS
   peuvent interroger cette API.

   Pour ajouter l'URL de production, décommentez la ligne
   correspondante ci-dessous OU ajoutez FRONTEND_URL dans .env.
═══════════════════════════════════════════════════════════ */
const ALLOWED_ORIGINS = [
  'http://localhost:5173',              // dev Vite local
  'http://localhost:3000',              // dev CRA / autre port local
  'https://stockml.gobranding.ma',     // production Hostinger
  process.env.FRONTEND_URL,            // surcharge via variable Render (optionnel)
].filter(Boolean);

const corsOptions = {
  origin(incomingOrigin, callback) {
    // Autorise les requêtes sans header Origin (Postman, curl, appels internes)
    if (!incomingOrigin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(incomingOrigin)) return callback(null, true);
    callback(new Error(`CORS : origine "${incomingOrigin}" non autorisée.`));
  },
  methods:          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:   ['Content-Type', 'Authorization'],
  exposedHeaders:   ['Content-Length'],
  credentials:      true,   // nécessaire pour transmettre le JWT Bearer
  optionsSuccessStatus: 200, // compatibilité navigateurs anciens (IE11, etc.)
};

// Répond explicitement aux requêtes preflight OPTIONS avant toute autre route
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());

// Enregistrement explicite des modèles Mongoose
// (nécessaire quand un modèle est référencé via ref: 'X' mais pas importé par une route)
require('./models/User');
require('./models/Fournisseur');
require('./models/Unite');
require('./models/Article');
require('./models/Cooperative');  // utilisé via ref dans Dotation + PinSession
require('./models/Campagne');     // utilisé via ref dans Dotation
require('./models/Lot');
require('./models/Cuve');
require('./models/Transporteur');
require('./models/Approvisionnement');
require('./models/Dotation');
require('./models/Transaction');
require('./models/Otp');

const authRoutes         = require('./routes/auth');
const uniteRoutes        = require('./routes/unites');
const articleRoutes      = require('./routes/articles');
const transactionRoutes  = require('./routes/transactions');
const lotRoutes          = require('./routes/lots');
const cuveRoutes         = require('./routes/cuves');
const fournisseurRoutes      = require('./routes/fournisseurs');
const transporteurRoutes     = require('./routes/transporteurs');
const approvisionnementRoutes = require('./routes/approvisionnements');
const usersRoutes            = require('./routes/users');
const dashboardRoutes    = require('./routes/dashboard');
const quotasRoutes       = require('./routes/quotas');
const validationsRoutes  = require('./routes/validations');

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'API MLstock opérationnelle', version: '2.0' });
});

app.use('/api/auth',         authRoutes);
app.use('/api/unites',       uniteRoutes);
app.use('/api/articles',     articleRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/lots',         lotRoutes);
app.use('/api/cuves',        cuveRoutes);
app.use('/api/fournisseurs',       fournisseurRoutes);
app.use('/api/transporteurs',      transporteurRoutes);
app.use('/api/approvisionnements', approvisionnementRoutes);
app.use('/api/users',              usersRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/quotas',       quotasRoutes);
app.use('/api',             validationsRoutes); // /api/otp/generate · /api/ordres/:id/valider-*

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    /* Synchronise les index MongoDB :
       - Supprime les anciens index unique GLOBAUX sur Article.code et Unite.code
       - Crée les nouveaux index PARTIELS (uniquement sur { actif: true })
       Ceci permet le soft-delete + recréation avec le même code. */
    const Article      = require('./models/Article');
    const Unite        = require('./models/Unite');
    const Fournisseur  = require('./models/Fournisseur');
    const Transporteur = require('./models/Transporteur');
    try {
      await Promise.all([
        Article.syncIndexes(),
        Unite.syncIndexes(),
        Fournisseur.syncIndexes(),
        Transporteur.syncIndexes(),
      ]);
      console.log('✅ Index partiels synchronisés (Article, Unite, Fournisseur, Transporteur)');
    } catch (e) {
      console.warn('⚠ syncIndexes :', e.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Serveur Backend MLStock démarré avec succès sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Échec de la connexion MongoDB :', err.message);
    process.exit(1);
  });