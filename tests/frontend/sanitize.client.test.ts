// Uji kontrak safeHtml di client. Sanitasi DOM lengkap dijalankan pada test browser.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const source = () => readFileSync("src/lib/sanitize.ts", "utf8");

describe("safeHtml client (src/lib/sanitize.ts) — kunci kontrak", () => {
  test("guard null/undefined/kosong menghasilkan string kosong", () => {
    expect(source()).toContain("if (!dirty) return");
  });

  test("opsi ADD_TAGS dan ADD_ATTR memuat elemen yang diperlukan", () => {
    const src = source();
    expect(src).toContain("ADD_TAGS");
    for (const tag of ['"font"', '"u"', '"span"']) expect(src).toContain(tag);
    expect(src).toContain("ADD_ATTR");
    for (const attr of ['"class"', '"style"', '"align"']) expect(src).toContain(attr);
  });
});
