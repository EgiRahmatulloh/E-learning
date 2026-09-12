import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const unitDir = resolve(root, "tests/backend/unit");
const timeoutFlag = "--timeout=15000";

// mock.module bersifat global sepanjang proses Bun. Jalankan setiap suite yang
// memasang mock modul dalam proses sendiri agar tidak mengubah subject suite lain.
const isolated = new Set([
  "angket-db-failure.test.ts",
  "auth-db-failure.test.ts",
  "content-cleanup.test.ts",
  "content-db-failure.test.ts",
  "elearning-course-forum-db-failure.test.ts",
  "elearning-course-session-conflict.test.ts",
  "elearning-monitoring-db-failure.test.ts",
  "elearning-setup-db-failure.test.ts",
  "elearning-small-db-failure.test.ts",
  "people-db-failure.test.ts",
  "stats-failure.test.ts",
  "storage-r2-enabled.test.ts",
  "storage.test.ts",
  "students-db-failure.test.ts",
]);

const all = readdirSync(unitDir).filter((name) => name.endsWith(".test.ts")).sort();
// Daftar eksplisit menjaga intent, deteksi isi menjaga suite mock baru tetap aman.
for (const name of all) {
  if (readFileSync(resolve(unitDir, name), "utf8").includes("mock.module(")) isolated.add(name);
}
const groups = [
  all.filter((name) => !isolated.has(name)).map((name) => `tests/backend/unit/${name}`),
  ...all.filter((name) => isolated.has(name)).map((name) => [`tests/backend/unit/${name}`]),
];

for (const tests of groups) {
  if (tests.length === 0) continue;
  const result = Bun.spawnSync({
    // Keep child suites on the same Bun runtime as this runner. A local stale
    // bun shim in node_modules/.bin must not change test semantics/coverage.
    cmd: [process.execPath, "test", ...tests, timeoutFlag],
    cwd: root,
    env: {
      ...process.env,
      DATABASE_URL: ":memory:",
      R2_ACCOUNT_ID: "",
      R2_ACCESS_KEY_ID: "",
      R2_SECRET_ACCESS_KEY: "",
      R2_PUBLIC_URL: "",
    },
    stdout: "inherit",
    stderr: "inherit",
  });
  if (result.exitCode !== 0) process.exit(result.exitCode);
}
