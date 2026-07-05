// @ts-nocheck
import XlsxTemplate from "xlsx-template";
import path from "path";
import fs from "fs";
// @ts-ignore
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
  // Helper to convert column letters (A, B, ..., Z, AA, AB, ...) to Set entries
  function collectHeaderCols(refs: string[]): Set<string> {
    const cols = new Set<string>();
    for (const ref of refs) {
      const parts = ref.split(":");
      const startCol = parts[0].replace(/[0-9]+/g, "");
      const endCol = parts[1].replace(/[0-9]+/g, "");
      const startNum = colToNum(startCol);
      const endNum = colToNum(endCol);
      for (let n = startNum; n <= endNum; n++) {
        cols.add(numToCol(n));
      }
    }
    return cols;
  }
  function colToNum(col: string): number {
    let n = 0;
    for (let i = 0; i < col.length; i++) {
      n = n * 26 + (col.charCodeAt(i) - 64);
    }
    return n;
  }
  function numToCol(n: number): string {
    let col = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      col = String.fromCharCode(65 + rem) + col;
      n = Math.floor((n - 1) / 26);
    }
    return col;
  }
  const headerCols = collectHeaderCols(originalMergeRefs);

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
  template.archive.file(sheet.filename, etree.tostring(sheet.root, {}));
}

function colToIdx(col: string): number {
  let n = 0;
  for (let i = 0; i < col.length; i++) {
    n = n * 26 + (col.charCodeAt(i) - 64);
  }
  return n - 1; // 0-indexed
}

