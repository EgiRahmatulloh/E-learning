import { beforeAll, describe, expect, test } from "bun:test";
import { api, login } from "../helpers/in-process-app";
import { createManager } from "../helpers/db-fixtures";

let token: string;

beforeAll(async () => {
  const admin = await createManager({ plainPassword: "elearn-admin" });
  token = await login(admin.email, "elearn-admin");
});

describe("elearning course and activity", () => {
  test("course/session dibuat idempotent dan sesi dapat disanitasi", async () => {
    const course = await api<any>("/api/elearning/course", {
      method: "POST",
      token,
      json: { subjectName: "Matematika E2E", program: "PAKET C", kelas: "10" },
    });
    expect(course.response.status).toBe(200);
    const courseId = course.data.data.id;

    const same = await api<any>("/api/elearning/course", {
      method: "POST",
      token,
      json: { subjectName: "Matematika E2E", program: "PAKET C", kelas: "10" },
    });
    expect(same.data.data.id).toBe(courseId);

    const session = await api<any>(
      `/api/elearning/session?courseId=${courseId}&sessionNumber=1`,
      { token },
    );
    expect(session.response.status).toBe(200);
    const sessionId = session.data.data.session.id;

    const update = await api<any>(`/api/elearning/session/${sessionId}`, {
      method: "PUT",
      token,
      json: { description: "<script>x</script><p>Materi</p>" },
    });
    expect(update.response.status).toBe(200);

    const fetched = await api<any>(
      `/api/elearning/session?courseId=${courseId}&sessionNumber=1`,
      { token },
    );
    expect(fetched.data.data.session.description).not.toContain("<script>");
  });

  test("material mendukung upsert dan auth", async () => {
    expect(
      (await api("/api/elearning/material", {
        method: "POST",
        json: { sessionId: 1, title: "X", type: "PDF", fileUrl: "" },
      })).response.status,
    ).toBe(401);

    const course = await api<any>("/api/elearning/course", {
      method: "POST",
      token,
      json: { subjectName: "IPA Material", program: "PAKET B" },
    });
    const session = await api<any>(
      `/api/elearning/session?courseId=${course.data.data.id}&sessionNumber=2`,
      { token },
    );
    const sessionId = session.data.data.session.id;

    const created = await api<any>("/api/elearning/material", {
      method: "POST",
      token,
      json: { sessionId, title: "Modul", type: "PDF", fileUrl: "/api/files/priv-modul.pdf" },
    });
    expect(created.response.status).toBe(200);

    const updated = await api<any>("/api/elearning/material", {
      method: "POST",
      token,
      json: { sessionId, title: "Modul Baru", type: "PDF", fileUrl: "/api/files/priv-new.pdf" },
    });
    expect(updated.response.status).toBe(200);
  });

  test("endpoint activity menolak akses tanpa token", async () => {
    for (const [path, method] of [
      ["/api/elearning/forum", "GET"],
      ["/api/elearning/attendance?sessionId=1", "GET"],
      ["/api/elearning/quiz/1", "GET"],
      ["/api/elearning/completions/1", "GET"],
      ["/api/elearning/tutor-attendance", "GET"],
      ["/api/elearning/submissions/1", "GET"],
    ]) {
      const result = await api(path, { method });
      expect([400, 401, 422]).toContain(result.response.status);
    }
  });
});
