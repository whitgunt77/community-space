const router = require('express').Router();
const { body } = require('express-validator');
const { protect, optionalAuth } = require('../middleware/auth');

const {
  register, login, getMe, updateMe, getUserEvents,
} = require('../controllers/userController');

const {
  getEvents, getEvent, createEvent, updateEvent,
  deleteEvent, rsvpEvent, cancelRsvp, getMyRsvp,
} = require('../controllers/eventController');

// ─── Validation rule sets ────────────────────────────────────────────────────

const registerRules = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3–50 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const eventRules = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters.'),
  body('lat').isFloat({ min: -90,  max: 90  }).withMessage('lat must be a valid latitude.'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('lng must be a valid longitude.'),
  body('date_time').isISO8601().withMessage('date_time must be a valid ISO 8601 date.'),
  body('category').optional().isIn(['general','sports','music','food','art','tech','outdoors','social']),
  body('max_attendees').optional({ nullable: true }).isInt({ min: 1 }),
];

// ─── User routes ─────────────────────────────────────────────────────────────
router.post('/users/register', registerRules, register);
router.post('/users/login',    loginRules,    login);
router.get ('/users/me',       protect,       getMe);
router.put ('/users/me',       protect,       updateMe);
router.get ('/users/:id/events',              getUserEvents);   // public

// ─── Event routes ─────────────────────────────────────────────────────────────
router.get ('/events',          optionalAuth, getEvents);
router.get ('/events/:id',      optionalAuth, getEvent);
router.post('/events',          protect, eventRules, createEvent);
router.put ('/events/:id',      protect, eventRules, updateEvent);
router.delete('/events/:id',   protect,      deleteEvent);

// ─── RSVP sub-routes ──────────────────────────────────────────────────────────
router.get   ('/events/:id/rsvp', protect, getMyRsvp);
router.post  ('/events/:id/rsvp', protect, rsvpEvent);
router.delete('/events/:id/rsvp', protect, cancelRsvp);

// ─── Health check ─────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

module.exports = router;