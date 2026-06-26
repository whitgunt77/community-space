const { validationResult } = require('express-validator');
const db = require('../db/db');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Haversine distance in km (pure SQL is preferred, but used for quick checks) */
const haversine = (lat1, lng1, lat2, lng2) => {
  const R   = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── GET /api/events ────────────────────────────────────────────────────────
const getEvents = async (req, res) => {
  const {
    lat, lng, radius = 25,   // km
    category, from, to,
    limit = 50, offset = 0,
  } = req.query;

  try {
    let queryText;
    let params;

    if (lat && lng) {
      // Proximity search using the SQL function defined in dbSchema.sql
      queryText = `
        SELECT e.*, u.username AS organizer_name,
               COUNT(r.id)::INT AS rsvp_count,
               n.distance_km
        FROM events_near($1::NUMERIC, $2::NUMERIC, $3::NUMERIC) n
        JOIN events e ON e.id = n.id
        JOIN users  u ON u.id = e.organizer_id
        LEFT JOIN rsvps r ON r.event_id = e.id AND r.status = 'going'
        WHERE ($4::TEXT IS NULL OR e.category = $4)
          AND ($5::TIMESTAMPTZ IS NULL OR e.date_time >= $5)
          AND ($6::TIMESTAMPTZ IS NULL OR e.date_time <= $6)
        GROUP BY e.id, u.username, n.distance_km
        ORDER BY n.distance_km ASC, e.date_time ASC
        LIMIT $7 OFFSET $8`;
      params = [lat, lng, radius, category || null, from || null, to || null, limit, offset];
    } else {
      queryText = `
        SELECT e.*, u.username AS organizer_name,
               COUNT(r.id)::INT AS rsvp_count
        FROM events e
        JOIN users u ON u.id = e.organizer_id
        LEFT JOIN rsvps r ON r.event_id = e.id AND r.status = 'going'
        WHERE e.date_time >= NOW()
          AND ($1::TEXT IS NULL OR e.category = $1)
          AND ($2::TIMESTAMPTZ IS NULL OR e.date_time >= $2)
          AND ($3::TIMESTAMPTZ IS NULL OR e.date_time <= $3)
        GROUP BY e.id, u.username
        ORDER BY e.date_time ASC
        LIMIT $4 OFFSET $5`;
      params = [category || null, from || null, to || null, limit, offset];
    }

    const { rows } = await db.query(queryText, params);
    res.json({ events: rows, count: rows.length });
  } catch (err) {
    console.error('getEvents error:', err);
    res.status(500).json({ error: 'Server error fetching events.' });
  }
};

// ─── GET /api/events/:id ────────────────────────────────────────────────────
const getEvent = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT e.*,
              u.username  AS organizer_name,
              u.avatar_url AS organizer_avatar,
              COUNT(r.id)::INT AS rsvp_count
       FROM events e
       JOIN users u ON u.id = e.organizer_id
       LEFT JOIN rsvps r ON r.event_id = e.id AND r.status = 'going'
       WHERE e.id = $1
       GROUP BY e.id, u.username, u.avatar_url`,
      [req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Event not found.' });

    // Fetch attendee list
    const { rows: attendees } = await db.query(
      `SELECT u.id, u.username, u.avatar_url, r.status, r.created_at
       FROM rsvps r JOIN users u ON u.id = r.user_id
       WHERE r.event_id = $1
       ORDER BY r.created_at ASC`,
      [req.params.id]
    );

    res.json({ event: rows[0], attendees });
  } catch (err) {
    console.error('getEvent error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── POST /api/events ───────────────────────────────────────────────────────
const createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { title, description, lat, lng, address, date_time, category, max_attendees, image_url } = req.body;

  try {
    const { rows } = await db.query(
      `INSERT INTO events
         (title, description, lat, lng, address, date_time, category, max_attendees, image_url, organizer_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [title, description, lat, lng, address, date_time, category || 'general', max_attendees || null, image_url || null, req.user.id]
    );

    const event = rows[0];

    // Auto-RSVP the organiser as 'going'
    await db.query(
      `INSERT INTO rsvps (user_id, event_id, status) VALUES ($1,$2,'going')
       ON CONFLICT (user_id, event_id) DO NOTHING`,
      [req.user.id, event.id]
    );

    res.status(201).json({ event });
  } catch (err) {
    console.error('createEvent error:', err);
    res.status(500).json({ error: 'Server error creating event.' });
  }
};

