import { discountPercent, formatCOP } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Precio en monoespaciada + precio anterior tachado + pastilla "-20%". */
export function Price({
  price,
  salePrice,
  size = "md",
  muted = false,
}: {
  price: number;
  salePrice: number | null;
  size?: "md" | "lg";
  muted?: boolean;
}) {
  const pct = discountPercent(price, salePrice);
  const big = size === "lg" ? "text-2xl" : "text-lg";
  const tone = muted ? "text-fg-muted" : undefined;
  if (pct === null || salePrice === null) {
    return <p className={cn("mt-price", big, tone)}>{formatCOP(price)}</p>;
  }
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className={cn("mt-price", big, tone)}>
        <span className="sr-only">Precio de oferta: </span>
        {formatCOP(salePrice)}
      </span>
      <s className="font-mono text-xs text-fg-muted">
        <span className="sr-only">Antes: </span>
        {formatCOP(price)}
      </s>
      <span className="tag-discount rounded-full px-2">-{pct}%</span>
    </p>
  );
}
