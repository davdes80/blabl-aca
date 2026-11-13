const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const tripsRoutes = require('./routes/trips');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api', tripsRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API prête sur http://localhost:${PORT}`));
