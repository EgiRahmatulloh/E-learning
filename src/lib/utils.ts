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
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const sheetData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "" });
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

  const firstRow = rows[0];
  
  // Check if first row looks like a header
  const matchedIndices = new Map<T, number>();
  let matchCount = 0;

  const cleanFirstRow = firstRow.map(cell => cell.toLowerCase().replace(/[^a-z0-9]/g, ''));

  for (const item of mappingConfig) {
    const key = item.key;
    const aliases = item.aliases.map(a => a.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Find index in header
    const idx = cleanFirstRow.findIndex(cell => 
      aliases.some(alias => cell === alias)
    );
    
    if (idx !== -1) {
      matchedIndices.set(key, idx);
      matchCount++;
    }
  }

  // If we match at least 2 headers (or 1 if configuration only has 1 key), we assume it has a header row.
  const hasHeader = matchCount >= Math.min(2, mappingConfig.length);
  const startIdx = hasHeader ? 1 : 0;

  const results: Record<T, string>[] = [];

  for (let i = startIdx; i < rows.length; i++) {
    const cols = rows[i];
    // Skip empty rows
    if (!cols || cols.length === 0 || cols.every(c => !c.trim())) continue;

    const record = {} as Record<T, string>;
    for (const item of mappingConfig) {
      const key = item.key;
      let colIdx = item.defaultIndex;
      
      if (hasHeader) {
        const foundIdx = matchedIndices.get(key);
        if (foundIdx !== undefined) {
          colIdx = foundIdx;
        } else {
          colIdx = -1;
        }
      }

      record[key] = colIdx !== -1 && cols[colIdx] !== undefined ? cols[colIdx].trim() : "";
    }
    results.push(record);
  }

  return results;
}