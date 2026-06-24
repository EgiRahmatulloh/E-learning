CREATE TABLE `achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text DEFAULT '' NOT NULL,
	`tahun` text DEFAULT '' NOT NULL,
	`tingkat` text DEFAULT '' NOT NULL,
	`penyelenggara` text DEFAULT '' NOT NULL,
	`peserta` text DEFAULT '' NOT NULL,
	`keterangan` text DEFAULT '' NOT NULL,
	`foto` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `agendas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text DEFAULT '' NOT NULL,
	`pelaksanaan` text DEFAULT '' NOT NULL,
	`waktu` text DEFAULT '' NOT NULL,
	`peserta` text DEFAULT '' NOT NULL,
	`lokasi` text DEFAULT '' NOT NULL,
	`penyelenggara` text DEFAULT '' NOT NULL,
	`penanggungjawab` text DEFAULT '' NOT NULL,
	`keterangan` text DEFAULT '' NOT NULL,
	`foto` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `alumni` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text DEFAULT '' NOT NULL,
	`nik` text DEFAULT '' NOT NULL,
	`program` text DEFAULT '' NOT NULL,
	`tahun_lulus` text DEFAULT '' NOT NULL,
	`nisn` text DEFAULT '' NOT NULL,
	`nis` text DEFAULT '' NOT NULL,
	`tempat_tgl_lahir` text DEFAULT '' NOT NULL,
	`no_hp` text DEFAULT '' NOT NULL,
	`nama_ayah` text DEFAULT '' NOT NULL,
	`nama_ibu` text DEFAULT '' NOT NULL,
	`jenis_kelamin` text DEFAULT '' NOT NULL,
	`agama` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`alamat` text DEFAULT '' NOT NULL,
	`cerita` text DEFAULT '' NOT NULL,
	`foto` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creator` text DEFAULT 'ADMIN' NOT NULL,
	`text` text NOT NULL,
	`date` text NOT NULL,
	`status` text DEFAULT 'AKTIF' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `downloads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama_file` text DEFAULT '' NOT NULL,
	`kategori` text DEFAULT '' NOT NULL,
	`file_url` text DEFAULT '' NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'PUBLISH' NOT NULL,
	`tanggal_upload` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `education_programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`program` text DEFAULT '' NOT NULL,
	`penjab` text DEFAULT '' NOT NULL,
	`keterangan` text DEFAULT '' NOT NULL,
	`foto` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `elearning_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`due_date` text,
	`file_url` text DEFAULT '' NOT NULL,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `elearning_attendances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`attended_at` text,
	`created_at` text,
	FOREIGN KEY (`session_id`) REFERENCES `elearning_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `elearning_course_students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`created_at` text,
	FOREIGN KEY (`course_id`) REFERENCES `elearning_courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `elearning_course_tutors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_id` integer NOT NULL,
	`tutor_id` integer NOT NULL,
	`created_at` text,
	FOREIGN KEY (`course_id`) REFERENCES `elearning_courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `elearning_courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama_mapel` text DEFAULT '' NOT NULL,
	`program` text DEFAULT '' NOT NULL,
	`kelas` text DEFAULT '' NOT NULL,
	`deskripsi` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `elearning_discussions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`question` text DEFAULT '' NOT NULL,
	`creator_id` integer NOT NULL,
	`creator_role` text DEFAULT 'tutor' NOT NULL,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `elearning_evaluation_responses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`evaluation_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`course_id` integer NOT NULL,
	`score` integer NOT NULL,
	`created_at` text,
	FOREIGN KEY (`evaluation_id`) REFERENCES `elearning_evaluations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `elearning_courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `elearning_evaluations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`question` text DEFAULT '' NOT NULL,
	`scale_max` integer DEFAULT 5 NOT NULL,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `elearning_forum_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`course_id` integer NOT NULL,
	`author_id` integer NOT NULL,
	`author_role` text NOT NULL,
	`content` text NOT NULL,
	`parent_id` integer,
	`created_at` text,
	FOREIGN KEY (`session_id`) REFERENCES `elearning_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `elearning_courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `elearning_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`user_id` integer,
	`user_role` text,
	`details` text DEFAULT '' NOT NULL,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `elearning_materials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`type` text DEFAULT 'PPT' NOT NULL,
	`file_url` text DEFAULT '' NOT NULL,
	`created_at` text,
	FOREIGN KEY (`session_id`) REFERENCES `elearning_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `elearning_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_id` integer NOT NULL,
	`session_number` integer NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`start_date` text,
	`end_date` text,
	`is_evaluation` integer DEFAULT false NOT NULL,
	`is_open` integer DEFAULT true NOT NULL,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`course_id`) REFERENCES `elearning_courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `elearning_setups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kelas` text NOT NULL,
	`mapel` text NOT NULL,
	`tutor_id` integer NOT NULL,
	`skk` integer DEFAULT 1 NOT NULL,
	`jumlah_sesi` integer DEFAULT 8 NOT NULL,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `elearning_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assignment_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`file_url` text,
	`submitted_at` text,
	`grade` integer,
	`feedback` text,
	`graded_by` integer,
	`graded_at` text,
	FOREIGN KEY (`assignment_id`) REFERENCES `elearning_assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `facilities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text DEFAULT '' NOT NULL,
	`keterangan` text DEFAULT '' NOT NULL,
	`foto` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `gallery` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama_file` text DEFAULT '' NOT NULL,
	`kategori` text DEFAULT 'KEGIATAN PEMBELAJARAN' NOT NULL,
	`tanggal_posting` text DEFAULT '' NOT NULL,
	`foto` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'PUBLISH' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `institution_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama_lembaga` text DEFAULT '' NOT NULL,
	`npsn` text DEFAULT '' NOT NULL,
	`nomor_induk_lembaga` text DEFAULT '' NOT NULL,
	`status_akreditasi` text DEFAULT '' NOT NULL,
	`tahun_berdiri` text DEFAULT '' NOT NULL,
	`nomor_telepon` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`alamat_lengkap` text DEFAULT '' NOT NULL,
	`no_izin_pendirian` text DEFAULT '' NOT NULL,
	`izin_yayasan` text DEFAULT '' NOT NULL,
	`izin_operasional` text DEFAULT '' NOT NULL,
	`npwp` text DEFAULT '' NOT NULL,
	`rekening_nomor` text DEFAULT '' NOT NULL,
	`rekening_atas_nama` text DEFAULT '' NOT NULL,
	`rekening_nama_bank` text DEFAULT '' NOT NULL,
	`foto` text DEFAULT '' NOT NULL,
	`gambar` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `managers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text DEFAULT '' NOT NULL,
	`nik` text DEFAULT '' NOT NULL,
	`jabatan` text DEFAULT '' NOT NULL,
	`nuptk` text DEFAULT '' NOT NULL,
	`tempat_tgl_lahir` text DEFAULT '' NOT NULL,
	`jenis_kelamin` text DEFAULT '' NOT NULL,
	`agama` text DEFAULT '' NOT NULL,
	`pendidikan` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`tanggal_mulai_tugas` text DEFAULT '' NOT NULL,
	`nomor_sk_pengangkatan` text DEFAULT '' NOT NULL,
	`lembaga_pengangkat` text DEFAULT '' NOT NULL,
	`nomor_sk_penugasan` text DEFAULT '' NOT NULL,
	`lembaga_penugas` text DEFAULT '' NOT NULL,
	`alamat` text DEFAULT '' NOT NULL,
	`password` text DEFAULT '' NOT NULL,
	`foto` text DEFAULT '' NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`judul` text DEFAULT '' NOT NULL,
	`kategori` text DEFAULT '' NOT NULL,
	`pembuat` text DEFAULT 'ADMIN' NOT NULL,
	`tanggal_posting` text DEFAULT '' NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'PUBLISH' NOT NULL,
	`foto` text DEFAULT '' NOT NULL,
	`konten` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `news_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama_produk` text DEFAULT '' NOT NULL,
	`deskripsi` text DEFAULT '' NOT NULL,
	`no_hp` text DEFAULT '' NOT NULL,
	`penjual` text DEFAULT '' NOT NULL,
	`satuan` text DEFAULT '' NOT NULL,
	`harga` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'AKTIF' NOT NULL,
	`gambar` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `rombel_students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rombel_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`created_at` text,
	FOREIGN KEY (`rombel_id`) REFERENCES `rombels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rombel_students_rombel_id_student_id_unique` ON `rombel_students` (`rombel_id`,`student_id`);--> statement-breakpoint
CREATE TABLE `rombels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text NOT NULL,
	`wali_kelas_id` integer,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `service_points` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text DEFAULT '' NOT NULL,
	`alamat` text DEFAULT '' NOT NULL,
	`penjab` text DEFAULT '' NOT NULL,
	`waktu_pembelajaran` text DEFAULT '' NOT NULL,
	`jumlah_wb` text DEFAULT '' NOT NULL,
	`keterangan` text DEFAULT '' NOT NULL,
	`foto` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `sliders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creator` text DEFAULT 'ADMIN' NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'AKTIF' NOT NULL,
	`image` text NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text DEFAULT '' NOT NULL,
	`nik` text DEFAULT '' NOT NULL,
	`program` text DEFAULT '' NOT NULL,
	`kelas` text DEFAULT '' NOT NULL,
	`nisn` text DEFAULT '' NOT NULL,
	`nis` text DEFAULT '' NOT NULL,
	`tempat_tgl_lahir` text DEFAULT '' NOT NULL,
	`titik_layanan` text DEFAULT '' NOT NULL,
	`jenis_kelamin` text DEFAULT '' NOT NULL,
	`no_hp` text DEFAULT '' NOT NULL,
	`agama` text DEFAULT '' NOT NULL,
	`nama_ayah` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`nama_ibu` text DEFAULT '' NOT NULL,
	`alamat` text DEFAULT '' NOT NULL,
	`password` text DEFAULT '' NOT NULL,
	`foto` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'AKTIF' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `tutors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text DEFAULT '' NOT NULL,
	`tutor_mapel` text DEFAULT '' NOT NULL,
	`program` text DEFAULT '' NOT NULL,
	`nuptk` text DEFAULT '' NOT NULL,
	`tempat_tgl_lahir` text DEFAULT '' NOT NULL,
	`jenis_kelamin` text DEFAULT '' NOT NULL,
	`agama` text DEFAULT '' NOT NULL,
	`pendidikan` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`nik` text DEFAULT '' NOT NULL,
	`alamat` text DEFAULT '' NOT NULL,
	`password` text DEFAULT '' NOT NULL,
	`foto` text DEFAULT '' NOT NULL,
	`tanggal_mulai_tugas` text DEFAULT '' NOT NULL,
	`nomor_sk_pengangkatan` text DEFAULT '' NOT NULL,
	`lembaga_pengangkat` text DEFAULT '' NOT NULL,
	`nomor_sk_penugasan` text DEFAULT '' NOT NULL,
	`lembaga_penugas` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `vision_mission` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`visi` text DEFAULT '' NOT NULL,
	`misi` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text
);
