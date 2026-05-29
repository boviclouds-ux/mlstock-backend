const User              = require('../models/User');
const Lot               = require('../models/Lot');
const Cuve              = require('../models/Cuve');
const Transaction       = require('../models/Transaction');
const Unite             = require('../models/Unite');
const Article           = require('../models/Article');
const Fournisseur       = require('../models/Fournisseur');
const Approvisionnement = require('../models/Approvisionnement');
const Configuration     = require('../models/Configuration');
const Transporteur      = require('../models/Transporteur');

const COLLECTIONS = [
  { key: 'users',              Model: User },
  { key: 'lots',               Model: Lot },
  { key: 'cuves',              Model: Cuve },
  { key: 'transactions',       Model: Transaction },
  { key: 'unites',             Model: Unite },
  { key: 'articles',           Model: Article },
  { key: 'fournisseurs',       Model: Fournisseur },
  { key: 'approvisionnements', Model: Approvisionnement },
  { key: 'configuration',      Model: Configuration },
  { key: 'transporteurs',      Model: Transporteur },
];

/* GET /api/backup/generate */
const generateBackup = async (req, res) => {
  try {
    const now = new Date();
    const backup = {
      version:    '1.0',
      appName:    'BovIClouds',
      exportedAt: now.toISOString(),
      exportedBy: req.user.email ?? String(req.user._id),
    };

    for (const { key, Model } of COLLECTIONS) {
      backup[key] = await Model.find({}).lean();
    }

    // Persist timestamp of last backup
    await Configuration.updateConfig({ derniereBackup: now });

    const dateStr  = now.toISOString().slice(0, 10);
    const filename = `boviclouds_backup_${dateStr}.json`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(backup);
  } catch (err) {
    console.error('[Backup] generateBackup :', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* POST /api/backup/restore */
const restoreBackup = async (req, res) => {
  try {
    const backup = req.body;

    if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
      return res.status(400).json({ message: 'Fichier de sauvegarde invalide ou mal formé.' });
    }

    const hasKnownKey = COLLECTIONS.some(({ key }) => Array.isArray(backup[key]));
    if (!hasKnownKey) {
      return res.status(400).json({ message: "Format non reconnu — ce fichier n'est pas une sauvegarde BovIClouds valide." });
    }

    const results = {};

    for (const { key, Model } of COLLECTIONS) {
      if (!Array.isArray(backup[key])) {
        results[key] = 'absent — ignoré';
        continue;
      }
      await Model.deleteMany({});
      if (backup[key].length > 0) {
        await Model.insertMany(backup[key], { ordered: false });
      }
      results[key] = backup[key].length;
    }

    res.json({
      message:    'Restauration terminée avec succès.',
      exportedAt: backup.exportedAt ?? null,
      results,
    });
  } catch (err) {
    console.error('[Backup] restoreBackup :', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { generateBackup, restoreBackup };
