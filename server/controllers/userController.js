const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../db/db');

/** Sign a JWT for the given user object */
const signToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ─── POST /api/users/register ───────────────────────────────────────────────
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { username, email, password } = req.body;

  try {
    // Check uniqueness
    const exists = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1',
      [email.toLowerCase(), username]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Email or username already in use.' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { rows } = await db.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, avatar_url, bio, created_at`,
      [username, email.toLowerCase(), password_hash]
    );

    const user = rows[0];
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

// ─── POST /api/users/login ──────────────────────────────────────────────────
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const { rows } = await db.query(
      `SELECT id, username, email, password_hash, avatar_url, bio
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    delete user.password_hash;
    res.json({ token: signToken(user), user });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

// ─── GET /api/users/me ──────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, username, email, avatar_url, bio, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── PUT /api/users/me ──────────────────────────────────────────────────────
const updateMe = async (req, res) => {
  const { bio, avatar_url } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE users SET bio = COALESCE($1, bio), avatar_url = COALESCE($2, avatar_url)
       WHERE id = $3
       RETURNING id, username, email, avatar_url, bio, created_at`,
      [bio, avatar_url, req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('updateMe error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── GET /api/users/:id/events ──────────────────────────────────────────────
const getUserEvents = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT e.*, u.username AS organizer_name,
              COUNT(r.id)::INT AS rsvp_count
       FROM events e
       JOIN users u ON u.id = e.organizer_id
       LEFT JOIN rsvps r ON r.event_id = e.id AND r.status = 'going'
       WHERE e.organizer_id = $1
       GROUP BY e.id, u.username
       ORDER BY e.date_time ASC`,
      [req.params.id]
    );
    res.json({ events: rows });
  } catch (err) {
    console.error('getUserEvents error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { register, login, getMe, updateMe, getUserEvents };