import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? 'test',
  password: process.env.POSTGRES_PASSWORD ?? 'test',
  database: process.env.POSTGRES_DB ?? 'test',
});

export const db = drizzle(pool, { schema });

// Close database connection
export async function closeDb(): Promise<void> {
  await pool.end();
}

// Create tables (for testing)
export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Drop tables (for testing)
export async function dropTables(): Promise<void> {
  await pool.query('DROP TABLE IF EXISTS posts CASCADE');
  await pool.query('DROP TABLE IF EXISTS users CASCADE');
}
