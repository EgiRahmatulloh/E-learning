import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { staticPlugin } from "@elysia/static";
import { db } from "./server/db";
import { users, sliders, announcements, institutionProfile, managers, visionMission, educationPrograms, facilities, achievements, servicePoints, agendas, newsCategories, news, tutors, students, downloads, products } from "./server/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { seedDatabase } from "./server/db/seed";
import fs from "fs";

// Jalankan Seeding Database otomatis saat startup
await seedDatabase();

// Hash dummy untuk mitigasi timing attack (dibuat saat startup agar valid)
const DUMMY_HASH = await Bun.password.hash("dummy-password-never-matches", { algorithm: "bcrypt" });

const isProd = Bun.env.NODE_ENV === "production";
const html = !isProd ? await import("../index.html") : null;

// Validasi JWT_SECRET yang aman
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && isProd) {
  throw new Error("❌ CRITICAL: JWT_SECRET environment variable is missing in production!");
}
if (!jwtSecret) {
  console.warn("⚠️ Warning: JWT_SECRET is missing. Using insecure fallback secret for development.");
}
const finalJwtSecret = jwtSecret || 'super-secret-dev-key-pkbm-menuju-makmur';

const app = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: finalJwtSecret,
      schema: t.Object({
        id: t.Numeric(),
        username: t.String(),
        role: t.String(),
      }),
    })
  );

// 1. REST API Routes (Selalu di atas)
app.get("/api/hello", () => ({
  message: "Hello from Elysia!",
  status: "Connected",
}));

// Rute Login API
app.post("/api/auth/login", async ({ body, jwt, set }) => {
  const { username, password } = body;
  try {
    // Cari user berdasarkan username atau email
    const user = await db
      .select()
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, username)))
      .get();

    // Mencegah timing attack dengan memverifikasi dummy hash jika user tidak ditemukan
    const hashToVerify = user ? user.password : DUMMY_HASH;
    const isPasswordValid = await Bun.password.verify(password, hashToVerify);

    if (!user || !isPasswordValid) {
      set.status = 401;
      return { message: "Username/Email atau Password salah" };
    }

    // Cek apakah akun aktif
    if (!user.isActive) {
      set.status = 403;
      return { message: "Akun Anda telah dinonaktifkan. Silakan hubungi administrator." };
    }

    // Terbitkan JWT token
    const token = await jwt.sign({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      }
    };
  } catch (e) {
    set.status = 500;
    return { message: "Gagal memproses masuk ke akun" };
  }
}, {
  body: t.Object({
    username: t.String(),
    password: t.String(),
  })
});

// Ambil info profile aktif
app.get("/api/auth/me", async ({ headers, jwt, set }) => {
  const authHeader = headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    set.status = 401;
    return { message: "Akses ditolak, token hilang" };
  }

  const token = authHeader.split(' ')[1];
  const payload = await jwt.verify(token);
  if (!payload) {
    set.status = 401;
    return { message: "Sesi Anda telah kedaluwarsa" };
  }

  const user = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, Number(payload.id)))
    .get();

  if (!user) {
    set.status = 404;
    return { message: "User tidak ditemukan" };
  }

  // Cek apakah akun aktif
  if (!user.isActive) {
    set.status = 403;
    return { message: "Akun Anda telah dinonaktifkan" };
  }

  const { isActive, ...cleanUser } = user;
  return { success: true, user: cleanUser };
});

// Helper untuk validasi Admin secara aman
const verifyAdmin = async (headers: Record<string, string | undefined>, jwt: any, set: any) => {
  const authHeader = headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    set.status = 401;
    return { success: false, message: "Akses ditolak, token hilang" };
  }

  const token = authHeader.split(' ')[1];
  const payload = await jwt.verify(token);
  if (!payload) {
    set.status = 401;
    return { success: false, message: "Sesi Anda telah kedaluwarsa, silakan masuk kembali" };
  }

  if (payload.role !== 'admin') {
    set.status = 403;
    return { success: false, message: "Akses ditolak, hanya admin yang diizinkan" };
  }

  return null; // Valid
};

// --- API SLIDER ROUTES ---
// Ambil semua slider
app.get("/api/sliders", async ({ set }) => {
  try {
    const list = await db.select().from(sliders).all();
    return { success: true, data: list };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data slider" };
  }
});

// Tambah slider baru
app.post("/api/sliders", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const { title, image, status } = body;
  try {
    const inserted = await db.insert(sliders).values({
      title,
      image,
      status: status || "AKTIF",
      creator: "ADMIN",
    }).returning().get();
    
    return { success: true, data: inserted };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menambahkan data slider" };
  }
}, {
  body: t.Object({
    title: t.String(),
    image: t.String(),
    status: t.Optional(t.String()),
  })
});

// Update slider
app.put("/api/sliders/:id", async ({ params, body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  const { title, image, status } = body;
  try {
    const updated = await db.update(sliders)
      .set({
        title,
        image,
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sliders.id, id))
      .returning()
      .get();
      
    if (!updated) {
      set.status = 404;
      return { success: false, message: "Slider tidak ditemukan" };
    }
    
    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui data slider" };
  }
}, {
  body: t.Object({
    title: t.String(),
    image: t.String(),
    status: t.String(),
  })
});

// Hapus slider
app.delete("/api/sliders/:id", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    await db.delete(sliders).where(eq(sliders.id, id)).run();
    return { success: true, message: "Slider berhasil dihapus" };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menghapus slider" };
  }
});

// --- API ANNOUNCEMENT ROUTES ---
// Ambil semua pengumuman
app.get("/api/announcements", async ({ set }) => {
  try {
    const list = await db.select().from(announcements).all();
    return { success: true, data: list };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data pengumuman" };
  }
});

// Tambah pengumuman baru
app.post("/api/announcements", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const { text, date, status } = body;
  try {
    const inserted = await db.insert(announcements).values({
      text,
      date,
      status: status || "AKTIF",
      creator: "ADMIN",
    }).returning().get();
    
    return { success: true, data: inserted };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menambahkan data pengumuman" };
  }
}, {
  body: t.Object({
    text: t.String({ minLength: 1 }),
    date: t.String({ minLength: 10, maxLength: 10 }),
    status: t.Optional(t.Union([t.Literal('AKTIF'), t.Literal('TIDAK AKTIF')])),
  })
});

// Update pengumuman
app.put("/api/announcements/:id", async ({ params, body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  const { text, date, status } = body;
  try {
    const updated = await db.update(announcements)
      .set({
        text,
        date,
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(announcements.id, id))
      .returning()
      .get();
      
    if (!updated) {
      set.status = 404;
      return { success: false, message: "Pengumuman tidak ditemukan" };
    }
    
    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui data pengumuman" };
  }
}, {
  body: t.Object({
    text: t.String({ minLength: 1 }),
    date: t.String({ minLength: 10, maxLength: 10 }),
    status: t.Union([t.Literal('AKTIF'), t.Literal('TIDAK AKTIF')]),
  })
});

// Hapus pengumuman
app.delete("/api/announcements/:id", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    await db.delete(announcements).where(eq(announcements.id, id)).run();
    return { success: true, message: "Pengumuman berhasil dihapus" };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menghapus pengumuman" };
  }
});

