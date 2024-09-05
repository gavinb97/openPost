require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

// Create a new pool instance with your PostgreSQL connection details
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DBNAME,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432, // Default PostgreSQL port
  max: 20,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;