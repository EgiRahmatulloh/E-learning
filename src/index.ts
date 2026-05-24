import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { staticPlugin } from "@elysia/static";
import { db } from "./server/db";
import { users } from "./server/db/schema";
import { eq, or } from "drizzle-orm";
import { seedDatabase } from "./server/db/seed";

// Jalankan Seeding Database otomatis saat startup
await seedDatabase();

const isProd = Bun.env.NODE_ENV === "production";
const html = !isProd ? await import("../index.html") : null;

const app = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'super-secret-key-pkbm-menuju-makmur',
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

    if (!user) {
      set.status = 401;
      return { message: "Username/Email atau Password salah" };
    }

    // Verifikasi hash password bawaan Bun
    const isPasswordValid = await Bun.password.verify(password, user.password);
    if (!isPasswordValid) {
      set.status = 401;
      return { message: "Username/Email atau Password salah" };
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
    })
    .from(users)
    .where(eq(users.id, Number(payload.id)))
    .get();

  if (!user) {
    set.status = 404;
    return { message: "User tidak ditemukan" };
  }

  return { success: true, user };
});

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
  
  // Fallback rute untuk SPA agar refresh halaman /dashboard aman di produksi
  app.get("/dashboard", () => Bun.file("dist/index.html"));
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
