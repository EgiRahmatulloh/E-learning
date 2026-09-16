import { beforeAll, describe, expect, test } from "bun:test";
import { and, eq } from "drizzle-orm";
import { api, db, models, signToken } from "../helpers/in-process-app";
import {
  assignStudent,
  createCourse,
  createRombel,
  createSession,
  createStudent,
  createTutor,
} from "../helpers/db-fixtures";

let adminToken: string;
let tutorToken: string;
let studentToken: string;
let outsiderToken: string;
let tutorId: number;
let studentId: number;
let outsiderId: number;
let secondStudentId: number;
let setupId: number;
let session1Id: number;
let session2Id: number;
let evaluation1Id: number;
let evaluation2Id: number;
let evaluationWithoutResponsesId: number;

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const kelas = `PAKET C 10 ANGKET ${suffix}`;
const mapel = `MAPEL ANGKET ${suffix}`;

async function makeSetup(overrides: Record<string, unknown> = {}) {
  return db
    .insert(models.elearningSetups)
    .values({
      kelas,
      mapel,
      tutorId,
      skk: 1,
      jumlahSesi: 2,
      semester: "Ganjil",
      isAngketApproved: true,
      ...overrides,
    } as any)
    .returning()
    .get();
}

beforeAll(async () => {
  const tutor = await createTutor({ plainPassword: `tutor-${suffix}` });
  tutorId = tutor.id;
  const student = await createStudent({ plainPassword: `student-${suffix}`, kelas });
  studentId = student.id;
  const outsider = await createStudent({ plainPassword: `outsider-${suffix}`, kelas: "PAKET C 11 OUTSIDER" });
  outsiderId = outsider.id;
  const second = await createStudent({ plainPassword: `second-${suffix}`, kelas });
  secondStudentId = second.id;

  adminToken = await signToken({
    id: 900001, username: `admin-${suffix}@test.local`, role: "admin",
    name: "Admin Angket", email: `admin-${suffix}@test.local`,
  });
  tutorToken = await signToken({ id: tutorId, username: tutor.email, role: "tutor", name: tutor.nama, email: tutor.email });
  studentToken = await signToken({ id: studentId, username: student.email, role: "siswa", name: student.nama, email: student.email });
  outsiderToken = await signToken({ id: outsiderId, username: outsider.email, role: "siswa", name: outsider.nama, email: outsider.email });

  const rombel = await createRombel({ nama: kelas });
  await assignStudent(rombel.id, studentId);
  await assignStudent(rombel.id, secondStudentId);
  const course = await createCourse({ namaMapel: mapel, program: "Paket C", kelas });
  session1Id = (await createSession(course.id, { sessionNumber: 1, title: "Sesi Angket 1" })).id;
  session2Id = (await createSession(course.id, { sessionNumber: 2, title: "Sesi Angket 2" })).id;
  setupId = (await makeSetup()).id;

  evaluation1Id = (await db.insert(models.elearningEvaluations).values({ sessionId: 0, question: `Kejelasan ${suffix}`, scaleMax: 5 }).returning().get()).id;
  evaluation2Id = (await db.insert(models.elearningEvaluations).values({ sessionId: 0, question: `Ketepatan ${suffix}`, scaleMax: 5 }).returning().get()).id;
  evaluationWithoutResponsesId = (await db.insert(models.elearningEvaluations).values({ sessionId: 0, question: `Kosong ${suffix}`, scaleMax: 5 }).returning().get()).id;
});

describe("session angket authorization and validation", () => {
  test("all routes reject requests without authentication and scores reject siswa", async () => {
    for (const [path, method, json] of [
      [`/api/elearning/session-angket/progress?setupId=${setupId}`, "GET", undefined],
      [`/api/elearning/session-angket?sessionId=${session1Id}`, "GET", undefined],
      ["/api/elearning/session-angket", "POST", { sessionId: session1Id, responses: [] }],
      [`/api/elearning/angket-tutor-scores?setupId=${setupId}`, "GET", undefined],
    ] as const) {
      const result = await api(path, { method, ...(json ? { json } : {}) });
      expect(result.response.status).toBe(401);
    }
    expect((await api(`/api/elearning/angket-tutor-scores?setupId=${setupId}`, { token: studentToken })).response.status).toBe(403);
  });

  test("schema rejects missing or malformed POST body fields", async () => {
    expect((await api("/api/elearning/session-angket", { method: "POST", token: studentToken, json: { sessionId: session1Id } })).response.status).toBe(422);
    expect((await api("/api/elearning/session-angket", { method: "POST", token: studentToken, json: { sessionId: session1Id, responses: [{}] } })).response.status).toBe(422);
  });
});

