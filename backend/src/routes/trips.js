const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

const TRIP_SELECT = `
  SELECT t.*, u.name AS driver_name, u.phone AS driver_phone, u.car_model AS driver_car
  FROM trips t JOIN users u ON u.id = t.driver_id
`;

function tripWithDetails(id) {
  const trip = db.prepare(`${TRIP_SELECT} WHERE t.id = ?`).get(id);
  if (!trip) return null;
  const passengers = db.prepare(`
    SELECT b.id AS booking_id, b.status, b.created_at, u.id AS user_id, u.name, u.phone
    FROM bookings b JOIN users u ON u.id = b.passenger_id
    WHERE b.trip_id = ? ORDER BY b.created_at
  `).all(id);
  const confirmed = passengers.filter(p => p.status === 'confirmed').length;
  const comments = db.prepare(`
    SELECT c.id, c.body, c.created_at, u.id AS author_id, u.name AS author_name
    FROM comments c JOIN users u ON u.id = c.author_id
    WHERE c.trip_id = ? ORDER BY c.created_at ASC
  `).all(id);
  return { ...serializeTrip({ ...trip, passengers_confirmed: confirmed }), passengers, comments };
}

function serializeTrip(t) {
  return {
    id: t.id,
    driverId: t.driver_id,
    driverName: t.driver_name,
    driverPhone: t.driver_phone,
    driverCar: t.driver_car,
    fromCity: t.from_city,
    toCity: t.to_city,
    date: t.date,
    time: t.time,
    seats: t.seats,
    notes: t.notes,
    status: t.status,
    seatsLeft: t.seats - t.passengers_confirmed,
  };
}

function listTrips(where, params) {
  const rows = db.prepare(`
    ${TRIP_SELECT}
    LEFT JOIN (SELECT trip_id, COUNT(*) AS n FROM bookings WHERE status = 'confirmed' GROUP BY trip_id) bc
      ON bc.trip_id = t.id
    ${where}
  `).all(...params);
  return rows.map(t => serializeTrip({ ...t, passengers_confirmed: t.n || 0 }));
}

router.get('/trips', (req, res) => {
  const { from, date } = req.query;
  const clauses = ["t.date >= date('now')", "t.status = 'open'"];
  const params = [];
  if (from) { clauses.push('LOWER(t.from_city) LIKE ?'); params.push(`%${String(from).toLowerCase()}%`); }
  if (date) { clauses.push('t.date = ?'); params.push(String(date)); }
  res.json({ trips: listTrips(`WHERE ${clauses.join(' AND ')} ORDER BY t.date, t.time`, params) });
});

router.get('/trips/mine', (req, res) => {
  const driving = listTrips('WHERE t.driver_id = ? ORDER BY t.date DESC, t.time DESC', [req.user.id]);
  const riding = db.prepare(`
    ${TRIP_SELECT}
    JOIN bookings bk ON bk.trip_id = t.id AND bk.passenger_id = ? AND bk.status = 'confirmed'
    LEFT JOIN (SELECT trip_id, COUNT(*) AS n FROM bookings WHERE status = 'confirmed' GROUP BY trip_id) bc
      ON bc.trip_id = t.id
    ORDER BY t.date DESC, t.time DESC
  `).all(req.user.id).map(t => serializeTrip({ ...t, passengers_confirmed: t.n || 0 }));
  res.json({ driving, riding });
});

router.post('/trips', (req, res) => {
  const { fromCity, toCity, date, time, seats, notes } = req.body || {};
  if (!fromCity || !toCity || !date || !time || !seats) {
    return res.status(400).json({ error: 'Départ, arrivée, date, heure et places obligatoires' });
  }
  const seatCount = Number(seats);
  if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 8) {
    return res.status(400).json({ error: 'Places : entre 1 et 8' });
  }
  const info = db.prepare(
    'INSERT INTO trips (driver_id, from_city, to_city, date, time, seats, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, String(fromCity).trim(), String(toCity).trim(), date, time, seatCount, (notes || '').trim());
  res.status(201).json({ trip: tripWithDetails(info.lastInsertRowid) });
});

