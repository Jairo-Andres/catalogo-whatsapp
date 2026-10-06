import { discountPercent, formatCOP } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Precio tachado + precio de oferta + etiqueta "-20%". */
export function Price({ price, salePrice, size = "md" }: { price: number; salePrice: number | null; size?: "md" | "lg" }) {
  const pct = discountPercent(price, salePrice);
  const big = size === "lg" ? "text-2xl" : "text-lg";
  if (pct === null || salePrice === null) {
    return <p className={cn("ja-num font-bold", big)}>{formatCOP(price)}</p>;
  }
  return (
    <p className="ja-num flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={cn("font-bold", big)}>
        <span className="sr-only">Precio de oferta: </span>
        {formatCOP(salePrice)}
      </span>
      <s className="text-sm text-fg-muted">
        <span className="sr-only">Antes: </span>
        {formatCOP(price)}
      </s>
      <span className="tag-discount">-{pct}%</span>
    </p>
  );
}
