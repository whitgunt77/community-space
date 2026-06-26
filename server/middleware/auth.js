const jwt = require('jsonwebtoken');

/**
 * Protect routes – verifies the Bearer token in the Authorization header.
 * Attaches req.user = { id, username, email } on success.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Access denied – no token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;          // { id, username, email, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired – please log in again.' });
    }
    return res.status(403).json({ error: 'Invalid token.' });
  }
};

/**
 * Optional auth – attaches req.user if a valid token is present,
 * but does NOT block the request if it is missing.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) {
      // silently ignore invalid/expired token in optional mode
    }
  }
  next();
};

module.exports = { protect, optionalAuth };