describe("session angket progress", () => {
  test("non-siswa receives an empty progress list", async () => {
    const result = await api<any>(`/api/elearning/session-angket/progress?setupId=${setupId}`, { token: adminToken });
    expect(result.data).toEqual({ success: true, data: [] });
  });

  test("returns setup not-found and rejects students outside the setup rombel", async () => {
    const missing = await api<any>("/api/elearning/session-angket/progress?setupId=99999999", { token: studentToken });
    expect(missing.response.status).toBe(404);
    expect(missing.data.message).toBe("Setup not found");

    const forbidden = await api<any>(`/api/elearning/session-angket/progress?setupId=${setupId}`, { token: outsiderToken });
    expect(forbidden.response.status).toBe(403);
    expect(forbidden.data.message).toContain("tidak terdaftar");
  });

  test("returns empty data when setup has no matching course and when its course has no sessions", async () => {
    const noCourse = await makeSetup({ mapel: `NO COURSE ${suffix}` });
    expect((await api<any>(`/api/elearning/session-angket/progress?setupId=${noCourse.id}`, { token: studentToken })).data.data).toEqual([]);

    const emptyCourse = await createCourse({ namaMapel: `EMPTY COURSE ${suffix}`, program: "Paket C", kelas });
    const emptySetup = await makeSetup({ mapel: emptyCourse.namaMapel });
    expect((await api<any>(`/api/elearning/session-angket/progress?setupId=${emptySetup.id}`, { token: studentToken })).data.data).toEqual([]);
  });

  test("maps every course session and marks only submitted sessions complete", async () => {
    const initial = await api<any>(`/api/elearning/session-angket/progress?setupId=${setupId}`, { token: studentToken });
    expect(initial.data.data).toEqual([
      { sessionNumber: 1, completed: false },
      { sessionNumber: 2, completed: false },
    ]);

    await db.insert(models.elearningSessionAngkets).values({
      sessionId: session1Id, studentId, evaluationId: evaluation1Id, score: 4,
    }).run();
    const after = await api<any>(`/api/elearning/session-angket/progress?setupId=${setupId}`, { token: studentToken });
    expect(after.data.data).toEqual([
      { sessionNumber: 1, completed: true },
      { sessionNumber: 2, completed: false },
    ]);
  });
});

describe("session angket status", () => {
  test("non-siswa is always complete", async () => {
    expect((await api<any>(`/api/elearning/session-angket?sessionId=${session1Id}`, { token: tutorToken })).data.completed).toBe(true);
  });

  test("enforces matching setup rombel for a known session", async () => {
    const forbidden = await api<any>(`/api/elearning/session-angket?sessionId=${session1Id}`, { token: outsiderToken });
    expect(forbidden.response.status).toBe(403);
    expect(forbidden.data).toEqual({
      success: false,
      message: "Anda tidak terdaftar di kelas ini",
    });
  });

  test("reports false when the session has no matching setup and when the session is unknown", async () => {
    const unrelatedCourse = await createCourse({
      namaMapel: `STATUS WITHOUT SETUP ${suffix}`,
      program: "Paket C",
      kelas,
    });
    const unrelatedSession = await createSession(unrelatedCourse.id, { sessionNumber: 1 });
    expect((await api<any>(`/api/elearning/session-angket?sessionId=${unrelatedSession.id}`, { token: studentToken })).data.completed).toBe(false);
    expect((await api<any>("/api/elearning/session-angket?sessionId=99999999", { token: studentToken })).data.completed).toBe(false);
  });
});

describe("session angket submission", () => {
  test("only siswa can submit and class membership is enforced", async () => {
    const body = { sessionId: session2Id, responses: [{ evaluationId: evaluation1Id, score: 3 }] };
    const nonStudent = await api<any>("/api/elearning/session-angket", { method: "POST", token: tutorToken, json: body });
    expect(nonStudent.response.status).toBe(403);
    expect(nonStudent.data.message).toContain("Only siswa");

    const outsider = await api<any>("/api/elearning/session-angket", { method: "POST", token: outsiderToken, json: body });
    expect(outsider.response.status).toBe(403);
    expect(outsider.data.message).toContain("tidak terdaftar");
  });

  test("stores answers when a known session has no matching setup", async () => {
    const unrelatedCourse = await createCourse({
      namaMapel: `SUBMIT WITHOUT SETUP ${suffix}`,
      program: "Paket C",
      kelas,
    });
    const unrelatedSession = await createSession(unrelatedCourse.id, { sessionNumber: 1 });
    const result = await api<any>("/api/elearning/session-angket", {
      method: "POST", token: studentToken,
      json: { sessionId: unrelatedSession.id, responses: [{ evaluationId: evaluation1Id, score: 5 }] },
    });
    expect(result.response.status).toBe(200);
    expect((await api<any>(`/api/elearning/session-angket?sessionId=${unrelatedSession.id}`, { token: studentToken })).data.completed).toBe(true);
  });

  test("transaction stores all answers atomically and duplicate submissions are idempotent", async () => {
    const first = await api<any>("/api/elearning/session-angket", {
      method: "POST", token: studentToken,
      json: { sessionId: session2Id, responses: [
        { evaluationId: evaluation1Id, score: 2 },
        { evaluationId: evaluation2Id, score: 4 },
      ] },
    });
    expect(first.response.status).toBe(200);
    expect(first.data.message).toContain("berhasil");

    expect((await api("/api/elearning/session-angket", {
      method: "POST", token: studentToken,
      json: { sessionId: session2Id, responses: [
        { evaluationId: evaluation1Id, score: 5 },
        { evaluationId: evaluation2Id, score: 1 },
      ] },
    })).response.status).toBe(200);

    const rows = await db.select().from(models.elearningSessionAngkets).where(and(
      eq(models.elearningSessionAngkets.sessionId, session2Id),
      eq(models.elearningSessionAngkets.studentId, studentId),
    )).all();
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.evaluationId === evaluation1Id)?.score).toBe(2);
    expect(rows.find((row) => row.evaluationId === evaluation2Id)?.score).toBe(4);
  });

  test("an unknown session fails as one transaction and persists no answers", async () => {
    const result = await api<any>("/api/elearning/session-angket", {
      method: "POST", token: studentToken,
      json: { sessionId: 99999999, responses: [
        { evaluationId: evaluation1Id, score: 5 },
        { evaluationId: evaluation2Id, score: 5 },
      ] },
    });
    expect(result.response.status).toBe(500);
    expect(result.data.message).toBe("Terjadi kesalahan server");
    const rows = await db.select().from(models.elearningSessionAngkets).where(eq(models.elearningSessionAngkets.sessionId, 99999999)).all();
    expect(rows).toHaveLength(0);
  });
});

