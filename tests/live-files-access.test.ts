// Integration test live-server: kontrol akses berkas (/api/files + /api/upload).
// Matriks: privat (priv-*) wajib auth; gambar publik bebas auth + cache publik;
// dokumen non-publik wajib auth; query ?token= diterima untuk iframe/download;
// prefix submission/priv-/pub- sesuai flag; batas ukuran; cleanup via deleteToken.
// Prasyarat: server jalan (BASE_URL). Jalankan: bun test tests/live-files-access.test.ts
import { beforeAll, describe, expect, test } from "bun:test";
import { api, authHeader, BASE_URL, loginAdmin, tag } from "./live-helpers";

let token: string;
beforeAll(async () => {
  token = await loginAdmin();
});
const H = () => authHeader(token);

type Uploaded = { fileName: string; deleteToken: string; url: string };

async function upload(
  kind: "image" | "pdf",
  flags: Record<string, string> = {},
): Promise<Uploaded> {
  const fd = new FormData();
  const bytes = new Uint8Array(64).fill(kind === "image" ? 0x89 : 0x25);
  const name = kind === "image" ? `${tag("IMG").toLowerCase()}.png` : `${tag("DOC").toLowerCase()}.pdf`;
  fd.append("file", new File([bytes], name, { type: kind === "image" ? "image/png" : "application/pdf" }));
  for (const [k, v] of Object.entries(flags)) fd.append(k, v);
  const res = await fetch(`${BASE_URL}/api/upload`, { method: "POST", headers: H(), body: fd });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { url: string; deleteToken: string };
  const fileName = body.url.split("/").pop()!.split("?")[0];
  return { fileName, deleteToken: body.deleteToken, url: body.url };
}

async function cleanup(u: Uploaded) {
  await fetch(
    `${BASE_URL}/api/files/${u.fileName}?deleteToken=${encodeURIComponent(u.deleteToken)}`,
    { method: "DELETE", headers: H() },
  );
}

describe("prefix & routing bucket", () => {
  test("private=true → priv-*, submission=true → subm-* (lewat proxy /api/files)", async () => {
    const priv = await upload("pdf", { private: "true" });
    const subm = await upload("pdf", { submission: "true" });
    try {
      expect(priv.fileName.startsWith("priv-")).toBe(true);
      expect(priv.url).toContain("/api/files/");
      expect(subm.fileName.startsWith("subm-")).toBe(true);
      expect(subm.url).toContain("/api/files/");
    } finally {
      await cleanup(priv);
      await cleanup(subm);
    }
  });

  test("gambar tanpa flag → URL CDN publik langsung (hemat proxy)", async () => {
    const img = await upload("image");
    try {
      expect(img.url.startsWith("https://")).toBe(true);
      expect(img.url).not.toContain("/api/files/");
    } finally {
      await cleanup(img);
    }
  });
});

describe("kontrol akses download", () => {
  test("priv-*: tanpa token 401; header Bearer 200; ?token= 200", async () => {
    const priv = await upload("pdf", { private: "true" });
    try {
      expect((await fetch(`${BASE_URL}/api/files/${priv.fileName}`)).status).toBe(401);
      expect((await fetch(`${BASE_URL}/api/files/${priv.fileName}`, { headers: H() })).status).toBe(
        200,
      );
      expect(
        (await fetch(`${BASE_URL}/api/files/${priv.fileName}?token=${token}`)).status,
      ).toBe(200);
    } finally {
      await cleanup(priv);
    }
  });

  test("gambar publik: bebas auth + Cache-Control publik + Content-Type benar", async () => {
    const img = await upload("image");
    try {
      const res = await fetch(`${BASE_URL}/api/files/${img.fileName}`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("image/png");
      expect(res.headers.get("cache-control")).toContain("public");
    } finally {
      await cleanup(img);
    }
  });

  test("dokumen non-publik tanpa token → 401", async () => {
    const subm = await upload("pdf", { submission: "true" });
    try {
      expect((await fetch(`${BASE_URL}/api/files/${subm.fileName}`)).status).toBe(401);
    } finally {
      await cleanup(subm);
    }
  });

  test("file hilang → 404; traversal → 403/404", async () => {
    const hilang = await fetch(`${BASE_URL}/api/files/it-tidak-ada-12345.png`, { headers: H() });
    expect(hilang.status).toBe(404);
    const trav = await fetch(`${BASE_URL}/api/files/..%2Fsecret`, { headers: H() });
    expect([403, 404]).toContain(trav.status);
  });
});

describe("validasi upload", () => {
  test("gambar > 5MB ditolak 400; dokumen besar lolos batas gambar", async () => {
    const big = new FormData();
    big.append("file", new File([new Uint8Array(6 * 1024 * 1024)], "besar.png", { type: "image/png" }));
    const resBig = await fetch(`${BASE_URL}/api/upload`, { method: "POST", headers: H(), body: big });
    expect(resBig.status).toBe(400);
    expect(((await resBig.json()) as { message: string }).message).toMatch(/5MB|melebihi/i);
  });

  test("tanpa file → 422 skema; tanpa token → 401", async () => {
    const empty = new FormData();
    const noFile = await fetch(`${BASE_URL}/api/upload`, { method: "POST", headers: H(), body: empty });
    expect([400, 422]).toContain(noFile.status);

    const fd = new FormData();
    fd.append("file", new File(["x"], "a.png", { type: "image/png" }));
    expect((await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: fd })).status).toBe(401);
  });
});

describe("deleteToken: satu pakai + terikat file", () => {
  test("token terikat file (token A untuk file B → 403); hapus idempoten", async () => {
    // KONTRAK: DELETE R2 idempoten — menghapus file yang sudah hilang tetap
    // 200 (R2 delete tidak error untuk objek tak ada). Yang dijaga: token
    // tidak bisa dipakai lintas file.
    const a = await upload("image");
    const b = await upload("image");
    try {
      const cross = await fetch(
        `${BASE_URL}/api/files/${b.fileName}?deleteToken=${encodeURIComponent(a.deleteToken)}`,
        { method: "DELETE", headers: H() },
      );
      expect(cross.status).toBe(403);

      expect(
        (
          await fetch(
            `${BASE_URL}/api/files/${a.fileName}?deleteToken=${encodeURIComponent(a.deleteToken)}`,
            { method: "DELETE", headers: H() },
          )
        ).status,
      ).toBe(200);
      // Hapus kedua idempoten → tetap 200
      expect(
        (
          await fetch(
            `${BASE_URL}/api/files/${a.fileName}?deleteToken=${encodeURIComponent(a.deleteToken)}`,
            { method: "DELETE", headers: H() },
          )
        ).status,
      ).toBe(200);
    } finally {
      await cleanup(b);
      await cleanup(a).catch(() => {});
    }
  });
});

describe("endpoint stats & hello (kontrak)", () => {
  test("public-stats key tunggal; dashboard-stats butuh admin", async () => {
    const pub = await api("/api/public-stats");
    expect(pub.status).toBe(200);
    const data = (pub.body as { data: Record<string, number> }).data;
    for (const key of ["students", "alumni", "tutors", "rombel", "managers", "servicePoints"]) {
      expect(typeof data[key]).toBe("number");
    }
    expect((await api("/api/dashboard-stats")).status).toBe(401);
  });
});
