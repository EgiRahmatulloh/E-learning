import { db } from "./index";
import { users, sliders, announcements, institutionProfile, managers, visionMission, educationPrograms, facilities, achievements, servicePoints } from "./schema";
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

    // Seed vision_mission if empty
    const resultVisionMission = await db.select({ value: count() }).from(visionMission).get();
    const vmCount = resultVisionMission?.value || 0;
    if (vmCount === 0) {
      console.log("🌱 Database vision_mission kosong, seeding default vision & mission...");
      await db.insert(visionMission).values([
        {
          visi: "Menjadi lembaga pendidikan nonformal yang unggul dalam membentuk sumber daya manusia yang mandiri, berkarakter, dan berdaya saing.",
          misi: "1. Menyelenggarakan program pendidikan kesetaraan Paket A, Paket B, dan Paket C yang berkualitas dan inklusif.\n2. Menyelenggarakan pelatihan keterampilan wirausaha dan kecakapan hidup yang relevan dengan kebutuhan pasar.\n3. Meningkatkan profesionalisme dan kompetensi pendidik serta tenaga kependidikan secara berkelanjutan.\n4. Membangun kemitraan yang luas dengan dunia usaha, industri, dan instansi terkait untuk penyaluran lulusan.",
        }
      ]);
      console.log("✅ Seeding vision_mission berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${vmCount} vision_mission, seeding diabaikan.`);
    }

    // Seed education_programs if empty
    const resultPrograms = await db.select({ value: count() }).from(educationPrograms).get();
    const programsCount = resultPrograms?.value || 0;
    if (programsCount === 0) {
      console.log("🌱 Database education_programs kosong, seeding default education programs...");
      await db.insert(educationPrograms).values([
        {
          program: "PAKET C",
          penjab: "H. MAMAN SUPARMAN, S.Pd.",
          keterangan: "Pendidikan kesetaraan Paket C (Setara SMA) untuk membekali warga belajar dengan pengetahuan akademis, keterampilan wirausaha, serta ijazah resmi kelulusan.",
          foto: "/images/8c928d7128a4a86625e224dd9d3fa78b.png",
        },
        {
          program: "PAKET B",
          penjab: "Siti Aminah, S.E.",
          keterangan: "Pendidikan kesetaraan Paket B (Setara SMP) untuk memberikan bekal pengetahuan dasar menengah, keterampilan hidup, dan ijazah kesetaraan.",
          foto: "/images/73129d8e548b4795ba15eaafa5d0e39c.jpg",
        }
      ]);
      console.log("✅ Seeding education_programs berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${programsCount} education_programs, seeding diabaikan.`);
    }

    // Seed facilities if empty
    const resultFacilities = await db.select({ value: count() }).from(facilities).get();
    const facilitiesCount = resultFacilities?.value || 0;
    if (facilitiesCount === 0) {
      console.log("🌱 Database facilities kosong, seeding default facilities...");
      await db.insert(facilities).values([
        {
          nama: "RUANG BELAJAR",
          keterangan: "RUANG BELAJAR DI PKBM MENUJU MAKMUR",
          foto: "/images/0e985c33b3e1f88efc234765edf73af2.jpg",
        },
        {
          nama: "LAB KOMPUTER",
          keterangan: "Laboratorium komputer lengkap dengan akses internet berkecepatan tinggi untuk mendukung pembelajaran digital dan pelaksanaan ANBK.",
          foto: "/images/8c928d7128a4a86625e224dd9d3fa78b.png",
        }
      ]);
      console.log("✅ Seeding facilities berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${facilitiesCount} facilities, seeding diabaikan.`);
    }

    // Seed managers if empty
    const resultManagers = await db.select({ value: count() }).from(managers).get();
    const managerCount = resultManagers?.value || 0;
    if (managerCount === 0) {
      console.log("🌱 Database managers kosong, seeding default managers...");
      
      const hashDefaultManager = await Bun.password.hash("password123");

      await db.insert(managers).values([
        {
          nama: "H. MAMAN SUPARMAN, S.Pd.",
          nik: "3207123456789001",
          jabatan: "Ketua PKBM",
          nuptk: "1234567890123456",
          tempatTglLahir: "Ciamis, 12-05-1970",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          pendidikan: "S1 Pendidikan Kesetaraan",
          email: "mamansuparman@pkbmmakmur.org",
          tanggalMulaiTugas: "2015-06-01",
          nomorSkPengangkatan: "421.9/123-Disdik/2015",
          lembagaPengangkat: "Dinas Pendidikan Kabupaten Ciamis",
          nomorSkPenugasan: "503/456-Operasional/Disdik",
          lembagaPenugas: "PKBM Menuju Makmur",
          alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis",
          password: hashDefaultManager,
          foto: "/images/2c06b6fab7e6a9490c046e362160f2d0.png",
        },
        {
          nama: "Siti Aminah, S.E.",
          nik: "3207123456789002",
          jabatan: "Bendahara",
          nuptk: "9876543210987654",
          tempatTglLahir: "Ciamis, 24-04-1994",
          jenisKelamin: "Perempuan",
          agama: "Islam",
          pendidikan: "S1 Akuntansi",
          email: "sitiaminah@pkbmmakmur.org",
          tanggalMulaiTugas: "2016-08-10",
          nomorSkPengangkatan: "421.9/124-Disdik/2016",
          lembagaPengangkat: "Dinas Pendidikan Kabupaten Ciamis",
          nomorSkPenugasan: "503/457-Operasional/Disdik",
          lembagaPenugas: "PKBM Menuju Makmur",
          alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis",
          password: hashDefaultManager,
          foto: "/images/2c06b6fab7e6a9490c046e362160f2d0.png",
        }
      ]);
      console.log("✅ Seeding managers berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${managerCount} managers, seeding diabaikan.`);
    }

    // Seed achievements if empty
    const resultAchievements = await db.select({ value: count() }).from(achievements).get();
    const achievementsCount = resultAchievements?.value || 0;
    if (achievementsCount === 0) {
      console.log("🌱 Database achievements kosong, seeding default achievements...");
      await db.insert(achievements).values([
        {
          nama: "JUARA 1 LOMBA MEWARNAI",
          tahun: "2026",
          tingkat: "KABUPATEN CIAMIS",
          penyelenggara: "DISDIK KABUPATEN CIAMIS",
          peserta: "WARGA BELAJAR PAKET C",
          keterangan: "ALHAMDULILLAH SISWI BERHASIL",
          foto: "",
        }
      ]);
      console.log("✅ Seeding achievements berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${achievementsCount} achievements, seeding diabaikan.`);
    }

    // Seed servicePoints if empty
    const resultServicePoints = await db.select({ value: count() }).from(servicePoints).get();
    const servicePointsCount = resultServicePoints?.value || 0;
    if (servicePointsCount === 0) {
      console.log("🌱 Database service_points kosong, seeding default service points...");
      await db.insert(servicePoints).values([
        {
          nama: "BALE DESA MULYASARI",
          alamat: "DUSUN SEMBAWA RT. RW DESA",
          penjab: "NASIHIN",
          waktuPembelajaran: "JUM'AT S.D MINGGU PUKUL 14.00 S.D SELESAI",
          jumlahWb: "45 WB",
          keterangan: "ALHAMDULILLAH KAMI TELAH BEKERJASA MA",
          foto: "",
        }
      ]);
      console.log("✅ Seeding service points berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${servicePointsCount} service points, seeding diabaikan.`);
    }
  } catch (error) {
    console.error("❌ Gagal melakukan seeding database:", error);
  }
}


