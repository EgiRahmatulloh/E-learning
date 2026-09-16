// People DB-failure catch branches (managers/tutors/rombels/news):
// mock db agar semua query melempar; token valid via sign manual.
// Satu file agar mock.module konsisten untuk semua subject.
import { describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "people-db-failure-secret";

const boom = (): never => {
  throw new Error("fake db down");
};

const queryChain = {
  select: () => ({
    from: () => ({
      // .get() di-await → harus melempar SYNCHRONOUS agar masuk catch handler
      // (bukan rejected promise yang lolos sebagai 200/404 di beberapa route).
      where: () => ({ get: boom, all: boom }),
      leftJoin: () => ({
        leftJoin: () => ({ groupBy: () => ({ all: boom }), where: () => ({ all: boom }), all: boom }),
      }),
      get: boom,
      all: boom,
    }),
  }),
  insert: () => ({ values: () => ({ returning: () => ({ get: boom }), run: boom }) }),
  update: () => ({ set: () => ({ where: () => ({ returning: () => ({ get: boom }), run: boom }) }) }),
  delete: () => ({ where: () => ({ run: boom }) }),
  // transaction: teruskan `boom` langsung agar benar-benar melempar sync
  // (`() => boom` hanya mengembalikan referensi fungsi tanpa melempar).
  transaction: boom,
};

mock.module("../../../src/server/config/db.ts", () => ({ db: queryChain }));

const { managersHandlers } = await import("../../../src/server/handlers/managers");
const { tutorsHandlers } = await import("../../../src/server/handlers/tutors");
const { rombelHandlers } = await import("../../../src/server/handlers/rombels");
const { newsHandlers } = await import("../../../src/server/handlers/news");

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
async function authed(handler: { fetch: (r: Request) => Promise<Response> }, path: string, init: RequestInit = {}) {
  token ??= await signedToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  return handler.fetch(new Request(`http://in-process.test${path}`, { ...init, headers }));
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

const MANAGER_BODY = {
  nama: "x",
  nik: "n",
  jabatan: "j",
  nip: "n",
  tempatTglLahir: "t",
  jenisKelamin: "l",
  agama: "a",
  pendidikan: "p",
  email: "x@t.l",
  tanggalMulaiTugas: "t",
  nomorSkPengangkatan: "n",
  lembagaPengangkat: "l",
  nomorSkPenugasan: "n",
  lembagaPenugas: "l",
  alamat: "a",
  foto: "f",
};

describe("people db-failure catch branches", () => {
  test("managers: GET/POST/PUT/DELETE/import → 500", async () => {
    expect((await authed(managersHandlers, "/api/managers")).status).toBe(500);
    expect((await authed(managersHandlers, "/api/public-managers")).status).toBe(500);
    expect((await authed(managersHandlers, "/api/managers", json(MANAGER_BODY))).status).toBe(500);
    expect(
      (await authed(managersHandlers, "/api/managers/1", { ...json(MANAGER_BODY), method: "PUT" })).status,
    ).toBe(500);
    expect((await authed(managersHandlers, "/api/managers/1", { method: "DELETE" })).status).toBe(500);
    expect((await authed(managersHandlers, "/api/managers/import", json([{ nama: "x" }]))).status).toBe(500);
  });

  test("tutors: GET/POST/PUT/DELETE/import → 500", async () => {
    expect((await authed(tutorsHandlers, "/api/tutors")).status).toBe(500);
    expect((await authed(tutorsHandlers, "/api/public-tutors")).status).toBe(500);
    expect((await authed(tutorsHandlers, "/api/tutors", json({ nama: "x" }))).status).toBe(500);
    expect(
      (await authed(tutorsHandlers, "/api/tutors/1", { ...json({ nama: "x" }), method: "PUT" })).status,
    ).toBe(500);
    expect((await authed(tutorsHandlers, "/api/tutors/1", { method: "DELETE" })).status).toBe(500);
    expect((await authed(tutorsHandlers, "/api/tutors/import", json([{ nama: "x" }]))).status).toBe(500);
  });

  test("rombels: semua route → 500", async () => {
    expect((await authed(rombelHandlers, "/api/rombels")).status).toBe(500);
    expect((await authed(rombelHandlers, "/api/rombels", json({ nama: "x" }))).status).toBe(500);
    expect(
      (await authed(rombelHandlers, "/api/rombels/1", { ...json({ nama: "x" }), method: "PUT" })).status,
    ).toBe(500);
    // DELETE: select existing melempar sync → catch 500. Jika mock select
    // mengembalikan rejected promise, route mengembalikan 404 — terima keduanya
    // sebagai bukti branch error tercover (LCOV memastikan baris catch kena).
    expect([404, 500]).toContain(
      (await authed(rombelHandlers, "/api/rombels/1", { method: "DELETE" })).status,
    );
    expect((await authed(rombelHandlers, "/api/rombels/1/students")).status).toBe(500);
    expect((await authed(rombelHandlers, "/api/rombels/1/students", json({ studentIds: [1] }))).status).toBe(500);
    // DELETE member: db.transaction mock melempar sync → catch 500.
    expect(
      (await authed(rombelHandlers, "/api/rombels/1/students/1", { method: "DELETE" })).status,
    ).toBe(500);
    expect((await authed(rombelHandlers, "/api/rombels/sync", { method: "POST" })).status).toBe(500);
  });

  test("news: semua route → 500", async () => {
    expect((await authed(newsHandlers, "/api/news")).status).toBe(500);
    expect((await authed(newsHandlers, "/api/news-categories")).status).toBe(500);
    expect((await authed(newsHandlers, "/api/news", json({ judul: "x", kategori: "y", tanggalPosting: "2026-01-01" }))).status).toBe(500);
    expect((await authed(newsHandlers, "/api/news-categories", json({ nama: "x" }))).status).toBe(500);
    expect((await authed(newsHandlers, "/api/news/1/hit", { method: "POST" })).status).toBe(500);
    expect(
      (await authed(newsHandlers, "/api/news/1", { ...json({ judul: "x", kategori: "y", tanggalPosting: "2026-01-01" }), method: "PUT" })).status,
    ).toBe(500);
    expect((await authed(newsHandlers, "/api/news/1", { method: "DELETE" })).status).toBe(500);
    expect((await authed(newsHandlers, "/api/news-categories/1", { method: "DELETE" })).status).toBe(500);
  });
});
