import Link from "next/link";
import type { ProductRow } from "@/lib/queries";
import { effectivePrice } from "@/lib/format";
import { PRODUCT_STATUS, StatusBadge } from "@/components/ui/badge";
import { AddToCart } from "./add-to-cart";
import { Price } from "./price";
import { ProductThumb } from "./product-image";

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
      className="rise flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-bg shadow-sm"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <Link href={`/${slug}/${product.id}`} className="group grid gap-2 p-0 no-underline">
        <div className="relative">
          <ProductThumb
            url={product.image_url}
            className={`aspect-square w-full ${available ? "" : "opacity-60"}`}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            priority={index < 2}
          />
          {!available && (
            <StatusBadge tone={status.tone} className="absolute left-2 top-2">
              {status.label}
            </StatusBadge>
          )}
        </div>
        <h3 className="line-clamp-2 px-3 font-bold leading-snug group-hover:underline">{product.name}</h3>
      </Link>
      <div className="mt-auto grid gap-2 px-3 pb-3 pt-1">
        <Price price={product.price} salePrice={product.sale_price} />
        {available ? (
          <AddToCart
            storeId={storeId}
            productId={product.id}
            name={product.name}
            unitPrice={effectivePrice(product)}
            className="w-full"
          />
        ) : (
          <p className="text-sm text-fg-muted">
            {product.status === "agotado" ? "Sin unidades por ahora" : "Ya se vendió"}
          </p>
        )}
      </div>
    </li>
  );
}