// --- API INSTITUTION PROFILE ROUTES ---
// Ambil profil lembaga
app.get("/api/institution-profile", async ({ set }) => {
  try {
    const profile = await db.select().from(institutionProfile).get();
    return { success: true, data: profile || null };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data identitas lembaga" };
  }
});

// Update/Simpan profil lembaga
app.post("/api/institution-profile", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  try {
    // Cari apakah sudah ada profil
    const existing = await db.select().from(institutionProfile).get();
    if (existing) {
      // Update
      const updated = await db.update(institutionProfile)
        .set({
          ...body,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(institutionProfile.id, existing.id))
        .returning()
        .get();
      return { success: true, data: updated };
    } else {
      // Insert
      const inserted = await db.insert(institutionProfile)
        .values(body)
        .returning()
        .get();
      return { success: true, data: inserted };
    }
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menyimpan data identitas lembaga" };
  }
}, {
  body: t.Object({
    namaLembaga: t.String(),
    npsn: t.String(),
    nomorIndukLembaga: t.String(),
    statusAkreditasi: t.String(),
    tahunBerdiri: t.String(),
    nomorTelepon: t.String(),
    email: t.String(),
    alamatLengkap: t.String(),
    noIzinPendirian: t.String(),
    izinYayasan: t.String(),
    izinOperasional: t.String(),
    npwp: t.String(),
    rekeningNomor: t.String(),
    rekeningAtasNama: t.String(),
    rekeningNamaBank: t.String(),
    foto: t.String(),
    gambar: t.String(),
  })
});

// --- API VISION & MISSION ROUTES ---
// Ambil visi misi
app.get("/api/vision-mission", async ({ set }) => {
  try {
    const vm = await db.select().from(visionMission).get();
    return { success: true, data: vm || null };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data visi dan misi" };
  }
});

// Update/Simpan visi misi
app.post("/api/vision-mission", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const { visi, misi } = body;
  try {
    const existing = await db.select().from(visionMission).get();
    if (existing) {
      const updated = await db.update(visionMission)
        .set({
          visi,
          misi,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(visionMission.id, existing.id))
        .returning()
        .get();
      return { success: true, data: updated };
    } else {
      const inserted = await db.insert(visionMission)
        .values({ visi, misi })
        .returning()
        .get();
      return { success: true, data: inserted };
    }
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menyimpan data visi dan misi" };
  }
}, {
  body: t.Object({
    visi: t.String(),
    misi: t.String(),
  })
});

// --- API EDUCATION PROGRAMS ROUTES ---
// Ambil semua program
app.get("/api/education-programs", async ({ set }) => {
  try {
    const list = await db.select().from(educationPrograms).all();
    return { success: true, data: list };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data program pendidikan" };
  }
});

// Tambah program baru
app.post("/api/education-programs", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const { program, penjab, keterangan, foto } = body;
  try {
    const inserted = await db.insert(educationPrograms).values({
      program,
      penjab,
      keterangan,
      foto,
    }).returning().get();
    return { success: true, data: inserted };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menambahkan program pendidikan" };
  }
}, {
  body: t.Object({
    program: t.String({ minLength: 1 }),
    penjab: t.String({ minLength: 1 }),
    keterangan: t.String(),
    foto: t.String(),
  })
});

// Update program
app.put("/api/education-programs/:id", async ({ params, body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  const { program, penjab, keterangan, foto } = body;
  try {
    const updated = await db.update(educationPrograms)
      .set({
        program,
        penjab,
        keterangan,
        foto,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(educationPrograms.id, id))
      .returning()
      .get();
      
    if (!updated) {
      set.status = 404;
      return { success: false, message: "Program pendidikan tidak ditemukan" };
    }
    
    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui program pendidikan" };
  }
}, {
  body: t.Object({
    program: t.String({ minLength: 1 }),
    penjab: t.String({ minLength: 1 }),
    keterangan: t.String(),
    foto: t.String(),
  })
});

// Hapus program
app.delete("/api/education-programs/:id", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    const existing = await db.select().from(educationPrograms).where(eq(educationPrograms.id, id)).get();
    if (!existing) {
      set.status = 404;
      return { success: false, message: "Program pendidikan tidak ditemukan" };
    }
    await db.delete(educationPrograms).where(eq(educationPrograms.id, id)).run();
    return { success: true, message: "Program pendidikan berhasil dihapus" };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menghapus program pendidikan" };
  }
});

// --- API FACILITIES ROUTES ---
// Ambil semua sarana dan fasilitas
app.get("/api/facilities", async ({ set }) => {
  try {
    const list = await db.select().from(facilities).all();
    return { success: true, data: list };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data sarana dan fasilitas" };
  }
});

// Tambah sarana baru
app.post("/api/facilities", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const { nama, keterangan, foto } = body;
  try {
    const inserted = await db.insert(facilities).values({
      nama,
      keterangan,
      foto,
    }).returning().get();
    return { success: true, data: inserted };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menambahkan data sarana dan fasilitas" };
  }
}, {
  body: t.Object({
    nama: t.String({ minLength: 1 }),
    keterangan: t.String(),
    foto: t.String(),
  })
});

// Update sarana
app.put("/api/facilities/:id", async ({ params, body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  const { nama, keterangan, foto } = body;
  try {
    const existing = await db.select().from(facilities).where(eq(facilities.id, id)).get();
    if (!existing) {
      set.status = 404;
      return { success: false, message: "Sarana dan fasilitas tidak ditemukan" };
    }

    const updated = await db.update(facilities)
      .set({
        nama,
        keterangan,
        foto,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(facilities.id, id))
      .returning()
      .get();
    
    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui data sarana dan fasilitas" };
  }
}, {
  body: t.Object({
    nama: t.String({ minLength: 1 }),
    keterangan: t.String(),
    foto: t.String(),
  })
});

// Hapus sarana
app.delete("/api/facilities/:id", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    const existing = await db.select().from(facilities).where(eq(facilities.id, id)).get();
    if (!existing) {
      set.status = 404;
      return { success: false, message: "Sarana dan fasilitas tidak ditemukan" };
    }

    await db.delete(facilities).where(eq(facilities.id, id)).run();
    return { success: true, message: "Sarana dan fasilitas berhasil dihapus" };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menghapus data sarana dan fasilitas" };
  }
});

// Impor sarana secara masal
app.post("/api/facilities/import", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const list = body;
  if (!Array.isArray(list)) {
    set.status = 400;
    return { success: false, message: "Format data tidak valid, harus berupa array" };
  }

  try {
    const validItems = list.filter(item => item && typeof item === 'object' && typeof item.nama === 'string' && item.nama.trim().length > 0);
    if (validItems.length === 0) {
      set.status = 400;
      return { success: false, message: "Tidak ada data valid untuk diimpor" };
    }

    const insertValues = validItems.map(item => ({
      nama: item.nama,
      keterangan: typeof item.keterangan === 'string' ? item.keterangan : '',
      foto: typeof item.foto === 'string' ? item.foto : '',
    }));

    // Chunk inserts to avoid SQLite parameter limits
    const chunkSize = 100;
    await db.transaction(async (tx) => {
      for (let i = 0; i < insertValues.length; i += chunkSize) {
        const chunk = insertValues.slice(i, i + chunkSize);
        await tx.insert(facilities).values(chunk).run();
      }
    });
    return { success: true, message: `Berhasil mengimpor ${insertValues.length} sarana dan fasilitas` };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengimpor data sarana dan fasilitas" };
  }
}, {
  body: t.Array(t.Object({
    nama: t.String({ minLength: 1 }),
    keterangan: t.Optional(t.String()),
    foto: t.Optional(t.String()),
  }))
});

