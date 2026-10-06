import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { MarkSold, StatusSelect } from "@/components/panel/product-row-actions";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { requireStore } from "@/lib/auth";
import { formatCOP } from "@/lib/format";
import { getStoreProducts } from "@/lib/queries";
import { LIMITS } from "@/lib/site";
import { ProductThumb } from "@/components/store/product-image";

export const metadata = { title: "Productos" };

const SAVED: Record<string, string> = {
  nuevo: "Producto publicado.",
  editado: "Cambios guardados.",
  eliminado: "Producto eliminado.",
};

export default async function ProductosPage({ searchParams }: PageProps<"/panel/productos">) {
  const { store } = await requireStore("/panel/productos");
  const products = await getStoreProducts(store.id);
  const saved = SAVED[String((await searchParams).guardado ?? "")];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="ja-display text-3xl">Productos</h1>
          <p className="text-fg-muted">{products.length} de {LIMITS.productsPerStore} del plan gratis.</p>
        </div>
        <ButtonLink href="/panel/productos/nuevo">
          <Plus aria-hidden="true" className="size-5" /> Nuevo producto
        </ButtonLink>
      </div>
      {saved && <FormMessage success={saved} />}

      {products.length === 0 ? (
        <div className="ja-card place-items-center py-12 text-center">
          <p className="font-display text-xl font-black">Aún no tienes productos</p>
          <p className="text-fg-muted">Sube el primero: toma menos de un minuto.</p>
          <Link href="/panel/productos/nuevo" className={buttonClass("primary")}>Subir mi primer producto</Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {products.map((p) => (
            <li key={p.id} className="ja-card grid-cols-[4rem_1fr] items-center gap-x-4 sm:grid-cols-[4rem_1fr_auto]">
              <ProductThumb url={p.image_url} className="size-16 rounded-md" />
              <div className="min-w-0">
                <p className="truncate font-bold">{p.name}</p>
                <p className="text-sm">
                  {p.sale_price != null ? (
                    <><s className="text-fg-muted">{formatCOP(p.price)}</s> <strong>{formatCOP(p.sale_price)}</strong></>
                  ) : (
                    <strong>{formatCOP(p.price)}</strong>
                  )}
                  {p.stock !== null && <span className="text-fg-muted"> · Stock {p.stock}</span>}
                  {p.is_unique && <span className="text-fg-muted"> · Único</span>}
                </p>
              </div>
              <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:justify-end">
                <StatusSelect id={p.id} status={p.status} name={p.name} />
                <MarkSold id={p.id} name={p.name} stock={p.stock} isUnique={p.is_unique}
                  disabled={p.status === "vendido" || (p.stock !== null && p.stock === 0)} />
                <Link href={`/panel/productos/${p.id}`} className={buttonClass("ghost", "sm")}>
                  <Pencil aria-hidden="true" className="size-4" /> Editar<span className="sr-only"> {p.name}</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
