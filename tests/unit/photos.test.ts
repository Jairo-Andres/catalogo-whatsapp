import { afterEach, describe, expect, it, vi } from "vitest";
import {
  compressToWebp,
  encodeWithTarget,
  fitInside,
  isHeic,
  photoErrorMessage,
  readIntoMemory,
  type CompressDeps,
} from "@/lib/images";
import { clearDraft, draftKey, formToDraft, loadDraft, saveDraft } from "@/lib/product-draft";

/** Error como el que da Chrome Android cuando el archivo elegido ya no se puede leer. */
function notReadable() {
  const e = new Error(
    "The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.",
  );
  e.name = "NotReadableError";
  return e;
}

const jpegBytes = new Uint8Array(1000).map((_, i) => i % 256);

/** File de prueba cuyas formas de lectura se pueden hacer fallar una por una. */
function fakeFile(opts: { arrayBuffer?: "ok" | "fail"; stream?: "ok" | "fail" | "partial" | "early"; size?: number }) {
  const file = new File([jpegBytes], "camara.jpg", { type: "image/jpeg" });
  if (opts.arrayBuffer === "fail") file.arrayBuffer = () => Promise.reject(notReadable());
  if (opts.stream && opts.stream !== "ok") {
    const mode = opts.stream;
    file.stream = () => {
      // "partial": llega el 80 % (la foto) y falla al final (el video de una foto en movimiento).
      // "early": falla al 10 %, no sirve. "fail": falla sin leer nada.
      let sent = mode === "fail";
      return new ReadableStream<Uint8Array>({
        pull(controller) {
          if (sent) return controller.error(new TypeError("network error"));
          sent = true;
          controller.enqueue(jpegBytes.slice(0, mode === "partial" ? 800 : 100));
        },
      }) as ReturnType<File["stream"]>;
    };
  }
  return file;
}

class FailingFileReader {
  result: ArrayBuffer | null = null;
  error: Error | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readAsArrayBuffer() {
    this.error = notReadable();
    queueMicrotask(() => this.onerror?.());
  }
}

