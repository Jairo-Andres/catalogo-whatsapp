import { describe, expect, it } from "vitest";
import { discountPercent, effectivePrice, formatCOP, salePriceFromPercent } from "@/lib/format";
import { isValidSlug, slugify } from "@/lib/slug";
import { buildOrderMessage, isValidWhatsapp, normalizeWhatsapp, whatsappLink } from "@/lib/whatsapp";

describe("formato y descuentos", () => {
  it("formatea pesos colombianos sin decimales", () => {
    expect(formatCOP(68000)).toBe("$ 68.000");
    expect(formatCOP("1234567")).toBe("$ 1.234.567");
  });

  it("calcula el porcentaje y el precio de oferta en ambos sentidos", () => {
    expect(discountPercent(10000, 8000)).toBe(20);
    expect(discountPercent(10000, null)).toBeNull();
    expect(discountPercent(10000, 10000)).toBeNull();
    expect(salePriceFromPercent(10000, 20)).toBe(8000);
    expect(salePriceFromPercent(9990, 33)).toBe(6693);
    expect(salePriceFromPercent(10000, 0)).toBeNull();
    expect(salePriceFromPercent(10000, 100)).toBeNull();
  });

  it("usa el precio de oferta si existe", () => {
    expect(effectivePrice({ price: "10000", sale_price: "8000" })).toBe(8000);
    expect(effectivePrice({ price: 10000, sale_price: null })).toBe(10000);
  });
});

describe("slugs", () => {
  it("genera slugs limpios desde el título", () => {
    expect(slugify("Dulces de Marta")).toBe("dulces-de-marta");
    expect(slugify("  Panadería Ñapa & Café!! ")).toBe("panaderia-napa-cafe");
    expect(slugify("x".repeat(60))).toHaveLength(40);
  });

  it("rechaza reservados, cortos y con formato inválido", () => {
    expect(isValidSlug("dulces-marta")).toBe(true);
    expect(isValidSlug("admin")).toBe(false);
    expect(isValidSlug("marca")).toBe(false);
    expect(isValidSlug("ab")).toBe(false);
    expect(isValidSlug("con--doble")).toBe(false);
    expect(isValidSlug("Mayus")).toBe(false);
  });
});

describe("WhatsApp", () => {
  it("normaliza celulares colombianos y valida longitud", () => {
    expect(normalizeWhatsapp("300 123 4567")).toBe("573001234567");
    expect(normalizeWhatsapp("+57 (300) 123-4567")).toBe("573001234567");
    expect(normalizeWhatsapp("+1 415 555 0100")).toBe("14155550100");
    expect(isValidWhatsapp("573001234567")).toBe(true);
    expect(isValidWhatsapp("12345")).toBe(false);
  });

  it("arma el mensaje con la plantilla del documento", () => {
    const msg = buildOrderMessage({
      storeName: "Dulces Marta",
      storeUrl: "https://ejemplo.test/dulces-marta",
      lines: [
        { name: "Torta de chocolate", quantity: 2, unitPrice: 30000 },
        { name: "Brownie", quantity: 1, unitPrice: 8000 },
      ],
      customerName: "Ana",
      delivery: "recoger",
      note: "Sin nueces",
    });
    expect(msg).toBe(
      [
        "Hola, quiero hacer un pedido en *Dulces Marta* 🛍️",
        "",
        "*Pedido:*",
        "• 2 x Torta de chocolate — $ 60.000",
        "• 1 x Brownie — $ 8.000",
        "",
        "*Total: $ 68.000*",
        "",
        "*Nombre:* Ana",
        "*Entrega:* Recoger en tienda",
        "*Nota:* Sin nueces",
        "",
        "Pedido desde https://ejemplo.test/dulces-marta",
      ].join("\n"),
    );
  });

  it("omite datos opcionales vacíos y limpia el formato de WhatsApp", () => {
    const msg = buildOrderMessage({
      storeName: "*Tienda*",
      storeUrl: "https://x.test/t",
      lines: [{ name: "_Pan_", quantity: 1, unitPrice: 1000 }],
      customerName: "  ",
    });
    expect(msg).not.toContain("Nombre");
    expect(msg).toContain("*Tienda*");
    expect(msg).toContain("• 1 x Pan — $ 1.000");
  });

  it("un carrito de 30 productos cabe en el enlace", () => {
    const lines = Array.from({ length: 30 }, (_, i) => ({
      name: `Producto de prueba con nombre largo número ${i + 1}`,
      quantity: 99,
      unitPrice: 1_250_000,
    }));
    const url = whatsappLink(
      "573001234567",
      buildOrderMessage({ storeName: "T".repeat(60), storeUrl: "https://x.test/t", lines, note: "n".repeat(300) }),
    );
    // Límite práctico de URL en navegadores y wa.me: ~8.000 caracteres.
    expect(url.length).toBeLessThan(8000);
    expect(decodeURIComponent(url.split("?text=")[1])).toContain("Producto de prueba con nombre largo número 30");
  });
});

import { productSchema, safeNext, storeSchema } from "@/lib/validators";

describe("validaciones del servidor", () => {
  it("normaliza el WhatsApp y rechaza slugs reservados", () => {
    const ok = storeSchema.safeParse({
      name: "Dulces",
      slug: "dulces",
      whatsapp: "300 123 4567",
      whatsapp_public_ok: "on",
    });
    expect(ok.success && ok.data.whatsapp).toBe("573001234567");
    const bad = storeSchema.safeParse({ name: "Dulces", slug: "admin", whatsapp: "123", whatsapp_public_ok: "on" });
    expect(bad.success).toBe(false);
  });

  it("producto: oferta menor que el precio y campos vacíos como null", () => {
    const ok = productSchema.safeParse({ name: "Torta", price: "10000", sale_price: "8000", stock: "" });
    expect(ok.success && ok.data).toMatchObject({ price: 10000, sale_price: 8000, stock: null, is_unique: false });
    expect(productSchema.safeParse({ name: "Torta", price: "10000", sale_price: "12000" }).success).toBe(false);
    expect(productSchema.safeParse({ name: "Torta", price: "10.5" }).success).toBe(false);
  });

  it("safeNext evita redirecciones a otros sitios", () => {
    expect(safeNext("/panel/productos")).toBe("/panel/productos");
    expect(safeNext("//evil.test")).toBe("/panel");
    expect(safeNext("https://evil.test")).toBe("/panel");
    expect(safeNext("/\\evil.test")).toBe("/panel");
  });
});
