import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { staticPlugin } from "@elysia/static";
import { db } from "./server/db";
import { users, sliders, announcements } from "./server/db/schema";
import { eq, or } from "drizzle-orm";
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
  const authHeader = headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    set.status = 401;
    return { success: false, message: "Akses ditolak, token hilang" };
  }
  const token = authHeader.split(' ')[1];
  const payload = await jwt.verify(token);
  if (!payload || payload.role !== 'admin') {
    set.status = 403;
    return { success: false, message: "Akses ditolak, hanya admin yang diizinkan" };
  }

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
  const authHeader = headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    set.status = 401;
    return { success: false, message: "Akses ditolak, token hilang" };
  }
  const token = authHeader.split(' ')[1];
  const payload = await jwt.verify(token);
  if (!payload || payload.role !== 'admin') {
    set.status = 403;
    return { success: false, message: "Akses ditolak, hanya admin yang diizinkan" };
  }

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
  const authHeader = headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    set.status = 401;
    return { success: false, message: "Akses ditolak, token hilang" };
  }
  const token = authHeader.split(' ')[1];
  const payload = await jwt.verify(token);
  if (!payload || payload.role !== 'admin') {
    set.status = 403;
    return { success: false, message: "Akses ditolak, hanya admin yang diizinkan" };
  }

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
  const authHeader = headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    set.status = 401;
    return { success: false, message: "Akses ditolak, token hilang" };
  }
  const token = authHeader.split(' ')[1];
  const payload = await jwt.verify(token);
  if (!payload || payload.role !== 'admin') {
    set.status = 403;
    return { success: false, message: "Akses ditolak, hanya admin yang diizinkan" };
  }

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
    text: t.String(),
    date: t.String(),
    status: t.Optional(t.String()),
  })
});

// Update pengumuman
app.put("/api/announcements/:id", async ({ params, body, headers, jwt, set }) => {
  const authHeader = headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    set.status = 401;
    return { success: false, message: "Akses ditolak, token hilang" };
  }
  const token = authHeader.split(' ')[1];
  const payload = await jwt.verify(token);
  if (!payload || payload.role !== 'admin') {
    set.status = 403;
    return { success: false, message: "Akses ditolak, hanya admin yang diizinkan" };
  }

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
    text: t.String(),
    date: t.String(),
    status: t.String(),
  })
});

// Hapus pengumuman
app.delete("/api/announcements/:id", async ({ params, headers, jwt, set }) => {
  const authHeader = headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    set.status = 401;
    return { success: false, message: "Akses ditolak, token hilang" };
  }
  const token = authHeader.split(' ')[1];
  const payload = await jwt.verify(token);
  if (!payload || payload.role !== 'admin') {
    set.status = 403;
    return { success: false, message: "Akses ditolak, hanya admin yang diizinkan" };
  }

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

// Endpoint untuk Unggah Berkas Gambar Fisik (Aman & Efisien)
app.post("/api/upload", async ({ body, headers, jwt, set }) => {
  const authHeader = headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    set.status = 401;
    return { success: false, message: "Akses ditolak, token hilang" };
  }
  const token = authHeader.split(' ')[1];
  const payload = await jwt.verify(token);
  if (!payload || payload.role !== 'admin') {
    set.status = 403;
    return { success: false, message: "Akses ditolak, hanya admin yang diizinkan" };
  }

  const { file } = body;
  if (!file || !(file instanceof File)) {
    set.status = 400;
    return { success: false, message: "Berkas tidak valid" };
  }

  // Validasi Ekstensi Berkas (Hanya Gambar yang Aman)
  const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif", "svg"];
  const fileExt = file.name.split(".").pop()?.toLowerCase();
  if (!fileExt || !allowedExtensions.includes(fileExt)) {
    set.status = 400;
    return { success: false, message: "Hanya ekstensi gambar (.jpg, .jpeg, .png, .webp, .gif, .svg) yang diperbolehkan" };
  }

  // Validasi Mime-Type (Hanya Gambar)
  if (!file.type.startsWith("image/")) {
    set.status = 400;
    return { success: false, message: "Hanya berkas gambar yang diperbolehkan" };
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
    } : {}),
  } as any,
  fetch(req) {
    return app.fetch(req);
  },
});

console.log(`🚀 Server running at ${server.url} [${isProd ? "production" : "development"}]`);
console.log("🦊 Elysia is ready to handle requests!");

export default app;