class WorkingFileReader {
  result: ArrayBuffer | null = null;
  error: Error | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readAsArrayBuffer() {
    this.result = jpegBytes.buffer.slice(0) as ArrayBuffer;
    queueMicrotask(() => this.onload?.());
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("lectura de la foto elegida (readIntoMemory)", () => {
  it("lee normal y devuelve una copia en memoria con el mismo nombre y tipo", async () => {
    const copy = await readIntoMemory(fakeFile({}));
    expect(copy.size).toBe(1000);
    expect(copy.type).toBe("image/jpeg");
    expect(copy.name).toBe("camara.jpg");
    expect(new Uint8Array(await copy.arrayBuffer())).toEqual(jpegBytes);
  });

  it("si arrayBuffer falla, lee por partes con stream", async () => {
    const copy = await readIntoMemory(fakeFile({ arrayBuffer: "fail" }));
    expect(copy.size).toBe(1000);
  });

  it("si el stream se corta al final, usa lo leído (la foto sin el video de la foto en movimiento)", async () => {
    vi.stubGlobal("FileReader", FailingFileReader);
    const copy = await readIntoMemory(fakeFile({ arrayBuffer: "fail", stream: "partial" }));
    expect(copy.size).toBe(800);
  });

  it("si el stream se corta muy pronto, prueba FileReader", async () => {
    vi.stubGlobal("FileReader", WorkingFileReader);
    const copy = await readIntoMemory(fakeFile({ arrayBuffer: "fail", stream: "early" }));
    expect(copy.size).toBe(1000);
  });

  it("si todo falla, lanza NotReadableError con el motivo de cada intento", async () => {
    vi.stubGlobal("FileReader", FailingFileReader);
    const err = await readIntoMemory(fakeFile({ arrayBuffer: "fail", stream: "fail" })).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("NotReadableError");
    expect(err.message).toMatch(
      /^arrayBuffer: NotReadableError.* \| stream \(0 de 1000 bytes\): TypeError: network error \| FileReader: NotReadableError/,
    );
  });
});

describe("compresión: orden de los métodos de respaldo", () => {
  const ok = (name: string) => async () => new File([new Uint8Array(10)], `${name}.webp`, { type: "image/webp" });
  const fail = (msg: string) => async () => {
    throw new Error(msg);
  };
  const deps = (runs: Array<() => Promise<File>>, heic?: CompressDeps["heicToJpeg"]): CompressDeps => ({
    heicToJpeg: heic ?? (async () => new Blob([jpegBytes], { type: "image/jpeg" })),
    methods: runs.map((run, i) => ({ name: `m${i + 1}`, run: vi.fn(run) })),
  });

  it("usa el primer método que funcione y no prueba los demás", async () => {
    const d = deps([fail("sin memoria"), ok("m2"), ok("m3")]);
    const out = await compressToWebp(new File([jpegBytes], "a.jpg", { type: "image/jpeg" }), 1600, d);
    expect(out.name).toBe("m2.webp");
    expect(d.methods[0].run).toHaveBeenCalledTimes(1);
    expect(d.methods[2].run).not.toHaveBeenCalled();
  });

  it("pasa el tamaño máximo a cada método", async () => {
    const d = deps([ok("m1")]);
    await compressToWebp(new File([jpegBytes], "a.jpg", { type: "image/jpeg" }), 512, d);
    expect(d.methods[0].run).toHaveBeenCalledWith(expect.any(File), 512);
  });

  it("si todos fallan y la foto es JPG de 2 MB o menos, la sube tal cual", async () => {
    const original = new File([jpegBytes], "a.jpg", { type: "image/jpeg" });
    const out = await compressToWebp(original, 1600, deps([fail("x"), fail("y")]));
    expect(out).toBe(original);
  });

  it("si todos fallan y la foto pesa más de 2 MB, el error junta el motivo de cada método", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "a.jpg", { type: "image/jpeg" });
    const err = await compressToWebp(big, 1600, deps([fail("sin memoria"), fail("canvas")])).catch((e) => e);
    expect(err.message).toBe("m1: Error: sin memoria | m2: Error: canvas");
  });

  it("convierte HEIC a JPEG antes de comprimir", async () => {
    const heic = vi.fn(async () => new Blob([jpegBytes], { type: "image/jpeg" }));
    const d = deps([ok("m1")], heic);
    await compressToWebp(new File([jpegBytes], "IMG_0001.HEIC", { type: "" }), 1600, d);
    expect(heic).toHaveBeenCalledTimes(1);
    expect(d.methods[0].run).toHaveBeenCalledWith(expect.objectContaining({ type: "image/jpeg" }), 1600);
  });

  it("si heic2any falla, igual intenta los métodos con el archivo original", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const d = deps([ok("m1")], async () => {
      throw new Error("ERR_LIBHEIF");
    });
    const out = await compressToWebp(new File([jpegBytes], "foto.heic", { type: "image/heic" }), 1600, d);
    expect(out.name).toBe("m1.webp");
  });
});

describe("detección de HEIC", () => {
  it.each([
    [{ type: "image/heic", name: "x" }, true],
    [{ type: "image/heif", name: "x" }, true],
    [{ type: "", name: "20261006_120000.HEIC" }, true],
    [{ type: "", name: "foto.heif" }, true],
    [{ type: "image/jpeg", name: "foto.jpg" }, false],
    [{ type: "image/png", name: "heic.png" }, false],
  ])("%j → %s", (file, expected) => {
    expect(isHeic(file)).toBe(expected);
  });
});

