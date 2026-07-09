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
  nip TEXT NOT NULL DEFAULT '',
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
  rt TEXT NOT NULL DEFAULT '',
  rw TEXT NOT NULL DEFAULT '',
  desa TEXT NOT NULL DEFAULT '',
  kecamatan TEXT NOT NULL DEFAULT '',
  kabupaten TEXT NOT NULL DEFAULT '',
  provinsi TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL DEFAULT '',
  foto TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'admin',
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

// Inisialisasi tabel agendas otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS agendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL DEFAULT '',
  pelaksanaan TEXT NOT NULL DEFAULT '',
  waktu TEXT NOT NULL DEFAULT '',
  peserta TEXT NOT NULL DEFAULT '',
  lokasi TEXT NOT NULL DEFAULT '',
  penyelenggara TEXT NOT NULL DEFAULT '',
  penanggungjawab TEXT NOT NULL DEFAULT '',
  keterangan TEXT NOT NULL DEFAULT '',
  foto TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel news_categories otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS news_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel news otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judul TEXT NOT NULL DEFAULT '',
  kategori TEXT NOT NULL DEFAULT '',
  pembuat TEXT NOT NULL DEFAULT 'ADMIN',
  tanggal_posting TEXT NOT NULL DEFAULT '',
  hits INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PUBLISH',
  foto TEXT NOT NULL DEFAULT '',
  konten TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel tutors otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS tutors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL DEFAULT '',
  tutor_mapel TEXT NOT NULL DEFAULT '',
  program TEXT NOT NULL DEFAULT '',
  nip TEXT NOT NULL DEFAULT '',
  tempat_tgl_lahir TEXT NOT NULL DEFAULT '',
  jenis_kelamin TEXT NOT NULL DEFAULT '',
  agama TEXT NOT NULL DEFAULT '',
  pendidikan TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  nik TEXT NOT NULL DEFAULT '',
  alamat TEXT NOT NULL DEFAULT '',
  rt TEXT NOT NULL DEFAULT '',
  rw TEXT NOT NULL DEFAULT '',
  desa TEXT NOT NULL DEFAULT '',
  kecamatan TEXT NOT NULL DEFAULT '',
  kabupaten TEXT NOT NULL DEFAULT '',
  provinsi TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL DEFAULT '',
  foto TEXT NOT NULL DEFAULT '',
  tanggal_mulai_tugas TEXT NOT NULL DEFAULT '',
  nomor_sk_pengangkatan TEXT NOT NULL DEFAULT '',
  lembaga_pengangkat TEXT NOT NULL DEFAULT '',
  nomor_sk_penugasan TEXT NOT NULL DEFAULT '',
  lembaga_penugas TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel students otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL DEFAULT '',
  nik TEXT NOT NULL DEFAULT '',
  program TEXT NOT NULL DEFAULT '',
  kelas TEXT NOT NULL DEFAULT '',
  nisn TEXT NOT NULL DEFAULT '',
  nis TEXT NOT NULL DEFAULT '',
  tempat_tgl_lahir TEXT NOT NULL DEFAULT '',
  titik_layanan TEXT NOT NULL DEFAULT '',
  jenis_kelamin TEXT NOT NULL DEFAULT '',
  no_hp TEXT NOT NULL DEFAULT '',
  agama TEXT NOT NULL DEFAULT '',
  nama_ayah TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  nama_ibu TEXT NOT NULL DEFAULT '',
  alamat TEXT NOT NULL DEFAULT '',
  rt TEXT NOT NULL DEFAULT '',
  rw TEXT NOT NULL DEFAULT '',
  desa TEXT NOT NULL DEFAULT '',
  kecamatan TEXT NOT NULL DEFAULT '',
  kabupaten TEXT NOT NULL DEFAULT '',
  provinsi TEXT NOT NULL DEFAULT '',
  sekolah_asal TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL DEFAULT '',
  foto TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'AKTIF',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel downloads otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_file TEXT NOT NULL DEFAULT '',
  kategori TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL DEFAULT '',
  hits INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PUBLISH',
  tanggal_upload TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel products otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_produk TEXT NOT NULL DEFAULT '',
  deskripsi TEXT NOT NULL DEFAULT '',
  no_hp TEXT NOT NULL DEFAULT '',
  penjual TEXT NOT NULL DEFAULT '',
  satuan TEXT NOT NULL DEFAULT '',
  harga INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'AKTIF',
  gambar TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Inisialisasi tabel alumni otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS alumni (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL DEFAULT '',
  nik TEXT NOT NULL DEFAULT '',
  program TEXT NOT NULL DEFAULT '',
  tahun_lulus TEXT NOT NULL DEFAULT '',
  nisn TEXT NOT NULL DEFAULT '',
  nis TEXT NOT NULL DEFAULT '',
  tempat_tgl_lahir TEXT NOT NULL DEFAULT '',
  no_hp TEXT NOT NULL DEFAULT '',
  nama_ayah TEXT NOT NULL DEFAULT '',
  nama_ibu TEXT NOT NULL DEFAULT '',
  jenis_kelamin TEXT NOT NULL DEFAULT '',
  agama TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  alamat TEXT NOT NULL DEFAULT '',
  rt TEXT NOT NULL DEFAULT '',
  rw TEXT NOT NULL DEFAULT '',
  desa TEXT NOT NULL DEFAULT '',
  kecamatan TEXT NOT NULL DEFAULT '',
  kabupaten TEXT NOT NULL DEFAULT '',
  provinsi TEXT NOT NULL DEFAULT '',
  melanjutkan_ke TEXT NOT NULL DEFAULT '',
  pekerjaan TEXT NOT NULL DEFAULT '',
  cerita TEXT NOT NULL DEFAULT '',
  foto TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Migration: tambah kolom melanjutkan_ke dan pekerjaan jika belum ada (untuk database existing)
try { sqlite.exec(`ALTER TABLE alumni ADD COLUMN melanjutkan_ke TEXT NOT NULL DEFAULT ''`); } catch {}
try { sqlite.exec(`ALTER TABLE alumni ADD COLUMN pekerjaan TEXT NOT NULL DEFAULT ''`); } catch {}

// Migration: tambah kolom alamat sub-fields untuk semua tabel
const _addrTables = ['managers', 'tutors', 'students', 'alumni'];
const _addrCols = ['rt', 'rw', 'desa', 'kecamatan', 'kabupaten', 'provinsi'];
for (const _t of _addrTables) {
  for (const _c of _addrCols) {
    try { sqlite.exec(`ALTER TABLE ${_t} ADD COLUMN ${_c} TEXT NOT NULL DEFAULT ''`); } catch {}
  }
}

// Migration: tambah kolom sekolah_asal pada students jika belum ada (untuk database existing)
try { sqlite.exec(`ALTER TABLE students ADD COLUMN sekolah_asal TEXT NOT NULL DEFAULT ''`); } catch {}

// Inisialisasi tabel gallery otomatis jika belum ada
sqlite.exec(`
CREATE TABLE IF NOT EXISTS gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_file TEXT NOT NULL DEFAULT '',
  kategori TEXT NOT NULL DEFAULT 'KEGIATAN PEMBELAJARAN',
  tanggal_posting TEXT NOT NULL DEFAULT '',
  foto TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'PUBLISH',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// ==========================================
// E-LEARNING TABLES
// ==========================================

sqlite.exec(`
CREATE TABLE IF NOT EXISTS elearning_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_mapel TEXT NOT NULL DEFAULT '',
  program TEXT NOT NULL DEFAULT '',
  kelas TEXT NOT NULL DEFAULT '',
  deskripsi TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS elearning_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  session_number INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  start_date TEXT,
  end_date TEXT,
  is_evaluation INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (course_id) REFERENCES elearning_courses(id) ON DELETE CASCADE
);
`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS elearning_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'PPT',
  file_url TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (session_id) REFERENCES elearning_sessions(id) ON DELETE CASCADE
);
`);

