/** Datos generales del sitio. Nombre comercial: MiTiendaW. */
export const SITE_NAME = "MiTiendaW";
export const SITE_TAGLINE = "Crea tu catálogo y recibe pedidos por WhatsApp en minutos";
export const AUTHOR_NAME = "Jairo Sierra";
export const AUTHOR_LINKEDIN = "https://www.linkedin.com/in/jairo-andres31-analyst";

export function siteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}

/** Límites del MVP (decisión pendiente 3: valores sugeridos, ajustables). */
export const LIMITS = {
  productsPerStore: 60,
  cartDistinctItems: 30,
  cartQtyPerItem: 99,
  imagesPerProduct: 3,
  imageMaxSide: 1600,
  imageTargetKB: 300,
} as const;
