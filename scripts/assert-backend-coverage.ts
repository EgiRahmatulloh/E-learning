import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const serverRoot = resolve(root, "src/server");

// LCOV bisa berasal dari beberapa run terisolasi (lihat
// scripts/run-backend-coverage.ts): main suite + varian env (mis. R2 enabled).
// Modul env-at-import (config/r2.ts) dievaluasi sekali per proses dan import
// `?query` tidak tercatat coverage-nya oleh Bun, sehingga varian env
// dijalankan sebagai proses `bun test` terpisah yang masing-masing
// menghasilkan satu lcov.info. Validator menggabungkan semuanya dengan UNION
// (hits = max di semua run, fungsi = max). Tanpa argumen, memakai
// coverage/backend/lcov.info seperti sebelumnya.
const lcovPaths = (
  process.argv.length > 2 ? process.argv.slice(2) : ["coverage/backend/lcov.info"]
).map((p) => resolve(root, p));

const excluded = new Set([
  "src/server/db/index.ts",
  "src/server/db/schema.ts",
  "src/server/db/seed.ts",
  "src/server/models/index.ts",
]);

// Baris yang secara konstruksi tidak terjangkau dan dipertahankan sebagai
// defensive guard (bukan logic bisnis). Guard dipertahankan agar handler tetap
// aman bila dipanggil langsung, dan didokumentasikan di sini — bukan
// disembunyikan per-file. Entri hanya berlaku bila hits==0 di semua run
// (bila suatu hari kena, ia kembali menjadi denominator).
const unreachableLines: Record<string, number[]> = {
  // Signature multi-baris fungsi ini dilaporkan Bun sebagai lima DA tanpa
  // executable bytecode (baris 67-69,78,88); body/semua return tetap wajib kena.
  "src/server/config/r2.ts": [67, 68, 69, 78, 88],
  // Elysia memvalidasi body `t.Array` SEBELUM handler berjalan (422).
  "src/server/handlers/managers.ts": [245, 246],
  "src/server/handlers/tutors.ts": [374, 375],
  // getContentType: allowedExtensions == keys(MIME_BY_EXT) tepat sama, dan
  // ekstensi di luar daftar itu ditolak 400 sebelum mencapai sini — fallback
  // tidak pernah terpakai. Baris 71 dan 95 hanya komentar/pemisah di dalam
  // helper multi-baris yang Bun masukkan sebagai DA tanpa executable bytecode.
  // !file check: body `t.File()` Elysia menolak (422) berkas hilang/bukan-File
  // sebelum handler berjalan (diasertikan di upload-service.test.ts).
  // MIME multipart dinormalisasi Bun/Elysia berdasarkan nama berkas sebelum
  // handler dipanggil, sehingga MIME yang bertentangan tidak dapat mencapai
  // guard 176-177; ekstensi berbahaya tetap ditolak oleh guard sebelumnya.
  "src/server/services/upload.ts": [62, 71, 95, 135, 136, 176, 177],
};

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const expected = walk(serverRoot)
  .filter((path) => path.endsWith(".ts"))
  .map((path) => relative(root, path).replaceAll("\\", "/"))
  .filter((path) => !excluded.has(path))
  .sort();

for (const lcovPath of lcovPaths) {
  if (!existsSync(lcovPath)) {
    console.error(`Coverage LCOV tidak ditemukan: ${lcovPath}`);
    process.exit(1);
  }
}

interface CoverageRecord {
  lines: Map<number, number>;
  fnf: number;
  fnh: number;
}

