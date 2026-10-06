import { supabaseBaseUrl } from "./supabase/env";

export const BUCKET = "catalogo";

const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

/** URL pública de un archivo del bucket. */
export function publicUrl(path: string): string {
  return `${supabaseBaseUrl()}${PUBLIC_PREFIX}${path}`;
}

/**
 * Ruta dentro del bucket ("{store_id}/productos/x.webp") de una URL pública nuestra, o null.
 * Compara por origen y ruta, no como texto, para que no importe si la variable de entorno
 * trae "/" al final, espacios o mayúsculas en el dominio.
 */
export function storagePath(url: string | null): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.origin !== new URL(supabaseBaseUrl()).origin || parsed.search || parsed.hash) return null;
  if (!parsed.pathname.startsWith(PUBLIC_PREFIX)) return null;
  const path = decodeURIComponent(parsed.pathname.slice(PUBLIC_PREFIX.length));
  if (path.split("/").some((part) => part === "" || part === "." || part === "..")) return null;
  return path;
}

/** ¿La URL es un archivo de la carpeta de esta tienda en nuestro bucket? (el servidor no acepta otras) */
export function isOwnStorageUrl(url: string | null, storeId: string): boolean {
  if (url === null) return true;
  return storagePath(url)?.startsWith(`${storeId}/`) ?? false;
}