// ─── PUT /api/events/:id ────────────────────────────────────────────────────
const updateEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { id } = req.params;
  const { title, description, lat, lng, address, date_time, category, max_attendees, image_url } = req.body;

  try {
    // Ownership check
    const { rows: existing } = await db.query('SELECT organizer_id FROM events WHERE id=$1', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Event not found.' });
    if (existing[0].organizer_id !== req.user.id) return res.status(403).json({ error: 'Not authorised.' });

    const { rows } = await db.query(
      `UPDATE events SET
         title         = COALESCE($1, title),
         description   = COALESCE($2, description),
         lat           = COALESCE($3, lat),
         lng           = COALESCE($4, lng),
         address       = COALESCE($5, address),
         date_time     = COALESCE($6, date_time),
         category      = COALESCE($7, category),
         max_attendees = COALESCE($8, max_attendees),
         image_url     = COALESCE($9, image_url)
       WHERE id = $10
       RETURNING *`,
      [title, description, lat, lng, address, date_time, category, max_attendees, image_url, id]
    );

    res.json({ event: rows[0] });
  } catch (err) {
    console.error('updateEvent error:', err);
    res.status(500).json({ error: 'Server error updating event.' });
  }
};

// ─── DELETE /api/events/:id ─────────────────────────────────────────────────
const deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query('SELECT organizer_id FROM events WHERE id=$1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Event not found.' });
    if (rows[0].organizer_id !== req.user.id) return res.status(403).json({ error: 'Not authorised.' });

    await db.query('DELETE FROM events WHERE id=$1', [id]);
    res.json({ message: 'Event deleted.' });
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── POST /api/events/:id/rsvp ──────────────────────────────────────────────
const rsvpEvent = async (req, res) => {
  const { id } = req.params;
  const status = req.body.status || 'going';

  const VALID = ['going', 'interested', 'not_going'];
  if (!VALID.includes(status)) return res.status(422).json({ error: `status must be one of: ${VALID.join(', ')}` });

  try {
    // Check event exists
    const { rows: evRows } = await db.query('SELECT id, max_attendees FROM events WHERE id=$1', [id]);
    if (evRows.length === 0) return res.status(404).json({ error: 'Event not found.' });

    const event = evRows[0];

    // Check capacity for 'going' RSVPs
    if (status === 'going' && event.max_attendees) {
      const { rows: countRows } = await db.query(
        `SELECT COUNT(*)::INT AS cnt FROM rsvps WHERE event_id=$1 AND status='going'`,
        [id]
      );
      if (countRows[0].cnt >= event.max_attendees) {
        return res.status(409).json({ error: 'Event is at full capacity.' });
      }
    }

    const { rows } = await db.query(
      `INSERT INTO rsvps (user_id, event_id, status)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, event_id)
       DO UPDATE SET status = EXCLUDED.status
       RETURNING *`,
      [req.user.id, id, status]
    );

    res.json({ rsvp: rows[0] });
  } catch (err) {
    console.error('rsvpEvent error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── DELETE /api/events/:id/rsvp ────────────────────────────────────────────
const cancelRsvp = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM rsvps WHERE user_id=$1 AND event_id=$2', [req.user.id, id]);
    res.json({ message: 'RSVP cancelled.' });
  } catch (err) {
    console.error('cancelRsvp error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── GET /api/events/:id/rsvp (check own RSVP status) ──────────────────────
const getMyRsvp = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM rsvps WHERE user_id=$1 AND event_id=$2',
      [req.user.id, req.params.id]
    );
    res.json({ rsvp: rows[0] || null });
  } catch (err) {
    console.error('getMyRsvp error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { getEvents, getEvent, createEvent, updateEvent, deleteEvent, rsvpEvent, cancelRsvp, getMyRsvp };