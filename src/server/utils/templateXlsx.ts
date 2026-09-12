// @ts-nocheck
import XlsxTemplate from "xlsx-template";
import path from "node:path";
import fs from "node:fs";
// @ts-ignore
import etree from "elementtree";

interface TemplateData {
  [key: string]: any;
}

interface MapelIndexes {
  nameIdx: number;
  nilaiIdx: number;
  predikatIdx: number;
}

const TEMPLATES_DIR = path.resolve(import.meta.dir, "../../../public/templates");
const templateCache = new Map<string, { buffer: Buffer; mtimeMs: number }>();

function resolveTemplatePath(templateName: string): string {
  if (
    typeof templateName !== "string" ||
    templateName.length === 0 ||
    templateName.includes("\0") ||
    templateName.includes("/") ||
    templateName.includes("\\") ||
    path.isAbsolute(templateName)
  ) {
    throw new Error(`Path traversal terdeteksi pada template "${templateName}"`);
  }

  const templatePath = path.resolve(TEMPLATES_DIR, templateName);
  return templatePath;
}

function loadTemplateBuffer(templateName: string): Buffer {
  const templatePath = resolveTemplatePath(templateName);
  if (!fs.existsSync(templatePath) || !fs.statSync(templatePath).isFile()) {
    throw new Error(`Template "${templateName}" tidak ditemukan`);
  }

  const mtimeMs = fs.statSync(templatePath).mtimeMs;
  const cached = templateCache.get(templatePath);
  if (cached?.mtimeMs === mtimeMs) return cached.buffer;

  const buffer = fs.readFileSync(templatePath);
  templateCache.set(templatePath, { buffer, mtimeMs });
  return buffer;
}

function colToIdx(col: string): number {
  let result = 0;
  for (const character of col) result = result * 26 + character.charCodeAt(0) - 64;
  return result - 1;
}

function idxToCol(index: number): string {
  let result = "";
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    result = String.fromCharCode(65 + ((value - 1) % 26)) + result;
  }
  return result;
}

function shiftCellRef(ref: string, shift: number): string {
  return ref.replace(/^([A-Z]+)(\d+)$/, (_, col, row) => `${idxToCol(colToIdx(col) + shift)}${row}`);
}

function cloneElement(element: any): any {
  const clone = etree.Element(element.tag, element.attrib);
  clone.text = element.text;
  clone.tail = element.tail;
  for (const child of element.getchildren()) clone.append(cloneElement(child));
  return clone;
}

function remapSharedString(cell: any, source: MapelIndexes, target: MapelIndexes): void {
  const value = cell.find("v");
  const index = Number(value?.text);
  const slot = (["nameIdx", "nilaiIdx", "predikatIdx"] as const).find(
    (key) => index === source[key],
  );
  if (slot) value.text = String(target[slot]);
}

function duplicateMapelColumns(
  xmlString: string,
  mapelCount: number,
  indexes: MapelIndexes[],
  templateMapelCount: number,
): string {
  const root = etree.XML(xmlString);
  const templateCols = 2 * templateMapelCount;
  const colShift = 2 * mapelCount - templateCols;

  const oldCols = root.find("cols");
  if (oldCols) root.remove(oldCols);
  const newCols = etree.Element("cols");
  const widths = ["4", "15.42", "14.71", "27.28", "10.42", "13.71"];
  widths.forEach((width, index) => newCols.append(etree.Element("col", {
    min: String(index + 1), max: String(index + 1), width, customWidth: "1", style: "1",
  })));
  let currentCol = 7;
  for (let mapel = 0; mapel < mapelCount; mapel++) {
    for (const width of ["16.14", "13"]) {
      newCols.append(etree.Element("col", {
        min: String(currentCol), max: String(currentCol), width, customWidth: "1", style: "6",
      }));
      currentCol++;
    }
  }
  newCols.append(etree.Element("col", {
    min: String(currentCol), max: String(currentCol), width: "12.71", customWidth: "1", style: "6",
  }));
  newCols.append(etree.Element("col", {
    min: String(currentCol + 1), max: "16384", width: "9.14", style: "1",
  }));

  const children = root.getchildren();
  for (const child of children) root.remove(child);
  for (const tag of ["dimension", "sheetViews", "sheetFormatPr"]) {
    const child = children.find((candidate: any) => candidate.tag === tag);
    if (child) root.append(child);
  }
  root.append(newCols);
  const sheetData = children.find((candidate: any) => candidate.tag === "sheetData");
  if (sheetData) root.append(sheetData);
  for (const child of children) {
    if (!["dimension", "sheetViews", "sheetFormatPr", "cols", "sheetData"].includes(child.tag)) {
      root.append(child);
    }
  }

  for (const row of sheetData.findall("row")) {
    const rowNumber = Number(row.attrib.r);
    const isTableRow = [17, 18, 19].includes(rowNumber);
    const cells = row.findall("c");
    for (const cell of cells) row.remove(cell);
    const parsed = cells.map((cell: any) => ({
      cell,
      ref: cell.attrib.r,
      colIdx: colToIdx(cell.attrib.r.replace(/\d+/g, "")),
    }));

    if (isTableRow) {
      parsed.filter(({ colIdx }: any) => colIdx <= 5).forEach(({ cell }: any) => row.append(cell));
      const templates = [
        parsed.find(({ colIdx }: any) => colIdx === 6),
        parsed.find(({ colIdx }: any) => colIdx === 7),
      ];
      for (let mapel = 0; mapel < mapelCount; mapel++) {
        templates.forEach((templateCell, offset) => {
          if (!templateCell) return;
          const cell = cloneElement(templateCell.cell);
          cell.attrib.r = `${idxToCol(6 + 2 * mapel + offset)}${rowNumber}`;
          remapSharedString(cell, indexes[0], indexes[mapel]);
          row.append(cell);
        });
      }
    } else {
      parsed.sort((left: any, right: any) => left.colIdx - right.colIdx);
      for (const { cell, ref, colIdx } of parsed) {
        const shift = colIdx >= 7 ? colShift : colIdx >= 3 ? Math.round(colShift / 2) : 0;
        if (shift) cell.attrib.r = shiftCellRef(ref, shift);
        row.append(cell);
      }
    }
  }

  const mergeCells = root.find("mergeCells");
  const originalMerges = mergeCells.findall("mergeCell");
  for (const merge of originalMerges) mergeCells.remove(merge);
  const newMerges: any[] = [];
  for (const merge of originalMerges) {
    const [startRef, endRef] = merge.attrib.ref.split(":");
    const startCol = startRef.replace(/\d+/g, "");
    const endCol = endRef.replace(/\d+/g, "");
    const startRow = startRef.replace(/[A-Z]+/g, "");
    const endRow = endRef.replace(/[A-Z]+/g, "");
    const endColIdx = colToIdx(endCol);

    if (startCol === "A" && endColIdx >= 7) {
      newMerges.push(etree.Element("mergeCell", {
        ref: `A${startRow}:${idxToCol(5 + 2 * mapelCount)}${endRow}`,
      }));
    } else if (startRef === "G17" && endRef === "H17") {
      for (let mapel = 0; mapel < mapelCount; mapel++) {
        newMerges.push(etree.Element("mergeCell", {
          ref: `${idxToCol(6 + 2 * mapel)}17:${idxToCol(7 + 2 * mapel)}17`,
        }));
      }
    } else if (startRef !== "I17" || endRef !== "J17") {
      newMerges.push(merge);
    }
  }
  for (const merge of newMerges) mergeCells.append(merge);
  mergeCells.attrib.count = String(newMerges.length);
  return etree.tostring(root).toString();
}