// --- API ACHIEVEMENTS ROUTES ---
// Ambil semua prestasi
app.get("/api/achievements", async ({ set }) => {
  try {
    const list = await db.select().from(achievements).all();
    return { success: true, data: list };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data prestasi" };
  }
});

// Tambah prestasi baru
app.post("/api/achievements", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const { nama, tahun, tingkat, penyelenggara, peserta, keterangan, foto } = body;
  try {
    const inserted = await db.insert(achievements).values({
      nama,
      tahun,
      tingkat,
      penyelenggara,
      peserta,
      keterangan,
      foto,
    }).returning().get();
    return { success: true, data: inserted };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menambahkan data prestasi" };
  }
}, {
  body: t.Object({
    nama: t.String({ minLength: 1 }),
    tahun: t.String({ minLength: 1 }),
    tingkat: t.String({ minLength: 1 }),
    penyelenggara: t.String(),
    peserta: t.String(),
    keterangan: t.String(),
    foto: t.String(),
  })
});

// Update prestasi
app.put("/api/achievements/:id", async ({ params, body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  const { nama, tahun, tingkat, penyelenggara, peserta, keterangan, foto } = body;
  try {
    const existing = await db.select().from(achievements).where(eq(achievements.id, id)).get();
    if (!existing) {
      set.status = 404;
      return { success: false, message: "Data prestasi tidak ditemukan" };
    }

    const updated = await db.update(achievements)
      .set({
        nama,
        tahun,
        tingkat,
        penyelenggara,
        peserta,
        keterangan,
        foto,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(achievements.id, id))
      .returning()
      .get();
    
    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui data prestasi" };
  }
}, {
  body: t.Object({
    nama: t.String({ minLength: 1 }),
    tahun: t.String({ minLength: 1 }),
    tingkat: t.String({ minLength: 1 }),
    penyelenggara: t.String(),
    peserta: t.String(),
    keterangan: t.String(),
    foto: t.String(),
  })
});

// Hapus prestasi
app.delete("/api/achievements/:id", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    const existing = await db.select().from(achievements).where(eq(achievements.id, id)).get();
    if (!existing) {
      set.status = 404;
      return { success: false, message: "Data prestasi tidak ditemukan" };
    }

    await db.delete(achievements).where(eq(achievements.id, id)).run();
    return { success: true, message: "Data prestasi berhasil dihapus" };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menghapus data prestasi" };
  }
});

// Impor prestasi secara masal
app.post("/api/achievements/import", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const list = body;
  if (!Array.isArray(list)) {
    set.status = 400;
    return { success: false, message: "Format data tidak valid, harus berupa array" };
  }

  try {
    const validItems = list.filter(item => 
      item && 
      typeof item === 'object' && 
      typeof item.nama === 'string' && item.nama.trim().length > 0 &&
      typeof item.tahun === 'string' && item.tahun.trim().length > 0 &&
      typeof item.tingkat === 'string' && item.tingkat.trim().length > 0
    );

    if (validItems.length === 0) {
      set.status = 400;
      return { success: false, message: "Tidak ada data valid untuk diimpor" };
    }

    const insertValues = validItems.map(item => ({
      nama: item.nama,
      tahun: item.tahun,
      tingkat: item.tingkat,
      penyelenggara: typeof item.penyelenggara === 'string' ? item.penyelenggara : '',
      peserta: typeof item.peserta === 'string' ? item.peserta : '',
      keterangan: typeof item.keterangan === 'string' ? item.keterangan : '',
      foto: typeof item.foto === 'string' ? item.foto : '',
    }));

    // Chunk inserts to avoid SQLite parameter limits
    const chunkSize = 100;
    await db.transaction(async (tx) => {
      for (let i = 0; i < insertValues.length; i += chunkSize) {
        const chunk = insertValues.slice(i, i + chunkSize);
        await tx.insert(achievements).values(chunk).run();
      }
    });
    return { success: true, message: `Berhasil mengimpor ${insertValues.length} data prestasi` };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengimpor data prestasi" };
  }
}, {
  body: t.Array(t.Object({
    nama: t.String({ minLength: 1 }),
    tahun: t.String({ minLength: 1 }),
    tingkat: t.String({ minLength: 1 }),
    penyelenggara: t.Optional(t.String()),
    peserta: t.Optional(t.String()),
    keterangan: t.Optional(t.String()),
    foto: t.Optional(t.String()),
  }))
});

// --- API SERVICE POINTS ROUTES ---
// Ambil semua titik layanan
app.get("/api/service-points", async ({ set }) => {
  try {
    const list = await db.select().from(servicePoints).all();
    return { success: true, data: list };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data titik layanan" };
  }
});

// Tambah titik layanan baru
app.post("/api/service-points", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const { nama, alamat, penjab, waktuPembelajaran, jumlahWb, keterangan, foto } = body;
  try {
    const inserted = await db.insert(servicePoints).values({
      nama,
      alamat,
      penjab,
      waktuPembelajaran,
      jumlahWb,
      keterangan,
      foto,
    }).returning().get();
    return { success: true, data: inserted };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menambahkan data titik layanan" };
  }
}, {
  body: t.Object({
    nama: t.String({ minLength: 1 }),
    alamat: t.String({ minLength: 1 }),
    penjab: t.String({ minLength: 1 }),
    waktuPembelajaran: t.String(),
    jumlahWb: t.String(),
    keterangan: t.String(),
    foto: t.String(),
  })
});

// Update titik layanan
app.put("/api/service-points/:id", async ({ params, body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  const { nama, alamat, penjab, waktuPembelajaran, jumlahWb, keterangan, foto } = body;
  try {
    const existing = await db.select().from(servicePoints).where(eq(servicePoints.id, id)).get();
    if (!existing) {
      set.status = 404;
      return { success: false, message: "Data titik layanan tidak ditemukan" };
    }

    const updated = await db.update(servicePoints)
      .set({
        nama,
        alamat,
        penjab,
        waktuPembelajaran,
        jumlahWb,
        keterangan,
        foto,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(servicePoints.id, id))
      .returning()
      .get();
    
    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui data titik layanan" };
  }
}, {
  body: t.Object({
    nama: t.String({ minLength: 1 }),
    alamat: t.String({ minLength: 1 }),
    penjab: t.String({ minLength: 1 }),
    waktuPembelajaran: t.String(),
    jumlahWb: t.String(),
    keterangan: t.String(),
    foto: t.String(),
  })
});

// Hapus titik layanan
app.delete("/api/service-points/:id", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    const existing = await db.select().from(servicePoints).where(eq(servicePoints.id, id)).get();
    if (!existing) {
      set.status = 404;
      return { success: false, message: "Data titik layanan tidak ditemukan" };
    }

    await db.delete(servicePoints).where(eq(servicePoints.id, id)).run();
    return { success: true, message: "Data titik layanan berhasil dihapus" };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menghapus data titik layanan" };
  }
});

