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
