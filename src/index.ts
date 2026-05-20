import { Elysia } from "elysia";
import { staticPlugin } from "@elysia/static";

const isProd = Bun.env.NODE_ENV === "production";

const app = new Elysia();

// 1. REST API Routes (Selalu di atas)
app.get("/api/hello", () => ({
  message: "Hello from Elysia!",
  status: "Connected",
}));

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
// 3. DEVELOPMENT: Hanya perlu handle HMR untuk root/SPA routes
else {
  app.get("/*", async ({ path, set }) => {
    if (path.includes(".")) {
      set.status = 404;
      return "Not Found";
    }
    try {
      return (await import("../index.html")).default;
    } catch (e) {
      set.status = 500;
      return "Development index.html not found";
    }
  });
}

// 4. Jalankan Server
app.listen({
  port: process.env.PORT || 3000,
  hostname: "0.0.0.0",
  development: !isProd && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${app.server?.url} [${isProd ? "production" : "development"}]`);
console.log("🦊 Elysia is ready to handle requests!");

export default app;