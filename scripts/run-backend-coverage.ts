import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const liveLcov = resolve(root, "coverage/backend/lcov.info");
const runsDir = resolve(root, "coverage/backend/runs");
mkdirSync(runsDir, { recursive: true });

const coverageFlags = [
  "--coverage",
  "--coverage-reporter=text",
  "--coverage-reporter=lcov",
  "--coverage-dir=coverage/backend",
  // Hash password dan proses workbook lebih lambat saat instrumentasi coverage.
  // Timeout ini hanya berlaku pada runner coverage, bukan test biasa.
  "--timeout=15000",
];

interface CoverageRun {
  name: string;
  tests: string[];
  env?: Record<string, string>;
}

const noR2Env = {
  DATABASE_URL: ":memory:",
  R2_ACCOUNT_ID: "",
  R2_ACCESS_KEY_ID: "",
  R2_SECRET_ACCESS_KEY: "",
  R2_PUBLIC_URL: "",
};

const isolatedUnit = new Set([
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
const allUnit = readdirSync(resolve(root, "tests/backend/unit"))
  .filter((name) => name.endsWith(".test.ts"))
  .sort();
// Keep the maintained explicit list above for known suites, and automatically
// isolate newly added mock.module suites so coverage cannot cross-contaminate.
for (const name of allUnit) {
  const source = readFileSync(resolve(root, "tests/backend/unit", name), "utf8");
  if (source.includes("mock.module(")) isolatedUnit.add(name);
}
const coreUnit = allUnit
  .filter((name) => !isolatedUnit.has(name))
  .map((name) => `tests/backend/unit/${name}`);
const isolatedUnitRuns: CoverageRun[] = allUnit
  .filter((name) => isolatedUnit.has(name))
  .map((name) => ({
    name: `unit-${name.replace(/\.test\.ts$/, "")}`,
    tests: [`tests/backend/unit/${name}`],
    env: noR2Env,
  }));

const inprocessFiles = readdirSync(resolve(root, "tests/backend/inprocess"))
  .filter((name) => name.endsWith(".test.ts"))
  .sort();
const inprocessRuns: CoverageRun[] = inprocessFiles.map((name) => ({
  name: `inprocess-${name.replace(/\.test\.ts$/, "")}`,
  tests: [`tests/backend/inprocess/${name}`],
  env: noR2Env,
}));

const r2Base = {
  R2_ACCOUNT_ID: "coverage-account",
  R2_ACCESS_KEY_ID: "coverage-key",
  R2_SECRET_ACCESS_KEY: "coverage-secret",
};

const runs: CoverageRun[] = [
  {
    name: "unit-core",
    tests: coreUnit,
    env: noR2Env,
  },
  ...isolatedUnitRuns,
  ...inprocessRuns,
  {
    name: "upload-r2-enabled",
    tests: ["tests/backend/upload-r2-enabled.test.ts"],
    env: noR2Env,
  },
  {
    name: "upload-r2-disabled",
    tests: ["tests/backend/upload-r2-disabled.test.ts"],
    env: noR2Env,
  },
  {
    name: "upload-r2-null-client",
    tests: ["tests/backend/upload-r2-null-client.test.ts"],
    env: noR2Env,
  },
  {
    name: "r2-disabled",
    tests: ["tests/backend/unit/r2-config.test.ts"],
    env: noR2Env,
  },
  {
    name: "r2-valid-url",
    tests: ["tests/backend/unit/r2-config.test.ts"],
    env: {
      ...r2Base,
      R2_PUBLIC_URL: "https://pub-coverage.r2.dev",
    },
  },
  {
    name: "r2-invalid-url",
    tests: ["tests/backend/unit/r2-config.test.ts"],
    env: {
      ...r2Base,
      R2_PUBLIC_URL: "https://coverage-account.r2.cloudflarestorage.com",
    },
  },
  {
    name: "r2-no-public-url",
    tests: ["tests/backend/unit/r2-config.test.ts"],
    env: {
      ...r2Base,
      R2_PUBLIC_URL: "",
    },
  },
  {
    name: "jwt-missing",
    tests: ["tests/backend/unit/jwt-missing.test.ts"],
    env: {
      BACKEND_TEST_ALLOW_MISSING_JWT: "1",
      JWT_SECRET: "",
    },
  },
];

const outputs: string[] = [];
for (const run of runs) {
  console.log(`\n=== Coverage run: ${run.name} ===`);
  rmSync(liveLcov, { force: true });
  const result = Bun.spawnSync({
    // process.execPath avoids package-script PATH shadowing by a stale local Bun.
    // Every isolated run must use the exact runtime/instrumenter of this runner.
    cmd: [process.execPath, "test", ...run.tests, ...coverageFlags],
    cwd: root,
    env: { ...process.env, ...noR2Env, ...run.env },
    stdout: "inherit",
    stderr: "inherit",
  });
  if (result.exitCode !== 0) process.exit(result.exitCode);
  if (!existsSync(liveLcov)) {
    console.error(`LCOV tidak dihasilkan oleh run ${run.name}`);
    process.exit(1);
  }
  const output = resolve(runsDir, `${run.name}.info`);
  copyFileSync(liveLcov, output);
  outputs.push(output);
}

const validation = Bun.spawnSync({
  cmd: [process.execPath, "scripts/assert-backend-coverage.ts", ...outputs],
  cwd: root,
  stdout: "inherit",
  stderr: "inherit",
});
process.exit(validation.exitCode);
