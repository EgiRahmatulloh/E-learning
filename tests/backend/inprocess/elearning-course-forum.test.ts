import { beforeAll, describe, expect, test } from "bun:test";
import { api, db, login, models, signToken } from "../helpers/in-process-app";
import { createManager, createStudent, createTutor } from "../helpers/db-fixtures";

let adminToken: string;
let tutorToken: string;
let studentToken: string;
let otherStudentToken: string;
let tutorId: number;
let studentId: number;

async function createCourse(subjectName: string, body: Record<string, unknown> = {}) {
  const result = await api<any>("/api/elearning/course", {
    method: "POST",
    token: adminToken,
    json: { subjectName, program: "PAKET C", kelas: "10", ...body },
  });
  expect(result.response.status).toBe(200);
  return result.data.data as { id: number; program: string; kelas: string };
}

async function createSession(courseId: number, sessionNumber = 1) {
  const result = await api<any>(
    `/api/elearning/session?courseId=${courseId}&sessionNumber=${sessionNumber}`,
    { token: adminToken },
  );
  expect(result.response.status).toBe(200);
  return result.data.data.session as { id: number; description: string };
}

beforeAll(async () => {
  const admin = await createManager({ plainPassword: "course-forum-admin" });
  adminToken = await login(admin.email, "course-forum-admin");
  const tutor = await createTutor({ plainPassword: "course-forum-tutor" });
  tutorId = tutor.id;
  tutorToken = await login(tutor.email, "course-forum-tutor");
  const student = await createStudent({ plainPassword: "course-forum-student" });
  studentId = student.id;
  studentToken = await login(student.email, "course-forum-student");
  const otherStudent = await createStudent({ plainPassword: "course-forum-other" });
  otherStudentToken = await login(otherStudent.email, "course-forum-other");
});