// Impor titik layanan secara masal
app.post("/api/service-points/import", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const list = body;
  if (!Array.isArray(list)) {
    set.status = 400;
    return { success: false, message: "Format data tidak valid, harus berupa array" };
  }

  try {
    const validItems = list.filter(item => 
      item && 
      typeof item === 'object' && 
      typeof item.nama === 'string' && item.nama.trim().length > 0 &&
      typeof item.alamat === 'string' && item.alamat.trim().length > 0 &&
      typeof item.penjab === 'string' && item.penjab.trim().length > 0
    );

    if (validItems.length === 0) {
      set.status = 400;
      return { success: false, message: "Tidak ada data valid untuk diimpor" };
    }

    const insertValues = validItems.map(item => ({
      nama: item.nama,
      alamat: item.alamat,
      penjab: item.penjab,
      waktuPembelajaran: typeof item.waktuPembelajaran === 'string' ? item.waktuPembelajaran : '',
      jumlahWb: typeof item.jumlahWb === 'string' ? item.jumlahWb : '',
      keterangan: typeof item.keterangan === 'string' ? item.keterangan : '',
      foto: typeof item.foto === 'string' ? item.foto : '',
    }));

    // Chunk inserts to avoid SQLite parameter limits
    const chunkSize = 100;
    await db.transaction(async (tx) => {
      for (let i = 0; i < insertValues.length; i += chunkSize) {
        const chunk = insertValues.slice(i, i + chunkSize);
        await tx.insert(servicePoints).values(chunk).run();
      }
    });
    return { success: true, message: `Berhasil mengimpor ${insertValues.length} data titik layanan` };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengimpor data titik layanan" };
  }
}, {
  body: t.Array(t.Object({
    nama: t.String({ minLength: 1 }),
    alamat: t.String({ minLength: 1 }),
    penjab: t.String({ minLength: 1 }),
    waktuPembelajaran: t.Optional(t.String()),
    jumlahWb: t.Optional(t.String()),
    keterangan: t.Optional(t.String()),
    foto: t.Optional(t.String()),
  }))
});

// --- API AGENDAS ROUTES ---
// Ambil semua agenda
app.get("/api/agendas", async ({ set }) => {
  try {
    const list = await db.select().from(agendas).all();
    return { success: true, data: list };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data agenda" };
  }
});

// Tambah agenda baru
app.post("/api/agendas", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const { nama, pelaksanaan, waktu, peserta, lokasi, penyelenggara, penanggungjawab, keterangan, foto } = body;
  try {
    const inserted = await db.insert(agendas).values({
      nama,
      pelaksanaan,
      waktu,
      peserta: peserta || '',
      lokasi: lokasi || '',
      penyelenggara: penyelenggara || '',
      penanggungjawab: penanggungjawab || '',
      keterangan: keterangan || '',
      foto: foto || '',
    }).returning().get();
    return { success: true, data: inserted };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menambahkan data agenda" };
  }
}, {
  body: t.Object({
    nama: t.String({ minLength: 1 }),
    pelaksanaan: t.String({ minLength: 1 }),
    waktu: t.String({ minLength: 1 }),
    peserta: t.Optional(t.String()),
    lokasi: t.Optional(t.String()),
    penyelenggara: t.Optional(t.String()),
    penanggungjawab: t.Optional(t.String()),
    keterangan: t.Optional(t.String()),
    foto: t.Optional(t.String()),
  })
});

// Update agenda
app.put("/api/agendas/:id", async ({ params, body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  const { nama, pelaksanaan, waktu, peserta, lokasi, penyelenggara, penanggungjawab, keterangan, foto } = body;
  try {
    const existing = await db.select().from(agendas).where(eq(agendas.id, id)).get();
    if (!existing) {
      set.status = 404;
      return { success: false, message: "Data agenda tidak ditemukan" };
    }

    const updated = await db.update(agendas)
      .set({
        nama,
        pelaksanaan,
        waktu,
        peserta: peserta ?? existing.peserta,
        lokasi: lokasi ?? existing.lokasi,
        penyelenggara: penyelenggara ?? existing.penyelenggara,
        penanggungjawab: penanggungjawab ?? existing.penanggungjawab,
        keterangan: keterangan ?? existing.keterangan,
        foto: foto ?? existing.foto,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(agendas.id, id))
      .returning()
      .get();
    
    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui data agenda" };
  }
}, {
  body: t.Object({
    nama: t.String({ minLength: 1 }),
    pelaksanaan: t.String({ minLength: 1 }),
    waktu: t.String({ minLength: 1 }),
    peserta: t.Optional(t.String()),
    lokasi: t.Optional(t.String()),
    penyelenggara: t.Optional(t.String()),
    penanggungjawab: t.Optional(t.String()),
    keterangan: t.Optional(t.String()),
    foto: t.Optional(t.String()),
  })
});

// Hapus agenda
app.delete("/api/agendas/:id", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    const existing = await db.select().from(agendas).where(eq(agendas.id, id)).get();
    if (!existing) {
      set.status = 404;
      return { success: false, message: "Data agenda tidak ditemukan" };
    }

    await db.delete(agendas).where(eq(agendas.id, id)).run();
    return { success: true, message: "Data agenda berhasil dihapus" };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menghapus data agenda" };
  }
});

// Impor agenda secara masal
app.post("/api/agendas/import", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const list = body;
  if (!Array.isArray(list)) {
    set.status = 400;
    return { success: false, message: "Format data tidak valid, harus berupa array" };
  }

  try {
    const validItems = list.filter(item => 
      item && 
      typeof item === 'object' && 
      typeof item.nama === 'string' && item.nama.trim().length > 0 &&
      typeof item.pelaksanaan === 'string' && item.pelaksanaan.trim().length > 0 &&
      typeof item.waktu === 'string' && item.waktu.trim().length > 0
    );

    if (validItems.length === 0) {
      set.status = 400;
      return { success: false, message: "Tidak ada data valid untuk diimpor" };
    }

    const insertValues = validItems.map(item => ({
      nama: item.nama,
      pelaksanaan: item.pelaksanaan,
      waktu: item.waktu,
      peserta: typeof item.peserta === 'string' ? item.peserta : '',
      lokasi: typeof item.lokasi === 'string' ? item.lokasi : '',
      penyelenggara: typeof item.penyelenggara === 'string' ? item.penyelenggara : '',
      penanggungjawab: typeof item.penanggungjawab === 'string' ? item.penanggungjawab : '',
      keterangan: typeof item.keterangan === 'string' ? item.keterangan : '',
      foto: typeof item.foto === 'string' ? item.foto : '',
    }));

    const chunkSize = 100;
    await db.transaction(async (tx) => {
      for (let i = 0; i < insertValues.length; i += chunkSize) {
        const chunk = insertValues.slice(i, i + chunkSize);
        await tx.insert(agendas).values(chunk).run();
      }
    });
    return { success: true, message: `Berhasil mengimpor ${insertValues.length} data agenda` };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengimpor data agenda" };
  }
}, {
  body: t.Array(t.Object({
    nama: t.String({ minLength: 1 }),
    pelaksanaan: t.String({ minLength: 1 }),
    waktu: t.String({ minLength: 1 }),
    peserta: t.Optional(t.String()),
    lokasi: t.Optional(t.String()),
    penyelenggara: t.Optional(t.String()),
    penanggungjawab: t.Optional(t.String()),
    keterangan: t.Optional(t.String()),
    foto: t.Optional(t.String()),
  }))
});

