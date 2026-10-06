import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { loadState, login } from "./helpers";

/**
 * axe-core: 0 incumplimientos WCAG 2.2 A/AA en cada página, a 390 y 1280 px,
 * en modo claro y oscuro. Usa los datos que creó 01-flujo.spec.ts.
 */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const VIEWPORTS = [
  { name: "390", width: 390, height: 844 },
  { name: "1280", width: 1280, height: 800 },
] as const;
const SCHEMES = ["light", "dark"] as const;
const SHOTS = path.resolve(__dirname, "../../test-results/capturas");

async function audit(page: Page, label: string) {
  await page.waitForLoadState("networkidle");
  const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = result.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(" "))
        .join(" | ")}`,
  );
  expect(summary, `${label}\n${summary.join("\n")}`).toEqual([]);
  // Sin desplazamiento horizontal en celular.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `${label}: desborde horizontal`).toBeLessThanOrEqual(0);
}

async function ctxFor(browser: Browser, vp: (typeof VIEWPORTS)[number], scheme: (typeof SCHEMES)[number]) {
  return browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    colorScheme: scheme,
    reducedMotion: "reduce",
  });
}

for (const vp of VIEWPORTS) {
  for (const scheme of SCHEMES) {
    test(`páginas públicas · ${vp.name}px · ${scheme}`, async ({ browser }) => {
      const s = loadState();
      const ctx = await ctxFor(browser, vp, scheme);
      const page = await ctx.newPage();
      for (const url of [
        "/",
        "/tiendas",
        `/${s.slug}`,
        `/${s.slug}/${s.productId}`,
        "/login",
        "/registro",
        "/terminos",
        "/privacidad",
        "/no-existe-esta-tienda",
      ]) {
        await page.goto(url);
        await audit(page, `${url} ${vp.name} ${scheme}`);
        if (url === `/${s.slug}` || url === "/") {
          await page.screenshot({
            path: `${SHOTS}/${vp.name}-${scheme}${url === "/" ? "-inicio" : "-tienda"}.png`,
            fullPage: true,
          });
        }
      }
      // Carrito abierto (diálogo)
      await page.goto(`/${s.slug}`);
      await page.getByRole("button", { name: /Agregar Torta/ }).click();
      await page.getByRole("button", { name: "Pedir por WhatsApp" }).click();
      await expect(page.getByRole("dialog", { name: "Tu pedido" })).toBeVisible();
      await audit(page, `carrito ${vp.name} ${scheme}`);
      await page.screenshot({ path: `${SHOTS}/${vp.name}-${scheme}-carrito.png` });
      await ctx.close();
    });

    test(`panel del vendedor · ${vp.name}px · ${scheme}`, async ({ browser }) => {
      const s = loadState();
      const ctx = await ctxFor(browser, vp, scheme);
      const page = await ctx.newPage();
      await login(page, s.seller, "/panel");
      for (const url of [
        "/panel",
        "/panel/productos",
        "/panel/productos/nuevo",
        `/panel/productos/${s.productId}`,
        "/panel/tienda",
        "/panel/ventas",
        "/panel/estadisticas",
      ]) {
        await page.goto(url);
        await audit(page, `${url} ${vp.name} ${scheme}`);
        if (url === "/panel" || url === "/panel/productos") {
          await page.screenshot({
            path: `${SHOTS}/${vp.name}-${scheme}${url.replace(/\//g, "-")}.png`,
            fullPage: true,
          });
        }
      }
      await page.goto("/panel/productos");
      await page
        .getByRole("listitem")
        .filter({ hasText: "Torta de chocolate" })
        .getByRole("button", { name: "Marcar vendido" })
        .click();
      await audit(page, `diálogo de venta ${vp.name} ${scheme}`);
      await ctx.close();
    });

    test(`panel de administración · ${vp.name}px · ${scheme}`, async ({ browser }) => {
      const s = loadState();
      const ctx = await ctxFor(browser, vp, scheme);
      const page = await ctx.newPage();
      await login(page, s.admin, "/admin");
      for (const url of ["/admin", "/admin/tiendas"]) {
        await page.goto(url);
        await audit(page, `${url} ${vp.name} ${scheme}`);
      }
      await page.screenshot({ path: `${SHOTS}/${vp.name}-${scheme}-admin-tiendas.png`, fullPage: true });
      await ctx.close();
    });
  }
}
