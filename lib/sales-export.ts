import ExcelJS from "exceljs";

export type SaleRow = {
  created_at: string;
  product_name: string;
  quantity: number;
  unit_price: number | string;
};

const COP = '"$" #,##0';
/** Colombia no tiene horario de verano: UTC-5 todo el año. */
const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Fecha para Excel con la hora de Bogotá (Excel no guarda zona horaria). */
export function toBogotaExcelDate(iso: string): Date {
  return new Date(Date.parse(iso) - BOGOTA_OFFSET_MS);
}

/** Nombre del archivo: ventas-SLUG-AAAA-MM-DD.xlsx (fecha de Bogotá). */
export function salesFileName(slug: string, now = new Date()): string {
  const day = new Date(now.getTime() - BOGOTA_OFFSET_MS).toISOString().slice(0, 10);
  return `ventas-${slug}-${day}.xlsx`;
}

/**
 * Libro de Excel con las ventas: encabezados en español, moneda en pesos, filtro,
 * encabezado fijo y fila de totales (con fórmula y su valor ya calculado).
 */
export async function buildSalesWorkbook(rows: SaleRow[], storeName: string): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "MiTiendaW";
  wb.created = new Date();
  const ws = wb.addWorksheet("Ventas", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Fecha", key: "fecha", width: 18, style: { numFmt: "dd/mm/yyyy hh:mm" } },
    { header: "Producto", key: "producto", width: 36 },
    { header: "Cantidad", key: "cantidad", width: 11 },
    { header: "Precio unitario", key: "precio", width: 16, style: { numFmt: COP } },
    { header: "Total", key: "total", width: 16, style: { numFmt: COP } },
  ];
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1959D1" } };
  header.alignment = { vertical: "middle" };

  let units = 0;
  let money = 0;
  rows.forEach((r, i) => {
    const price = Number(r.unit_price);
    const total = r.quantity * price;
    units += r.quantity;
    money += total;
    const n = i + 2;
    ws.addRow({
      fecha: toBogotaExcelDate(r.created_at),
      producto: r.product_name,
      cantidad: r.quantity,
      precio: price,
      total: { formula: `C${n}*D${n}`, result: total },
    });
  });

  const last = rows.length + 1;
  if (rows.length > 0) ws.autoFilter = { from: "A1", to: `E${last}` };
  const totals = ws.addRow({
    fecha: null,
    producto: "Total",
    cantidad: rows.length ? { formula: `SUBTOTAL(9,C2:C${last})`, result: units } : 0,
    precio: null,
    total: rows.length ? { formula: `SUBTOTAL(9,E2:E${last})`, result: money } : 0,
  });
  totals.font = { bold: true };
  totals.getCell("total").numFmt = COP;
  totals.border = { top: { style: "thin" } };

  wb.title = `Ventas de ${storeName}`;
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}
