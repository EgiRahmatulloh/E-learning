// Uji unit untuk src/lib/photos.ts — penyimpanan foto multi sebagai JSON array.
// Jalankan: bun run test:fe
import { describe, expect, test } from "bun:test";
import { parsePhotos, serializePhotos } from "../../src/lib/photos";

describe("parsePhotos", () => {
  test("mengembalikan [] untuk null/undefined/kosong", () => {
    expect(parsePhotos(null)).toEqual([]);
    expect(parsePhotos(undefined)).toEqual([]);
    expect(parsePhotos("")).toEqual([]);
    expect(parsePhotos("   ")).toEqual([]);
  });

  test("mem-parse JSON array dan membuang entri kosong/non-string", () => {
    expect(parsePhotos('["/a.png", "  ", "", "/b.png"]')).toEqual(["/a.png", "/b.png"]);
    // entri non-string (angka/null/objek) ikut dibuang
    expect(parsePhotos('[1, null, {}, "/ok.png"]')).toEqual(["/ok.png"]);
  });

  test("array kosong tetap kosong", () => {
    expect(parsePhotos("[]")).toEqual([]);
  });

  test("string URL tunggal (bukan JSON) dikembalikan apa adanya", () => {
    expect(parsePhotos("/api/files/foto.png")).toEqual(["/api/files/foto.png"]);
  });

  test("string JSON rusak dianggap URL tunggal, bukan error", () => {
    expect(parsePhotos('["tak-tutup')).toEqual(['["tak-tutup']);
  });

  test("JSON objek (bukan array) dianggap URL tunggal", () => {
    const obj = '{"kk":"/a.png"}';
    expect(parsePhotos(obj)).toEqual([obj]);
  });

  test("spasi di sekitar JSON tetap ter-parse", () => {
    expect(parsePhotos('  ["/a.png"]  ')).toEqual(["/a.png"]);
  });
});

describe("serializePhotos", () => {
  test("menyerialkan daftar menjadi JSON array", () => {
    expect(serializePhotos(["/a.png", "/b.png"])).toBe('["/a.png","/b.png"]');
  });

  test("membuang entri kosong dan non-string", () => {
    expect(serializePhotos(["/a.png", "  ", "" as string])).toBe('["/a.png"]');
    expect(serializePhotos([null as unknown as string, undefined as unknown as string])).toBe("[]");
  });

  test("null/undefined diperlakukan sebagai daftar kosong", () => {
    expect(serializePhotos(null as unknown as string[])).toBe("[]");
    expect(serializePhotos(undefined as unknown as string[])).toBe("[]");
  });

  test("round-trip: serialize lalu parse kembali identik", () => {
    const photos = ["/api/files/a.png", "/api/files/b.png"];
    expect(parsePhotos(serializePhotos(photos))).toEqual(photos);
  });
});
