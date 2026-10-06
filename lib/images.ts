import imageCompression from "browser-image-compression";
import { LIMITS } from "./site";

const DIRECT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DIRECT_MAX_BYTES = 2 * 1024 * 1024; // límite del bucket
const QUALITIES = [0.85, 0.75, 0.65, 0.55];
const READ_RETRY_MS = [400, 800, 1200, 1600];

/**
 * Copia en memoria el archivo que entrega el selector. En Chrome Android ese File apunta al
 * archivo real del celular; si la cámara o la galería lo modifican después de elegirlo
 * (terminan de guardarlo, le agregan metadatos o la parte de "foto en movimiento"),
 * leerlo falla con NotReadableError y subirlo falla con "Failed to fetch".
 * Se lee de una vez, con reintentos, y desde ahí todo usa la copia.
 */
export async function readIntoMemory(file: File): Promise<File> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= READ_RETRY_MS.length; attempt++) {
    try {
      const buffer = await file.arrayBuffer();
      if (buffer.byteLength === 0) throw new Error("El archivo llegó vacío.");
      return new File([buffer], file.name || "foto", { type: file.type, lastModified: file.lastModified });
    } catch (e) {
      lastError = e;
      console.warn(`No se pudo leer la foto (intento ${attempt + 1})`, e);
      if (attempt < READ_RETRY_MS.length) await wait(READ_RETRY_MS[attempt]);
    }
  }
  throw lastError;
}

/**
 * Comprime en el navegador cualquier foto (también las de la cámara del celular, de 12 a 200 MP,
 * y las HEIC de Samsung o iPhone) a WebP de máx. `maxSide` px de lado y ~300 KB.
 * Recibe la copia en memoria de readIntoMemory. Prueba varios métodos en orden y, si todos
 * fallan, el error junta el motivo de cada uno:
 *
 * 1. HEIC/HEIF se convierte antes a JPEG con heic2any (se carga solo si hace falta).
 * 2. Elemento img + canvas del tamaño final: sirve para todo lo que el navegador sabe mostrar
 *    y nunca crea un canvas grande (Chrome Android falla con canvas de más de ~16 MP).
 * 3. createImageBitmap reduciendo la foto al decodificarla.
 * 4. browser-image-compression, con worker y sin worker.
 * 5. Último recurso: si ya es JPG, PNG o WebP de 2 MB o menos, se sube tal cual.
 */
export async function compressToWebp(file: File, maxSide: number = LIMITS.imageMaxSide): Promise<File> {
  const failures: string[] = [];
  const note = (step: string, e: unknown) => {
    failures.push(`${step}: ${errorText(e)}`);
    console.warn(`No se pudo procesar la foto con ${step}`, e);
  };

  let source: Blob = file;
  if (isHeic(file)) {
    try {
      source = await heicToJpeg(file);
    } catch (e) {
      note("heic2any", e);
    }
  }

  try {
    return await compressWithImg(source, maxSide);
  } catch (e) {
    note("img", e);
  }
  try {
    return await compressWithBitmap(source, maxSide);
  } catch (e) {
    note("createImageBitmap", e);
  }

  const input = source instanceof File ? source : new File([source], "foto.jpg", { type: source.type });
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
      note(useWebWorker ? "compresión con worker" : "compresión sin worker", e);
    }
  }
  if (DIRECT_TYPES.includes(input.type) && input.size <= DIRECT_MAX_BYTES) return input;
  throw new Error(failures.join(" | "));
}

export function isHeic(file: File): boolean {
  return /^image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

async function heicToJpeg(file: File): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  return Array.isArray(out) ? out[0] : out;
}

/** Decodifica con un elemento img y dibuja directo al tamaño final. */
async function compressWithImg(source: Blob, maxSide: number): Promise<File> {
  const url = URL.createObjectURL(source);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const { width, height } = fitInside(img.naturalWidth, img.naturalHeight, maxSide);
    return await encodeCanvas(width, height, (ctx) => ctx.drawImage(img, 0, 0, width, height));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Reduce la foto al decodificarla con createImageBitmap y la dibuja al tamaño final. */
async function compressWithBitmap(source: Blob, maxSide: number): Promise<File> {
  const { width: w0, height: h0 } = await imageSize(source);
  const { width, height } = fitInside(w0, h0, maxSide);
  const bitmap = await createImageBitmap(source, {
    imageOrientation: "from-image",
    resizeWidth: width,
    resizeHeight: height,
    resizeQuality: "high",
  });
  try {
    return await encodeCanvas(width, height, (ctx) => ctx.drawImage(bitmap, 0, 0, width, height));
  } finally {
    bitmap.close();
  }
}

function fitInside(w0: number, h0: number, maxSide: number) {
  if (!w0 || !h0) throw new Error("La foto no tiene medidas.");
  const scale = Math.min(1, maxSide / Math.max(w0, h0));
  return { width: Math.max(1, Math.round(w0 * scale)), height: Math.max(1, Math.round(h0 * scale)) };
}

/** Dibuja en un canvas del tamaño final y lo codifica en WebP (o JPEG si el navegador no sabe WebP). */
async function encodeCanvas(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("El navegador no permite usar canvas.");
  ctx.imageSmoothingQuality = "high";
  draw(ctx);

  const target = LIMITS.imageTargetKB * 1024;
  let best: Blob | null = null;
  for (const quality of QUALITIES) {
    let blob = await toBlob(canvas, "image/webp", quality);
    // Algunos navegadores no codifican WebP (devuelven null o PNG): entonces JPEG.
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", quality);
    if (!blob) throw new Error("No se pudo codificar la foto.");
    best = blob;
    if (blob.size <= target) break;
  }
  canvas.width = canvas.height = 0; // libera la memoria del canvas en celulares
  const type = best!.type;
  return new File([best!], type === "image/jpeg" ? "foto.jpg" : "foto.webp", { type });
}

function imageSize(source: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("El navegador no pudo leer la foto."));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Texto corto de un error, para mostrarlo como detalle técnico. */
export function errorText(e: unknown): string {
  if (e instanceof Error) return `${e.name}: ${e.message}`;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

/** Extensión de archivo según el tipo de imagen que acepta el bucket. */
export function imageExtension(type: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  return "webp";
}