router.get('/trips/:id', (req, res) => {
  const trip = tripWithDetails(Number(req.params.id));
  if (!trip) return res.status(404).json({ error: 'Trajet introuvable' });
  res.json({ trip });
});

router.patch('/trips/:id', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(Number(req.params.id));
  if (!trip) return res.status(404).json({ error: 'Trajet introuvable' });
  if (trip.driver_id !== req.user.id) return res.status(403).json({ error: 'Seul le conducteur peut modifier ce trajet' });
  const { fromCity, toCity, date, time, seats, notes, status } = req.body || {};
  db.prepare(`UPDATE trips SET from_city = ?, to_city = ?, date = ?, time = ?, seats = ?, notes = ?, status = ? WHERE id = ?`)
    .run(fromCity ?? trip.from_city, toCity ?? trip.to_city, date ?? trip.date, time ?? trip.time,
      seats ?? trip.seats, notes ?? trip.notes, status ?? trip.status, trip.id);
  res.json({ trip: tripWithDetails(trip.id) });
});

router.delete('/trips/:id', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(Number(req.params.id));
  if (!trip) return res.status(404).json({ error: 'Trajet introuvable' });
  if (trip.driver_id !== req.user.id) return res.status(403).json({ error: 'Seul le conducteur peut supprimer ce trajet' });
  db.prepare('DELETE FROM comments WHERE trip_id = ?').run(trip.id);
  db.prepare('DELETE FROM bookings WHERE trip_id = ?').run(trip.id);
  db.prepare('DELETE FROM trips WHERE id = ?').run(trip.id);
  res.json({ ok: true });
});

router.post('/trips/:id/bookings', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(Number(req.params.id));
  if (!trip) return res.status(404).json({ error: 'Trajet introuvable' });
  if (trip.driver_id === req.user.id) return res.status(400).json({ error: 'Tu es le conducteur de ce trajet' });
  if (trip.status !== 'open') return res.status(400).json({ error: 'Ce trajet n\'est plus ouvert' });

  const confirmed = db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE trip_id = ? AND status = 'confirmed'").get(trip.id).n;
  const existing = db.prepare('SELECT * FROM bookings WHERE trip_id = ? AND passenger_id = ?').get(trip.id, req.user.id);
  if (existing && existing.status === 'confirmed') return res.status(409).json({ error: 'Tu as déjà réservé ce trajet' });

  if (confirmed >= trip.seats) return res.status(400).json({ error: 'Plus de place disponible' });

  if (existing) {
    db.prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?").run(existing.id);
  } else {
    db.prepare('INSERT INTO bookings (trip_id, passenger_id) VALUES (?, ?)').run(trip.id, req.user.id);
  }
  res.status(201).json({ trip: tripWithDetails(trip.id) });
});

router.delete('/bookings/:bookingId', (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(Number(req.params.bookingId));
  if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(booking.trip_id);
  const isPassenger = booking.passenger_id === req.user.id;
  const isDriver = trip && trip.driver_id === req.user.id;
  if (!isPassenger && !isDriver) return res.status(403).json({ error: 'Action non autorisée' });
  db.prepare("DELETE FROM bookings WHERE id = ?").run(booking.id);
  res.json({ trip: tripWithDetails(trip.id) });
});

router.post('/trips/:id/comments', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(Number(req.params.id));
  if (!trip) return res.status(404).json({ error: 'Trajet introuvable' });
  const { body } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Message vide' });
  db.prepare('INSERT INTO comments (trip_id, author_id, body) VALUES (?, ?, ?)')
    .run(trip.id, req.user.id, String(body).trim());
  res.status(201).json({ trip: tripWithDetails(trip.id) });
});

module.exports = router;
