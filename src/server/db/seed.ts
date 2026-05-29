import { db } from "./index";
import { users } from "./schema";
import { count, sql } from "drizzle-orm";

export async function seedDatabase() {
  try {
    // Otomatis buat tabel users jika belum ada (agar tidak perlu manual drizzle-kit push)
    db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'siswa' CHECK(role IN ('admin', 'siswa', 'tutor')),
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT,
        updated_at TEXT
      )
    `);
    console.log("📦 Tabel users siap.");

    // Periksa jumlah pengguna saat ini
    const result = await db.select({ value: count() }).from(users).get();
    const userCount = result?.value || 0;

    if (userCount === 0) {
      console.log("🌱 Database users kosong, menjalankan database seeding...");

      // Hash password default bawaan Bun (sangat cepat & aman)
      const hashAdmin = await Bun.password.hash("admin123");
      const hashTutor = await Bun.password.hash("tutor123");
      const hashSiswa = await Bun.password.hash("siswa123");

      await db.insert(users).values([
        {
          name: "Administrator PKBM",
          email: "admin@pkbmmakmur.org",
          username: "admin",
          password: hashAdmin,
          role: "admin",
        },
        {
          name: "Aceng LS Suhendi (Tutor)",
          email: "tutor@pkbmmakmur.org",
          username: "tutor",
          password: hashTutor,
          role: "tutor",
        },
        {
          name: "Kaka Al Fatih (Siswa)",
          email: "siswa@pkbmmakmur.org",
          username: "siswa",
          password: hashSiswa,
          role: "siswa",
        }
      ]);

      console.log("✅ Seeding berhasil! 3 akun role telah terbuat.");
    } else {
      console.log(`ℹ️ Database memiliki ${userCount} users, seeding diabaikan.`);
    }
  } catch (error) {
    console.error("❌ Gagal melakukan seeding database:", error);
  }
}
