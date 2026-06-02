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
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel announcements otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator TEXT NOT NULL DEFAULT 'ADMIN',
  text TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AKTIF',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
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
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel institution_profile otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS institution_profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_lembaga TEXT NOT NULL DEFAULT '',
  npsn TEXT NOT NULL DEFAULT '',
  nomor_induk_lembaga TEXT NOT NULL DEFAULT '',
  status_akreditasi TEXT NOT NULL DEFAULT '',
  tahun_berdiri TEXT NOT NULL DEFAULT '',
  nomor_telepon TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  alamat_lengkap TEXT NOT NULL DEFAULT '',
  no_izin_pendirian TEXT NOT NULL DEFAULT '',
  izin_yayasan TEXT NOT NULL DEFAULT '',
  izin_operasional TEXT NOT NULL DEFAULT '',
  npwp TEXT NOT NULL DEFAULT '',
  rekening_nomor TEXT NOT NULL DEFAULT '',
  rekening_atas_nama TEXT NOT NULL DEFAULT '',
  rekening_nama_bank TEXT NOT NULL DEFAULT '',
  foto TEXT NOT NULL DEFAULT '',
  gambar TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel vision_mission otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS vision_mission (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visi TEXT NOT NULL DEFAULT '',
  misi TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel education_programs otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS education_programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program TEXT NOT NULL DEFAULT '',
  penjab TEXT NOT NULL DEFAULT '',
  keterangan TEXT NOT NULL DEFAULT '',
  foto TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel facilities otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS facilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL DEFAULT '',
  keterangan TEXT NOT NULL DEFAULT '',
  foto TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel managers otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS managers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL DEFAULT '',
  nik TEXT NOT NULL DEFAULT '',
  jabatan TEXT NOT NULL DEFAULT '',
  nuptk TEXT NOT NULL DEFAULT '',
  tempat_tgl_lahir TEXT NOT NULL DEFAULT '',
  jenis_kelamin TEXT NOT NULL DEFAULT '',
  agama TEXT NOT NULL DEFAULT '',
  pendidikan TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  tanggal_mulai_tugas TEXT NOT NULL DEFAULT '',
  nomor_sk_pengangkatan TEXT NOT NULL DEFAULT '',
  lembaga_pengangkat TEXT NOT NULL DEFAULT '',
  nomor_sk_penugasan TEXT NOT NULL DEFAULT '',
  lembaga_penugas TEXT NOT NULL DEFAULT '',
  alamat TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL DEFAULT '',
  foto TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel achievements otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL DEFAULT '',
  tahun TEXT NOT NULL DEFAULT '',
  tingkat TEXT NOT NULL DEFAULT '',
  penyelenggara TEXT NOT NULL DEFAULT '',
  peserta TEXT NOT NULL DEFAULT '',
  keterangan TEXT NOT NULL DEFAULT '',
  foto TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel service_points otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS service_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL DEFAULT '',
  alamat TEXT NOT NULL DEFAULT '',
  penjab TEXT NOT NULL DEFAULT '',
  waktu_pembelajaran TEXT NOT NULL DEFAULT '',
  jumlah_wb TEXT NOT NULL DEFAULT '',
  keterangan TEXT NOT NULL DEFAULT '',
  foto TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

export const db = drizzle(sqlite, { schema });
