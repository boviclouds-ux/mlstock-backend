const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connecté à la base de données MLstock (Isolée)'))
  .catch((err) => console.error('❌ Erreur de connexion MongoDB:', err));

// Route de test basique
app.get('/api/status', (req, res) => {
  res.json({ message: 'API MLstock Opérationnelle', version: '1.0' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});