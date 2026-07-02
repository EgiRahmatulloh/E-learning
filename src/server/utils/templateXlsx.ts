import XlsxTemplate from "xlsx-template";
import path from "path";
import fs from "fs";

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
 * Load an xlsx template, substitute placeholders with data, return buffer.
 */
export function fillTemplate(templateName: string, data: TemplateData): Buffer {
  const templateBuffer = loadTemplateBuffer(templateName);
  const template = new XlsxTemplate(templateBuffer);

  template.substitute(1, data);

  const output = template.generate();
  return Buffer.from(output, "binary");
}

export function templateExists(templateName: string): boolean {
  return fs.existsSync(path.join(TEMPLATES_DIR, templateName));
}