const coverageRecords = new Map<string, CoverageRecord[]>();
const normalizedRoot = root.replaceAll("\\", "/");
for (const lcovPath of lcovPaths) {
  for (const block of readFileSync(lcovPath, "utf8").split("end_of_record")) {
    const raw = block.match(/^SF:(.+)$/m)?.[1];
    if (!raw) continue;

    let key = raw.split(/[?#]/)[0].replaceAll("\\", "/");
    if (key.toLowerCase().startsWith(`${normalizedRoot.toLowerCase()}/`)) {
      key = key.slice(normalizedRoot.length + 1);
    } else if (key.startsWith("./")) {
      key = key.slice(2);
    }
    if (!key.startsWith("src/server/")) continue;

    const lines = new Map<number, number>();
    for (const match of block.matchAll(/^DA:(\d+),(\d+)$/gm)) {
      const line = Number(match[1]);
      const hits = Number(match[2]);
      lines.set(line, Math.max(lines.get(line) ?? 0, hits));
    }
    const record: CoverageRecord = {
      lines,
      fnf: Number(block.match(/^FNF:(\d+)$/m)?.[1] ?? 0),
      fnh: Number(block.match(/^FNH:(\d+)$/m)?.[1] ?? 0),
    };
    const records = coverageRecords.get(key) ?? [];
    records.push(record);
    coverageRecords.set(key, records);
  }
}

interface CoverageGroup {
  lines: Map<number, number>;
  fnf: number;
  fnh: number;
  lineCount: number;
}

function compatibleGroups(file: string, sourceRecords: CoverageRecord[]): CoverageGroup[] {
  const knownUnreachable = new Set(unreachableLines[file] ?? []);
  const groups = new Map<string, CoverageRecord[]>();
  for (const record of sourceRecords) {
    const executable = new Set(
      [...record.lines.keys()].filter((line) => !knownUnreachable.has(line)),
    );
    // Focused success/failure runs can differ by a few callback-only DA entries.
    // Treat mappings as compatible only when at least 95% of their coordinates
    // agree. Import-only full-app mappings may look similar, so records with a
    // materially smaller function denominator cannot seed or enlarge a group.
    let groupKey: string | undefined;
    for (const [key, records] of groups) {
      const groupFnf = Math.max(...records.map((item) => item.fnf));
      const minFnf = Math.min(groupFnf, record.fnf);
      const maxFnf = Math.max(groupFnf, record.fnf);
      if (maxFnf > 0 && minFnf / maxFnf < 0.4) continue;
      const reference = new Set(
        records.flatMap((item) =>
          [...item.lines.keys()].filter((line) => !knownUnreachable.has(line)),
        ),
      );
      let shared = 0;
      for (const line of executable) if (reference.has(line)) shared++;
      const unionSize = new Set([...reference, ...executable]).size;
      if (unionSize === 0 || shared / unionSize >= 0.95) {
        groupKey = key;
        break;
      }
    }
    if (!groupKey) groupKey = String(groups.size);
    const records = groups.get(groupKey) ?? [];
    records.push(record);
    groups.set(groupKey, records);
  }

  return [...groups.values()].map((records) => {
    const lines = new Map<number, number>();
    for (const record of records) {
      for (const [line, hits] of record.lines) {
        lines.set(line, Math.max(lines.get(line) ?? 0, hits));
      }
    }
    const fnf = Math.max(...records.map((record) => record.fnf));
    const canonical = records.filter((record) => record.fnf === fnf);
    const canonicalLines = new Set(canonical.flatMap((record) => [...record.lines.keys()]));
    // Lower-FNF records may supply hits for canonical coordinates, but coordinates
    // only they emit are incomplete-instrumentation artifacts, not denominator.
    for (const line of [...lines.keys()]) {
      if (!canonicalLines.has(line)) lines.delete(line);
    }
    return {
      lines,
      fnf,
      fnh: Math.max(
        0,
        ...records.filter((record) => record.fnf === fnf).map((record) => record.fnh),
      ),
      lineCount: [...lines.keys()].filter((line) => !knownUnreachable.has(line)).length,
    };
  });
}

const failures: string[] = [];
for (const file of expected) {
  const sourceRecords = coverageRecords.get(file);
  if (!sourceRecords || sourceRecords.length === 0) {
    failures.push(`${file}: tidak ada di LCOV`);
    continue;
  }

  const groups = compatibleGroups(file, sourceRecords);
  const maxFnf = Math.max(...groups.map((group) => group.fnf));
  const fnCandidates = groups.filter((group) => group.fnf === maxFnf);
  const maxLines = Math.max(...fnCandidates.map((group) => group.lineCount));
  // Selection is hit-independent. If Bun emits tied authoritative groups,
  // every tie must pass so file/order cannot hide an uncovered mapping.
  const authoritative = fnCandidates.filter((group) => group.lineCount === maxLines);

  for (const group of authoritative) {
    const waived = (unreachableLines[file] ?? []).filter((line) => (group.lines.get(line) ?? 0) === 0);
    const waivedSet = new Set(waived);
    const effective = [...group.lines.keys()].filter((line) => !waivedSet.has(line));
    const lh = effective.filter((line) => (group.lines.get(line) ?? 0) > 0).length;
    if (lh !== effective.length || group.fnf !== group.fnh) {
      const suffix = waived.length > 0 ? ` (waived unreachable: ${waived.join(",")})` : "";
      failures.push(
        `${file}: lines ${lh}/${effective.length}, functions ${group.fnh}/${group.fnf}${suffix}`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(`Backend application coverage gate gagal (${lcovPaths.length} run digabung):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Backend application coverage 100%: ${expected.length} file (${lcovPaths.length} run digabung).`);