describe("tamaño y calidad", () => {
  it("reduce al lado mayor sin deformar ni agrandar", () => {
    expect(fitInside(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitInside(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
    expect(fitInside(8160, 6120, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitInside(800, 600, 1600)).toEqual({ width: 800, height: 600 });
    expect(() => fitInside(0, 0, 1600)).toThrow();
  });

  const blobOf = (type: string, size: number) => new Blob([new Uint8Array(size)], { type });

  it("usa la primera calidad que quepa en el objetivo", async () => {
    const sizes: Record<number, number> = { 0.85: 500, 0.75: 280, 0.65: 200 };
    const encode = vi.fn(async (type: string, q: number) => blobOf(type, sizes[q] ?? 100));
    const out = await encodeWithTarget(encode, 300, [0.85, 0.75, 0.65]);
    expect(out.size).toBe(280);
    expect(encode.mock.calls.map((c) => c[1])).toEqual([0.85, 0.75]);
  });

  it("si ninguna calidad cabe, se queda con la última", async () => {
    const out = await encodeWithTarget(async (type) => blobOf(type, 999), 300, [0.85, 0.75]);
    expect(out.size).toBe(999);
  });

  it("si el navegador no codifica WebP, usa JPEG", async () => {
    const encode = vi.fn(async (type: string) => (type === "image/webp" ? blobOf("image/png", 50) : blobOf(type, 50)));
    const out = await encodeWithTarget(encode, 300);
    expect(out.type).toBe("image/jpeg");
  });

  it("si toBlob devuelve null en WebP, usa JPEG; si también falla, lanza error", async () => {
    const out = await encodeWithTarget(async (type) => (type === "image/webp" ? null : blobOf(type, 10)), 300);
    expect(out.type).toBe("image/jpeg");
    await expect(encodeWithTarget(async () => null, 300)).rejects.toThrow("No se pudo codificar");
  });
});

describe("mensajes de error de la foto", () => {
  it("lectura: pide elegir de nuevo y sugiere cerrar pestañas", () => {
    const m = photoErrorMessage("read", notReadable());
    expect(m.canRepick).toBe(true);
    expect(m.message).toMatch(/Elegir de nuevo/);
    expect(m.message).toMatch(/pestañas/);
  });

  it("compresión: sugiere otra foto o captura de pantalla", () => {
    const m = photoErrorMessage("compress", new Error("canvas"));
    expect(m.message).toMatch(/No pudimos procesar esta foto/);
    expect(m.message).toMatch(/captura de pantalla/);
  });

  it("subida con error de red: habla de la conexión, no del archivo", () => {
    const m = photoErrorMessage("upload", new TypeError("Failed to fetch"));
    expect(m.message).toMatch(/se cortó la conexión/);
  });

  it("subida con otro error: muestra el mensaje de Supabase", () => {
    const m = photoErrorMessage("upload", new Error("The object exceeded the maximum allowed size"));
    expect(m.message).toBe(
      "No pudimos subir la foto (The object exceeded the maximum allowed size). Intenta de nuevo.",
    );
  });
});

describe("borrador del formulario de producto", () => {
  function memoryStorage() {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
  }
  const throwing = {
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
    removeItem: () => {
      throw new Error("SecurityError");
    },
  };

  it("usa una clave por tienda y por producto", () => {
    expect(draftKey("t1")).toBe("catalogo:borrador-producto:t1:nuevo");
    expect(draftKey("t1", "p9")).toBe("catalogo:borrador-producto:t1:p9");
  });

  it("guarda solo los campos del formulario y restaura lo mismo", () => {
    const storage = memoryStorage();
    const draft = formToDraft([
      ["id", "p9"],
      ["name", "Torta"],
      ["price", "30000"],
      ["status", "disponible"],
      ["image_url", "https://x/1.webp"],
      ["$ACTION_ID_abc", ""],
    ]);
    expect(draft).toEqual({ name: "Torta", price: "30000", status: "disponible", image_url: "https://x/1.webp" });
    expect(saveDraft("k", draft, storage)).toBe(true);
    expect(loadDraft("k", storage)).toEqual(draft);
  });

  it("no guarda un formulario vacío (y borra el borrador anterior)", () => {
    const storage = memoryStorage();
    saveDraft("k", { name: "Torta" }, storage);
    const empty = formToDraft([
      ["name", ""],
      ["status", "disponible"],
    ]);
    expect(empty).toBeNull();
    saveDraft("k", empty, storage);
    expect(storage.data.has("k")).toBe(false);
  });

  it("limpia el borrador", () => {
    const storage = memoryStorage();
    saveDraft("k", { name: "Torta" }, storage);
    clearDraft("k", storage);
    expect(loadDraft("k", storage)).toBeNull();
  });

  it("ignora datos dañados o con campos raros", () => {
    const storage = memoryStorage();
    storage.setItem("a", "{no es json");
    storage.setItem("b", JSON.stringify(["x"]));
    storage.setItem("c", JSON.stringify({ name: 5, price: "100", hack: "x" }));
    expect(loadDraft("a", storage)).toBeNull();
    expect(loadDraft("b", storage)).toBeNull();
    expect(loadDraft("c", storage)).toEqual({ price: "100" });
  });

  it("sigue funcionando si sessionStorage lanza error o no existe", () => {
    expect(loadDraft("k", throwing)).toBeNull();
    expect(saveDraft("k", { name: "Torta" }, throwing)).toBe(false);
    expect(() => clearDraft("k", throwing)).not.toThrow();
    expect(loadDraft("k", null)).toBeNull();
    expect(saveDraft("k", { name: "Torta" }, null)).toBe(false);
    // Sin window (servidor): no falla.
    expect(loadDraft("k")).toBeNull();
  });
});
