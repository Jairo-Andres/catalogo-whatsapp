import imageCompression from "browser-image-compression";
import { LIMITS } from "./site";

/** Comprime y convierte a WebP en el navegador (máx. 1280 px de lado, objetivo ~200 KB). */
export async function compressToWebp(file: File, maxSide: number = LIMITS.imageMaxSide): Promise<File> {
  const out = await imageCompression(file, {
    maxSizeMB: LIMITS.imageTargetKB / 1024,
    maxWidthOrHeight: maxSide,
    fileType: "image/webp",
    initialQuality: 0.82,
    useWebWorker: true,
  });
  return new File([out], "foto.webp", { type: "image/webp" });
}
