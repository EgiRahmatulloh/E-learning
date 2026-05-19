import { serve } from "bun";

const isProd = Bun.env.NODE_ENV === "production";

const server = serve({
  routes: {

    // In development, handle all unmatched routes with the src/index.html
    // We use a dynamic import or Bun.file to avoid static import errors in production
    ...(!isProd ? { 
      "/*": (await import("/index.html")).default 
    } : {}),
  },

  // The 'fetch' function is called if no 'routes' match.
  async fetch(req) {
    if (isProd) {
      const url = new URL(req.url);
      let path = url.pathname;
      
      // Serve files from 'dist' folder
      if (path === "/") path = "/index.html";
      const file = Bun.file(`./dist${path}`);
      
      if (await file.exists()) {
        return new Response(file);
      }

      // SPA Fallback: If it's not a file request (no extension), serve index.html
      if (!path.includes(".")) {
        const indexFile = Bun.file("./dist/index.html");
        if (await indexFile.exists()) {
          return new Response(indexFile);
        }
      }
    }
    return new Response("Not Found", { status: 404 });
  },

  development: !isProd && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url} [${isProd ? "production" : "development"}]`);
