const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAuth } = require('../auth');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmailAllowed(email) {
  return !!db.prepare('SELECT 1 FROM allowed_emails WHERE email = ?').get(email.toLowerCase());
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, carModel: u.car_model, isAdmin: !!u.is_admin };
}

router.post('/register', (req, res) => {
  const { name, email, password, phone, carModel } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Nom, email et mot de passe obligatoires' });
  const cleanEmail = String(email).trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) return res.status(400).json({ error: 'Email invalide' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Mot de passe : 6 caractères minimum' });

  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  const isFirstUser = userCount === 0;
  if (!isFirstUser && !isEmailAllowed(cleanEmail)) {
    return res.status(403).json({ error: 'Cet email n\'est pas autorisé. Demande à un admin de l\'ajouter.' });
  }

  const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(cleanEmail);
  if (exists) return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });

  const hash = bcrypt.hashSync(String(password), 10);
  const info = db.prepare(
    'INSERT INTO users (name, email, password_hash, phone, car_model, is_admin) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name.trim(), cleanEmail, hash, (phone || '').trim(), (carModel || '').trim(), isFirstUser ? 1 : 0);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe obligatoires' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.patch('/me', requireAuth, (req, res) => {
  const { name, phone, carModel } = req.body || {};
  db.prepare('UPDATE users SET name = ?, phone = ?, car_model = ? WHERE id = ?')
    .run(name ?? req.user.name, phone ?? req.user.phone, carModel ?? req.user.car_model, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(user) });
});

module.exports = router;
