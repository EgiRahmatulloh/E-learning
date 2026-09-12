// Isolate the concurrent-session recovery path that cannot be scheduled
// deterministically against one in-memory SQLite connection.
import { describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "course-conflict-secret";

const existingSession = {
  id: 77,
  courseId: 9,
  sessionNumber: 3,
  title: "Concurrent session",
  description: "",
  tujuanPembelajaran: "",
  uraianKegiatan: "",
  isEvaluation: false,
};
let sessionSelects = 0;

mock.module("../../../src/server/config/db.ts", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          get: async () => (++sessionSelects === 1 ? undefined : existingSession),
          all: async () => [],
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({ returning: async () => [] }),
      }),
    }),
  },
}));

const { courseHandlers } = await import("../../../src/server/handlers/elearning/course");
const { Elysia } = await import("elysia");
const { jwt: jwtPlugin } = await import("@elysia/jwt");

const courseApp = new Elysia({ prefix: "/api/elearning" })
  .use(jwtPlugin({ name: "jwt", secret: Bun.env.JWT_SECRET! }))
  .use(courseHandlers);

async function token() {
  const { jwt } = await import("@elysia/jwt");
  const plugin = jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! });
  const app = new (await import("elysia")).Elysia().use(plugin).get("/", ({ jwt: j }: any) =>
    j.sign({ id: 1, username: "admin@test.local", role: "super_admin", name: "Admin", email: "admin@test.local" }),
  );
  return (await app.handle(new Request("http://token.test/"))).text();
}

describe("course session conflict recovery", () => {
  test("selects the row created by a concurrent request", async () => {
    const response = await courseApp.fetch(new Request(
      "http://in-process.test/api/elearning/session?courseId=9&sessionNumber=3",
      { headers: { authorization: `Bearer ${await token()}` } },
    ));
    expect(response.status).toBe(200);
    expect((await response.json() as any).data).toEqual({ session: existingSession, materials: [] });
  });
});
