import { Elysia } from "elysia";
import { staticPlugin } from "@elysia/static";
import { seedDatabase } from "./server/db/seed";
import { IS_PROD } from "./server/config/jwt";

// Handlers
import { authHandlers } from "./server/handlers/auth";
import { managersHandlers } from "./server/handlers/managers";
import { tutorsHandlers } from "./server/handlers/tutors";
import { studentsHandlers } from "./server/handlers/students";
import { rombelHandlers } from "./server/handlers/rombels";
import { newsHandlers } from "./server/handlers/news";
import { contentHandlers } from "./server/handlers/content";
import { elearningHandlers } from "./server/handlers/elearning";

// Services
import { uploadServices } from "./server/services/upload";
import { statsServices } from "./server/services/stats";

// Jalankan Seeding Database otomatis saat startup
await seedDatabase();

const html = !IS_PROD ? await import("../index.html") : null;

import { cors } from "@elysiajs/cors";

const app = new Elysia()
  .use(cors())
  .onRequest(({ set, request }) => {
    // File unggahan (mis. PDF) perlu tampil di <iframe> aplikasi sendiri untuk preview,
    // jadi jangan kirim X-Frame-Options: DENY untuk endpoint /api/files/.
    // SAMEORIGIN sudah cukup: hanya halaman kita yang boleh nge-frame.
    const pathname = new URL(request.url).pathname;
    if (!pathname.startsWith("/api/files/")) {
      set.headers["X-Frame-Options"] = "DENY";
    } else {
      set.headers["X-Frame-Options"] = "SAMEORIGIN";
    }
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
  })
  // Mount REST API Handlers & Services
  .use(authHandlers)
  .use(managersHandlers)
  .use(tutorsHandlers)
  .use(studentsHandlers)
  .use(rombelHandlers)
  .use(newsHandlers)
  .use(contentHandlers)
  .use(elearningHandlers)
  .use(uploadServices)
  .use(statsServices)
  .onError(({ code, set }) => {
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return 'Not Found';
    }
  });

// Hello Endpoint
app.get("/api/hello", () => ({
  message: "Hello from Elysia!",
  status: "Connected",
}));

// Sajikan berkas unggahan gambar statis dari public/uploads secara global
app.use(
  staticPlugin({
    assets: "public/uploads",
    prefix: "/uploads",
  })
);

// DEV: Sajikan file statis dari public/ (gambar, favicon, dll)
if (!IS_PROD) {
  app.use(
    staticPlugin({
      assets: "public",
      prefix: "/",
    })
  );
}

// PRODUCTION: Serahkan semua urusan statis & SPA ke Elysia Static Plugin
if (IS_PROD) {
  app.use(
    staticPlugin({
      assets: "dist",
      prefix: "/",
      indexHTML: true,
    })
  );

  // Wildcard fallback rute untuk SPA di produksi agar refresh halaman aman
  app.get("/*", (context: any) => {
    const { set, request } = context;
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || url.pathname.includes(".")) {
      set.status = 404;
      return "Not Found";
    }
    return Bun.file("dist/index.html");
  });
}

// Jalankan Server
const port = process.env.PORT || 3000;
const hostname = IS_PROD ? "0.0.0.0" : "localhost";

const server = Bun.serve({
  port,
  hostname,
  development: !IS_PROD && {
    hmr: true,
    console: true,
  },
  routes: {
    ...(!IS_PROD && html
      ? {
          "/": html.default,
          "/index.html": html.default,
          "/dashboard": html.default,
          "/profile": html.default,
          "/agenda": html.default,
          "/news": html.default,
          "/tutor": html.default,
          "/warga-belajar": html.default,
          "/download": html.default,
          "/produk-wb": html.default,
          "/alumni": html.default,
          "/galeri": html.default,
        }
      : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  fetch(req) {
    return app.fetch(req);
  },
});

console.log(`🚀 Server running at ${server.url} [${IS_PROD ? "production" : "development"}]`);
console.log("🦊 Elysia is ready to handle requests!");

export default app;
