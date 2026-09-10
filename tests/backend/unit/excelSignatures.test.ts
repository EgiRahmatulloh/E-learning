// Uji unit untuk injectSignaturesToExcel di src/server/utils/excelSignatures.ts —
// injeksi gambar tanda tangan ke sel tanggal laporan kehadiran xlsx.
// Memakai template asli format-upload-wb.xlsx sebagai workbook dasar.
// Gambar uji: PNG 1x1 (putih → ditransparankan jimp, ~200ms per gambar).
// Jalankan: bun run test:be:unit
import { describe, expect, test } from "bun:test";
import { unzipSync } from "fflate";
import * as XLSX from "xlsx";
import { injectSignaturesToExcel } from "../../../src/server/utils/excelSignatures";
import { fillTemplate } from "../../../src/server/utils/templateXlsx";

// PNG 1x1 putih — mewakili dataURL dari signature-pad client.
const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const sig = (n = 1) => `data:image/png;base64,${TINY_PNG}${"A".repeat(n)}`;

const base = () => fillTemplate("format-upload-wb.xlsx", {});
const config = (rowData: { signatureData?: Record<string, string> }[]) => ({
  firstDataRow: 19,
  firstDateCol: 4,
  rowData: rowData as { signatureData?: Record<string, string>; [k: string]: unknown }[],
});

describe("injectSignaturesToExcel", () => {
  test("rowData kosong → buffer dikembalikan identik (tanpa parse ulang)", () => {
    const b = base();
    return injectSignaturesToExcel(b, config([])).then((out) => {
      expect(Buffer.compare(b, out)).toBe(0);
    });
  });

  test("baris tanpa signatureData dilewati, hasil tetap workbook valid", async () => {
    const out = await injectSignaturesToExcel(base(), config([{ foo: 1 } as never]));
    expect(() => XLSX.read(out, { type: "buffer" })).not.toThrow();
  });

  test("signature d1 valid menanam gambar ke xl/media (tanpa melempar)", async () => {
    const out = await injectSignaturesToExcel(
      base(),
      config([{ signatureData: { d1: sig(), d2: "", d3: undefined as never } }]),
    );
    // Workbook selalu ditulis ulang oleh ExcelJS (lebih ringkas dari template
    // asli), jadi yang diasertikan keberadaan gambarnya, bukan ukuran buffer.
    const names = Object.keys(unzipSync(out)).filter((k) => k.startsWith("xl/media/"));
    expect(names.length).toBeGreaterThan(0);
    expect(() => XLSX.read(out, { type: "buffer" })).not.toThrow();
  });

  test("entri bukan-dataURL diabaikan: tanpa gambar, tanpa melempar", async () => {
    const out = await injectSignaturesToExcel(
      base(),
      config([{ signatureData: { d1: "bukan-data-url", d2: "" } }]),
    );
    const names = Object.keys(unzipSync(out)).filter((k) => k.startsWith("xl/media/"));
    expect(names).toEqual([]);
    expect(() => XLSX.read(out, { type: "buffer" })).not.toThrow();
  });

  test("beberapa baris + beberapa tanggal sekaligus", async () => {
    const out = await injectSignaturesToExcel(
      base(),
      config([
        { signatureData: { d1: sig(1), d31: sig(2) } },
        { signatureData: { d15: sig(3) } },
      ]),
    );
    expect(() => XLSX.read(out, { type: "buffer" })).not.toThrow();
  }, 30_000);
});
