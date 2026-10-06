import path from "node:path";
import { expect, test } from "@playwright/test";
import { login, register, saveState, sql } from "./helpers";

/**
 * Recorrido completo del MVP (criterios de la sección 18 del documento):
 * vendedor se registra y crea su tienda → sube productos → admin aprueba →
 * cliente arma el carrito y pide por WhatsApp → vendedor marca ventas.
 */
const run = Date.now().toString(36);
const seller = `vendedora-${run}@example.test`;
const admin = `admin-${run}@example.test`;
const other = `otro-${run}@example.test`;
const storeName = `Dulces de prueba ${run}`;
const slug = `dulces-de-prueba-${run}`;
let productId = "";
let storeId = "";

test.describe.configure({ mode: "serial" });

test("sin sesión, /panel y /admin redirigen al login", async ({ page }) => {
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/login\?next=%2Fpanel$/);
  await page.goto("/admin/tiendas");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Ftiendas$/);
});

test("el vendedor se registra y crea su tienda en una pantalla", async ({ page }) => {
  await register(page, "Vendedora de prueba", seller);
  await page.getByLabel("Nombre de la tienda").fill(storeName);
  await expect(page.getByLabel("Dirección de tu tienda")).toHaveValue(slug);

  // Número inválido: debe rechazarse en el servidor.
  await page.getByRole("textbox", { name: "Número de WhatsApp" }).fill("12345");
  await page.getByRole("checkbox", { name: /número de WhatsApp se mostrará/ }).check();
  await page.getByRole("button", { name: "Crear mi tienda" }).click();
  await expect(page.getByText(/Número no válido/)).toBeVisible();

  await page.getByRole("textbox", { name: "Número de WhatsApp" }).fill("300 123 4567");
  await page.getByLabel("Ciudad").fill("Bogotá");
  await page.getByLabel("Categoría").selectOption({ label: "Repostería y panadería" });
  await page.getByRole("checkbox", { name: "Hago domicilios" }).check();
  await page.getByRole("checkbox", { name: /número de WhatsApp se mostrará/ }).check();
  await page.getByRole("button", { name: "Crear mi tienda" }).click();
  await expect(page).toHaveURL(/\/panel\/productos\/nuevo\?bienvenida=1/);
  await expect(page.getByText("¡Tu tienda quedó creada!")).toBeVisible();
  await expect(page.getByText("Tu tienda está en revisión.")).toBeVisible();

  const [row] = await sql<{ id: string; whatsapp: string; status: string }>(
    "select id, whatsapp, status from public.stores where slug = $1",
    [slug],
  );
  expect(row).toMatchObject({ whatsapp: "573001234567", status: "pendiente" });
  storeId = row.id;
});

test("crea un producto con 3 fotos comprimidas y descuento", async ({ page }) => {
  await login(page, seller, "/panel/productos/nuevo");
  const files = page.locator('input[type="file"]');
  await expect(files).toHaveCount(3);
  await files.nth(0).setInputFiles(path.resolve(__dirname, ".fixtures/foto-pesada.jpg"));
  await expect(page.getByText(/Foto lista/)).toBeVisible({ timeout: 30_000 });
  const status = await page.getByText(/Foto lista/).textContent();
  const [after, before] = [...status!.matchAll(/(\d+) KB/g)].map((m) => Number(m[1]));
  expect(before).toBeGreaterThan(1000); // la original pesa más de 1 MB
  expect(after).toBeLessThanOrEqual(260); // objetivo ~200 KB
  await files.nth(1).setInputFiles(path.resolve(__dirname, ".fixtures/foto-2.png"));
  await files.nth(2).setInputFiles(path.resolve(__dirname, ".fixtures/foto-3.png"));
  await expect(page.getByText(/Foto lista/)).toHaveCount(3, { timeout: 30_000 });

  await page.getByLabel("Nombre").fill("Torta de chocolate");
  await page.getByLabel("Descripción").fill("Torta húmeda para 10 porciones.");
  await page.getByLabel("Precio (COP)").fill("30000");
  await page.getByLabel("Porcentaje").fill("20");
  await expect(page.getByLabel("Precio de oferta (COP)")).toHaveValue("24000");
  await page.getByLabel("Stock").fill("5");
  await page.getByRole("button", { name: "Publicar producto" }).click();
  await expect(page).toHaveURL(/\/panel\/productos\?guardado=nuevo/);
  await expect(page.getByRole("link", { name: "Editar Torta de chocolate" })).toBeVisible();

  const rows = await sql<{ id: string; sale_price: string; url: string; position: number }>(
    `select p.id, p.sale_price, i.url, i.position from public.products p join public.product_images i on i.product_id = p.id
     where p.store_id = $1 and p.name = 'Torta de chocolate' order by i.position`,
    [storeId],
  );
  expect(rows.map((r) => r.position)).toEqual([0, 1, 2]);
  const p = rows[0];
  expect(p.sale_price).toBe("24000");
  for (const r of rows) expect(r.url).toContain(`/storage/v1/object/public/catalogo/${storeId}/productos/`);
  productId = p.id;

  // Quitar la foto 2 al editar: quedan 2 fotos, en orden y sin huecos.
  await page.goto(`/panel/productos/${productId}`);
  await page.getByRole("button", { name: "Quitar" }).nth(1).click();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page).toHaveURL(/guardado=editado/);
  const after2 = await sql<{ url: string }>(
    `select url from public.product_images where product_id = $1 order by position`,
    [productId],
  );
  expect(after2.map((r) => r.url)).toEqual([rows[0].url, rows[2].url]);
  // Y volver a 3 para el resto de pruebas.
  await page.goto(`/panel/productos/${productId}`);
  await page.locator('input[type="file"]').nth(2).setInputFiles(path.resolve(__dirname, ".fixtures/foto-2.png"));
  await expect(page.getByText(/Foto lista/)).toHaveCount(1, { timeout: 30_000 });
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page).toHaveURL(/guardado=editado/);

  // Segundo producto agotado (sin foto).
  await page.goto("/panel/productos/nuevo");
  await page.getByLabel("Nombre").fill("Brownie");
  await page.getByLabel("Precio (COP)").fill("8000");
  await page.getByLabel("Estado").selectOption("agotado");
  await page.getByRole("button", { name: "Publicar producto" }).click();
  await expect(page).toHaveURL(/guardado=nuevo/);
});

