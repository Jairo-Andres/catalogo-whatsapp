import Link from "next/link";
import { StatCard } from "@/components/panel/stat-card";
import { formatCOP } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Métricas" };

type Overview = Record<string, number>;

export default async function AdminPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_overview");
  const o = (data ?? {}) as Overview;
  const n = (k: string) => Number(o[k] ?? 0);
  return (
    <div className="grid gap-6">
      <h1 className="ja-display text-3xl">Métricas de la plataforma</h1>
      {error && <p role="alert" className="font-bold text-status-bad">No se pudieron cargar las métricas.</p>}
      <section aria-label="Tiendas y vendedores" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Vendedores" value={String(n("vendedores"))} />
        <StatCard label="Tiendas activas" value={String(n("tiendas_activas"))} />
        <StatCard label="Pendientes" value={String(n("tiendas_pendientes"))} hint={n("tiendas_pendientes") ? "Esperan tu aprobación" : undefined} />
        <StatCard label="Suspendidas" value={String(n("tiendas_suspendidas"))} />
      </section>
      <section aria-label="Actividad de 30 días" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Productos" value={String(n("productos"))} />
        <StatCard label="Visitas 30 días" value={String(n("visitas_30d"))} />
        <StatCard label="Clics en Pedir 30 días" value={String(n("clics_pedir_30d"))} />
        <StatCard label="Ventas marcadas 30 días" value={formatCOP(n("ventas_30d"))} />
      </section>
      <section aria-label="Almacenamiento" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Fotos en Storage" value={`${n("fotos_mb")} MB`} hint="El plan gratis de Supabase incluye 1 GB (verificar en el panel)." />
        <StatCard label="Reportes pendientes" value={String(n("reportes_pendientes"))} hint="El formulario de reportes llega en la fase 2." />
      </section>
      <Link href="/admin/tiendas" className="ja-btn ja-btn--primary w-fit">Gestionar tiendas</Link>
    </div>
  );
}
