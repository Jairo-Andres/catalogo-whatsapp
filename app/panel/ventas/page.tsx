import { requireStore } from "@/lib/auth";
import { formatCOP, formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Ventas" };

export default async function VentasPage() {
  const { store } = await requireStore("/panel/ventas");
  const supabase = await createClient();
  const { data: sales } = await supabase
    .from("sales")
    .select("id, product_name, quantity, unit_price, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = sales ?? [];
  const total = rows.reduce((n, r) => n + r.quantity * Number(r.unit_price), 0);
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="ja-display text-3xl">Ventas</h1>
        <p className="text-fg-muted">Cada venta guarda el nombre y el precio que tenía el producto al venderse.</p>
      </div>
      {rows.length === 0 ? (
        <p className="ja-card text-fg-muted">Aún no has registrado ventas. Usa “Marcar vendido” en tus productos.</p>
      ) : (
        <div className="ja-table-wrap">
          <table className="ja-table">
            <caption className="sr-only">Historial de ventas (últimas 200)</caption>
            <thead>
              <tr><th scope="col">Fecha</th><th scope="col">Producto</th><th scope="col" className="is-num">Cant.</th><th scope="col" className="is-num">Precio</th><th scope="col" className="is-num">Total</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                  <td>{r.product_name}</td>
                  <td className="is-num">{r.quantity}</td>
                  <td className="is-num whitespace-nowrap">{formatCOP(r.unit_price)}</td>
                  <td className="is-num whitespace-nowrap font-bold">{formatCOP(r.quantity * Number(r.unit_price))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><th scope="row" colSpan={4} className="text-right">Total</th><td className="is-num whitespace-nowrap font-bold">{formatCOP(total)}</td></tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
