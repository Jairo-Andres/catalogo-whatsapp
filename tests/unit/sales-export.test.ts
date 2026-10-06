import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildSalesWorkbook, salesFileName, toBogotaExcelDate } from "@/lib/sales-export";
import { productSchema, storeSchema } from "@/lib/validators";
import { slugify } from "@/lib/slug";

describe("exportar ventas a Excel", () => {
  const rows = [
    { created_at: "2026-10-06T17:30:00Z", product_name: "Torta de chocolate 🎂", quantity: 2, unit_price: "24000" },
    { created_at: "2026-10-05T01:00:00Z", product_name: "Brownie", quantity: 1, unit_price: 8000 },
  ];

  it("arma la hoja con encabezados, filas, moneda, filtro y totales", async () => {
    const buffer = await buildSalesWorkbook(rows, "Dulces");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    const ws = wb.getWorksheet("Ventas")!;
    expect(ws.getRow(1).values).toEqual([undefined, "Fecha", "Producto", "Cantidad", "Precio unitario", "Total"]);
    expect(ws.getCell("B2").value).toBe("Torta de chocolate 🎂");
    expect(ws.getCell("C2").value).toBe(2);
    expect(ws.getCell("D2").value).toBe(24000);
    expect(ws.getCell("D2").numFmt).toBe('"$" #,##0');
    expect(ws.getCell("E2").value).toMatchObject({ formula: "C2*D2", result: 48000 });
    expect(ws.getCell("B4").value).toBe("Total");
    expect(ws.getCell("C4").value).toMatchObject({ formula: "SUBTOTAL(9,C2:C3)", result: 3 });
    expect(ws.getCell("E4").value).toMatchObject({ formula: "SUBTOTAL(9,E2:E3)", result: 56000 });
    expect(ws.autoFilter).toBe("A1:E3");
  });

  it("guarda la fecha con la hora de Bogotá y nombra el archivo con el slug y el día", () => {
    expect(toBogotaExcelDate("2026-10-06T17:30:00Z").toISOString()).toBe("2026-10-06T12:30:00.000Z");
    // 03:00 UTC del 7 es todavía el 6 en Bogotá.
    expect(salesFileName("dulces", new Date("2026-10-07T03:00:00Z"))).toBe("ventas-dulces-2026-10-06.xlsx");
  });

  it("sin ventas, el archivo se crea con encabezados y totales en 0", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await buildSalesWorkbook([], "Dulces"));
    expect(wb.getWorksheet("Ventas")!.getCell("B2").value).toBe("Total");
  });
});

describe("emojis en textos", () => {
  const base = { slug: "dulces", whatsapp: "3001234567", whatsapp_public_ok: "on" };

  it("la tienda acepta emojis y cuenta caracteres como Postgres (no unidades UTF-16)", () => {
    // 60 emojis = 60 caracteres para Postgres (120 unidades UTF-16): debe pasar.
    expect(storeSchema.safeParse({ ...base, name: "🍰".repeat(60) }).success).toBe(true);
    expect(storeSchema.safeParse({ ...base, name: "🍰".repeat(61) }).success).toBe(false);
    const ok = storeSchema.safeParse({ ...base, name: "Dulces 🍫", description: "Hecho en casa ❤️✨" });
    expect(ok.success && ok.data.name).toBe("Dulces 🍫");
  });

  it("los productos aceptan emojis en nombre y descripción", () => {
    const r = productSchema.safeParse({ name: "Torta 🎂", description: "Con fresas 🍓", price: "30000" });
    expect(r.success).toBe(true);
  });

  it("el slug quita los emojis", () => {
    expect(slugify("Dulces 🍫 de Marta ❤️")).toBe("dulces-de-marta");
  });

  it("tipo de letra: solo los de la lista; si no viene, la de la marca", () => {
    expect(storeSchema.safeParse({ ...base, name: "Dulces", font: "manuscrita" }).success).toBe(true);
    expect(storeSchema.safeParse({ ...base, name: "Dulces", font: "comic" }).success).toBe(false);
    const r = storeSchema.safeParse({ ...base, name: "Dulces" });
    expect(r.success && r.data.font).toBe("atkinson");
  });
});
