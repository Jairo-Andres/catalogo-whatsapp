import { z } from "zod";
import { isValidSlug } from "./slug";
import { isValidWhatsapp, normalizeWhatsapp } from "./whatsapp";

const trimmed = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : null));

export const signUpSchema = z.object({
  full_name: trimmed(80).min(2, "Escribe tu nombre"),
  email: z.string().trim().toLowerCase().email("Correo no válido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72, "Máximo 72 caracteres"),
  habeas_data: z.literal("on", { error: "Debes autorizar el tratamiento de datos para registrarte" }),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo no válido"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

/** Misma regla de clave que el registro. */
const newPassword = z.string().min(8, "Mínimo 8 caracteres").max(72, "Máximo 72 caracteres");

export const changeEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo no válido"),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Escribe tu contraseña actual"),
    new_password: newPassword,
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    path: ["confirm_password"],
    message: "Las contraseñas no coinciden",
  })
  .refine((d) => d.new_password !== d.current_password, {
    path: ["new_password"],
    message: "La nueva contraseña debe ser distinta de la actual",
  });

export const storeSchema = z.object({
  name: trimmed(60).min(2, "Mínimo 2 caracteres"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isValidSlug, "Usa de 3 a 40 letras minúsculas, números y guiones; algunas palabras están reservadas"),
  description: optionalText(500),
  city: optionalText(60),
  category_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined))
    .transform((v) => v ?? null),
  whatsapp: z
    .string()
    .transform((v) => normalizeWhatsapp(v))
    .refine(isValidWhatsapp, "Número no válido: usa el indicativo y de 10 a 15 dígitos (ej. 573001234567)"),
  logo_url: optionalText(500),
  banner_url: optionalText(500),
  offers_delivery: z
    .literal("on")
    .optional()
    .transform((v) => v === "on"),
  offers_pickup: z
    .literal("on")
    .optional()
    .transform((v) => v === "on"),
  whatsapp_public_ok: z.literal("on", { error: "Confirma que el número se mostrará en tu tienda" }),
});

const money = (label: string) =>
  z.coerce
    .number({ error: `${label}: escribe un número` })
    .int(`${label}: sin decimales`)
    .min(0, `${label}: no puede ser negativo`)
    .max(999_999_999, `${label}: demasiado alto`);

export const productSchema = z
  .object({
    name: trimmed(80).min(2, "Mínimo 2 caracteres"),
    description: optionalText(1000),
    price: money("Precio"),
    sale_price: z
      .union([z.literal(""), money("Precio de oferta")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    stock: z
      .union([
        z.literal(""),
        z.coerce.number().int("Stock: sin decimales").min(0, "Stock: no puede ser negativo").max(100000),
      ])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    is_unique: z
      .literal("on")
      .optional()
      .transform((v) => v === "on"),
    status: z.enum(["disponible", "agotado", "vendido"]).default("disponible"),
    image_url: optionalText(500),
    image_url_2: optionalText(500),
    image_url_3: optionalText(500),
  })
  .refine((p) => p.sale_price === null || p.sale_price < p.price, {
    path: ["sale_price"],
    message: "El precio de oferta debe ser menor que el precio",
  });

export type FieldErrors = Partial<Record<string, string>>;

/** Primer error por campo, en el formato que usan los formularios. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    out[key] ??= issue.message;
  }
  return out;
}

/** Solo rutas internas para ?next= (evita redirecciones abiertas). */
export function safeNext(next: unknown, fallback = "/panel"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
