const express = require('express');
const router = express.Router();
const {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
} = require('../controllers/articleController');

router.post('/', createArticle);
router.get('/', getAllArticles);
router.get('/:id', getArticleById);
router.put('/:id', updateArticle);
router.delete('/:id', deleteArticle);

module.exports = router;
