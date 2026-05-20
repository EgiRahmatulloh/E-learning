import { Elysia } from "elysia";
import { staticPlugin } from "@elysia/static";

const isProd = Bun.env.NODE_ENV === "production";
const html = !isProd ? await import("../index.html") : null;

const app = new Elysia();

// 1. REST API Routes (Selalu di atas)
app.get("/api/hello", () => ({
  message: "Hello from Elysia!",
  status: "Connected",
}));

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
    } : {}),
  } as any,
  fetch(req) {
    return app.fetch(req);
  },
});

console.log(`🚀 Server running at ${server.url} [${isProd ? "production" : "development"}]`);
console.log("🦊 Elysia is ready to handle requests!");

export default app;