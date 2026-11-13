const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');
const { syncAllowedEmails, gristConfigured } = require('../grist');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Réservé aux administrateurs' });
  next();
}

router.use(requireAuth, requireAdmin);

router.get('/allowed-emails', (req, res) => {
  const rows = db.prepare(`
    SELECT a.email, a.added_at, u.name AS added_by_name
    FROM allowed_emails a LEFT JOIN users u ON u.id = a.added_by
    ORDER BY a.added_at DESC
  `).all();
  res.json({ emails: rows });
});

router.post('/allowed-emails', (req, res) => {
  const { email } = req.body || {};
  const clean = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return res.status(400).json({ error: 'Email invalide' });
  try {
    db.prepare('INSERT INTO allowed_emails (email, added_by) VALUES (?, ?)').run(clean, req.user.id);
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'Email déjà autorisé' });
    throw e;
  }
  res.status(201).json({ ok: true });
});

router.delete('/allowed-emails/:email', (req, res) => {
  db.prepare('DELETE FROM allowed_emails WHERE email = ?').run(decodeURIComponent(req.params.email).toLowerCase());
  res.json({ ok: true });
});

router.get('/grist-status', (req, res) => {
  res.json({ configured: gristConfigured() });
});

router.post('/sync-grist', async (req, res) => {
  try {
    const result = await syncAllowedEmails();
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.get('/users', (req, res) => {
  const rows = db.prepare('SELECT id, name, email, phone, car_model, is_admin, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users: rows.map(u => ({ ...u, isAdmin: !!u.is_admin })) });
});

router.delete('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Impossible de supprimer ton propre compte' });
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
