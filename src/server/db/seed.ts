import { db } from "./index";
import { managers } from "./schema";
import { count } from "drizzle-orm";

export async function seedDatabase() {
  try {
    const resultManagers = await db.select({ value: count() }).from(managers).get();
    const managerCount = resultManagers?.value || 0;
    if (managerCount === 0) {
      console.log("🌱 Database managers kosong, seeding super admin...");

      await db.insert(managers).values([
        {
          nama: "H. MAMAN SUPARMAN, S.Pd.",
          nik: "3207123456789001",
          jabatan: "Ketua PKBM",
          nip: "1234567890123456",
          tempatTglLahir: "Ciamis, 12-05-1970",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          pendidikan: "S1 Pendidikan Kesetaraan",
          email: "admin@pkbmmakmur.org",
          tanggalMulaiTugas: "2015-06-01",
          nomorSkPengangkatan: "421.9/123-Disdik/2015",
          lembagaPengangkat: "Dinas Pendidikan Kabupaten Ciamis",
          nomorSkPenugasan: "503/456-Operasional/Disdik",
          lembagaPenugas: "PKBM Menuju Makmur",
          alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis",
          password: await Bun.password.hash("admin123"),
          foto: "/images/2c06b6fab7e6a9490c046e362160f2d0.png",
          role: "super_admin",
        }
      ]);
      console.log("✅ Super admin berhasil ditambahkan!");
    } else {
      console.log(`ℹ️ Database memiliki ${managerCount} managers, seeding diabaikan.`);
    }
  } catch (error) {
    console.error("❌ Gagal melakukan seeding database:", error);
  }
}


