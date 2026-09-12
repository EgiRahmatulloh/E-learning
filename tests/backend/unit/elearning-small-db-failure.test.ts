// Elearning kecil DB-failure catch branches (attendance/completions/
// tutorAttendance/quiz): mock db agar semua query melempar; token valid manual.
// Satu file agar mock.module konsisten untuk semua subject.
import { describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "esmall-db-failure-secret";

const boom = (): never => {
  throw new Error("fake db down");
};

mock.module("../../../src/server/config/db.ts", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ get: boom, all: boom, orderBy: () => ({ all: boom }) }),
        orderBy: () => ({ all: boom }),
        innerJoin: () => ({ where: () => ({ all: boom }) }),
        get: boom,
        all: boom,
      }),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({ returning: () => boom, run: boom }),
        returning: boom,
        run: boom,
      }),
    }),
    update: () => ({ set: () => ({ where: () => ({ run: boom }) }) }),
    delete: () => ({ where: () => ({ run: boom }) }),
    // transaction: teruskan `boom` langsung (bukan `() => boom` yang hanya
    // mengembalikan referensi fungsi tanpa melempar).
    transaction: boom,
  },
}));

// Sub-handler elearning (attendance/quiz/dst) TIDAK punya plugin jwt sendiri —
// jwt disediakan oleh parent elearningHandlers (prefix /api/elearning).
// Jadi fetch HARUS lewat elearningHandlers agar jwt.verify tersedia; fetch
// langsung ke sub-handler memberi jwt undefined → verifyUser melempar TypeError
// SEBELUM mencapai try/db (catch tak tercover). Ini perilaku komposisi yang
// benar, bukan bug — test memakai jalur yang sama dengan production.
const { elearningHandlers } = await import("../../../src/server/handlers/elearning");
const attendanceHandlers = elearningHandlers;
const completionsHandlers = elearningHandlers;
const tutorAttendanceHandlers = elearningHandlers;
const quizHandlers = elearningHandlers;

async function signedToken(role = "siswa") {
  // Pola identik dengan signToken() di helpers/in-process-app.ts (terbukti
  // valid di semua in-process test): secret dari Bun.env live + handler
  // tanpa cast yang merusak binding jwt.
  const { jwt } = await import("@elysia/jwt");
  const signer = jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! });
  const testApp = new (await import("elysia")).Elysia()
    .use(signer)
    .get("/", ({ jwt: j }: any) =>
      j.sign({ id: 1, username: "a@t.l", role, name: "A", email: "a@t.l" }),
    );
  const response = await testApp.handle(new Request("http://token.test/"));
  return response.text();
}

const tokens = new Map<string, string>();
async function authed(
  handler: { fetch: (r: Request) => Promise<Response> },
  path: string,
  init: RequestInit = {},
  role = "siswa",
) {
  if (!tokens.has(role)) tokens.set(role, await signedToken(role));
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${tokens.get(role)}`);
  return handler.fetch(new Request(`http://in-process.test${path}`, { ...init, headers }));
}

const postJson = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

// Path memakai prefix /api/elearning karena fetch lewat parent composition.
describe("elearning kecil db-failure catch", () => {
  test("attendance GET/POST → 500", async () => {
    expect((await authed(attendanceHandlers, "/api/elearning/attendance?sessionId=1")).status).toBe(500);
    expect((await authed(attendanceHandlers, "/api/elearning/attendance", postJson({ sessionId: 1 }))).status).toBe(500);
  });

  test("completions GET/POST/progress → 500", async () => {
    expect((await authed(completionsHandlers, "/api/elearning/completions/1")).status).toBe(500);
    expect(
      (await authed(completionsHandlers, "/api/elearning/completions", postJson({ setupId: 1, sectionKey: "a" }))).status,
    ).toBe(500);
    expect((await authed(completionsHandlers, "/api/elearning/completions/progress/1")).status).toBe(500);
  });

  test("tutor-attendance GET/POST/history → 500", async () => {
    expect((await authed(tutorAttendanceHandlers, "/api/elearning/tutor-attendance", {}, "tutor")).status).toBe(500);
    // POST tanpa signature: body?.signature → "" tetap masuk insert → boom → 500
    expect(
      (await authed(tutorAttendanceHandlers, "/api/elearning/tutor-attendance", postJson({ signature: "x" }), "tutor")).status,
    ).toBe(500);
    expect((await authed(tutorAttendanceHandlers, "/api/elearning/tutor-attendance/history", {}, "tutor")).status).toBe(500);
  });

  test("quiz GET/configure/submit → 500", async () => {
    expect((await authed(quizHandlers, "/api/elearning/quiz/1")).status).toBe(500);
    // Configure: tutor lolos verifyAdminOrTutor (terbukti di in-process test).
    // Dengan 1 soal valid masuk cabang insert; mock transaction melempar → 500.
    const oneQ = [{ question: "q?", options: ["a", "b"], correctAnswer: 0 }];
    expect(
      (await authed(quizHandlers, "/api/elearning/quiz/1", postJson({ questions: oneQ }), "tutor")).status,
    ).toBe(500);
    expect((await authed(quizHandlers, "/api/elearning/quiz/1/submit", postJson({ answers: [0] }))).status).toBe(500);
  });
});
