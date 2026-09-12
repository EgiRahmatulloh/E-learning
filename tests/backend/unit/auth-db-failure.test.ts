// Auth DB-failure catch branches (129-130, 284-286, 547-548, 643-644):
// mock db agar SEMUA query melempar, lalu panggil authHandlers.fetch dengan
// token valid. Satu-satunya cara mencapai catch tanpa merusak DB asli.
// mock.module HARUS sebelum import subject — file ini terisolasi.
import { describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "auth-db-failure-secret";

const boom = () => {
  throw new Error("fake db down");
};

mock.module("../../../src/server/config/db.ts", () => ({
  db: {
    select: () => ({ from: () => ({ where: () => ({ get: boom, all: boom }), get: boom, all: boom }) }),
    insert: () => ({ values: () => ({ returning: () => ({ get: boom }) }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => ({ get: boom }) }) }) }),
    delete: () => ({ where: () => ({ run: boom }) }),
  },
}));

const { authHandlers } = await import("../../../src/server/handlers/auth");

async function signedToken() {
  const { jwt } = await import("@elysia/jwt");
  const { Elysia } = await import("elysia");
  const signer = (
    jwt as unknown as (opts: Record<string, unknown>) => { sign: (p: unknown) => Promise<string> }
  )({ name: "jwt", secret: Bun.env.JWT_SECRET! });
  const helper = new Elysia()
    .use(signer as never)
    .get("/", ({ jwt: j }: { jwt: { sign: (p: unknown) => Promise<string> } }) =>
      j.sign({ id: 1, username: "a@t.l", role: "super_admin", name: "A", email: "a@t.l" }),
    );
  return (await helper.handle(new Request("http://in-process.test/"))).text();
}

let token: string;
async function authFetch(path: string, init: RequestInit = {}) {
  token ??= await signedToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  return authHandlers.fetch(new Request(`http://in-process.test${path}`, { ...init, headers }));
}

describe("auth db-failure catch branches", () => {
  test("login 500 saat DB down", async () => {
    const res = await authHandlers.fetch(
      new Request("http://in-process.test/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "x@y.z", password: "pw" }),
      }),
    );
    expect(res.status).toBe(500);
  });

  test("/me 500 saat DB down", async () => {
    expect((await authFetch("/api/auth/me")).status).toBe(500);
  });

  test("update-profile 500 saat DB down", async () => {
    const res = await authFetch("/api/auth/update-profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "x" }),
    });
    expect(res.status).toBe(500);
  });

  test("reset-password 500 saat DB down", async () => {
    const res = await authFetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetRole: "siswa", targetId: 1, newPassword: "x123456" }),
    });
    expect(res.status).toBe(500);
  });
});
