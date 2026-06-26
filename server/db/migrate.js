/**
 * db/migrate.js
 * Run: node db/migrate.js
 * Reads dbSchema.sql and applies it to the configured database.
 */
const fs   = require('fs');
const path = require('path');
const { pool } = require('./db');
require('dotenv').config();

async function migrate() {
  const schemaPath = path.join(__dirname, '..', 'models', 'dbSchema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('🚀 Running database migration…');
  try {
    await pool.query(sql);
    console.log('✅ Migration complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();