describe("angket tutor scores", () => {
  test("validates setupId, setup existence, and approval", async () => {
    expect((await api<any>("/api/elearning/angket-tutor-scores?setupId=abc", { token: tutorToken })).response.status).toBe(400);
    expect((await api<any>("/api/elearning/angket-tutor-scores?setupId=99999999", { token: tutorToken })).response.status).toBe(404);
    const locked = await makeSetup({ mapel: `LOCKED ${suffix}`, isAngketApproved: false });
    const response = await api<any>(`/api/elearning/angket-tutor-scores?setupId=${locked.id}`, { token: tutorToken });
    expect(response.response.status).toBe(403);
    expect(response.data.message).toContain("belum disetujui");
  });

  test("returns empty arrays for missing course, no sessions, and no enrolled students", async () => {
    const noCourse = await makeSetup({ mapel: `MISSING SCORE COURSE ${suffix}` });
    expect((await api<any>(`/api/elearning/angket-tutor-scores?setupId=${noCourse.id}`, { token: tutorToken })).data.data).toEqual([]);

    const emptyCourse = await createCourse({ namaMapel: `NO SCORE SESSIONS ${suffix}`, program: "Paket C", kelas });
    const noSessions = await makeSetup({ mapel: emptyCourse.namaMapel });
    expect((await api<any>(`/api/elearning/angket-tutor-scores?setupId=${noSessions.id}`, { token: adminToken })).data.data).toEqual([]);

    const noStudentsKelas = `PAKET C 12 EMPTY ${suffix}`;
    const course = await createCourse({ namaMapel: `NO SCORE STUDENTS ${suffix}`, program: "Paket C", kelas: noStudentsKelas });
    await createSession(course.id, { sessionNumber: 1 });
    const setup = await makeSetup({ kelas: noStudentsKelas, mapel: course.namaMapel });
    expect((await api<any>(`/api/elearning/angket-tutor-scores?setupId=${setup.id}`, { token: tutorToken })).data.data).toEqual([]);
  });

  test("aggregates only the selected class and rounds averages to two decimals", async () => {
    await db.insert(models.elearningSessionAngkets).values([
      { sessionId: session1Id, studentId: secondStudentId, evaluationId: evaluation1Id, score: 3 },
      { sessionId: session2Id, studentId: secondStudentId, evaluationId: evaluation1Id, score: 4 },
      { sessionId: session2Id, studentId: secondStudentId, evaluationId: evaluation2Id, score: 2 },
      // This student's score must not leak into the selected rombel aggregation.
      { sessionId: session2Id, studentId: outsiderId, evaluationId: evaluation1Id, score: 5 },
    ]).run();

    const result = await api<any>(`/api/elearning/angket-tutor-scores?setupId=${setupId}`, { token: tutorToken });
    expect(result.response.status).toBe(200);
    const byId = new Map(result.data.data.map((item: any) => [item.questionId, item]));
    expect(byId.get(evaluation1Id)).toMatchObject({
      question: `Kejelasan ${suffix}`, scaleMax: 5, responseCount: 4, avgScore: 3.25,
    });
    expect(byId.get(evaluation2Id)).toMatchObject({
      question: `Ketepatan ${suffix}`, scaleMax: 5, responseCount: 2, avgScore: 3,
    });
    expect(byId.get(evaluationWithoutResponsesId)).toMatchObject({
      question: `Kosong ${suffix}`, scaleMax: 5, responseCount: 0, avgScore: 0,
    });
  });
});