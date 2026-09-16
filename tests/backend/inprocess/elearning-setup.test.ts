import { beforeAll, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { api, db, login, models } from "../helpers/in-process-app";
import {
  assignStudent,
  createManager,
  createRombel,
  createStudent,
  createTutor,
} from "../helpers/db-fixtures";

let adminToken: string;
let tutorToken: string;
let studentToken: string;
let tutorId: number;
let otherTutorId: number;
let studentId: number;

const setupBody = (overrides: Record<string, unknown> = {}) => ({
  kelas: `PAKET C 10 SETUP ${Date.now()}`,
  mapel: `Setup Mapel ${Date.now()}`,
  tutorId,
  skk: 2,
  jumlahSesi: 4,
  ...overrides,
});

beforeAll(async () => {
  const admin = await createManager({ plainPassword: "setup-admin" });
  adminToken = await login(admin.email, "setup-admin");
  const tutor = await createTutor({ plainPassword: "setup-tutor" });
  tutorId = tutor.id;
  tutorToken = await login(tutor.email, "setup-tutor");
  otherTutorId = (await createTutor()).id;
  const student = await createStudent({ plainPassword: "setup-student" });
  studentId = student.id;
  studentToken = await login(student.email, "setup-student");
});

async function postSetup(overrides: Record<string, unknown> = {}) {
  return api<any>("/api/elearning/setups", {
    method: "POST",
    token: adminToken,
    json: setupBody(overrides),
  });
}

describe("elearning setup CRUD and filters", () => {
  test("auth, schema validation, create/list/update/approve/delete and not-found", async () => {
    expect((await api("/api/elearning/setups")).response.status).toBe(401);
    expect((await postSetup({ tutorId: "invalid" })).response.status).toBe(422);

    const fallback = await postSetup();
    expect(fallback.response.status).toBe(200);
    expect(fallback.data.data.semester).toBe("Ganjil");
    const id = fallback.data.data.id as number;

    const created = await postSetup({ semester: "Genap", mapel: `Explicit ${id}` });
    expect(created.data.data.semester).toBe("Genap");

    const all = await api<any>("/api/elearning/setups", { token: adminToken });
    expect(all.data.data.some((s: any) => s.id === id)).toBe(true);
    expect(
      (await api<any>(`/api/elearning/setups?tutorId=${tutorId}`, { token: adminToken })).data.data
        .every((s: any) => s.tutorId === tutorId),
    ).toBe(true);
    expect(
      (await api<any>(`/api/elearning/setups?kelas=${encodeURIComponent(fallback.data.data.kelas)}`, { token: adminToken }))
        .data.data.some((s: any) => s.id === id),
    ).toBe(true);
    expect(
      (await api<any>("/api/elearning/setups?semester=Genap", { token: adminToken })).data.data
        .some((s: any) => s.id === created.data.data.id),
    ).toBe(true);

    const tutorFiltered = await api<any>(`/api/elearning/setups?tutorId=${otherTutorId}`, { token: tutorToken });
    expect(tutorFiltered.data.data.some((s: any) => s.id === id)).toBe(true);
    const studentFiltered = await api<any>(
      `/api/elearning/setups?kelas=${encodeURIComponent(fallback.data.data.kelas)}`,
      { token: studentToken },
    );
    expect(studentFiltered.data.data.some((s: any) => s.id === id)).toBe(true);

    expect(
      (await api(`/api/elearning/setups/${id}`, { method: "PUT", token: tutorToken, json: setupBody() })).response.status,
    ).toBe(403);
    const updated = await api<any>(`/api/elearning/setups/${id}`, {
      method: "PUT",
      token: adminToken,
      json: setupBody({ kelas: "PAKET C 10 UPDATED", mapel: "Updated", semester: "" }),
    });
    expect(updated.data.data.semester).toBe("Ganjil");
    expect((await api(`/api/elearning/setups/999999`, {
      method: "PUT", token: adminToken, json: setupBody(),
    })).response.status).toBe(404);

    const approved = await api<any>(`/api/elearning/setups/${id}/approve-angket`, {
      method: "PATCH", token: adminToken, json: { isAngketApproved: true },
    });
    expect(approved.data.data.isAngketApproved).toBe(true);
    expect((await api(`/api/elearning/setups/999999/approve-angket`, {
      method: "PATCH", token: adminToken, json: { isAngketApproved: false },
    })).response.status).toBe(404);

    expect((await api(`/api/elearning/setups/${id}`, { method: "DELETE", token: adminToken })).response.status).toBe(200);
  });
});

describe("elearning setup copy", () => {
  test("validates semesters and handles empty, copied, and skipped sources", async () => {
    expect((await api("/api/elearning/setups/copy", {
      method: "POST", token: tutorToken, json: { fromSemester: "A", toSemester: "B" },
    })).response.status).toBe(403);
    expect((await api("/api/elearning/setups/copy", {
      method: "POST", token: adminToken, json: { fromSemester: "", toSemester: "B" },
    })).response.status).toBe(400);
    expect((await api("/api/elearning/setups/copy", {
      method: "POST", token: adminToken, json: { fromSemester: "Sama", toSemester: "Sama" },
    })).response.status).toBe(400);

    const empty = await api<any>("/api/elearning/setups/copy", {
      method: "POST", token: adminToken, json: { fromSemester: "EMPTY-SOURCE", toSemester: "EMPTY-TARGET" },
    });
    expect(empty.data).toMatchObject({ copied: 0, skipped: 0 });

    const sourceSemester = `SOURCE-${Date.now()}`;
    const targetSemester = `TARGET-${Date.now()}`;
    await postSetup({ kelas: "PAKET C 10 COPY A", mapel: "Copy A", semester: sourceSemester });
    await postSetup({ kelas: "PAKET C 10 COPY B", mapel: "Copy B", semester: sourceSemester });
    await postSetup({ kelas: "PAKET C 10 COPY B", mapel: "Copy B", semester: targetSemester });

    const copy = await api<any>("/api/elearning/setups/copy", {
      method: "POST", token: adminToken, json: { fromSemester: sourceSemester, toSemester: targetSemester },
    });
    expect(copy.data).toMatchObject({ success: true, copied: 1, skipped: 1 });
    expect(copy.data.message).toContain("dilewati");
  });
});

describe("elearning setup relations", () => {
  test("toggles sessions and resolves setups by student through all missing stages", async () => {
    const course = await db.insert(models.elearningCourses)
      .values({ namaMapel: `Toggle ${Date.now()}`, program: "Paket C", kelas: "10" }).returning().get();
    const session = await db.insert(models.elearningSessions)
      .values({ courseId: course.id, sessionNumber: 1, title: "Toggle" }).returning().get();
    const toggled = await api<any>(`/api/elearning/session/${session.id}/toggle`, {
      method: "PUT", token: adminToken, json: { isOpen: false },
    });
    expect(toggled.data.success).toBe(true);

    expect((await api("/api/elearning/setups/by-student/999999", { token: adminToken })).data).toMatchObject({ success: false });
    const noRombel = await createStudent();
    expect((await api<any>(`/api/elearning/setups/by-student/${noRombel.id}`, { token: adminToken })).data.data).toEqual([]);

    const danglingStudent = await createStudent();
    await db.run(sql`PRAGMA foreign_keys = OFF`);
    await db.insert(models.rombelStudents).values({ studentId: danglingStudent.id, rombelId: 999999 }).run();
    await db.run(sql`PRAGMA foreign_keys = ON`);
    expect((await api<any>(`/api/elearning/setups/by-student/${danglingStudent.id}`, { token: adminToken })).data.data).toEqual([]);

    const rombel = await createRombel({ nama: `PAKET C 10 BY-STUDENT ${Date.now()}` });
    await assignStudent(rombel.id, studentId);
    const setup = await postSetup({ kelas: rombel.nama, mapel: "By Student" });
    const asStudent = await api<any>("/api/elearning/setups/by-student/999999", { token: studentToken });
    expect(asStudent.data.data.some((row: any) => row.setup.id === setup.data.data.id)).toBe(true);
  });
});

describe("elearning students by setup", () => {
  test("handles missing setup, no matching rombel, and returns members", async () => {
    expect((await api("/api/elearning/students-by-setup/999999", { token: adminToken })).data)
      .toMatchObject({ success: false });

    const noClass = await postSetup({ kelas: `NO-ROMBEL-${Date.now()}`, mapel: "No Members" });
    expect((await api<any>(`/api/elearning/students-by-setup/${noClass.data.data.id}`, { token: adminToken })).data.data)
      .toEqual([]);

    const rombelName = `PAKET C 10 MEMBERS ${Date.now()}`;
    const rombel = await createRombel({ nama: rombelName });
    const member = await createStudent({ nis: "MEMBER-NIS" });
    await assignStudent(rombel.id, member.id);
    const setup = await postSetup({ kelas: rombelName, mapel: "Members" });
    const members = await api<any>(`/api/elearning/students-by-setup/${setup.data.data.id}`, { token: tutorToken });
    expect(members.data.data).toContainEqual(expect.objectContaining({ id: member.id, nis: "MEMBER-NIS" }));
  });
});