test("la tienda pendiente no es pública; el admin la aprueba", async ({ page, browser }) => {
  const anon = await browser.newContext();
  const res = await (await anon.newPage()).goto(`/${slug}`);
  expect(res?.status()).toBe(404);
  await anon.close();

  // El vendedor no entra a /admin (404, no revela la ruta).
  await login(page, seller, "/panel");
  const adminRes = await page.goto("/admin");
  expect(adminRes?.status()).toBe(404);
  await page.context().clearCookies();

  await register(page, "Admin de prueba", admin);
  await sql(`update public.profiles set role = 'admin' where id = (select id from auth.users where email = $1)`, [
    admin,
  ]);
  await page.goto("/admin/tiendas");
  const card = page.getByRole("listitem").filter({ hasText: storeName });
  await card.getByRole("button", { name: `Aprobar ${storeName}` }).click();
  await expect(card.getByText("Activa")).toBeVisible();
  await page.goto("/admin");
  await expect(page.getByText("Tiendas activas")).toBeVisible();
});

test("el cliente ve la tienda, arma el carrito y pide por WhatsApp", async ({ browser }) => {
  const ctx = await browser.newContext();
  await ctx.route(/wa\.me/, (r) => r.fulfill({ status: 200, body: "whatsapp" }));
  const page = await ctx.newPage();
  await page.goto(`/${slug}?src=instagram`);
  await expect(page.getByRole("heading", { level: 1, name: storeName })).toBeVisible();

  const torta = page.getByRole("listitem").filter({ hasText: "Torta de chocolate" });
  await expect(torta.getByText("-20%")).toBeVisible();
  await expect(torta.getByText("$ 24.000")).toBeVisible();
  const brownie = page.getByRole("listitem").filter({ hasText: "Brownie" });
  await expect(brownie.getByText("Agotado")).toBeVisible();
  await expect(brownie.getByRole("button", { name: /Agregar/ })).toHaveCount(0);

  await torta.getByRole("button", { name: /Agregar/ }).click();
  await torta.getByRole("button", { name: /Agregar/ }).click();
  await expect(page.getByText("2 productos")).toBeVisible();
  await page.getByRole("button", { name: "Ver pedido" }).click();
  const dialog = page.getByRole("dialog", { name: "Tu pedido" });
  await dialog.getByLabel(/Tu nombre/).fill("Ana");
  await dialog.getByRole("radio", { name: "Domicilio" }).check();
  await dialog.getByLabel(/Nota/).fill("Sin nueces");

  const link = dialog.getByRole("link", { name: /Pedir por WhatsApp/ });
  const href = (await link.getAttribute("href"))!;
  expect(href.startsWith("https://wa.me/573001234567?text=")).toBe(true);
  const text = decodeURIComponent(href.split("?text=")[1]);
  expect(text).toContain(`Hola, quiero hacer un pedido en *${storeName}*`);
  expect(text).toContain("• 2 x Torta de chocolate — $ 48.000");
  expect(text).toContain("*Total: $ 48.000*");
  expect(text).toContain("*Nombre:* Ana");
  expect(text).toContain("*Entrega:* Domicilio");
  expect(text).toContain(`Pedido desde http://localhost:3000/${slug}`);

  const popup = ctx.waitForEvent("page");
  await link.click();
  await (await popup).close();
  await expect(dialog.getByText("¿Ya enviaste el mensaje en WhatsApp?")).toBeVisible();

  // El carrito sobrevive a recargar la página (localStorage, por tienda).
  await page.reload();
  await expect(page.getByText("2 productos")).toBeVisible();
  await page.goto(`/${slug}/${productId}`);
  await expect(page.getByRole("heading", { level: 1, name: "Torta de chocolate" })).toBeVisible();

  // Carrusel de 3 fotos: flechas, puntos y deslizar (scroll horizontal).
  const gallery = page.getByRole("region", { name: "Fotos de Torta de chocolate" });
  await expect(gallery.getByRole("img")).toHaveCount(3);
  await expect(gallery.getByRole("button", { name: "Ver foto 1 de 3" })).toHaveAttribute("aria-current", "true");
  await gallery.getByRole("button", { name: "Foto siguiente" }).click();
  await expect(gallery.getByRole("button", { name: "Ver foto 2 de 3" })).toHaveAttribute("aria-current", "true");
  await gallery.getByRole("list").evaluate((el) => el.scrollTo({ left: el.clientWidth * 2 }));
  await expect(gallery.getByRole("button", { name: "Ver foto 3 de 3" })).toHaveAttribute("aria-current", "true");

  await expect
    .poll(async () =>
      sql<{ type: string; source: string; n: number }>(
        `select type, source, count(*)::int as n from public.events where store_id = $1 group by type, source order by type`,
        [storeId],
      ),
    )
    .toEqual([
      { type: "visita_tienda", source: "instagram", n: 1 },
      { type: "visita_producto", source: "instagram", n: 1 },
      { type: "clic_pedir", source: "instagram", n: 1 },
      { type: "producto_en_pedido", source: "instagram", n: 1 },
    ]);
  await ctx.close();
});

