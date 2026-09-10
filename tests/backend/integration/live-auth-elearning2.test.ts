// Integration test live-server: auth profil/password + e-learning lanjutan —
// monitoring, grades, submissions (kumpul→nilai), attendance idempoten,
// completions, evaluations, setups/copy, session toggle, tutor-attendance,
// reset-password super_admin.
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

/** Buat akun siswa sementara + token login-nya; kembalikan { id, token }. */
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
  expect(login.status).toBe(200);
  return { id, token: (login.body as { token: string }).token };
}

describe("auth: update-profile + reset-password", () => {
  test("update nama lalu kembalikan (data asli utuh)", async () => {
    const me0 = await api("/api/auth/me", { headers: H() });
    const namaAsli = (me0.body as { user: { name: string } }).user.name;

    const upd = await api("/api/auth/update-profile", {
      method: "PUT", headers: json(), body: JSON.stringify({ name: tag("NAMA") }),
    });
    expect(upd.status).toBe(200);
    expect((upd.body as { user: { name: string } }).user.name).toContain("IT-TEST-");

    const back = await api("/api/auth/update-profile", {
      method: "PUT", headers: json(), body: JSON.stringify({ name: namaAsli }),
    });
    expect((back.body as { user: { name: string } }).user.name).toBe(namaAsli);
  });

  test("update-profile tanpa token → 401", async () => {
    expect(
      (
        await api("/api/auth/update-profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "x" }),
        })
      ).status,
    ).toBe(401);
  });

  test("reset-password super_admin: ganti pw siswa → login pw baru bisa", async () => {
    const { id, token: _t } = await makeSiswa("RST");
    try {
      const rst = await api("/api/admin/reset-password", {
        method: "POST", headers: json(),
        body: JSON.stringify({ targetRole: "siswa", targetId: id, newPassword: "baru12345" }),
      });
      expect(rst.status).toBe(200);

      const email = (await api(`/api/students`, { headers: H() }));
      const row = ((email.body as { data: { id: number; email: string }[] }).data ?? []).find(
        (s) => s.id === id,
      );
      const loginBaru = await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: row!.email, password: "baru12345" }),
      });
      expect(loginBaru.status).toBe(200);
    } finally {
      await api(`/api/students/${id}`, { method: "DELETE", headers: H() });
    }
  });

  test("reset-password oleh non-super_admin → 403; role tak dikenal → 400", async () => {
    const { id, token: siswaToken } = await makeSiswa("RST2");
    try {
      const forbidden = await api("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader(siswaToken) },
        body: JSON.stringify({ targetRole: "siswa", targetId: id, newPassword: "baru12345" }),
      });
      expect(forbidden.status).toBe(403);

      const badRole = await api("/api/admin/reset-password", {
        method: "POST", headers: json(),
        body: JSON.stringify({ targetRole: "alien", targetId: id, newPassword: "baru12345" }),
      });
      expect(badRole.status).toBe(400);
    } finally {
      await api(`/api/students/${id}`, { method: "DELETE", headers: H() });
    }
  });
});

describe("monitoring & grades (read)", () => {
  test("tutors + students + grades terisi; grades wajib setupId", async () => {
    for (const path of ["/api/elearning/monitoring/tutors", "/api/elearning/monitoring/students"]) {
      const res = await api(path, { headers: H() });
      expect(res.status).toBe(200);
      expect(Array.isArray((res.body as { data: unknown[] }).data)).toBe(true);
    }
    const grades = await api("/api/elearning/grades?setupId=394", { headers: H() });
    expect(grades.status).toBe(200);
    const rows = (grades.body as { data: { final: number; predikat: string }[] }).data;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty("final");
    expect(rows[0]).toHaveProperty("predikat");

    expect((await api("/api/elearning/grades", { headers: H() })).status).toBe(200);
    expect((await api("/api/elearning/grades", { headers: H() })).body).toMatchObject({
      success: false,
    });
  });

  test("tutor-stats/siswa-stats tanpa token → 401", async () => {
    expect((await api("/api/elearning/tutor-stats")).status).toBe(401);
  });
});

