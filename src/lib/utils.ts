import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from "xlsx"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function parseExcel(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // cellText+cellNF: minta xlsx menyiapkan teks terformat (.w) & format (.z) tiap sel.
        // Dipakai agar sel bertipe TANGGAL bisa dibaca sebagai teks yang benar
        // (mis. "05-02-2008") alih-alih serial number mentah ("39483").
        const workbook = XLSX.read(data, { type: "array", cellText: true, cellNF: true });
        // Pilih sheet pertama yang memiliki data (lewati sheet kosong di depan).
        let worksheet: XLSX.WorkSheet | undefined;
        for (const name of workbook.SheetNames) {
          const ws = workbook.Sheets[name];
          if (ws && ws["!ref"]) {
            worksheet = ws;
            break;
          }
        }
        if (!worksheet) {
          resolve([]);
          return;
        }
        // Ubah HANYA sel tanggal menjadi teks terformat. Sel angka biasa (mis. NIK 16
        // digit) sengaja TIDAK disentuh agar tidak berubah jadi notasi ilmiah.
        for (const addr of Object.keys(worksheet)) {
          if (addr[0] === "!") continue;
          const cell = worksheet[addr] as XLSX.CellObject;
          if (cell.t === "n" && isDateFormat(cell.z) && typeof cell.w === "string") {
            cell.v = cell.w;
            cell.t = "s";
            delete cell.z;
          }
        }
        const sheetData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
          header: 1,
          defval: "",
          blankrows: false,
        });
        const rows = sheetData.map(row =>
          Array.isArray(row) ? row.map(cell => String(cell ?? "")) : []
        );
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Deteksi apakah format sel (SSF) merupakan format tanggal/waktu — mis. "dd-mm-yyyy",
// "yyyy-mm-dd", "d/m/yy". Menghindari salah-deteksi format angka (yang memakai # atau 0).
// cell.z bisa berupa string format atau index numerik built-in; hanya string yang diperiksa.
function isDateFormat(z: string | number | undefined): boolean {
  if (typeof z !== "string") return false;
  const hasDateToken = /[ymd]/i.test(z);
  const hasSeparator = /[/.\- ]/.test(z);
  // Format angka murni (mis. "#,##0.00") tak boleh dianggap tanggal.
  const numericLeftover = z.replace(/[ymdhs]/gi, "");
  const looksNumeric = /[#0]/.test(numericLeftover);
  return hasDateToken && hasSeparator && !looksNumeric;
}

export function downloadExcel(
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows] as (string | number)[][]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, filename);
}

export function mapCsvRows<T extends string>(
  rows: string[][],
  mappingConfig: { key: T; aliases: string[]; defaultIndex: number }[]
): Record<T, string>[] {
  if (rows.length === 0) return [];

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const threshold = Math.min(2, mappingConfig.length);

  // Cari baris header di antara beberapa baris pertama. Ini menangani file yang
  // memiliki baris judul (mis. "DAFTAR WARGA BELAJAR ...") di atas tabel, sehingga
  // baris judul & header tidak ikut terimpor sebagai data.
  const scanLimit = Math.min(rows.length, 8);
  let headerRowIdx = -1;
  let matchedIndices = new Map<T, number>();
  let bestCount = 0;

  for (let r = 0; r < scanLimit; r++) {
    const cells = rows[r];
    if (!cells || cells.every(c => !c.trim())) continue;
    const cleaned = cells.map(clean);

    const matched = new Map<T, number>();
    for (const item of mappingConfig) {
      const aliases = item.aliases.map(clean);
      const idx = cleaned.findIndex(cell => cell !== "" && aliases.includes(cell));
      if (idx !== -1) matched.set(item.key, idx);
    }

    if (matched.size > bestCount) {
      bestCount = matched.size;
      matchedIndices = matched;
      headerRowIdx = r;
    }
  }

  const hasHeader = bestCount >= threshold;
  if (!hasHeader) matchedIndices = new Map<T, number>();

  // Kolom yang sudah diklaim header, agar fallback posisi tidak menyerobotnya.
  const usedIdx = new Set<number>(matchedIndices.values());

  // Tanpa header: mapping posisional mulai baris 0. Dengan header: mulai setelahnya.
  const startIdx = hasHeader ? headerRowIdx + 1 : 0;

  const results: Record<T, string>[] = [];

  for (let i = startIdx; i < rows.length; i++) {
    const cols = rows[i];
    // Skip empty rows
    if (!cols || cols.length === 0 || cols.every(c => !c.trim())) continue;

    const record = {} as Record<T, string>;
    for (const item of mappingConfig) {
      const key = item.key;
      let colIdx: number;

      if (hasHeader) {
        const foundIdx = matchedIndices.get(key);
        if (foundIdx !== undefined) {
          colIdx = foundIdx;
        } else if (!usedIdx.has(item.defaultIndex)) {
          // Header dikenali sebagian: untuk kolom yang headernya tak terdaftar,
          // jatuh kembali ke posisi default selama posisi itu belum dipakai.
          colIdx = item.defaultIndex;
        } else {
          colIdx = -1;
        }
      } else {
        colIdx = item.defaultIndex;
      }

      record[key] = colIdx !== -1 && cols[colIdx] !== undefined ? cols[colIdx].trim() : "";
    }
    results.push(record);
  }

  return results;
}