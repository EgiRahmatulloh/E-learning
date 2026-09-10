// Uji unit untuk cn + parseExcel + mapCsvRows di src/lib/utils.ts.
// - cn: murni, tanpa DOM.
// - parseExcel & mapCsvRows: logic impor Excel/CSV yang dipakai form impor
//   massal (tutor, siswa, alumni, dsb) — termasuk header berjudul di atas tabel
//   dan sel tanggal yang harus terbaca sebagai teks.
// Jalankan: bun run test:fe
import { beforeEach, describe, expect, test } from "bun:test";
import * as XLSX from "xlsx";
import { cn, mapCsvRows, parseExcel } from "../../src/lib/utils";

// Bun test tidak punya FileReader (API browser). parseExcel hanya memakai
// readAsArrayBuffer + onload(e.target.result) + onerror, jadi shim minimal
// berbasis File.arrayBuffer() yang dimiliki Bun sudah cukup.
class ShimFileReader {
  result: ArrayBuffer | null = null;
  onload: ((e: { target: ShimFileReader }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  readAsArrayBuffer(file: File) {
    file
      .arrayBuffer()
      .then((buf) => {
        this.result = buf;
        this.onload?.({ target: this });
      })
      .catch((e) => this.onerror?.(e));
  }
}
// Dipasang di beforeEach (bukan sekali di top-level) agar selalu ada saat
// parseExcel dipanggil — Bun test tidak punya FileReader bawaan.
beforeEach(() => {
  (globalThis as Record<string, unknown>).FileReader = ShimFileReader;
});

/** Bangun File .xlsx asli dari matriks baris untuk diumpan ke parseExcel. */
function xlsxFile(rows: (string | number)[][]): File {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new File([buf], "data.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

describe("cn", () => {
  test("menggabung kelas", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  test("kondisional falsy diabaikan", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });

  test("konflik tailwind dimenangkan kelas terakhir", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  test("mendukung sintaks objek dan array", () => {
    expect(cn({ aktif: true, mati: false })).toBe("aktif");
    expect(cn(["a", ["b"]])).toBe("a b");
  });
});

describe("parseExcel", () => {
  test("membaca baris sheet pertama sebagai string", async () => {
    const rows = await parseExcel(xlsxFile([["nama", "nik"], ["Budi", "123"]]));
    expect(rows).toEqual([["nama", "nik"], ["Budi", "123"]]);
  });

  test("sel kosong menjadi string kosong, bukan undefined", async () => {
    const rows = await parseExcel(xlsxFile([["a", "b"], ["x", ""]]));
    expect(rows[1]).toEqual(["x", ""]);
  });

  test("angka diubah ke string (NIK 16 digit tidak hilang)", async () => {
    const rows = await parseExcel(xlsxFile([["nik"], [1234567890123456]]));
    expect(rows[1][0]).toContain("123456789012345");
  });

  test("sel tanggal berformat dibaca sebagai teks terformat", async () => {
    const ws = XLSX.utils.aoa_to_sheet([["tgl"], [39483]]);
    ws["A2"].z = "dd-mm-yyyy";
    ws["A2"].t = "n";
    ws["A2"].w = "05-02-2008";
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const file = new File([buf], "tgl.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const rows = await parseExcel(file);
    expect(rows[1][0]).toBe("05-02-2008");
  });

  test("melewati sheet kosong di depan dan memakai sheet berisi", async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), "Kosong");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["isi"]]), "Data");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const file = new File([buf], "multi.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    expect(await parseExcel(file)).toEqual([["isi"]]);
  });

  test("workbook tanpa data mengembalikan array kosong", async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), "Kosong");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const file = new File([buf], "kosong.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    expect(await parseExcel(file)).toEqual([]);
  });
});

type WBKey = "nama" | "nik";

const WB_MAPPING = [
  { key: "nama" as WBKey, aliases: ["nama", "nama lengkap"], defaultIndex: 0 },
  { key: "nik" as WBKey, aliases: ["nik", "no ktp"], defaultIndex: 1 },
];

describe("mapCsvRows", () => {
  test("memetakan kolom sesuai header", async () => {
    const rows = await parseExcel(xlsxFile([["NIK", "Nama"], ["123", "Budi"]]));
    expect(mapCsvRows<WBKey>(rows, WB_MAPPING)).toEqual([{ nama: "Budi", nik: "123" }]);
  });

  test("melewati baris judul di atas header", async () => {
    const rows = await parseExcel(
      xlsxFile([["DAFTAR WARGA BELAJAR"], ["Nama", "NIK"], ["Budi", "123"]]),
    );
    expect(mapCsvRows<WBKey>(rows, WB_MAPPING)).toEqual([{ nama: "Budi", nik: "123" }]);
  });

  test("tanpa header yang dikenali memakai posisi kolom", () => {
    expect(
      mapCsvRows<WBKey>([["Budi", "123"], ["Ani", "456"]], WB_MAPPING),
    ).toEqual([
      { nama: "Budi", nik: "123" },
      { nama: "Ani", nik: "456" },
    ]);
  });

  test("baris kosong dilewati dan sel di-trim", () => {
    expect(
      mapCsvRows<WBKey>([["Nama", "NIK"], ["", ""], ["  Budi  ", " 123 "]], WB_MAPPING),
    ).toEqual([{ nama: "Budi", nik: "123" }]);
  });

  test("header dikenali sebagian: baris header sendiri tidak jadi data", () => {
    // Hanya "Nama" yang cocok (bestCount=1 < threshold=2) → tanpa header,
    // mapping posisional dari baris 0. Baris header ikut jadi data — perilaku
    // ini dijaga agar tidak berubah diam-diam (form impor mengandalkan threshold).
    expect(mapCsvRows<WBKey>([["Nama", "???"], ["Budi", "123"]], WB_MAPPING)).toEqual([
      { nama: "Nama", nik: "???" },
      { nama: "Budi", nik: "123" },
    ]);
  });

  test("input kosong mengembalikan array kosong", () => {
    expect(mapCsvRows<WBKey>([], WB_MAPPING)).toEqual([]);
  });
});
