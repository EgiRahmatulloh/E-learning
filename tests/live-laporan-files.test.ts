// Integration test live-server: laporan xlsx + JSON + upload/files R2.
// Laporan dibaca sebagai binary lalu diverifikasi magic bytes ZIP (xlsx =
// arsip ZIP: "PK\x03\x04") + content-type spreadsheet. Upload memakai nama
// unik dan selalu dibersihkan via deleteToken agar tidak mencemari bucket R2.
// Prasyarat: server jalan (BASE_URL). Jalankan: bun test tests/live-laporan-files.test.ts
import { beforeAll, describe, expect, test } from "bun:test";
import { api, authHeader, BASE_URL, loginAdmin } from "./live-helpers";

let token: string;
beforeAll(async () => {
  token = await loginAdmin();
});
const H = () => authHeader(token);

/** GET binary mentah (laporan xlsx) beserta header. */
async function getBinary(path: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, buf, contentType: res.headers.get("content-type") ?? "" };
}

const isXlsx = (buf: Buffer) => buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
const SPREADSHEET_CT = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

describe("laporan JSON (data mentah kehadiran & nilai)", () => {
  test("student-attendances JSON: grid d1..d31 + rekap", async () => {
    const res = await api("/api/elearning/laporan/student-attendances?setupId=394", {
      headers: H(),
    });
    expect(res.status).toBe(200);
    const rows = (res.body as { data: Record<string, string>[] }).data;
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty("d1");
    expect(rows[0]).toHaveProperty("namaSiswa");
  });

  test("tanpa setupId → 400; tanpa token → 401", async () => {
    const noParam = await api("/api/elearning/laporan/student-attendances", { headers: H() });
    expect(noParam.status).toBe(400);
    expect((await api("/api/elearning/laporan/student-attendances?setupId=394")).status).toBe(401);
  });
});

describe("laporan xlsx (unduhan binary)", () => {
  test("tutor-attendance xlsx valid", async () => {
    const { status, buf, contentType } = await getBinary(
      "/api/elearning/laporan/tutor-attendance",
      H(),
    );
    expect(status).toBe(200);
    expect(contentType).toContain(SPREADSHEET_CT);
    expect(isXlsx(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(50_000);
  });

  test("student-attendance xlsx per mapel valid", async () => {
    const { status, buf, contentType } = await getBinary(
      "/api/elearning/laporan/student-attendance?setupId=394",
      H(),
    );
    expect(status).toBe(200);
    expect(contentType).toContain(SPREADSHEET_CT);
    expect(isXlsx(buf)).toBe(true);
  });

  test("tanpa setupId → 400 (bukan xlsx rusak)", async () => {
    const res = await api("/api/elearning/laporan/student-attendance", { headers: H() });
    expect(res.status).toBe(400);
  });

  test("student-grades + grades-rekap + attendance-rekap + tutor-agenda xlsx valid", async () => {
    const paths = [
      "/api/elearning/laporan/student-grades?setupId=394",
      "/api/elearning/laporan/student-attendance-rekap?kelas=PAKET%20C%2010",
      "/api/elearning/laporan/student-grades-rekap?kelas=PAKET%20C%2010",
      "/api/elearning/laporan/tutor-agenda?setupId=394",
    ];
    for (const path of paths) {
      const { status, buf, contentType } = await getBinary(path, H());
      expect(status).toBe(200);
      expect(contentType).toContain(SPREADSHEET_CT);
      expect(isXlsx(buf)).toBe(true);
    }
  }, 120_000);

  test("laporan tanpa token → 401", async () => {
    const { status } = await getBinary("/api/elearning/laporan/tutor-attendance");
    expect(status).toBe(401);
  });
});

describe("upload + files (R2)", () => {
  /** Upload satu PNG kecil, kembalikan { fileName, deleteToken }. */
  async function uploadPng(suffix: string) {
    const fd = new FormData();
    const bytes = new Uint8Array(64).fill(0x89);
    fd.append("file", new File([bytes], `it-${suffix}.png`, { type: "image/png" }));
    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      headers: H(),
      body: fd,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { url: string; deleteToken: string };
    expect(body.url).toBeString();
    expect(body.deleteToken).toBeString();
    const fileName = body.url.split("/").pop()!.split("?")[0];
    return { fileName, deleteToken: body.deleteToken };
  }

  test("upload → hapus dengan deleteToken → 200", async () => {
    const { fileName, deleteToken } = await uploadPng("hapus");
    const del = await fetch(
      `${BASE_URL}/api/files/${fileName}?deleteToken=${encodeURIComponent(deleteToken)}`,
      { method: "DELETE", headers: H() },
    );
    expect(del.status).toBe(200);
  });

  test("hapus tanpa deleteToken → 403 (login saja tidak cukup)", async () => {
    const { fileName, deleteToken } = await uploadPng("aman");
    try {
      const del = await fetch(`${BASE_URL}/api/files/${fileName}`, {
        method: "DELETE",
        headers: H(),
      });
      expect(del.status).toBe(403);
    } finally {
      await fetch(
        `${BASE_URL}/api/files/${fileName}?deleteToken=${encodeURIComponent(deleteToken)}`,
        { method: "DELETE", headers: H() },
      );
    }
  });

  test("ekstensi terlarang (.exe) & SVG → 400", async () => {
    for (const [name, type] of [["it-x.exe", "application/octet-stream"], ["it-x.svg", "image/svg+xml"]]) {
      const fd = new FormData();
      fd.append("file", new File(["x"], name, { type }));
      const res = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        headers: H(),
        body: fd,
      });
      expect(res.status).toBe(400);
    }
  });

  test("upload tanpa token → 401", async () => {
    const fd = new FormData();
    fd.append("file", new File(["x"], "it-x.png", { type: "image/png" }));
    const res = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: fd });
    expect(res.status).toBe(401);
  });

  test("path traversal pada download → 403", async () => {
    const res = await fetch(`${BASE_URL}/api/files/..%2Fsecret`, { headers: H() });
    expect([403, 404]).toContain(res.status);
  });
});
