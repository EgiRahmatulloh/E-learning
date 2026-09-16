import { describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "setup-db-failure-secret";

const boom = (): never => {
  throw new Error("fake db down");
};

const selectChain: any = new Proxy({}, {
  get: (_target, property) => {
    if (property === "then") return undefined;
    if (property === "all" || property === "get") return boom;
    return () => selectChain;
  },
});
const writeChain: any = new Proxy({}, {
  get: (_target, property) => {
    if (property === "then") return undefined;
    if (property === "returning") return () => { throw new Error("fake db down"); };
    if (property === "run") return boom;
    return () => writeChain;
  },
});

const deleteChain = {
  where: () => ({ then: (_resolve: unknown, reject: (error: Error) => void) => reject(new Error("fake db down")) }),
};
const toggleChain = {
  set: () => ({ where: () => ({ then: (_resolve: unknown, reject: (error: Error) => void) => reject(new Error("fake db down")) }) }),
};

mock.module("../../../src/server/config/db.ts", () => ({
  db: {
    select: () => selectChain,
    insert: () => writeChain,
    update: () => toggleChain,
    delete: () => deleteChain,
  },
}));

// Compose the target handler exactly as its production parent does, without
// importing unrelated elearning handlers into this isolated coverage process.
const { jwt } = await import("@elysia/jwt");
const { Elysia } = await import("elysia");
const { setupHandlers } = await import("../../../src/server/handlers/elearning/setup");
const setupApp = new Elysia({ prefix: "/api/elearning" })
  .use(jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! }))
  .use(setupHandlers);

async function token() {
  const signer = jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! });
  const app = new Elysia().use(signer).get("/", ({ jwt: j }: any) =>
    j.sign({ id: 1, username: "admin@test.local", role: "admin", name: "Admin", email: "admin@test.local" }),
  );
  return (await app.handle(new Request("http://token.test/"))).text();
}

let adminToken = "";
async function call(path: string, init: RequestInit = {}) {
  if (!adminToken) adminToken = await token();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${adminToken}`);
  return setupApp.fetch(new Request(`http://in-process.test${path}`, { ...init, headers }));
}

const body = (method: string, value: unknown): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(value),
});

describe("setup DB failure catches", () => {
  test("all setup query and mutation routes return 500", async () => {
    const setup = { kelas: "PAKET C 10 A", mapel: "Math", tutorId: 1, skk: 1, jumlahSesi: 8 };
    const requests: Array<[string, RequestInit?]> = [
      ["/api/elearning/setups"],
      ["/api/elearning/setups", body("POST", setup)],
      ["/api/elearning/setups/copy", body("POST", { fromSemester: "Ganjil", toSemester: "Genap" })],
      ["/api/elearning/setups/1", body("PUT", setup)],
      ["/api/elearning/setups/1/approve-angket", body("PATCH", { isAngketApproved: true })],
      ["/api/elearning/setups/1", { method: "DELETE" }],
      ["/api/elearning/session/1/toggle", body("PUT", { isOpen: false })],
      ["/api/elearning/setups/by-student/1"],
      ["/api/elearning/students-by-setup/1"],
    ];
    for (const [path, init] of requests) {
      expect((await call(path, init)).status, path).toBe(500);
    }
  });
});
