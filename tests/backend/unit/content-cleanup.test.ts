import { beforeEach, describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "content-cleanup-secret";

type Row = Record<string, unknown> | undefined;
const selected: Row[] = [];
const updated: Row[] = [];
const deleted: unknown[] = [];

const db = {
  select: () => ({
    from: () => ({
      where: () => ({ get: () => selected.shift(), all: () => selected.shift() ?? [] }),
      get: () => selected.shift(),
      all: () => selected.shift() ?? [],
    }),
  }),
  update: () => ({
    set: () => ({
      where: () => ({ returning: () => ({ get: () => updated.shift() }) }),
    }),
  }),
  delete: () => ({
    where: () => ({ run: () => deleted.push(true) }),
  }),
};

const replacedCalls: unknown[][] = [];
const rowCalls: unknown[][] = [];
mock.module("../../../src/server/config/db.ts", () => ({ db }));
mock.module("../../../src/server/services/storage.ts", () => ({
  cleanupReplacedFiles: (...args: unknown[]) => replacedCalls.push(args),
  cleanupRowFiles: (...args: unknown[]) => rowCalls.push(args),
}));

const { contentHandlers } = await import("../../../src/server/handlers/content");

async function token() {
  const { jwt } = await import("@elysia/jwt");
  const { Elysia } = await import("elysia");
  const app = new Elysia()
    .use(jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! }))
    .get("/", ({ jwt: signer }: any) => signer.sign({
      id: 1,
      username: "admin@test.local",
      role: "super_admin",
      name: "Admin",
      email: "admin@test.local",
    }));
  return (await app.handle(new Request("http://token.test/"))).text();
}

let adminToken: string;
async function call(path: string, method: string, body?: unknown) {
  adminToken ??= await token();
  const headers = new Headers({ authorization: `Bearer ${adminToken}` });
  if (body !== undefined) headers.set("content-type", "application/json");
  return contentHandlers.fetch(new Request(`http://content.test${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
}

const alumni = (foto: string) => ({
  nama: "Alumni", nik: "1", program: "C", tahunLulus: "2026", nisn: "", nis: "",
  tempatTglLahir: "", noHp: "", namaAyah: "", namaIbu: "", jenisKelamin: "L",
  agama: "", email: "", alamat: "", rt: "", rw: "", desa: "", kecamatan: "",
  kabupaten: "", provinsi: "", melanjutkanKe: "", pekerjaan: "", cerita: "", foto,
});

beforeEach(() => {
  selected.length = 0;
  updated.length = 0;
  deleted.length = 0;
  replacedCalls.length = 0;
  rowCalls.length = 0;
});

describe("content storage cleanup integration", () => {
  test("slider replacement and deletion pass persisted rows to cleanup", async () => {
    const before = { id: 1, title: "Old", image: "/api/files/old.png", status: "AKTIF" };
    const after = { ...before, title: "New", image: "/api/files/new.png" };
    selected.push(before);
    updated.push(after);
    expect((await call("/api/sliders/1", "PUT", {
      title: "New", image: "/api/files/new.png", status: "AKTIF",
    })).status).toBe(200);
    expect(replacedCalls).toEqual([[before, after, ["image"]]]);

    selected.push(after);
    expect((await call("/api/sliders/1", "DELETE")).status).toBe(200);
    expect(rowCalls).toEqual([[after, ["image"]]]);
    expect(deleted).toHaveLength(1);
  });

  test("alumni replacement retains a photo still referenced by a student", async () => {
    const shared = "/api/files/shared.png";
    const before = { id: 2, ...alumni(shared), berkas: { kk: "/api/files/old.pdf" } };
    const after = { ...before, ...alumni("/api/files/new.png") };
    selected.push(before, { foto: shared });
    updated.push(after);

    expect((await call("/api/alumni/2", "PUT", alumni("/api/files/new.png"))).status).toBe(200);
    expect(replacedCalls).toEqual([
      [before, after, ["foto", "berkas"], { keep: [shared] }],
    ]);
  });

  test("alumni deletion retains a shared student photo", async () => {
    const shared = "/api/files/shared-delete.png";
    const before = { id: 3, ...alumni(shared), berkas: {} };
    selected.push(before, { foto: shared });

    expect((await call("/api/alumni/3", "DELETE")).status).toBe(200);
    expect(rowCalls).toEqual([
      [before, ["foto", "berkas"], { keep: [shared] }],
    ]);
    expect(deleted).toHaveLength(1);
  });
});
