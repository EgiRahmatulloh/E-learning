import { staticPlugin } from "@elysia/static";
import { createApp, spaFallbackResponse } from "./server/app";
import { IS_PROD } from "./server/config/jwt";
import { seedDatabase } from "./server/db/seed";

await seedDatabase();

const html = !IS_PROD ? await import("../index.html") : null;
const app = createApp();

app.use(
  staticPlugin({
    assets: "public/uploads",
    prefix: "/uploads",
  }),
);

if (!IS_PROD) {
  app.use(
    staticPlugin({
      assets: "public",
      prefix: "/",
    }),
  );
}

if (IS_PROD) {
  app.use(
    staticPlugin({
      assets: "dist",
      prefix: "/",
      indexHTML: true,
    }),
  );

  app.get("/*", (context: any) => {
    const { set, request } = context;
    const fallback = spaFallbackResponse(new URL(request.url).pathname);
    if (fallback) {
      set.status = fallback.status;
      return fallback.body;
    }
    return Bun.file("dist/index.html");
  });
}

const port = process.env.PORT || 3000;
const hostname = process.env.HOST || (IS_PROD ? "127.0.0.1" : "localhost");

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
          "/dashboard/*": html.default,
        }
      : {}),
  } as any,
  fetch(req) {
    return app.fetch(req);
  },
});

console.log(
  `🚀 Server running at ${server.url} [${IS_PROD ? "production" : "development"}]`,
);
console.log("🦊 Elysia is ready to handle requests!");

export default app;
