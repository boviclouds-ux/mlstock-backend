const express    = require('express');
const router     = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
} = require('../controllers/articleController');

// Lecture : tous les utilisateurs authentifiés
router.get('/',    protect, getAllArticles);
router.get('/:id', protect, getArticleById);

// Écriture : réservée aux admins (gestion du catalogue)
router.post('/',   protect, requireAdmin, createArticle);
router.put('/:id', protect, requireAdmin, updateArticle);

module.exports = router;
