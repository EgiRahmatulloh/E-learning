// Uji unit untuk src/server/services/storage.ts — pembersihan berkas R2.
// R2 dimatikan (isR2Enabled=false) dan bucket di-stub, sehingga semua jalur
// diamati lewat resolveR2Bucket palsu + pencatat DELETE, tanpa jaringan.
// Jalankan: bun test tests/storage.test.ts
import { describe, expect, mock, test } from "bun:test";

// jwt.ts melempar bila JWT_SECRET hilang — bun test tidak selalu memuat
// .env.local, jadi pasang fallback untuk sesi test saja.
if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "test-secret-untuk-unit-test";

const deleted: string[] = [];
const fakeClient = {
  file: (name: string) => ({
    delete: async () => {
      deleted.push(name);
    },
  }),
};

mock.module("../src/server/config/r2.ts", () => ({
  // R2 "mati" agar deleteStoredFiles berhenti sebelum menyentuh jaringan.
  isR2Enabled: false,
  R2_PUBLIC_URL: "https://cdn.test",
  resolveR2Bucket: (name: string) => ({ client: fakeClient, bucket: "test", isPublic: true }),
}));

const {
  cleanupReplacedFiles,
  cleanupRowFiles,
  cleanupRowsFiles,
  collectFileNames,
  createDeleteToken,
  deleteStoredFiles,
  storedFileName,
  verifyDeleteToken,
} = await import("../src/server/services/storage");

describe("storedFileName", () => {
  test("URL proxy /api/files/ → nama objek", () => {
    expect(storedFileName("/api/files/abc123.png")).toBe("abc123.png");
  });

  test("query/hash dibuang (token pratinjau privat)", () => {
    expect(storedFileName("/api/files/priv-a.png?token=xyz")).toBe("priv-a.png");
    expect(storedFileName("/api/files/a.png#frag")).toBe("a.png");
  });

  test("URL CDN publik dikenali", () => {
    expect(storedFileName("https://cdn.test/foto.png")).toBe("foto.png");
  });

  test("bukan milik kita → null (eksternal, base64, aset statis, path traversal)", () => {
    expect(storedFileName("https://lain.com/a.png")).toBeNull();
    expect(storedFileName("data:image/png;base64,AAAA")).toBeNull();
    expect(storedFileName("/images/logo.png")).toBeNull();
    expect(storedFileName("/api/files/../secret.png")).toBeNull();
    expect(storedFileName("/api/files/a/b.png")).toBeNull();
    expect(storedFileName("/api/files/")).toBeNull();
    expect(storedFileName("")).toBeNull();
    expect(storedFileName(null)).toBeNull();
    expect(storedFileName(123)).toBeNull();
  });
});

describe("collectFileNames", () => {
  test("URL tunggal, array JSON string, dan objek berkas", () => {
    expect(collectFileNames("/api/files/a.png")).toEqual(["a.png"]);
    expect(collectFileNames('["/api/files/a.png","/api/files/b.png"]')).toEqual([
      "a.png",
      "b.png",
    ]);
    expect(collectFileNames({ kk: "/api/files/kk.png", ktp: "/api/files/ktp.png" })).toEqual([
      "kk.png",
      "ktp.png",
    ]);
  });

  test("nilai non-berkas menghasilkan [] (tanpa throw)", () => {
    expect(collectFileNames(null)).toEqual([]);
    expect(collectFileNames("teks biasa")).toEqual([]);
    expect(collectFileNames("[json rusak")).toEqual([]);
    expect(collectFileNames(["/api/files/a.png", "bukan-url"])).toEqual(["a.png"]);
  });

  test("array bersarang ikut dikumpulkan", () => {
    expect(collectFileNames([["/api/files/a.png"]])).toEqual(["a.png"]);
  });
});

