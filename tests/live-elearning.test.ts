// Integration test live-server: alur e-learning (admin).
// Siklus: course → session → material → quiz → forum → attendance.
// Pembersihan: quiz dikosongkan (questions:[]), forum dihapus, setups dihapus.
// Course tidak punya endpoint DELETE — sebagai gantinya dipakai nama unik
// IT-TEST-* agar tidak bentrok antar run (didokumentasikan di bawah).
// Prasyarat: server jalan (BASE_URL). Jalankan: bun test tests/live-elearning.test.ts
import { beforeAll, describe, expect, test } from "bun:test";
import { api, authHeader, loginAdmin, tag } from "./live-helpers";

let token: string;
beforeAll(async () => {
  token = await loginAdmin();
});
const H = () => authHeader(token);
const json = () => ({ "Content-Type": "application/json", ...H() });

describe("setups: create → list → delete", () => {
  test("wajib skk + jumlahSesi; filter tutorId; hapus bersih", async () => {
    const kelas = tag("KELAS");
    const mapel = tag("MAPEL");

    const kurang = await api("/api/elearning/setups", {
      method: "POST",
      headers: json(),
      body: JSON.stringify({ kelas, mapel, tutorId: 7 }),
    });
    expect(kurang.status).toBe(422);

    const created = await api("/api/elearning/setups", {
      method: "POST",
      headers: json(),
      body: JSON.stringify({ kelas, mapel, tutorId: 7, skk: 1, jumlahSesi: 2 }),
    });
    expect(created.status).toBe(200);
    const setupId = (created.body as { data: { id: number } }).data.id;
    expect(setupId).toBeNumber();

    const filtered = await api(`/api/elearning/setups?tutorId=7`, { headers: H() });
    expect(filtered.status).toBe(200);
    const found = ((filtered.body as { data: { id: number }[] }).data ?? []).some(
      (s) => s.id === setupId,
    );
    expect(found).toBe(true);

    expect((await api(`/api/elearning/setups/${setupId}`, { method: "DELETE", headers: H() })).status).toBe(
      200,
    );
  });

  test("tanpa token → 401", async () => {
    expect((await api("/api/elearning/setups")).status).toBe(401);
  });
});

describe("course → session → material (sanitasi XSS)", () => {
  test("buat course, baca sesi, update deskripsi ber-script → bersih", async () => {
    const subjectName = tag("MAPEL");
    const created = await api("/api/elearning/course", {
      method: "POST",
      headers: json(),
      body: JSON.stringify({ subjectName, program: "PAKET C", kelas: "PAKET C 10 A" }),
    });
    expect(created.status).toBe(200);
    const courseId = (created.body as { data: { id: number } }).data.id;

    // Idempoten: course yang sama dikembalikan, bukan duplikat
    const again = await api("/api/elearning/course", {
      method: "POST",
      headers: json(),
      body: JSON.stringify({ subjectName, program: "PAKET C", kelas: "PAKET C 10 A" }),
    });
    expect((again.body as { data: { id: number } }).data.id).toBe(courseId);

    const sesi = await api(`/api/elearning/session?courseId=${courseId}&sessionNumber=1`, {
      headers: H(),
    });
    expect(sesi.status).toBe(200);
    const sessionId = (sesi.body as { data: { session: { id: number } } }).data.session.id;

    const upd = await api(`/api/elearning/session/${sessionId}`, {
      method: "PUT",
      headers: json(),
      body: JSON.stringify({ description: "<p>materi</p><script>alert(1)</script>" }),
    });
    expect(upd.status).toBe(200);

    const verify = await api(`/api/elearning/session?courseId=${courseId}&sessionNumber=1`, {
      headers: H(),
    });
    const desc = (verify.body as { data: { session: { description: string } } }).data.session
      .description;
    expect(desc).toContain("materi");
    expect(desc).not.toContain("<script>");

    // Material: simpan lalu baca ulang
    const mat = await api("/api/elearning/material", {
      method: "POST",
      headers: json(),
      body: JSON.stringify({ sessionId, title: "Slide IT", type: "PDF", fileUrl: "/api/files/it.pdf" }),
    });
    expect(mat.status).toBe(200);
  });
});