function idxToCol(n: number): string {
  let col = "";
  let temp = n + 1;
  while (temp > 0) {
    const rem = (temp - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    temp = Math.floor((temp - 1) / 26);
  }
  return col;
}

function shiftCellRef(ref: string, shift: number): string {
  const m = ref.match(/^([A-Z]+)([0-9]+)$/);
  if (!m) return ref;
  const col = m[1];
  const row = m[2];
  const colIdx = colToIdx(col);
  return idxToCol(colIdx + shift) + row;
}

function cloneElement(el: any): any {
  const clone = etree.Element(el.tag, el.attrib);
  clone.text = el.text;
  clone.tail = el.tail;
  for (const child of el.getchildren()) {
    clone.append(cloneElement(child));
  }
  return clone;
}

interface IndexMap {
  [key: number]: {
    nameIdx: number;
    nilaiIdx: number;
    predikatIdx: number;
  };
}

function duplicateColumnsInXml(xmlString: string, mapelCount: number, indexMap: IndexMap, templateMapelCount: number): string {
  const root = etree.XML(xmlString);
  const templateCols = 2 * templateMapelCount;
  const colShift = 2 * mapelCount - templateCols;

  // 1. Rebuild <cols> node
  const colsEl = root.find("cols");
  if (colsEl) {
    root.remove(colsEl);
  }
  const newColsEl = etree.Element("cols");
  newColsEl.append(etree.Element("col", { min: "1", max: "1", width: "4", customWidth: "1", style: "1" }));
  newColsEl.append(etree.Element("col", { min: "2", max: "2", width: "15.42", customWidth: "1", style: "5" }));
  newColsEl.append(etree.Element("col", { min: "3", max: "3", width: "14.71", customWidth: "1", style: "5" }));
  newColsEl.append(etree.Element("col", { min: "4", max: "4", width: "27.28", customWidth: "1", style: "1" }));
  newColsEl.append(etree.Element("col", { min: "5", max: "5", width: "10.42", customWidth: "1", style: "1" }));
  newColsEl.append(etree.Element("col", { min: "6", max: "6", width: "13.71", customWidth: "1", style: "1" }));

  let currentCol = 7;
  for (let m = 0; m < mapelCount; m++) {
    newColsEl.append(etree.Element("col", { min: String(currentCol), max: String(currentCol), width: "16.14", customWidth: "1", style: "6" }));
    currentCol++;
    newColsEl.append(etree.Element("col", { min: String(currentCol), max: String(currentCol), width: "13", customWidth: "1", style: "6" }));
    currentCol++;
  }

  newColsEl.append(etree.Element("col", { min: String(currentCol), max: String(currentCol), width: "12.71", customWidth: "1", style: "6" }));
  newColsEl.append(etree.Element("col", { min: String(currentCol + 1), max: "16384", width: "9.14", style: "1" }));

  const sheetDataEl = root.find("sheetData");
  const children = root.getchildren();
  
  // Rebuild children order to avoid buggy elementtree insert
  for (const child of children) {
    root.remove(child);
  }
  
  for (const tag of ["dimension", "sheetViews", "sheetFormatPr"]) {
    const el = children.find((c: any) => c.tag === tag);
    if (el) root.append(el);
  }
  
  root.append(newColsEl);

  const foundSheetData = children.find((c: any) => c.tag === "sheetData");
  if (foundSheetData) root.append(foundSheetData);

  for (const child of children) {
    if (!["dimension", "sheetViews", "sheetFormatPr", "cols", "sheetData"].includes(child.tag)) {
      root.append(child);
    }
  }

  // 2. Process cells inside <sheetData>
  if (sheetDataEl) {
    const rows = sheetDataEl.findall("row");
    for (const row of rows) {
      const rNum = parseInt(row.attrib.r, 10);
      const isTableRow = rNum === 17 || rNum === 18 || rNum === 19;
      
      const cells = row.findall("c");
      for (const cell of cells) {
        row.remove(cell);
      }

      const parsedCells = cells.map((cell: any) => {
        const ref = cell.attrib.r || "";
        const colLetter = ref.replace(/[0-9]+/g, "");
        const colIdx = colToIdx(colLetter);
        return { cell, colIdx, ref };
      });

      if (isTableRow) {
        parsedCells.filter((c: any) => c.colIdx <= 5).forEach((c: any) => row.append(c.cell));

        const templateG = parsedCells.find((c: any) => c.colIdx === 6);
        const templateH = parsedCells.find((c: any) => c.colIdx === 7);

        for (let m = 0; m < mapelCount; m++) {
          const colGIdx = 6 + 2 * m;
          const colHIdx = colGIdx + 1;
          const letterG = idxToCol(colGIdx);
          const letterH = idxToCol(colHIdx);

          if (templateG) {
            const newCell = cloneElement(templateG.cell);
            newCell.attrib.r = `${letterG}${rNum}`;
            const v = newCell.find("v");
            if (v && v.text) {
              const oldIdx = parseInt(v.text, 10);
              if (oldIdx === indexMap[0].nameIdx) {
                v.text = String(indexMap[m].nameIdx);
              } else if (oldIdx === indexMap[0].nilaiIdx) {
                v.text = String(indexMap[m].nilaiIdx);
              } else if (oldIdx === indexMap[0].predikatIdx) {
                v.text = String(indexMap[m].predikatIdx);
              }
            }
            row.append(newCell);
          }

          if (templateH) {
            const newCell = cloneElement(templateH.cell);
            newCell.attrib.r = `${letterH}${rNum}`;
            const v = newCell.find("v");
            if (v && v.text) {
              const oldIdx = parseInt(v.text, 10);
              if (oldIdx === indexMap[0].nameIdx) {
                v.text = String(indexMap[m].nameIdx);
              } else if (oldIdx === indexMap[0].nilaiIdx) {
                v.text = String(indexMap[m].nilaiIdx);
              } else if (oldIdx === indexMap[0].predikatIdx) {
                v.text = String(indexMap[m].predikatIdx);
              }
            }
            row.append(newCell);
          }
        }

        // Shift columns >= 6 + templateCols by colShift
        parsedCells.filter((c: any) => c.colIdx >= 6 + templateCols).forEach((c: any) => {
          const newRef = shiftCellRef(c.ref, colShift);
          c.cell.attrib.r = newRef;
          row.append(c.cell);
        });

      } else {
        parsedCells.sort((a: any, b: any) => a.colIdx - b.colIdx);
        parsedCells.forEach((c: any) => {
          let shiftAmt = 0;
          if (c.colIdx >= 3 && c.colIdx <= 6) {
            shiftAmt = Math.round(colShift / 2);
          } else if (c.colIdx >= 7) {
            shiftAmt = colShift;
          }

          if (shiftAmt !== 0) {
            const newRef = shiftCellRef(c.ref, shiftAmt);
            c.cell.attrib.r = newRef;
          }
          row.append(c.cell);
        });
      }
    }
  }

  // 3. Process <mergeCells>
  const mergeCellsEl = root.find("mergeCells");
  if (mergeCellsEl) {
    const currentChildren = mergeCellsEl.findall("mergeCell");
    for (const child of currentChildren) {
      mergeCellsEl.remove(child);
    }

    const newMerges: any[] = [];
    for (const child of currentChildren) {
      const ref = child.attrib.ref || "";
      const parts = ref.split(":");
      const startRef = parts[0];
      const endRef = parts[1];

      const startCol = startRef.replace(/[0-9]+/g, "");
      const endCol = endRef.replace(/[0-9]+/g, "");
      const startRow = startRef.replace(/[A-Z]+/g, "");
      const endRow = endRef.replace(/[A-Z]+/g, "");

      const startColIdx = colToIdx(startCol);
      const endColIdx = colToIdx(endCol);

      // Wide merges (like A1:J1 or A1:H1, span across the header)
      if (startCol === "A" && endColIdx >= 7) {
        const newEndCol = idxToCol(5 + 2 * mapelCount);
        const m = etree.Element("mergeCell", { ref: `A${startRow}:${newEndCol}${endRow}` });
        newMerges.push(m);
        continue;
      }

      if (startRef === "G17" && endRef === "H17") {
        for (let m = 0; m < mapelCount; m++) {
          const colGIdx = 6 + 2 * m;
          const colHIdx = colGIdx + 1;
          const mCell = etree.Element("mergeCell", { ref: `${idxToCol(colGIdx)}17:${idxToCol(colHIdx)}17` });
          newMerges.push(mCell);
        }
        continue;
      }

      if (startRef === "I17" && endRef === "J17") {
        continue;
      }

      if (startColIdx >= 6 + templateCols) {
        const newStartCol = idxToCol(startColIdx + colShift);
        const newEndCol = idxToCol(endColIdx + colShift);
        const mCell = etree.Element("mergeCell", { ref: `${newStartCol}${startRow}:${newEndCol}${endRow}` });
        newMerges.push(mCell);
      } else {
        newMerges.push(child);
      }
    }

    for (const m of newMerges) {
      mergeCellsEl.append(m);
    }
    mergeCellsEl.attrib.count = String(newMerges.length);
  }

  return etree.tostring(root).toString();
}

/**
 * Adjust drawing XML (e.g. xl/drawings/drawing1.xml) to shift anchors.
 */
function adjustDrawingXml(xmlString: string, colShift: number, templateMapelCount: number): string {
  if (colShift === 0) return xmlString;
  const root = etree.XML(xmlString);
  
  const startShiftColIdx = 6 + 2 * templateMapelCount; // 8 for templateMapelCount=1, 10 for templateMapelCount=2
  const tableEndColIdx = 5 + 2 * templateMapelCount;   // 7 for templateMapelCount=1, 9 for templateMapelCount=2

  function walk(el: any, parentTag: string = "") {
    const tag = el.tag || "";
    const cleanTag = tag.split("}").pop() || tag;
    
    if (cleanTag === "col") {
      const val = parseInt(el.text, 10);
      if (!isNaN(val)) {
        if (val >= startShiftColIdx) {
          el.text = String(val + colShift);
        } else if (parentTag === "to" && val === tableEndColIdx) {
          el.text = String(val + colShift);
        }
      }
    }
    
    for (const child of el.getchildren()) {
      walk(child, cleanTag);
    }
  }
  
  walk(root);
  return etree.tostring(root).toString();
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
  headerEndRow?: number,
  mapelCount?: number
): Buffer {
  const templateBuffer = loadTemplateBuffer(templateName);
  const template = new XlsxTemplate(templateBuffer);

  // If mapelCount is provided, modify shared strings and sheet XML to duplicate columns first
  if (mapelCount !== undefined && template.archive) {
    const sharedStrings: string[] = (template as any).sharedStrings;
    const lookup: any = (template as any).sharedStringsLookup;

    let mapel1Idx = -1;
    let mapel1NilaiIdx = -1;
    let mapel1PredikatIdx = -1;
    let templateMapelCount = 1;

    sharedStrings.forEach((str, idx) => {
      if (str === "${table:siswa.mapel1}") mapel1Idx = idx;
      else if (str === "${table:siswa.mapel1Nilai}") mapel1NilaiIdx = idx;
      else if (str === "${table:siswa.mapel1Predikat}") mapel1PredikatIdx = idx;
      else if (str.includes("siswa.mapel2")) templateMapelCount = 2;
    });

    const indexMap: IndexMap = {};
    indexMap[0] = { nameIdx: mapel1Idx, nilaiIdx: mapel1NilaiIdx, predikatIdx: mapel1PredikatIdx };

    for (let m = 1; m < mapelCount; m++) {
      const mapelName = `\${table:siswa.mapel${m + 1}}`;
      const mapelNilai = `\${table:siswa.mapel${m + 1}Nilai}`;
      const mapelPredikat = `\${table:siswa.mapel${m + 1}Predikat}`;

      sharedStrings.push(mapelName);
      const nameIdx = sharedStrings.length - 1;
      lookup[mapelName] = nameIdx;

      sharedStrings.push(mapelNilai);
      const nilaiIdx = sharedStrings.length - 1;
      lookup[mapelNilai] = nilaiIdx;

      sharedStrings.push(mapelPredikat);
      const predikatIdx = sharedStrings.length - 1;
      lookup[mapelPredikat] = predikatIdx;

      indexMap[m] = { nameIdx, nilaiIdx, predikatIdx };
    }

    const archive = (template as any).archive;
    if (archive) {
      const sheetEntry = archive.file("xl/worksheets/sheet1.xml");
      if (sheetEntry) {
        const modifiedSheetXml = duplicateColumnsInXml((sheetEntry as any).asText(), mapelCount, indexMap, templateMapelCount);
        archive.file("xl/worksheets/sheet1.xml", modifiedSheetXml);
      }

      const drawingEntry = archive.file("xl/drawings/drawing1.xml");
      if (drawingEntry) {
        const colShift = 2 * mapelCount - (2 * templateMapelCount);
        const modifiedDrawingXml = adjustDrawingXml((drawingEntry as any).asText(), colShift, templateMapelCount);
        archive.file("xl/drawings/drawing1.xml", modifiedDrawingXml);
      }
    }
  }

  // Snapshot original merge refs and header cells before substitution
  let originalMergeRefs: string[] = [];
  let originalHeaderCells: any[] = [];
  if (headerEndRow !== undefined) {
    const archive = (template as any).archive;
    if (archive) {
      const sheetEntry = archive.file("xl/worksheets/sheet1.xml");
      if (sheetEntry) {
        originalMergeRefs = parseMergeRefs((sheetEntry as any).asText());
      }
    }
    // Snapshot cells in the header end row (row 18) before they get overwritten
    try {
      const sheet = (template as any).loadSheet(1);
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

  if (headerEndRow !== undefined && originalMergeRefs.length > 0) {
    removeClonedMerges(template, originalMergeRefs, headerEndRow, originalHeaderCells);
  }

  const output = template.generate();
  return Buffer.from(output, "binary");
}

export function templateExists(templateName: string): boolean {
  return fs.existsSync(path.join(TEMPLATES_DIR, templateName));
}
