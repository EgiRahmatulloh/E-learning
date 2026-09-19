import { describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "students-db-failure-secret";

const boom = (): never => {
  throw new Error("fake student db down");
};

const db = {
  select: () => ({
    from: () => ({
      where: () => ({ get: boom, all: boom }),
      innerJoin: () => ({ all: boom }),
      get: boom,
      all: boom,
    }),
  }),
  insert: () => ({ values: () => ({ returning: () => ({ get: boom }), run: boom }) }),
  update: () => ({ set: () => ({ where: () => ({ returning: () => ({ get: boom }), run: boom }) }) }),
  delete: () => ({ where: () => ({ run: boom }) }),
  transaction: boom,
};

mock.module("../../../src/server/config/db.ts", () => ({ db }));

const { studentsHandlers } = await import("../../../src/server/handlers/students");

async function signedToken() {
  const { jwt } = await import("@elysia/jwt");
  const { Elysia } = await import("elysia");
  const signer = jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! });
  const helper = new Elysia()
    .use(signer)
    .get("/", ({ jwt }) =>
      jwt.sign({ id: 1, username: "admin@test.local", role: "super_admin", name: "Admin", email: "admin@test.local" }),
    );
  return (await helper.handle(new Request("http://students-failure.test/"))).text();
}

let token: string;
async function request(path: string, init: RequestInit = {}) {
  token ??= await signedToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  return studentsHandlers.fetch(new Request(`http://students-failure.test${path}`, { ...init, headers }));
}

const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

const CONTINUE_BODY = { program: "PAKET C", kelas: "PAKET C 10" };

describe("students db-failure catch branches", () => {
  test("list, create, update, delete, dan import mengembalikan 500", async () => {
    const originalError = console.error;
    console.error = mock(() => {});
    try {
      expect((await studentsHandlers.fetch(new Request("http://students-failure.test/api/public-students"))).status).toBe(500);
      expect((await request("/api/students")).status).toBe(500);
      expect((await request("/api/students", json({ nama: "Student" }))).status).toBe(500);
      expect((await request("/api/students/1", json({ nama: "Student" }, "PUT"))).status).toBe(500);
      expect((await request("/api/students/1", { method: "DELETE" })).status).toBe(500);
      expect((await request("/api/students/import", json([{ nama: "Student" }]))).status).toBe(500);
      expect((await request("/api/students/import/update", json([{ nama: "Student", nik: "NIK-1" }]))).status).toBe(500);
    } finally {
      console.error = originalError;
    }
  });

  test("promote, graduate, continue, dan semua bulk route mengembalikan 500", async () => {
    expect((await request("/api/students/1/promote", { method: "POST" })).status).toBe(500);
    expect((await request("/api/students/1/graduate", { method: "POST" })).status).toBe(500);
    expect((await request("/api/students/1/continue", json(CONTINUE_BODY))).status).toBe(500);
    expect((await request("/api/students/bulk/promote", json({ studentIds: [1] }))).status).toBe(500);
    expect((await request("/api/students/bulk/graduate", json({ studentIds: [1] }))).status).toBe(500);
    expect((await request("/api/students/bulk/continue", json({ studentIds: [1], ...CONTINUE_BODY }))).status).toBe(500);
  });
});
