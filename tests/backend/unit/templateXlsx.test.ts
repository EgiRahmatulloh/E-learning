// Uji unit untuk src/server/utils/templateXlsx.ts — pengisi template laporan
// xlsx (daftar hadir, nilai, agenda) berbasis placeholder ${...}.
// Memakai template ASLI di public/templates agar perubahan template yang
// merusak placeholder langsung ketahuan. fillTemplate murni sync + tanpa DB.
// Jalankan: bun run test:be:unit
import { describe, expect, test } from "bun:test";
import { unzipSync, strFromU8 } from "fflate";
import * as XLSX from "xlsx";
import { injectSignaturesToExcel } from "../../../src/server/utils/excelSignatures";
import { fillTemplate, templateExists } from "../../../src/server/utils/templateXlsx";

/** Seluruh teks sheet sebagai satu string untuk pencarian isi. */
function sheetText(buf: Buffer): string {
  const wb = XLSX.read(buf, { type: "buffer" });
  const parts: string[] = [];
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" });
    parts.push(JSON.stringify(rows));
  }
  return parts.join("\n");
}

function rawPart(buf: Buffer, name: string): string {
  const part = unzipSync(buf)[name];
  expect(part).toBeDefined();
  return strFromU8(part);
}

function refs(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<${tag}[^>]*ref="([^"]+)"`, "g"))].map((match) => match[1]);
}

const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const SIGNATURE = `data:image/png;base64,${TINY_PNG}`;

const TUTOR_ROW = {
  no: 1,
  namaTutor: "Budi Santoso",
  mapel: "MATEMATIKA",
  d1: "✓",
  d2: "",
  rekap: 1,
};

describe("templateExists", () => {
  test("template laporan asli ditemukan", () => {
    for (const name of [
      "DAFTAR HADIR TUTOR.xlsx",
      "DAFTAR HADIR WARGA BELAJAR PER MAPEL.xlsx",
      "DAFTAR HADIR WARGA BELAJAR REKAP.xlsx",
      "NILAI WARGA BELAJAR PER MAPEL.xlsx",
      "NILAI WARGA BELAJAR REKAP.xlsx",
      "DAFTAR AGENDA TUTOR.xlsx",
      "format-upload-wb.xlsx",
    ]) {
      expect(templateExists(name)).toBe(true);
    }
  });

  test("nama hilang, kosong, direktori, dan path tidak aman → false", () => {
    expect(templateExists("tidak-ada.xlsx")).toBe(false);
    expect(templateExists("")).toBe(false);
    expect(templateExists("../package.json")).toBe(false);
    expect(templateExists("..\\package.json")).toBe(false);
    expect(templateExists("D:\\package.json")).toBe(false);
    expect(templateExists("subdir/template.xlsx")).toBe(false);
    expect(templateExists("\0.xlsx")).toBe(false);
  });
});

describe("fillTemplate — keamanan path", () => {
  test("path traversal dan nama bukan berkas ditolak", () => {
    expect(() => fillTemplate("../package.json", {})).toThrow(/traversal/i);
    expect(() => fillTemplate("..\\..\\bun.lock", {})).toThrow(/traversal/i);
    expect(() => fillTemplate("", {})).toThrow(/traversal/i);
    expect(() => fillTemplate("D:\\package.json", {})).toThrow(/traversal/i);
  });

  test("template hilang melempar pesan yang jelas", () => {
    expect(() => fillTemplate("tidak-ada.xlsx", {})).toThrow(/tidak ditemukan/i);
  });
});

describe("fillTemplate — DAFTAR HADIR TUTOR", () => {
  const data = {
    program: "PAKET C",
    semester: "GANJIL",
    tahunAjaran: "2025/2026",
    kelas: "PAKET C 10 A",
    bulan: "SEPTEMBER",
    waliKelas: "BUDI",
    namaWaliKelas: "BUDI",
    tanggalCetak: "10 September 2025",
    tutors: [TUTOR_ROW],
  };

  test("placeholder scalar + tabel terisi", () => {
    const text = sheetText(fillTemplate("DAFTAR HADIR TUTOR.xlsx", data));
    expect(text).toContain("SEPTEMBER");
    expect(text).toContain("Budi Santoso");
    expect(text).toContain("MATEMATIKA");
  });

  test("headerEndRow kompatibel dan tidak mengubah OOXML template riil", () => {
    const withoutCompatibilityArg = fillTemplate("DAFTAR HADIR TUTOR.xlsx", data);
    const withCompatibilityArg = fillTemplate("DAFTAR HADIR TUTOR.xlsx", data, 17);
    expect(rawPart(withCompatibilityArg, "xl/worksheets/sheet1.xml"))
      .toBe(rawPart(withoutCompatibilityArg, "xl/worksheets/sheet1.xml"));
  });

  test("baris tabel kosong tetap menghasilkan file valid", () => {
    const out = fillTemplate("DAFTAR HADIR TUTOR.xlsx", { ...data, tutors: [] });
    expect(() => XLSX.read(out, { type: "buffer" })).not.toThrow();
  });
});

