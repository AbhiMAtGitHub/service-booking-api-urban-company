module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  TOKEN_EXPIRY: '1d',

  ROLES: {
    CUSTOMER: 'customer',
    PRO: 'pro',
    ADMIN: 'admin',
  },

  RATE_LIMITS: {
    GLOBAL: { windowMs: 15 * 60 * 1000, max: 100 },
    AUTH:   { windowMs: 15 * 60 * 1000, max: 20 }
  }
};
