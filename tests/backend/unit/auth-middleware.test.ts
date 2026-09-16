// Uji unit untuk src/server/middleware/auth.ts — gerbang otorisasi semua
// endpoint: verifyUser (semua role), verifyAdmin (admin/super_admin),
// verifyAdminOrTutor (+ tutor), getAdminPayload (tanpa side-effect).
// jwt di-stub; tidak butuh DB/jaringan.
// Jalankan: bun run test:be:unit
import { describe, expect, test } from "bun:test";
import {
  getAdminPayload,
  verifyAdmin,
  verifyAdminOrTutor,
  verifyUser,
} from "../../../src/server/middleware/auth";

type Payload = { role: string; id: number };
const jwtFor = (payload: Payload | null) => ({
  verify: async (t: string) => (t === "valid" ? payload : null),
});
const makeSet = () => ({ status: 200 }) as { status: number };
const bearer = { authorization: "Bearer valid" };

describe("verifyUser", () => {
  test("lolos untuk role apa pun yang login", async () => {
    for (const role of ["siswa", "tutor", "admin", "super_admin"]) {
      const set = makeSet();
      const res = await verifyUser(bearer, jwtFor({ role, id: 1 }), set);
      expect(res).toBeNull();
      expect(set.status).toBe(200);
    }
  });

  test("401 bila header hilang / skema bukan Bearer / token basi", async () => {
    const cases: Record<string, string | undefined>[] = [
      {},
      { authorization: undefined },
      { authorization: "Token valid" },
      { authorization: "Bearer " },
    ];
    for (const headers of cases) {
      const set = makeSet();
      const res = await verifyUser(headers, jwtFor({ role: "admin", id: 1 }), set);
      expect(res).toMatchObject({ success: false });
      expect(set.status).toBe(401);
    }
    const set = makeSet();
    await verifyUser({ authorization: "Bearer basi" }, jwtFor({ role: "admin", id: 1 }), set);
    expect(set.status).toBe(401);
  });
});

describe("verifyAdmin", () => {
  test("lolos untuk admin dan super_admin", async () => {
    expect(await verifyAdmin(bearer, jwtFor({ role: "admin", id: 1 }), makeSet())).toBeNull();
    expect(
      await verifyAdmin(bearer, jwtFor({ role: "super_admin", id: 2 }), makeSet()),
    ).toBeNull();
  });

  test("403 untuk tutor/siswa yang login valid", async () => {
    for (const role of ["tutor", "siswa"]) {
      const set = makeSet();
      const res = await verifyAdmin(bearer, jwtFor({ role, id: 1 }), set);
      expect(res).toMatchObject({ success: false });
      expect(set.status).toBe(403);
    }
  });

  test("401 bila tanpa token atau token basi", async () => {
    const missingSet = makeSet();
    await verifyAdmin({}, jwtFor({ role: "admin", id: 1 }), missingSet);
    expect(missingSet.status).toBe(401);

    const staleSet = makeSet();
    const result = await verifyAdmin(bearer, jwtFor(null), staleSet);
    expect(staleSet.status).toBe(401);
    expect(result).toMatchObject({ success: false, message: expect.stringContaining("kedaluwarsa") });
  });
});

describe("verifyAdminOrTutor", () => {
  test("lolos untuk admin/super_admin/tutor, 403 untuk siswa", async () => {
    for (const role of ["admin", "super_admin", "tutor"]) {
      expect(
        await verifyAdminOrTutor(bearer, jwtFor({ role, id: 1 }), makeSet()),
      ).toBeNull();
    }
    const set = makeSet();
    const res = await verifyAdminOrTutor(bearer, jwtFor({ role: "siswa", id: 1 }), set);
    expect(res).toMatchObject({ success: false });
    expect(set.status).toBe(403);
  });

  test("401 bila tanpa token atau token basi", async () => {
    const missingSet = makeSet();
    await verifyAdminOrTutor({}, jwtFor({ role: "admin", id: 1 }), missingSet);
    expect(missingSet.status).toBe(401);

    const set = makeSet();
    await verifyAdminOrTutor(bearer, jwtFor(null), set);
    expect(set.status).toBe(401);
  });
});

describe("getAdminPayload", () => {
  test("mengembalikan payload tanpa menyentuh set/status", async () => {
    const payload = { role: "admin", id: 7 };
    expect(await getAdminPayload(bearer, jwtFor(payload))).toEqual(payload);
  });

  test("null bila header hilang atau token basi", async () => {
    expect(await getAdminPayload({}, jwtFor({ role: "admin", id: 1 }))).toBeNull();
    expect(
      await getAdminPayload({ authorization: "Bearer basi" }, jwtFor({ role: "admin", id: 1 })),
    ).toBeNull();
  });
});
