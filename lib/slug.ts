/** Rutas del sitio que una tienda no puede usar como slug (igual que en la base de datos). */
export const RESERVED_SLUGS = [
  "panel", "admin", "login", "registro", "tiendas", "terminos", "privacidad", "api",
  "_next", "static", "auth", "salir", "sitemap", "robots", "favicon",
] as const;

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** "Dulces de Marta ñ!" -> "dulces-de-marta-n" */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return (
    slug.length >= 3 &&
    slug.length <= 40 &&
    SLUG_PATTERN.test(slug) &&
    !(RESERVED_SLUGS as readonly string[]).includes(slug)
  );
}
