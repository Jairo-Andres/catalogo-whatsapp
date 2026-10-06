import imageCompression from "browser-image-compression";
import { LIMITS } from "./site";

const DIRECT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DIRECT_MAX_BYTES = 2 * 1024 * 1024; // límite del bucket

/**
 * Comprime y convierte a WebP en el navegador (máx. 1280 px de lado, objetivo ~200 KB).
 * Si el web worker falla (la librería lo carga desde un CDN) se reintenta en el hilo principal;
 * si tampoco se puede y la foto ya es JPG, PNG o WebP de 2 MB o menos, se sube tal cual.
 */
export async function compressToWebp(file: File, maxSide: number = LIMITS.imageMaxSide): Promise<File> {
  const options = {
    maxSizeMB: LIMITS.imageTargetKB / 1024,
    maxWidthOrHeight: maxSide,
    fileType: "image/webp",
    initialQuality: 0.82,
  };
  let lastError: unknown;
  for (const useWebWorker of [true, false]) {
    try {
      const out = await imageCompression(file, { ...options, useWebWorker });
      return new File([out], "foto.webp", { type: "image/webp" });
    } catch (e) {
      lastError = e;
      console.warn(`No se pudo comprimir la foto (useWebWorker=${useWebWorker})`, e);
    }
  }
  if (DIRECT_TYPES.includes(file.type) && file.size <= DIRECT_MAX_BYTES) return file;
  throw lastError;
}

/** Extensión de archivo según el tipo de imagen que acepta el bucket. */
export function imageExtension(type: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  return "webp";
}
