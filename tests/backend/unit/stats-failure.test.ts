// Stats DB-failure branches: mock db agar select melempar, lalu panggil
// service composition yang sama dengan production (statsServices.fetch).
import { describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "stats-failure-test-secret";

mock.module("../../../src/server/config/db.ts", () => ({
  db: {
    select: () => ({
      from: () => ({
        all: async () => {
          throw new Error("fake db down");
        },
      }),
    }),
  },
}));

const {
  countActiveProducts,
  countActiveStudents,
  countMaterialsByType,
  countStudentsInProgram,
  statsServices,
} = await import("../../../src/server/services/stats");

describe("stats counting helpers", () => {
  test("menghitung hanya record yang cocok", () => {
    expect(countActiveStudents([{ status: "AKTIF" }, { status: "LULUS" }])).toBe(1);
    expect(countActiveProducts([{ status: "NONAKTIF" }, { status: "AKTIF" }])).toBe(1);
    expect(countStudentsInProgram([
      { program: "PAKET A" },
      { program: "Kelas Paket A Lanjutan" },
      { program: "Program Mandiri" },
      { program: "PAKET B" },
    ], "paket a")).toBe(2);
    expect(countMaterialsByType([{ type: "TUGAS" }, { type: "PDF" }], "TUGAS")).toBe(1);
  });
});

describe("stats failure branches", () => {
  test("public-stats 500 saat DB gagal", async () => {
    const response = await statsServices.fetch(new Request("http://test/api/public-stats"));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ success: false });
  });

  test("dashboard-stats 500 saat DB gagal", async () => {
    const { jwt } = await import("@elysia/jwt");
    const { Elysia } = await import("elysia");
    const signer = jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! });
    const tokenApp = new Elysia()
      .use(signer)
      .get("/", ({ jwt: j }: any) =>
        j.sign({ id: 1, username: "a@t.l", role: "super_admin", name: "A", email: "a@t.l" }),
      );
    const token = await (await tokenApp.handle(new Request("http://token.test/"))).text();
    const original = console.error;
    console.error = mock(() => {});
    try {
      const response = await statsServices.fetch(
        new Request("http://test/api/dashboard-stats", {
          headers: { authorization: `Bearer ${token}` },
        }),
      );
      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ success: false });
    } finally {
      console.error = original;
    }
  });
});
