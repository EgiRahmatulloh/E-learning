import { beforeAll, describe, expect, test } from "bun:test";
import { api, login } from "../helpers/in-process-app";
import {
  assignStudent,
  createManager,
  createRombel,
  createStudent,
  createTutor,
} from "../helpers/db-fixtures";

let adminToken: string;

beforeAll(async () => {
  const admin = await createManager({ plainPassword: "people-admin" });
  adminToken = await login(admin.email, "people-admin");
});

describe("people and rombels", () => {
  test("public people endpoints tidak membocorkan password", async () => {
    await createManager({
      nik: "manager-profile",
      password: "hash-secret",
      alamat: "Jl. Mawar",
      rt: "01",
      rw: "02",
      desa: "Sukamaju",
      kecamatan: "Ciamis",
      kabupaten: "Ciamis",
      provinsi: "Jawa Barat",
    });
    await createManager({ alamat: "Jl. Melati", rt: "03", rw: "" });
    await createManager({ alamat: "Jl. Anggrek", rt: "", rw: "04" });
    await createTutor({ nik: "tutor-profile", password: "hash-secret" });

    for (const path of ["/api/public-managers", "/api/public-tutors"]) {
      const { response, data } = await api<any>(path);
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      const serialized = JSON.stringify(data);
      expect(serialized).not.toContain("hash-secret");
      expect(data.data.every((item: any) => item.password === undefined)).toBe(true);
    }
  });

  test("route admin menolak request tanpa token", async () => {
    for (const path of ["/api/managers", "/api/tutors", "/api/rombels"]) {
      const result = await api<any>(path);
      expect(result.response.status).toBe(401);
    }
  });

  test("news category dan berita mencakup CRUD, hit, dan fallback update", async () => {
    const category = await api<any>("/api/news-categories", {
      method: "POST",
      token: adminToken,
      json: { nama: "Kategori People Test" },
    });
    expect(category.response.status).toBe(200);
    expect((await api<any>("/api/news-categories")).data.data).toContainEqual(category.data.data);

    const created = await api<any>("/api/news", {
      method: "POST",
      token: adminToken,
      json: {
        judul: "Berita People Test",
        kategori: "Kategori People Test",
        tanggalPosting: "2026-09-12",
        status: "PUBLISH",
        foto: "[]",
        konten: "Konten awal",
      },
    });
    expect(created.response.status).toBe(200);
    const newsId = created.data.data.id;
    expect((await api<any>("/api/news")).data.data.some((item: any) => item.id === newsId)).toBe(true);

    expect((await api("/api/news/nope/hit", { method: "POST" })).response.status).toBe(400);
    expect((await api("/api/news/999999/hit", { method: "POST" })).response.status).toBe(404);
    const hit = await api<any>(`/api/news/${newsId}/hit`, { method: "POST" });
    expect(hit.response.status).toBe(200);
    expect(hit.data.data.hits).toBe(1);

    expect((await api("/api/news-categories/nope", { method: "DELETE", token: adminToken })).response.status).toBe(400);
    expect(
      (
        await api("/api/news/nope", {
          method: "PUT",
          token: adminToken,
          json: { judul: "x", kategori: "y", tanggalPosting: "2026-01-01" },
        })
      ).response.status,
    ).toBe(400);
    expect((await api("/api/news/nope", { method: "DELETE", token: adminToken })).response.status).toBe(400);
    expect(
      (
        await api("/api/news/999999", {
          method: "PUT",
          token: adminToken,
          json: { judul: "x", kategori: "y", tanggalPosting: "2026-01-01" },
        })
      ).response.status,
    ).toBe(404);

    const updated = await api<any>(`/api/news/${newsId}`, {
      method: "PUT",
      token: adminToken,
      json: {
        judul: "Berita People Update",
        kategori: "Kategori People Test",
        tanggalPosting: "2026-09-13",
        status: "DRAFT",
        foto: '[]',
        konten: "Konten baru",
      },
    });
    expect(updated.response.status).toBe(200);
    const kept = await api<any>(`/api/news/${newsId}`, {
      method: "PUT",
      token: adminToken,
      json: {
        judul: "Berita People Update 2",
        kategori: "Kategori People Test",
        tanggalPosting: "2026-09-14",
      },
    });
    expect(kept.response.status).toBe(200);
    expect(kept.data.data.status).toBe("DRAFT");
    expect(kept.data.data.konten).toBe("Konten baru");

    expect((await api(`/api/news/${newsId}`, { method: "DELETE", token: adminToken })).response.status).toBe(200);
    expect(
      (await api(`/api/news-categories/${category.data.data.id}`, { method: "DELETE", token: adminToken })).response.status,
    ).toBe(200);
  });

  test("membuat, membaca, mengubah, dan menghapus rombel", async () => {
    const created = await api<any>("/api/rombels", {
      method: "POST",
      token: adminToken,
      json: { nama: "PAKET B 8 TEST" },
    });
    expect(created.response.status).toBe(200);
    expect(created.data.data.nama).toBe("PAKET B 8 TEST");
    const id = created.data.data.id;

    const duplicate = await api<any>("/api/rombels", {
      method: "POST",
      token: adminToken,
      json: { nama: "PAKET B 8 TEST" },
    });
    expect(duplicate.response.status).toBe(400);

    const updated = await api<any>(`/api/rombels/${id}`, {
      method: "PUT",
      token: adminToken,
      json: { nama: "PAKET B 9 TEST", waliKelasId: null },
    });
    expect(updated.response.status).toBe(200);
    expect(updated.data.data.nama).toBe("PAKET B 9 TEST");

    const removed = await api<any>(`/api/rombels/${id}`, {
      method: "DELETE",
      token: adminToken,
    });
    expect(removed.response.status).toBe(200);
  });

  test("membership rombel menyinkronkan kelas/program siswa", async () => {
    const student = await createStudent({ kelas: "", program: "" });
    const rombel = await createRombel({ nama: "PAKET A 4 Z" });
    const result = await api<any>(`/api/rombels/${rombel.id}/students`, {
      method: "POST",
      token: adminToken,
      json: { studentIds: [student.id] },
    });
    expect(result.response.status).toBe(200);
    expect(result.data.added).toBe(1);

    const list = await api<any>("/api/students", { token: adminToken });
    const updated = list.data.data.find((item: any) => item.id === student.id);
    expect(updated.kelas).toBe("PAKET A 4 Z");
    expect(updated.program).toBe("PAKET A");
  });

  test("sync membangun relasi dari field kelas", async () => {
    const student = await createStudent({ kelas: "paket c 11 sync", program: "" });
    const result = await api<any>("/api/rombels/sync", {
      method: "POST",
      token: adminToken,
    });
    expect(result.response.status).toBe(200);
    expect(result.data.assigned).toBeGreaterThanOrEqual(1);

    const list = await api<any>("/api/students", { token: adminToken });
    const synced = list.data.data.find((item: any) => item.id === student.id);
    expect(synced.kelas).toBe("paket c 11 sync");
    expect(synced.program).toBe("PAKET C");
  });

  test("rombel PUT/DELETE matrix: 400/404/duplikat/rename-cascade", async () => {
    expect((await api("/api/rombels/nope", { method: "PUT", token: adminToken, json: {} })).response.status).toBe(400);
    expect((await api("/api/rombels/nope", { method: "DELETE", token: adminToken })).response.status).toBe(400);
    expect(
      (await api("/api/rombels/999999", { method: "PUT", token: adminToken, json: { nama: "X" } })).response.status,
    ).toBe(404);
    expect((await api("/api/rombels/999999", { method: "DELETE", token: adminToken })).response.status).toBe(404);

    const a = await api<any>("/api/rombels", { method: "POST", token: adminToken, json: { nama: "PAKET C 10 R1" } });
    const b = await api<any>("/api/rombels", { method: "POST", token: adminToken, json: { nama: "PAKET C 10 R2" } });
    // Rename ke nama yang sudah ada → 400 duplikat
    expect(
      (
        await api(`/api/rombels/${a.data.data.id}`, {
          method: "PUT",
          token: adminToken,
          json: { nama: "PAKET C 10 R2" },
        })
      ).response.status,
    ).toBe(400);
    // Rename cascade: siswa + setup mengikuti nama baru
    const student = await createStudent({ kelas: "PAKET C 10 R1", program: "PAKET C" });
    const renamed = await api<any>(`/api/rombels/${a.data.data.id}`, {
      method: "PUT",
      token: adminToken,
      json: { nama: "PAKET C 10 R1B" },
    });
    expect(renamed.response.status).toBe(200);
    const { db } = await import("../helpers/in-process-app");
    const { students } = await import("../../../src/server/models");
    const { eq } = await import("drizzle-orm");
    const after = await db.select().from(students).where(eq(students.id, student.id)).get();
    expect(after?.kelas).toBe("PAKET C 10 R1B");

    // DELETE rombel mengosongkan kelas siswa
    expect((await api(`/api/rombels/${a.data.data.id}`, { method: "DELETE", token: adminToken })).response.status).toBe(200);
    const cleared = await db.select().from(students).where(eq(students.id, student.id)).get();
    expect(cleared?.kelas).toBe("");
    expect((await api(`/api/rombels/${b.data.data.id}`, { method: "DELETE", token: adminToken })).response.status).toBe(200);
  });

  test("rombel students matrix: list, tambah, duplikat, kosong, hapus", async () => {
    const rombel = await createRombel({ nama: "PAKET B 8 MX" });
    expect((await api(`/api/rombels/nope/students`, { token: adminToken })).response.status).toBe(400);
    expect((await api(`/api/rombels/999999/students`, { token: adminToken })).response.status).toBe(404);
    expect(
      (
        await api(`/api/rombels/${rombel.id}/students`, {
          method: "POST",
          token: adminToken,
          json: {},
        })
      ).response.status,
    ).toBe(400);
    expect(
      (await api(`/api/rombels/nope/students`, { method: "POST", token: adminToken, json: {} })).response.status,
    ).toBe(400);
    expect(
      (
        await api(`/api/rombels/999999/students`, {
          method: "POST",
          token: adminToken,
          json: { studentIds: [1] },
        })
      ).response.status,
    ).toBe(404);

    const s1 = await createStudent({ kelas: "", program: "" });
    const s2 = await createStudent({ kelas: "", program: "" });
    // Rombel non-paket → deriveProgramFromKelas "" → spread kosong (cabang else)
    const nonPaket = await createRombel({ nama: "KELAS KHUSUS NP" });
    const np = await api<any>(`/api/rombels/${nonPaket.id}/students`, {
      method: "POST",
      token: adminToken,
      json: { studentId: s1.id },
    });
    expect(np.response.status).toBe(200);
    // studentId tunggal (bukan array)
    const single = await api<any>(`/api/rombels/${rombel.id}/students`, {
      method: "POST",
      token: adminToken,
      json: { studentId: s1.id },
    });
    expect(single.response.status).toBe(200);
    expect(single.data.added).toBe(1);
    // tambah via array + relasi lama ke rombel lain dibersihkan
    const other = await createRombel({ nama: "PAKET B 8 OT" });
    await assignStudent(other.id, s2.id);
    const added = await api<any>(`/api/rombels/${rombel.id}/students`, {
      method: "POST",
      token: adminToken,
      json: { studentIds: [s1.id, s2.id] },
    });
    expect(added.response.status).toBe(200);
    expect(added.data.added).toBe(1);
    // semua sudah ada → added 0
    const dup = await api<any>(`/api/rombels/${rombel.id}/students`, {
      method: "POST",
      token: adminToken,
      json: { studentIds: [s1.id, s2.id] },
    });
    expect(dup.data.added).toBe(0);

    const list = await api<any>(`/api/rombels/${rombel.id}/students`, { token: adminToken });
    expect(list.response.status).toBe(200);
    expect(list.data.data.length).toBe(2);

    // Hapus satu siswa dari rombel
    expect(
      (await api(`/api/rombels/${rombel.id}/students/${s1.id}`, { method: "DELETE", token: adminToken })).response
        .status,
    ).toBe(200);
    expect(
      (await api(`/api/rombels/nope/students/1`, { method: "DELETE", token: adminToken })).response.status,
    ).toBe(400);
  });

  test("managers CRUD: create/update/delete + password hashing", async () => {
    const email = `mgr-${Date.now()}@test.local`;
    const body = {
      nama: "Manager CRUD",
      nik: "NIK-CRUD",
      jabatan: "Sekretaris",
      nip: "-",
      tempatTglLahir: "Ciamis",
      jenisKelamin: "Laki-laki",
      agama: "Islam",
      pendidikan: "S1",
      email,
      tanggalMulaiTugas: "2020-01-01",
      nomorSkPengangkatan: "-",
      lembagaPengangkat: "Diknas",
      nomorSkPenugasan: "-",
      lembagaPenugas: "PKBM",
      alamat: "Jl. Test",
      foto: "",
      password: "mgr-pass-123",
    };
    const created = await api<any>("/api/managers", { method: "POST", token: adminToken, json: body });
    expect(created.response.status).toBe(200);
    expect(created.data.data.password).toBeUndefined();
    const id = created.data.data.id;
    // Password ter-hash: bisa login
    expect(await login(email, "mgr-pass-123")).toBeString();

    const updated = await api<any>(`/api/managers/${id}`, {
      method: "PUT",
      token: adminToken,
      json: { ...body, nama: "Manager Update", password: "mgr-new-456" },
    });
    expect(updated.response.status).toBe(200);
    expect(await login(email, "mgr-new-456")).toBeString();

    expect((await api(`/api/managers/nope`, { method: "PUT", token: adminToken, json: body })).response.status).toBe(400);
    expect((await api(`/api/managers/999999`, { method: "PUT", token: adminToken, json: body })).response.status).toBe(404);
    expect((await api(`/api/managers/nope`, { method: "DELETE", token: adminToken })).response.status).toBe(400);

    const list = await api<any>("/api/managers", { token: adminToken });
    expect(list.data.data.every((m: any) => m.password === undefined)).toBe(true);

    expect((await api(`/api/managers/${id}`, { method: "DELETE", token: adminToken })).response.status).toBe(200);
  });

  test("managers import: validasi, dedup, kosong", async () => {
    expect(
      (await api("/api/managers/import", { method: "POST", token: adminToken, json: { nama: "x" } })).response.status,
    ).toBe(422);
    expect(
      (await api("/api/managers/import", { method: "POST", token: adminToken, json: [] })).response.status,
    ).toBe(400);
    const prefix = `MGR-${Date.now()}`;
    const ok = await api<any>("/api/managers/import", {
      method: "POST",
      token: adminToken,
      json: [
        { nama: `${prefix}-A` },
        { nama: `${prefix}-B`, email: `${prefix}@t.l`, Password: "LegacyPass123!" },
      ],
    });
    expect(ok.response.status).toBe(200);
    expect(ok.data.imported).toBe(2);
    // Import ulang nama sama (tanpa NIK/email) → masuk lagi (dedup hanya NIK/email)
    const dupe = await api<any>("/api/managers/import", {
      method: "POST",
      token: adminToken,
      json: [{ nama: `${prefix}-A`, email: `${prefix}@t.l` }],
    });
    expect(dupe.response.status).toBe(400);
    expect(dupe.data.message).toContain("duplikat");
    // Bersihkan via DELETE per baris
    const list = await api<any>("/api/managers", { token: adminToken });
    for (const row of list.data.data.filter((m: any) => m.nama.startsWith(prefix))) {
      await api(`/api/managers/${row.id}`, { method: "DELETE", token: adminToken });
    }
  });

  test("tutors CRUD: create/update/delete + import", async () => {
    const created = await api<any>("/api/tutors", {
      method: "POST",
      token: adminToken,
      json: { nama: "Tutor CRUD", email: `tutor-${Date.now()}@test.local` },
    });
    expect(created.response.status).toBe(200);
    const id = created.data.data.id;

    // Tutor view (non-admin) meredaksi field sensitif
    const tutorUser = await createTutor({ plainPassword: "view-pw" });
    const tutorToken = await login(tutorUser.email, "view-pw");
    const listAsTutor = await api<any>("/api/tutors", { token: tutorToken });
    const rowAsTutor = listAsTutor.data.data.find((t: any) => t.id === id);
    expect(rowAsTutor?.nik).toBeUndefined();
    expect(rowAsTutor?.email).toBeUndefined();

    const updated = await api<any>(`/api/tutors/${id}`, {
      method: "PUT",
      token: adminToken,
      json: { nama: "Tutor Update", password: "new-pw" },
    });
    expect(updated.response.status).toBe(200);
    expect((await api(`/api/tutors/nope`, { method: "PUT", token: adminToken, json: { nama: "x" } })).response.status).toBe(400);
    expect((await api(`/api/tutors/999999`, { method: "PUT", token: adminToken, json: { nama: "Ada" } })).response.status).toBe(404);
    expect((await api(`/api/tutors/nope`, { method: "DELETE", token: adminToken })).response.status).toBe(400);

    const imp = await api<any>("/api/tutors/import", {
      method: "POST",
      token: adminToken,
      json: [
        { nama: `TIMP-${Date.now()}-A` },
        { nama: `TIMP-${Date.now()}-B`, Password: "LegacyTutorPass123!" },
      ],
    });
    expect(imp.response.status).toBe(200);
    expect(
      (await api("/api/tutors/import", { method: "POST", token: adminToken, json: [] })).response.status,
    ).toBe(400);

    expect((await api(`/api/tutors/${id}`, { method: "DELETE", token: adminToken })).response.status).toBe(200);
    const { db } = await import("../helpers/in-process-app");
    const { tutors } = await import("../../../src/server/models");
    const { like } = await import("drizzle-orm");
    const leftovers = await db.select().from(tutors).where(like(tutors.nama, "TIMP-%")).all();
    for (const t of leftovers) {
      await api(`/api/tutors/${t.id}`, { method: "DELETE", token: adminToken });
    }
    const { eq } = await import("drizzle-orm");
    await db.delete(tutors).where(eq(tutors.id, tutorUser.id)).run();
  });

  test("tutor admin view, import non-array, duplikat-penuh", async () => {
    // Admin view: field sensitif tetap ada
    const listAsAdmin = await api<any>("/api/tutors", { token: adminToken });
    expect(listAsAdmin.data.data[0]?.email).toBeDefined();

    // Import non-array → 400 baris 374-375 (bukan 422 skema bila content-type text?)
    const nonArray = await api<any>("/api/tutors/import", {
      method: "POST",
      token: adminToken,
      json: { nama: "x" },
    });
    expect([400, 422]).toContain(nonArray.response.status);

    // Semua duplikat → 400 baris 416-417
    const email = `dupe-${Date.now()}@test.local`;
    await api("/api/tutors/import", {
      method: "POST",
      token: adminToken,
      json: [{ nama: "Dupe", email }],
    });
    const allDupe = await api<any>("/api/tutors/import", {
      method: "POST",
      token: adminToken,
      json: [{ nama: "Dupe2", email }],
    });
    expect(allDupe.response.status).toBe(400);
    expect(allDupe.data.message).toContain("duplikat");
    const { db } = await import("../helpers/in-process-app");
    const { tutors } = await import("../../../src/server/models");
    const { eq } = await import("drizzle-orm");
    const created = await db.select().from(tutors).where(eq(tutors.email, email)).get();
    if (created) await db.delete(tutors).where(eq(tutors.id, created.id)).run();
  });

  test("managers import non-array + rombel nama kosong + sync kosong", async () => {
    const nonArray = await api<any>("/api/managers/import", {
      method: "POST",
      token: adminToken,
      json: { nama: "x" },
    });
    expect([400, 422]).toContain(nonArray.response.status);

    // POST rombel nama kosong → 400 baris 90-91
    expect(
      (await api("/api/rombels", { method: "POST", token: adminToken, json: { nama: "  " } })).response.status,
    ).toBe(400);
  });

  test("sync kosong tanpa siswa berkelas + hapus relasi inaktif", async () => {
    const { db } = await import("../helpers/in-process-app");
    const { students, rombels } = await import("../../../src/server/models");
    const { ne, eq } = await import("drizzle-orm");
    // Simpan kelas semua siswa AKTIF sementara agar sync melihat DB kosong
    const allActive = await db.select().from(students).where(eq(students.status, "AKTIF")).all();
    const saved = new Map(allActive.map((s: any) => [s.id, s.kelas]));
    for (const s of allActive) {
      await db.update(students).set({ kelas: "" }).where(eq(students.id, s.id)).run();
    }
    try {
      const empty = await api<any>("/api/rombels/sync", { method: "POST", token: adminToken });
      expect(empty.response.status).toBe(200);
      expect(empty.data.created).toBe(0);
      expect(empty.data.assigned).toBe(0);
    } finally {
      for (const [id, kelas] of saved) {
        await db.update(students).set({ kelas }).where(eq(students.id, id)).run();
      }
    }
    void ne;
    void rombels;

    // Siswa LULUS dengan relasi → sync membersihkan relasi inaktif (517-518)
    const graduate = await createStudent({ kelas: "PAKET C 12 SYNC", program: "PAKET C", status: "AKTIF" });
    const gr = await createRombel({ nama: "PAKET C 12 SYNC" });
    await assignStudent(gr.id, graduate.id);
    await db.update(students).set({ status: "LULUS" }).where(eq(students.id, graduate.id)).run();
    const synced = await api<any>("/api/rombels/sync", { method: "POST", token: adminToken });
    expect(synced.response.status).toBe(200);
  });

  test("sync kosong dan wali-kelas join", async () => {
    const tutor = await createTutor({ nama: "Wali Test" });
    const withWali = await api<any>("/api/rombels", {
      method: "POST",
      token: adminToken,
      json: { nama: "PAKET A 1 W", waliKelasId: tutor.id },
    });
    expect(withWali.response.status).toBe(200);
    const list = await api<any>("/api/rombels", { token: adminToken });
    const row = list.data.data.find((item: any) => item.id === withWali.data.data.id);
    expect(row?.waliKelas?.nama).toBe("Wali Test");
    expect((await api(`/api/rombels/${withWali.data.data.id}`, { method: "DELETE", token: adminToken })).response.status).toBe(200);
  });

  test("import chunked >100 baris menutup loop chunk kedua", async () => {
    // Loop `for (i += chunkSize)` hanya mencapai iterasi kedua bila
    // insertValues.length > 100 — import 105 baris valid sekaligus.
    const stamp = Date.now();
    const rows = Array.from({ length: 105 }, (_, i) => ({ nama: `CHUNK-${stamp}-${i}` }));
    const res = await api<any>("/api/managers/import", { method: "POST", token: adminToken, json: rows });
    expect(res.response.status).toBe(200);
    expect(res.data.imported).toBe(105);
    const { db } = await import("../helpers/in-process-app");
    const { managers } = await import("../../../src/server/models");
    const { like } = await import("drizzle-orm");
    const created = await db.select().from(managers).where(like(managers.nama, `CHUNK-${stamp}-%`)).all();
    expect(created.length).toBe(105);
    const { eq } = await import("drizzle-orm");
    for (const row of created) {
      await api(`/api/managers/${row.id}`, { method: "DELETE", token: adminToken });
    }
    void eq;

    const trows = Array.from({ length: 101 }, (_, i) => ({ nama: `TCHUNK-${stamp}-${i}` }));
    const tres = await api<any>("/api/tutors/import", { method: "POST", token: adminToken, json: trows });
    expect(tres.response.status).toBe(200);
    expect(tres.data.imported).toBe(101);
    const { tutors } = await import("../../../src/server/models");
    const tcreated = await db.select().from(tutors).where(like(tutors.nama, `TCHUNK-${stamp}-%`)).all();
    for (const t of tcreated) {
      await api(`/api/tutors/${t.id}`, { method: "DELETE", token: adminToken });
    }
  });

  test("catch DELETE member rombel", async () => {
    // Catch DELETE member: transaction melempar sinkron.
    const { db } = await import("../helpers/in-process-app");
    const { rombelStudents } = await import("../../../src/server/models");
    const { eq } = await import("drizzle-orm");
    const student = await createStudent({ kelas: "PAKET C 10 DEL", program: "PAKET C" });
    const rombel = await createRombel({ nama: "PAKET C 10 DEL" });
    await assignStudent(rombel.id, student.id);
    const failingTx = (db as unknown as { transaction: unknown }).transaction;
    (db as unknown as { transaction: unknown }).transaction = () => {
      throw new Error("fake tx failure");
    };
    try {
      const res = await api(`/api/rombels/${rombel.id}/students/${student.id}`, {
        method: "DELETE",
        token: adminToken,
      });
      expect(res.response.status).toBe(500);
    } finally {
      (db as unknown as { transaction: unknown }).transaction = failingTx;
    }
    await db.delete(rombelStudents).where(eq(rombelStudents.rombelId, rombel.id)).run();
  });

  test("catch POST rombel via insert gagal sync", async () => {
    const { db } = await import("../helpers/in-process-app");
    const { rombels } = await import("../../../src/server/models");
    const failingInsert = (db as unknown as { insert: unknown }).insert;
    (db as unknown as { insert: unknown }).insert = () => {
      throw new Error("fake insert failure");
    };
    try {
      const res = await api("/api/rombels", {
        method: "POST",
        token: adminToken,
        json: { nama: "PAKET C 99 CATCH" },
      });
      expect(res.response.status).toBe(500);
    } finally {
      (db as unknown as { insert: unknown }).insert = failingInsert;
    }
    void rombels;
  });

  test("DELETE member rombel langsung menutup tx multi-statement", async () => {
    // Baris 424-428 (tx.update students) hanya tercover bila db.transaction
    // SYNCHRONOUS — in-process memakai sqlite asli sehingga sync.
    const student = await createStudent({ kelas: "PAKET C 10 DEL", program: "PAKET C" });
    const rombel = await createRombel({ nama: "PAKET C 10 DEL" });
    await assignStudent(rombel.id, student.id);
    expect(
      (await api(`/api/rombels/${rombel.id}/students/${student.id}`, { method: "DELETE", token: adminToken }))
        .response.status,
    ).toBe(200);
    const { db } = await import("../helpers/in-process-app");
    const { students } = await import("../../../src/server/models");
    const { eq } = await import("drizzle-orm");
    expect((await db.select().from(students).where(eq(students.id, student.id)).get())?.kelas).toBe("");
  });

  test("fixture assignment dapat membuat relasi eksplisit", async () => {
    const student = await createStudent();
    const rombel = await createRombel();
    await assignStudent(rombel.id, student.id);
    const list = await api<any>("/api/rombels", { token: adminToken });
    expect(list.response.status).toBe(200);
    const listed = list.data.data.find((item: any) => item.id === rombel.id);
    expect(listed).toBeDefined();
  });
});
