import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

// Menggunakan environment variable untuk lokasi database dengan fallback lokal
const dbPath = process.env.DATABASE_URL || 'src/server/sqlite.db';
const sqlite = new Database(dbPath);

// Tambahkan optimasi SQLite untuk performa WAL, sinkronisasi normal, dan foreign keys
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA synchronous = NORMAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite, { schema });
