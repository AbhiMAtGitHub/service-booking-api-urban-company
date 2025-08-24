const express = require('express');
const auth = require('../middleware/auth');
const permit = require('../middleware/roles');
const { ROLES } = require('../config/constants');
const { upsertProfile, getMyProfile, searchPros } = require('../controllers/proController');
const validate = require('../middleware/validators/validate');

const router = express.Router();

// Pro creates/updates their profile
router.post('/me', auth(), permit(ROLES.PRO), upsertProfile);
router.get('/me', auth(), permit(ROLES.PRO), getMyProfile);

// Public search endpoint (no auth required) - but you can require auth if you'd like
router.get('/search', searchPros);

module.exports = router;
