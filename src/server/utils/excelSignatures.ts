import ExcelJS from "exceljs";
import Jimp from "jimp";

async function makeWhiteTransparent(base64: string): Promise<string> {
  try {
    const buffer = Buffer.from(base64, 'base64');
    const image = await Jimp.read(buffer);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (_x, _y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];

      // If white or very close to white, make transparent
      if (red > 240 && green > 240 && blue > 240) {
        this.bitmap.data[idx + 3] = 0; // alpha to 0
      }
    });

    const processedBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
    return processedBuffer.toString('base64');
  } catch (error) {
    console.error("Failed to process image background", error);
    return base64; // Fallback to original
  }
}

export interface SignatureCellConfig {
  firstDataRow: number; // e.g., 18
  firstDateCol: number; // e.g., 4 (Column D for DAFTAR HADIR TUTOR, since NO=A(1), NAMA=B(2), MAPEL=C(3), d1=D(4))
  // The array of data objects, order matches rows in Excel
  rowData: {
    signatureData?: Record<string, string>;
    [key: string]: any;
  }[];
}

export async function injectSignaturesToExcel(
  templateBuffer: Buffer,
  config: SignatureCellConfig
): Promise<Buffer> {
  const { firstDataRow, firstDateCol, rowData } = config;
  
  if (!rowData || rowData.length === 0) return templateBuffer;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer as any);
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return templateBuffer;

  for (let i = 0; i < rowData.length; i++) {
    const rowIdx = firstDataRow + i;
    const rowSigData = rowData[i].signatureData;
    
    if (!rowSigData) continue;

    for (let day = 1; day <= 31; day++) {
      const colIdx = firstDateCol + day - 1;
      const sigDataUrl = rowSigData[`d${day}`];

      if (sigDataUrl && sigDataUrl.includes(",")) {
        try {
          let base64Data = sigDataUrl.split(',')[1];
          base64Data = await makeWhiteTransparent(base64Data);
          
          const imageId = workbook.addImage({
            base64: base64Data,
            extension: 'png',
          });

          // Add image to cover the cell explicitly with ext (width 31px, height 16px to fit 33px cell width)
          worksheet.addImage(imageId, {
            tl: { col: colIdx - 1 + 0.02, row: rowIdx - 1 + 0.1 } as any,
            ext: { width: 31, height: 16 } as any,
            editAs: 'oneCell'
          });

          const cell = worksheet.getCell(rowIdx, colIdx);
          cell.value = "";
        } catch (e) {
          console.error("Failed to inject signature at", rowIdx, colIdx, e);
        }
      }
    }
  }

  const outputBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(outputBuffer);
}
