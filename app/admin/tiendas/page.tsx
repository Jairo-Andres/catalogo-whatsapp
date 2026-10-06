import Link from "next/link";
import { AdminStoreActions } from "@/components/admin/store-actions";
import { STORE_STATUS, StatusBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Tiendas (admin)" };

export default async function AdminTiendasPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_stores");
  const stores = data ?? [];
  return (
    <div className="grid gap-6">
      <h1 className="ja-display text-3xl">Tiendas</h1>
      <p className="text-fg-muted">Las pendientes aparecen primero. Una tienda solo es pública cuando está activa.</p>
      {stores.length === 0 ? (
        <p className="ja-card text-fg-muted">Aún no hay tiendas.</p>
      ) : (
        <ul className="grid gap-3">
          {stores.map((s) => {
            const st = STORE_STATUS[s.status];
            return (
              <li key={s.id} className="ja-card gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="grid gap-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link href={`/${s.slug}`} className="font-display text-lg font-black underline-offset-4 hover:underline">{s.name}</Link>
                    <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                    {s.featured && <span className="ja-tag-example">Destacada</span>}
                  </p>
                  <p className="text-sm text-fg-muted">
                    /{s.slug} · {s.city ?? "Sin ciudad"} · {Number(s.products)} productos · {Number(s.visits_30d)} visitas (30 d) · creada {formatDateTime(s.created_at)}
                  </p>
                </div>
                <AdminStoreActions id={s.id} name={s.name} status={s.status} featured={s.featured} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
