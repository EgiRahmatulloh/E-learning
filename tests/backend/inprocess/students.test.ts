import { beforeAll, describe, expect, setDefaultTimeout, test } from "bun:test";
import { api, db, login, models, signToken } from "../helpers/in-process-app";
import { assignStudent, createManager, createRombel, createStudent } from "../helpers/db-fixtures";
import { and, eq, inArray, like } from "drizzle-orm";

let token: string;
let userToken: string;

setDefaultTimeout(20_000);

const studentBody = (name: string, overrides: Record<string, unknown> = {}) => ({
  nama: name,
  ...overrides,
});

async function getStudent(id: number) {
  return db.select().from(models.students).where(eq(models.students.id, id)).get();
}

async function relations(studentId: number) {
  return db
    .select({ rombelId: models.rombelStudents.rombelId })
    .from(models.rombelStudents)
    .where(eq(models.rombelStudents.studentId, studentId))
    .all();
}

async function freeSectionedPromotion() {
  const existing = new Set((await db.select({ nama: models.rombels.nama }).from(models.rombels).all()).map((row) => row.nama.toUpperCase()));
  for (let grade = 1; grade < 12; grade++) {
    for (const section of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
      const current = `PAKET C ${grade} ${section}`;
      const target = `PAKET C ${grade + 1} ${section}`;
      if (!existing.has(current) && !existing.has(target)) return { grade, current, target };
    }
  }
  throw new Error("No free sectioned promotion fixture");
}

beforeAll(async () => {
  const admin = await createManager({ plainPassword: "student-admin" });
  token = await login(admin.email, "student-admin");
  userToken = await signToken({
    id: 992,
    username: "student-view@test.local",
    role: "student",
    name: "Student View",
    email: "student-view@test.local",
  });
});

