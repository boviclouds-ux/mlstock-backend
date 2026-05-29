const express                       = require('express');
const router                        = express.Router();
const { protect, requireAdmin }     = require('../middleware/authMiddleware');
const { generateBackup, restoreBackup } = require('../controllers/backupController');

/* GET /api/backup/generate — Admin only */
router.get('/generate', protect, requireAdmin, generateBackup);

/* POST /api/backup/restore — Admin only, large JSON body allowed */
router.post('/restore', protect, requireAdmin, express.json({ limit: '100mb' }), restoreBackup);

module.exports = router;
