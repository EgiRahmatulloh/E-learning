// Uji unit sanitasi HTML server yang dipakai handler course.ts saat menyimpan deskripsi.
import { describe, expect, test } from "bun:test";
import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["font", "u", "span"]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "*": ["class", "style", "align"],
    font: ["color", "size", "face"],
  },
};

describe("sanitize-html server", () => {
  test("menghapus script beserta isinya", () => {
    const out = sanitizeHtml('<p>ok</p><script>alert("xss")</script>', SANITIZE_OPTIONS);
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("alert");
    expect(out).toContain("ok");
  });

  test("menghapus event handler inline", () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)">', SANITIZE_OPTIONS);
    expect(out).not.toContain("onerror");
  });

  test("menghapus javascript URL", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">klik</a>', SANITIZE_OPTIONS);
    expect(out).not.toContain("javascript:");
    expect(out).toContain("klik");
  });

  test("mempertahankan tag tambahan yang diizinkan", () => {
    expect(sanitizeHtml("<u>garis</u>", SANITIZE_OPTIONS)).toContain("<u>");
    expect(sanitizeHtml("<span>teks</span>", SANITIZE_OPTIONS)).toContain("<span>");
    expect(sanitizeHtml('<font color="red">x</font>', SANITIZE_OPTIONS)).toContain("<font");
  });

  test("menghapus atribut event yang berbahaya", () => {
    const out = sanitizeHtml('<p style="color:red" onclick="evil()">x</p>', SANITIZE_OPTIONS);
    expect(out).not.toContain("onclick");
  });

  test("menerima input kosong", () => {
    expect(sanitizeHtml("", SANITIZE_OPTIONS)).toBe("");
  });
});
