import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";
import { Client } from "pg";

export const DB_URL = process.env.SUPABASE_TEST_DB ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
export const PASSWORD = "Clave-segura-123";
const STATE = path.resolve(__dirname, ".fixtures/estado.json");

export type E2EState = { slug: string; productId: string; seller: string; admin: string; other: string };
export const saveState = (s: E2EState) => writeFileSync(STATE, JSON.stringify(s));
export const loadState = (): E2EState => JSON.parse(readFileSync(STATE, "utf8"));

export async function sql<T = Record<string, unknown>>(query: string, params: unknown[] = []): Promise<T[]> {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  try {
    return (await c.query(query, params)).rows as T[];
  } finally {
    await c.end();
  }
}

export async function register(page: Page, name: string, email: string) {
  await page.goto("/registro");
  await page.getByLabel("Tu nombre").fill(name);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("checkbox", { name: /Autorizo el tratamiento/ }).check();
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page).toHaveURL(/\/panel\/tienda/);
}

export async function login(page: Page, email: string, next = "/panel") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/\//g, "\\/")));
}
