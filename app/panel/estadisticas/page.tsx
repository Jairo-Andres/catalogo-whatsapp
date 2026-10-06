import { HBars } from "@/components/panel/charts";
import { requireStore } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Estadísticas" };

const monthFmt = new Intl.DateTimeFormat("es-CO", { month: "short", year: "2-digit", timeZone: "UTC" });

export default async function EstadisticasPage() {
  const { store } = await requireStore("/panel/estadisticas");
  const supabase = await createClient();
  const [{ data: top }, { data: months }] = await Promise.all([
    supabase.rpc("stats_top_products", { p_store_id: store.id, p_days: 30 }),
    supabase.rpc("stats_sales_by_month", { p_store_id: store.id, p_months: 6 }),
  ]);
  const short = (s: string) => (s.length > 16 ? `${s.slice(0, 15)}…` : s);
  const topViews = (top ?? []).slice(0, 5).map((t) => ({ label: short(t.name), value: Number(t.views) }));
  const topOrders = [...(top ?? [])]
    .sort((a, b) => Number(b.in_orders) - Number(a.in_orders))
    .slice(0, 5)
    .map((t) => ({ label: short(t.name), value: Number(t.in_orders) }));
  const sales = (months ?? []).map((m) => ({
    label: monthFmt.format(new Date(`${m.month}T00:00:00Z`)),
    value: Number(m.revenue),
  }));

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="ja-display text-3xl">Estadísticas</h1>
        <p className="text-fg-muted">
          Últimos 30 días. Los clics en Pedir muestran intención de compra, no ventas confirmadas.
        </p>
      </div>
      {topViews.length === 0 ? (
        <p className="ja-card text-fg-muted">Cuando tengas productos y visitas, aquí verás cuáles atraen más.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="ja-card ja-card--raised">
            <HBars data={topViews} title="Productos más vistos" />
          </section>
          <section className="ja-card ja-card--raised">
            <HBars data={topOrders} title="Más incluidos en pedidos" />
          </section>
        </div>
      )}
      <section className="ja-card ja-card--raised">
        {sales.length === 0 ? (
          <p className="text-fg-muted">Ventas por mes: aún no hay ventas marcadas en los últimos 6 meses.</p>
        ) : (
          <HBars data={sales} title="Ventas por mes (marcadas como vendidas)" money />
        )}
      </section>
    </div>
  );
}
