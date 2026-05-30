import { db } from "./index";
import { users, sliders } from "./schema";
import { count, sql } from "drizzle-orm";

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

    // Seed sliders table if empty

    const resultSliders = await db.select({ value: count() }).from(sliders).get();
    const sliderCount = resultSliders?.value || 0;
    if (sliderCount === 0) {
      console.log("🌱 Database sliders kosong, seeding default sliders...");
      await db.insert(sliders).values([
        {
          creator: "ADMIN",
          title: "COVER",
          status: "AKTIF",
          image: "/images/0e985c33b3e1f88efc234765edf73af2.jpg",
        },
        {
          creator: "ADMIN",
          title: "Ujian Pendidikan Kesetaraan (UPK)",
          status: "AKTIF",
          image: "/images/8c928d7128a4a86625e224dd9d3fa78b.png",
        },
        {
          creator: "ADMIN",
          title: "Kreativitas & Produk Karya Warga Belajar",
          status: "AKTIF",
          image: "/images/73129d8e548b4795ba15eaafa5d0e39c.jpg",
        }
      ]);
      console.log("✅ Seeding sliders berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${sliderCount} sliders, seeding diabaikan.`);
    }
  } catch (error) {
    console.error("❌ Gagal melakukan seeding database:", error);
  }
}
