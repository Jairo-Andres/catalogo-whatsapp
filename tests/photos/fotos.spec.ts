import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Apartado de fotos completo en Chromium con pantalla de celular (Pixel 7):
 * compresión real de fotos de cámara, lectura que falla como en Chrome Android,
 * formulario con 1 a 3 fotos, borrador tras recargar, descuento desplegable y axe.
 */
const fixture = (name: string) => path.resolve(__dirname, ".out", name);

/** Comprime una foto con lib/images en el navegador y devuelve tipo, peso y medidas del resultado. */
async function compressInPage(page: Page, file: string) {
  await page.evaluate(() => {
    const input = Object.assign(document.createElement("input"), { type: "file", id: "lib-input" });
    document.body.append(input);
  });
  await page.setInputFiles("#lib-input", fixture(file));
  return page.evaluate(async () => {
    const input = document.getElementById("lib-input") as HTMLInputElement;
    const copy = await window.photos.readIntoMemory(input.files![0]);
    const out = await window.photos.compressToWebp(copy);
    const bitmap = await createImageBitmap(out);
    input.remove();
    return {
      type: out.type,
      kb: out.size / 1024,
      width: bitmap.width,
      height: bitmap.height,
      before: copy.size / 1024,
    };
  });
}

const fotoInput = (page: Page, n: number) => page.locator('input[type="file"]:not([capture])').nth(n);

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Producto" })).toBeVisible();
});

test.describe("compresión real en el navegador", () => {
  test("foto de cámara de 12 MP (4000x3000) → WebP de 1600x1200 y menos de 400 KB", async ({ page }) => {
    const r = await compressInPage(page, "camara-12mp.jpg");
    expect(r).toMatchObject({ type: "image/webp", width: 1600, height: 1200 });
    expect(r.kb).toBeLessThanOrEqual(400);
    expect(r.kb).toBeLessThan(r.before);
  });

  test("foto de 50 MP (8160x6120) → 1600x1200", async ({ page }) => {
    const r = await compressInPage(page, "camara-50mp.jpg");
    expect(r).toMatchObject({ type: "image/webp", width: 1600, height: 1200 });
    expect(r.kb).toBeLessThanOrEqual(400);
  });

  test("captura PNG (1200x800) → WebP sin agrandar", async ({ page }) => {
    const r = await compressInPage(page, "captura.png");
    expect(r).toMatchObject({ type: "image/webp", width: 1200, height: 800 });
  });

  test("respeta el giro EXIF de la cámara (sale vertical)", async ({ page }) => {
    const r = await compressInPage(page, "girada-exif.jpg");
    expect(r).toMatchObject({ width: 1200, height: 1600 });
  });

  test("si createImageBitmap no sirve, usa el decodificador img", async ({ page }) => {
    await page.evaluate(() => {
      window.createImageBitmap = () => Promise.reject(new Error("sin memoria"));
    });
    const r = await page.evaluate(async () => {
      const blob = await new Promise<Blob>((resolve) => {
        const c = Object.assign(document.createElement("canvas"), { width: 3000, height: 2000 });
        c.getContext("2d")!.fillRect(0, 0, 10, 10);
        c.toBlob((b) => resolve(b!), "image/jpeg", 0.9);
      });
      const out = await window.photos.compressToWebp(new File([blob], "a.jpg", { type: "image/jpeg" }));
      const img = new Image();
      img.src = URL.createObjectURL(out);
      await img.decode();
      return { type: out.type, width: img.naturalWidth, height: img.naturalHeight };
    });
    expect(r).toEqual({ type: "image/webp", width: 1600, height: 1067 });
  });

  test("si el navegador no codifica WebP, entrega JPEG", async ({ page }) => {
    await page.evaluate(() => {
      const original = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (cb, type, q) {
        return original.call(this, cb, type === "image/webp" ? "image/png" : type, q);
      };
    });
    const r = await compressInPage(page, "captura.png");
    expect(r.type).toBe("image/jpeg");
  });
});