test("una visita repetida en 30 minutos no se cuenta y el dueño no cuenta", async ({ page, browser }) => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`/${slug}`);
  await p.reload();
  await p.goto(`/${slug}`);
  await ctx.close();
  await login(page, seller, "/panel");
  await page.goto(`/${slug}`);
  await page.waitForLoadState("networkidle");
  await expect
    .poll(
      async () =>
        (
          await sql<{ n: number }>(
            `select count(*)::int as n from public.events where store_id = $1 and type = 'visita_tienda'`,
            [storeId],
          )
        )[0].n,
    )
    .toBe(2); // el cliente anterior + este visitante nuevo; ni la recarga ni el dueño suman
});

test("el vendedor marca ventas y el stock se descuenta", async ({ page }) => {
  await login(page, seller, "/panel/productos");
  const row = page.getByRole("listitem").filter({ hasText: "Torta de chocolate" });
  await row.getByRole("button", { name: "Marcar vendido" }).click();
  const dialog = page.getByRole("dialog", { name: "Registrar venta" });
  await dialog.getByLabel("Cantidad vendida").fill("2");
  await dialog.getByRole("button", { name: "Registrar venta" }).click();
  await expect(page.getByText("Venta registrada (2).")).toBeVisible();
  await expect(row.getByText("Stock 3")).toBeVisible();

  await row.getByRole("button", { name: "Marcar vendido" }).click();
  await dialog.getByLabel("Cantidad vendida").fill("4");
  await dialog.getByRole("button", { name: "Registrar venta" }).click();
  // El navegador bloquea más unidades que el stock (max); la base también lo rechaza (pruebas de db/api).
  await expect(dialog).toBeVisible();
  expect(
    await dialog.getByLabel("Cantidad vendida").evaluate((el: HTMLInputElement) => el.validity.rangeOverflow),
  ).toBe(true);
  await expect(row.getByText("Stock 3")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/panel/ventas");
  await expect(page.getByRole("cell", { name: "Torta de chocolate" })).toBeVisible();
  await page.goto("/panel");
  const card = page.locator(".ja-kpi").filter({ hasText: "Vendido este mes" });
  await expect(card).toContainText("$ 48.000");
  await expect(page.locator(".ja-kpi").filter({ hasText: "Clics en Pedir" })).toContainText("1");
});

test("cambio rápido de estado desde la lista", async ({ page }) => {
  await login(page, seller, "/panel/productos");
  const row = page.getByRole("listitem").filter({ hasText: "Brownie" });
  await row.getByLabel("Estado de Brownie").selectOption("disponible");
  await expect
    .poll(
      async () =>
        (
          await sql<{ status: string }>(`select status from public.products where store_id = $1 and name = 'Brownie'`, [
            storeId,
          ])
        )[0].status,
    )
    .toBe("disponible");
});

test("otro vendedor no puede abrir ni editar productos ajenos", async ({ page }) => {
  await register(page, "Otro vendedor", other);
  await page.getByLabel("Nombre de la tienda").fill(`Otra tienda ${run}`);
  await page.getByRole("textbox", { name: "Número de WhatsApp" }).fill("3109876543");
  await page.getByRole("checkbox", { name: /número de WhatsApp se mostrará/ }).check();
  await page.getByRole("button", { name: "Crear mi tienda" }).click();
  await expect(page).toHaveURL(/bienvenida=1/);
  const res = await page.goto(`/panel/productos/${productId}`);
  expect(res?.status()).toBe(404);
  saveState({ slug, productId, seller, admin, other });
});
