const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const TOKEN_TTL = '30d';

function signToken(user) {
  return jwt.sign({ sub: user.id, name: user.name }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentification requise' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, phone, car_model, is_admin FROM users WHERE id = ?').get(payload.sub);
    if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expirée, reconnecte-toi' });
  }
}

module.exports = { signToken, requireAuth };
