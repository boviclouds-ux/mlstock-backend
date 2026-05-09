require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
}));
app.use(express.json());

// Enregistrement explicite des modèles Mongoose
// (nécessaire quand un modèle est référencé via ref: 'X' mais pas importé par une route)
require('./models/Fournisseur');
require('./models/Unite');
require('./models/User');

const authRoutes         = require('./routes/auth');
const uniteRoutes        = require('./routes/unites');
const articleRoutes      = require('./routes/articles');
const transactionRoutes  = require('./routes/transactions');

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'API MLstock opérationnelle', version: '2.0' });
});

app.use('/api/auth',         authRoutes);
app.use('/api/unites',       uniteRoutes);
app.use('/api/articles',     articleRoutes);
app.use('/api/transactions', transactionRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connecté avec succès');
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Échec de la connexion MongoDB :', err.message);
    process.exit(1);
  });