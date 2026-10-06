import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Share2 } from "lucide-react";
import { AddToCart } from "@/components/store/add-to-cart";
import { Price } from "@/components/store/price";
import { ProductThumb } from "@/components/store/product-image";
import { TrackView } from "@/components/store/track-view";
import { PRODUCT_STATUS, StatusBadge } from "@/components/ui/badge";
import { effectivePrice, formatCOP } from "@/lib/format";
import { getProduct } from "@/lib/queries";
import { getStoreBySlug } from "@/lib/public-store";
import { siteUrl } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

async function load(params: PageProps<"/[slug]/[productId]">["params"]) {
  const { slug, productId } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return null;
  const product = await getProduct(store.id, productId);
  return product ? { store, product } : null;
}

export async function generateMetadata({ params }: PageProps<"/[slug]/[productId]">): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "Producto no encontrado" };
  const { store, product } = data;
  const description =
    `${formatCOP(effectivePrice(product))} en ${store.name}. ${product.description ?? "Pide por WhatsApp."}`.slice(
      0,
      200,
    );
  return {
    title: `${product.name} · ${store.name}`,
    description,
    alternates: { canonical: `/${store.slug}/${product.id}` },
    robots: store.status === "activa" ? undefined : { index: false },
    openGraph: {
      title: product.name,
      description,
      url: `/${store.slug}/${product.id}`,
      images: product.image_url ? [{ url: product.image_url, alt: product.name }] : undefined,
    },
    twitter: { card: product.image_url ? "summary_large_image" : "summary" },
  };
}

export default async function ProductPage({ params }: PageProps<"/[slug]/[productId]">) {
  const data = await load(params);
  if (!data) notFound();
  const { store, product } = data;
  const available = product.status === "disponible";
  const status = PRODUCT_STATUS[product.status];
  const url = `${siteUrl()}/${store.slug}/${product.id}`;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
      <TrackView storeId={store.id} productId={product.id} />
      <Link href={`/${store.slug}`} className="ja-btn ja-btn--ghost w-fit px-2">
        <ArrowLeft aria-hidden="true" className="size-5" /> {store.name}
      </Link>
      <article className="grid gap-6 md:grid-cols-2 md:gap-10">
        <ProductThumb
          url={product.image_url}
          className="aspect-square w-full rounded-lg"
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
        />
        <div className="grid content-start gap-4">
          <h1 className="ja-display text-3xl sm:text-4xl">{product.name}</h1>
          <Price price={product.price} salePrice={product.sale_price} size="lg" />
          {!available && (
            <StatusBadge tone={status.tone} className="w-fit">
              {status.label}
            </StatusBadge>
          )}
          {product.description && <p className="whitespace-pre-line">{product.description}</p>}
          {available && (
            <AddToCart
              storeId={store.id}
              productId={product.id}
              name={product.name}
              unitPrice={effectivePrice(product)}
              size="lg"
              className="w-full sm:w-auto"
            />
          )}
          <a
            href={whatsappLink("", `Mira esto en ${store.name}: ${product.name} ${url}?src=whatsapp`)}
            target="_blank"
            rel="noopener"
            className="ja-btn ja-btn--secondary w-full sm:w-auto"
          >
            <Share2 aria-hidden="true" className="size-5" /> Compartir por WhatsApp
            <span className="sr-only"> (abre WhatsApp)</span>
          </a>
        </div>
      </article>
    </div>
  );
}
