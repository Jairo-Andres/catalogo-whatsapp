import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Client } from "pg";
import type { Database } from "@/lib/database.types";

/**
 * Pruebas de seguridad a través de la API HTTP real de Supabase (Auth + PostgREST + Storage),
 * como lo haría alguien desde el navegador con la publishable key.
 * Requiere `npx supabase start` y una base recién reiniciada (`npx supabase db reset`).
 */
const URL_ = process.env.SUPABASE_TEST_URL ?? "http://127.0.0.1:54321";
const KEY = process.env.SUPABASE_TEST_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const DB = process.env.SUPABASE_TEST_DB ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const run = Date.now().toString(36);

type Sb = SupabaseClient<Database>;
const client = (): Sb => createClient<Database>(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

let a: Sb, b: Sb, anon: Sb, pg: Client;
let storeA = "", storeB = "", productA = "";

async function signUp(email: string) {
  const c = client();
  const { error } = await c.auth.signUp({ email, password: "Clave-segura-123", options: { data: { full_name: email } } });
  if (error) throw error;
  return c;
}

beforeAll(async () => {
  pg = new Client({ connectionString: DB });
  await pg.connect();
  a = await signUp(`a-${run}@example.test`);
  b = await signUp(`b-${run}@example.test`);
  anon = client();
  const ua = (await a.auth.getUser()).data.user!.id;
  const ub = (await b.auth.getUser()).data.user!.id;
  storeA = (await a.from("stores").insert({ owner_id: ua, slug: `api-a-${run}`, name: "API A", whatsapp: "573001234567" }).select("id").single()).data!.id;
  storeB = (await b.from("stores").insert({ owner_id: ub, slug: `api-b-${run}`, name: "API B", whatsapp: "573001234568" }).select("id").single()).data!.id;
  await pg.query(`update public.stores set status = 'activa' where id = $1`, [storeA]); // aprobación del admin
  productA = (await a.from("products").insert({ store_id: storeA, name: "Producto A", price: 10000, stock: 2 }).select("id").single()).data!.id;
});

afterAll(async () => {
  await pg?.end();
});

describe("API: aislamiento entre vendedores", () => {
  it("B no puede leer, editar ni borrar productos de A", async () => {
    // A está activa: B puede LEER el catálogo público, pero no modificarlo.
    const upd = await b.from("products").update({ price: 1 }).eq("id", productA).select();
    expect(upd.data).toEqual([]);
    const del = await b.from("products").delete().eq("id", productA).select();
    expect(del.data).toEqual([]);
    const { data } = await anon.from("products").select("price").eq("id", productA).single();
    expect(Number(data!.price)).toBe(10000);
  });

  it("B no ve la tienda pendiente de nadie más ni sus ventas o eventos", async () => {
    const pending = await a.from("stores").select("id").eq("id", storeB);
    expect(pending.data).toEqual([]);
    await a.rpc("mark_product_sold", { p_product_id: productA, p_quantity: 1 });
    expect((await b.from("sales").select("id").eq("store_id", storeA)).data).toEqual([]);
    expect((await b.from("events").select("id").eq("store_id", storeA)).data).toEqual([]);
  });

  it("nadie puede volverse admin desde el navegador", async () => {
    const uid = (await b.auth.getUser()).data.user!.id;
    const { error } = await b.from("profiles").update({ role: "admin" }).eq("id", uid);
    expect(error?.message).toMatch(/No puedes cambiar el rol/);
    const { error: rpcErr } = await b.rpc("admin_overview");
    expect(rpcErr?.message).toMatch(/No autorizado/);
  });

  it("un vendedor no puede activar su propia tienda", async () => {
    const { error } = await b.from("stores").update({ status: "activa" }).eq("id", storeB);
    expect(error?.message).toMatch(/Solo un administrador/);
  });

  it("anon no puede escribir en ninguna tabla", async () => {
    expect((await anon.from("stores").insert({ owner_id: crypto.randomUUID(), slug: `x-${run}`, name: "X", whatsapp: "573001234567" })).error).not.toBeNull();
    expect((await anon.from("products").update({ price: 1 }).eq("id", productA)).error).not.toBeNull();
    expect((await anon.from("sales").select("id")).error).not.toBeNull();
    expect((await anon.from("profiles").select("id")).error).not.toBeNull();
  });
});

describe("API: Storage", () => {
  const png = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: "image/png" });

  it("cada vendedor sube solo en la carpeta de su tienda", async () => {
    expect((await a.storage.from("catalogo").upload(`${storeA}/productos/${run}.png`, png)).error).toBeNull();
    expect((await a.storage.from("catalogo").upload(`${storeB}/productos/${run}.png`, png)).error).not.toBeNull();
    expect((await anon.storage.from("catalogo").upload(`${storeA}/productos/anon-${run}.png`, png)).error).not.toBeNull();
  });

  it("rechaza archivos que no son imagen", async () => {
    const html = new Blob(["<script>alert(1)</script>"], { type: "text/html" });
    expect((await a.storage.from("catalogo").upload(`${storeA}/productos/${run}.html`, html)).error).not.toBeNull();
  });

  it("las fotos se ven por URL pública, pero anon no puede listar el bucket", async () => {
    const pub = a.storage.from("catalogo").getPublicUrl(`${storeA}/productos/${run}.png`).data.publicUrl;
    expect((await fetch(pub)).status).toBe(200);
    const list = await anon.storage.from("catalogo").list(`${storeA}/productos`);
    expect(list.data ?? []).toEqual([]);
    const listB = await b.storage.from("catalogo").list(`${storeA}/productos`);
    expect(listB.data ?? []).toEqual([]);
  });

  it("B no puede borrar las fotos de A", async () => {
    await b.storage.from("catalogo").remove([`${storeA}/productos/${run}.png`]);
    const pub = a.storage.from("catalogo").getPublicUrl(`${storeA}/productos/${run}.png`).data.publicUrl;
    expect((await fetch(pub)).status).toBe(200);
  });
});

describe("API: analítica", () => {
  it("track_event funciona con la publishable key y no acepta inserciones directas", async () => {
    const visitor = `api${run}visitor`;
    expect((await anon.rpc("track_event", { p_store_id: storeA, p_type: "visita_tienda", p_visitor_id: visitor })).error).toBeNull();
    expect((await anon.rpc("track_event", { p_store_id: storeA, p_type: "visita_tienda", p_visitor_id: visitor })).error).toBeNull();
    const { rows } = await pg.query(`select count(*)::int as n from public.events where visitor_id = $1`, [visitor]);
    expect(rows[0].n).toBe(1);
    expect((await anon.from("events").insert({ store_id: storeA, type: "clic_pedir", visitor_id: visitor })).error).not.toBeNull();
  });
});