describe("fillTemplate — DAFTAR HADIR WARGA BELAJAR PER MAPEL", () => {
  const data = {
    program: "PAKET C",
    semester: "GANJIL",
    tahunAjaran: "2025/2026",
    mapel: "MATEMATIKA",
    kelas: "PAKET C 10 A",
    namaTutor: "BUDI",
    bulan: "SEPTEMBER 2025",
    tanggalCetak: "10 September 2025",
    siswa: [
      { no: 1, nisn: "123", namaSiswa: "Ani", rombel: "A", d1: "H", d2: "-", rekap: 1 },
    ],
  };

  test("nama siswa & mapel masuk ke sheet", () => {
    const text = sheetText(fillTemplate("DAFTAR HADIR WARGA BELAJAR PER MAPEL.xlsx", data));
    expect(text).toContain("Ani");
    expect(text).toContain("MATEMATIKA");
  });

  test("produksi: 2 baris lalu injeksi tanda tangan menjaga koordinat gambar", async () => {
    const siswa = [
      { no: 1, nis: "1", nisn: "123", namaSiswa: "Ani", jenisKelamin: "P", rombel: "A", d1: "H", rekap: 1, signatureData: { d1: SIGNATURE } },
      { no: 2, nis: "2", nisn: "456", namaSiswa: "Beni", jenisKelamin: "L", rombel: "A", d2: "H", rekap: 1, signatureData: { d2: SIGNATURE } },
    ];
    const templated = fillTemplate("DAFTAR HADIR WARGA BELAJAR PER MAPEL.xlsx", {
      ...data,
      siswa,
    }, 17);
    const out = await injectSignaturesToExcel(templated, {
      firstDataRow: 18,
      firstDateCol: 7,
      rowData: siswa,
    });
    const drawing = rawPart(out, "xl/drawings/drawing1.xml");
    const anchors = [...drawing.matchAll(/<xdr:from><xdr:col>(\d+)<\/xdr:col>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/g)]
      .map((match) => [Number(match[1]), Number(match[2])]);
    expect(anchors).toContainEqual([6, 17]);
    expect(anchors).toContainEqual([7, 18]);
    expect(sheetText(out)).toContain("Beni");
  }, 30_000);
});

describe("fillTemplate — NILAI WARGA BELAJAR PER MAPEL", () => {
  test("nilai + predikat terisi", () => {
    const text = sheetText(
      fillTemplate("NILAI WARGA BELAJAR PER MAPEL.xlsx", {
        program: "PAKET C",
        semester: "GANJIL",
        tahunAjaran: "2025/2026",
        mapel: "MATEMATIKA",
        kelas: "PAKET C 10 A",
        namaTutor: "BUDI",
        tanggalCetak: "10 September 2025",
        siswa: [
          {
            no: 1, nisn: "123", namaSiswa: "Ani", rombel: "A",
            nilaiTugas: 80, nilaiDiskusi: 70, nilaiKehadiran: 90,
            nilaiAkhir: 82, predikat: "B", jenisKelamin: "P", nis: "1",
          },
        ],
      }),
    );
    expect(text).toContain("Ani");
    expect(text).toContain("82");
  });
});

