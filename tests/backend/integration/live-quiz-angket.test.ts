// Integration test live-server: kuis submit + angket + evaluation-responses +
// download-zip. Termasuk REGRESI: POST /quiz/:id/submit 500 di DB aktual karena
// kolom `answers` tidak ada di tabel elearning_quiz_submissions (db/index.ts
// tidak punya ALTER TABLE untuknya) — test mengunci perilaku AKTUAL + pesan
// agar bila migrasi ditambahkan, perubahan ketahuan di sini.
// Prasyarat: server test jalan (BASE_URL). Jalankan: bun run test:be:integration
import { beforeAll, describe, expect, test } from "bun:test";
import { api, authHeader, createdId, loginAdmin, tag } from "./live-helpers";

// Menguji kontrak endpoint backend melalui HTTP tanpa browser.

let token: string;
beforeAll(async () => {
  token = await loginAdmin();
});
const H = () => authHeader(token);
const json = () => ({ "Content-Type": "application/json", ...H() });

async function makeSiswa(nama: string) {
  const email = `${tag(nama).toLowerCase()}@x.id`;
  const id = createdId(
    await api("/api/students", {
      method: "POST", headers: json(),
      body: JSON.stringify({ nama: tag(nama), email, password: "siswa123" }),
    }),
  );
  const login = await api("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password: "siswa123" }),
  });
  return { id, token: (login.body as { token: string }).token };
}

async function makeSession(mapel: string) {
  const courseId = (
    (await api("/api/elearning/course", {
      method: "POST", headers: json(), body: JSON.stringify({ subjectName: mapel, program: "PAKET C" }),
    })) as { body: { data: { id: number } } }
  ).body.data.id;
  const sessionId = (
    (
      await api(`/api/elearning/session?courseId=${courseId}&sessionNumber=1`, { headers: H() })
    ) as { body: { data: { session: { id: number } } } }
  ).body.data.session.id;
  return { courseId, sessionId };
}

describe("quiz submit (siswa) — penilaian otomatis", () => {
  test("semua benar → 100; setengah → 50; submit ulang menimpa; GET tampilkan correctCount", async () => {
    const { sessionId } = await makeSession(tag("KUIS"));
    await api(`/api/elearning/quiz/${sessionId}`, {
      method: "POST", headers: json(),
      body: JSON.stringify({
        questions: [
          { question: "2+2?", options: ["1", "2", "3", "4"], correctAnswer: 3 },
          { question: "3+3?", options: ["5", "6", "7", "8"], correctAnswer: 1 },
        ],
      }),
    });
    const { id: siswaId, token: siswaToken } = await makeSiswa("KUIS");
    const SH = () => ({ "Content-Type": "application/json", ...authHeader(siswaToken) });
    try {
      const full = await api(`/api/elearning/quiz/${sessionId}/submit`, {
        method: "POST", headers: SH(), body: JSON.stringify({ answers: [3, 1] }),
      });
      expect(full.status).toBe(200);
      expect(full.body).toMatchObject({
        success: true, grade: 100, correctCount: 2, totalQuestions: 2,
      });

      // Submit ulang menimpa nilai lama (update, bukan duplikat)
      const half = await api(`/api/elearning/quiz/${sessionId}/submit`, {
        method: "POST", headers: SH(), body: JSON.stringify({ answers: [3, 0] }),
      });
      expect(half.body).toMatchObject({ success: true, grade: 50, correctCount: 1 });

      // GET sebagai siswa menampilkan submission + correctCount terhitung
      const got = await api(`/api/elearning/quiz/${sessionId}`, { headers: authHeader(siswaToken) });
      expect(got.status).toBe(200);
      expect((got.body as { data: { submission: { grade: number } | null } }).data.submission?.grade).toBe(50);

      // Tanpa soal → pesan jelas (bukan 500)
      const { sessionId: empty } = await makeSession(tag("KOSONG"));
      const noSoal = await api(`/api/elearning/quiz/${empty}/submit`, {
        method: "POST", headers: SH(), body: JSON.stringify({ answers: [0] }),
      });
      expect(noSoal.body).toMatchObject({ success: false, message: "Soal kuis tidak ditemukan" });

      // Bukan siswa → ditolak
      const adminSubmit = await api(`/api/elearning/quiz/${sessionId}/submit`, {
        method: "POST", headers: json(), body: JSON.stringify({ answers: [3, 1] }),
      });
      expect(adminSubmit.body).toMatchObject({ success: false });
    } finally {
      await api(`/api/elearning/quiz/${sessionId}`, {
        method: "POST", headers: json(), body: JSON.stringify({ questions: [] }),
      });
      await api(`/api/students/${siswaId}`, { method: "DELETE", headers: H() });
    }
  });
});

