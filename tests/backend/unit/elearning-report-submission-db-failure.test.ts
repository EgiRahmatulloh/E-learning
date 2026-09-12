// Report/submission catch coverage with a DB that always throws. This file is
// isolated because Bun module mocks are process-global.
import { describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "report-db-failure-secret";

const boom = (): never => {
  throw new Error("fake report db down");
};

const query = {
  where: () => query,
  innerJoin: () => query,
  leftJoin: () => query,
  orderBy: () => query,
  all: boom,
  get: boom,
};

mock.module("../../../src/server/config/db.ts", () => ({
  db: {
    select: () => ({ from: () => query }),
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({ returning: boom }),
        returning: boom,
        run: boom,
      }),
    }),
    update: () => ({ set: () => ({ where: () => ({ returning: boom, run: boom }) }) }),
  },
}));

const { elearningHandlers } = await import("../../../src/server/handlers/elearning");

async function token(role: string) {
  const { jwt } = await import("@elysia/jwt");
  const { Elysia } = await import("elysia");
  const signer = jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! });
  const app = new Elysia().use(signer).get("/", ({ jwt: j }: any) =>
    j.sign({ id: 1, username: `${role}@test.local`, role, name: role, email: `${role}@test.local` }),
  );
  return (await app.handle(new Request("http://token.test/"))).text();
}

const tokens = new Map<string, string>();
async function request(path: string, init: RequestInit = {}, role = "super_admin") {
  if (!tokens.has(role)) tokens.set(role, await token(role));
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${tokens.get(role)}`);
  return elearningHandlers.fetch(new Request(`http://in-process.test${path}`, { ...init, headers }));
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

describe("laporan db failures", () => {
  test("all seven report handlers convert DB failures to 500", async () => {
    for (const path of [
      "/api/elearning/laporan/tutor-attendance",
      "/api/elearning/laporan/student-attendance?setupId=1",
      "/api/elearning/laporan/student-attendance-rekap",
      "/api/elearning/laporan/student-attendances?setupId=1",
      "/api/elearning/laporan/student-grades?setupId=1",
      "/api/elearning/laporan/student-grades-rekap",
      "/api/elearning/laporan/tutor-agenda?setupId=1",
    ]) expect((await request(path)).status).toBe(500);
  });
});

describe("submission db failures", () => {
  test("GET, POST, PUT and ZIP catches return 500", async () => {
    expect((await request("/api/elearning/submissions/1")).status).toBe(500);
    expect((await request("/api/elearning/submissions/1", json("POST", { fileUrl: "/api/files/x" }), "siswa")).status).toBe(500);
    expect((await request("/api/elearning/submissions/1/grade", json("PUT", { grade: 75 }))).status).toBe(500);
    expect((await request("/api/elearning/submissions/1/download-zip")).status).toBe(500);
  });
});
