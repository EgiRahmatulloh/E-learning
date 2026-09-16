// Isolated DB failures for every catch in course.ts and forum.ts.
import { describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "course-forum-db-failure-secret";

const boom = (): never => {
  throw new Error("fake db down");
};

mock.module("../../../src/server/config/db.ts", () => ({
  db: {
    select: boom,
    insert: boom,
    update: boom,
    delete: boom,
    transaction: boom,
  },
}));

const { courseHandlers } = await import("../../../src/server/handlers/elearning/course");
const { forumHandlers } = await import("../../../src/server/handlers/elearning/forum");
const { Elysia } = await import("elysia");
const { jwt: jwtPlugin } = await import("@elysia/jwt");

const courseApp = new Elysia({ prefix: "/api/elearning" })
  .use(jwtPlugin({ name: "jwt", secret: Bun.env.JWT_SECRET! }))
  .use(courseHandlers);
const forumApp = new Elysia({ prefix: "/api/elearning" })
  .use(jwtPlugin({ name: "jwt", secret: Bun.env.JWT_SECRET! }))
  .use(forumHandlers);

async function signedToken(role: string) {
  const { jwt } = await import("@elysia/jwt");
  const signer = jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! });
  const testApp = new (await import("elysia")).Elysia()
    .use(signer)
    .get("/", ({ jwt: j }: any) =>
      j.sign({ id: 1, username: `${role}@test.local`, role, name: role, email: `${role}@test.local` }),
    );
  return (await testApp.handle(new Request("http://token.test/"))).text();
}

const tokens = new Map<string, string>();
async function request(app: typeof courseApp, path: string, init: RequestInit = {}, role = "super_admin") {
  if (!tokens.has(role)) tokens.set(role, await signedToken(role));
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${tokens.get(role)}`);
  return app.fetch(new Request(`http://in-process.test${path}`, { ...init, headers }));
}

function json(method: "POST" | "PUT", body: unknown): RequestInit {
  return {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function expectServerFailure(response: Promise<Response>) {
  const result = await response;
  expect(result.status).toBe(500);
  expect(await result.json()).toMatchObject({ success: false, message: "Terjadi kesalahan server" });
}

describe("course isolated DB failures", () => {
  test("every route catch returns 500", async () => {
    await expectServerFailure(request(courseApp,
      "/api/elearning/course",
      json("POST", { subjectName: "Course", program: "PAKET C", setupId: 1 }),
    ));
    await expectServerFailure(request(courseApp,"/api/elearning/session?courseId=1&sessionNumber=1"));
    await expectServerFailure(request(courseApp,
      "/api/elearning/session/1",
      json("PUT", { description: "x" }),
      "tutor",
    ));
    await expectServerFailure(request(courseApp,
      "/api/elearning/material",
      json("POST", { sessionId: 1, title: "M", type: "PDF", fileUrl: "x" }),
      "tutor",
    ));
    await expectServerFailure(request(courseApp,"/api/elearning/evaluations"));
    await expectServerFailure(request(courseApp,
      "/api/elearning/evaluations",
      json("POST", { questions: [{ text: "Q" }] }),
    ));
    await expectServerFailure(request(courseApp,"/api/elearning/evaluation-responses"));
  });
});

describe("forum isolated DB failures", () => {
  test("every route catch returns 500", async () => {
    await expectServerFailure(request(forumApp,"/api/elearning/forum?sessionId=1", {}, "siswa"));
    await expectServerFailure(request(forumApp,
      "/api/elearning/forum",
      json("POST", { sessionId: 1, courseId: 1, content: "x" }),
      "siswa",
    ));
    await expectServerFailure(request(forumApp,
      "/api/elearning/forum/1",
      json("PUT", { content: "x" }),
      "siswa",
    ));
    await expectServerFailure(request(forumApp,"/api/elearning/forum/1", { method: "DELETE" }, "siswa"));
  });
});
