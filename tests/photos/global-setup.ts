import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { build } from "rolldown";
import sharp from "sharp";

/**
 * Prepara las pruebas de fotos en navegador, sin Supabase ni Next:
 * 1. Empaqueta el formulario real de producto con rolldown (Supabase y la acción del servidor, falsos).
 * 2. Genera fotos de prueba con sharp: JPG de 12 y 50 MP, PNG y una foto girada por EXIF.
 * 3. Sirve todo en http://localhost:4319.
 */
const root = path.resolve(__dirname, "../..");
const out = path.resolve(__dirname, ".out");
export const PORT = 4319;
const STUBS: Record<string, string> = {
  "lib/supabase/client": path.join(__dirname, "harness/stubs/supabase-client.ts"),
  "lib/actions/products": path.join(__dirname, "harness/stubs/products-action.ts"),
  "next/link": path.join(__dirname, "harness/stubs/next-link.tsx"),
};

/** Degradado con algo de ruido: pesa como una foto real de cámara (3 a 5 MB a 12 MP). */
async function noisyJpeg(file: string, width: number, height: number, orientation?: number) {
  const raw = Buffer.alloc(width * height * 3);
  let seed = 1;
  for (let y = 0, i = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const noise = (seed >>> 27) - 16;
      raw[i++] = Math.max(0, Math.min(255, ((x * 255) / width + noise) | 0));
      raw[i++] = Math.max(0, Math.min(255, ((y * 255) / height + noise) | 0));
      raw[i++] = Math.max(0, Math.min(255, (((x + y) * 128) / (width + height) + 64 + noise) | 0));
    }
  }
  let img = sharp(raw, { raw: { width, height, channels: 3 } }).jpeg({ quality: 92 });
  if (orientation) img = img.withMetadata({ orientation });
  await img.toFile(path.join(out, file));
}

export default async function globalSetup() {
  mkdirSync(out, { recursive: true });

  await build({
    input: path.join(__dirname, "harness/entry.tsx"),
    cwd: root,
    platform: "browser",
    resolve: { alias: { "@": root } },
    plugins: [
      {
        // Reemplaza lo que necesita servidor (acción, Supabase, Next) por versiones falsas.
        name: "stubs",
        resolveId(id: string) {
          const clean = id.replaceAll("\\", "/").replace(/\.tsx?$/, "");
          for (const [suffix, stub] of Object.entries(STUBS)) {
            if (clean === suffix || clean.endsWith("/" + suffix)) return stub;
          }
          return null;
        },
      },
    ],
    transform: {
      jsx: "react-jsx",
      define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
        "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify("https://abc.supabase.co"),
        "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": JSON.stringify("clave-publica-de-prueba"),
        "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": "undefined",
      },
    },
    output: {
      file: path.join(out, "harness.js"),
      format: "esm",
      codeSplitting: false,
      // Algunas librerías leen process.env en el navegador.
      banner: 'var process = globalThis.process ?? { env: { NODE_ENV: "production" } };',
    },
    logLevel: "warn",
  });
  writeFileSync(
    path.join(out, "index.html"),
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Fotos</title>
<style>.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}</style></head>
<body><div id="app"></div><script type="module" src="/harness.js"></script></body></html>`,
  );

  // 12 MP (4000x3000) y 50 MP (8160x6120), como las de la cámara de un Samsung.
  await noisyJpeg("camara-12mp.jpg", 4000, 3000);
  await noisyJpeg("camara-50mp.jpg", 8160, 6120);
  // Guardada horizontal pero con EXIF "girar 90°": debe salir vertical.
  await noisyJpeg("girada-exif.jpg", 4000, 3000, 6);
  await sharp({ create: { width: 1200, height: 800, channels: 4, background: "#C2185B" } })
    .png()
    .toFile(path.join(out, "captura.png"));

  const types: Record<string, string> = { ".html": "text/html", ".js": "text/javascript" };
  const server = createServer((req, res) => {
    const name = (req.url ?? "/").split("?")[0];
    const file = path.join(out, name === "/" ? "index.html" : name);
    try {
      const body = readFileSync(file);
      res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  return () => new Promise<void>((resolve) => server.close(() => resolve()));
}
