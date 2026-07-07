import { db } from "./index";
import { sliders, announcements, institutionProfile, managers, visionMission, educationPrograms, facilities, achievements, servicePoints, agendas, newsCategories, news, tutors, students, downloads, products, alumni, gallery } from "./schema";
import { count } from "drizzle-orm";

export async function seedDatabase() {
  try {
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
        },
        {
          nama: "Siti Aminah, S.E.",
          nik: "3207123456789002",
          jabatan: "Bendahara",
          nip: "9876543210987654",
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
          password: await Bun.password.hash("password123"),
          foto: "/images/2c06b6fab7e6a9490c046e362160f2d0.png",
          role: "admin",
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

    // Seed agendas if empty
    const resultAgendas = await db.select({ value: count() }).from(agendas).get();
    const agendasCount = resultAgendas?.value || 0;
    if (agendasCount === 0) {
      console.log("🌱 Database agendas kosong, seeding default agendas...");
      await db.insert(agendas).values([
        {
          nama: "UPK PAKET C",
          pelaksanaan: "JUM'AT, 12 DESEMBER 2025",
          waktu: "07.00 WIB S.D SELESAI",
          peserta: "WB KELAS XII",
          lokasi: "PKBM MENUJU MAKMUR",
          penyelenggara: "PANITIA UPK",
          penanggungjawab: "ACENG G",
          keterangan: "Ujian Pendidikan Kesetaraan tingkat Paket C untuk mengukur pencapaian standar kompetensi lulusan warga belajar.",
          foto: "/images/8c928d7128a4a86625e224dd9d3fa78b.png",
        },
        {
          nama: "WORKSHOP KREATIVITAS MAHASISWA & WARGA BELAJAR",
          pelaksanaan: "SABTU, 20 DESEMBER 2025",
          waktu: "09.00 WIB S.D 15.00 WIB",
          peserta: "SEMUA WARGA BELAJAR",
          lokasi: "AULA SERBAGUNA PKBM",
          penyelenggara: "BIDANG KETERAMPILAN",
          penanggungjawab: "SITI AMINAH, S.E.",
          keterangan: "Pelatihan pembuatan kerajinan tangan dan produk wirausaha mandiri hasil karya kreatif warga belajar.",
          foto: "/images/73129d8e548b4795ba15eaafa5d0e39c.jpg",
        }
      ]);
      console.log("✅ Seeding agendas berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${agendasCount} agendas, seeding diabaikan.`);
    }

    // Seed newsCategories if empty
    const resultCategories = await db.select({ value: count() }).from(newsCategories).get();
    const categoriesCount = resultCategories?.value || 0;
    if (categoriesCount === 0) {
      console.log("🌱 Database newsCategories kosong, seeding default categories...");
      await db.insert(newsCategories).values([
        { nama: "UJIAN PAKET C" },
        { nama: "SEKOLAH" },
        { nama: "AKTIVITAS" },
        { nama: "PRESTASI" }
      ]);
      console.log("✅ Seeding newsCategories berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${categoriesCount} newsCategories, seeding diabaikan.`);
    }

    // Seed news if empty
    const resultNews = await db.select({ value: count() }).from(news).get();
    const newsCount = resultNews?.value || 0;
    if (newsCount === 0) {
      console.log("🌱 Database news kosong, seeding default news...");
      await db.insert(news).values([
        {
          judul: "KEGIATAN UPK PAKET B",
          kategori: "UJIAN PAKET C",
          pembuat: "ADMIN",
          tanggalPosting: "20 JANUARI 2026",
          hits: 189,
          status: "PUBLISH",
          foto: "/images/19b2925ff9dc56c67af6213fc71a0037.jpg",
          konten: "PKBM Menuju Makmur menyelenggarakan Ujian Pendidikan Kesetaraan Paket B yang diikuti oleh seluruh warga belajar tingkat menengah pertama. Kegiatan ini merupakan bagian penting dalam mengukur ketercapaian kompetensi pembelajaran peserta didik."
        },
        {
          judul: "KEGIATAN UPK PAKET B",
          kategori: "SEKOLAH",
          pembuat: "ADMIN",
          tanggalPosting: "22 JANUARI 2026",
          hits: 95,
          status: "PUBLISH",
          foto: "/images/73a999addd2b8ea3aed6da538ea5db3a.jpg",
          konten: "PKBM Menuju Makmur menyelenggarakan Ujian Pendidikan Kesetaraan Paket B untuk menguji kompetensi akademis warga belajar."
        },
        {
          judul: "KEGIATAN UPK PAKET B",
          kategori: "AKTIVITAS",
          pembuat: "ADMIN",
          tanggalPosting: "24 JANUARI 2026",
          hits: 112,
          status: "PUBLISH",
          foto: "/images/0fa045f1f00267c7c35442f158ab8ef8.jpg",
          konten: "PKBM Menuju Makmur menyelenggarakan Ujian Pendidikan Kesetaraan Paket B dengan sukses dan tertib."
        },
        {
          judul: "KEGIATAN UPK PAKET B",
          kategori: "PRESTASI",
          pembuat: "ADMIN",
          tanggalPosting: "26 JANUARI 2026",
          hits: 154,
          status: "PUBLISH",
          foto: "/images/19b2925ff9dc56c67af6213fc71a0037.jpg",
          konten: "PKBM Menuju Makmur menyelenggarakan Ujian Pendidikan Kesetaraan Paket B dengan hasil yang sangat membanggakan."
        },
        {
          judul: "KEGIATAN UPK PAKET B",
          kategori: "SEKOLAH",
          pembuat: "ADMIN",
          tanggalPosting: "28 JANUARI 2026",
          hits: 89,
          status: "PUBLISH",
          foto: "/images/73a999addd2b8ea3aed6da538ea5db3a.jpg",
          konten: "PKBM Menuju Makmur menyelenggarakan Ujian Pendidikan Kesetaraan Paket B untuk menunjang pencapaian standar kurikulum."
        },
        {
          judul: "KEGIATAN UPK PAKET B",
          kategori: "PRESTASI",
          pembuat: "ADMIN",
          tanggalPosting: "30 JANUARI 2026",
          hits: 210,
          status: "PUBLISH",
          foto: "/images/0fa045f1f00267c7c35442f158ab8ef8.jpg",
          konten: "PKBM Menuju Makmur menyelenggarakan Ujian Pendidikan Kesetaraan Paket B dengan antusiasme yang tinggi dari para tutor and peserta."
        }
      ]);
      console.log("✅ Seeding news berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${newsCount} news, seeding diabaikan.`);
    }

    // Seed tutors if empty
    const resultTutors = await db.select({ value: count() }).from(tutors).get();
    const tutorsCount = resultTutors?.value || 0;
    if (tutorsCount === 0) {
      console.log("🌱 Database tutors kosong, seeding default tutors...");

      await db.insert(tutors).values([
        {
          nama: "ACENG LS SUHENDI",
          tutorMapel: "Tutor PJOK",
          program: "PAKET C",
          nip: "1234567890123401",
          tempatTglLahir: "Ciamis, 15-08-1988",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          pendidikan: "S1 Pendidikan Olahraga",
          email: "tutor@pkbmmakmur.org",
          nik: "3207123456789101",
          alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis",
          password: await Bun.password.hash("tutor123"),
          foto: "/images/633df6f47c394ce2b67bd54e4808301b.jpg",
          tanggalMulaiTugas: "2018-07-15",
          nomorSkPengangkatan: "421.9/301-Disdik/2018",
          lembagaPengangkat: "Dinas Pendidikan Kabupaten Ciamis",
          nomorSkPenugasan: "503/601-Operasional/Disdik",
          lembagaPenugas: "PKBM Menuju Makmur"
        },
        {
          nama: "H. MAMAN SUPARMAN, S.Pd.",
          tutorMapel: "Tutor Bahasa Indonesia",
          program: "PAKET B",
          nip: "1234567890123456",
          tempatTglLahir: "Ciamis, 12-05-1970",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          pendidikan: "S1 Pendidikan Bahasa Indonesia",
          email: "mamansuparman@pkbmmakmur.org",
          nik: "3207123456789001",
          alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis",
          password: await Bun.password.hash("password123"),
          foto: "/images/7ccf08e706410fd4d0cde0c04b95b108.png",
          tanggalMulaiTugas: "2015-06-01",
          nomorSkPengangkatan: "421.9/123-Disdik/2015",
          lembagaPengangkat: "Dinas Pendidikan Kabupaten Ciamis",
          nomorSkPenugasan: "503/456-Operasional/Disdik",
          lembagaPenugas: "PKBM Menuju Makmur"
        },
        {
          nama: "DEDEK KURNIAWAN, S.Si.",
          tutorMapel: "Tutor Matematika & IPA",
          program: "PAKET C",
          nip: "1234567890123402",
          tempatTglLahir: "Ciamis, 20-10-1990",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          pendidikan: "S1 Fisika",
          email: "dedekkurniawan@pkbmmakmur.org",
          nik: "3207123456789102",
          alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis",
          password: await Bun.password.hash("password123"),
          foto: "/images/b8600352865365e6216298c1b2bcb4ce.png",
          tanggalMulaiTugas: "2019-01-10",
          nomorSkPengangkatan: "421.9/302-Disdik/2019",
          lembagaPengangkat: "Dinas Pendidikan Kabupaten Ciamis",
          nomorSkPenugasan: "503/602-Operasional/Disdik",
          lembagaPenugas: "PKBM Menuju Makmur"
        }
      ]);
      console.log("✅ Seeding tutors berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${tutorsCount} tutors, seeding diabaikan.`);
    }

    // Seed students if empty
    const resultStudents = await db.select({ value: count() }).from(students).get();
    const studentsCount = resultStudents?.value || 0;
    if (studentsCount === 0) {
      console.log("🌱 Database students kosong, seeding default students...");

      await db.insert(students).values([
        // ── PAKET C: Kelas X ──
        { nama: "ADITYA NUGRAHA", nik: "3207123456789201", program: "PAKET C", kelas: "XA", nisn: "0081234561", nis: "20261001", tempatTglLahir: "Ciamis, 05-02-2008", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Laki-laki", noHp: "081234567891", agama: "Islam", namaAyah: "Suparman", email: "aditya@elearning.org", namaIbu: "Aminah", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("siswa123"), foto: "/images/633df6f47c394ce2b67bd54e4808301b.jpg", status: "AKTIF" },
        { nama: "RINA SARI", nik: "3207123456789210", program: "PAKET C", kelas: "XA", nisn: "0081234570", nis: "20261002", tempatTglLahir: "Ciamis, 14-03-2008", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Perempuan", noHp: "081234567801", agama: "Islam", namaAyah: "Hendra", email: "rina@elearning.org", namaIbu: "Yanti", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        { nama: "FAJAR RAMADHAN", nik: "3207123456789211", program: "PAKET C", kelas: "XA", nisn: "0081234571", nis: "20261003", tempatTglLahir: "Ciamis, 20-06-2008", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Laki-laki", noHp: "081234567802", agama: "Islam", namaAyah: "Rahmat", email: "fajar@elearning.org", namaIbu: "Siti", alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        { nama: "DIAZ PRATAMA", nik: "3207123456789212", program: "PAKET C", kelas: "XA", nisn: "0081234572", nis: "20261004", tempatTglLahir: "Ciamis, 08-11-2008", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Laki-laki", noHp: "081234567803", agama: "Islam", namaAyah: "Agus", email: "diaz@elearning.org", namaIbu: "Rina", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        // ── PAKET C: Kelas X B ──
        { nama: "BUNGA MAESARA", nik: "3207123456789202", program: "PAKET C", kelas: "XB", nisn: "0081234562", nis: "20261010", tempatTglLahir: "Ciamis, 12-09-2008", titikLayanan: "BALE DESA MULYASARI", jenisKelamin: "Perempuan", noHp: "081234567892", agama: "Islam", namaAyah: "Nasihin", email: "bunga@elearning.org", namaIbu: "Siti", alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "/images/7ccf08e706410fd4d0cde0c04b95b108.png", status: "AKTIF" },
        { nama: "YUSUF MAULANA", nik: "3207123456789213", program: "PAKET C", kelas: "XB", nisn: "0081234573", nis: "20261011", tempatTglLahir: "Ciamis, 17-04-2008", titikLayanan: "BALE DESA MULYASARI", jenisKelamin: "Laki-laki", noHp: "081234567804", agama: "Islam", namaAyah: "Dedi", email: "yusuf@elearning.org", namaIbu: "Emi", alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        { nama: "TIARA SYAFITRI", nik: "3207123456789214", program: "PAKET C", kelas: "XB", nisn: "0081234574", nis: "20261012", tempatTglLahir: "Ciamis, 03-08-2008", titikLayanan: "BALE DESA MULYASARI", jenisKelamin: "Perempuan", noHp: "081234567805", agama: "Islam", namaAyah: "Wahyu", email: "tiara@elearning.org", namaIbu: "Neng", alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        { nama: "REZA FAUZI", nik: "3207123456789215", program: "PAKET C", kelas: "XB", nisn: "0081234575", nis: "20261013", tempatTglLahir: "Ciamis, 25-12-2008", titikLayanan: "BALE DESA MULYASARI", jenisKelamin: "Laki-laki", noHp: "081234567806", agama: "Islam", namaAyah: "Odang", email: "reza@elearning.org", namaIbu: "Anih", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        // ── PAKET C: Kelas X C ──
        { nama: "SAFIKA AMALIA", nik: "3207123456789216", program: "PAKET C", kelas: "XC", nisn: "0081234576", nis: "20261020", tempatTglLahir: "Ciamis, 09-05-2008", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Perempuan", noHp: "081234567807", agama: "Islam", namaAyah: "Asep", email: "safika@elearning.org", namaIbu: "Elin", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        { nama: "ALDI SAPUTRA", nik: "3207123456789217", program: "PAKET C", kelas: "XC", nisn: "0081234577", nis: "20261021", tempatTglLahir: "Ciamis, 30-01-2008", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Laki-laki", noHp: "081234567808", agama: "Islam", namaAyah: "Ujang", email: "aldi@elearning.org", namaIbu: "Imas", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        // ── PAKET C: Kelas XI A ──
        { nama: "CITRA AYU", nik: "3207123456789220", program: "PAKET C", kelas: "XIA", nisn: "0081234580", nis: "20261101", tempatTglLahir: "Ciamis, 11-07-2007", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Perempuan", noHp: "081234567810", agama: "Islam", namaAyah: "Ganda", email: "citra@elearning.org", namaIbu: "Tati", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "/images/633df6f47c394ce2b67bd54e4808301b.jpg", status: "AKTIF" },
        { nama: "DIMAS PERMANA", nik: "3207123456789221", program: "PAKET C", kelas: "XIA", nisn: "0081234581", nis: "20261102", tempatTglLahir: "Ciamis, 22-02-2007", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Laki-laki", noHp: "081234567811", agama: "Islam", namaAyah: "Koko", email: "dimas@elearning.org", namaIbu: "Iis", alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        { nama: "NADIA OKTAVIANI", nik: "3207123456789222", program: "PAKET C", kelas: "XIA", nisn: "0081234582", nis: "20261103", tempatTglLahir: "Ciamis, 15-10-2007", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Perempuan", noHp: "081234567812", agama: "Islam", namaAyah: "Usep", email: "nadia@elearning.org", namaIbu: "Nani", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        // ── PAKET C: Kelas XI B ──
        { nama: "EKY KURNIAWAN", nik: "3207123456789223", program: "PAKET C", kelas: "XIB", nisn: "0081234583", nis: "20261110", tempatTglLahir: "Ciamis, 04-06-2007", titikLayanan: "BALE DESA MULYASARI", jenisKelamin: "Laki-laki", noHp: "081234567813", agama: "Islam", namaAyah: "Ayi", email: "eky@elearning.org", namaIbu: "Ai", alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        { nama: "SALSABILA PUTRI", nik: "3207123456789224", program: "PAKET C", kelas: "XIB", nisn: "0081234584", nis: "20261111", tempatTglLahir: "Ciamis, 19-09-2007", titikLayanan: "BALE DESA MULYASARI", jenisKelamin: "Perempuan", noHp: "081234567814", agama: "Islam", namaAyah: "Dede", email: "salsabila@elearning.org", namaIbu: "Imas", alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        // ── PAKET C: Kelas XII A ──
        { nama: "CHANDRA WIJAYA", nik: "3207123456789203", program: "PAKET C", kelas: "XIIA", nisn: "0081234563", nis: "20261201", tempatTglLahir: "Ciamis, 24-04-2006", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Laki-laki", noHp: "081234567893", agama: "Islam", namaAyah: "Kurniawan", email: "chandra@elearning.org", namaIbu: "Dewi", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "/images/b8600352865365e6216298c1b2bcb4ce.png", status: "AKTIF" },
        { nama: "MELATI SARI", nik: "3207123456789225", program: "PAKET C", kelas: "XIIA", nisn: "0081234585", nis: "20261202", tempatTglLahir: "Ciamis, 07-03-2006", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Perempuan", noHp: "081234567815", agama: "Islam", namaAyah: "Sutarman", email: "melati@elearning.org", namaIbu: "Enok", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        { nama: "RIZKY FIRMANSYAH", nik: "3207123456789226", program: "PAKET C", kelas: "XIIA", nisn: "0081234586", nis: "20261203", tempatTglLahir: "Ciamis, 28-08-2006", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Laki-laki", noHp: "081234567816", agama: "Islam", namaAyah: "Atang", email: "rizky@elearning.org", namaIbu: "Cucu", alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        // ── PAKET C: Kelas XII B ──
        { nama: "NISA AULIA", nik: "3207123456789227", program: "PAKET C", kelas: "XIIB", nisn: "0081234587", nis: "20261210", tempatTglLahir: "Ciamis, 16-12-2006", titikLayanan: "BALE DESA MULYASARI", jenisKelamin: "Perempuan", noHp: "081234567817", agama: "Islam", namaAyah: "Saepudin", email: "nisa@elearning.org", namaIbu: "Yayah", alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        { nama: "BIMO ADI", nik: "3207123456789228", program: "PAKET C", kelas: "XIIB", nisn: "0081234588", nis: "20261211", tempatTglLahir: "Ciamis, 02-05-2006", titikLayanan: "BALE DESA MULYASARI", jenisKelamin: "Laki-laki", noHp: "081234567818", agama: "Islam", namaAyah: "Endang", email: "bimo@elearning.org", namaIbu: "Rusmiati", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        // ── PAKET B: Kelas VII A ──
        { nama: "AZKA RAHMA", nik: "3207123456789230", program: "PAKET B", kelas: "VIIA", nisn: "0091234590", nis: "20262701", tempatTglLahir: "Ciamis, 10-01-2011", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Perempuan", noHp: "081234567820", agama: "Islam", namaAyah: "Dedi", email: "azka@elearning.org", namaIbu: "Neng", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        { nama: "GILANG SAPUTRA", nik: "3207123456789231", program: "PAKET B", kelas: "VIIA", nisn: "0091234591", nis: "20262702", tempatTglLahir: "Ciamis, 23-07-2011", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Laki-laki", noHp: "081234567821", agama: "Islam", namaAyah: "Asep", email: "gilang@elearning.org", namaIbu: "Iin", alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        // ── PAKET B: Kelas VII B ──
        { nama: "HANA NURAINI", nik: "3207123456789232", program: "PAKET B", kelas: "VIIB", nisn: "0091234592", nis: "20262710", tempatTglLahir: "Ciamis, 05-11-2011", titikLayanan: "BALE DESA MULYASARI", jenisKelamin: "Perempuan", noHp: "081234567822", agama: "Islam", namaAyah: "Ujang", email: "hana@elearning.org", namaIbu: "Tati", alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        { nama: "IRFAN HIDAYAT", nik: "3207123456789233", program: "PAKET B", kelas: "VIIB", nisn: "0091234593", nis: "20262711", tempatTglLahir: "Ciamis, 18-04-2011", titikLayanan: "BALE DESA MULYASARI", jenisKelamin: "Laki-laki", noHp: "081234567823", agama: "Islam", namaAyah: "Hendi", email: "irfan@elearning.org", namaIbu: "Wati", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        // ── PAKET B: Kelas VIII A ──
        { nama: "JESSICA LIM", nik: "3207123456789234", program: "PAKET B", kelas: "VIIIA", nisn: "0091234594", nis: "20262801", tempatTglLahir: "Ciamis, 09-09-2010", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Perempuan", noHp: "081234567824", agama: "Islam", namaAyah: "Hendra", email: "jessica@elearning.org", namaIbu: "Meli", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        { nama: "KHALIF ALFARIZI", nik: "3207123456789235", program: "PAKET B", kelas: "VIIIA", nisn: "0091234595", nis: "20262802", tempatTglLahir: "Ciamis, 26-06-2010", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Laki-laki", noHp: "081234567825", agama: "Islam", namaAyah: "Rohman", email: "khalif@elearning.org", namaIbu: "Rohmah", alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        // ── PAKET B: Kelas IX A ──
        { nama: "LUNA MAYA", nik: "3207123456789236", program: "PAKET B", kelas: "IXA", nisn: "0091234596", nis: "20262901", tempatTglLahir: "Ciamis, 14-02-2009", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Perempuan", noHp: "081234567826", agama: "Islam", namaAyah: "Ahmad", email: "luna@elearning.org", namaIbu: "Ratna", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        { nama: "MAULANA MALIK", nik: "3207123456789237", program: "PAKET B", kelas: "IXA", nisn: "0091234597", nis: "20262902", tempatTglLahir: "Ciamis, 30-10-2009", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Laki-laki", noHp: "081234567827", agama: "Islam", namaAyah: "Karim", email: "maulana@elearning.org", namaIbu: "Karimah", alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        // ── PAKET A: Kelas III ──
        { nama: "NOVAL ADITYA", nik: "3207123456789240", program: "PAKET A", kelas: "IIIA", nisn: "0101234600", nis: "20263301", tempatTglLahir: "Ciamis, 21-03-2014", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Laki-laki", noHp: "081234567830", agama: "Islam", namaAyah: "Budi", email: "noval@elearning.org", namaIbu: "Sri", alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
        { nama: "OLIVIA PUTRI", nik: "3207123456789241", program: "PAKET A", kelas: "IIIA", nisn: "0101234601", nis: "20263302", tempatTglLahir: "Ciamis, 08-12-2014", titikLayanan: "PKBM MENUJU MAKMUR", jenisKelamin: "Perempuan", noHp: "081234567831", agama: "Islam", namaAyah: "Rudi", email: "olivia@elearning.org", namaIbu: "Sari", alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis", password: await Bun.password.hash("password123"), foto: "", status: "AKTIF" },
      ]);
      console.log("✅ Seeding students berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${studentsCount} students, seeding diabaikan.`);
    }

    // Seed downloads if empty
    const resultDownloads = await db.select({ value: count() }).from(downloads).get();
    const downloadsCount = resultDownloads?.value || 0;
    if (downloadsCount === 0) {
      console.log("🌱 Database downloads kosong, seeding default downloads...");
      await db.insert(downloads).values([
        {
          namaFile: "MODUL MATEMATIKA PAKET C",
          kategori: "MODUL PEMBELAJARAN",
          fileUrl: "/uploads/modul_matematika_paket_c.pdf",
          hits: 189,
          status: "PUBLISH",
          tanggalUpload: "20 Januari 2020",
        },
        {
          namaFile: "ADMINISTRASI KURIKULUM 2013 REVISI",
          kategori: "ADMINISTRASI KURIKULUM",
          fileUrl: "/uploads/kurikulum_2013.pdf",
          hits: 45,
          status: "PUBLISH",
          tanggalUpload: "15 Maret 2021",
        },
        {
          namaFile: "SK PENGANGKATAN TUTOR 2026",
          kategori: "ADMINISTRASI TUTOR",
          fileUrl: "/uploads/sk_tutor_2026.pdf",
          hits: 12,
          status: "PUBLISH",
          tanggalUpload: "02 Januari 2026",
        },
        {
          namaFile: "DATA INDUK WARGA BELAJAR",
          kategori: "ADMINISTRASI WB",
          fileUrl: "/uploads/data_induk_wb.pdf",
          hits: 78,
          status: "PUBLISH",
          tanggalUpload: "10 Februari 2026",
        },
        {
          namaFile: "PROFIL LEMBAGA PKBM 2026",
          kategori: "ADMINISTRASI KELEMBAGAAN",
          fileUrl: "/uploads/profil_lembaga_2026.pdf",
          hits: 105,
          status: "PUBLISH",
          tanggalUpload: "14 Januari 2026",
        }
      ]);
      console.log("✅ Seeding downloads berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${downloadsCount} downloads, seeding diabaikan.`);
    }

    // Seed products if empty
    const resultProducts = await db.select({ value: count() }).from(products).get();
    const productsCount = resultProducts?.value || 0;
    if (productsCount === 0) {
      console.log("🌱 Database products kosong, seeding default products...");
      await db.insert(products).values([
        {
          namaProduk: "Piring Lidi",
          harga: 10000,
          penjual: "Aceng",
          satuan: "Buah",
          status: "AKTIF",
          deskripsi: "Piring cantik dan ramah lingkungan berbahan dasar lidi kelapa pilihan.",
          noHp: "081234567890",
          gambar: "/images/73129d8e548b4795ba15eaafa5d0e39c.jpg", // Menggunakan default image placeholder yang valid
        },
        {
          namaProduk: "Kue Pengantin",
          harga: 250000,
          penjual: "Siti",
          satuan: "Buah",
          status: "AKTIF",
          deskripsi: "Kue pernikahan lezat dengan desain elegan hasil karya warga belajar.",
          noHp: "081234567891",
          gambar: "/images/73129d8e548b4795ba15eaafa5d0e39c.jpg",
        },
        {
          namaProduk: "Keset Rajut",
          harga: 15000,
          penjual: "Dedek",
          satuan: "Buah",
          status: "AKTIF",
          deskripsi: "Keset rajutan tebal, menyerap air dengan sangat baik, awet dan beraneka warna.",
          noHp: "081234567892",
          gambar: "/images/73129d8e548b4795ba15eaafa5d0e39c.jpg",
        }
      ]);
      console.log("✅ Seeding products berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${productsCount} products, seeding diabaikan.`);
    }

    // Seed alumni if empty
    const resultAlumni = await db.select({ value: count() }).from(alumni).get();
    const alumniCount = resultAlumni?.value || 0;
    if (alumniCount === 0) {
      console.log("🌱 Database alumni kosong, seeding default alumni...");
      await db.insert(alumni).values([
        {
          nama: "Aceng LS Suhendi",
          nik: "3207123456789401",
          program: "PAKET C",
          tahunLulus: "2020",
          nisn: "0081234901",
          nis: "20171001",
          tempatTglLahir: "Ciamis, 15-08-2002",
          noHp: "082128594025",
          namaAyah: "Suparman",
          namaIbu: "Aminah",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          email: "aceng.suhendi@gmail.com",
          alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis",
          cerita: "Belajar di PKBM Menuju Makmur memberikan saya fleksibilitas untuk bekerja sambil menempuh pendidikan Paket C resmi. Ijazah ini sangat membantu saya melanjutkan karir.",
          foto: "/images/633df6f47c394ce2b67bd54e4808301b.jpg"
        },
        {
          nama: "Bella Putri",
          nik: "3207123456789402",
          program: "PAKET B",
          tahunLulus: "2022",
          nisn: "0091234902",
          nis: "20192001",
          tempatTglLahir: "Ciamis, 12-09-2007",
          noHp: "081234567891",
          namaAyah: "Nasihin",
          namaIbu: "Siti",
          jenisKelamin: "Perempuan",
          agama: "Islam",
          email: "bella.putri@gmail.com",
          alamat: "Dusun Sembawa, Mulyasari, Jatinagara, Ciamis",
          cerita: "Pengalaman luar biasa di PKBM, para tutor sangat sabar mengajar materi kesetaraan. Sekarang saya bisa melanjutkan sekolah ke jenjang berikutnya dengan percaya diri.",
          foto: "/images/7ccf08e706410fd4d0cde0c04b95b108.png"
        },
        {
          nama: "Chandra Wijaya",
          nik: "3207123456789403",
          program: "PAKET A",
          tahunLulus: "2021",
          nisn: "0101234903",
          nis: "20183001",
          tempatTglLahir: "Ciamis, 24-04-2009",
          noHp: "081234567892",
          namaAyah: "Kurniawan",
          namaIbu: "Dewi",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          email: "chandra.wijaya@gmail.com",
          alamat: "Dusun Pangrumasan, Cintanagara, Jatinagara, Ciamis",
          cerita: "PKBM Menuju Makmur sangat membantu anak-anak putus sekolah seperti saya untuk mendapatkan hak belajar kembali secara layak dan nyaman.",
          foto: "/images/b8600352865365e6216298c1b2bcb4ce.png"
        }
      ]);
      console.log("✅ Seeding alumni berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${alumniCount} alumni, seeding diabaikan.`);
    }

    // Seed gallery table if empty
    const resultGallery = await db.select({ value: count() }).from(gallery).get();
    const galleryCount = resultGallery?.value || 0;
    if (galleryCount === 0) {
      console.log("🌱 Database gallery kosong, seeding default gallery...");
      await db.insert(gallery).values([
        {
          namaFile: "Kegiatan Pembelajaran Kelas Paket C",
          kategori: "KEGIATAN PEMBELAJARAN",
          tanggalPosting: "2026-06-01",
          foto: "/images/8c928d7128a4a86625e224dd9d3fa78b.png",
          status: "PUBLISH",
        },
        {
          namaFile: "Ujian Kesetaraan Paket B",
          kategori: "KEGIATAN UJIAN",
          tanggalPosting: "2026-05-15",
          foto: "/images/73129d8e548b4795ba15eaafa5d0e39c.jpg",
          status: "PUBLISH",
        },
        {
          namaFile: "Pelatihan Keterampilan Komputer Warga Belajar",
          kategori: "KEGIATAN KURSUS DAN PELATIHAN",
          tanggalPosting: "2026-05-20",
          foto: "/images/0e985c33b3e1f88efc234765edf73af2.jpg",
          status: "PUBLISH",
        }
      ]);
      console.log("✅ Seeding gallery berhasil!");
    } else {
      console.log(`ℹ️ Database memiliki ${galleryCount} gallery items, seeding diabaikan.`);
    }

  } catch (error) {
    console.error("❌ Gagal melakukan seeding database:", error);
  }
}


