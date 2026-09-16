import { beforeAll, describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "upload-null-client-test-secret";

mock.module("../../src/server/config/r2.ts", () => ({
  isR2Enabled: true,
  r2PublicClient: null,
  r2PrivateClient: null,
  r2SubmissionsClient: null,
  R2_PUBLIC_BUCKET_NAME: "public",
  R2_PRIVATE_BUCKET_NAME: "private",
  R2_SUBMISSIONS_BUCKET_NAME: "submission",
  R2_PUBLIC_URL: "https://cdn.null.test",
  isR2PublicUrlValid: true,
  getR2PublicUrl: (name: string) => `https://cdn.null.test/${name}`,
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
      username: "null-client@test.local",
      role: "super_admin",
      name: "Null Client",
      email: "null-client@test.local",
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
  body.set("file", new File(["image"], "image.png", { type: "image/png" }));
  return authenticated("/api/upload", { method: "POST", body });
}

describe("upload service with enabled R2 and missing clients", () => {
  test("upload, GET, and DELETE each return storage unavailable", async () => {
    const originalError = console.error;
    console.error = mock(() => {});
    try {
      expect((await uploadServices.fetch(uploadRequest())).status).toBe(503);
      expect(
        (await uploadServices.fetch(new Request("http://in-process.test/api/files/image.png"))).status,
      ).toBe(503);

      const filename = "image.png";
      const deleteToken = createDeleteToken(filename);
      expect(
        (
          await uploadServices.fetch(
            authenticated(`/api/files/${filename}?deleteToken=${encodeURIComponent(deleteToken)}`, {
              method: "DELETE",
            }),
          )
        ).status,
      ).toBe(503);
    } finally {
      console.error = originalError;
    }
  });
});
