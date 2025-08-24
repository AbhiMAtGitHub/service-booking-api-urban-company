const express = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validators/validate');
const { signupSchema, loginSchema } = require('../middleware/validators/auth.validation.js');
const auth = require('../middleware/auth');
const { signup, login, me } = require('../controllers/authController');
const { RATE_LIMITS } = require('../config/constants');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs,
  max: RATE_LIMITS.AUTH.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMIT', message: 'Too many auth requests. Try again later.' }
});

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login',  authLimiter, validate(loginSchema),  login);
router.get('/me', auth(), me);

module.exports = router;
