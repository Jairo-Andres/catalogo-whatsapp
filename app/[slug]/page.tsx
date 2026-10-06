import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MessageCircle } from "lucide-react";
import { Shape } from "@/components/decor";
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
      <div className="px-3 pt-4 sm:px-4">
        <section aria-labelledby="tienda-titulo" className="mt-hero mx-auto max-w-[78rem]">
          {store.banner_url && (
            <Image
              src={store.banner_url}
              alt=""
              fill
              priority
              sizes="100vw"
              className="-z-10 object-cover opacity-25"
            />
          )}
          <Shape kind="sphere-q" bob="fast" className="right-[22%] top-5 hidden size-16 sm:block" />
          <Shape kind="cube-d" bob="slow" className="right-6 top-8 size-14 sm:size-20" />
          <Shape kind="sphere-b" className="bottom-8 right-[14%] hidden size-12 sm:block" />
          <div className="mx-auto grid max-w-6xl gap-5 px-5 py-8 sm:px-10 sm:py-12">
            <nav aria-label="Migas de pan">
              <ol className="flex flex-wrap gap-2 font-mono text-xs uppercase tracking-[0.12em]">
                <li>
                  <Link href="/tiendas" className="mt-muted underline-offset-4 hover:underline">
                    Tiendas
                  </Link>
                </li>
                <li aria-hidden="true" className="mt-muted">
                  /
                </li>
                <li aria-current="page" className="mt-muted truncate">
                  {store.name}
                </li>
              </ol>
            </nav>
            <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="size-24 overflow-hidden rounded-3xl shadow-lg sm:size-28">
                {store.logo_url ? (
                  <Image
                    src={store.logo_url}
                    alt={`Logo de ${store.name}`}
                    width={112}
                    height={112}
                    className="size-full object-cover"
                  />
                ) : (
                  <div
                    className="mt-icon-tile mt-icon-tile--q size-full rounded-3xl font-display text-3xl font-black"
                    aria-hidden="true"
                  >
                    {initials}
                  </div>
                )}
              </div>
              <div className="grid min-w-0 gap-3">
                <h1 id="tienda-titulo" className="ja-display break-words text-4xl sm:text-6xl">
                  {store.name}
                </h1>
                {(store.category || store.city) && (
                  <p className="flex flex-wrap gap-2">
                    {store.category && <span className="mt-chip">{store.category}</span>}
                    {store.city && (
                      <span className="mt-chip">
                        <MapPin aria-hidden="true" className="size-3.5 text-[var(--mt-yellow)]" />
                        {store.city}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
            {store.description && <p className="mt-muted max-w-2xl text-lg">{store.description}</p>}
            <a
              href={whatsappLink(store.whatsapp, `Hola ${store.name}, vi tu catálogo y tengo una pregunta.`)}
              target="_blank"
              rel="noopener"
              className="ja-btn ja-btn--wa ja-btn--lg w-fit"
            >
              <MessageCircle aria-hidden="true" className="size-5" /> Escribir por WhatsApp
              <span className="sr-only"> (abre WhatsApp)</span>
            </a>
          </div>
        </section>
      </div>

      <section aria-labelledby="productos-titulo" className="mx-auto max-w-6xl px-4 py-12">
        <p className="ja-label">Catálogo</p>
        <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-2">
          <h2 id="productos-titulo" className="ja-display text-3xl sm:text-4xl">
            Productos
          </h2>
          <p className="font-mono text-sm text-fg-muted">
            {products.length} {products.length === 1 ? "producto" : "productos"}
          </p>
        </div>
        {products.length === 0 ? (
          <p className="mt-card text-fg-muted">Esta tienda todavía no ha publicado productos.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} storeId={store.id} slug={store.slug} index={i} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
