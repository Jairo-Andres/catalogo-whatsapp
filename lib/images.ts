import imageCompression from "browser-image-compression";
import { LIMITS } from "./site";

const DIRECT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DIRECT_MAX_BYTES = 2 * 1024 * 1024; // límite del bucket
export const QUALITIES = [0.85, 0.75, 0.65, 0.55];
/** Una lectura parcial sirve si llegó al menos a la mitad: el final de una "foto en movimiento" es el video. */
const PARTIAL_MIN_RATIO = 0.5;

/**
 * Copia en memoria el archivo que entrega el selector. En Chrome Android ese File apunta al
 * archivo real del celular, y Chrome guarda su tamaño y fecha al elegirlo. Si el celular se queda
 * sin memoria al abrir la galería o la cámara, Android cierra Chrome y al volver esa referencia ya
 * no sirve; también falla si la galería o la sincronización tocan el archivo. En esos casos la
 * lectura da NotReadableError y la subida "Failed to fetch". Se prueban varias formas de leerlo;
 * si ninguna sirve, hay que volver a elegir la foto.
 */
export async function readIntoMemory(file: File): Promise<File> {
  const failures: string[] = [];
  const make = (data: BlobPart) =>
    new File([data], file.name || "foto", { type: file.type, lastModified: file.lastModified });

  // 1. Lectura normal.
  try {
    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > 0) return make(buffer);
    failures.push("arrayBuffer: vacío");
  } catch (e) {
    failures.push(`arrayBuffer: ${errorText(e)}`);
  }

  // 2. Por partes: si se corta al final, lo leído suele traer la foto completa.
  //    Si la foto quedó incompleta, lo detecta el paso de compresión.
  let streamNoted = false;
  try {
    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = file.stream().getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        total += value.byteLength;
      }
    } catch (e) {
      failures.push(`stream (${total} de ${file.size} bytes): ${errorText(e)}`);
      streamNoted = true;
      if (total < file.size * PARTIAL_MIN_RATIO) throw e;
    }
    if (total > 0) return make(new Blob(chunks as BlobPart[], { type: file.type }));
  } catch (e) {
    if (!streamNoted) failures.push(`stream: ${errorText(e)}`);
  }

  // 3. FileReader (otro camino interno del navegador).
  try {
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as ArrayBuffer);
      fr.onerror = () => reject(fr.error);
      fr.readAsArrayBuffer(file);
    });
    if (buffer.byteLength > 0) return make(buffer);
  } catch (e) {
    failures.push(`FileReader: ${errorText(e)}`);
  }

  const error = new Error(failures.join(" | "));
  error.name = "NotReadableError";
  throw error;
}

type Compressor = (source: Blob, maxSide: number) => Promise<File>;

/** Métodos de compresión en el orden en que se prueban (se pueden reemplazar en las pruebas). */
export type CompressDeps = {
  heicToJpeg: (file: File) => Promise<Blob>;
  methods: { name: string; run: Compressor }[];
};

const defaultDeps: CompressDeps = {
  heicToJpeg,
  methods: [
    // 1. Reduce la foto al decodificarla: es lo que menos memoria gasta.
    { name: "createImageBitmap", run: compressWithBitmap },
    // 2. Decodificador normal del navegador + canvas del tamaño final.
    { name: "img", run: compressWithImg },
    // 3. Librería, con worker y sin worker.
    { name: "compresión con worker", run: (s, m) => compressWithLibrary(s, m, true) },
    { name: "compresión sin worker", run: (s, m) => compressWithLibrary(s, m, false) },
  ],
};

/**
 * Comprime en el navegador cualquier foto (también las de la cámara del celular, de 12 a 200 MP,
 * y las HEIC de Samsung o iPhone) a WebP de máx. `maxSide` px de lado y ~300 KB.
 * Recibe la copia en memoria de readIntoMemory. HEIC/HEIF se convierte antes a JPEG con heic2any
 * (se carga solo si hace falta). Prueba los métodos en orden; si todos fallan y la foto ya es
 * JPG, PNG o WebP de 2 MB o menos, se sube tal cual; si no, el error junta el motivo de cada uno.
 */
export async function compressToWebp(
  file: File,
  maxSide: number = LIMITS.imageMaxSide,
  deps: CompressDeps = defaultDeps,
): Promise<File> {
  const failures: string[] = [];
  const note = (step: string, e: unknown) => {
    failures.push(`${step}: ${errorText(e)}`);
    console.warn(`No se pudo procesar la foto con ${step}`, e);
  };

  let source: Blob = file;
  if (isHeic(file)) {
    try {
      source = await deps.heicToJpeg(file);
    } catch (e) {
      note("heic2any", e);
    }
  }

  for (const method of deps.methods) {
    try {
      // Si ni con la calidad más baja queda bajo el tope (fotos con mucho detalle o ruido),
      // se reduce el tamaño un 20 % por vuelta, sin bajar de 960 px de lado.
      let side = maxSide;
      let out = await method.run(source, side);
      while (out.size > LIMITS.imageMaxKB * 1024 && side > 960) {
        side = Math.max(960, Math.round(side * 0.8));
        out = await method.run(source, side);
      }
      return out;
    } catch (e) {
      note(method.name, e);
    }
  }
  if (DIRECT_TYPES.includes(source.type) && source.size <= DIRECT_MAX_BYTES) {
    return source instanceof File ? source : new File([source], "foto", { type: source.type });
  }
  throw new Error(failures.join(" | "));
}