describe("fillTemplate — NILAI REKAP multi-mapel (mapelCount)", () => {
  const base = {
    program: "PAKET C",
    semester: "GANJIL",
    tahunAjaran: "2025/2026",
    kelas: "PAKET C 10 A",
    kelas2: "PAKET C 10 A",
    waliKelas: "BUDI",
    namaWaliKelas: "BUDI",
    tanggalCetak: "10 September 2025",
    kecamatan: "KEC",
    namaPkbm: "PKBM",
    namaPemilik: "P",
    namaKepalaPkbm: "K",
    nipPemilik: "-",
    nipKepalaPkbm: "-",
    nipWaliKelas: "-",
    siswa: [
      {
        no: 1, nis: "1", nisn: "2", namaSiswa: "Ani", jenisKelamin: "P", rombel: "A",
        mapel1: "MTK", mapel1Nilai: 80, mapel1Predikat: "B",
        mapel2: "IPA", mapel2Nilai: 90, mapel2Predikat: "A",
      },
    ],
  };

  test("2 mapel terduplikasi ke kolom dinamis", () => {
    const text = sheetText(fillTemplate("NILAI WARGA BELAJAR REKAP.xlsx", base, 18, 2));
    expect(text).toContain("MTK");
    expect(text).toContain("IPA");
    expect(text).toContain("Ani");
  });

  test("hasil tetap workbook valid yang bisa dibaca ulang", () => {
    const out = fillTemplate("NILAI WARGA BELAJAR REKAP.xlsx", base, 18, 2);
    expect(() => XLSX.read(out, { type: "buffer" })).not.toThrow();
  });
  test.each([1, 3])("%i mapel membentuk OOXML kolom, merge, dan drawing yang tepat", (mapelCount) => {
    const siswa = {
      ...base.siswa[0],
      mapel3: "IPS", mapel3Nilai: 75, mapel3Predikat: "B",
    };
    const out = fillTemplate(
      "NILAI WARGA BELAJAR REKAP.xlsx",
      { ...base, siswa: [siswa] },
      18,
      mapelCount,
    );
    const sheet = rawPart(out, "xl/worksheets/sheet1.xml");
    const drawing = rawPart(out, "xl/drawings/drawing1.xml");
    const mergeRefs = refs(sheet, "mergeCell");
    const expectedEnd = mapelCount === 1 ? "H" : "L";

    expect(sheet).toContain(`max="${6 + 2 * mapelCount}"`);
    expect(mergeRefs).toContain(`G17:H17`);
    expect(mergeRefs.includes("I17:J17")).toBe(mapelCount === 3);
    expect(mergeRefs.includes("K17:L17")).toBe(mapelCount === 3);
    expect(mergeRefs).toContain(`A1:${expectedEnd}1`);
    expect(mergeRefs.length).toBe(mapelCount === 1 ? 19 : 21);
    expect(drawing).toContain(`<xdr:to><xdr:col>${6 + 2 * mapelCount}</xdr:col>`);
    expect(sheetText(out)).toContain(mapelCount === 1 ? "MTK" : "IPS");
    expect(() => XLSX.read(out, { type: "buffer" })).not.toThrow();
  });

  test("mapelCount invalid dan template non-mapel ditolak jelas", () => {
    expect(() => fillTemplate("NILAI WARGA BELAJAR REKAP.xlsx", base, 18, 0)).toThrow(/positif/i);
    expect(() => fillTemplate("NILAI WARGA BELAJAR REKAP.xlsx", base, 18, 1.5)).toThrow(/positif/i);
    expect(() => fillTemplate("DAFTAR HADIR TUTOR.xlsx", {}, 17, 1)).toThrow(/tidak mendukung/i);
  });
});

describe("fillTemplate — DAFTAR AGENDA TUTOR", () => {
  test("agenda terisi ke tabel", () => {
    const text = sheetText(
      fillTemplate("DAFTAR AGENDA TUTOR.xlsx", {
        mapel: "MTK",
        program: "PAKET C",
        semester: "GANJIL",
        tahunAjaran: "2025/2026",
        kelas: "PAKET C 10 A",
        namaTutor: "BUDI",
        tanggalCetak: "10 September 2025",
        nipTutor: "-",
        agenda: [
          {
            no: 1, hariTanggal: "Senin, 1 Sep", sesi: "1",
            materi: "Aljabar", tujuan: "Memahami x", uraian: "Diskusi",
            hadir: 10, tidakHadir: 0, keterangan: "-",
          },
        ],
      }),
    );
    expect(text).toContain("Aljabar");
  });
});

describe("fillTemplate — format-upload (tanpa placeholder)", () => {
  test("template impor massal lolos fill tanpa perubahan isi", () => {
    const out = fillTemplate("format-upload-wb.xlsx", {});
    expect(Buffer.isBuffer(out)).toBe(true);
    expect(() => XLSX.read(out, { type: "buffer" })).not.toThrow();
  });
});
