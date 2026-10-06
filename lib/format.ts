const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** $ 60.000 (el espacio de Intl se cambia por uno normal para que se lea igual en WhatsApp). */
export function formatCOP(value: number | string): string {
  return cop.format(Number(value)).replace(/ /g, " ");
}

/** Precio que paga el cliente: el de oferta si existe. */
export function effectivePrice(p: { price: number | string; sale_price: number | string | null }): number {
  return p.sale_price != null ? Number(p.sale_price) : Number(p.price);
}

/** Porcentaje de descuento redondeado (20 para 10.000 -> 8.000). */
export function discountPercent(price: number, salePrice: number | null): number | null {
  if (salePrice == null || price <= 0 || salePrice >= price) return null;
  return Math.round(((price - salePrice) / price) * 100);
}

/** Precio de oferta a partir de un porcentaje (1–95 %), redondeado a pesos. */
export function salePriceFromPercent(price: number, percent: number): number | null {
  if (!Number.isFinite(percent) || percent <= 0 || percent >= 100 || price <= 0) return null;
  const sale = Math.round(price * (1 - percent / 100));
  return sale < price ? sale : null;
}

const dayFmt = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });
/** "6 oct." para fechas YYYY-MM-DD (sin corrimiento de zona horaria). */
export function formatDay(isoDate: string): string {
  return dayFmt.format(new Date(`${isoDate}T00:00:00Z`));
}

const dateTimeFmt = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});
export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}