export function isHeic(file: { type: string; name: string }): boolean {
  return /^image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

async function heicToJpeg(file: File): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  return Array.isArray(out) ? out[0] : out;
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

/** Decodifica con un elemento img y dibuja directo al tamaño final. */
async function compressWithImg(source: Blob, maxSide: number): Promise<File> {
  const url = URL.createObjectURL(source);
  const img = new Image();
  try {
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const { width, height } = fitInside(img.naturalWidth, img.naturalHeight, maxSide);
    return await encodeCanvas(width, height, (ctx) => ctx.drawImage(img, 0, 0, width, height));
  } finally {
    img.src = "";
    URL.revokeObjectURL(url);
  }
}

async function compressWithLibrary(source: Blob, maxSide: number, useWebWorker: boolean): Promise<File> {
  const input = source instanceof File ? source : new File([source], "foto.jpg", { type: source.type });
  const out = await imageCompression(input, {
    maxSizeMB: LIMITS.imageTargetKB / 1024,
    maxWidthOrHeight: maxSide,
    fileType: "image/webp",
    initialQuality: QUALITIES[0],
    useWebWorker,
  });
  return new File([out], "foto.webp", { type: "image/webp" });
}

/** Medidas que caben en un cuadrado de `maxSide` sin deformar ni agrandar. */
export function fitInside(w0: number, h0: number, maxSide: number) {
  if (!w0 || !h0) throw new Error("La foto no tiene medidas.");
  const scale = Math.min(1, maxSide / Math.max(w0, h0));
  return { width: Math.max(1, Math.round(w0 * scale)), height: Math.max(1, Math.round(h0 * scale)) };
}

/**
 * Codifica bajando la calidad hasta quedar en `targetBytes` (o la última calidad si no alcanza).
 * Si el navegador no sabe WebP (devuelve null u otro tipo), usa JPEG con la misma calidad.
 */
export async function encodeWithTarget(
  encode: (type: string, quality: number) => Promise<Blob | null>,
  targetBytes: number,
  qualities: number[] = QUALITIES,
): Promise<Blob> {
  let best: Blob | null = null;
  for (const quality of qualities) {
    let blob = await encode("image/webp", quality);
    if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg", quality);
    if (!blob) throw new Error("No se pudo codificar la foto.");
    best = blob;
    if (blob.size <= targetBytes) break;
  }
  if (!best) throw new Error("No se pudo codificar la foto.");
  return best;
}

/** Dibuja en un canvas del tamaño final y lo codifica. */
async function encodeCanvas(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("El navegador no permite usar canvas.");
    ctx.imageSmoothingQuality = "high";
    draw(ctx);
    const blob = await encodeWithTarget(
      (type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality)),
      LIMITS.imageTargetKB * 1024,
    );
    return new File([blob], blob.type === "image/jpeg" ? "foto.jpg" : "foto.webp", { type: blob.type });
  } finally {
    canvas.width = canvas.height = 0; // libera la memoria del canvas en celulares
  }
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

export type PhotoStage = "read" | "compress" | "upload";

const MEMORY_TIP =
  "Si tienes muchas pestañas abiertas en Chrome, ciérralas: el celular se queda sin memoria al abrir la galería o la cámara.";

/** Mensaje para la persona según en qué paso falló la foto, y si conviene ofrecer elegirla de nuevo. */
export function photoErrorMessage(stage: PhotoStage, e: unknown): { message: string; canRepick: boolean } {
  const text = errorText(e);
  if (stage === "read") {
    return {
      message: `El celular no dejó leer esta foto. Toca «Elegir de nuevo» y elige la misma foto. ${MEMORY_TIP}`,
      canRepick: true,
    };
  }
  if (stage === "compress") {
    return {
      message: `No pudimos procesar esta foto. Prueba con otra o tómale captura de pantalla. ${MEMORY_TIP}`,
      canRepick: true,
    };
  }
  if (/failed to fetch|network|load failed/i.test(text)) {
    return {
      message: "No pudimos subir la foto: se cortó la conexión. Revisa la señal y toca «Elegir de nuevo».",
      canRepick: true,
    };
  }
  const detail = e instanceof Error && e.message ? ` (${e.message})` : "";
  return { message: `No pudimos subir la foto${detail}. Intenta de nuevo.`, canRepick: true };
}

/** Extensión de archivo según el tipo de imagen que acepta el bucket. */
export function imageExtension(type: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  return "webp";
}
