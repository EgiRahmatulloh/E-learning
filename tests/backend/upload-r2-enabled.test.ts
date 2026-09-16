// Pure branches upload.ts: getContentType, resolveBucketForUpload,
// resolveBucketForDownload tidak diekspor — diuji lewat mock r2 config +
// uploadServices.fetch dengan fake S3 clients. mock.module harus sebelum import.
import { beforeAll, describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "upload-branches-test-secret";

interface StoredFile {
  content: Uint8Array;
  noStream?: boolean;
}

const store = new Map<string, StoredFile>();
let failNextWrite = false;
let failNextExists = false;
let failNextDelete = false;

function fakeClient(bucket: string) {
  return {
    bucket,
    file(name: string) {
      const key = `${bucket}/${name}`;
      return {
        async write(value: unknown) {
          if (failNextWrite) {
            failNextWrite = false;
            throw new Error("fake write failure");
          }
          const content = value instanceof Blob
            ? new Uint8Array(await value.arrayBuffer())
            : value instanceof Uint8Array
              ? value
              : new TextEncoder().encode("x");
          store.set(key, { content });
        },
        async exists() {
          if (failNextExists) {
            failNextExists = false;
            throw new Error("fake exists failure");
          }
          return store.has(key);
        },
        async arrayBuffer() {
          const found = store.get(key)?.content ?? new Uint8Array([1, 2, 3]);
          return found.buffer.slice(found.byteOffset, found.byteOffset + found.byteLength);
        },
        stream() {
          const found = store.get(key);
          if (found?.noStream) return null;
          return new Blob([found?.content ?? new Uint8Array([1, 2, 3])]).stream();
        },
        async delete() {
          if (failNextDelete) {
            failNextDelete = false;
            throw new Error("fake delete failure");
          }
          store.delete(key);
        },
      };
    },
  };
}

const publicClient = fakeClient("public");
const privateClient = fakeClient("private");
const submissionsClient = fakeClient("submission");

let publicUrlEnabled = true;

mock.module("../../src/server/config/r2.ts", () => ({
  isR2Enabled: true,
  r2PublicClient: publicClient,
  r2PrivateClient: privateClient,
  r2SubmissionsClient: submissionsClient,
  R2_PUBLIC_BUCKET_NAME: "public",
  R2_PRIVATE_BUCKET_NAME: "private",
  R2_SUBMISSIONS_BUCKET_NAME: "submission",
  R2_PUBLIC_URL: "https://cdn.enabled.test",
  isR2PublicUrlValid: true,
  getR2PublicUrl: (name: string) => publicUrlEnabled ? `https://cdn.enabled.test/${name}` : null,
  resolveR2Bucket: (filename: string) => {
    if (filename.startsWith("priv-")) return { bucket: "private", client: privateClient, isPublic: false };
    if (filename.startsWith("subm-")) return { bucket: "submission", client: submissionsClient, isPublic: false };
    return { bucket: "public", client: publicClient, isPublic: true };
  },
}));

const { uploadServices } = await import("../../src/server/services/upload");
const { createDeleteToken } = await import("../../src/server/services/storage");

let token: string;

beforeAll(async () => {
  // uploadServices memakai jwt yang sama dengan createApp: sign manual dengan
  // secret test agar tidak bergantung pada route login (yang memakai db asli).
  const { jwt } = await import("@elysia/jwt");
  const { Elysia } = await import("elysia");
  const signer = (
    jwt as unknown as (opts: Record<string, unknown>) => { sign: (p: unknown) => Promise<string> }
  )({ name: "jwt", secret: Bun.env.JWT_SECRET! });
  const helper = new Elysia()
    .use(signer as never)
    .get("/", ({ jwt: j }: { jwt: { sign: (p: unknown) => Promise<string> } }) =>
      j.sign({ id: 1, username: "upload-br@test.local", role: "super_admin", name: "Upload Br", email: "upload-br@test.local" }),
    );
  token = await (await helper.handle(new Request("http://in-process.test/"))).text();
});

function uploadReq(file: File, fields: Record<string, string> = {}, auth = true) {
  const form = new FormData();
  form.set("file", file);
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  const headers: Record<string, string> = {};
  if (auth) headers.authorization = `Bearer ${token}`;
  return new Request("http://in-process.test/api/upload", { method: "POST", headers, body: form });
}

describe("upload branches (R2 fake enabled)", () => {
  test("public image → CDN URL + deleteToken", async () => {
    const res = await uploadServices.fetch(
      uploadReq(new File(["img"], "foto.png", { type: "image/png" }), { public: "true" }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { url: string; deleteToken: string };
    expect(body.url).toContain("https://cdn.enabled.test/");
    expect(body.deleteToken).toBeString();
  });

  test("submission prefix > private > public (precedence)", async () => {
    const res = await uploadServices.fetch(
      uploadReq(new File(["doc"], "tugas.pdf", { type: "application/pdf" }), {
        submission: "1",
        private: "1",
        public: "1",
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { url: string };
    expect(body.url).toContain("/api/files/subm-");
    const submissionGet = await uploadServices.fetch(
      new Request(`http://in-process.test${body.url}`, {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(submissionGet.status).toBe(200);

    const privateImage = await uploadServices.fetch(
      uploadReq(new File(["img"], "identitas.png", { type: "image/png" }), { private: "1" }),
    );
    const privateName = ((await privateImage.json()) as { url: string }).url.split("/").pop()!;
    const privateGet = await uploadServices.fetch(
      new Request(`http://in-process.test/api/files/${privateName}`, {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(privateGet.status).toBe(200);
  });

  test("private non-image tanpa flag → proxy, bukan CDN", async () => {
    const defaultPrivate = await uploadServices.fetch(
      uploadReq(new File(["doc"], "rahasia.pdf", { type: "application/pdf" })),
    );
    expect(defaultPrivate.status).toBe(200);
    expect(((await defaultPrivate.json()) as { url: string }).url).toMatch(/\/api\/files\/\d/);

    const explicitPrivate = await uploadServices.fetch(
      uploadReq(new File(["doc"], "identitas.pdf", { type: "application/pdf" }), { private: "true" }),
    );
    expect(explicitPrivate.status).toBe(200);
    expect(((await explicitPrivate.json()) as { url: string }).url).toContain("/api/files/priv-");
  });

  test("public upload tanpa CDN URL kembali ke proxy", async () => {
    publicUrlEnabled = false;
    try {
      const response = await uploadServices.fetch(
        uploadReq(new File(["img"], "proxy.png", { type: "image/png" })),
      );
      expect(response.status).toBe(200);
      expect(((await response.json()) as { url: string }).url).toContain("/api/files/");
    } finally {
      publicUrlEnabled = true;
    }
  });

  test("write gagal → 502", async () => {
    failNextWrite = true;
    const originalError = console.error;
    console.error = mock(() => {});
    try {
      const res = await uploadServices.fetch(
        uploadReq(new File(["x"], "gagal.png", { type: "image/png" }), { public: "true" }),
      );
      expect(res.status).toBe(502);
    } finally {
      console.error = originalError;
      failNextWrite = false;
    }
  });

  test("GET publik memakai stream; private memakai fallback arrayBuffer", async () => {
    const up = await uploadServices.fetch(
      uploadReq(new File(["hello"], "pub-doc.pdf", { type: "application/pdf" }), { public: "true" }),
    );
    expect(up.status).toBe(200);
    const name = ((await up.json()) as { url: string }).url.split("/").pop()!;
    const get = await uploadServices.fetch(new Request(`http://in-process.test/api/files/${name}`));
    expect(get.status).toBe(200);
    expect(get.headers.get("content-type")).toContain("application/pdf");
    expect(get.headers.get("cache-control")).toContain("public");

    store.set("private/legacy.pdf", { content: new Uint8Array([7]) });
    const legacy = await uploadServices.fetch(
      new Request("http://in-process.test/api/files/legacy.pdf", {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(legacy.status).toBe(200);

    store.set("private/priv-fallback.bin", {
      content: new Uint8Array([4, 5, 6]),
      noStream: true,
    });
    const fallback = await uploadServices.fetch(
      new Request("http://in-process.test/api/files/priv-fallback.bin", {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(fallback.status).toBe(200);
    expect(fallback.headers.get("content-type")).toContain("application/octet-stream");
    expect(fallback.headers.get("cache-control")).toContain("private");
  });

  test("GET traversal, missing, dan storage error dipetakan dengan benar", async () => {
    for (const path of ["a%2Fb.png", "a%5Cb.png", "a..b.png"]) {
      expect((await uploadServices.fetch(new Request(`http://in-process.test/api/files/${path}`))).status).toBe(403);
    }

    const missing = await uploadServices.fetch(
      new Request("http://in-process.test/api/files/pub-hilang-xyz.png"),
    );
    expect(missing.status).toBe(404);

    failNextExists = true;
    const originalError = console.error;
    console.error = mock(() => {});
    try {
      const failed = await uploadServices.fetch(
        new Request("http://in-process.test/api/files/pub-read-error.png"),
      );
      expect(failed.status).toBe(502);
    } finally {
      console.error = originalError;
      failNextExists = false;
    }
  });

  test("GET private menerima token header/query valid dan menolak invalid", async () => {
    const noAuth = await uploadServices.fetch(new Request("http://in-process.test/api/files/priv-x.pdf"));
    expect(noAuth.status).toBe(401);

    const invalidHeader = await uploadServices.fetch(
      new Request(`http://in-process.test/api/files/priv-x.pdf?token=${encodeURIComponent(token)}`, {
        headers: { authorization: "Bearer invalid" },
      }),
    );
    expect(invalidHeader.status).toBe(404);

    const invalidQuery = await uploadServices.fetch(
      new Request("http://in-process.test/api/files/priv-x.pdf?token=invalid"),
    );
    expect(invalidQuery.status).toBe(401);

    const validHeader = await uploadServices.fetch(
      new Request("http://in-process.test/api/files/priv-x.pdf", {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(validHeader.status).toBe(404);
  });

  test("DELETE valid berhasil; traversal, token invalid, dan storage error ditolak", async () => {
    const up = await uploadServices.fetch(
      uploadReq(new File(["bye"], "hapus.png", { type: "image/png" }), { public: "true" }),
    );
    const { url, deleteToken } = (await up.json()) as { url: string; deleteToken: string };
    const name = url.split("/").pop()!;
    const ok = await uploadServices.fetch(
      new Request(`http://in-process.test/api/files/${name}?deleteToken=${encodeURIComponent(deleteToken)}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(ok.status).toBe(200);

    const bad = await uploadServices.fetch(
      new Request(`http://in-process.test/api/files/${name}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(bad.status).toBe(403);

    const traversal = await uploadServices.fetch(
      new Request(`http://in-process.test/api/files/a%5Cb.png?deleteToken=x`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(traversal.status).toBe(403);

    store.set("public/pub-delete-error.png", { content: new Uint8Array([1]) });
    failNextDelete = true;
    const failingToken = createDeleteToken("pub-delete-error.png");
    const originalError = console.error;
    console.error = mock(() => {});
    try {
      const failed = await uploadServices.fetch(
        new Request(
          `http://in-process.test/api/files/pub-delete-error.png?deleteToken=${encodeURIComponent(failingToken)}`,
          { method: "DELETE", headers: { authorization: `Bearer ${token}` } },
        ),
      );
      expect(failed.status).toBe(502);
    } finally {
      console.error = originalError;
      failNextDelete = false;
    }
  });

  test("validasi extension dan kedua batas ukuran", async () => {
    const extension = await uploadServices.fetch(
      uploadReq(new File(["x"], "tanpa-ekstensi", { type: "text/plain" })),
    );
    expect(extension.status).toBe(400);

    const bigImage = new File([new Uint8Array(6 * 1024 * 1024)], "besar.png", { type: "image/png" });
    expect((await uploadServices.fetch(uploadReq(bigImage, { public: "true" }))).status).toBe(400);

    const bigDocument = new File([new Uint8Array(101 * 1024 * 1024)], "besar.zip", {
      type: "application/zip",
    });
    expect((await uploadServices.fetch(uploadReq(bigDocument))).status).toBe(400);
  });
});
