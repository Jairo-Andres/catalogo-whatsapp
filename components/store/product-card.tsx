import Image from "next/image";
import Link from "next/link";
import type { ProductRow } from "@/lib/queries";
import { effectivePrice } from "@/lib/format";
import { PRODUCT_STATUS } from "@/components/ui/badge";
import { ShapePair, tileClass } from "@/components/decor";
import { AddToCart } from "./add-to-cart";
import { Price } from "./price";

export function ProductCard({
  product,
  storeId,
  slug,
  index,
}: {
  product: ProductRow;
  storeId: string;
  slug: string;
  index: number;
}) {
  const available = product.status === "disponible";
  const status = PRODUCT_STATUS[product.status];
  return (
    <li
      className="rise mt-card flex flex-col overflow-hidden p-0"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <Link href={`/${slug}/${product.id}`} className="group grid no-underline">
        <div
          className={`relative grid aspect-[16/14] place-items-center overflow-hidden ${available ? tileClass(index) : "mt-tile-off"}`}
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className={`object-cover ${available ? "" : "opacity-60 grayscale"}`}
              priority={index < 2}
            />
          ) : (
            <ShapePair index={index} muted={!available} />
          )}
          {!available && (
            <span className={`mt-badge mt-badge--${status.tone} absolute left-2.5 top-2.5`}>{status.label}</span>
          )}
        </div>
        <h3 className="line-clamp-2 px-4 pt-3 font-display text-base font-black leading-snug group-hover:underline sm:text-lg">
          {product.name}
        </h3>
      </Link>
      <div className="mt-auto grid gap-3 px-4 pb-4 pt-2">
        <Price price={product.price} salePrice={product.sale_price} muted={!available} />
        {available ? (
          <AddToCart
            storeId={storeId}
            productId={product.id}
            name={product.name}
            unitPrice={effectivePrice(product)}
            className="w-full"
          />
        ) : (
          <p className="ja-btn ja-btn--sm pointer-events-none w-full bg-surface-2 text-fg-muted shadow-[inset_0_-3px_0_var(--color-border)]">
            No disponible
            <span className="sr-only">
              : {product.status === "agotado" ? "sin unidades por ahora" : "ya se vendió"}
            </span>
          </p>
        )}
      </div>
    </li>
  );
}
