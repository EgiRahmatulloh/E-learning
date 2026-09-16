// R2 enabled config: fresh import dengan query param agar tidak memakai
// module cache dari test lain. Env R2 di-set SEBELUM import, lalu dikembalikan.
// Bun mencatat record LCOV terpisah; validator menggabungkannya (union).
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

const saved = { ...Bun.env };
let serial = 0;

beforeEach(() => {
  Bun.env.R2_ACCOUNT_ID = "test-acct";
  Bun.env.R2_ACCESS_KEY_ID = "test-key";
  Bun.env.R2_SECRET_ACCESS_KEY = "test-secret";
  Bun.env.R2_PUBLIC_URL = "https://pub-test.r2.dev";
});

afterEach(() => {
  for (const key of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_PUBLIC_URL"]) {
    if (saved[key] === undefined) delete Bun.env[key];
    else Bun.env[key] = saved[key];
  }
});

describe("r2 config enabled (fresh import)", () => {
  test("client terisi dan bucket ter-resolve dengan client", async () => {
    const m = await import(`../../../src/server/config/r2.ts?enabled=${Date.now()}-${serial++}`);
    expect(m.isR2Enabled).toBe(true);
    expect(m.r2PublicClient).not.toBeNull();
    expect(m.r2PrivateClient).not.toBeNull();
    expect(m.r2SubmissionsClient).not.toBeNull();
    expect(m.isR2PublicUrlValid).toBe(true);
    expect(m.getR2PublicUrl("a.png")).toBe("https://pub-test.r2.dev/a.png");

    const priv = m.resolveR2Bucket("priv-x.png");
    expect(priv.bucket).toBe(m.R2_PRIVATE_BUCKET_NAME);
    expect(priv.client).not.toBeNull();
    expect(priv.isPublic).toBe(false);

    const subm = m.resolveR2Bucket("subm-x.pdf");
    expect(subm.bucket).toBe(m.R2_SUBMISSIONS_BUCKET_NAME);
    expect(subm.client).not.toBeNull();

    const pub = m.resolveR2Bucket("foto.png");
    expect(pub.bucket).toBe(m.R2_PUBLIC_BUCKET_NAME);
    expect(pub.client).not.toBeNull();
    expect(pub.isPublic).toBe(true);

    const doc = m.resolveR2Bucket("laporan.pdf");
    expect(doc.bucket).toBe(m.R2_PRIVATE_BUCKET_NAME);
    expect(doc.client).not.toBeNull();
  });

  test("R2_PUBLIC_URL invalid (sama dengan endpoint) → fallback proxy", async () => {
    Bun.env.R2_PUBLIC_URL = "https://test-acct.r2.cloudflarestorage.com";
    const m = await import(`../../../src/server/config/r2.ts?invalid=${Date.now()}-${serial++}`);
    expect(m.isR2Enabled).toBe(true);
    expect(m.isR2PublicUrlValid).toBe(false);
    expect(m.getR2PublicUrl("a.png")).toBeNull();
  });

  test("tanpa R2_PUBLIC_URL → proxy files", async () => {
    delete Bun.env.R2_PUBLIC_URL;
    const m = await import(`../../../src/server/config/r2.ts?nourl=${Date.now()}-${serial++}`);
    expect(m.isR2Enabled).toBe(true);
    expect(m.isR2PublicUrlValid).toBe(false);
    expect(m.getR2PublicUrl("a.png")).toBeNull();
  });
});
