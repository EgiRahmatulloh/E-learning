import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

export const sliders = sqliteTable('sliders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  creator: text('creator').notNull().default('ADMIN'),
  title: text('title').notNull(),
  status: text('status').notNull().default('AKTIF'), // 'AKTIF' or 'NON AKTIF'
  image: text('image').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type Slider = typeof sliders.$inferSelect;
export type NewSlider = typeof sliders.$inferInsert;

export const announcements = sqliteTable('announcements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  creator: text('creator').notNull().default('ADMIN'),
  text: text('text').notNull(),
  date: text('date').notNull(), // format 'DD-MM-YYYY' or calendar date
  status: text('status').notNull().default('AKTIF'), // 'AKTIF' or 'TIDAK AKTIF'
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

export const institutionProfile = sqliteTable('institution_profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  namaLembaga: text('nama_lembaga').notNull().default(''),
  npsn: text('npsn').notNull().default(''),
  nomorIndukLembaga: text('nomor_induk_lembaga').notNull().default(''),
  statusAkreditasi: text('status_akreditasi').notNull().default(''),
  tahunBerdiri: text('tahun_berdiri').notNull().default(''),
  nomorTelepon: text('nomor_telepon').notNull().default(''),
  email: text('email').notNull().default(''),
  alamatLengkap: text('alamat_lengkap').notNull().default(''),
  noIzinPendirian: text('no_izin_pendirian').notNull().default(''),
  izinYayasan: text('izin_yayasan').notNull().default(''),
  izinOperasional: text('izin_operasional').notNull().default(''),
  npwp: text('npwp').notNull().default(''),
  rekeningNomor: text('rekening_nomor').notNull().default(''),
  rekeningAtasNama: text('rekening_atas_nama').notNull().default(''),
  rekeningNamaBank: text('rekening_nama_bank').notNull().default(''),
  foto: text('foto').notNull().default(''),
  gambar: text('gambar').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type InstitutionProfile = typeof institutionProfile.$inferSelect;
export type NewInstitutionProfile = typeof institutionProfile.$inferInsert;

export const visionMission = sqliteTable('vision_mission', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  visi: text('visi').notNull().default(''),
  misi: text('misi').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type VisionMission = typeof visionMission.$inferSelect;
export type NewVisionMission = typeof visionMission.$inferInsert;

export const educationPrograms = sqliteTable('education_programs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  program: text('program').notNull().default(''),
  penjab: text('penjab').notNull().default(''),
  keterangan: text('keterangan').notNull().default(''),
  foto: text('foto').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type EducationProgram = typeof educationPrograms.$inferSelect;
export type NewEducationProgram = typeof educationPrograms.$inferInsert;

export const facilities = sqliteTable('facilities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull().default(''),
  keterangan: text('keterangan').notNull().default(''),
  foto: text('foto').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type Facility = typeof facilities.$inferSelect;
export type NewFacility = typeof facilities.$inferInsert;

export const managers = sqliteTable('managers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull().default(''),
  nik: text('nik').notNull().default(''),
  jabatan: text('jabatan').notNull().default(''),
  nip: text('nip').notNull().default(''),
  tempatTglLahir: text('tempat_tgl_lahir').notNull().default(''),
  jenisKelamin: text('jenis_kelamin').notNull().default(''),
  agama: text('agama').notNull().default(''),
  pendidikan: text('pendidikan').notNull().default(''),
  email: text('email').notNull().default(''),
  tanggalMulaiTugas: text('tanggal_mulai_tugas').notNull().default(''),
  nomorSkPengangkatan: text('nomor_sk_pengangkatan').notNull().default(''),
  lembagaPengangkat: text('lembaga_pengangkat').notNull().default(''),
  nomorSkPenugasan: text('nomor_sk_penugasan').notNull().default(''),
  lembagaPenugas: text('lembaga_penugas').notNull().default(''),
  alamat: text('alamat').notNull().default(''),
  rt: text('rt').notNull().default(''),
  rw: text('rw').notNull().default(''),
  desa: text('desa').notNull().default(''),
  kecamatan: text('kecamatan').notNull().default(''),
  kabupaten: text('kabupaten').notNull().default(''),
  provinsi: text('provinsi').notNull().default(''),
  password: text('password').notNull().default(''),
  foto: text('foto').notNull().default(''),
  role: text('role').notNull().default('admin'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
}, (t) => ({
  unq: unique().on(t.email),
}));

export type Manager = typeof managers.$inferSelect;
export type NewManager = typeof managers.$inferInsert;

export const achievements = sqliteTable('achievements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull().default(''),
  tahun: text('tahun').notNull().default(''),
  tingkat: text('tingkat').notNull().default(''),
  penyelenggara: text('penyelenggara').notNull().default(''),
  peserta: text('peserta').notNull().default(''),
  keterangan: text('keterangan').notNull().default(''),
  foto: text('foto').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;

export const servicePoints = sqliteTable('service_points', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull().default(''),
  alamat: text('alamat').notNull().default(''),
  penjab: text('penjab').notNull().default(''),
  waktuPembelajaran: text('waktu_pembelajaran').notNull().default(''),
  jumlahWb: text('jumlah_wb').notNull().default(''),
  keterangan: text('keterangan').notNull().default(''),
  foto: text('foto').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type ServicePoint = typeof servicePoints.$inferSelect;
export type NewServicePoint = typeof servicePoints.$inferInsert;

export const agendas = sqliteTable('agendas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull().default(''),
  pelaksanaan: text('pelaksanaan').notNull().default(''),
  waktu: text('waktu').notNull().default(''),
  peserta: text('peserta').notNull().default(''),
  lokasi: text('lokasi').notNull().default(''),
  penyelenggara: text('penyelenggara').notNull().default(''),
  penanggungjawab: text('penanggungjawab').notNull().default(''),
  keterangan: text('keterangan').notNull().default(''),
  foto: text('foto').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type Agenda = typeof agendas.$inferSelect;
export type NewAgenda = typeof agendas.$inferInsert;

export const newsCategories = sqliteTable('news_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type NewsCategory = typeof newsCategories.$inferSelect;
export type NewNewsCategory = typeof newsCategories.$inferInsert;

export const news = sqliteTable('news', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  judul: text('judul').notNull().default(''),
  kategori: text('kategori').notNull().default(''),
  pembuat: text('pembuat').notNull().default('ADMIN'),
  tanggalPosting: text('tanggal_posting').notNull().default(''),
  hits: integer('hits').notNull().default(0),
  status: text('status').notNull().default('PUBLISH'), // 'PUBLISH' or 'DRAFT'
  foto: text('foto').notNull().default(''),
  konten: text('konten').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type News = typeof news.$inferSelect;
export type NewNews = typeof news.$inferInsert;

export const tutors = sqliteTable('tutors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull().default(''),
  tutorMapel: text('tutor_mapel').notNull().default(''),
  program: text('program').notNull().default(''),
  nip: text('nip').notNull().default(''),
  tempatTglLahir: text('tempat_tgl_lahir').notNull().default(''),
  jenisKelamin: text('jenis_kelamin').notNull().default(''),
  agama: text('agama').notNull().default(''),
  pendidikan: text('pendidikan').notNull().default(''),
  email: text('email').notNull().default(''),
  nik: text('nik').notNull().default(''),
  alamat: text('alamat').notNull().default(''),
  rt: text('rt').notNull().default(''),
  rw: text('rw').notNull().default(''),
  desa: text('desa').notNull().default(''),
  kecamatan: text('kecamatan').notNull().default(''),
  kabupaten: text('kabupaten').notNull().default(''),
  provinsi: text('provinsi').notNull().default(''),
  password: text('password').notNull().default(''),
  foto: text('foto').notNull().default(''),
  tanggalMulaiTugas: text('tanggal_mulai_tugas').notNull().default(''),
  nomorSkPengangkatan: text('nomor_sk_pengangkatan').notNull().default(''),
  lembagaPengangkat: text('lembaga_pengangkat').notNull().default(''),
  nomorSkPenugasan: text('nomor_sk_penugasan').notNull().default(''),
  lembagaPenugas: text('lembaga_penugas').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
}, (t) => ({
  unq: unique().on(t.email),
}));

export type TutorType = typeof tutors.$inferSelect;
export type NewTutor = typeof tutors.$inferInsert;

export const students = sqliteTable('students', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull().default(''),
  nik: text('nik').notNull().default(''),
  program: text('program').notNull().default(''),
  kelas: text('kelas').notNull().default(''),
  nisn: text('nisn').notNull().default(''),
  nis: text('nis').notNull().default(''),
  tempatTglLahir: text('tempat_tgl_lahir').notNull().default(''),
  titikLayanan: text('titik_layanan').notNull().default(''),
  jenisKelamin: text('jenis_kelamin').notNull().default(''),
  noHp: text('no_hp').notNull().default(''),
  agama: text('agama').notNull().default(''),
  namaAyah: text('nama_ayah').notNull().default(''),
  email: text('email').notNull().default(''),
  namaIbu: text('nama_ibu').notNull().default(''),
  alamat: text('alamat').notNull().default(''),
  rt: text('rt').notNull().default(''),
  rw: text('rw').notNull().default(''),
  desa: text('desa').notNull().default(''),
  kecamatan: text('kecamatan').notNull().default(''),
  kabupaten: text('kabupaten').notNull().default(''),
  provinsi: text('provinsi').notNull().default(''),
  sekolahAsal: text('sekolah_asal').notNull().default(''),
  password: text('password').notNull().default(''),
  foto: text('foto').notNull().default(''),
  status: text('status').notNull().default('AKTIF'), // 'AKTIF', 'LULUS'
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
}, (t) => ({
  unq: unique().on(t.email),
}));

export type StudentType = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;

export const downloads = sqliteTable('downloads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  namaFile: text('nama_file').notNull().default(''),
  kategori: text('kategori').notNull().default(''),
  fileUrl: text('file_url').notNull().default(''),
  hits: integer('hits').notNull().default(0),
  status: text('status').notNull().default('PUBLISH'), // 'PUBLISH', 'DRAFT'
  tanggalUpload: text('tanggal_upload').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type DownloadType = typeof downloads.$inferSelect;
export type NewDownload = typeof downloads.$inferInsert;

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  namaProduk: text('nama_produk').notNull().default(''),
  deskripsi: text('deskripsi').notNull().default(''),
  noHp: text('no_hp').notNull().default(''),
  penjual: text('penjual').notNull().default(''),
  satuan: text('satuan').notNull().default(''),
  harga: integer('harga').notNull().default(0),
  status: text('status').notNull().default('AKTIF'), // 'AKTIF', 'NON AKTIF'
  gambar: text('gambar').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type ProductType = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export const alumni = sqliteTable('alumni', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull().default(''),
  nik: text('nik').notNull().default(''),
  program: text('program').notNull().default(''),
  tahunLulus: text('tahun_lulus').notNull().default(''),
  nisn: text('nisn').notNull().default(''),
  nis: text('nis').notNull().default(''),
  tempatTglLahir: text('tempat_tgl_lahir').notNull().default(''),
  noHp: text('no_hp').notNull().default(''),
  namaAyah: text('nama_ayah').notNull().default(''),
  namaIbu: text('nama_ibu').notNull().default(''),
  jenisKelamin: text('jenis_kelamin').notNull().default(''),
  agama: text('agama').notNull().default(''),
  email: text('email').notNull().default(''),
  alamat: text('alamat').notNull().default(''),
  rt: text('rt').notNull().default(''),
  rw: text('rw').notNull().default(''),
  desa: text('desa').notNull().default(''),
  kecamatan: text('kecamatan').notNull().default(''),
  kabupaten: text('kabupaten').notNull().default(''),
  provinsi: text('provinsi').notNull().default(''),
  melanjutkanKe: text('melanjutkan_ke').notNull().default(''),
  pekerjaan: text('pekerjaan').notNull().default(''),
  cerita: text('cerita').notNull().default(''),
  foto: text('foto').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type AlumniType = typeof alumni.$inferSelect;
export type NewAlumni = typeof alumni.$inferInsert;

// Tabel Galeri Kegiatan
export const gallery = sqliteTable('gallery', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  namaFile: text('nama_file').notNull().default(''),
  kategori: text('kategori').notNull().default('KEGIATAN PEMBELAJARAN'),
  tanggalPosting: text('tanggal_posting').notNull().default(''),
  foto: text('foto').notNull().default(''),
  status: text('status').notNull().default('PUBLISH'), // 'PUBLISH' or 'DRAFT'
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type GalleryItemType = typeof gallery.$inferSelect;
export type NewGalleryItem = typeof gallery.$inferInsert;

// ==========================================
// E-LEARNING TABLES
// ==========================================

export const elearningCourses = sqliteTable('elearning_courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  namaMapel: text('nama_mapel').notNull().default(''),
  program: text('program').notNull().default(''),
  kelas: text('kelas').notNull().default(''),
  deskripsi: text('deskripsi').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
}, (t) => ({
  unq: unique().on(t.namaMapel, t.program),
}));

export type ElearningCourse = typeof elearningCourses.$inferSelect;
export type NewElearningCourse = typeof elearningCourses.$inferInsert;

export const elearningCourseTutors = sqliteTable('elearning_course_tutors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseId: integer('course_id').notNull().references(() => elearningCourses.id, { onDelete: 'cascade' }),
  tutorId: integer('tutor_id').notNull().references(() => tutors.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const elearningCourseStudents = sqliteTable('elearning_course_students', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseId: integer('course_id').notNull().references(() => elearningCourses.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const elearningSessions = sqliteTable('elearning_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseId: integer('course_id').notNull().references(() => elearningCourses.id, { onDelete: 'cascade' }),
  sessionNumber: integer('session_number').notNull(), // 1 - 8
  title: text('title').notNull().default(''),
  description: text('description').notNull().default(''),
  tujuanPembelajaran: text('tujuan_pembelajaran').notNull().default(''),
  uraianKegiatan: text('uraian_kegiatan').notNull().default(''),
  startDate: text('start_date'),
  endDate: text('end_date'),
  isEvaluation: integer('is_evaluation', { mode: 'boolean' }).notNull().default(false),
  isOpen: integer('is_open', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
}, (t) => ({
  unq: unique().on(t.courseId, t.sessionNumber),
}));

export type ElearningSession = typeof elearningSessions.$inferSelect;
export type NewElearningSession = typeof elearningSessions.$inferInsert;

export const elearningMaterials = sqliteTable('elearning_materials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => elearningSessions.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default(''),
  type: text('type').notNull().default('PPT'), // PPT, Video, PDF
  fileUrl: text('file_url').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const elearningAssignments = sqliteTable('elearning_assignments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => elearningSessions.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default(''),
  description: text('description').notNull().default(''),
  dueDate: text('due_date'),
  fileUrl: text('file_url').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  unq: unique().on(t.sessionId),
}));

export const elearningEvaluations = sqliteTable('elearning_evaluations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull(), // normally session 7
  question: text('question').notNull().default(''),
  scaleMax: integer('scale_max').notNull().default(5),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const elearningQuestions = sqliteTable('elearning_questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => elearningSessions.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  options: text('options').notNull(), // JSON array of 4 options
  correctAnswer: integer('correct_answer').notNull(), // 0, 1, 2, or 3
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const elearningQuizSubmissions = sqliteTable('elearning_quiz_submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => elearningSessions.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  answers: text('answers'), // JSON array of student's answers
  grade: integer('grade').notNull(), // 0 - 100
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  unq: unique().on(t.sessionId, t.studentId),
}));

export const elearningDiscussions = sqliteTable('elearning_discussions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull(),
  question: text('question').notNull().default(''),
  creatorId: integer('creator_id').notNull(),
  creatorRole: text('creator_role').notNull().default('tutor'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const elearningLogs = sqliteTable('elearning_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(), // e.g., 'LOGIN', 'SUBMIT_ASSIGNMENT', 'GRADE_ASSIGNMENT'
  userId: integer('user_id'),
  userRole: text('user_role'),
  details: text('details').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// ==========================================
// ROMBEL (Rombongan Belajar / Kelas)
// ==========================================

export const rombels = sqliteTable('rombels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(), // e.g. "10A", "10B", "11A"
  waliKelasId: integer('wali_kelas_id'), // FK → tutors.id (nullable)
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
}, (t) => ({
  unq: unique().on(t.nama),
}));

export type Rombel = typeof rombels.$inferSelect;
export type NewRombel = typeof rombels.$inferInsert;

export const rombelStudents = sqliteTable('rombel_students', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  rombelId: integer('rombel_id').notNull().references(() => rombels.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  unq: unique().on(t.rombelId, t.studentId),
}));

export type RombelStudent = typeof rombelStudents.$inferSelect;
export type NewRombelStudent = typeof rombelStudents.$inferInsert;

export const elearningSetups = sqliteTable('elearning_setups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kelas: text('kelas').notNull(),
  mapel: text('mapel').notNull(),
  tutorId: integer('tutor_id').notNull().references(() => tutors.id, { onDelete: 'cascade' }),
  skk: integer('skk').notNull().default(1),
  jumlahSesi: integer('jumlah_sesi').notNull().default(8),
  semester: text('semester').notNull().default('Ganjil'), // Ganjil / Genap
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// ==========================================
// NEW TABLES FOR REFACTORING
// ==========================================

export const elearningForumPosts = sqliteTable('elearning_forum_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => elearningSessions.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => elearningCourses.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull(),
  authorRole: text('author_role').notNull(), // 'tutor' | 'siswa'
  content: text('content').notNull(),
  parentId: integer('parent_id').references((): AnySQLiteColumn => elearningForumPosts.id, { onDelete: 'cascade' }), // for replies
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const elearningAttendances = sqliteTable('elearning_attendances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => elearningSessions.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  attendedAt: text('attended_at').$defaultFn(() => new Date().toISOString()),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  unq: unique().on(t.sessionId, t.studentId),
}));

export const elearningSubmissions = sqliteTable('elearning_submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  assignmentId: integer('assignment_id').notNull().references(() => elearningAssignments.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url'),
  submittedAt: text('submitted_at').$defaultFn(() => new Date().toISOString()),
  grade: integer('grade'), // 0 - 100
  feedback: text('feedback'),
  gradedBy: integer('graded_by'),
  gradedAt: text('graded_at'),
}, (t) => ({
  unq: unique().on(t.assignmentId, t.studentId),
}));

export const elearningEvaluationResponses = sqliteTable('elearning_evaluation_responses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  evaluationId: integer('evaluation_id').notNull().references(() => elearningEvaluations.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => elearningCourses.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(), // 1 - 5
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const elearningSectionCompletions = sqliteTable('elearning_section_completions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  setupId: integer('setup_id').notNull().references(() => elearningSetups.id, { onDelete: 'cascade' }),
  sectionKey: text('section_key').notNull(),
  completedAt: text('completed_at').$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  unq: unique().on(t.studentId, t.setupId, t.sectionKey),
}));

export const tutorAttendances = sqliteTable('tutor_attendances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tutorId: integer('tutor_id').notNull().references(() => tutors.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // format: YYYY-MM-DD
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  unq: unique().on(t.tutorId, t.date),
}));

export const elearningSessionAngkets = sqliteTable('elearning_session_angkets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => elearningSessions.id, { onDelete: 'cascade' }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  evaluationId: integer('evaluation_id').notNull().references(() => elearningEvaluations.id),
  score: integer('score').notNull(), // 1-5
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  unq: unique().on(t.sessionId, t.studentId, t.evaluationId),
}));
