import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { CartBar } from "@/components/store/cart-bar";
import { effectivePrice } from "@/lib/format";
import { getPublicProducts, getStoreBySlug } from "@/lib/public-store";
import { siteUrl } from "@/lib/site";

export default async function StoreLayout({ children, params }: LayoutProps<"/[slug]">) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  const products = await getPublicProducts(store.id);
  const catalog = Object.fromEntries(
    products.map((p) => [p.id, { name: p.name, unitPrice: effectivePrice(p), available: p.status === "disponible" }]),
  );
  return (
    <PageShell>
      {store.status !== "activa" && (
        <p className="bg-status-warn-bg px-4 py-2 text-center text-sm font-bold text-status-warn" role="note">
          Vista previa: esta tienda está {store.status === "pendiente" ? "pendiente de aprobación" : "suspendida"} y los clientes aún no la ven.
        </p>
      )}
      {children}
      <div className="h-20" aria-hidden="true" />
      <CartBar
        store={{ id: store.id, name: store.name, whatsapp: store.whatsapp, offers_delivery: store.offers_delivery, offers_pickup: store.offers_pickup, status: store.status }}
        storeUrl={`${siteUrl()}/${store.slug}`}
        catalog={catalog}
      />
    </PageShell>
  );
}