describe("students", () => {
  test("public/list contracts, redaction, membership, dan auth", async () => {
    const student = await createStudent({
      nama: "Student List Contract",
      nik: "nik-rahasia-list",
      nisn: "nisn-rahasia-list",
      noHp: "081-secret",
      tempatTglLahir: "Secret Place",
      agama: "Secret Religion",
      namaAyah: "Secret Father",
      namaIbu: "Secret Mother",
      alamat: "Secret Address",
      rt: "01",
      rw: "02",
      desa: "Secret Village",
      kecamatan: "Secret District",
      kabupaten: "Secret Regency",
      provinsi: "Secret Province",
      sekolahAsal: "Secret School",
      berkas: { kk: "/api/files/list-secret.pdf" },
      password: "hash-rahasia-list",
    });
    const rombel = await createRombel({ nama: "PAKET C 10 LIST" });
    await assignStudent(rombel.id, student.id);

    const publicResult = await api<any>("/api/public-students");
    expect(publicResult.response.status).toBe(200);
    expect(publicResult.data.success).toBe(true);
    const publicRow = publicResult.data.data.find((row: any) => row.id === student.id);
    expect(publicRow).toEqual({
      id: student.id,
      nama: "Student List Contract",
      program: "PAKET C",
      kelas: "PAKET C 10 A",
      tempatTglLahir: "Secret Place",
      jenisKelamin: "",
      agama: "Secret Religion",
      titikLayanan: "",
      alamat: "Secret Address",
      status: "AKTIF",
      foto: "",
    });
    expect(JSON.stringify(publicRow)).not.toContain("nik-rahasia-list");
    expect(JSON.stringify(publicRow)).not.toContain("hash-rahasia-list");

    expect((await api("/api/students")).response.status).toBe(401);
    const userList = await api<any>("/api/students", { token: userToken });
    const userRow = userList.data.data.find((row: any) => row.id === student.id);
    for (const field of [
      "nik", "noHp", "nisn", "tempatTglLahir", "agama", "namaAyah", "namaIbu", "alamat", "rt", "rw",
      "desa", "kecamatan", "kabupaten", "provinsi", "sekolahAsal", "email", "berkas",
    ]) expect(userRow[field]).toBeUndefined();
    expect(userRow.password).toBe("");
    expect(userRow.rombels).toContainEqual({ id: rombel.id, nama: rombel.nama });

    const adminList = await api<any>("/api/students", { token });
    const adminRow = adminList.data.data.find((row: any) => row.id === student.id);
    expect(adminRow.nik).toBe("nik-rahasia-list");
    expect(adminRow.password).toBe("");
    expect(adminRow.rombels).toContainEqual({ id: rombel.id, nama: rombel.nama });
  });

  test("create defaults, explicit fields, existing/new/no rombel, dan admin guard", async () => {
    expect((await api("/api/students", { method: "POST", token: userToken, json: { nama: "Denied" } })).response.status).toBe(403);

    const existingRombel = await createRombel({ nama: "PAKET B 8 CREATE" });
    const first = await api<any>("/api/students", {
      method: "POST",
      token,
      json: studentBody("Create Existing", {
        nik: "NIK-CREATE", program: " paket b ", kelas: "paket b 8 create", nisn: "NISN-CREATE", nis: "NIS-CREATE",
        tempatTglLahir: "Bandung", titikLayanan: "TL", jenisKelamin: "P", noHp: "081", agama: "Islam",
        namaAyah: "Ayah", email: `create-${Date.now()}@test.local`, namaIbu: "Ibu", alamat: "Alamat", rt: "03", rw: "04",
        desa: "Desa", kecamatan: "Kecamatan", kabupaten: "Kabupaten", provinsi: "Provinsi", sekolahAsal: "Sekolah",
        password: "custom-pass", foto: "/api/files/create.png", status: "NONAKTIF", berkas: { kk: "/api/files/create-kk.pdf" },
      }),
    });
    expect(first.response.status).toBe(200);
    expect(first.data.data.program).toBe("PAKET B");
    expect(first.data.data.password).toBeUndefined();
    expect(await Bun.password.verify("custom-pass", (await getStudent(first.data.data.id))!.password)).toBe(true);
    expect((await relations(first.data.data.id)).map((row) => row.rombelId)).toEqual([existingRombel.id]);

    const second = await api<any>("/api/students", {
      method: "POST",
      token,
      json: studentBody("Create New Rombel", { kelas: "PAKET A 4 NEW", program: "" }),
    });
    expect(second.response.status).toBe(200);
    expect(second.data.data.program).toBe("PAKET A");
    expect(await Bun.password.verify("password123", (await getStudent(second.data.data.id))!.password)).toBe(true);
    const createdRombel = await db.select().from(models.rombels).where(eq(models.rombels.nama, "PAKET A 4 NEW")).get();
    expect(createdRombel).toBeDefined();
    expect((await relations(second.data.data.id))[0]?.rombelId).toBe(createdRombel!.id);

    const noClass = await api<any>("/api/students", { method: "POST", token, json: { nama: "Create Defaults" } });
    expect(noClass.response.status).toBe(200);
    expect(noClass.data.data.program).toBe("PAKET C");
    expect(noClass.data.data.kelas).toBe("");
    expect(noClass.data.data.status).toBe("AKTIF");
    expect(await relations(noClass.data.data.id)).toHaveLength(0);
  });

  test("update matrix, password behavior, rombel sync, validation, dan cleanup keep", async () => {
    const stamp = Date.now();
    expect((await api("/api/students/nope", { method: "PUT", token, json: { nama: "Invalid" } })).response.status).toBe(400);
    expect((await api("/api/students/999999", { method: "PUT", token, json: { nama: "Missing" } })).response.status).toBe(404);

    const oldRombel = await createRombel({ nama: `PAKET C 10 UPDATE-OLD-${stamp}` });
    const keepFoto = `/api/files/update-shared-${stamp}.png`;
    const student = await createStudent({
      nama: "Before Update", kelas: oldRombel.nama, program: "PAKET C", foto: keepFoto,
      berkas: { kk: `/api/files/update-old-${stamp}.pdf` }, nik: `OLD-NIK-${stamp}`, rt: "07",
    });
    await assignStudent(oldRombel.id, student.id);
    await db.insert(models.alumni).values({ nama: "Alumni Sharing Photo", foto: keepFoto }).run();
    const oldHash = student.password;

    const updated = await api<any>(`/api/students/${student.id}`, {
      method: "PUT",
      token,
      json: studentBody("After Update", {
        kelas: `PAKET B 8 UPDATE-NEW-${stamp}`, program: "", nik: `NEW-NIK-${stamp}`, nisn: `NEW-NISN-${stamp}`, nis: `NEW-NIS-${stamp}`,
        tempatTglLahir: "Garut", titikLayanan: "New TL", jenisKelamin: "L", noHp: "082", agama: "Kristen",
        namaAyah: "New Ayah", email: `update-${Date.now()}@test.local`, namaIbu: "New Ibu", alamat: "New Address",
        rt: "08", rw: "09", desa: "New Desa", kecamatan: "New Kecamatan", kabupaten: "New Kabupaten",
        provinsi: "New Provinsi", sekolahAsal: "New Sekolah", foto: "/api/files/update-new.png", status: "AKTIF",
        berkas: { kk: "/api/files/update-new.pdf" },
      }),
    });
    expect(updated.response.status).toBe(200);
    expect(updated.data.data.program).toBe("PAKET B");
    expect(updated.data.data.password).toBeUndefined();
    expect((await getStudent(student.id))!.password).toBe(oldHash);
    const newRombel = await db.select().from(models.rombels).where(eq(models.rombels.nama, `PAKET B 8 UPDATE-NEW-${stamp}`)).get();
    expect((await relations(student.id)).map((row) => row.rombelId)).toEqual([newRombel!.id]);

    const passwordUpdate = await api<any>(`/api/students/${student.id}`, {
      method: "PUT", token, json: { nama: "After Password", password: "new-student-pass" },
    });
    expect(passwordUpdate.response.status).toBe(200);
    expect(await Bun.password.verify("new-student-pass", (await getStudent(student.id))!.password)).toBe(true);

    const clearClass = await api<any>(`/api/students/${student.id}`, {
      method: "PUT", token, json: { nama: "No Class", kelas: "", program: "PAKET A" },
    });
    expect(clearClass.response.status).toBe(200);
    expect(await relations(student.id)).toHaveLength(0);

    const unchangedClass = await api<any>(`/api/students/${student.id}`, {
      method: "PUT", token, json: { nama: "No Class Again" },
    });
    expect(unchangedClass.response.status).toBe(200);
    expect(unchangedClass.data.data.program).toBe("PAKET A");
  });

  test("single promote covers invalid/missing grade, max, target reuse, sections, and empty-old cleanup", async () => {
    expect((await api("/api/students/nope/promote", { method: "POST", token })).response.status).toBe(400);
    expect((await api("/api/students/999999/promote", { method: "POST", token })).response.status).toBe(404);

    const invalid = await createStudent({ kelas: "KELAS UNKNOWN", program: "PAKET C" });
    expect((await api(`/api/students/${invalid.id}/promote`, { method: "POST", token })).response.status).toBe(400);
    const tooHigh = await createStudent({ kelas: "PAKET C 13", program: "UNKNOWN" });
    expect((await api(`/api/students/${tooHigh.id}/promote`, { method: "POST", token })).response.status).toBe(400);
    const maxA = await createStudent({ kelas: "PAKET A 6", program: "PAKET A" });
    expect((await api(`/api/students/${maxA.id}/promote`, { method: "POST", token })).response.status).toBe(400);

    const old = await createRombel({ nama: "PAKET C 10 Q" });
    const target = await createRombel({ nama: "PAKET C 11 Q" });
    const sectioned = await createStudent({ kelas: "PAKET C 10", program: "PAKET C" });
    await assignStudent(old.id, sectioned.id);
    const promoted = await api<any>(`/api/students/${sectioned.id}/promote`, { method: "POST", token });
    expect(promoted.response.status).toBe(200);
    expect(promoted.data.data.kelas).toBe("PAKET C 11");
    expect((await relations(sectioned.id))[0]?.rombelId).toBe(target.id);
    expect(await db.select().from(models.rombels).where(eq(models.rombels.id, old.id)).get()).toBeUndefined();

    const noMembership = await createStudent({ kelas: "PAKET B 7", program: "" });
    const noSection = await api<any>(`/api/students/${noMembership.id}/promote`, { method: "POST", token });
    expect(noSection.response.status).toBe(200);
    expect(noSection.data.data.kelas).toBe("PAKET C 8");
    expect((await relations(noMembership.id))).toHaveLength(1);
  });

  test("single graduate covers validation, duplicate prevention, alumni copy, and rombel cleanup", async () => {
    const stamp = Date.now();
    expect((await api("/api/students/nope/graduate", { method: "POST", token })).response.status).toBe(400);
    expect((await api("/api/students/999999/graduate", { method: "POST", token })).response.status).toBe(404);
    const already = await createStudent({ status: "LULUS" });
    expect((await api(`/api/students/${already.id}/graduate`, { method: "POST", token })).response.status).toBe(400);

    const student = await createStudent({
      nama: `Graduate Full ${stamp}`, nik: `GR-NIK-${stamp}`, program: "PAKET B", kelas: "PAKET B 9 G", nisn: `GR-NISN-${stamp}`, nis: `GR-NIS-${stamp}`,
      tempatTglLahir: "Tasik", noHp: "083", namaAyah: "Ayah G", namaIbu: "Ibu G", jenisKelamin: "P", agama: "Islam",
      email: `graduate-${stamp}@test.local`, alamat: "Alamat G", rt: "01", rw: "02", desa: "Desa G",
      kecamatan: "Kecamatan G", kabupaten: "Kabupaten G", provinsi: "Provinsi G", foto: "/api/files/graduated.png",
    });
    const firstRombel = await createRombel({ nama: `PAKET B 9 G1-${stamp}` });
    const secondRombel = await createRombel({ nama: `PAKET B 9 G2-${stamp}` });
    await assignStudent(firstRombel.id, student.id);
    await assignStudent(secondRombel.id, student.id);

    const result = await api<any>(`/api/students/${student.id}/graduate`, { method: "POST", token });
    expect(result.response.status).toBe(200);
    expect(result.data.data).toMatchObject({ status: "LULUS", kelas: "" });
    expect(await relations(student.id)).toHaveLength(0);
    const alumni = await db.select().from(models.alumni).where(eq(models.alumni.nisn, `GR-NISN-${stamp}`)).get();
    expect(alumni).toMatchObject({ nama: `Graduate Full ${stamp}`, nik: `GR-NIK-${stamp}`, program: "PAKET B", foto: "/api/files/graduated.png" });
    expect(alumni!.tahunLulus).toBe(new Date().getFullYear().toString());
    expect(await db.select().from(models.rombels).where(inArray(models.rombels.id, [firstRombel.id, secondRombel.id])).all()).toHaveLength(0);
  });

  test("single continue moves/reuses/creates rombel, accepts empty class, and validates id", async () => {
    expect((await api("/api/students/nope/continue", { method: "POST", token, json: { program: "PAKET C", kelas: "PAKET C 10" } })).response.status).toBe(400);

    const old = await createRombel({ nama: "PAKET B 9 CONT-OLD" });
    const target = await createRombel({ nama: "PAKET C 10 CONT-TARGET" });
    const student = await createStudent({ status: "LULUS", kelas: "", program: "PAKET B" });
    await assignStudent(old.id, student.id);
    const result = await api<any>(`/api/students/${student.id}/continue`, {
      method: "POST", token, json: { program: "PAKET C", kelas: "PAKET C 10 CONT-TARGET" },
    });
    expect(result.response.status).toBe(200);
    expect(result.data.data).toMatchObject({ status: "AKTIF", program: "PAKET C", kelas: "PAKET C 10 CONT-TARGET" });
    expect((await relations(student.id))[0]?.rombelId).toBe(target.id);
    expect(await db.select().from(models.rombels).where(eq(models.rombels.id, old.id)).get()).toBeUndefined();

    const newTargetStudent = await createStudent({ status: "LULUS", kelas: "", program: "PAKET A" });
    const created = await api<any>(`/api/students/${newTargetStudent.id}/continue`, {
      method: "POST", token, json: { program: "PAKET B", kelas: "paket b 7 cont-new" },
    });
    expect(created.response.status).toBe(200);
    const targetCreated = await db.select().from(models.rombels).where(eq(models.rombels.nama, "PAKET B 7 CONT-NEW")).get();
    expect((await relations(newTargetStudent.id))[0]?.rombelId).toBe(targetCreated!.id);

    const noClass = await api<any>(`/api/students/${newTargetStudent.id}/continue`, {
      method: "POST", token, json: { program: "PAKET A", kelas: "" },
    });
    expect(noClass.response.status).toBe(200);
  });

  test("delete handles invalid/missing rows and preserves alumni-shared photos", async () => {
    expect((await api("/api/students/nope", { method: "DELETE", token })).response.status).toBe(400);
    expect((await api("/api/students/999999", { method: "DELETE", token })).response.status).toBe(200);

    const sharedFoto = "/api/files/delete-shared.png";
    const student = await createStudent({ foto: sharedFoto, berkas: { kk: "/api/files/delete-private.pdf" } });
    await db.insert(models.alumni).values({ nama: "Delete Photo Owner", foto: sharedFoto }).run();
    const removed = await api<any>(`/api/students/${student.id}`, { method: "DELETE", token });
    expect(removed.response.status).toBe(200);
    expect(removed.data.success).toBe(true);
    expect(await getStudent(student.id)).toBeUndefined();
  });

  test("import validates, maps fields/password aliases, derives programs, deduplicates, and chunks", async () => {
    expect((await api("/api/students/import", { method: "POST", token, json: [] })).response.status).toBe(400);
    expect((await api("/api/students/import", { method: "POST", token, json: { nama: "Not Array" } })).response.status).toBe(422);

    const stamp = Date.now();
    const existing = await createStudent({ nisn: `IMP-EXIST-${stamp}`, nik: `IMP-NIK-${stamp}` });
    const first = await api<any>("/api/students/import", {
      method: "POST",
      token,
      json: [
        {
          nama: `Import Full ${stamp}`, nik: `IMP-FULL-NIK-${stamp}`, nisn: `IMP-FULL-NISN-${stamp}`, nis: "IMP-NIS",
          program: " paket a ", kelas: " PAKET A 5 I ", tempatTglLahir: "Ciamis", titikLayanan: "TL", jenisKelamin: "P",
          noHp: "084", agama: "Islam", namaAyah: "Ayah I", email: `import-full-${stamp}@test.local`, namaIbu: "Ibu I",
          alamat: "Alamat I", rt: "10", rw: "11", desa: "Desa I", kecamatan: "Kecamatan I", kabupaten: "Kabupaten I",
          provinsi: "Provinsi I", sekolahAsal: "Sekolah I", Password: "alias-pass", foto: "/api/files/import.png", status: "LULUS",
        },
        { nama: `Import Custom ${stamp}`, nisn: `IMP-CUSTOM-${stamp}`, password: "lower-pass", kelas: "PAKET B 8" },
        { nama: `Import Default ${stamp}`, nisn: `IMP-DEFAULT-${stamp}`, kelas: "PAKET C 10" },
        { nama: `Existing Duplicate ${stamp}`, nisn: existing.nisn },
        { nama: `File Duplicate ${stamp}`, nisn: `IMP-FULL-NISN-${stamp}` },
      ],
    });
    expect(first.response.status).toBe(200);
    expect(first.data).toMatchObject({ imported: 3, skipped: 2 });
    expect(first.data.message).toContain("duplikat dilewati");

    const full = await db.select().from(models.students).where(eq(models.students.nisn, `IMP-FULL-NISN-${stamp}`)).get();
    expect(full).toMatchObject({ program: "PAKET A", kelas: "PAKET A 5 I", status: "LULUS", nik: `IMP-FULL-NIK-${stamp}` });
    expect(await Bun.password.verify("alias-pass", full!.password)).toBe(true);
    const custom = await db.select().from(models.students).where(eq(models.students.nisn, `IMP-CUSTOM-${stamp}`)).get();
    expect(custom!.program).toBe("PAKET B");
    expect(await Bun.password.verify("lower-pass", custom!.password)).toBe(true);
    const defaulted = await db.select().from(models.students).where(eq(models.students.nisn, `IMP-DEFAULT-${stamp}`)).get();
    expect(await Bun.password.verify("password123", defaulted!.password)).toBe(true);

    const allDup = await api<any>("/api/students/import", {
      method: "POST", token, json: [{ nama: "Duplicate Again", nik: full!.nik }],
    });
    expect(allDup.response.status).toBe(400);
    expect(allDup.data.message).toContain("Semua data duplikat");

    const chunkPrefix = `STUDENT-CHUNK-${stamp}`;
    const chunks = await api<any>("/api/students/import", {
      method: "POST",
      token,
      json: Array.from({ length: 101 }, (_, index) => ({ nama: `${chunkPrefix}-${index}`, nisn: `${chunkPrefix}-N-${index}` })),
    });
    expect(chunks.response.status).toBe(200);
    expect(chunks.data).toMatchObject({ imported: 101, skipped: 0 });
    expect(chunks.data.message).not.toContain("duplikat");
    expect(await db.select().from(models.students).where(like(models.students.nama, `${chunkPrefix}-%`)).all()).toHaveLength(101);
  });

  test("bulk promote covers skips, sections, target reuse/create, duplicates, and old-rombel cleanup", async () => {
    expect((await api("/api/students/bulk/promote", { method: "POST", token, json: { studentIds: [] } })).response.status).toBe(400);

    const sectionedFixture = await freeSectionedPromotion();
    const oldA = await createRombel({ nama: sectionedFixture.current });
    const reused = await createRombel({ nama: sectionedFixture.target });
    const promotableA = await createStudent({ kelas: `PAKET C ${sectionedFixture.grade}`, program: "PAKET C" });
    await assignStudent(oldA.id, promotableA.id);

    const oldNoSection = await createRombel({ nama: "LEGACY GROUP" });
    const promotableB = await createStudent({ kelas: "PAKET B 7", program: "PAKET B" });
    await assignStudent(oldNoSection.id, promotableB.id);
    const invalid = await createStudent({ kelas: "UNKNOWN", program: "PAKET C" });
    const max = await createStudent({ kelas: "PAKET A 6", program: "PAKET A" });

    const result = await api<any>("/api/students/bulk/promote", {
      method: "POST", token, json: { studentIds: [promotableA.id, promotableB.id, invalid.id, max.id, 999999] },
    });
    expect(result.response.status).toBe(200);
    expect(result.data).toMatchObject({ success: true, promoted: 2, skipped: 2 });
    expect((await getStudent(promotableA.id))!.kelas).toBe(`PAKET C ${sectionedFixture.grade + 1}`);
    expect((await relations(promotableA.id))[0]?.rombelId).toBe(reused.id);
    expect((await getStudent(promotableB.id))!.kelas).toBe("PAKET B 8");
    const createdTarget = await db.select().from(models.rombels).where(eq(models.rombels.nama, "PAKET B 8")).get();
    expect((await relations(promotableB.id))[0]?.rombelId).toBe(createdTarget!.id);
    expect(await db.select().from(models.rombels).where(inArray(models.rombels.id, [oldA.id, oldNoSection.id])).all()).toHaveLength(0);
  });

  test("bulk graduate skips graduates, copies complete alumni data, and removes empty rombels", async () => {
    expect((await api("/api/students/bulk/graduate", { method: "POST", token, json: { studentIds: [] } })).response.status).toBe(400);

    const active = await createStudent({
      nama: "Bulk Graduate", nik: "BG-NIK", program: "PAKET C", kelas: "PAKET C 12", nisn: `BG-${Date.now()}`,
      nis: "BG-NIS", tempatTglLahir: "Birth", noHp: "085", namaAyah: "Father", namaIbu: "Mother", jenisKelamin: "L",
      agama: "Islam", email: `bg-${Date.now()}@test.local`, alamat: "Address", rt: "12", rw: "13", desa: "Village",
      kecamatan: "District", kabupaten: "Regency", provinsi: "Province", foto: "/api/files/bulk-graduate.png",
    });
    const already = await createStudent({ status: "LULUS", nisn: `BG-DONE-${Date.now()}` });
    const rombelOne = await createRombel({ nama: "PAKET C 12 BG1" });
    const rombelTwo = await createRombel({ nama: "PAKET C 12 BG2" });
    await assignStudent(rombelOne.id, active.id);
    await assignStudent(rombelTwo.id, active.id);

    const result = await api<any>("/api/students/bulk/graduate", {
      method: "POST", token, json: { studentIds: [active.id, already.id, 999999] },
    });
    expect(result.response.status).toBe(200);
    expect(result.data).toMatchObject({ success: true, graduated: 1, skipped: 1 });
    expect(await getStudent(active.id)).toMatchObject({ status: "LULUS", kelas: "" });
    expect(await relations(active.id)).toHaveLength(0);
    const alumni = await db.select().from(models.alumni).where(eq(models.alumni.nisn, active.nisn)).get();
    expect(alumni).toMatchObject({ nama: "Bulk Graduate", nik: "BG-NIK", program: "PAKET C", foto: "/api/files/bulk-graduate.png" });
    expect(await db.select().from(models.rombels).where(inArray(models.rombels.id, [rombelOne.id, rombelTwo.id])).all()).toHaveLength(0);
  });

  test("bulk continue processes existing ids, reuses/creates targets, removes old rombels, and supports empty class", async () => {
    expect((await api("/api/students/bulk/continue", {
      method: "POST", token, json: { studentIds: [], program: "PAKET C", kelas: "PAKET C 10" },
    })).response.status).toBe(400);

    const reused = await createRombel({ nama: "PAKET B 7 BULK-CONT" });
    const oldOne = await createRombel({ nama: "PAKET A 6 BC1" });
    const oldTwo = await createRombel({ nama: "PAKET A 6 BC2" });
    const first = await createStudent({ status: "LULUS", kelas: "", program: "PAKET A" });
    const second = await createStudent({ status: "LULUS", kelas: "", program: "PAKET A" });
    await assignStudent(oldOne.id, first.id);
    await assignStudent(oldTwo.id, second.id);

    const reusedResult = await api<any>("/api/students/bulk/continue", {
      method: "POST", token, json: { studentIds: [first.id, second.id, 999999], program: "PAKET B", kelas: "paket b 7 bulk-cont" },
    });
    expect(reusedResult.response.status).toBe(200);
    expect(reusedResult.data).toMatchObject({ success: true, continued: 2 });
    expect((await relations(first.id))[0]?.rombelId).toBe(reused.id);
    expect((await relations(second.id))[0]?.rombelId).toBe(reused.id);
    expect(await db.select().from(models.rombels).where(inArray(models.rombels.id, [oldOne.id, oldTwo.id])).all()).toHaveLength(0);

    const third = await createStudent({ status: "LULUS", kelas: "", program: "PAKET B" });
    const createdResult = await api<any>("/api/students/bulk/continue", {
      method: "POST", token, json: { studentIds: [third.id], program: "PAKET C", kelas: "PAKET C 10 BULK-NEW" },
    });
    expect(createdResult.response.status).toBe(200);
    expect((await relations(third.id))).toHaveLength(1);

    const emptyClass = await api<any>("/api/students/bulk/continue", {
      method: "POST", token, json: { studentIds: [third.id, 999998], program: "PAKET A", kelas: "" },
    });
    expect(emptyClass.response.status).toBe(200);
    expect(emptyClass.data.continued).toBe(1);
    const noValid = await api<any>("/api/students/bulk/continue", {
      method: "POST", token, json: { studentIds: [999997], program: "PAKET A", kelas: "" },
    });
    expect(noValid.data.continued).toBe(0);
  });

  test("transaction insert duplicate guards are harmless for promote/continue bulk paths", async () => {
    const originalTransaction = (db as unknown as { transaction: typeof db.transaction }).transaction;
    let rombelStudentFailures = 0;
    (db as unknown as { transaction: typeof db.transaction }).transaction = ((callback: (tx: any) => unknown) =>
      originalTransaction.call(db, (tx: any) => {
        const proxy = new Proxy(tx, {
          get(target, property, receiver) {
            if (property !== "insert") return Reflect.get(target, property, receiver);
            return (table: unknown) => {
              const query = target.insert(table);
              if (table !== models.rombelStudents) return query;
              const originalValues = query.values.bind(query);
              query.values = (values: unknown) => {
                const result = originalValues(values);
                result.run = () => {
                  rombelStudentFailures++;
                  throw new Error("simulated duplicate membership");
                };
                return result;
              };
              return query;
            };
          },
        });
        return callback(proxy);
      })) as typeof db.transaction;
    try {
      const promoteStudent = await createStudent({ kelas: "PAKET C 10", program: "PAKET C" });
      const promoteResult = await api<any>(`/api/students/${promoteStudent.id}/promote`, { method: "POST", token });
      expect(promoteResult.response.status).toBe(200);

      const continueStudent = await createStudent({ status: "LULUS", kelas: "", program: "PAKET B" });
      const continueResult = await api<any>(`/api/students/${continueStudent.id}/continue`, {
        method: "POST", token, json: { program: "PAKET C", kelas: "PAKET C 10 DUP" },
      });
      expect(continueResult.response.status).toBe(200);

      const bulkPromote = await createStudent({ kelas: "PAKET B 7", program: "PAKET B" });
      expect((await api("/api/students/bulk/promote", {
        method: "POST", token, json: { studentIds: [bulkPromote.id] },
      })).response.status).toBe(200);

      const bulkContinue = await createStudent({ status: "LULUS", kelas: "", program: "PAKET A" });
      expect((await api("/api/students/bulk/continue", {
        method: "POST", token, json: { studentIds: [bulkContinue.id], program: "PAKET B", kelas: "PAKET B 7 DUP" },
      })).response.status).toBe(200);
    } finally {
      (db as unknown as { transaction: typeof db.transaction }).transaction = originalTransaction;
    }
    expect(rombelStudentFailures).toBe(4);
  });
});
