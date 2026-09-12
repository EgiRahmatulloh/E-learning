import { describe, expect, mock, test } from "bun:test";

if (!Bun.env.JWT_SECRET) Bun.env.JWT_SECRET = "storage-r2-test-secret";

const deleted: string[] = [];
const failures = new Set<string>();

const fakeClient = {
  file(name: string) {
    return {
      async delete() {
        if (failures.has(name)) throw new Error("delete failed");
        deleted.push(name);
      },
    };
  },
};

mock.module("../../../src/server/config/r2.ts", () => ({
  isR2Enabled: true,
  R2_PUBLIC_URL: "https://cdn.enabled.test",
  resolveR2Bucket: (name: string) => ({
    client: name === "missing.png" ? null : fakeClient,
    bucket: "test",
    isPublic: true,
  }),
}));

const {
  cleanupReplacedFiles,
  cleanupRowFiles,
  cleanupRowsFiles,
  createDeleteToken,
  deleteStoredFiles,
  storedFileName,
  verifyDeleteToken,
} = await import("../../../src/server/services/storage");

describe("storage with R2 enabled", () => {
  test("delete menduplikasi nama hanya sekali dan melewati client kosong", async () => {
    deleted.length = 0;
    await deleteStoredFiles(["a.png", "a.png", "missing.png"]);
    expect(deleted).toEqual(["a.png"]);
  });

  test("kegagalan satu file best-effort dan tidak menghentikan file lain", async () => {
    deleted.length = 0;
    failures.add("bad.png");
    const original = console.error;
    console.error = mock(() => {});
    try {
      await deleteStoredFiles(["bad.png", "good.png"]);
    } finally {
      console.error = original;
      failures.delete("bad.png");
    }
    expect(deleted).toEqual(["good.png"]);
  });

  test("cleanup diff, keep, nested rows, dan CDN URL", async () => {
    deleted.length = 0;
    expect(storedFileName("https://cdn.enabled.test/cdn.png")).toBe("cdn.png");
    await cleanupReplacedFiles(
      { foto: ["/api/files/old.png", "/api/files/shared.png"] },
      { foto: "/api/files/new.png" },
      ["foto"],
      { keep: ["/api/files/shared.png"] },
    );
    await cleanupRowFiles({ foto: "/api/files/row.png" }, ["foto"]);
    await cleanupRowsFiles(
      [{ berkas: { kk: "/api/files/kk.png" } }, { berkas: '["/api/files/ijazah.png"]' }],
      ["berkas"],
      { keep: ["/api/files/shared-row.png"] },
    );
    expect(deleted.sort()).toEqual(["ijazah.png", "kk.png", "old.png", "row.png"]);
  });

  test("token valid tepat pada batas expiry dan menolak signature beda panjang", () => {
    const now = 1_800_000_000_000;
    const token = createDeleteToken("encoded name.png", now);
    const [expires] = token.split(".");
    expect(verifyDeleteToken("encoded name.png", token, Number(expires))).toBe(true);
    expect(verifyDeleteToken("encoded name.png", `${expires}.x`, now)).toBe(false);
  });
});
