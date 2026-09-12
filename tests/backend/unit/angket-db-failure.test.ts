// Focused DB-failure tests for every angket handler catch. The subject is
// imported through the parent elearning API so its jwt decorator is present.
import { describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "angket-db-failure-secret";

const boom = (): never => {
  throw new Error("fake angket db failure");
};

mock.module("../../../src/server/config/db.ts", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ get: boom, all: boom, limit: () => ({ get: boom }) }),
        all: boom,
        innerJoin: () => ({ where: () => ({ get: boom, all: boom }) }),
      }),
    }),
    transaction: boom,
  },
}));

const { elearningHandlers } = await import("../../../src/server/handlers/elearning");

async function signedToken(role: string) {
  const { jwt } = await import("@elysia/jwt");
  const { Elysia } = await import("elysia");
  const signer = jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! });
  const app = new Elysia().use(signer).get("/", ({ jwt: scopedJwt }: any) =>
    scopedJwt.sign({
      id: 1,
      username: `${role}@test.local`,
      role,
      name: role,
      email: `${role}@test.local`,
    }),
  );
  return (await app.handle(new Request("http://token.test/"))).text();
}

const tokens = new Map<string, string>();
async function authed(path: string, role: string, init: RequestInit = {}) {
  if (!tokens.has(role)) tokens.set(role, await signedToken(role));
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${tokens.get(role)}`);
  return elearningHandlers.fetch(new Request(`http://in-process.test${path}`, { ...init, headers }));
}

const postJson = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

describe("angket DB-failure catches", () => {
  test("progress catches the first setup query failure", async () => {
    const response = await authed(
      "/api/elearning/session-angket/progress?setupId=1",
      "siswa",
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "Terjadi kesalahan server",
    });
  });

  test("session status catches the first session query failure", async () => {
    const response = await authed(
      "/api/elearning/session-angket?sessionId=1",
      "siswa",
    );
    expect(response.status).toBe(500);
  });

  test("submission catches the first session query failure", async () => {
    const response = await authed(
      "/api/elearning/session-angket",
      "siswa",
      postJson({ sessionId: 1, responses: [{ evaluationId: 1, score: 5 }] }),
    );
    expect(response.status).toBe(500);
  });

  test("tutor scores catches the setup query failure", async () => {
    const response = await authed(
      "/api/elearning/angket-tutor-scores?setupId=1",
      "tutor",
    );
    expect(response.status).toBe(500);
  });
});