function localName(tag: string): string {
  return tag.slice(Math.max(tag.lastIndexOf("}"), tag.lastIndexOf(":")) + 1);
}

function adjustDrawingXml(xmlString: string, colShift: number, templateMapelCount: number): string {
  if (colShift === 0) return xmlString;
  const root = etree.XML(xmlString);
  const startShiftColIdx = 6 + 2 * templateMapelCount;
  const tableEndColIdx = 5 + 2 * templateMapelCount;

  function walk(element: any, parentName = ""): void {
    const name = localName(element.tag ?? "");
    if (name === "col") {
      const column = Number(element.text);
      if (column >= startShiftColIdx || (parentName === "to" && column === tableEndColIdx)) {
        element.text = String(column + colShift);
      }
    }
    for (const child of element.getchildren()) walk(child, name);
  }

  walk(root);
  return etree.tostring(root).toString();
}

function addSharedString(template: any, value: string): number {
  const existing = template.sharedStringsLookup[value];
  if (existing !== undefined) return existing;
  const index = template.sharedStrings.push(value) - 1;
  template.sharedStringsLookup[value] = index;
  return index;
}

/**
 * Load an xlsx template, substitute placeholders, and return a new workbook.
 *
 * `headerEndRow` remains accepted for caller compatibility. Current shipped
 * templates do not need post-substitution merge cleanup; xlsx-template already
 * moves footer merges, and dynamic mapel merges are rebuilt before substitution.
 */
export function fillTemplate(
  templateName: string,
  data: TemplateData,
  _headerEndRow?: number,
  mapelCount?: number,
): Buffer {
  const template = new XlsxTemplate(loadTemplateBuffer(templateName));

  if (mapelCount !== undefined) {
    if (!Number.isInteger(mapelCount) || mapelCount < 1) {
      throw new Error("mapelCount harus berupa bilangan bulat positif");
    }
    const mapel1Name = template.sharedStringsLookup["${table:siswa.mapel1}"];
    const mapel1Nilai = template.sharedStringsLookup["${table:siswa.mapel1Nilai}"];
    const mapel1Predikat = template.sharedStringsLookup["${table:siswa.mapel1Predikat}"];
    if ([mapel1Name, mapel1Nilai, mapel1Predikat].some((index) => index === undefined)) {
      throw new Error(`Template "${templateName}" tidak mendukung kolom mapel dinamis`);
    }

    const templateMapelCount = template.sharedStringsLookup["${table:siswa.mapel2}"] === undefined ? 1 : 2;
    const indexes: MapelIndexes[] = [];
    for (let mapel = 1; mapel <= mapelCount; mapel++) {
      indexes.push({
        nameIdx: addSharedString(template, `\${table:siswa.mapel${mapel}}`),
        nilaiIdx: addSharedString(template, `\${table:siswa.mapel${mapel}Nilai}`),
        predikatIdx: addSharedString(template, `\${table:siswa.mapel${mapel}Predikat}`),
      });
    }

    const sheetEntry = template.archive.file("xl/worksheets/sheet1.xml");
    template.archive.file(
      "xl/worksheets/sheet1.xml",
      duplicateMapelColumns(sheetEntry.asText(), mapelCount, indexes, templateMapelCount),
    );

    const drawingEntry = template.archive.file("xl/drawings/drawing1.xml");
    if (drawingEntry) {
      template.archive.file(
        "xl/drawings/drawing1.xml",
        adjustDrawingXml(
          drawingEntry.asText(),
          2 * (mapelCount - templateMapelCount),
          templateMapelCount,
        ),
      );
    }
  }

  template.substitute(1, data);
  return Buffer.from(template.generate(), "binary");
}

export function templateExists(templateName: string): boolean {
  try {
    return fs.statSync(resolveTemplatePath(templateName)).isFile();
  } catch {
    return false;
  }
}
