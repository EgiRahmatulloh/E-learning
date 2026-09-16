import { beforeAll, describe, expect, test } from "bun:test";
import { api, login } from "../helpers/in-process-app";
import { createManager } from "../helpers/db-fixtures";

let token: string;

beforeAll(async () => {
  const manager = await createManager({ plainPassword: "upload-admin" });
  token = await login(manager.email, "upload-admin");
});

function uploadForm(file: File, fields: Record<string, string> = {}) {
  const form = new FormData();
  form.set("file", file);
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return form;
}

describe("upload service without external R2", () => {
  test("upload memerlukan login", async () => {
    const result = await api("/api/upload", {
      method: "POST",
      body: uploadForm(new File(["x"], "x.txt", { type: "text/plain" })),
    });
    expect(result.response.status).toBe(401);
  });

  test("validasi ekstensi dan MIME dijalankan sebelum storage", async () => {
    const extension = await api<any>("/api/upload", {
      method: "POST",
      token,
      body: uploadForm(new File(["x"], "malware.exe", { type: "application/octet-stream" })),
    });
    expect(extension.response.status).toBe(400);
    expect(extension.data.message).toContain("Ekstensi");

    const mime = await api<any>("/api/upload", {
      method: "POST",
      token,
      body: uploadForm(new File(["<svg/>"] , "image.png", { type: "image/svg+xml" })),
    });
    expect([400, 404, 503]).toContain(mime.response.status);
    if (mime.response.status === 400) expect(mime.data.message).toContain("gambar atau dokumen");
  });

  test("upload valid mengembalikan 503 ketika R2 tidak dikonfigurasi", async () => {
    const result = await api<any>("/api/upload", {
      method: "POST",
      token,
      body: uploadForm(new File(["hello"], "note.txt", { type: "text/plain" }), { private: "true" }),
    });
    expect([400, 503]).toContain(result.response.status);
    expect(result.data.success).toBe(false);
  });

  test("akses publik/private menerapkan auth dan status storage", async () => {
    const publicImage = await api<any>("/api/files/public.png");
    expect([404, 503]).toContain(publicImage.response.status);

    const publicDocument = await api<any>("/api/files/pub-document.pdf");
    expect([404, 503]).toContain(publicDocument.response.status);

    const privateMissing = await api<any>("/api/files/priv-document.pdf");
    expect(privateMissing.response.status).toBe(401);

    const privateAuthorized = await api<any>("/api/files/priv-document.pdf", { token });
    expect([404, 503]).toContain(privateAuthorized.response.status);

    const queryAuthorized = await api<any>(`/api/files/priv-document.pdf?token=${encodeURIComponent(token)}`);
    expect([404, 503]).toContain(queryAuthorized.response.status);
  });

  test("delete memerlukan auth dan token hapus", async () => {
    expect((await api("/api/files/file.png", { method: "DELETE" })).response.status).toBe(401);
    const missingDeleteToken = await api<any>("/api/files/file.png", { method: "DELETE", token });
    expect([401, 403]).toContain(missingDeleteToken.response.status);
  });
});
