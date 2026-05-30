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

// Inisialisasi tabel sliders otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS sliders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator TEXT NOT NULL DEFAULT 'ADMIN',
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AKTIF',
  image TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Inisialisasi tabel users otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'siswa' CHECK(role IN ('admin', 'siswa', 'tutor')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

export const db = drizzle(sqlite, { schema });
