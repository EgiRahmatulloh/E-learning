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
        const workbook = XLSX.read(data, { type: "array" });
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

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') continue;
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.length > 0 && currentRow.some(f => f !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.length > 0 && currentRow.some(f => f !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  currentRow.push(currentField.trim());
  if (currentRow.length > 0 && currentRow.some(f => f !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

export function downloadCSV(headers: string[], rows: string[][], filename: string) {
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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