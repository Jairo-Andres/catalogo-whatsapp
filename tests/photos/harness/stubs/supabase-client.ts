/**
 * Supabase falso para el banco de pruebas de fotos: guarda lo que se sube en window.__uploads.
 * window.__uploadMode = "network" hace fallar la subida como cuando se corta la conexión.
 */
type Upload = { path: string; type: string; size: number };

declare global {
  interface Window {
    __uploads: Upload[];
    __uploadMode?: "ok" | "network";
  }
}

window.__uploads = [];

const BASE = "https://abc.supabase.co/storage/v1/object/public/catalogo/";

export function createClient() {
  return {
    storage: {
      from: () => ({
        async upload(path: string, body: Blob, opts: { contentType: string }) {
          if (window.__uploadMode === "network") {
            return { data: null, error: Object.assign(new Error("Failed to fetch"), { name: "StorageUnknownError" }) };
          }
          window.__uploads.push({ path, type: opts.contentType, size: body.size });
          return { data: { path }, error: null };
        },
        getPublicUrl: (path: string) => ({ data: { publicUrl: BASE + path } }),
      }),
    },
  };
}
