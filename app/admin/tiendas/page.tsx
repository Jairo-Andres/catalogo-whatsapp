import Link from "next/link";
import { AdminStoreActions } from "@/components/admin/store-actions";
import { STORE_STATUS, StatusBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Tiendas (admin)" };

/** Plan gratis de Supabase: 1 GB de Storage. */
const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;

const mbFormat = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const mb = (bytes: number) => `${mbFormat.format(bytes / 1024 / 1024)} MB`;

export default async function AdminTiendasPage() {
  const supabase = await createClient();
  const [{ data }, usageRes] = await Promise.all([supabase.rpc("admin_stores"), supabase.rpc("admin_store_usage")]);
  const stores = data ?? [];
  // Si la función de uso no está (migración 6 sin aplicar), la página sigue funcionando sin esos datos.
  const usage = new Map((usageRes.data ?? []).map((u) => [u.store_id, u]));
  const usageOk = !usageRes.error;
  if (usageRes.error) {
    // Para diagnosticar en los logs de Vercel (código de Postgres/PostgREST y mensaje).
    console.error("admin_store_usage falló", usageRes.error.code, usageRes.error.message);
  }
  const totalBytes = (usageRes.data ?? []).reduce((n, u) => n + Number(u.storage_bytes), 0);
  const pct = Math.min(100, (totalBytes / STORAGE_LIMIT_BYTES) * 100);
  const pctText = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(pct);

  const rows = stores.map((s) => {
    const u = usage.get(s.id);
    return {
      ...s,
      email: u?.owner_email ?? null,
      photos: u ? Number(u.product_photos) : null,
      files: u ? Number(u.storage_files) : null,
      bytes: u ? Number(u.storage_bytes) : null,
    };
  });

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <p className="ja-label">Administración</p>
        <h1 className="ja-display text-3xl sm:text-4xl">Tiendas</h1>
        <p className="text-fg-muted">Las pendientes aparecen primero. Una tienda solo es pública cuando está activa.</p>
      </div>

      {usageOk ? (
        <section aria-labelledby="espacio-titulo" className="mt-card grid gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="espacio-titulo" className="font-display text-xl font-black">
              Espacio usado en Storage
            </h2>
            <p className="mt-price text-base">
              {mb(totalBytes)} <span className="text-fg-muted">de 1 GB ({pctText} %)</span>
            </p>
          </div>
          <div
            role="meter"
            aria-labelledby="espacio-titulo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Number(pct.toFixed(1))}
            aria-valuetext={`${mb(totalBytes)} de 1 GB, ${pctText} %`}
            className="h-3 overflow-hidden rounded-full bg-surface-2 ring-1 ring-border"
          >
            <div
              className={pct > 80 ? "h-full rounded-full bg-status-bad" : "h-full rounded-full bg-accent"}
              style={{ width: `${Math.max(pct, totalBytes > 0 ? 1 : 0)}%` }}
            />
          </div>
          <p className="text-sm text-fg-muted">
            Plan gratis de Supabase: 1 GB para todas las tiendas. Las fotos se guardan comprimidas (~300 KB cada una).
          </p>
        </section>
      ) : (
        <p role="note" className="rounded-2xl bg-status-warn-bg p-4 text-status-warn">
          No se pudo cargar el uso por tienda (correos, fotos y espacio). Revisa que la migración 6 esté aplicada.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-card text-fg-muted">Aún no hay tiendas.</p>
      ) : (
        <>
          {/* Celular: tarjetas */}
          <ul className="grid gap-3 lg:hidden">
            {rows.map((s) => {
              const st = STORE_STATUS[s.status];
              return (
                <li key={s.id} className="mt-card grid gap-3">
                  <div className="grid gap-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/${s.slug}`}
                        className="font-display text-lg font-black underline-offset-4 hover:underline"
                      >
                        {s.name}
                      </Link>
                      <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                      {s.featured && <span className="ja-tag-example">Destacada</span>}
                    </p>
                    <p className="break-all text-sm">{s.email ?? "Correo no disponible"}</p>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="ja-label">Productos</dt>
                      <dd className="ja-num font-bold">{Number(s.products)}</dd>
                    </div>
                    <div>
                      <dt className="ja-label">Fotos</dt>
                      <dd className="ja-num font-bold">{s.photos ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="ja-label">Archivos</dt>
                      <dd className="ja-num font-bold">{s.files ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="ja-label">Espacio</dt>
                      <dd className="ja-num font-bold">{s.bytes === null ? "—" : mb(s.bytes)}</dd>
                    </div>
                  </dl>
                  <p className="text-sm text-fg-muted">
                    /{s.slug} · {s.city ?? "Sin ciudad"} · {Number(s.visits_30d)} visitas (30 d) · creada{" "}
                    {formatDateTime(s.created_at)}
                  </p>
                  <AdminStoreActions id={s.id} name={s.name} status={s.status} featured={s.featured} />
                </li>
              );
            })}
          </ul>

          {/* Escritorio: tabla */}
          <div className="ja-table-wrap hidden lg:block" role="region" aria-label="Tabla de tiendas" tabIndex={0}>
            <table className="ja-table">
              <caption className="sr-only">
                Tiendas con su vendedor, fotos y espacio usado. Las pendientes aparecen primero.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Tienda</th>
                  <th scope="col">Correo del vendedor</th>
                  <th scope="col" className="is-num">
                    Productos
                  </th>
                  <th scope="col" className="is-num">
                    Fotos
                  </th>
                  <th scope="col" className="is-num">
                    Archivos
                  </th>
                  <th scope="col" className="is-num">
                    Espacio
                  </th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const st = STORE_STATUS[s.status];
                  return (
                    <tr key={s.id}>
                      <th scope="row" className="font-normal">
                        <span className="grid gap-1">
                          <Link href={`/${s.slug}`} className="font-bold underline-offset-4 hover:underline">
                            {s.name}
                          </Link>
                          <span className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                            {s.featured && <span className="ja-tag-example">Destacada</span>}
                          </span>
                          <span className="text-xs text-fg-muted">
                            {Number(s.visits_30d)} visitas (30 d) · {formatDateTime(s.created_at)}
                          </span>
                        </span>
                      </th>
                      <td className="max-w-56 break-all">{s.email ?? "—"}</td>
                      <td className="is-num">{Number(s.products)}</td>
                      <td className="is-num">{s.photos ?? "—"}</td>
                      <td className="is-num">{s.files ?? "—"}</td>
                      <td className="is-num whitespace-nowrap">{s.bytes === null ? "—" : mb(s.bytes)}</td>
                      <td>
                        <AdminStoreActions id={s.id} name={s.name} status={s.status} featured={s.featured} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
