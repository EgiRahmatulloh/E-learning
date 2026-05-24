import { db } from "./index";
import { users } from "./schema";
import { count } from "drizzle-orm";

export async function seedDatabase() {
  try {
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
