import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

/**
 * Dos modos:
 *  - TEST_DB_MODE=shim (por defecto): Postgres simple (local o CI). Se recrea la base
 *    "catalogo_test" con supabase-shim.sql + migraciones. TEST_DATABASE_URL = servidor.
 *  - TEST_DB_MODE=supabase: Supabase local (`supabase start` + `supabase db reset`).
 *    TEST_DATABASE_URL = postgresql://postgres:postgres@127.0.0.1:54322/postgres
 */
const SERVER_URL = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";
const DB_NAME = "catalogo_test";

function urlFor(db: string) {
  const u = new URL(SERVER_URL);
  u.pathname = `/${db}`;
  return u.toString();
}

export async function resetDatabase() {
  if (process.env.TEST_DB_MODE === "supabase") {
    const db = new Client({ connectionString: SERVER_URL });
    await db.connect();
    const { rows } = await db.query("select count(*)::int as n from public.stores");
    if (rows[0].n > 0) throw new Error("La base no está vacía: corre `npx supabase db reset` antes.");
    return db;
  }
  const admin = new Client({ connectionString: SERVER_URL });
  await admin.connect();
  await admin.query(`drop database if exists ${DB_NAME} with (force)`);
  await admin.query(`create database ${DB_NAME}`);
  await admin.end();

  const db = new Client({ connectionString: urlFor(DB_NAME) });
  await db.connect();
  const root = path.resolve(__dirname, "../..");
  await db.query(readFileSync(path.join(root, "tests/db/supabase-shim.sql"), "utf8"));
  const migrations = readdirSync(path.join(root, "supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of migrations) {
    await db.query(readFileSync(path.join(root, "supabase/migrations", f), "utf8"));
  }
  return db;
}

export type Actor = { role: "anon" } | { role: "authenticated"; uid: string };

/**
 * Ejecuta fn como si fuera una petición de la Data API de Supabase con ese rol/JWT.
 * Todo corre en una transacción que se revierte al final, salvo commit = true.
 */
export async function as<T>(
  db: Client,
  actor: Actor,
  fn: () => Promise<T>,
  opts: { commit?: boolean } = {},
): Promise<T> {
  await db.query("begin");
  try {
    const claims = actor.role === "anon" ? { role: "anon" } : { role: "authenticated", sub: actor.uid };
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await db.query(`set local role ${actor.role}`);
    const out = await fn();
    await db.query(opts.commit ? "commit" : "rollback");
    return out;
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

/** Igual que `as`, pero devuelve el error de Postgres (o null si no falló). */
export async function errorAs(db: Client, actor: Actor, sql: string, params: unknown[] = []) {
  try {
    await as(db, actor, () => db.query(sql, params));
    return null;
  } catch (e) {
    return e as Error & { code?: string };
  }
}