// --- API NEWS CATEGORIES ROUTES ---
// Ambil semua kategori berita
app.get("/api/news-categories", async ({ set }) => {
  try {
    const list = await db.select().from(newsCategories).all();
    return { success: true, data: list };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil kategori berita" };
  }
});

// Tambah kategori berita baru
app.post("/api/news-categories", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const { nama } = body;
  try {
    const inserted = await db.insert(newsCategories).values({ nama }).returning().get();
    return { success: true, data: inserted };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menambahkan kategori berita" };
  }
}, {
  body: t.Object({
    nama: t.String({ minLength: 1 }),
  })
});

// Hapus kategori berita
app.delete("/api/news-categories/:id", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    await db.delete(newsCategories).where(eq(newsCategories.id, id)).run();
    return { success: true, message: "Kategori berita berhasil dihapus" };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menghapus kategori berita" };
  }
});

// --- API NEWS ROUTES ---
// Ambil semua berita
app.get("/api/news", async ({ set }) => {
  try {
    const list = await db.select().from(news).all();
    return { success: true, data: list };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data berita" };
  }
});

// Tambah berita baru
app.post("/api/news", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const { judul, kategori, pembuat, tanggalPosting, status, foto, konten } = body;
  try {
    const inserted = await db.insert(news).values({
      judul,
      kategori,
      pembuat: pembuat || 'ADMIN',
      tanggalPosting,
      hits: 0,
      status: status || 'PUBLISH',
      foto: foto || '',
      konten: konten || '',
    }).returning().get();
    return { success: true, data: inserted };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menambahkan berita" };
  }
}, {
  body: t.Object({
    judul: t.String({ minLength: 1 }),
    kategori: t.String({ minLength: 1 }),
    pembuat: t.Optional(t.String()),
    tanggalPosting: t.String({ minLength: 1 }),
    status: t.Optional(t.String()),
    foto: t.Optional(t.String()),
    konten: t.Optional(t.String()),
  })
});

// Increment hits berita (Public)
app.post("/api/news/:id/hit", async ({ params, set }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    const existing = await db.select().from(news).where(eq(news.id, id)).get();
    if (!existing) {
      set.status = 404;
      return { success: false, message: "Berita tidak ditemukan" };
    }

    const updated = await db.update(news)
      .set({
        hits: (existing.hits || 0) + 1,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(news.id, id))
      .returning()
      .get();
    
    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui hits berita" };
  }
});

// Update berita
app.put("/api/news/:id", async ({ params, body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  const { judul, kategori, pembuat, tanggalPosting, status, foto, konten } = body;
  try {
    const existing = await db.select().from(news).where(eq(news.id, id)).get();
    if (!existing) {
      set.status = 404;
      return { success: false, message: "Berita tidak ditemukan" };
    }

    const updated = await db.update(news)
      .set({
        judul,
        kategori,
        pembuat: pembuat ?? existing.pembuat,
        tanggalPosting,
        status: status ?? existing.status,
        foto: foto ?? existing.foto,
        konten: konten ?? existing.konten,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(news.id, id))
      .returning()
      .get();
    
    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui berita" };
  }
}, {
  body: t.Object({
    judul: t.String({ minLength: 1 }),
    kategori: t.String({ minLength: 1 }),
    pembuat: t.Optional(t.String()),
    tanggalPosting: t.String({ minLength: 1 }),
    status: t.Optional(t.String()),
    foto: t.Optional(t.String()),
    konten: t.Optional(t.String()),
  })
});

// Hapus berita
app.delete("/api/news/:id", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    await db.delete(news).where(eq(news.id, id)).run();
    return { success: true, message: "Berita berhasil dihapus" };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menghapus berita" };
  }
});

// --- API TUTORS ROUTES ---
// Ambil semua tutor
app.get("/api/tutors", async ({ set }) => {
  try {
    const list = await db.select().from(tutors).all();
    const sanitized = list.map(({ password, ...rest }) => ({ ...rest, password: "" }));
    return { success: true, data: sanitized };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data tutor" };
  }
});

// Tambah tutor baru
app.post("/api/tutors", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const {
    nama,
    tutorMapel,
    program,
    nuptk,
    tempatTglLahir,
    jenisKelamin,
    agama,
    pendidikan,
    email,
    nik,
    alamat,
    password,
    foto,
    tanggalMulaiTugas,
    nomorSkPengangkatan,
    lembagaPengangkat,
    nomorSkPenugasan,
    lembagaPenugas,
  } = body;

  try {
    const hashedPassword = await Bun.password.hash(password || "password123");
    const inserted = await db.insert(tutors).values({
      nama,
      tutorMapel,
      program: program || '',
      nuptk: nuptk || '',
      tempatTglLahir: tempatTglLahir || '',
      jenisKelamin: jenisKelamin || '',
      agama: agama || '',
      pendidikan: pendidikan || '',
      email: email || '',
      nik: nik || '',
      alamat: alamat || '',
      password: hashedPassword,
      foto: foto || '',
      tanggalMulaiTugas: tanggalMulaiTugas || '',
      nomorSkPengangkatan: nomorSkPengangkatan || '',
      lembagaPengangkat: lembagaPengangkat || '',
      nomorSkPenugasan: nomorSkPenugasan || '',
      lembagaPenugas: lembagaPenugas || '',
    }).returning().get();
    
    const { password: _, ...sanitized } = inserted;
    return { success: true, data: sanitized };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menambahkan data tutor" };
  }
}, {
  body: t.Object({
    nama: t.String({ minLength: 1 }),
    tutorMapel: t.String({ minLength: 1 }),
    program: t.Optional(t.String()),
    nuptk: t.Optional(t.String()),
    tempatTglLahir: t.Optional(t.String()),
    jenisKelamin: t.Optional(t.String()),
    agama: t.Optional(t.String()),
    pendidikan: t.Optional(t.String()),
    email: t.Optional(t.String()),
    nik: t.Optional(t.String()),
    alamat: t.Optional(t.String()),
    password: t.Optional(t.String()),
    foto: t.Optional(t.String()),
    tanggalMulaiTugas: t.Optional(t.String()),
    nomorSkPengangkatan: t.Optional(t.String()),
    lembagaPengangkat: t.Optional(t.String()),
    nomorSkPenugasan: t.Optional(t.String()),
    lembagaPenugas: t.Optional(t.String()),
  })
});

