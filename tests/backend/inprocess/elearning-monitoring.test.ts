import { beforeAll, describe, expect, test } from "bun:test";
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
let studentId: number;
let kelas: string;
let setupId: number;
let courseId: number;
let session1Id: number;
let session2Id: number;
let assignment1Id: number;

beforeAll(async () => {
  const admin = await createManager({ plainPassword: "monitor-admin" });
  adminToken = await login(admin.email, "monitor-admin");
  const tutor = await createTutor({ plainPassword: "monitor-tutor" });
  tutorId = tutor.id;
  tutorToken = await login(tutor.email, "monitor-tutor");
  const student = await createStudent({ plainPassword: "monitor-student", nis: "MON-NIS" });
  studentId = student.id;
  studentToken = await login(student.email, "monitor-student");

  kelas = `PAKET C 10 MON ${Date.now()}`;
  const rombel = await createRombel({ nama: kelas });
  await assignStudent(rombel.id, studentId);
  // Duplicate join row is represented by a second rombel with the same level and
  // student, exercising de-duplication without violating either UNIQUE key.
  const secondRombel = await createRombel({ nama: `PAKET C 10 DUP ${Date.now()}` });
  await assignStudent(secondRombel.id, studentId);

  const setup = await db.insert(models.elearningSetups).values({
    kelas, mapel: "Monitoring Math", tutorId, skk: 2, jumlahSesi: 3, semester: "Ganjil",
  }).returning().get();
  setupId = setup.id;
  const course = await db.insert(models.elearningCourses).values({
    namaMapel: "Monitoring Math", program: "Paket C", kelas: "10",
  }).returning().get();
  courseId = course.id;
  const session0 = await db.insert(models.elearningSessions).values({
    courseId, sessionNumber: 0, title: "Intro",
  }).returning().get();
  const session1 = await db.insert(models.elearningSessions).values({
    courseId, sessionNumber: 1, title: "One",
  }).returning().get();
  session1Id = session1.id;
  const session2 = await db.insert(models.elearningSessions).values({
    courseId, sessionNumber: 2, title: "Two",
  }).returning().get();
  session2Id = session2.id;

  const assignment = await db.insert(models.elearningAssignments).values({ sessionId: session1Id, title: "A1" }).returning().get();
  assignment1Id = assignment.id;
  const assignment2 = await db.insert(models.elearningAssignments)
    .values({ sessionId: session2Id, title: "A2" }).returning().get();
  await db.insert(models.elearningAttendances).values([
    { sessionId: session0.id, studentId },
    { sessionId: session1Id, studentId },
  ]).run();
  await db.insert(models.elearningForumPosts).values([
    { sessionId: session0.id, courseId, authorId: studentId, authorRole: "siswa", content: "intro" },
    { sessionId: session1Id, courseId, authorId: studentId, authorRole: "siswa", content: "student" },
    { sessionId: session1Id, courseId, authorId: tutorId, authorRole: "tutor", content: "tutor" },
  ]).run();
  const ungradedStudent = await createStudent();
  await db.insert(models.elearningSubmissions).values([
    { assignmentId: assignment1Id, studentId, grade: 80, feedback: "good" },
    { assignmentId: assignment2.id, studentId: ungradedStudent.id },
  ]).run();
});

describe("elearning monitoring lists", () => {
  test("enforces admin auth and enriches/filter tutors", async () => {
    expect((await api("/api/elearning/monitoring/tutors")).response.status).toBe(401);
    expect((await api("/api/elearning/monitoring/tutors", { token: studentToken })).response.status).toBe(403);

    const unfiltered = await api<any>("/api/elearning/monitoring/tutors?level=Semua", { token: adminToken });
    const tutor = unfiltered.data.data.find((row: any) => row.id === tutorId);
    expect(tutor).toMatchObject({ jumlahKelas: 1, diskusiCount: 1, tugasBelumDinilai: 1 });

    const filtered = await api<any>("/api/elearning/monitoring/tutors?level=10", { token: adminToken });
    expect(filtered.data.data.some((row: any) => row.id === tutorId)).toBe(true);
    const none = await api<any>("/api/elearning/monitoring/tutors?level=99", { token: adminToken });
    expect(none.data.data).toEqual([]);
  });

  test("filters students, de-duplicates joins, and calculates stats", async () => {
    expect((await api("/api/elearning/monitoring/students", { token: tutorToken })).response.status).toBe(403);
    const all = await api<any>("/api/elearning/monitoring/students?level=Semua", { token: adminToken });
    const rows = all.data.data.filter((row: any) => row.id === studentId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ forumCount: 2, kehadiranCount: 2, tugasCount: 1, avgScore: 80 });

    const level = await api<any>("/api/elearning/monitoring/students?level=10", { token: adminToken });
    expect(level.data.data.some((row: any) => row.id === studentId)).toBe(true);
    const none = await api<any>("/api/elearning/monitoring/students?level=99", { token: adminToken });
    expect(none.data.data).toEqual([]);
  });
});

