const express = require('express');
const auth = require('../middleware/auth');
const permit = require('../middleware/roles');
const { ROLES } = require('../config/constants');
const {
  createCategory, getCategories,
  createService, getServices,
  createAddOn, getAddOns
} = require('../controllers/catalogController');

const router = express.Router();

// Category
router.post('/categories', auth(), permit(ROLES.ADMIN), createCategory);
router.get('/categories', auth(false), getCategories);

// Service
router.post('/services', auth(), permit(ROLES.ADMIN), createService);
router.get('/services', auth(false), getServices);

// AddOn
router.post('/addons', auth(), permit(ROLES.ADMIN), createAddOn);
router.get('/addons', auth(false), getAddOns);

module.exports = router;
