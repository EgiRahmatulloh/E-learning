// Uji unit untuk sanitasi HTML.
// - sanitize-html (server, dipakai handler course.ts saat simpan deskripsi) —
//   berjalan penuh di Bun, jadi perilaku XSS-nya diasertikan langsung.
// - safeHtml client (src/lib/sanitize.ts, DOMPurify): DOMPurify butuh DOM
//   browser penuh dan tidak berjalan benar di Bun (happy-dom/linkedom hanya
//   lolos teks polos — <script> tidak dibuang). Karena itu untuk client hanya
//   dikunci KONTRAKNYA: opsi ADD_TAGS/ADD_ATTR + guard null/undefined, dan
//   perilaku penuh didelegasikan ke test browser. Komentar ini menjelaskan
//   kenapa tidak ada asersi XSS langsung untuk safeHtml di sini.
// Jalankan: bun test tests/sanitize.test.ts
import { describe, expect, test } from "bun:test";
import sanitizeHtml from "sanitize-html";

// Opsi yang sama dipakai handler course.ts dan src/lib/sanitize.ts.
const SANITIZE_OPTIONS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["font", "u", "span"]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "*": ["class", "style", "align"],
    font: ["color", "size", "face"],
  },
};

describe("sanitize-html server (kontrak dipakai course.ts & safeHtml)", () => {
  test("menghapus <script> beserta isinya", () => {
    const out = sanitizeHtml('<p>ok</p><script>alert("xss")</script>', SANITIZE_OPTIONS);
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("alert");
    expect(out).toContain("ok");
  });

  test("menghapus event handler inline", () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)">', SANITIZE_OPTIONS);
    expect(out).not.toContain("onerror");
  });

  test("menghapus javascript: URL", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">klik</a>', SANITIZE_OPTIONS);
    expect(out).not.toContain("javascript:");
    expect(out).toContain("klik");
  });

  test("tag tambahan font/u/span dipertahankan", () => {
    expect(sanitizeHtml("<u>garis</u>", SANITIZE_OPTIONS)).toContain("<u>");
    expect(sanitizeHtml("<span>teks</span>", SANITIZE_OPTIONS)).toContain("<span>");
    expect(sanitizeHtml('<font color="red">x</font>', SANITIZE_OPTIONS)).toContain("<font");
  });

  test("atribut berbahaya (style expression) dibuang", () => {
    const out = sanitizeHtml('<p style="color:red" onclick="evil()">x</p>', SANITIZE_OPTIONS);
    expect(out).not.toContain("onclick");
  });

  test("input kosong aman", () => {
    expect(sanitizeHtml("", SANITIZE_OPTIONS)).toBe("");
  });
});

describe("safeHtml client (src/lib/sanitize.ts) — kunci kontrak", () => {
  test("guard null/undefined/kosong → string kosong", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("src/lib/sanitize.ts", "utf8");
    expect(src).toContain("if (!dirty) return");
  });

  test("opsi ADD_TAGS memuat font/u/span, ADD_ATTR memuat class/style/align", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("src/lib/sanitize.ts", "utf8");
    expect(src).toContain("ADD_TAGS");
    for (const tag of ['"font"', '"u"', '"span"']) expect(src).toContain(tag);
    expect(src).toContain("ADD_ATTR");
    for (const attr of ['"class"', '"style"', '"align"']) expect(src).toContain(attr);
  });
});
