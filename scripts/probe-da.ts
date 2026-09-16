import * as fs from "node:fs";
const cov = fs.readFileSync("coverage/backend/lcov.info", "utf8");
const target = process.argv[2] ?? "";
for (const b of cov.split("end_of_record")) {
  const m = b.match(/^SF:(.+)$/m);
  if (!m) continue;
  const sf = m[1].trim();
  if (target && !sf.replace(/\\/g, "/").endsWith(target)) continue;
  const da: Array<[number, number]> = [];
  for (const mm of b.matchAll(/^DA:(\d+),(\d+)/gm)) da.push([Number(mm[1]), Number(mm[2])]);
  da.sort((a, b) => a[0] - b[0]);
  console.log("SF=" + sf + " total=" + da.length + " nonzero=" + da.filter((d) => d[1] > 0).length);
  console.log(da.map((d) => `${d[0]}:${d[1]}`).join(" "));
}