// Update tutor
app.put("/api/tutors/:id", async ({ params, body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  const {
    nama,
    tutorMapel,
    program,
    nuptk,
    tempatTglLahir,
    jenisKelamin,
    agama,
    pendidikan,
    email,
    nik,
    alamat,
    password,
    foto,
    tanggalMulaiTugas,
    nomorSkPengangkatan,
    lembagaPengangkat,
    nomorSkPenugasan,
    lembagaPenugas,
  } = body;

  try {
    const existing = await db.select().from(tutors).where(eq(tutors.id, id)).get();
    if (!existing) {
      set.status = 404;
      return { success: false, message: "Data tutor tidak ditemukan" };
    }

    let finalPassword = existing.password;
    if (password) {
      finalPassword = await Bun.password.hash(password);
    }

    const updated = await db.update(tutors)
      .set({
        nama,
        tutorMapel,
        program: program ?? existing.program,
        nuptk: nuptk ?? existing.nuptk,
        tempatTglLahir: tempatTglLahir ?? existing.tempatTglLahir,
        jenisKelamin: jenisKelamin ?? existing.jenisKelamin,
        agama: agama ?? existing.agama,
        pendidikan: pendidikan ?? existing.pendidikan,
        email: email ?? existing.email,
        nik: nik ?? existing.nik,
        alamat: alamat ?? existing.alamat,
        password: finalPassword,
        foto: foto ?? existing.foto,
        tanggalMulaiTugas: tanggalMulaiTugas ?? existing.tanggalMulaiTugas,
        nomorSkPengangkatan: nomorSkPengangkatan ?? existing.nomorSkPengangkatan,
        lembagaPengangkat: lembagaPengangkat ?? existing.lembagaPengangkat,
        nomorSkPenugasan: nomorSkPenugasan ?? existing.nomorSkPenugasan,
        lembagaPenugas: lembagaPenugas ?? existing.lembagaPenugas,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tutors.id, id))
      .returning()
      .get();

    const { password: _, ...sanitized } = updated;
    return { success: true, data: sanitized };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui data tutor" };
  }
}, {
  body: t.Object({
    nama: t.String({ minLength: 1 }),
    tutorMapel: t.String({ minLength: 1 }),
    program: t.Optional(t.String()),
    nuptk: t.Optional(t.String()),
    tempatTglLahir: t.Optional(t.String()),
    jenisKelamin: t.Optional(t.String()),
    agama: t.Optional(t.String()),
    pendidikan: t.Optional(t.String()),
    email: t.Optional(t.String()),
    nik: t.Optional(t.String()),
    alamat: t.Optional(t.String()),
    password: t.Optional(t.String()),
    foto: t.Optional(t.String()),
    tanggalMulaiTugas: t.Optional(t.String()),
    nomorSkPengangkatan: t.Optional(t.String()),
    lembagaPengangkat: t.Optional(t.String()),
    nomorSkPenugasan: t.Optional(t.String()),
    lembagaPenugas: t.Optional(t.String()),
  })
});

// Hapus tutor
app.delete("/api/tutors/:id", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    await db.delete(tutors).where(eq(tutors.id, id)).run();
    return { success: true, message: "Data tutor berhasil dihapus" };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menghapus data tutor" };
  }
});

// --- API STUDENTS (WARGA BELAJAR) ROUTES ---
// Ambil semua warga belajar
app.get("/api/students", async ({ set }) => {
  try {
    const list = await db.select().from(students).all();
    const sanitized = list.map(({ password, ...rest }) => ({ ...rest, password: "" }));
    return { success: true, data: sanitized };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data warga belajar" };
  }
});

// Tambah warga belajar baru
app.post("/api/students", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const {
    nama,
    nik,
    program,
    kelas,
    nisn,
    nis,
    tempatTglLahir,
    titikLayanan,
    jenisKelamin,
    noHp,
    agama,
    namaAyah,
    email,
    namaIbu,
    alamat,
    password,
    foto,
    status,
  } = body;

  try {
    const hashedPassword = await Bun.password.hash(password || "password123");
    const inserted = await db.insert(students).values({
      nama,
      nik: nik || '',
      program: program || '',
      kelas: kelas || '',
      nisn: nisn || '',
      nis: nis || '',
      tempatTglLahir: tempatTglLahir || '',
      titikLayanan: titikLayanan || '',
      jenisKelamin: jenisKelamin || '',
      noHp: noHp || '',
      agama: agama || '',
      namaAyah: namaAyah || '',
      email: email || '',
      namaIbu: namaIbu || '',
      alamat: alamat || '',
      password: hashedPassword,
      foto: foto || '',
      status: status || 'AKTIF',
    }).returning().get();

    const { password: _, ...sanitized } = inserted;
    return { success: true, data: sanitized };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menambahkan data warga belajar" };
  }
}, {
  body: t.Object({
    nama: t.String({ minLength: 1 }),
    nik: t.Optional(t.String()),
    program: t.Optional(t.String()),
    kelas: t.Optional(t.String()),
    nisn: t.Optional(t.String()),
    nis: t.Optional(t.String()),
    tempatTglLahir: t.Optional(t.String()),
    titikLayanan: t.Optional(t.String()),
    jenisKelamin: t.Optional(t.String()),
    noHp: t.Optional(t.String()),
    agama: t.Optional(t.String()),
    namaAyah: t.Optional(t.String()),
    email: t.Optional(t.String()),
    namaIbu: t.Optional(t.String()),
    alamat: t.Optional(t.String()),
    password: t.Optional(t.String()),
    foto: t.Optional(t.String()),
    status: t.Optional(t.String()),
  })
});

// Update warga belajar
app.put("/api/students/:id", async ({ params, body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  const {
    nama,
    nik,
    program,
    kelas,
    nisn,
    nis,
    tempatTglLahir,
    titikLayanan,
    jenisKelamin,
    noHp,
    agama,
    namaAyah,
    email,
    namaIbu,
    alamat,
    password,
    foto,
    status,
  } = body;

  try {
    const existing = await db.select().from(students).where(eq(students.id, id)).get();
    if (!existing) {
      set.status = 404;
      return { success: false, message: "Data warga belajar tidak ditemukan" };
    }

    let finalPassword = existing.password;
    if (password) {
      finalPassword = await Bun.password.hash(password);
    }

    const updated = await db.update(students)
      .set({
        nama,
        nik: nik ?? existing.nik,
        program: program ?? existing.program,
        kelas: kelas ?? existing.kelas,
        nisn: nisn ?? existing.nisn,
        nis: nis ?? existing.nis,
        tempatTglLahir: tempatTglLahir ?? existing.tempatTglLahir,
        titikLayanan: titikLayanan ?? existing.titikLayanan,
        jenisKelamin: jenisKelamin ?? existing.jenisKelamin,
        noHp: noHp ?? existing.noHp,
        agama: agama ?? existing.agama,
        namaAyah: namaAyah ?? existing.namaAyah,
        email: email ?? existing.email,
        namaIbu: namaIbu ?? existing.namaIbu,
        alamat: alamat ?? existing.alamat,
        password: finalPassword,
        foto: foto ?? existing.foto,
        status: status ?? existing.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(students.id, id))
      .returning()
      .get();

    const { password: _, ...sanitized } = updated;
    return { success: true, data: sanitized };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui data warga belajar" };
  }
}, {
  body: t.Object({
    nama: t.String({ minLength: 1 }),
    nik: t.Optional(t.String()),
    program: t.Optional(t.String()),
    kelas: t.Optional(t.String()),
    nisn: t.Optional(t.String()),
    nis: t.Optional(t.String()),
    tempatTglLahir: t.Optional(t.String()),
    titikLayanan: t.Optional(t.String()),
    jenisKelamin: t.Optional(t.String()),
    noHp: t.Optional(t.String()),
    agama: t.Optional(t.String()),
    namaAyah: t.Optional(t.String()),
    email: t.Optional(t.String()),
    namaIbu: t.Optional(t.String()),
    alamat: t.Optional(t.String()),
    password: t.Optional(t.String()),
    foto: t.Optional(t.String()),
    status: t.Optional(t.String()),
  })
});

// Naikkan kelas warga belajar
app.post("/api/students/:id/promote", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    const existing = await db.select().from(students).where(eq(students.id, id)).get();
    if (!existing) {
      set.status = 404;
      return { success: false, message: "Data warga belajar tidak ditemukan" };
    }

    // Naikkan kelas logic (misal Kelas V -> Kelas VI, Kelas VII -> Kelas VIII, dll)
    let currentGrade = existing.kelas.toUpperCase();
    let nextGrade = currentGrade;
    if (currentGrade.includes("DUABELAS")) {
      set.status = 400;
      return { success: false, message: "Warga belajar sudah berada di kelas tertinggi (Kelas XII)" };
    } else if (currentGrade.includes("SEBELAS")) {
      nextGrade = "KELAS XII (DUABELAS)";
    } else if (currentGrade.includes("SEPULUH")) {
      nextGrade = "KELAS XI (SEBELAS)";
    } else if (currentGrade.includes("SEMBILAN")) {
      set.status = 400;
      return { success: false, message: "Warga belajar sudah berada di kelas tertinggi untuk Paket B (Kelas IX)" };
    } else if (currentGrade.includes("DELAPAN")) {
      nextGrade = "KELAS IX (SEMBILAN)";
    } else if (currentGrade.includes("TUJUH")) {
      nextGrade = "KELAS VIII (DELAPAN)";
    } else if (currentGrade.includes("ENAM")) {
      set.status = 400;
      return { success: false, message: "Warga belajar sudah berada di kelas tertinggi untuk Paket A (Kelas VI)" };
    } else if (currentGrade.includes("LIMA")) {
      nextGrade = "KELAS VI (ENAM)";
    } else if (currentGrade.includes("EMPAT")) {
      nextGrade = "KELAS V (LIMA)";
    } else if (currentGrade.includes("TIGA")) {
      nextGrade = "KELAS EMPAT (EMPAT)";
    } else if (currentGrade.includes("DUA")) {
      nextGrade = "KELAS TIGA (TIGA)";
    } else if (currentGrade.includes("SATU")) {
      nextGrade = "KELAS DUA (DUA)";
    }

    const updated = await db.update(students)
      .set({ kelas: nextGrade, updatedAt: new Date().toISOString() })
      .where(eq(students.id, id))
      .returning().get();

    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menaikkan kelas" };
  }
});

