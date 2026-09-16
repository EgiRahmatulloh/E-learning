import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { IS_PROD } from "./config/jwt";
import { authHandlers } from "./handlers/auth";
import { managersHandlers } from "./handlers/managers";
import { tutorsHandlers } from "./handlers/tutors";
import { studentsHandlers } from "./handlers/students";
import { rombelHandlers } from "./handlers/rombels";
import { newsHandlers } from "./handlers/news";
import { contentHandlers } from "./handlers/content";
import { elearningHandlers } from "./handlers/elearning";
import { uploadServices } from "./services/upload";
import { statsServices } from "./services/stats";

export interface CreateAppOptions {
  isProd?: boolean;
  corsOrigin?: string;
}

export function handleAppError(context: any) {
  if (context.code === "NOT_FOUND") {
    context.set.status = 404;
    return "Not Found";
  }
}

export function securityHeaders(pathname: string): Record<string, string> {
  return {
    "X-Frame-Options": pathname.startsWith("/api/files/") ? "SAMEORIGIN" : "DENY",
    "X-Content-Type-Options": "nosniff",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  };
}

export function resolveCorsOrigins(corsOrigin?: string): string[] {
  return (corsOrigin ?? Bun.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function shouldEnableCors(isProd: boolean, corsOrigins: string[]): boolean {
  return !isProd || corsOrigins.length > 0;
}

export function resolveCorsOriginValue(isProd: boolean, corsOrigins: string[]): string[] | true {
  return isProd ? corsOrigins : true;
}

export function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

export function isAssetPath(pathname: string): boolean {
  return pathname.includes(".");
}

export function spaFallbackResponse(pathname: string): { status: number; body: string } | null {
  if (isApiPath(pathname) || isAssetPath(pathname)) {
    return { status: 404, body: "Not Found" };
  }
  return null;
}

export function createApp(options: CreateAppOptions = {}) {
  const isProd = options.isProd ?? IS_PROD;
  const corsOrigins = resolveCorsOrigins(options.corsOrigin);

  const corsGuard = new Elysia({ name: "cors-guard" });
  if (shouldEnableCors(isProd, corsOrigins)) {
    corsGuard.use(
      cors({
        origin: resolveCorsOriginValue(isProd, corsOrigins),
        credentials: false,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposeHeaders: ["Content-Disposition"],
        maxAge: 600,
      }),
    );
  }

  return new Elysia()
    .use(corsGuard)
    .onRequest(({ set, request }) => {
      Object.assign(set.headers, securityHeaders(new URL(request.url).pathname));
    })
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
    .onError(handleAppError)
    .get("/api/hello", () => ({
      message: "Hello from Elysia!",
      status: "Connected",
    }));
}

export type App = ReturnType<typeof createApp>;
