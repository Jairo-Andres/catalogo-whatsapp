import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

/** Foto "pesada" de prueba: 3000x3000 con ruido (varios MB en JPEG). */
export default async function globalSetup() {
  const dir = path.resolve(__dirname, ".fixtures");
  mkdirSync(dir, { recursive: true });
  const size = 3000;
  const raw = Buffer.alloc(size * size * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = (i * 2654435761) >>> 24;
  await sharp(raw, { raw: { width: size, height: size, channels: 3 } })
    .jpeg({ quality: 95 })
    .toFile(path.join(dir, "foto-pesada.jpg"));
}
