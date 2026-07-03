import XlsxTemplate from "xlsx-template";
import path from "path";
import fs from "fs";
import etree from "elementtree";

interface TemplateData {
  [key: string]: any;
}

const TEMPLATES_DIR = path.join(process.cwd(), "public", "templates");

// Cache template buffers with mtime for invalidation
const templateCache = new Map<string, { buffer: Buffer; mtimeMs: number }>();

function loadTemplateBuffer(templateName: string): Buffer {
  const templatePath = path.resolve(path.join(TEMPLATES_DIR, templateName));
  if (!templatePath.startsWith(path.resolve(TEMPLATES_DIR))) {
    throw new Error(`Path traversal terdeteksi pada template "${templateName}"`);
  }
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template "${templateName}" tidak ditemukan`);
  }

  const stat = fs.statSync(templatePath);
  const cached = templateCache.get(templateName);
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return cached.buffer;
  }

  const buf = fs.readFileSync(templatePath);
  templateCache.set(templateName, { buffer: buf, mtimeMs: stat.mtimeMs });
  return buf;
}

/**
 * Parse mergeCell refs from sheet XML.
 */
function parseMergeRefs(xml: string): string[] {
  const mergeMatch = xml.match(/<mergeCells[^>]*>([\s\S]*?)<\/mergeCells>/);
  if (!mergeMatch) return [];
  const cellRegex = /<mergeCell[^>]*ref="([^"]+)"[^>]*\/>/g;
  const refs: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = cellRegex.exec(mergeMatch[1])) !== null) {
    refs.push(m[1]);
  }
  return refs;
}

/**
 * Remove cloned merge definitions and restore original header cells
 * that were overwritten by xlsx-template's pushDown.
 */
function removeClonedMerges(template: any, originalMergeRefs: string[], headerEndRow: number, originalHeaderCells: any[]): void {
  const sheet = template.sheet;
  if (!sheet || !sheet.root) return;

  const mergeCellsEl = sheet.root.find("mergeCells");
  if (!mergeCellsEl) return;

  const currentChildren = mergeCellsEl.findall("mergeCell");
  if (currentChildren.length === 0) return;

  // Build lookup: colRange → { startRow, endRow } from originals
  const originalByColRange = new Map<string, { startRow: number; endRow: number }[]>();
  for (const ref of originalMergeRefs) {
    const parts = ref.split(":");
    const startRow = parseInt(parts[0].replace(/[A-Z]+/g, ""), 10);
    const endRow = parseInt(parts[1].replace(/[A-Z]+/g, ""), 10);
    const startCol = parts[0].replace(/[0-9]+/g, "");
    const endCol = parts[1].replace(/[0-9]+/g, "");
    const key = startCol + ":" + endCol;
    if (!originalByColRange.has(key)) originalByColRange.set(key, []);
    originalByColRange.get(key)!.push({ startRow, endRow });
  }

  const originalRefSet = new Set(originalMergeRefs);

  // Remove clones
  const toRemove: any[] = [];
  for (const el of currentChildren) {
    const ref = el.attrib.ref;
    if (!ref) continue;

    // Exact match → original unchanged, keep
    if (originalRefSet.has(ref)) continue;

    const parts = ref.split(":");
    const startRow = parseInt(parts[0].replace(/[A-Z]+/g, ""), 10);
    const endRow = parseInt(parts[1].replace(/[A-Z]+/g, ""), 10);
    const startCol = parts[0].replace(/[0-9]+/g, "");
    const endCol = parts[1].replace(/[0-9]+/g, "");
    const key = startCol + ":" + endCol;

    const originals = originalByColRange.get(key);
    if (!originals) continue; // unrelated col range, keep

    // Check if this is a modified original (start row matches an original)
    const isModifiedOriginal = originals.some(o => o.startRow === startRow);
    if (isModifiedOriginal) continue; // modified original, keep

    // Otherwise it's a clone (start row is beyond original range)
    toRemove.push(el);
  }

  if (toRemove.length === 0) return;

  for (const el of toRemove) {
    mergeCellsEl.remove(el);
  }
  mergeCellsEl.attrib.count = (currentChildren.length - toRemove.length).toString();

  // Collect columns that are part of header merges
  const headerCols = new Set<string>();
  for (const ref of originalMergeRefs) {
    const parts = ref.split(":");
    const startCol = parts[0].replace(/[0-9]+/g, "");
    const endCol = parts[1].replace(/[0-9]+/g, "");
    for (let c = startCol.charCodeAt(0); c <= endCol.charCodeAt(0); c++) {
      headerCols.add(String.fromCharCode(c));
    }
  }

  // Find the row numbers where clones were removed, but only rows
  // BEYOND the original header area (rows > headerEndRow).
  const clonedRows = new Set<number>();
  for (const el of toRemove) {
    const ref = el.attrib.ref;
    if (!ref) continue;
    const parts = ref.split(":");
    const startRow = parseInt(parts[0].replace(/[A-Z]+/g, ""), 10);
    const endRow = parseInt(parts[1].replace(/[A-Z]+/g, ""), 10);
    for (let r = Math.max(startRow, headerEndRow + 1); r <= endRow; r++) {
      clonedRows.add(r);
    }
  }

  const sheetData = sheet.root.find("sheetData");
  if (sheetData && clonedRows.size > 0) {
    const rowsToRemove: any[] = [];
    for (const row of sheetData.findall("row")) {
      const rowNum = parseInt(row.attrib.r, 10);
      if (!clonedRows.has(rowNum)) continue;

      const cellsToRemove: any[] = [];
      for (const cell of row.findall("c")) {
        const cellRef = cell.attrib.r;
        if (!cellRef) continue;
        const col = cellRef.replace(/[0-9]+/g, "");
        if (headerCols.has(col)) {
          cellsToRemove.push(cell);
        }
      }
      for (const cell of cellsToRemove) {
        row.remove(cell);
      }
      if (row.findall("c").length === 0) {
        rowsToRemove.push(row);
      }
    }
    for (const row of rowsToRemove) {
      sheetData.remove(row);
    }
  }

  // Restore original cells in the header area (row 18) that were
  // overwritten by xlsx-template's table expansion.
  // The sub-header row (row 18) had cells like "Nilai Akhir", "Predikat"
  // that got replaced with cloned mapel names.
  if (originalHeaderCells.length > 0 && sheetData) {
    for (const row of sheetData.findall("row")) {
      const rowNum = parseInt(row.attrib.r, 10);
      if (rowNum !== headerEndRow) continue;

      // Remove any cells in header-merge columns that were overwritten
      const toRemoveFromRow: any[] = [];
      for (const cell of row.findall("c")) {
        const cellRef = cell.attrib.r;
        if (!cellRef) continue;
        const col = cellRef.replace(/[0-9]+/g, "");
        if (headerCols.has(col)) {
          toRemoveFromRow.push(cell);
        }
      }
      for (const cell of toRemoveFromRow) {
        row.remove(cell);
      }

      // Restore original cells
      for (const cell of originalHeaderCells) {
        row.append(cell);
      }
      break;
    }
  }

  // Shift data rows up to fill the gap left by removed empty rows.
  // Template has data starting at row (headerEndRow + 1), but xlsx-template
  // pushed them down. Find the first data row and shift everything up.
  if (sheetData && clonedRows.size > 0) {
    const targetFirstDataRow = headerEndRow + 1; // e.g., 19
    const allRows = sheetData.findall("row").sort(
      (a: any, b: any) => parseInt(a.attrib.r, 10) - parseInt(b.attrib.r, 10)
    );

    // Find the first row after header that has actual data (cell with value)
    let firstActualDataRowNum = 0;
    for (const row of allRows) {
      const rowNum = parseInt(row.attrib.r, 10);
      if (rowNum <= headerEndRow) continue;
      const hasValue = row.findall("c").some((cell: any) => cell.find("v") !== null);
      if (hasValue) {
        firstActualDataRowNum = rowNum;
        break;
      }
    }

    if (firstActualDataRowNum > targetFirstDataRow) {
      const offset = firstActualDataRowNum - targetFirstDataRow;
      // Shift all data rows up by offset
      for (const row of allRows) {
        const rowNum = parseInt(row.attrib.r, 10);
        if (rowNum < firstActualDataRowNum) continue;

        const newRowNum = rowNum - offset;
        row.attrib.r = newRowNum.toString();

        for (const cell of row.findall("c")) {
          const cellRef = cell.attrib.r;
          if (!cellRef) continue;
          const col = cellRef.replace(/[0-9]+/g, "");
          cell.attrib.r = col + newRowNum;
        }
      }
    }
  }

  // Write the modified etree back to the archive
  template.archive.file(sheet.filename, etree.tostring(sheet.root));
}

/**
 * Load an xlsx template, substitute placeholders with data, return buffer.
 *
 * @param headerEndRow  If set, cloned merge definitions from table
 *                      expansion are removed after substitution.
 */
export function fillTemplate(
  templateName: string,
  data: TemplateData,
  headerEndRow?: number
): Buffer {
  const templateBuffer = loadTemplateBuffer(templateName);
  const template = new XlsxTemplate(templateBuffer);

  // Snapshot original merge refs and header cells before substitution
  let originalMergeRefs: string[] = [];
  let originalHeaderCells: any[] = [];
  if (headerEndRow) {
    const sheetEntry = template.archive.file("xl/worksheets/sheet1.xml");
    if (sheetEntry) {
      originalMergeRefs = parseMergeRefs(sheetEntry.asText());
    }
    // Snapshot cells in the header end row (row 18) before they get overwritten
    try {
      const sheet = template.loadSheet(1);
      if (sheet && sheet.root) {
        const sheetData = sheet.root.find("sheetData");
        if (sheetData) {
          for (const row of sheetData.findall("row")) {
            if (parseInt(row.attrib.r, 10) === headerEndRow) {
              originalHeaderCells = row.findall("c").map((cell: any) => {
                // Deep clone the cell element
                const clone = etree.Element(cell.tag, cell.attrib);
                clone.text = cell.text;
                clone.tail = cell.tail;
                for (const child of cell.getchildren()) {
                  clone.append(child);
                }
                return clone;
              });
              break;
            }
          }
        }
      }
    } catch (_) { /* ignore */ }
  }

  template.substitute(1, data);

  if (headerEndRow && originalMergeRefs.length > 0) {
    removeClonedMerges(template, originalMergeRefs, headerEndRow, originalHeaderCells);
  }

  const output = template.generate();
  return Buffer.from(output, "binary");
}

export function templateExists(templateName: string): boolean {
  return fs.existsSync(path.join(TEMPLATES_DIR, templateName));
}