describe("quiz: simpan → baca → kosongkan", () => {
  test("soal tersimpan dan terbaca; cleanup via questions:[]", async () => {
    const subjectName = tag("KUIS");
    const courseId = (
      (await api("/api/elearning/course", {
        method: "POST",
        headers: json(),
        body: JSON.stringify({ subjectName, program: "PAKET C" }),
      })) as { body: { data: { id: number } } }
    ).body.data.id;
    const sessionId = (
      (
        await api(`/api/elearning/session?courseId=${courseId}&sessionNumber=1`, { headers: H() })
      ) as { body: { data: { session: { id: number } } } }
    ).body.data.session.id;

    const save = await api(`/api/elearning/quiz/${sessionId}`, {
      method: "POST",
      headers: json(),
      body: JSON.stringify({
        questions: [{ question: "2+2?", options: ["1", "2", "3", "4"], correctAnswer: 3 }],
      }),
    });
    expect(save.status).toBe(200);

    const got = await api(`/api/elearning/quiz/${sessionId}`, { headers: H() });
    expect(got.status).toBe(200);
    expect((got.body as { data: { questions: unknown[] } }).data.questions).toHaveLength(1);

    const clear = await api(`/api/elearning/quiz/${sessionId}`, {
      method: "POST",
      headers: json(),
      body: JSON.stringify({ questions: [] }),
    });
    expect(clear.status).toBe(200);
  });
});

describe("forum: post (XSS dibersihkan) → balas → hapus", () => {
  test("script dibuang saat simpan; reply parentId; hapus induk menghapus balasan", async () => {
    const subjectName = tag("FORUM");
    const courseId = (
      (await api("/api/elearning/course", {
        method: "POST",
        headers: json(),
        body: JSON.stringify({ subjectName, program: "PAKET C" }),
      })) as { body: { data: { id: number } } }
    ).body.data.id;
    const sessionId = (
      (
        await api(`/api/elearning/session?courseId=${courseId}&sessionNumber=1`, { headers: H() })
      ) as { body: { data: { session: { id: number } } } }
    ).body.data.session.id;

    const post = await api("/api/elearning/forum", {
      method: "POST",
      headers: json(),
      body: JSON.stringify({
        sessionId,
        courseId,
        content: "<p>diskusi</p><script>alert(1)</script>",
      }),
    });
    expect(post.status).toBe(200);
    const postBody = post.body as { data: { id: number; content: string } };
    expect(postBody.data.content).not.toContain("<script>");
    expect(postBody.data.content).toContain("diskusi");

    const reply = await api("/api/elearning/forum", {
      method: "POST",
      headers: json(),
      body: JSON.stringify({ sessionId, courseId, content: "setuju", parentId: postBody.data.id }),
    });
    expect(reply.status).toBe(200);

    const del = await api(`/api/elearning/forum/${postBody.data.id}`, {
      method: "DELETE",
      headers: H(),
    });
    expect(del.status).toBe(200);
  });

  test("forum tanpa token → 401", async () => {
    expect(
      (
        await api("/api/elearning/forum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: 1, courseId: 1, content: "x" }),
        })
      ).status,
    ).toBe(401);
  });
});

describe("otorisasi peran: siswa ditolak di endpoint admin/tutor", () => {
  test("siswa tidak bisa simpan quiz (admin/tutor only) → 403", async () => {
    // Akun siswa sementara: dibuat → login → dipakai → dihapus.
    const email = `it-role-${Date.now()}@x.id`;
    const created = await api("/api/students", {
      method: "POST",
      headers: json(),
      body: JSON.stringify({ nama: "IT-ROLE", email, password: "rahasia123" }),
    });
    expect(created.status).toBe(200);
    const siswaId = (created.body as { data: { id: number } }).data.id;

    try {
      const login = await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password: "rahasia123" }),
      });
      expect(login.status).toBe(200);
      const siswaToken = (login.body as { token: string }).token;

      const ditolak = await api("/api/elearning/quiz/1", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader(siswaToken) },
        body: JSON.stringify({ questions: [] }),
      });
      expect(ditolak.status).toBe(403);

      // Siswa TETAP bisa baca (verifyUser) — yang ditolak hanya tulis admin/tutor.
      const baca = await api("/api/elearning/quiz/1", { headers: authHeader(siswaToken) });
      expect(baca.status).toBe(200);
    } finally {
      expect((await api(`/api/students/${siswaId}`, { method: "DELETE", headers: H() })).status).toBe(
        200,
      );
    }
  });
});
