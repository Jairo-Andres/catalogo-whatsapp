import { formatCOP } from "./format";

/**
 * Normaliza un número a solo dígitos con indicativo. Si escriben 10 dígitos que
 * empiezan por 3 (celular colombiano), se antepone 57.
 */
export function normalizeWhatsapp(input: string, defaultCountry = "57"): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) return defaultCountry + digits;
  return digits;
}

export function isValidWhatsapp(digits: string): boolean {
  return /^[0-9]{10,15}$/.test(digits);
}

export type OrderLine = { name: string; quantity: number; unitPrice: number };
export type OrderInfo = {
  storeName: string;
  storeUrl: string;
  lines: OrderLine[];
  customerName?: string;
  delivery?: "domicilio" | "recoger" | null;
  note?: string;
};

/** Quita asteriscos/guiones bajos/virgulillas para que no rompan el formato de WhatsApp. */
function clean(text: string): string {
  return text
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Mensaje del pedido según la plantilla de la sección 7 del documento. */
export function buildOrderMessage(order: OrderInfo): string {
  const total = order.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const lines = order.lines.map((l) => `• ${l.quantity} x ${clean(l.name)} — ${formatCOP(l.quantity * l.unitPrice)}`);
  const out = [
    `Hola, quiero hacer un pedido en *${clean(order.storeName)}* 🛍️`,
    "",
    "*Pedido:*",
    ...lines,
    "",
    `*Total: ${formatCOP(total)}*`,
  ];
  const extra: string[] = [];
  if (order.customerName?.trim()) extra.push(`*Nombre:* ${clean(order.customerName).slice(0, 60)}`);
  if (order.delivery) extra.push(`*Entrega:* ${order.delivery === "domicilio" ? "Domicilio" : "Recoger en tienda"}`);
  if (order.note?.trim()) extra.push(`*Nota:* ${clean(order.note).slice(0, 300)}`);
  if (extra.length) out.push("", ...extra);
  out.push("", `Pedido desde ${order.storeUrl}`);
  return out.join("\n");
}

export function whatsappLink(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
