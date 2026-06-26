/**
 * server/db/db.js
 * Centralized database connection pool using node-postgres.
 */
const { Pool } = require('pg');
require('dotenv').config();

// Configure the connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add these for better production behavior
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log pool errors to prevent unhandled exceptions
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  /**
   * Helper to run queries directly against the pool
   * @param {string} text - The SQL query string
   * @param {Array} params - The values for the placeholders ($1, $2, etc.)
   */
  query: (text, params) => pool.query(text, params),

  /**
   * Helper to get a client from the pool for transactions
   */
  getClient: () => pool.connect(),
};