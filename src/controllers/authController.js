const User = require('../models/User');
const { signToken } = require('../services/tokenService');

const sanitizeUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt });

exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: 'DUPLICATE_EMAIL', message: 'Email already registered' });
  }
  const user = await User.create({ name, email, password, role });

  const token = signToken({ id: user._id, role: user.role, email: user.email, name: user.name });
  return res.status(201).json({ token, user: sanitizeUser(user) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });

  const token = signToken({ id: user._id, role: user.role, email: user.email, name: user.name });
  return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

exports.me = async (req, res) => {
  // req.user is set by auth middleware
  return res.json({ user: req.user });
};
