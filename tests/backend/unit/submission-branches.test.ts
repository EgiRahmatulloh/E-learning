// Focused hard-to-reproduce submission branches: concurrent assignment insert,
// R2/external sources, per-file failures, no usable files, and invalid payload.
import { describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "submission-branches-secret";

let mode = "conflict";
const existingAssignment = { id: 41, sessionId: 7 };
const selections: any[][] = [];
const files = new Map<string, ArrayBuffer>();
const r2Files = new Map<string, ArrayBuffer>();
const saved: any[] = [];

const chain = {
  where: () => chain,
  innerJoin: () => chain,
  leftJoin: () => chain,
  all: async () => selections.shift() ?? [],
  get: async () => {
    if (mode === "conflict") return selections.shift()?.[0] ?? null;
    return selections.shift()?.[0] ?? null;
  },
};

mock.module("../../../src/server/config/db.ts", () => ({
  db: {
    select: () => ({ from: () => chain }),
    insert: () => ({ values: (value: any) => {
      saved.push(value);
      return {
        onConflictDoNothing: () => ({ returning: async () => [] }),
        run: () => {},
      };
    }}),
    update: () => ({ set: () => ({ where: () => ({ returning: async () => [] }) }) }),
  },
}));

mock.module("../../../src/server/config/r2.ts", () => ({
  isR2Enabled: true,
  R2_PUBLIC_URL: "",
  isR2PublicUrlValid: false,
  getR2PublicUrl: () => null,
  R2_PUBLIC_BUCKET_NAME: "public",
  R2_PRIVATE_BUCKET_NAME: "private",
  R2_SUBMISSIONS_BUCKET_NAME: "submission",
  r2PublicClient: null,
  r2PrivateClient: null,
  r2SubmissionsClient: null,
  resolveR2Bucket: (name: string) => ({
    bucket: "submission",
    isPublic: false,
    client: name === "no-client.pdf" ? null : {
      file: () => ({
        exists: async () => r2Files.has(name),
        arrayBuffer: async () => r2Files.get(name)!,
      }),
    },
  }),
}));

const originalFile = Bun.file;
(Bun as any).file = (path: string) => ({
  exists: async () => files.has(path),
  arrayBuffer: async () => {
    if (path.includes("throws")) throw new Error("file read failed");
    return files.get(path)!;
  },
});

const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  if (url.includes("external-ok")) return new Response(new Uint8Array([9, 8, 7]));
  return new Response("missing", { status: 404 });
}) as typeof fetch;

const { elearningHandlers } = await import("../../../src/server/handlers/elearning");

async function signed(role: string) {
  const { jwt } = await import("@elysia/jwt");
  const { Elysia } = await import("elysia");
  const app = new Elysia().use(jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! }))
    .get("/", ({ jwt: j }: any) => j.sign({ id: 2, username: "x", role, name: "x", email: "x@y.z" }));
  return (await app.handle(new Request("http://token.test/"))).text();
}

const tokens = new Map<string, string>();
async function call(path: string, init: RequestInit = {}, role = "super_admin") {
  if (!tokens.has(role)) tokens.set(role, await signed(role));
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${tokens.get(role)}`);
  return elearningHandlers.fetch(new Request(`http://in-process.test${path}`, { ...init, headers }));
}
const body = (method: string, value: unknown): RequestInit => ({
  method, headers: { "content-type": "application/json" }, body: JSON.stringify(value),
});

describe("submission focused branches", () => {
  test("concurrent assignment conflict reloads assignment and inserts submission", async () => {
    selections.push([], [{ sessionNumber: 7 }], [existingAssignment], []);
    const response = await call("/api/elearning/submissions/7", body("POST", { fileUrl: "/api/files/new.pdf" }), "siswa");
    expect(response.status).toBe(200);
    expect(saved.some((row) => row.assignmentId === existingAssignment.id)).toBe(true);
  });

  test("malformed token is rejected before grading", async () => {
    const response = await elearningHandlers.fetch(new Request("http://in-process.test/api/elearning/submissions/1/grade", {
      method: "PUT",
      headers: { authorization: "Bearer invalid", "content-type": "application/json" },
      body: JSON.stringify({ grade: 70 }),
    }));
    expect(response.status).toBe(401);
  });

  test("ZIP reads R2 and external fallback while skipping failures", async () => {
    r2Files.set("r2-ok.pdf", new Uint8Array([1, 2, 3]).buffer);
    files.set("./uploads/throws.pdf", new Uint8Array([0]).buffer);
    selections.push([existingAssignment], [
      { studentName: "R2 Student", fileUrl: "/api/files/r2-ok.pdf" },
      { studentName: "External Student", fileUrl: "https://external-ok.test/work.docx" },
      { studentName: "Missing", fileUrl: "/api/files/missing.pdf" },
      { studentName: "Throws", fileUrl: "/api/files/throws.pdf" },
      { studentName: null, fileUrl: "" },
      { studentName: null, fileUrl: "/" },
    ]);
    const response = await call("/api/elearning/submissions/7/download-zip");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/zip");
  });

  test("ZIP returns 500 when all files are missing", async () => {
    selections.push([existingAssignment], [
      { studentName: null, fileUrl: "/api/files/no-client.pdf" },
      { studentName: "Missing", fileUrl: "https://external-missing.test/x" },
    ]);
    const response = await call("/api/elearning/submissions/7/download-zip");
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ success: false });
  });

  test("schema rejects non-number grades", async () => {
    const response = await call("/api/elearning/submissions/1/grade", body("PUT", { grade: "bad" }));
    expect(response.status).toBe(422);
  });
});

process.on("exit", () => {
  (Bun as any).file = originalFile;
  globalThis.fetch = originalFetch;
});
