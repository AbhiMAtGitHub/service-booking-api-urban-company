const jwt = require('jsonwebtoken');
const { JWT_SECRET, TOKEN_EXPIRY } = require('../config/constants');

const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

module.exports = { signToken, verifyToken };
