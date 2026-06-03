import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Definisi tabel Users untuk Autentikasi dan Manajemen Akun
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(), // Menyimpan password hash
  role: text('role', { enum: ['admin', 'siswa', 'tutor'] }).notNull().default('siswa'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

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
  nuptk: text('nuptk').notNull().default(''),
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
  password: text('password').notNull().default(''),
  foto: text('foto').notNull().default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

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

