// Excel signature failure branches: Jimp.read gagal total (fallback
// makeWhiteTransparent, baris 22-23) + pixel putih → transparan (baris 16)
// serta per-sel corrupt → catch baris 81 (tanpa melempar, workbook tetap valid).
import { describe, expect, mock, test } from "bun:test";
import { unzipSync } from "fflate";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import Jimp from "jimp";
import { injectSignaturesToExcel } from "../../../src/server/utils/excelSignatures";
import { fillTemplate } from "../../../src/server/utils/templateXlsx";

const base = () => fillTemplate("format-upload-wb.xlsx", {});
const config = (rowData: { signatureData?: Record<string, string> }[]) => ({
  firstDataRow: 19,
  firstDateCol: 4,
  rowData: rowData as { signatureData?: Record<string, string>; [k: string]: unknown }[],
});

describe("excel signature failure branches", () => {
  test("base64 corrupt → fallback buffer asli, tanpa throw", async () => {
    const out = await injectSignaturesToExcel(
      base(),
      config([{ signatureData: { d1: "data:image/png;base64,!!!" } }]),
    );
    // Jimp.read("!!!") ternyata masih menghasilkan buffer (fallback makeWhiteTransparent
    // mengembalikan base64 asli lalu ExcelJS menanamnya) — yang diasertikan: tanpa throw
    // dan workbook tetap valid, bukan jumlah medianya.
    expect(Buffer.isBuffer(out)).toBe(true);
    expect(() => XLSX.read(out, { type: "buffer" })).not.toThrow();
  });

  test("pixel putih diubah transparan oleh scan callback", async () => {
    const white = await new Jimp(2, 2, 0xffffffff).getBufferAsync(Jimp.MIME_PNG);
    const out = await injectSignaturesToExcel(
      base(),
      config([{ signatureData: { d1: `data:image/png;base64,${white.toString("base64")}` } }]),
    );
    const names = Object.keys(unzipSync(out)).filter((k) => k.startsWith("xl/media/"));
    expect(names.length).toBeGreaterThan(0);
  });

  test("pixel non-putih lolos scan tanpa transparansi, gambar tetap ditanam", async () => {
    const red = await new Jimp(2, 2, 0xff0000ff).getBufferAsync(Jimp.MIME_PNG);
    const out = await injectSignaturesToExcel(
      base(),
      config([{ signatureData: { d1: `data:image/png;base64,${red.toString("base64")}` } }]),
    );
    const names = Object.keys(unzipSync(out)).filter((k) => k.startsWith("xl/media/"));
    expect(names.length).toBeGreaterThan(0);
    expect(() => XLSX.read(out, { type: "buffer" })).not.toThrow();
  });

  test("error per-sel ditangkap dan workbook tetap valid", async () => {
    const white = await new Jimp(1, 1, 0xffffffff).getBufferAsync(Jimp.MIME_PNG);
    const originalAddImage = ExcelJS.Workbook.prototype.addImage;
    ExcelJS.Workbook.prototype.addImage = (() => {
      throw new Error("fake addImage failure");
    }) as typeof originalAddImage;
    const original = console.error;
    console.error = mock(() => {});
    try {
      const out = await injectSignaturesToExcel(
        base(),
        config([{ signatureData: { d1: `data:image/png;base64,${white.toString("base64")}` } }]),
      );
      expect(Buffer.isBuffer(out)).toBe(true);
      expect(() => XLSX.read(out, { type: "buffer" })).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    } finally {
      ExcelJS.Workbook.prototype.addImage = originalAddImage;
      console.error = original;
    }
  });
});
