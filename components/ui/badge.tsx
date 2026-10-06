import { cn } from "@/lib/cn";

type Tone = "good" | "warn" | "bad";

/** Estado con forma + texto + color (regla de la marca): círculo, triángulo, cuadrado. */
export function StatusBadge({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn("ja-status", `ja-status--${tone}`, className)}>{children}</span>;
}

export const PRODUCT_STATUS: Record<string, { label: string; tone: Tone }> = {
  disponible: { label: "Disponible", tone: "good" },
  agotado: { label: "Agotado", tone: "warn" },
  vendido: { label: "Vendido", tone: "bad" },
};

export const STORE_STATUS: Record<string, { label: string; tone: Tone }> = {
  activa: { label: "Activa", tone: "good" },
  pendiente: { label: "Pendiente", tone: "warn" },
  suspendida: { label: "Suspendida", tone: "bad" },
};
