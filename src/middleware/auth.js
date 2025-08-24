const { verifyToken } = require('../services/tokenService');

module.exports = function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      if (!required) return next();
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing token' });
    }

    try {
      const payload = verifyToken(token);
      req.user = { id: payload.id, role: payload.role, email: payload.email, name: payload.name };
      return next();
    } catch (e) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' });
    }
  };
};