// Luluskan warga belajar (Otomatis status LULUS)
app.post("/api/students/:id/graduate", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    const updated = await db.update(students)
      .set({ status: "LULUS", updatedAt: new Date().toISOString() })
      .where(eq(students.id, id))
      .returning().get();
    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal meluluskan warga belajar" };
  }
});

// Melanjutkan program (Ubah program Paket A/B/C dan reset kelas)
app.post("/api/students/:id/continue", async ({ params, body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  const { program, kelas } = body;
  try {
    const updated = await db.update(students)
      .set({
        program,
        kelas,
        status: "AKTIF",
        updatedAt: new Date().toISOString()
      })
      .where(eq(students.id, id))
      .returning().get();
    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memproses kelanjutan program" };
  }
}, {
  body: t.Object({
    program: t.String(),
    kelas: t.String(),
  })
});

// Hapus warga belajar
app.delete("/api/students/:id", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    await db.delete(students).where(eq(students.id, id)).run();
    return { success: true, message: "Warga belajar berhasil dihapus" };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menghapus warga belajar" };
  }
});

// --- API DOWNLOADS ROUTES ---
// Ambil semua download (Public, hanya PUBLISH)
app.get("/api/downloads", async ({ set }) => {
  try {
    const list = await db.select().from(downloads).where(eq(downloads.status, 'PUBLISH')).all();
    return { success: true, data: list };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data download" };
  }
});

// Ambil semua download (Admin)
app.get("/api/downloads/admin", async ({ headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  try {
    const list = await db.select().from(downloads).all();
    return { success: true, data: list };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data download" };
  }
});

// Tambah download baru
app.post("/api/downloads", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const { namaFile, kategori, fileUrl, status, tanggalUpload } = body;
  try {
    const inserted = await db.insert(downloads).values({
      namaFile,
      kategori,
      fileUrl,
      status: status || 'PUBLISH',
      tanggalUpload: tanggalUpload || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      hits: 0,
    }).returning().get();

    return { success: true, data: inserted };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menambahkan data download" };
  }
}, {
  body: t.Object({
    namaFile: t.String({ minLength: 1 }),
    kategori: t.String({ minLength: 1 }),
    fileUrl: t.String({ minLength: 1 }),
    status: t.Optional(t.String()),
    tanggalUpload: t.Optional(t.String()),
  })
});

