import { describe, expect, test } from "bun:test";
import {
  createApp,
  handleAppError,
  isApiPath,
  isAssetPath,
  resolveCorsOrigins,
  resolveCorsOriginValue,
  securityHeaders,
  shouldEnableCors,
  spaFallbackResponse,
} from "../../../src/server/app";

describe("app composition helpers", () => {
  test("handleAppError hanya memetakan NOT_FOUND", () => {
    const notFound = { code: "NOT_FOUND", status: 200 } as unknown as {
      code: unknown;
      status: number;
      set: { status: number };
    };
    (notFound as unknown as { set: { status: number } }).set = notFound;
    expect(handleAppError(notFound as never)).toBe("Not Found");
    expect(notFound.status).toBe(404);
    expect(handleAppError({ code: "OTHER", set: { status: 200 } })).toBeUndefined();
  });

  test("securityHeaders membedakan file dan halaman biasa", () => {
    expect(securityHeaders("/api/files/a.png")["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(securityHeaders("/api/students")["X-Frame-Options"]).toBe("DENY");
    expect(securityHeaders("/x")["X-Content-Type-Options"]).toBe("nosniff");
    expect(securityHeaders("/x")["Strict-Transport-Security"]).toContain("max-age=31536000");
  });

  test("CORS origins diparse dan diaktifkan sesuai environment", () => {
    expect(resolveCorsOrigins(" https://a.test, ,https://b.test ")).toEqual([
      "https://a.test",
      "https://b.test",
    ]);
    expect(shouldEnableCors(false, [])).toBe(true);
    expect(shouldEnableCors(true, [])).toBe(false);
    expect(shouldEnableCors(true, ["https://a.test"])).toBe(true);
    expect(resolveCorsOriginValue(false, [])).toBe(true);
    expect(resolveCorsOriginValue(true, ["https://a.test"])).toEqual(["https://a.test"]);
  });

  test("SPA fallback hanya untuk rute non-API dan non-aset", () => {
    expect(isApiPath("/api/students")).toBe(true);
    expect(isApiPath("/dashboard")).toBe(false);
    expect(isAssetPath("/logo.png")).toBe(true);
    expect(isAssetPath("/dashboard")).toBe(false);
    expect(spaFallbackResponse("/api/x")).toEqual({ status: 404, body: "Not Found" });
    expect(spaFallbackResponse("/logo.png")).toEqual({ status: 404, body: "Not Found" });
    expect(spaFallbackResponse("/dashboard")).toBeNull();
  });

  test("createApp mendukung opsi produksi tanpa origin (tanpa CORS)", async () => {
    const app = createApp({ isProd: true, corsOrigin: "" });
    const response = await app.fetch(new Request("http://in-process.test/api/hello"));
    expect(response.status).toBe(200);
  });

  test("createApp produksi dengan origin mengembalikan header CORS", async () => {
    const app = createApp({ isProd: true, corsOrigin: "https://admin.test" });
    const response = await app.fetch(
      new Request("http://in-process.test/api/hello", {
        headers: { origin: "https://admin.test" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://admin.test");
  });
});
