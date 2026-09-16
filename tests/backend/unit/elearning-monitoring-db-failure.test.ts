import { describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "setup-monitoring-db-failure-secret";

const boom = (): never => {
  throw new Error("fake db down");
};

const chain: any = new Proxy({}, {
  get: (_target, property) => {
    if (property === "then") return undefined;
    if (property === "all" || property === "get" || property === "run") return boom;
    return () => chain;
  },
});

mock.module("../../../src/server/config/db.ts", () => ({
  db: {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
  },
}));

// Mount only the target handler so this process cannot instrument or cache
// unrelated elearning modules under the mocked database.
const { jwt } = await import("@elysia/jwt");
const { Elysia } = await import("elysia");
const { monitoringHandlers } = await import("../../../src/server/handlers/elearning/monitoring");
const monitoringApp = new Elysia({ prefix: "/api/elearning" })
  .use(jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! }))
  .use(monitoringHandlers);

async function signedToken(role: string) {
  const signer = jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! });
  const signerApp = new Elysia()
    .use(signer)
    .get("/", ({ jwt: tokenService }: any) => tokenService.sign({
      id: 1,
      username: `${role}@test.local`,
      role,
      name: role,
      email: `${role}@test.local`,
    }));
  return (await signerApp.handle(new Request("http://token.test/"))).text();
}

const tokens = new Map<string, string>();
async function authed(path: string, role = "admin", init: RequestInit = {}) {
  if (!tokens.has(role)) tokens.set(role, await signedToken(role));
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${tokens.get(role)}`);
  return monitoringApp.fetch(new Request(`http://in-process.test${path}`, { ...init, headers }));
}

describe("monitoring DB failure catches", () => {
  test("all monitoring routes return 500", async () => {
    for (const [path, role] of [
      ["/api/elearning/monitoring/tutors", "admin"],
      ["/api/elearning/monitoring/students", "admin"],
      ["/api/elearning/grades?setupId=1", "admin"],
      ["/api/elearning/tutor-stats", "tutor"],
      ["/api/elearning/siswa-stats", "siswa"],
    ] as const) {
      expect((await authed(path, role)).status, path).toBe(500);
    }
  });
});
