const Article = require('../models/Article');

const createArticle = async (req, res) => {
  try {
    const article = new Article(req.body);
    const saved = await article.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Un article avec ce code existe déjà.' });
    }
    res.status(400).json({ message: err.message });
  }
};

const getAllArticles = async (req, res) => {
  try {
    const filter = {};
    if (req.query.categorie) filter.categorie = req.query.categorie;

    const articles = await Article.find(filter).sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article introuvable.' });
    }
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!article) {
      return res.status(404).json({ message: 'Article introuvable.' });
    }
    res.json(article);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Un article avec ce code existe déjà.' });
    }
    res.status(400).json({ message: err.message });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { actif: false },
      { new: true }
    );
    if (!article) {
      return res.status(404).json({ message: 'Article introuvable.' });
    }
    res.json({ message: 'Article désactivé.', article });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createArticle, getAllArticles, getArticleById, updateArticle, deleteArticle };
