// ============================================================
// Database Migration Runner
// ============================================================

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { pool } from './db';

async function migrate() {
  console.log('[Migrate] Starting migrations...');

  // Ensure migrations tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  const migrationsDir = join(__dirname, '../../..', 'database', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied = await pool.query('SELECT name FROM _migrations');
  const appliedNames = new Set(applied.rows.map((r: any) => r.name));

  for (const file of files) {
    if (appliedNames.has(file)) {
      console.log(`[Migrate] ✓ ${file} (already applied)`);
      continue;
    }

    console.log(`[Migrate] Applying ${file}...`);
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`[Migrate] ✓ ${file} applied`);
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error(`[Migrate] ✗ ${file} failed:`, err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log('[Migrate] All migrations complete.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('[Migrate] Fatal:', err);
  process.exit(1);
});
