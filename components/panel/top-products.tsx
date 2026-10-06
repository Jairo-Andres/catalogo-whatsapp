import Link from "next/link";

export type TopProduct = { product_id: string; name: string; views: number; in_orders: number };

/**
 * Productos más vistos: tabla real (se lee bien con lector de pantalla) con barras
 * horizontales decorativas para comparar de un vistazo.
 */
export function TopProducts({ items, days }: { items: TopProduct[]; days: number }) {
  const top = [...items]
    .filter((p) => p.views > 0 || p.in_orders > 0)
    .sort((a, b) => b.views - a.views || b.in_orders - a.in_orders)
    .slice(0, 5);
  const max = Math.max(1, ...top.map((p) => p.views));

  return (
    <section aria-labelledby="mas-vistos" className="ja-card ja-card--raised gap-4">
      <div className="grid gap-1">
        <h2 id="mas-vistos" className="font-display text-xl font-black">
          Productos más vistos ({days} días)
        </h2>
        <p className="text-sm text-fg-muted">
          Vistas de la página de cada producto y cuántas veces entró en un pedido enviado por WhatsApp.
        </p>
      </div>
      {top.length === 0 ? (
        <p className="rounded-2xl bg-surface p-4 text-fg-muted">
          Todavía no hay vistas de productos. Comparte el link de tu tienda y aquí verás cuáles atraen más.
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Productos más vistos en los últimos {days} días</caption>
          <thead>
            <tr className="ja-label text-left">
              <th scope="col" className="pb-2 font-bold">
                Producto
              </th>
              <th scope="col" className="pb-2 text-right font-bold">
                Vistas
              </th>
              <th scope="col" className="pb-2 pl-3 text-right font-bold">
                En pedidos
              </th>
            </tr>
          </thead>
          <tbody>
            {top.map((p, i) => (
              <tr key={p.product_id} className="border-t border-border">
                <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="font-mono text-xs text-fg-muted" aria-hidden="true">
                      {i + 1}
                    </span>
                    <Link
                      href={`/panel/productos/${p.product_id}`}
                      className="truncate font-bold underline-offset-4 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </span>
                  <span aria-hidden="true" className="mt-1.5 block h-2.5 rounded-full bg-surface-2">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${Math.max(4, (p.views / max) * 100)}%` }}
                    />
                  </span>
                </th>
                <td className="ja-num py-2.5 text-right align-top font-bold">{p.views}</td>
                <td className="ja-num py-2.5 pl-3 text-right align-top">{p.in_orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
