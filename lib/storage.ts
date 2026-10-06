export const BUCKET = "catalogo";

/** URL pública de un archivo del bucket. */
export function publicUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** ¿La URL es un archivo de la carpeta de esta tienda en nuestro bucket? (el servidor no acepta otras) */
export function isOwnStorageUrl(url: string | null, storeId: string): boolean {
  if (url === null) return true;
  return url.startsWith(publicUrl(`${storeId}/`)) && !url.includes("..");
}