// Update download
app.put("/api/downloads/:id", async ({ params, body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  const { namaFile, kategori, fileUrl, status, tanggalUpload } = body;
  try {
    const updated = await db.update(downloads)
      .set({
        namaFile,
        kategori,
        fileUrl,
        status,
        tanggalUpload,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(downloads.id, id))
      .returning()
      .get();

    if (!updated) {
      set.status = 404;
      return { success: false, message: "Data download tidak ditemukan" };
    }

    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui data download" };
  }
}, {
  body: t.Object({
    namaFile: t.String({ minLength: 1 }),
    kategori: t.String({ minLength: 1 }),
    fileUrl: t.String({ minLength: 1 }),
    status: t.String(),
    tanggalUpload: t.String(),
  })
});

// Increment hit count
app.post("/api/downloads/:id/hit", async ({ params, set }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    const updated = await db.update(downloads)
      .set({
        hits: sql`${downloads.hits} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(downloads.id, id))
      .returning()
      .get();

    if (!updated) {
      set.status = 404;
      return { success: false, message: "Data download tidak ditemukan" };
    }

    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui jumlah unduhan" };
  }
});

// Hapus download
app.delete("/api/downloads/:id", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    await db.delete(downloads).where(eq(downloads.id, id)).run();
    return { success: true, message: "Data download berhasil dihapus" };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menghapus data download" };
  }
});

// --- API PRODUCTS (PRODUK WARGA BELAJAR) ROUTES ---
// Ambil semua produk aktif untuk publik
app.get("/api/products", async ({ set }) => {
  try {
    const list = await db.select().from(products).where(eq(products.status, 'AKTIF')).all();
    return { success: true, data: list };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data produk warga belajar" };
  }
});

// Ambil semua produk untuk admin
app.get("/api/products/admin", async ({ headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  try {
    const list = await db.select().from(products).all();
    return { success: true, data: list };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data produk warga belajar" };
  }
});

// Tambah produk baru
app.post("/api/products", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const { namaProduk, deskripsi, noHp, penjual, satuan, harga, status, gambar } = body;
  try {
    const inserted = await db.insert(products).values({
      namaProduk,
      deskripsi,
      noHp,
      penjual,
      satuan,
      harga,
      status: status || "AKTIF",
      gambar: gambar || "",
    }).returning().get();

    return { success: true, data: inserted };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menambahkan data produk baru" };
  }
}, {
  body: t.Object({
    namaProduk: t.String(),
    deskripsi: t.String(),
    noHp: t.String(),
    penjual: t.String(),
    satuan: t.String(),
    harga: t.Numeric(),
    status: t.Optional(t.String()),
    gambar: t.Optional(t.String()),
  })
});

// Update produk
app.put("/api/products/:id", async ({ params, body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  const { namaProduk, deskripsi, noHp, penjual, satuan, harga, status, gambar } = body;
  try {
    const updated = await db.update(products)
      .set({
        namaProduk,
        deskripsi,
        noHp,
        penjual,
        satuan,
        harga,
        status,
        gambar,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(products.id, id))
      .returning()
      .get();

    if (!updated) {
      set.status = 404;
      return { success: false, message: "Data produk tidak ditemukan" };
    }

    return { success: true, data: updated };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui data produk" };
  }
}, {
  body: t.Object({
    namaProduk: t.String(),
    deskripsi: t.String(),
    noHp: t.String(),
    penjual: t.String(),
    satuan: t.String(),
    harga: t.Numeric(),
    status: t.String(),
    gambar: t.String(),
  })
});

// Hapus produk
app.delete("/api/products/:id", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    await db.delete(products).where(eq(products.id, id)).run();
    return { success: true, message: "Data produk berhasil dihapus" };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menghapus data produk" };
  }
});

// --- API MANAGERS ROUTES ---
// Ambil semua pengelola
app.get("/api/managers", async ({ headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  try {
    const list = await db.select().from(managers).all();
    const safeList = list.map(({ password, ...rest }) => rest);
    return { success: true, data: safeList };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data pengelola" };
  }
});

// Ambil data pengelola untuk publik (landing page)
app.get("/api/public-managers", async ({ set }) => {
  try {
    const list = await db.select({
      id: managers.id,
      nama: managers.nama,
      jabatan: managers.jabatan,
      foto: managers.foto,
    }).from(managers).all();
    return { success: true, data: list };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal mengambil data pengelola" };
  }
});

// Tambah pengelola baru
app.post("/api/managers", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  try {
    const { password, ...otherFields } = body;
    const hashedPassword = password ? await Bun.password.hash(password) : "";
    const inserted = await db.insert(managers).values({
      ...otherFields,
      password: hashedPassword,
    }).returning().get();
    
    const { password: _, ...safeData } = inserted;
    return { success: true, data: safeData };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menambahkan data pengelola" };
  }
}, {
  body: t.Object({
    nama: t.String(),
    nik: t.String(),
    jabatan: t.String(),
    nuptk: t.String(),
    tempatTglLahir: t.String(),
    jenisKelamin: t.String(),
    agama: t.String(),
    pendidikan: t.String(),
    email: t.String(),
    tanggalMulaiTugas: t.String(),
    nomorSkPengangkatan: t.String(),
    lembagaPengangkat: t.String(),
    nomorSkPenugasan: t.String(),
    lembagaPenugas: t.String(),
    alamat: t.String(),
    password: t.Optional(t.String()),
    foto: t.String(),
  })
});

// Update pengelola
app.put("/api/managers/:id", async ({ params, body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    const { password, ...otherFields } = body;
    const updateData: Record<string, any> = { ...otherFields };
    if (password && password.trim() !== "") {
      updateData.password = await Bun.password.hash(password);
    }

    const updated = await db.update(managers)
      .set({
        ...updateData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(managers.id, id))
      .returning()
      .get();
      
    if (!updated) {
      set.status = 404;
      return { success: false, message: "Pengelola tidak ditemukan" };
    }
    
    const { password: _, ...safeData } = updated;
    return { success: true, data: safeData };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal memperbarui data pengelola" };
  }
}, {
  body: t.Object({
    nama: t.String(),
    nik: t.String(),
    jabatan: t.String(),
    nuptk: t.String(),
    tempatTglLahir: t.String(),
    jenisKelamin: t.String(),
    agama: t.String(),
    pendidikan: t.String(),
    email: t.String(),
    tanggalMulaiTugas: t.String(),
    nomorSkPengangkatan: t.String(),
    lembagaPengangkat: t.String(),
    nomorSkPenugasan: t.String(),
    lembagaPenugas: t.String(),
    alamat: t.String(),
    password: t.Optional(t.String()),
    foto: t.String(),
  })
});

// Hapus pengelola
app.delete("/api/managers/:id", async ({ params, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const id = Number(params.id);
  if (isNaN(id)) {
    set.status = 400;
    return { success: false, message: "ID parameter tidak valid" };
  }

  try {
    await db.delete(managers).where(eq(managers.id, id)).run();
    return { success: true, message: "Pengelola berhasil dihapus" };
  } catch (e) {
    set.status = 500;
    return { success: false, message: "Gagal menghapus pengelola" };
  }
});


// Endpoint untuk Unggah Berkas Gambar Fisik (Aman & Efisien)
app.post("/api/upload", async ({ body, headers, jwt, set }) => {
  const authError = await verifyAdmin(headers, jwt, set);
  if (authError) return authError;

  const { file } = body;
  if (!file || !(file instanceof File)) {
    set.status = 400;
    return { success: false, message: "Berkas tidak valid" };
  }

  // Validasi Ekstensi Berkas (Gambar & Dokumen yang Aman)
  const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif", "svg", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip", "rar", "txt"];
  const fileExt = file.name.split(".").pop()?.toLowerCase();
  if (!fileExt || !allowedExtensions.includes(fileExt)) {
    set.status = 400;
    return { success: false, message: "Ekstensi berkas tidak diperbolehkan" };
  }

  // Validasi Mime-Type (Gambar & Dokumen)
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "text/plain"
  ];
  if (!file.type.startsWith("image/") && !allowedMimeTypes.includes(file.type)) {
    set.status = 400;
    return { success: false, message: "Hanya berkas gambar atau dokumen yang diperbolehkan" };
  }

  // Validasi Ukuran Berkas (Maksimal 5MB)
  if (file.size > 5 * 1024 * 1024) {
    set.status = 400;
    return { success: false, message: "Ukuran berkas melebihi batas 5MB" };
  }

  const uploadDir = "public/uploads";
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `${uploadDir}/${fileName}`;

  await Bun.write(filePath, file);

  return { success: true, url: `/uploads/${fileName}` };
}, {
  body: t.Object({
    file: t.File()
  })
});

// Sajikan berkas unggahan gambar statis dari public/uploads secara global
app.use(
  staticPlugin({
    assets: "public/uploads",
    prefix: "/uploads",
  })
);

// 1b. DEV: Sajikan file statis dari public/ (gambar, favicon, dll)
if (!isProd) {
  app.use(
    staticPlugin({
      assets: "public",
      prefix: "/",
    })
  );
}

// 2. PRODUCTION: Serahkan semua urusan statis & SPA ke Elysia Static Plugin
if (isProd) {
  app.use(
    staticPlugin({
      assets: "dist",
      prefix: "/",
      indexHTML: true,
    })
  );
  
  // Wildcard fallback rute untuk SPA di produksi agar refresh halaman aman
  app.get("/*", ({ set, request }) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || url.pathname.includes(".")) {
      set.status = 404;
      return "Not Found";
    }
    return Bun.file("dist/index.html");
  });
} 


// 4. Jalankan Server
const port = process.env.PORT || 3000;
const hostname = isProd ? "0.0.0.0" : "localhost";

const server = Bun.serve({
  port,
  hostname,
  development: !isProd && {
    hmr: true,
    console: true,
  },
  routes: {
    ...(!isProd && html ? {
      "/": html.default,
      "/index.html": html.default,
      "/dashboard": html.default,
      "/profile": html.default,
    } : {}),
  } as any,
  fetch(req) {
    return app.fetch(req);
  },
});

console.log(`🚀 Server running at ${server.url} [${isProd ? "production" : "development"}]`);
console.log("🦊 Elysia is ready to handle requests!");

export default app;
