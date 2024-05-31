const { Pool } = require('pg');

// Create a new pool instance with your PostgreSQL connection details
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'openpost',
    password: 'jaden',
    port: 5432, // Default PostgreSQL port
    max: 20
});

// Export the pool instance to use in your application
module.exports = pool;