const db = require('./db');

const GRIST_ENDPOINT = (process.env.GRIST_ENDPOINT || 'https://api.getgrist.com').replace(/\/$/, '');
const GRIST_API_KEY = process.env.GRIST_API_KEY;
const GRIST_DOC_ID = process.env.GRIST_DOC_ID;
const GRIST_TABLE = process.env.GRIST_TABLE || 'Autorisations';

function gristConfigured() {
  return !!(GRIST_API_KEY && GRIST_DOC_ID);
}

async function syncAllowedEmails() {
  if (!gristConfigured()) {
    throw new Error('Grist non configuré (GRIST_API_KEY et GRIST_DOC_ID requis)');
  }
  const url = `${GRIST_ENDPOINT}/api/docs/${GRIST_DOC_ID}/tables/${GRIST_TABLE}/records`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${GRIST_API_KEY}` } });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Grist ${resp.status} : ${text.slice(0, 200)}`);
  }
  const data = await resp.json();
  const emails = [];
  for (const rec of data.records || []) {
    const f = rec.fields || {};
    const email = String(f.Email || f.email || '').trim().toLowerCase();
    if (!email) continue;
    if ('Actif' in f && !f.Actif) continue;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) emails.push(email);
  }

  const insert = db.prepare('INSERT OR IGNORE INTO allowed_emails (email) VALUES (?)');
  const remove = db.prepare('DELETE FROM allowed_emails WHERE email = ?');
  const keep = new Set(emails);
  const current = db.prepare('SELECT email FROM allowed_emails WHERE added_by IS NULL').all();

  const tx = db.transaction(() => {
    for (const email of emails) insert.run(email);
    for (const row of current) if (!keep.has(row.email)) remove.run(row.email);
  });
  tx();

  return { total: keep.size };
}

module.exports = { syncAllowedEmails, gristConfigured };
