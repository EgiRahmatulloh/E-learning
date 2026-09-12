import { beforeAll, describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "upload-disabled-test-secret";

mock.module("../../src/server/config/r2.ts", () => ({
  isR2Enabled: false,
  r2PublicClient: null,
  r2PrivateClient: null,
  r2SubmissionsClient: null,
  R2_PUBLIC_BUCKET_NAME: "public",
  R2_PRIVATE_BUCKET_NAME: "private",
  R2_SUBMISSIONS_BUCKET_NAME: "submission",
  R2_PUBLIC_URL: "",
  isR2PublicUrlValid: false,
  getR2PublicUrl: () => null,
  resolveR2Bucket: () => ({ bucket: "private", client: null, isPublic: false }),
}));

const { uploadServices } = await import("../../src/server/services/upload");
const { createDeleteToken } = await import("../../src/server/services/storage");

let token: string;

beforeAll(async () => {
  const { jwt } = await import("@elysia/jwt");
  const { Elysia } = await import("elysia");
  const signer = jwt({ name: "jwt", secret: Bun.env.JWT_SECRET! });
  const helper = new Elysia().use(signer).get("/", ({ jwt: value }) =>
    value.sign({
      id: 1,
      username: "disabled@test.local",
      role: "super_admin",
      name: "Disabled",
      email: "disabled@test.local",
    }),
  );
  token = await (await helper.handle(new Request("http://token.test/"))).text();
});

function authenticated(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  return new Request(`http://in-process.test${path}`, { ...init, headers });
}

function uploadRequest() {
  const body = new FormData();
  body.set("file", new File(["hello"], "note.pdf", { type: "application/pdf" }));
  return authenticated("/api/upload", { method: "POST", body });
}

describe("upload service with R2 disabled", () => {
  test("upload and public GET return storage unavailable", async () => {
    const originalError = console.error;
    console.error = mock(() => {});
    try {
      expect((await uploadServices.fetch(uploadRequest())).status).toBe(503);
      expect(
        (await uploadServices.fetch(new Request("http://in-process.test/api/files/public.png"))).status,
      ).toBe(503);
    } finally {
      console.error = originalError;
    }
  });

  test("authenticated DELETE returns storage unavailable", async () => {
    const filename = "public.png";
    const deleteToken = createDeleteToken(filename);
    const response = await uploadServices.fetch(
      authenticated(`/api/files/${filename}?deleteToken=${encodeURIComponent(deleteToken)}`, {
        method: "DELETE",
      }),
    );
    expect(response.status).toBe(503);
  });
});