describe("course API in-process", () => {
  test("course handles auth, schema validation, setup derivation, fallback, and reuse", async () => {
    expect(
      (await api("/api/elearning/course", {
        method: "POST",
        json: { subjectName: "Unauthorized" },
      })).response.status,
    ).toBe(401);
    expect(
      (await api("/api/elearning/course", { method: "POST", token: adminToken, json: {} })).response.status,
    ).toBe(422);

    const setup = await db.insert(models.elearningSetups).values({
      kelas: "PAKET B 8 A",
      mapel: "Bahasa",
      tutorId,
      skk: 1,
      jumlahSesi: 2,
      semester: "Ganjil",
    }).returning().get();
    const derived = await createCourse(`COURSE-DERIVED-${Date.now()}`, {
      program: "IGNORED",
      kelas: "IGNORED",
      setupId: setup.id,
    });
    expect(derived.program).toBe("Paket B");
    expect(derived.kelas).toBe("PAKET B 8 A");

    const fallbackName = `COURSE-FALLBACK-${Date.now()}`;
    const fallback = await createCourse(fallbackName, { program: undefined, kelas: undefined, setupId: 999999 });
    expect(fallback.program).toBe("");
    expect(fallback.kelas).toBe("");
    expect((await createCourse(fallbackName, { program: undefined, kelas: undefined })).id).toBe(fallback.id);
  });

  test("session covers create, existing session, materials, and validation", async () => {
    expect((await api("/api/elearning/session?courseId=1&sessionNumber=1")).response.status).toBe(401);
    expect((await api("/api/elearning/session", { token: adminToken })).response.status).toBe(422);

    const course = await createCourse(`SESSION-${Date.now()}`);
    const session = await createSession(course.id, 2);
    expect(session.description).toBe("");
    await db.insert(models.elearningMaterials).values({
      sessionId: session.id,
      title: "Modul",
      type: "PDF",
      fileUrl: "https://example.test/modul.pdf",
    }).run();
    const existing = await api<any>(`/api/elearning/session?courseId=${course.id}&sessionNumber=2`, {
      token: studentToken,
    });
    expect(existing.data.data.session.id).toBe(session.id);
    expect(existing.data.data.materials).toHaveLength(1);

    const conflictCourse = await createCourse(`SESSION-CONFLICT-${Date.now()}`);
    await db.insert(models.elearningSessions).values({
      courseId: conflictCourse.id,
      sessionNumber: 3,
      title: "Concurrent session",
    }).run();
    const selected = await createSession(conflictCourse.id, 3);
    expect(selected.title).toBe("Concurrent session");
  });

  test("session update sanitizes all fields, supports no-op, role checks, and validation", async () => {
    const course = await createCourse(`SESSION-UPDATE-${Date.now()}`);
    const session = await createSession(course.id);

    expect(
      (await api(`/api/elearning/session/${session.id}`, { method: "PUT", json: {} })).response.status,
    ).toBe(401);
    expect(
      (await api(`/api/elearning/session/${session.id}`, { method: "PUT", token: studentToken, json: {} })).response.status,
    ).toBe(403);
    expect(
      (await api(`/api/elearning/session/${session.id}`, {
        method: "PUT",
        token: tutorToken,
        json: { description: 123 },
      })).response.status,
    ).toBe(422);

    const updated = await api(`/api/elearning/session/${session.id}`, {
      method: "PUT",
      token: tutorToken,
      json: {
        description: "<script>x</script><p>Deskripsi</p>",
        tujuanPembelajaran: "<script>x</script><b>Tujuan</b>",
        uraianKegiatan: "<script>x</script><u>Uraian</u>",
        startDate: "2026-09-01",
        endDate: "2026-09-02",
      },
    });
    expect(updated.response.status).toBe(200);
    const row = await db.select().from(models.elearningSessions).where(
      (await import("drizzle-orm")).eq(models.elearningSessions.id, session.id),
    ).get();
    expect(row?.description).toBe("<p>Deskripsi</p>");
    expect(row?.tujuanPembelajaran).toBe("<b>Tujuan</b>");
    expect(row?.uraianKegiatan).toBe("<u>Uraian</u>");
    expect(row?.startDate).toBe("2026-09-01");

    expect(
      (await api(`/api/elearning/session/${session.id}`, { method: "PUT", token: adminToken, json: {} })).response.status,
    ).toBe(200);
  });

  test("material creates and replaces each type with auth and schema validation", async () => {
    const course = await createCourse(`MATERIAL-${Date.now()}`);
    const session = await createSession(course.id);
    const valid = { sessionId: session.id, title: "Modul", type: "PDF", fileUrl: "https://example.test/a.pdf" };

    expect((await api("/api/elearning/material", { method: "POST", json: valid })).response.status).toBe(401);
    expect(
      (await api("/api/elearning/material", { method: "POST", token: studentToken, json: valid })).response.status,
    ).toBe(403);
    expect(
      (await api("/api/elearning/material", { method: "POST", token: tutorToken, json: { sessionId: session.id } })).response.status,
    ).toBe(422);
    expect(
      (await api("/api/elearning/material", { method: "POST", token: tutorToken, json: valid })).response.status,
    ).toBe(200);
    expect(
      (await api("/api/elearning/material", {
        method: "POST",
        token: tutorToken,
        json: { ...valid, title: "Modul Baru", fileUrl: "https://example.test/b.pdf" },
      })).response.status,
    ).toBe(200);
    const rows = await db.select().from(models.elearningMaterials).all();
    const matching = rows.filter((row) => row.sessionId === session.id && row.type === "PDF");
    expect(matching).toHaveLength(1);
    expect(matching[0].title).toBe("Modul Baru");
  });

  test("evaluations support read and update/insert/delete/no-change flows with role validation", async () => {
    expect((await api("/api/elearning/evaluations")).response.status).toBe(401);
    expect((await api("/api/elearning/evaluations", { token: studentToken })).response.status).toBe(200);
    expect(
      (await api("/api/elearning/evaluations", { method: "POST", token: studentToken, json: { questions: [] } })).response.status,
    ).toBe(403);
    expect(
      (await api("/api/elearning/evaluations", { method: "POST", token: adminToken, json: { questions: "bad" } })).response.status,
    ).toBe(422);

    await db.delete(models.elearningEvaluations).run();
    const save = (questions: { text: string }[]) => api("/api/elearning/evaluations", {
      method: "POST",
      token: adminToken,
      json: { questions },
    });
    expect((await save([{ text: "Q1" }, { text: "Q2" }])).response.status).toBe(200);
    expect((await save([{ text: "Q1 changed" }, { text: "Q2" }, { text: "Q3" }])).response.status).toBe(200);
    expect((await save([{ text: "Q1 changed" }])).response.status).toBe(200);
    expect((await save([])).response.status).toBe(200);
  });

  test("evaluation responses cover empty and aggregated results including zero responses", async () => {
    expect((await api("/api/elearning/evaluation-responses")).response.status).toBe(401);
    expect((await api("/api/elearning/evaluation-responses", { token: studentToken })).response.status).toBe(403);
    await db.delete(models.elearningSessionAngkets).run();
    await db.delete(models.elearningEvaluations).run();

    const empty = await api<any>("/api/elearning/evaluation-responses", { token: adminToken });
    expect(empty.data.data).toEqual({ evaluations: [], responses: [], aggregated: [] });

    const course = await createCourse(`EVAL-RESP-${Date.now()}`);
    const session = await createSession(course.id);
    const evaluations = await db.insert(models.elearningEvaluations).values([
      { sessionId: 0, question: "Answered", scaleMax: 5 },
      { sessionId: 0, question: "Unanswered", scaleMax: 5 },
    ]).returning();
    await db.insert(models.elearningSessionAngkets).values({
      sessionId: session.id,
      studentId,
      evaluationId: evaluations[0].id,
      score: 4,
    }).run();

    const result = await api<any>("/api/elearning/evaluation-responses", { token: adminToken });
    expect(result.data.data.responses[0].studentName).toBeDefined();
    expect(result.data.data.aggregated).toEqual(expect.arrayContaining([
      expect.objectContaining({ question: "Answered", responseCount: 1, avgScore: 4 }),
      expect.objectContaining({ question: "Unanswered", responseCount: 0, avgScore: 0 }),
    ]));
  });
});

