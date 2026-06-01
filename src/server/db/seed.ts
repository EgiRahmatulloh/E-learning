import { db } from "./index";
import { users, sliders, announcements, institutionProfile } from "./schema";
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

    // Seed announcements table if empty
    const resultAnnouncements = await db.select({ value: count() }).from(announcements).get();
    const annCount = resultAnnouncements?.value || 0;
    if (annCount === 0) {
      console.log("🌱 Database announcements kosong, seeding default announcements...");
      await db.insert(announcements).values([
        {
          creator: "ADMIN",
          text: "PENILAIAN SUMATIF AKHIR TAHUN AKAN DILAKSANAKAN PADA TANGGAL",
          date: "2026-07-16",
          status: "AKTIF",
        }
      ]);
      console.log("✅ Seeding announcements berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${annCount} announcements, seeding diabaikan.`);
    }

    // Seed institution_profile if empty
    const resultProfile = await db.select({ value: count() }).from(institutionProfile).get();
    const profileCount = resultProfile?.value || 0;
    if (profileCount === 0) {
      console.log("🌱 Database institution_profile kosong, seeding default profile...");
      await db.insert(institutionProfile).values([
        {
          namaLembaga: "PKBM MENUJU MAKMUR",
          npsn: "P9963025",
          nomorIndukLembaga: "12345678",
          statusAkreditasi: "A",
          tahunBerdiri: "2015",
          nomorTelepon: "082128594025",
          email: "admin@pkbmmenujumakmur.sch.id",
          alamatLengkap: "Dusun Pangrumasan Rt. 004 Rw. 001 Desa Cintanagara, Kecamatan Jatinagara Kab. Ciamis Prov. Jawa Barat",
          noIzinPendirian: "421.9/123-Disdik/2015",
          izinYayasan: "AHU-0012345.AH.01.04",
          izinOperasional: "503/456-Operasional/Disdik",
          npwp: "01.234.567.8-429.000",
          rekeningNomor: "1234567890",
          rekeningAtasNama: "PKBM MENUJU MAKMUR",
          rekeningNamaBank: "BANK MANDIRI",
          foto: "/images/2c06b6fab7e6a9490c046e362160f2d0.png",
          gambar: "/images/0e985c33b3e1f88efc234765edf73af2.jpg",
        }
      ]);
      console.log("✅ Seeding institution_profile berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${profileCount} institution_profile, seeding diabaikan.`);
    }
  } catch (error) {
    console.error("❌ Gagal melakukan seeding database:", error);
  }
}

