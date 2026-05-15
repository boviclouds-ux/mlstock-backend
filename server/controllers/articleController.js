const Article = require('../models/Article');

/* ─── Helper : formate les erreurs Mongoose ────────────── */
function validationMessage(err) {
  return Object.values(err.errors).map(e => e.message).join(' | ');
}

/* ═══════════════════════════════════════════════════════════
   GET /api/articles
   Query params : ?categorie=Semences  ?actif=true  ?search=holstein
═══════════════════════════════════════════════════════════ */
const getAllArticles = async (req, res) => {
  try {
    const filter = {};
    if (req.query.actif !== undefined) filter.actif = req.query.actif === 'true';
    if (req.query.categorie)           filter.categorie = new RegExp(req.query.categorie, 'i');

    // Recherche texte libre sur désignation
    if (req.query.search) {
      filter.designation = new RegExp(req.query.search, 'i');
    }

    const articles = await Article.find(filter).sort({ designation: 1 });
    res.status(200).json(articles);
  } catch (err) {
    console.error('[Article] getAllArticles :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   GET /api/articles/:id
═══════════════════════════════════════════════════════════ */
const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article introuvable.' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   POST /api/articles
   Corps : { code, designation, categorie, uniteMesure, valeurEstimee?, seuilAlerte }
═══════════════════════════════════════════════════════════ */
const createArticle = async (req, res) => {
  try {
    const article = await Article.create(req.body);
    res.status(201).json(article);
  } catch (err) {
    if (err.code === 11000)             return res.status(409).json({ message: 'Un article avec ce code existe déjà.' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    console.error('[Article] createArticle :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   PUT /api/articles/:id
   Modifie n'importe quel champ (désignation, prix, seuil, actif…).
   Le champ "code" est protégé.
═══════════════════════════════════════════════════════════ */
const updateArticle = async (req, res) => {
  try {
    const { code: _code, ...updates } = req.body;

    const article = await Article.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!article) return res.status(404).json({ message: 'Article introuvable.' });
    res.json(article);
  } catch (err) {
    if (err.code === 11000)             return res.status(409).json({ message: 'Un article avec ce code existe déjà.' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: validationMessage(err) });
    console.error('[Article] updateArticle :', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllArticles, getArticleById, createArticle, updateArticle };