test.describe("formulario de producto", () => {
  test("empieza con la foto principal y agrega hasta 3 con el botón", async ({ page }) => {
    await expect(page.getByRole("group", { name: "Foto principal" })).toBeVisible();
    await expect(fotoInput(page, 0)).toHaveCount(1);
    const add = page.getByRole("button", { name: "Agregar otra foto" });
    await add.click();
    await expect(page.getByRole("group", { name: "Foto 2" })).toBeVisible();
    await add.click();
    await expect(page.getByRole("group", { name: "Foto 3" })).toBeVisible();
    await expect(add).toBeHidden();
    await expect(page.locator('input[type="file"]:not([capture])')).toHaveCount(3);
    // Cada foto tiene también "Tomar foto" con la cámara trasera.
    await expect(page.locator('input[type="file"][capture="environment"]')).toHaveCount(3);
  });

  test("sube JPG de 12 MP, PNG y 50 MP; quita una y envía las que quedan", async ({ page }) => {
    const add = page.getByRole("button", { name: "Agregar otra foto" });
    await add.click();
    await add.click();
    await fotoInput(page, 0).setInputFiles(fixture("camara-12mp.jpg"));
    await expect(page.getByRole("group", { name: "Foto principal" }).getByText(/Foto lista/)).toBeVisible();
    await fotoInput(page, 1).setInputFiles(fixture("captura.png"));
    await expect(page.getByRole("group", { name: "Foto 2" }).getByText(/Foto lista/)).toBeVisible();
    await fotoInput(page, 2).setInputFiles(fixture("camara-50mp.jpg"));
    await expect(page.getByRole("group", { name: "Foto 3" }).getByText(/Foto lista/)).toBeVisible({
      timeout: 30_000,
    });

    const uploads = await page.evaluate(() => window.__uploads);
    expect(uploads).toHaveLength(3);
    for (const u of uploads) {
      expect(u.path).toMatch(/^t1\/productos\/[\w-]+\.webp$/);
      expect(u.type).toBe("image/webp");
      expect(u.size).toBeLessThanOrEqual(400 * 1024);
    }

    await page.getByRole("group", { name: "Foto 2" }).getByRole("button", { name: "Quitar" }).click();
    await page.getByLabel("Nombre").fill("Torta");
    await page.getByLabel("Precio (COP)").fill("30000");
    await page.getByRole("button", { name: "Publicar producto" }).click();
    await expect.poll(() => page.evaluate(() => window.__saved?.name)).toBe("Torta");
    const saved = await page.evaluate(() => window.__saved!);
    expect(saved.image_url).toContain(uploads[0].path);
    expect(saved.image_url_2).toBe("");
    expect(saved.image_url_3).toContain(uploads[2].path);
  });

  test("si el celular no deja leer la foto la primera vez, «Elegir de nuevo» la carga", async ({ page }) => {
    // Como Chrome Android: arrayBuffer, stream y FileReader fallan solo con la primera foto elegida.
    await page.evaluate(() => {
      const notReadable = () =>
        new DOMException(
          "The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.",
          "NotReadableError",
        );
      let failing = true;
      const ab = Blob.prototype.arrayBuffer;
      const st = Blob.prototype.stream;
      const fr = FileReader.prototype.readAsArrayBuffer;
      Blob.prototype.arrayBuffer = function () {
        return failing && this instanceof File ? Promise.reject(notReadable()) : ab.call(this);
      };
      Blob.prototype.stream = function () {
        if (!(failing && this instanceof File)) return st.call(this);
        return new ReadableStream({ start: (c) => c.error(new TypeError("network error")) });
      };
      FileReader.prototype.readAsArrayBuffer = function (blob) {
        if (!(failing && blob instanceof File)) return fr.call(this, blob);
        failing = false; // el siguiente intento (otra elección) sí funciona
        Object.defineProperty(this, "error", { value: notReadable() });
        queueMicrotask(() => this.onerror?.(new ProgressEvent("error") as ProgressEvent<FileReader>));
      };
    });

    const group = page.getByRole("group", { name: "Foto principal" });
    await fotoInput(page, 0).setInputFiles(fixture("camara-12mp.jpg"));
    await expect(group.getByRole("alert")).toContainText("El celular no dejó leer esta foto");
    await expect(group.getByRole("alert")).toContainText("pestañas");
    await expect(group.getByText(/Detalle técnico: image\/jpeg, .* NotReadableError/)).toBeVisible();

    const chooser = page.waitForEvent("filechooser");
    await group.getByRole("button", { name: "Elegir de nuevo" }).click();
    await (await chooser).setFiles(fixture("camara-12mp.jpg"));
    await expect(group.getByText(/Foto lista/)).toBeVisible();
    await expect(group.getByRole("alert")).toHaveCount(0);
  });

  test("si se corta la conexión al subir, lo dice y deja intentar de nuevo", async ({ page }) => {
    await page.evaluate(() => (window.__uploadMode = "network"));
    const group = page.getByRole("group", { name: "Foto principal" });
    await fotoInput(page, 0).setInputFiles(fixture("captura.png"));
    await expect(group.getByRole("alert")).toContainText("se cortó la conexión", { timeout: 10_000 });
    await page.evaluate(() => (window.__uploadMode = "ok"));
    const chooser = page.waitForEvent("filechooser");
    await group.getByRole("button", { name: "Elegir de nuevo" }).click();
    await (await chooser).setFiles(fixture("captura.png"));
    await expect(group.getByText(/Foto lista/)).toBeVisible();
  });

  test("si Chrome recarga la página, recupera lo escrito y las fotos subidas", async ({ page }) => {
    await page.getByLabel("Nombre").fill("Torta de chocolate");
    await page.getByLabel("Precio (COP)").fill("30000");
    await fotoInput(page, 0).setInputFiles(fixture("captura.png"));
    await expect(page.getByText(/Foto lista/)).toBeVisible();
    const photoUrl = await page.locator('input[name="image_url"]').inputValue();

    await page.reload();
    await expect(page.getByText("Recuperamos lo que llevabas en este formulario.")).toBeVisible();
    await expect(page.getByLabel("Nombre")).toHaveValue("Torta de chocolate");
    await expect(page.getByLabel("Precio (COP)")).toHaveValue("30000");
    await expect(page.locator('input[name="image_url"]')).toHaveValue(photoUrl);
    await expect(page.getByRole("group", { name: "Foto principal" }).getByRole("img")).toHaveAttribute("src", photoUrl);

    await page.getByRole("button", { name: "Descartar y empezar de nuevo" }).click();
    await expect(page.getByLabel("Nombre")).toHaveValue("");
    await page.reload();
    await expect(page.getByText("Recuperamos lo que llevabas")).toHaveCount(0);
  });

  test("el borrador se borra al enviar el formulario", async ({ page }) => {
    await page.getByLabel("Nombre").fill("Pan");
    await page.getByLabel("Precio (COP)").fill("5000");
    await page.getByRole("button", { name: "Publicar producto" }).click();
    await expect.poll(() => page.evaluate(() => window.__saved?.name)).toBe("Pan");
    await page.reload();
    await expect(page.getByText("Recuperamos lo que llevabas")).toHaveCount(0);
  });

  test("al editar, el borrador es aparte del de un producto nuevo", async ({ page }) => {
    await page.getByLabel("Nombre").fill("Nuevo");
    await page.goto("/?modo=editar");
    await expect(page.getByLabel("Nombre")).toHaveValue("Torta de chocolate");
    await expect(page.getByText("Recuperamos lo que llevabas")).toHaveCount(0);
  });

  test("descuento: cerrado por defecto, se despliega y calcula el precio de oferta", async ({ page }) => {
    const summary = page.locator("summary", { hasText: "Descuento" });
    await expect(page.getByLabel("Porcentaje")).toBeHidden();
    await page.getByLabel("Precio (COP)").fill("30000");
    await summary.click();
    await page.getByLabel("Porcentaje").fill("20");
    await expect(page.getByLabel("Precio de oferta (COP)")).toHaveValue("24000");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Porcentaje")).toBeHidden();
  });

  test("descuento: abierto si el producto ya tiene uno", async ({ page }) => {
    await page.goto("/?modo=editar");
    await expect(page.getByLabel("Precio de oferta (COP)")).toHaveValue("24000");
    await expect(page.getByLabel("Porcentaje")).toHaveValue("20");
  });

  test("axe: sin incumplimientos WCAG 2.2 A/AA en el formulario, también con error de foto", async ({ page }) => {
    // Sin la hoja de estilos de la app, contraste y tamaño de los botones no aplican aquí:
    // los revisa 02-accesibilidad sobre la app real.
    const axe = () =>
      new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .disableRules(["color-contrast", "target-size"])
        .analyze();
    await page.getByRole("button", { name: "Agregar otra foto" }).click();
    await page.locator("summary", { hasText: "Descuento" }).click();
    expect((await axe()).violations).toEqual([]);

    await page.evaluate(() => (window.__uploadMode = "network"));
    await fotoInput(page, 0).setInputFiles(fixture("captura.png"));
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
    expect((await axe()).violations).toEqual([]);
  });
});