async function makeForumContext() {
  const course = await createCourse(`FORUM-${Date.now()}-${Math.random()}`);
  const session = await createSession(course.id);
  return { courseId: course.id, sessionId: session.id };
}

async function postForum(token: string, courseId: number, sessionId: number, content: string, parentId?: number) {
  return api<any>("/api/elearning/forum", {
    method: "POST",
    token,
    json: { courseId, sessionId, content, ...(parentId === undefined ? {} : { parentId }) },
  });
}

describe("forum API in-process", () => {
  test("GET validates selector/auth and enriches tutor, student, and unknown authors", async () => {
    expect((await api("/api/elearning/forum?courseId=1")).response.status).toBe(401);
    const { courseId, sessionId } = await makeForumContext();
    expect((await api("/api/elearning/forum", { token: studentToken })).data).toMatchObject({ success: false });

    await postForum(tutorToken, courseId, sessionId, "Tutor post");
    await postForum(studentToken, courseId, sessionId, "Student post");
    await db.insert(models.elearningForumPosts).values({
      courseId,
      sessionId,
      authorId: 999999,
      authorRole: "admin",
      content: "Unknown post",
    }).run();

    const bySession = await api<any>(`/api/elearning/forum?sessionId=${sessionId}`, { token: studentToken });
    expect(bySession.data.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ authorRole: "tutor", authorName: "Tutor Test" }),
      expect.objectContaining({ authorRole: "siswa", authorName: "Siswa Test" }),
      expect.objectContaining({ authorRole: "admin", authorName: "Unknown", authorFoto: null }),
    ]));
    const byCourse = await api<any>(`/api/elearning/forum?courseId=${courseId}`, { token: studentToken });
    expect(byCourse.data.data).toHaveLength(3);

    const empty = await makeForumContext();
    expect((await api<any>(`/api/elearning/forum?sessionId=${empty.sessionId}`, { token: studentToken })).data.data).toEqual([]);
  });

  test("POST validates body/auth, sanitizes content, and stores root/reply parent values", async () => {
    const { courseId, sessionId } = await makeForumContext();
    const valid = { courseId, sessionId, content: "hello" };
    expect((await api("/api/elearning/forum", { method: "POST", json: valid })).response.status).toBe(401);
    expect(
      (await api("/api/elearning/forum", { method: "POST", token: studentToken, json: { courseId, sessionId } })).response.status,
    ).toBe(422);

    const root = await postForum(studentToken, courseId, sessionId, "<script>x</script><p style='color:red'>Root</p>", null as any);
    expect(root.response.status).toBe(200);
    expect(root.data.data.content).not.toContain("script");
    expect(root.data.data.parentId).toBeNull();
    const reply = await postForum(tutorToken, courseId, sessionId, "Reply", root.data.data.id);
    expect(reply.data.data.parentId).toBe(root.data.data.id);
  });

  test("PUT covers not-found, ownership, role mismatch, admin moderation, sanitization, and validation", async () => {
    const { courseId, sessionId } = await makeForumContext();
    const post = await postForum(studentToken, courseId, sessionId, "Original");
    const id = post.data.data.id;

    expect((await api(`/api/elearning/forum/${id}`, { method: "PUT", json: { content: "x" } })).response.status).toBe(401);
    expect(
      (await api(`/api/elearning/forum/${id}`, { method: "PUT", token: studentToken, json: {} })).response.status,
    ).toBe(422);
    expect(
      (await api("/api/elearning/forum/999999", { method: "PUT", token: studentToken, json: { content: "x" } })).response.status,
    ).toBe(404);
    expect(
      (await api(`/api/elearning/forum/${id}`, { method: "PUT", token: otherStudentToken, json: { content: "x" } })).response.status,
    ).toBe(403);

    const forgedRoleToken = await signToken({
      id: studentId,
      username: "forged@test.local",
      role: "tutor",
      name: "Forged",
      email: "forged@test.local",
    });
    expect(
      (await api(`/api/elearning/forum/${id}`, { method: "PUT", token: forgedRoleToken, json: { content: "x" } })).response.status,
    ).toBe(403);

    const own = await api<any>(`/api/elearning/forum/${id}`, {
      method: "PUT",
      token: studentToken,
      json: { content: "<script>x</script><u>Own</u>" },
    });
    expect(own.data.data.content).toBe("<u>Own</u>");
    const moderated = await api<any>(`/api/elearning/forum/${id}`, {
      method: "PUT",
      token: adminToken,
      json: { content: "Admin edit" },
    });
    expect(moderated.response.status).toBe(200);
  });

  test("DELETE covers not-found, ownership, admin moderation, leaf and recursive reply removal", async () => {
    const { courseId, sessionId } = await makeForumContext();
    expect((await api("/api/elearning/forum/999999", { method: "DELETE", token: studentToken })).response.status).toBe(404);

    const forbidden = await postForum(studentToken, courseId, sessionId, "Forbidden");
    expect(
      (await api(`/api/elearning/forum/${forbidden.data.data.id}`, { method: "DELETE", token: otherStudentToken })).response.status,
    ).toBe(403);
    expect(
      (await api(`/api/elearning/forum/${forbidden.data.data.id}`, { method: "DELETE", token: adminToken })).response.status,
    ).toBe(200);

    const leaf = await postForum(studentToken, courseId, sessionId, "Leaf");
    expect(
      (await api(`/api/elearning/forum/${leaf.data.data.id}`, { method: "DELETE", token: studentToken })).response.status,
    ).toBe(200);

    const root = await postForum(studentToken, courseId, sessionId, "Root");
    const child = await postForum(tutorToken, courseId, sessionId, "Child", root.data.data.id);
    const grandchild = await postForum(studentToken, courseId, sessionId, "Grandchild", child.data.data.id);
    expect(
      (await api(`/api/elearning/forum/${root.data.data.id}`, { method: "DELETE", token: studentToken })).response.status,
    ).toBe(200);
    const remaining = await api<any>(`/api/elearning/forum?courseId=${courseId}`, { token: studentToken });
    const remainingIds = remaining.data.data.map((row: any) => row.id);
    expect(remainingIds).not.toContain(root.data.data.id);
    expect(remainingIds).not.toContain(child.data.data.id);
    expect(remainingIds).not.toContain(grandchild.data.data.id);
  });
});
