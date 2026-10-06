import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, MessageCircle } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { TrackView } from "@/components/store/track-view";
import { getPublicProducts, getStoreBySlug } from "@/lib/public-store";
import { whatsappLink } from "@/lib/whatsapp";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const store = await getStoreBySlug((await params).slug);
  if (!store) return { title: "Tienda no encontrada" };
  const description = store.description ?? `Mira el catálogo de ${store.name} y pide por WhatsApp.`;
  const image = store.banner_url ?? store.logo_url;
  return {
    title: store.name,
    description,
    alternates: { canonical: `/${store.slug}` },
    robots: store.status === "activa" ? undefined : { index: false },
    openGraph: {
      title: store.name,
      description,
      url: `/${store.slug}`,
      images: image ? [{ url: image, alt: store.name }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary" },
  };
}

export default async function StorePage({ params }: PageProps<"/[slug]">) {
  const store = await getStoreBySlug((await params).slug);
  if (!store) notFound();
  const products = await getPublicProducts(store.id);
  const initials = store.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <TrackView storeId={store.id} />
      <section aria-labelledby="tienda-titulo" className="border-b border-border">
        <div className="relative h-32 bg-surface-2 sm:h-48">
          {store.banner_url ? (
            <Image src={store.banner_url} alt="" fill priority sizes="100vw" className="object-cover" />
          ) : (
            <div className="ja-topo size-full" />
          )}
        </div>
        <div className="mx-auto grid max-w-6xl gap-4 px-4 pb-6 sm:grid-cols-[auto_1fr_auto] sm:items-end">
          <div className="relative z-10 -mt-10 size-20 overflow-hidden rounded-lg border-4 border-bg bg-surface shadow-md sm:-mt-12 sm:size-24">
            {store.logo_url ? (
              <Image
                src={store.logo_url}
                alt={`Logo de ${store.name}`}
                width={96}
                height={96}
                className="size-full object-cover"
              />
            ) : (
              <div
                className="grid size-full place-items-center bg-fg font-display text-2xl font-black text-bg"
                aria-hidden="true"
              >
                {initials}
              </div>
            )}
          </div>
          <div className="grid gap-1">
            <h1 id="tienda-titulo" className="ja-display text-3xl sm:text-4xl">
              {store.name}
            </h1>
            <p className="flex flex-wrap gap-x-3 text-sm text-fg-muted">
              {store.category && <span>{store.category}</span>}
              {store.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin aria-hidden="true" className="size-4" />
                  {store.city}
                </span>
              )}
            </p>
            {store.description && <p className="max-w-prose">{store.description}</p>}
          </div>
          <a
            href={whatsappLink(store.whatsapp, `Hola ${store.name}, vi tu catálogo y tengo una pregunta.`)}
            target="_blank"
            rel="noopener"
            className="ja-btn ja-btn--secondary"
          >
            <MessageCircle aria-hidden="true" className="size-5" /> Escribir por WhatsApp
            <span className="sr-only"> (abre WhatsApp)</span>
          </a>
        </div>
      </section>

      <section aria-labelledby="productos-titulo" className="mx-auto max-w-6xl px-4 py-8">
        <h2 id="productos-titulo" className="mb-4 font-display text-2xl font-black">
          Productos
        </h2>
        {products.length === 0 ? (
          <p className="ja-card text-fg-muted">Esta tienda todavía no ha publicado productos.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} storeId={store.id} slug={store.slug} index={i} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
