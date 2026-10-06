import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Client } from "pg";
import { as, errorAs, resetDatabase } from "./helpers";

/**
 * Pruebas de seguridad de la base de datos (sección 18 del documento):
 * dos vendedores (A y B), un admin y un visitante anónimo.
 */
let db: Client;
const ids = {
  userA: "00000000-0000-4000-8000-00000000000a",
  userB: "00000000-0000-4000-8000-00000000000b",
  admin: "00000000-0000-4000-8000-0000000000ad",
  storeA: "",
  storeB: "",
  stockProduct: "",
  uniqueProduct: "",
  freeProduct: "",
  productB: "",
};
const A = () => ({ role: "authenticated" as const, uid: ids.userA });
const B = () => ({ role: "authenticated" as const, uid: ids.userB });
const ADMIN = () => ({ role: "authenticated" as const, uid: ids.admin });
const ANON = { role: "anon" as const };
const VISITOR = "visitante_prueba_01";

beforeAll(async () => {
  db = await resetDatabase();
  // Registro de usuarios (lo que hace Supabase Auth). El rol del metadata debe ignorarse.
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
       ($1, 'a@example.test', '{"full_name":"Vendedora A","role":"admin"}'),
       ($2, 'b@example.test', '{"full_name":"Vendedor B"}'),
       ($3, 'admin@example.test', '{}')`,
    [ids.userA, ids.userB, ids.admin],
  );
  // Primer admin: igual que el SQL manual del documento (como superusuario).
  await db.query(`update public.profiles set role = 'admin' where id = $1`, [ids.admin]);

  // Cada vendedor crea su tienda a través de la RLS (queda pendiente).
  ids.storeA = await as(
    db,
    A(),
    async () =>
      (
        await db.query(
          `insert into public.stores (owner_id, slug, name, whatsapp, city)
           values ($1, 'dulces-a', 'Dulces A', '573001234567', 'Bogotá') returning id`,
          [ids.userA],
        )
      ).rows[0].id,
    { commit: true },
  );
  ids.storeB = await as(
    db,
    B(),
    async () =>
      (
        await db.query(
          `insert into public.stores (owner_id, slug, name, whatsapp)
           values ($1, 'tienda-b', 'Tienda B', '573109876543') returning id`,
          [ids.userB],
        )
      ).rows[0].id,
    { commit: true },
  );
  // El admin aprueba solo la tienda A.
  await as(db, ADMIN(), () => db.query(`update public.stores set status = 'activa' where id = $1`, [ids.storeA]), {
    commit: true,
  });

  const insertProduct = (actor: ReturnType<typeof A>, store: string, values: string) =>
    as(
      db,
      actor,
      async () =>
        (
          await db.query(
            `insert into public.products (store_id, ${values.split("|")[0]}) values ($1, ${values.split("|")[1]}) returning id`,
            [store],
          )
        ).rows[0].id as string,
      { commit: true },
    );
  ids.stockProduct = await insertProduct(A(), ids.storeA, "name, price, sale_price, stock|'Torta', 10000, 8000, 5");
  ids.uniqueProduct = await insertProduct(A(), ids.storeA, "name, price, is_unique|'Ruana tejida', 90000, true");
  ids.freeProduct = await insertProduct(A(), ids.storeA, "name, price|'Brownie', 4000");
  ids.productB = await insertProduct(B(), ids.storeB, "name, price|'Producto B', 5000");
});

afterAll(async () => {
  await db?.end();
});

describe("perfiles", () => {
  it("se crea el perfil al registrarse, siempre como vendedor", async () => {
    const { rows } = await db.query(`select role, full_name from public.profiles where id = $1`, [ids.userA]);
    expect(rows[0]).toEqual({ role: "vendedor", full_name: "Vendedora A" });
  });

  it("un vendedor no puede volverse admin", async () => {
    const err = await errorAs(db, A(), `update public.profiles set role = 'admin' where id = $1`, [ids.userA]);
    expect(err?.code).toBe("42501");
  });

  it("un vendedor puede cambiar su nombre", async () => {
    const n = await as(
      db,
      A(),
      async () => (await db.query(`update public.profiles set full_name = 'Ana' where id = $1`, [ids.userA])).rowCount,
    );
    expect(n).toBe(1);
  });

  it("un vendedor no ve el perfil de otro y anon no ve perfiles", async () => {
    const rows = await as(db, A(), async () => (await db.query(`select id from public.profiles`)).rows);
    expect(rows.map((r) => r.id)).toEqual([ids.userA]);
    const err = await errorAs(db, ANON, `select * from public.profiles`);
    expect(err?.code).toBe("42501");
  });
});

describe("tiendas", () => {
  it("anon solo ve tiendas activas", async () => {
    const rows = await as(db, ANON, async () => (await db.query(`select slug from public.stores order by slug`)).rows);
    expect(rows.map((r) => r.slug)).toEqual(["dulces-a"]);
  });

  it("la tienda pendiente la ven su dueño y el admin, no otro vendedor", async () => {
    const see = async (actor: ReturnType<typeof A>) =>
      as(db, actor, async () => (await db.query(`select 1 from public.stores where id = $1`, [ids.storeB])).rowCount);
    expect(await see(B())).toBe(1);
    expect(await see(ADMIN())).toBe(1);
    expect(await see(A())).toBe(0);
  });

  it("un vendedor no puede editar la tienda de otro", async () => {
    const n = await as(
      db,
      A(),
      async () => (await db.query(`update public.stores set name = 'Hackeada' where id = $1`, [ids.storeB])).rowCount,
    );
    expect(n).toBe(0);
  });

  it("un vendedor no puede activarse, destacarse ni pasar la tienda a otro", async () => {
    for (const set of [`status = 'activa'`, `featured = true`, `owner_id = '${ids.userA}'`]) {
      const err = await errorAs(db, B(), `update public.stores set ${set} where id = $1`, [ids.storeB]);
      expect(err, set).not.toBeNull();
    }
  });

  it("no se puede crear una tienda ya activa, ni una segunda tienda, ni a nombre de otro", async () => {
    await db.query(
      `insert into auth.users (id, email) values ('00000000-0000-4000-8000-00000000000c', 'c@example.test')`,
    );
    const C = { role: "authenticated" as const, uid: "00000000-0000-4000-8000-00000000000c" };
    const activa = await errorAs(
      db,
      C,
      `insert into public.stores (owner_id, slug, name, whatsapp, status) values ($1, 'tienda-c', 'C', '573001112233', 'activa')`,
      [C.uid],
    );
    expect(activa?.code).toBe("42501");
    const segunda = await errorAs(
      db,
      A(),
      `insert into public.stores (owner_id, slug, name, whatsapp) values ($1, 'otra-a', 'Otra', '573001112233')`,
      [ids.userA],
    );
    expect(segunda?.code).toBe("23505");
    const ajena = await errorAs(
      db,
      C,
      `insert into public.stores (owner_id, slug, name, whatsapp) values ($1, 'tienda-c', 'C', '573001112233')`,
      [ids.userB],
    );
    expect(ajena?.code).toBe("42501");
    await db.query(`delete from auth.users where id = $1`, [C.uid]);
  });

  it("rechaza slugs reservados y WhatsApp inválidos", async () => {
    const slug = await errorAs(db, A(), `update public.stores set slug = 'admin' where id = $1`, [ids.storeA]);
    expect(slug?.code).toBe("23514");
    const wa = await errorAs(db, A(), `update public.stores set whatsapp = '+57 300' where id = $1`, [ids.storeA]);
    expect(wa?.code).toBe("23514");
  });

  it("solo el admin elimina tiendas", async () => {
    const n = await as(
      db,
      A(),
      async () => (await db.query(`delete from public.stores where id = $1`, [ids.storeA])).rowCount,
    );
    expect(n).toBe(0);
    const nAdmin = await as(
      db,
      ADMIN(),
      async () => (await db.query(`delete from public.stores where id = $1`, [ids.storeB])).rowCount,
    ); // se revierte al terminar
    expect(nAdmin).toBe(1);
  });
});

describe("productos", () => {
  it("anon ve los productos de tiendas activas y no los de pendientes", async () => {
    const rows = await as(db, ANON, async () => (await db.query(`select store_id from public.products`)).rows);
    expect(rows.length).toBe(3);
    expect(rows.every((r) => r.store_id === ids.storeA)).toBe(true);
  });

  it("anon no puede crear, editar ni borrar productos", async () => {
    expect(
      (await errorAs(db, ANON, `insert into public.products (store_id, name, price) values ($1, 'x', 1)`, [ids.storeA]))
        ?.code,
    ).toBe("42501");
    expect((await errorAs(db, ANON, `update public.products set price = 1`))?.code).toBe("42501");
    expect((await errorAs(db, ANON, `delete from public.products`))?.code).toBe("42501");
  });

  it("un vendedor no puede crear productos en la tienda de otro", async () => {
    const err = await errorAs(
      db,
      B(),
      `insert into public.products (store_id, name, price) values ($1, 'Intruso', 1)`,
      [ids.storeA],
    );
    expect(err?.code).toBe("42501");
  });

  it("un vendedor no puede editar ni borrar productos de otro", async () => {
    const upd = await as(
      db,
      B(),
      async () => (await db.query(`update public.products set price = 1 where id = $1`, [ids.stockProduct])).rowCount,
    );
    expect(upd).toBe(0);
    const del = await as(
      db,
      B(),
      async () => (await db.query(`delete from public.products where id = $1`, [ids.stockProduct])).rowCount,
    );
    expect(del).toBe(0);
  });

  it("un vendedor no puede mover su producto a la tienda de otro", async () => {
    const err = await errorAs(db, A(), `update public.products set store_id = $1 where id = $2`, [
      ids.storeB,
      ids.stockProduct,
    ]);
    expect(err?.code).toBe("42501");
  });

  it("el precio de oferta debe ser menor que el precio", async () => {
    const err = await errorAs(db, A(), `update public.products set sale_price = 20000 where id = $1`, [
      ids.stockProduct,
    ]);
    expect(err?.code).toBe("23514");
  });

  it("imágenes: solo el dueño las agrega", async () => {
    const ok = await as(
      db,
      A(),
      async () =>
        (
          await db.query(`insert into public.product_images (product_id, url) values ($1, 'https://x/a.webp')`, [
            ids.stockProduct,
          ])
        ).rowCount,
    );
    expect(ok).toBe(1);
    const err = await errorAs(
      db,
      B(),
      `insert into public.product_images (product_id, url) values ($1, 'https://x/b.webp')`,
      [ids.stockProduct],
    );
    expect(err?.code).toBe("42501");
  });

  it("imágenes: máximo 3 por producto (posiciones 0, 1 y 2 sin repetir)", async () => {
    const insert = (position: number) =>
      `insert into public.product_images (product_id, url, position) values ($1, 'https://x/${position}.webp', ${position})`;
    const ok = await as(db, A(), async () => {
      await db.query(`delete from public.product_images where product_id = $1`, [ids.stockProduct]);
      let n = 0;
      for (const pos of [0, 1, 2]) n += (await db.query(insert(pos), [ids.stockProduct])).rowCount ?? 0;
      return n;
    });
    expect(ok).toBe(3);
    const fourth = await errorAs(db, A(), insert(3), [ids.stockProduct]);
    expect(fourth?.code).toBe("23514");
    const repeated = await as(db, A(), async () => {
      await db.query(insert(0), [ids.stockProduct]);
      try {
        await db.query(insert(0), [ids.stockProduct]);
        return null;
      } catch (e) {
        return (e as { code?: string }).code;
      }
    });
    expect(repeated).toBe("23505");
  });
});

describe("eventos (track_event)", () => {
  const track = (actor: Parameters<typeof as>[1], args: unknown[]) =>
    as(db, actor, () => db.query(`select public.track_event($1, $2, $3, $4, $5)`, args), { commit: true });
  const count = async (where = "true", params: unknown[] = []) =>
    Number((await db.query(`select count(*) from public.events where ${where}`, params)).rows[0].count);

  it("anon no puede insertar eventos directamente ni leerlos", async () => {
    expect(
      (
        await errorAs(
          db,
          ANON,
          `insert into public.events (store_id, type, visitor_id) values ($1, 'clic_pedir', 'abcdefgh')`,
          [ids.storeA],
        )
      )?.code,
    ).toBe("42501");
    expect((await errorAs(db, ANON, `select * from public.events`))?.code).toBe("42501");
  });

  it("registra una visita y no la duplica en 30 minutos", async () => {
    await track(ANON, [ids.storeA, "visita_tienda", VISITOR, null, "whatsapp"]);
    await track(ANON, [ids.storeA, "visita_tienda", VISITOR, null, "whatsapp"]);
    expect(await count(`store_id = $1 and type = 'visita_tienda'`, [ids.storeA])).toBe(1);
    expect((await db.query(`select source from public.events limit 1`)).rows[0].source).toBe("whatsapp");
  });

  it("los clics en Pedir sí se cuentan cada vez", async () => {
    await track(ANON, [ids.storeA, "clic_pedir", VISITOR, null, "directo"]);
    await track(ANON, [ids.storeA, "clic_pedir", VISITOR, null, "directo"]);
    expect(await count(`type = 'clic_pedir'`)).toBe(2);
  });

  it("no cuenta al dueño de la tienda", async () => {
    await track(A(), [ids.storeA, "visita_tienda", "visitante_duenna_01", null, "directo"]);
    expect(await count(`visitor_id = 'visitante_duenna_01'`)).toBe(0);
  });

  it("ignora tiendas pendientes, productos de otra tienda, visitantes inválidos y fuentes raras", async () => {
    await track(ANON, [ids.storeB, "visita_tienda", "visitante_prueba_02", null, "directo"]);
    await track(ANON, [ids.storeA, "visita_producto", "visitante_prueba_02", ids.productB, "directo"]);
    await track(ANON, [ids.storeA, "visita_producto", "visitante_prueba_02", null, "directo"]);
    await track(ANON, [ids.storeA, "visita_tienda", "corto", null, "directo"]);
    await track(ANON, [ids.storeA, "visita_tienda", "con espacios y ;--", null, "directo"]);
    expect(await count(`visitor_id in ('visitante_prueba_02', 'corto')`)).toBe(0);
    await track(ANON, [ids.storeA, "visita_tienda", "visitante_prueba_03", null, "<script>"]);
    expect(
      (await db.query(`select source from public.events where visitor_id = 'visitante_prueba_03'`)).rows[0].source,
    ).toBe("directo");
  });

  it("tope de 120 eventos por visitante cada 10 minutos", async () => {
    for (let i = 0; i < 125; i++) await track(ANON, [ids.storeA, "clic_pedir", "visitante_bot_000", null, "directo"]);
    expect(await count(`visitor_id = 'visitante_bot_000'`)).toBe(120);
  });

  it("un vendedor no lee los eventos de otro; el admin sí", async () => {
    const b = await as(
      db,
      B(),
      async () =>
        (await db.query(`select count(*) from public.events where store_id = $1`, [ids.storeA])).rows[0].count,
    );
    expect(Number(b)).toBe(0);
    const adm = await as(
      db,
      ADMIN(),
      async () =>
        (await db.query(`select count(*) from public.events where store_id = $1`, [ids.storeA])).rows[0].count,
    );
    expect(Number(adm)).toBeGreaterThan(0);
  });

  it("stats_by_day devuelve un día por fila y ceros para tiendas ajenas", async () => {
    const own = await as(
      db,
      A(),
      async () => (await db.query(`select * from public.stats_by_day($1, 7)`, [ids.storeA])).rows,
    );
    expect(own).toHaveLength(7);
    expect(Number(own[6].visitors)).toBe(2); // visitante_prueba_01 y _03
    const other = await as(
      db,
      B(),
      async () => (await db.query(`select * from public.stats_by_day($1, 7)`, [ids.storeA])).rows,
    );
    expect(other.every((r) => Number(r.visitors) === 0 && Number(r.order_clicks) === 0)).toBe(true);
    expect((await errorAs(db, ANON, `select * from public.stats_by_day($1, 7)`, [ids.storeA]))?.code).toBe("42501");
  });
});

describe("ventas (mark_product_sold)", () => {
  const sold = (actor: Parameters<typeof as>[1], product: string, qty: number) =>
    as(db, actor, () => db.query(`select public.mark_product_sold($1, $2)`, [product, qty]), { commit: true });
  const product = async (id: string) =>
    (await db.query(`select stock, status from public.products where id = $1`, [id])).rows[0];

  it("guarda el precio de oferta vigente y descuenta stock", async () => {
    await sold(A(), ids.stockProduct, 2);
    const sale = (
      await db.query(`select product_name, quantity, unit_price from public.sales where product_id = $1`, [
        ids.stockProduct,
      ])
    ).rows[0];
    expect(sale).toEqual({ product_name: "Torta", quantity: 2, unit_price: "8000" });
    expect(await product(ids.stockProduct)).toEqual({ stock: 3, status: "disponible" });
  });

  it("rechaza vender más que el stock", async () => {
    await expect(sold(A(), ids.stockProduct, 4)).rejects.toThrow(/supera el stock/);
    expect((await product(ids.stockProduct)).stock).toBe(3);
  });

  it("pasa a agotado cuando el stock llega a 0", async () => {
    await sold(A(), ids.stockProduct, 3);
    expect(await product(ids.stockProduct)).toEqual({ stock: 0, status: "agotado" });
  });

  it("un producto único pasa a vendido y no se vende dos veces", async () => {
    await sold(A(), ids.uniqueProduct, 1);
    expect((await product(ids.uniqueProduct)).status).toBe("vendido");
    await expect(sold(A(), ids.uniqueProduct, 1)).rejects.toThrow(/ya está vendido/);
  });

  it("sin control de stock solo registra la venta", async () => {
    await sold(A(), ids.freeProduct, 7);
    expect(await product(ids.freeProduct)).toEqual({ stock: null, status: "disponible" });
  });

  it("otro vendedor (ni el admin) puede marcar ventas en mi tienda", async () => {
    await expect(sold(B(), ids.freeProduct, 1)).rejects.toThrow();
    await expect(sold(ADMIN(), ids.freeProduct, 1)).rejects.toThrow(/No autorizado/);
    const err = await errorAs(
      db,
      B(),
      `insert into public.sales (store_id, product_name, quantity, unit_price) values ($1, 'falsa', 1, 1)`,
      [ids.storeA],
    );
    expect(err?.code).toBe("42501");
  });

  it("un vendedor no lee las ventas de otro", async () => {
    const n = await as(
      db,
      B(),
      async () => (await db.query(`select 1 from public.sales where store_id = $1`, [ids.storeA])).rowCount,
    );
    expect(n).toBe(0);
  });

  it("resumen y ventas por mes cuadran con las ventas registradas", async () => {
    const summary = await as(
      db,
      A(),
      async () => (await db.query(`select public.store_summary($1) as s`, [ids.storeA])).rows[0].s,
    );
    // 2 + 3 tortas a 8.000, 1 ruana a 90.000, 7 brownies a 4.000
    expect(Number(summary.unidades_vendidas_30d)).toBe(13);
    expect(Number(summary.total_vendido_30d)).toBe(5 * 8000 + 90000 + 7 * 4000);
    const months = await as(
      db,
      A(),
      async () => (await db.query(`select * from public.stats_sales_by_month($1)`, [ids.storeA])).rows,
    );
    expect(Number(months.at(-1).revenue)).toBe(5 * 8000 + 90000 + 7 * 4000);
  });
});

describe("administración", () => {
  it("admin_overview: admin sí, vendedor no, anon sin permiso", async () => {
    const o = await as(db, ADMIN(), async () => (await db.query(`select public.admin_overview() as o`)).rows[0].o);
    expect(o).toMatchObject({ vendedores: 2, tiendas_activas: 1, tiendas_pendientes: 1, productos: 4 });
    await expect(as(db, A(), () => db.query(`select public.admin_overview()`))).rejects.toThrow(/No autorizado/);
    expect((await errorAs(db, ANON, `select public.admin_overview()`))?.code).toBe("42501");
  });

  it("admin_stores lista todas las tiendas solo para el admin", async () => {
    const rows = await as(
      db,
      ADMIN(),
      async () => (await db.query(`select slug, status from public.admin_stores()`)).rows,
    );
    expect(rows[0]).toEqual({ slug: "tienda-b", status: "pendiente" });
    await expect(as(db, B(), () => db.query(`select public.admin_stores()`))).rejects.toThrow(/No autorizado/);
  });

  it("el admin puede suspender y destacar", async () => {
    const n = await as(
      db,
      ADMIN(),
      async () =>
        (await db.query(`update public.stores set status = 'suspendida', featured = true where id = $1`, [ids.storeA]))
          .rowCount,
    );
    expect(n).toBe(1);
  });

  it("los reportes no se pueden crear desde la web en el MVP", async () => {
    const err = await errorAs(db, ANON, `insert into public.reports (store_id, reason) values ($1, 'spam')`, [
      ids.storeA,
    ]);
    expect(err?.code).toBe("42501");
  });
});

describe("storage (bucket catalogo)", () => {
  const upload = (actor: Parameters<typeof as>[1], name: string) =>
    errorAs(db, actor, `insert into storage.objects (bucket_id, name, owner) values ('catalogo', $1, null)`, [name]);

  it("el bucket limita tamaño y tipos", async () => {
    const b = (
      await db.query(`select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'catalogo'`)
    ).rows[0];
    expect(b).toEqual({
      public: true,
      file_size_limit: "2097152",
      allowed_mime_types: ["image/webp", "image/jpeg", "image/png"],
    });
  });

  it("el vendedor sube solo en la carpeta de su tienda", async () => {
    expect(await upload(A(), `${ids.storeA}/productos/torta.webp`)).toBeNull();
    expect((await upload(A(), `${ids.storeB}/productos/torta.webp`))?.code).toBe("42501");
    expect((await upload(A(), `torta.webp`))?.code).toBe("42501");
    expect((await upload(ANON, `${ids.storeA}/productos/x.webp`))?.code).toBe("42501");
  });

  it("nadie puede listar los archivos de otra tienda", async () => {
    await as(
      db,
      B(),
      () =>
        db.query(`insert into storage.objects (bucket_id, name) values ('catalogo', $1)`, [
          `${ids.storeB}/marca/logo.webp`,
        ]),
      {
        commit: true,
      },
    );
    const seenByA = await as(db, A(), async () => (await db.query(`select name from storage.objects`)).rowCount);
    const seenByAnon = await as(db, ANON, async () => (await db.query(`select name from storage.objects`)).rowCount);
    expect(seenByA).toBe(0);
    expect(seenByAnon).toBe(0);
    const seenByAdmin = await as(
      db,
      ADMIN(),
      async () => (await db.query(`select name from storage.objects`)).rowCount,
    );
    expect(seenByAdmin).toBe(1);
  });
});