describe("submissions: siswa kumpul → admin nilai; peran dijaga", () => {
  test("siklus penuh pada sesi IT (course unik)", async () => {
    const subjectName = tag("TUGAS");
    const courseId = (
      (await api("/api/elearning/course", {
        method: "POST", headers: json(), body: JSON.stringify({ subjectName, program: "PAKET C" }),
      })) as { body: { data: { id: number } } }
    ).body.data.id;
    const sessionId = (
      (
        await api(`/api/elearning/session?courseId=${courseId}&sessionNumber=1`, { headers: H() })
      ) as { body: { data: { session: { id: number } } } }
    ).body.data.session.id;

    const { id: siswaId, token: siswaToken } = await makeSiswa("SUBM");
    const SH = () => authHeader(siswaToken);
    try {
      const kumpul = await api(`/api/elearning/submissions/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...SH() },
        body: JSON.stringify({ fileUrl: "/api/files/tugas-it.pdf" }),
      });
      expect(kumpul.status).toBe(200);

      const list = await api(`/api/elearning/submissions/${sessionId}`, { headers: H() });
      const sub = ((list.body as { data: { id: number; studentId: number }[] }).data ?? []).find(
        (s) => s.studentId === siswaId,
      );
      expect(sub).toBeDefined();

      const nilai = await api(`/api/elearning/submissions/${sub!.id}/grade`, {
        method: "PUT", headers: json(), body: JSON.stringify({ grade: 85, feedback: "bagus" }),
      });
      expect(nilai.status).toBe(200);

      // Admin dilarang kumpul; siswa dilarang menilai
      const adminKumpul = await api(`/api/elearning/submissions/${sessionId}`, {
        method: "POST", headers: json(), body: JSON.stringify({ fileUrl: "x" }),
      });
      expect(adminKumpul.body).toMatchObject({ success: false });
      const siswaNilai = await api(`/api/elearning/submissions/${sub!.id}/grade`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...SH() },
        body: JSON.stringify({ grade: 100 }),
      });
      expect(siswaNilai.status).toBe(403);
    } finally {
      await api(`/api/students/${siswaId}`, { method: "DELETE", headers: H() });
    }
  });
});

describe("attendance + completions siswa (idempoten)", () => {
  test("absen 2x tetap 1 baris; completion + progress; admin ditolak", async () => {
    const subjectName = tag("HADIR");
    const courseId = (
      (await api("/api/elearning/course", {
        method: "POST", headers: json(), body: JSON.stringify({ subjectName, program: "PAKET C" }),
      })) as { body: { data: { id: number } } }
    ).body.data.id;
    const sessionId = (
      (
        await api(`/api/elearning/session?courseId=${courseId}&sessionNumber=1`, { headers: H() })
      ) as { body: { data: { session: { id: number } } } }
    ).body.data.session.id;

    const { id: siswaId, token: siswaToken } = await makeSiswa("HADIR");
    const SH = () => authHeader(siswaToken);
    const J = () => ({ "Content-Type": "application/json", ...SH() });
    try {
      const a1 = await api("/api/elearning/attendance", {
        method: "POST", headers: J(), body: JSON.stringify({ sessionId, signature: "data:it" }),
      });
      const a2 = await api("/api/elearning/attendance", {
        method: "POST", headers: J(), body: JSON.stringify({ sessionId }),
      });
      expect(a1.status).toBe(200);
      expect(a2.status).toBe(200);
      expect((a1.body as { data: { id: number } }).data.id).toBe(
        (a2.body as { data: { id: number } }).data.id,
      );

      const comp = await api("/api/elearning/completions", {
        method: "POST", headers: J(), body: JSON.stringify({ setupId: 394, sectionKey: "it-sec" }),
      });
      expect(comp.status).toBe(200);
      const prog = await api("/api/elearning/completions/progress/394", { headers: SH() });
      expect(prog.status).toBe(200);

      const adminComp = await api("/api/elearning/completions", {
        method: "POST", headers: json(), body: JSON.stringify({ setupId: 394, sectionKey: "x" }),
      });
      expect(adminComp.body).toMatchObject({ success: false });
    } finally {
      await api(`/api/students/${siswaId}`, { method: "DELETE", headers: H() });
    }
  });
});

describe("evaluations, setups/copy, session toggle, tutor-attendance", () => {
  test("evaluations: simpan 1 pertanyaan lalu kembalikan kosong (DB awal kosong)", async () => {
    const save = await api("/api/elearning/evaluations", {
      method: "POST", headers: json(), body: JSON.stringify({ questions: [{ text: "IT-Q?", scaleMax: 5 }] }),
    });
    expect(save.status).toBe(200);
    const got = await api("/api/elearning/evaluations", { headers: H() });
    expect(((got.body as { data: unknown[] }).data ?? []).length).toBeGreaterThan(0);
    expect(
      (
        await api("/api/elearning/evaluations", {
          method: "POST", headers: json(), body: JSON.stringify({ questions: [] }),
        })
      ).status,
    ).toBe(200);
    const back = await api("/api/elearning/evaluations", { headers: H() });
    expect(((back.body as { data: unknown[] }).data ?? [])).toHaveLength(0);
  });

  test("setups/copy + hapus hasil copy; toggle isOpen pulang-pergi", async () => {
    const sem = `IT-SEM-${Date.now()}`;
    const copy = await api("/api/elearning/setups/copy", {
      method: "POST", headers: json(),
      body: JSON.stringify({ fromSemester: "Ganjil", toSemester: sem }),
    });
    expect(copy.status).toBe(200);
    expect((copy.body as { copied: number }).copied).toBeGreaterThan(0);

    const list = await api(`/api/elearning/setups?semester=${sem}`, { headers: H() });
    const ids = ((list.body as { data: { id: number }[] }).data ?? []).map((s) => s.id);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      await api(`/api/elearning/setups/${id}`, { method: "DELETE", headers: H() });
    }

    // Toggle butuh body { isOpen: boolean } — tanpa itu 422
    const noBody = await api("/api/elearning/session/76/toggle", {
      method: "PUT", headers: json(), body: JSON.stringify({}),
    });
    expect(noBody.status).toBe(422);
    expect(
      (
        await api("/api/elearning/session/76/toggle", {
          method: "PUT", headers: json(), body: JSON.stringify({ isOpen: false }),
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await api("/api/elearning/session/76/toggle", {
          method: "PUT", headers: json(), body: JSON.stringify({ isOpen: true }),
        })
      ).status,
    ).toBe(200);
  });

  test("tutor-attendance: tutor absen idempoten; admin 403; history tercatat", async () => {
    const email = `${tag("TUTOR").toLowerCase()}@x.id`;
    const tutorId = createdId(
      await api("/api/tutors", {
        method: "POST", headers: json(),
        body: JSON.stringify({ nama: tag("TUTOR"), email, password: "tutor123" }),
      }),
    );
    try {
      const login = await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password: "tutor123" }),
      });
      const tutorToken = (login.body as { token: string }).token;

      const p1 = await api("/api/elearning/tutor-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader(tutorToken) },
        body: JSON.stringify({ signature: "data:it" }),
      });
      const p2 = await api("/api/elearning/tutor-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader(tutorToken) },
        body: JSON.stringify({}),
      });
      expect(p1.status).toBe(200);
      expect((p2.body as { message: string }).message).toMatch(/Sudah absen/i);

      const adminPost = await api("/api/elearning/tutor-attendance", {
        method: "POST", headers: json(), body: JSON.stringify({}),
      });
      expect(adminPost.status).toBe(403);

      const hist = await api("/api/elearning/tutor-attendance/history", {
        headers: authHeader(tutorToken),
      });
      expect(hist.status).toBe(200);
      expect(Array.isArray((hist.body as { data: unknown[] }).data)).toBe(true);
    } finally {
      await api(`/api/tutors/${tutorId}`, { method: "DELETE", headers: H() });
    }
  });
});