// ==========================================
// ROMBEL TABLES
// ==========================================

sqlite.exec(`
CREATE TABLE IF NOT EXISTS rombels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  wali_kelas_id INTEGER,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (wali_kelas_id) REFERENCES tutors(id) ON DELETE SET NULL
);
`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS rombel_students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rombel_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(rombel_id, student_id),
  FOREIGN KEY (rombel_id) REFERENCES rombels(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS elearning_setups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kelas TEXT NOT NULL,
  mapel TEXT NOT NULL,
  tutor_id INTEGER NOT NULL,
  skk INTEGER NOT NULL DEFAULT 1,
  jumlah_sesi INTEGER NOT NULL DEFAULT 8,
  semester TEXT NOT NULL DEFAULT 'Ganjil',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

// Alter table untuk menambahkan is_open jika belum ada
try {
  sqlite.exec("ALTER TABLE elearning_sessions ADD COLUMN is_open INTEGER NOT NULL DEFAULT 1;");
} catch (e) {
  // Kolom mungkin sudah ada, abaikan error
}

// Migration: rename nuptk → nip di tabel managers dan tutors
try {
  sqlite.exec("ALTER TABLE managers RENAME COLUMN nuptk TO nip;");
} catch (e) {
  // Kolom mungkin sudah di-rename, abaikan error
}
try {
  sqlite.exec("ALTER TABLE tutors RENAME COLUMN nuptk TO nip;");
} catch (e) {
  // Kolom mungkin sudah di-rename, abaikan error
}

sqlite.exec(`
CREATE TABLE IF NOT EXISTS elearning_forum_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL,
  author_role TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id INTEGER,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (session_id) REFERENCES elearning_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES elearning_courses(id) ON DELETE CASCADE
);
`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS elearning_attendances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  attended_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (session_id) REFERENCES elearning_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS elearning_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  file_url TEXT,
  submitted_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  grade INTEGER,
  feedback TEXT,
  graded_by INTEGER,
  graded_at TEXT,
  FOREIGN KEY (assignment_id) REFERENCES elearning_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS elearning_evaluation_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evaluation_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (evaluation_id) REFERENCES elearning_evaluations(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES elearning_courses(id) ON DELETE CASCADE
);
`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS elearning_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  options TEXT NOT NULL,
  correct_answer INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (session_id) REFERENCES elearning_sessions(id) ON DELETE CASCADE
);
`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS elearning_quiz_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  grade INTEGER NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (session_id) REFERENCES elearning_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS elearning_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  scale_max INTEGER NOT NULL DEFAULT 5,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS elearning_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  due_date TEXT,
  file_url TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS elearning_section_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  setup_id INTEGER NOT NULL,
  section_key TEXT NOT NULL,
  completed_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(student_id, setup_id, section_key),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (setup_id) REFERENCES elearning_setups(id) ON DELETE CASCADE
);
`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS tutor_attendances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tutor_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(tutor_id, date),
  FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON DELETE CASCADE
);
`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS elearning_session_angkets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  evaluation_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(session_id, student_id, evaluation_id),
  FOREIGN KEY (session_id) REFERENCES elearning_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluation_id) REFERENCES elearning_evaluations(id) ON DELETE CASCADE
);
`);

export const db = drizzle(sqlite, { schema });
