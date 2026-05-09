const express    = require('express');
const router     = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
} = require('../controllers/articleController');

const ADMIN_ROLES = ['ADMIN_FEDERAL', 'ADMIN'];

// Lecture : tous les utilisateurs authentifiés (Magasinier, Unité, Admin)
router.get('/',    protect, getAllArticles);
router.get('/:id', protect, getArticleById);

// Écriture : réservée aux Admins (gestion du catalogue)
router.post('/',   protect, authorize(...ADMIN_ROLES), createArticle);
router.put('/:id', protect, authorize(...ADMIN_ROLES), updateArticle);

module.exports = router;