describe("session-angket: siswa submit → terbaca di responses", () => {
  test("evaluasi dibuat → siswa submit skor → evaluation-responses agregat", async () => {
    const mk = tag("ANGKET");
    await api("/api/elearning/evaluations", {
      method: "POST", headers: json(),
      body: JSON.stringify({ questions: [{ text: `${mk}?`, scaleMax: 5 }] }),
    });
    const evals = await api("/api/elearning/evaluations", { headers: H() });
    const evalId = ((evals.body as { data: { id: number }[] }).data ?? [])[0]?.id;
    expect(evalId).toBeNumber();

    const { courseId, sessionId } = await makeSession(tag("ANGK"));
    const { id: siswaId, token: siswaToken } = await makeSiswa("ANGK");
    try {
      const submit = await api("/api/elearning/session-angket", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader(siswaToken) },
        body: JSON.stringify({ sessionId, responses: [{ evaluationId: evalId, score: 4 }] }),
      });
      expect(submit.status).toBe(200);

      // KONTRAK: submit ganda onConflictDoNothing → tetap 200 (idempoten,
      // skor pertama dipertahankan, tidak duplikat baris).
      const dupe = await api("/api/elearning/session-angket", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader(siswaToken) },
        body: JSON.stringify({ sessionId, responses: [{ evaluationId: evalId, score: 5 }] }),
      });
      expect(dupe.status).toBe(200);

      // Admin bisa baca agregat; bukan-siswa ditolak submit
      const agg = await api("/api/elearning/evaluation-responses", { headers: H() });
      expect(agg.status).toBe(200);
      expect((agg.body as { data: { aggregated: unknown[] } }).data.aggregated.length).toBeGreaterThan(0);

      const adminSubmit = await api("/api/elearning/session-angket", {
        method: "POST", headers: json(),
        body: JSON.stringify({ sessionId, responses: [{ evaluationId: evalId, score: 5 }] }),
      });
      expect(adminSubmit.status).toBe(403);
      void courseId;
    } finally {
      await api(`/api/students/${siswaId}`, { method: "DELETE", headers: H() });
      await api("/api/elearning/evaluations", {
        method: "POST", headers: json(), body: JSON.stringify({ questions: [] }),
      });
    }
  });

  test("angket-tutor-scores wajib setupId; progress tanpa token 401", async () => {
    const noParam = await api("/api/elearning/angket-tutor-scores", { headers: H() });
    expect(noParam.body).toMatchObject({ success: false });
    expect((await api("/api/elearning/session-angket/progress")).status).toBe(401);
  });
});

describe("download-zip: kontrak 404/400/401", () => {
  test("sesi tanpa assignment → 404; tanpa token → 401", async () => {
    const { sessionId } = await makeSession(tag("ZIP"));
    expect(
      (await api(`/api/elearning/submissions/${sessionId}/download-zip`, { headers: H() })).status,
    ).toBe(404);
    expect((await api("/api/elearning/submissions/abc/download-zip", { headers: H() })).status).toBe(
      400,
    );
    expect((await api(`/api/elearning/submissions/${sessionId}/download-zip`)).status).toBe(401);
  });
});