describe("deleteStoredFiles (R2 mati)", () => {
  test("langsung return tanpa DELETE bila R2 tidak dikonfigurasi", async () => {
    deleted.length = 0;
    await deleteStoredFiles(["a.png", "b.png"]);
    expect(deleted).toEqual([]);
  });

  test("daftar kosong aman", async () => {
    await expect(deleteStoredFiles([])).resolves.toBeUndefined();
  });
});

describe("cleanupReplacedFiles (R2 mati)", () => {
  test("return tanpa aksi: before null / tidak ada berkas lama", async () => {
    await expect(cleanupReplacedFiles(null, {}, ["foto"])).resolves.toBeUndefined();
    await expect(
      cleanupReplacedFiles({ foto: "teks" }, { foto: "lain" }, ["foto"]),
    ).resolves.toBeUndefined();
  });

  test("menghitung diff tanpa jaringan — hanya berkas yang dilepas", async () => {
    // Dengan R2 mati tidak ada DELETE sungguhan; yang diasertikan: tidak throw
    // dan tidak menyentuh berkas yang masih dipakai after.
    await expect(
      cleanupReplacedFiles(
        { foto: "/api/files/lama.png" },
        { foto: "/api/files/baru.png" },
        ["foto"],
      ),
    ).resolves.toBeUndefined();
    await expect(
      cleanupReplacedFiles(
        { foto: "/api/files/sama.png" },
        { foto: "/api/files/sama.png" },
        ["foto"],
      ),
    ).resolves.toBeUndefined();
  });

  test("opsi keep melindungi berkas yang dibagi antar baris", async () => {
    await expect(
      cleanupReplacedFiles(
        { foto: "/api/files/bagi.png" },
        { foto: "" },
        ["foto"],
        { keep: ["/api/files/bagi.png"] },
      ),
    ).resolves.toBeUndefined();
  });
});

describe("cleanupRowFiles / cleanupRowsFiles (R2 mati)", () => {
  test("aman untuk null / array kosong", async () => {
    await expect(cleanupRowFiles(null, ["foto"])).resolves.toBeUndefined();
    await expect(cleanupRowsFiles([], ["foto"])).resolves.toBeUndefined();
    await expect(cleanupRowsFiles(null, ["foto"])).resolves.toBeUndefined();
  });

  test("baris berisi berkas tidak melempar", async () => {
    await expect(
      cleanupRowFiles({ foto: "/api/files/a.png" }, ["foto"]),
    ).resolves.toBeUndefined();
    await expect(
      cleanupRowsFiles([{ foto: "/api/files/a.png" }], ["foto"]),
    ).resolves.toBeUndefined();
  });
});

describe("token hapus (HMAC + TTL 12 jam)", () => {
  const now = 1_700_000_000_000;

  test("token yang baru dibuat langsung valid", () => {
    const token = createDeleteToken("foto.png", now);
    expect(verifyDeleteToken("foto.png", token, now + 1000)).toBe(true);
  });

  test("token untuk file lain ditolak", () => {
    const token = createDeleteToken("a.png", now);
    expect(verifyDeleteToken("b.png", token, now + 1000)).toBe(false);
  });

  test("token kedaluwarsa ditolak", () => {
    const token = createDeleteToken("foto.png", now);
    // TTL 12 jam → +13 jam sudah basi
    expect(verifyDeleteToken("foto.png", token, now + 13 * 3600 * 1000)).toBe(false);
  });

  test("format rusak / kosong ditolak tanpa throw", () => {
    expect(verifyDeleteToken("a.png", undefined, now)).toBe(false);
    expect(verifyDeleteToken("a.png", "", now)).toBe(false);
    expect(verifyDeleteToken("a.png", "tanpa-titik", now)).toBe(false);
    expect(verifyDeleteToken("a.png", "bukan-angka.xyz", now)).toBe(false);
  });

  test("signature yang diubah ditolak", () => {
    const token = createDeleteToken("foto.png", now);
    const [exp] = token.split(".");
    expect(verifyDeleteToken("foto.png", `${exp}.c29tZXRoaW5nLWVsc2U`, now + 1000)).toBe(false);
  });
});