describe("elearning grades", () => {
  test("validates setup, scopes students by role, and builds populated details", async () => {
    expect((await api("/api/elearning/grades")).response.status).toBe(401);
    expect((await api("/api/elearning/grades", { token: adminToken })).data).toMatchObject({ success: false });
    expect((await api("/api/elearning/grades?setupId=abc", { token: adminToken })).data).toMatchObject({ success: false });
    expect((await api("/api/elearning/grades?setupId=999999", { token: adminToken })).data.message).toContain("tidak ditemukan");

    const grades = await api<any>(`/api/elearning/grades?setupId=${setupId}`, { token: adminToken });
    const row = grades.data.data.find((item: any) => item.id === studentId);
    expect(row).toMatchObject({ kehadiran: 33, partisipasi: 33, tugas: 40, sessionsCount: 3 });
    expect(row.detailKehadiran).toEqual([
      { sessionNumber: 1, hadir: true },
      { sessionNumber: 2, hadir: false },
      { sessionNumber: 3, hadir: false },
    ]);
    expect(row.detailTugas[0]).toMatchObject({ sessionNumber: 1, grade: 80, feedback: "good" });
    expect(row.detailTugas[1]).toMatchObject({ sessionNumber: 2, grade: null });
    expect(row.detailTugas[2]).toMatchObject({ sessionNumber: 3, grade: null });

    const scoped = await api<any>(`/api/elearning/grades?setupId=${setupId}`, { token: studentToken });
    expect(scoped.data.data).toHaveLength(1);
    expect(scoped.data.data[0].id).toBe(studentId);
  });
});

describe("elearning grades empty branches", () => {
  test("uses eight sessions without course and builds all-false details", async () => {
    const noCourse = await db.insert(models.elearningSetups).values({
      kelas, mapel: `No Course ${Date.now()}`, tutorId, skk: 1, jumlahSesi: 0, semester: "Ganjil",
    }).returning().get();
    const result = await api<any>(`/api/elearning/grades?setupId=${noCourse.id}`, { token: adminToken });
    const row = result.data.data.find((item: any) => item.id === studentId);
    expect(row.sessionsCount).toBe(8);
    expect(row).toMatchObject({ kehadiran: 0, partisipasi: 0, tugas: 0, final: 0, predikat: "E" });
    expect(row.detailKehadiran).toHaveLength(8);
    expect(row.detailKehadiran.every((item: any) => item.hadir === false)).toBe(true);
  });

  test("renders a real session without an assignment", async () => {
    const mapel = `No Assignment ${Date.now()}`;
    const setup = await db.insert(models.elearningSetups).values({
      kelas, mapel, tutorId, skk: 1, jumlahSesi: 1, semester: "Ganjil",
    }).returning().get();
    const course = await db.insert(models.elearningCourses).values({ namaMapel: mapel, program: "Paket C" }).returning().get();
    await db.insert(models.elearningSessions).values({ courseId: course.id, sessionNumber: 1, title: "No assignment" }).run();
    const result = await api<any>(`/api/elearning/grades?setupId=${setup.id}`, { token: adminToken });
    const row = result.data.data.find((item: any) => item.id === studentId);
    expect(row.detailTugas).toEqual([{ sessionNumber: 1, grade: null, feedback: null }]);
  });
});

describe("elearning dashboard stats", () => {
  test("tutor stats covers setup/course/submission joins and empty tutor", async () => {
    expect((await api("/api/elearning/tutor-stats")).response.status).toBe(401);
    expect((await api("/api/elearning/tutor-stats", { token: studentToken })).response.status).toBe(403);
    const stats = await api<any>("/api/elearning/tutor-stats", { token: tutorToken });
    expect(stats.data.data.mapelAktif).toBeGreaterThanOrEqual(1);
    expect(stats.data.data.tugasMasuk).toBeGreaterThanOrEqual(2);
    expect(stats.data.data).toMatchObject({ ip: "0.0" });

    const emptyTutor = await createTutor({ plainPassword: "empty-monitor-tutor" });
    const emptyToken = await login(emptyTutor.email, "empty-monitor-tutor");
    expect((await api<any>("/api/elearning/tutor-stats", { token: emptyToken })).data.data)
      .toMatchObject({ mapelAktif: 0, tugasMasuk: 0 });
  });

  test("student stats handles assigned and unassigned students", async () => {
    expect((await api("/api/elearning/siswa-stats")).response.status).toBe(401);
    const assignedStats = (await api<any>("/api/elearning/siswa-stats", { token: studentToken })).data.data;
    expect(assignedStats.mapelAktif).toBeGreaterThanOrEqual(1);
    expect(assignedStats).toMatchObject({ tugasMasuk: 0, ip: "0.0" });

    const noRombel = await createStudent({ plainPassword: "empty-monitor-student" });
    const emptyToken = await login(noRombel.email, "empty-monitor-student");
    expect((await api<any>("/api/elearning/siswa-stats", { token: emptyToken })).data.data)
      .toMatchObject({ mapelAktif: 0, tugasMasuk: 0 });
  });
});
