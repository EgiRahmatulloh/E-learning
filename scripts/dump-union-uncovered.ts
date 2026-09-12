import { readFileSync } from "node:fs";

const separator = process.argv.indexOf("--");
const files = process.argv.slice(2, separator < 0 ? undefined : separator);
const targets = separator < 0 ? [] : process.argv.slice(separator + 1);
const hits = new Map<string, Map<number, number>>();

for (const file of files) {
  for (const block of readFileSync(file, "utf8").split("end_of_record")) {
    const raw = block.match(/^SF:(.+)$/m)?.[1];
    if (!raw) continue;
    const source = raw.split(/[?#]/)[0].replaceAll("\\", "/").replace(/^\.\//, "");
    if (targets.length > 0 && !targets.some((target) => source.endsWith(target))) continue;
    let lines = hits.get(source);
    if (!lines) hits.set(source, lines = new Map());
    for (const match of block.matchAll(/^DA:(\d+),(\d+)$/gm)) {
      const line = Number(match[1]);
      const count = Number(match[2]);
      lines.set(line, Math.max(lines.get(line) ?? 0, count));
    }
  }
}

for (const [source, lines] of [...hits].sort()) {
  const uncovered = [...lines].filter(([, count]) => count === 0).map(([line]) => line).sort((a, b) => a - b);
  console.log(`${source}: ${lines.size - uncovered.length}/${lines.size}`);
  console.log(uncovered.join(","));
}
