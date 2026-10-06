import Link from "next/link";
import { VisitsChart } from "@/components/panel/charts";
import { StatCard } from "@/components/panel/stat-card";
import { requireStore } from "@/lib/auth";
import { formatCOP, formatDay } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Resumen" };

type Summary = Record<"visitas_hoy" | "visitas_7d" | "visitas_30d" | "clics_pedir_30d" | "unidades_vendidas_30d" | "total_vendido_30d" | "total_vendido_mes", number>;

export default async function PanelPage({ searchParams }: PageProps<"/panel">) {
  const { store } = await requireStore("/panel");
  const days = (await searchParams).dias === "7" ? 7 : 30;
  const supabase = await createClient();
  const [{ data: summary }, { data: byDay }] = await Promise.all([
    supabase.rpc("store_summary", { p_store_id: store.id }),
    supabase.rpc("stats_by_day", { p_store_id: store.id, p_days: days }),
  ]);
  const s = (summary ?? {}) as Partial<Summary>;
  const n = (k: keyof Summary) => Number(s[k] ?? 0);
  const rate = n("visitas_30d") > 0 ? Math.round((n("clics_pedir_30d") / n("visitas_30d")) * 100) : 0;
  const chart = (byDay ?? []).map((d) => ({ label: formatDay(d.day), visitors: Number(d.visitors), clicks: Number(d.order_clicks) }));

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="ja-display text-3xl">Resumen</h1>
        <p className="text-fg-muted">Visitas y clics de los últimos días. Las ventas cuentan cuando las marcas como vendidas.</p>
      </div>
      <section aria-label="Cifras principales" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Visitantes hoy" value={String(n("visitas_hoy"))} />
        <StatCard label="Visitas 7 días" value={String(n("visitas_7d"))} hint={`${n("visitas_30d")} en 30 días`} />
        <StatCard label="Clics en Pedir" value={String(n("clics_pedir_30d"))} hint={`${rate} % de las visitas (30 días)`} />
        <StatCard label="Vendido este mes" value={formatCOP(n("total_vendido_mes"))} hint={`${n("unidades_vendidas_30d")} unidades en 30 días`} />
      </section>
      <section aria-labelledby="grafico" className="ja-card ja-card--raised">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="grafico" className="font-display text-xl font-black">Visitas por día</h2>
          <nav aria-label="Periodo" className="flex gap-1">
            {[7, 30].map((d) => (
              <Link key={d} href={`/panel?dias=${d}`} aria-current={days === d ? "true" : undefined}
                className={`ja-btn ja-btn--sm ${days === d ? "ja-btn--primary" : "ja-btn--secondary"}`}>{d} días</Link>
            ))}
          </nav>
        </div>
        <VisitsChart data={chart} title={`Visitantes y clics en Pedir, últimos ${days} días`} />
      </section>
      {n("unidades_vendidas_30d") === 0 && (
        <p className="ja-card">
          <strong>Marca tus ventas y verás cuánto has vendido este mes.</strong>{" "}
          <span className="text-fg-muted">En <Link href="/panel/productos" className="underline underline-offset-4">Productos</Link>, usa “Marcar vendido”.</span>
        </p>
      )}
    </div>
  );
}
