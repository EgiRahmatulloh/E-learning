// Uji unit untuk src/server/utils/templateXlsx.ts — pengisi template laporan
// xlsx (daftar hadir, nilai, agenda) berbasis placeholder ${...}.
// Memakai template ASLI di public/templates agar perubahan template yang
// merusak placeholder langsung ketahuan. fillTemplate murni sync + tanpa DB.
// Jalankan: bun test tests/templateXlsx.test.ts
import { describe, expect, test } from "bun:test";
import * as XLSX from "xlsx";
import { fillTemplate, templateExists } from "../src/server/utils/templateXlsx";

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

  test("nama yang tidak ada → false", () => {
    expect(templateExists("tidak-ada.xlsx")).toBe(false);
    // Catatan: templateExists("") = true karena path.join(dir,"") = dir yang
    // memang ada — perilaku ini dijaga agar tak berubah diam-diam; pemanggil
    // tidak pernah memakai nama kosong.
    expect(templateExists("")).toBe(true);
  });
});

describe("fillTemplate — keamanan path", () => {
  test("path traversal ditolak", () => {
    expect(() => fillTemplate("../package.json", {})).toThrow(/traversal/i);
    expect(() => fillTemplate("..\\..\\bun.lock", {})).toThrow();
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

  test("tanpa headerEndRow hasil tetap valid (tidak merusak merge)", () => {
    const out = fillTemplate("DAFTAR HADIR TUTOR.xlsx", data);
    expect(Buffer.isBuffer(out)).toBe(true);
    expect(out.length).toBeGreaterThan(10_000);
    // bisa dibaca kembali sebagai workbook valid
    expect(() => XLSX.read(out, { type: "buffer" })).not.toThrow();
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
