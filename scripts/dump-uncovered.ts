import * as fs from "node:fs";
const cov = fs.readFileSync("coverage/backend/lcov.info", "utf8");
const target = process.argv.slice(2);
const blocks = cov.split("end_of_record");
for (const b of blocks) {
  const m = b.match(/^SF:(.+)$/m);
  if (!m) continue;
  const sf = m[1].trim().replace(/\?.*$/, "");
  const norm = sf.replace(/\\/g, "/");
  if (target.length && !target.some((t) => norm.endsWith(t))) continue;
  const da: Record<number, number> = {};
  for (const mm of b.matchAll(/^DA:(\d+),(\d+)/gm)) da[Number(mm[1])] = Number(mm[2]);
  const keys = Object.keys(da).map(Number).sort((a, b) => a - b);
  const unc = keys.filter((k) => da[k] === 0);
  console.log("====", norm, "DA", keys.length, "unc", unc.length);
  console.log(JSON.stringify(unc));
}
