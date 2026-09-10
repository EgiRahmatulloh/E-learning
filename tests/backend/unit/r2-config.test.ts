// Uji unit untuk src/server/config/r2.ts — routing bucket:
// priv-* → private, subm-* → submissions, pub-*/gambar → public,
// dokumen tanpa prefix → private. R2_PUBLIC_URL hanya dipakai bila valid
// (bukan endpoint S3). Modul diimpor langsung: tanpa env R2 ia nonaktif
// (isR2Enabled=false, client null) — kondisi yang aman untuk CI.
// Jalankan: bun run test:be:unit
import { describe, expect, test } from "bun:test";
import {
  getR2PublicUrl,
  isR2Enabled,
  isR2PublicUrlValid,
  R2_PRIVATE_BUCKET_NAME,
  R2_PUBLIC_BUCKET_NAME,
  R2_PUBLIC_URL,
  R2_SUBMISSIONS_BUCKET_NAME,
  resolveR2Bucket,
} from "../../../src/server/config/r2";

describe("resolveR2Bucket", () => {
  test("priv-* selalu private walau berupa gambar", () => {
    const r = resolveR2Bucket("priv-scan-kk.png");
    expect(r.bucket).toBe(R2_PRIVATE_BUCKET_NAME);
    expect(r.isPublic).toBe(false);
  });

  test("subm-* selalu ke bucket submissions", () => {
    const r = resolveR2Bucket("subm-tugas.pdf");
    expect(r.bucket).toBe(R2_SUBMISSIONS_BUCKET_NAME);
    expect(r.isPublic).toBe(false);
  });

  test("gambar publik (jpg/png/webp/gif) → bucket public", () => {
    for (const name of ["foto.png", "x.JPG", "a.webp", "b.gif", "c.jpeg"]) {
      const r = resolveR2Bucket(name);
      expect(r.bucket).toBe(R2_PUBLIC_BUCKET_NAME);
      expect(r.isPublic).toBe(true);
    }
  });

  test("pub-* non-gambar tetap public (dokumen Pusat Unduhan)", () => {
    const r = resolveR2Bucket("pub-panduan.pdf");
    expect(r.bucket).toBe(R2_PUBLIC_BUCKET_NAME);
    expect(r.isPublic).toBe(true);
  });

  test("dokumen tanpa prefix → private (butuh auth)", () => {
    const r = resolveR2Bucket("laporan.pdf");
    expect(r.bucket).toBe(R2_PRIVATE_BUCKET_NAME);
    expect(r.isPublic).toBe(false);
  });

  test("tanpa R2 (CI): semua client null", () => {
    if (!isR2Enabled) {
      expect(resolveR2Bucket("foto.png").client).toBeNull();
      expect(resolveR2Bucket("priv-a.png").client).toBeNull();
      expect(resolveR2Bucket("subm-a.pdf").client).toBeNull();
    }
  });
});

describe("getR2PublicUrl", () => {
  test("konsisten dengan isR2PublicUrlValid", () => {
    const url = getR2PublicUrl("foto.png");
    if (isR2PublicUrlValid) {
      expect(url).toBe(`${R2_PUBLIC_URL}/foto.png`);
    } else {
      expect(url).toBeNull();
    }
  });

  test("R2_PUBLIC_URL tanpa trailing slash", () => {
    expect(R2_PUBLIC_URL.endsWith("/")).toBe(false);
  });
});
