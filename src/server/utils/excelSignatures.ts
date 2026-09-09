import ExcelJS from "exceljs";

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
          const base64Data = sigDataUrl.split(',')[1];
          const imageId = workbook.addImage({
            base64: base64Data,
            extension: 'png',
          });

          // Add image to cover the cell (with small padding)
          worksheet.addImage(imageId, {
            tl: { col: colIdx - 1 + 0.1, row: rowIdx - 1 + 0.1 } as any,
            br: { col: colIdx - 0.1, row: rowIdx - 0.1 } as any,
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
