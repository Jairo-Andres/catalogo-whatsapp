import imageCompression from "browser-image-compression";
import { LIMITS } from "./site";

const DIRECT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DIRECT_MAX_BYTES = 2 * 1024 * 1024; // límite del bucket
const QUALITIES = [0.85, 0.75, 0.65, 0.55];

/**
 * Comprime en el navegador cualquier foto (también las de la cámara del celular, de 12 a 200 MP,
 * y las HEIC de Samsung o iPhone) a WebP de máx. `maxSide` px de lado y ~300 KB.
 *
 * 1. HEIC/HEIF se convierte antes a JPEG con heic2any (se carga solo si hace falta).
 * 2. createImageBitmap reduce la foto al decodificarla, así nunca se crea un canvas gigante
 *    (Chrome Android falla con canvas de más de ~16 MP, que era el error con la cámara).
 * 3. Respaldo: browser-image-compression, con worker y sin worker.
 * 4. Último recurso: si ya es JPG, PNG o WebP de 2 MB o menos, se sube tal cual.
 */
export async function compressToWebp(file: File, maxSide: number = LIMITS.imageMaxSide): Promise<File> {
  let source: Blob = file;
  if (isHeic(file)) source = await heicToJpeg(file);

  try {
    return await compressWithBitmap(source, maxSide);
  } catch (e) {
    console.warn("createImageBitmap no pudo procesar la foto; se usa el respaldo", e);
  }

  const input = source instanceof File ? source : new File([source], "foto.jpg", { type: source.type });
  let lastError: unknown;
  for (const useWebWorker of [true, false]) {
    try {
      const out = await imageCompression(input, {
        maxSizeMB: LIMITS.imageTargetKB / 1024,
        maxWidthOrHeight: maxSide,
        fileType: "image/webp",
        initialQuality: QUALITIES[0],
        useWebWorker,
      });
      return new File([out], "foto.webp", { type: "image/webp" });
    } catch (e) {
      lastError = e;
      console.warn(`No se pudo comprimir la foto (useWebWorker=${useWebWorker})`, e);
    }
  }
  if (DIRECT_TYPES.includes(input.type) && input.size <= DIRECT_MAX_BYTES) return input;
  throw lastError;
}

export function isHeic(file: File): boolean {
  return /^image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

async function heicToJpeg(file: File): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  return Array.isArray(out) ? out[0] : out;
}

async function compressWithBitmap(source: Blob, maxSide: number): Promise<File> {
  // Primero solo las medidas (ya giradas según el EXIF de la cámara), sin decodificar la foto entera.
  const { width: w0, height: h0 } = await imageSize(source);
  const scale = Math.min(1, maxSide / Math.max(w0, h0));
  const width = Math.max(1, Math.round(w0 * scale));
  const height = Math.max(1, Math.round(h0 * scale));

  const bitmap = await createImageBitmap(source, {
    imageOrientation: "from-image",
    resizeWidth: width,
    resizeHeight: height,
    resizeQuality: "high",
  });
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("El navegador no permite usar canvas.");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const target = LIMITS.imageTargetKB * 1024;
    let best: Blob | null = null;
    for (const quality of QUALITIES) {
      let blob = await toBlob(canvas, "image/webp", quality);
      // Algunos navegadores no codifican WebP y devuelven PNG: entonces JPEG.
      if (blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", quality);
      best = blob;
      if (blob.size <= target) break;
    }
    const type = best!.type;
    return new File([best!], type === "image/jpeg" ? "foto.jpg" : "foto.webp", { type });
  } finally {
    bitmap.close();
  }
}

function imageSize(source: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.naturalWidth && img.naturalHeight) resolve({ width: img.naturalWidth, height: img.naturalHeight });
      else reject(new Error("La foto no tiene medidas."));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("El navegador no pudo leer la foto."));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo codificar la foto."))), type, quality),
  );
}

/** Extensión de archivo según el tipo de imagen que acepta el bucket. */
export function imageExtension(type: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  return "webp";
}
