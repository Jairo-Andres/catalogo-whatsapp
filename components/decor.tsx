import { cn } from "@/lib/cn";

/**
 * Figuras 3D decorativas (solo CSS). Siempre aria-hidden: no aportan contenido.
 * Las posiciones vienen en className (absolute + top/left...).
 */
export function Shape({
  kind,
  className,
  bob,
}: {
  kind:
    | "sphere-q"
    | "sphere-b"
    | "sphere-d"
    | "sphere-brown"
    | "sphere-teal"
    | "sphere-orange"
    | "sphere-gray"
    | "cube-d"
    | "cube-b"
    | "cube-q"
    | "cube-gray"
    | "ring";
  className?: string;
  bob?: "fast" | "slow";
}) {
  const [shape, color] = kind.split("-");
  const base =
    shape === "sphere" ? `mt-sphere mt-sphere--${color}` : shape === "cube" ? `mt-cube mt-cube--${color}` : "mt-ring";
  return (
    <span
      aria-hidden="true"
      className={cn("mt-shape block", base, bob && "mt-bob", bob === "slow" && "mt-bob--slow", className)}
    />
  );
}

const PAIRS = [
  ["sphere-brown", "sphere-q"],
  ["cube-d", "sphere-b"],
  ["ring", "cube-b"],
  ["sphere-orange", "cube-d"],
  ["sphere-teal", "cube-b"],
  ["sphere-q", "cube-d"],
] as const;

/** Par de figuras para tarjetas sin foto (tiendas y productos). Varía con el índice. */
export function ShapePair({ index = 0, muted = false }: { index?: number; muted?: boolean }) {
  const [a, b] = muted ? (["sphere-gray", "cube-gray"] as const) : PAIRS[index % PAIRS.length];
  return (
    <span aria-hidden="true" className="relative isolate block size-28">
      <Shape kind={a} className={cn("left-1 top-3 size-20", a === "ring" && "size-20 border-[14px]")} />
      <Shape kind={b} className="bottom-2 right-0 size-12" />
    </span>
  );
}

/** Clase de fondo pastel según el índice (1 a 6). */
export function tileClass(index: number) {
  return `mt-tile-${(index % 6) + 1}`;
}
