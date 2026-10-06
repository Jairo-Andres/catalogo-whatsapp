import { ChevronDown, ChevronUp } from "lucide-react";
import { moveProduct } from "@/lib/actions/products";

/** Botones Subir y Bajar (funcionan sin arrastrar y sin JavaScript). */
export function MoveButtons({
  id,
  name,
  isFirst,
  isLast,
}: {
  id: string;
  name: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const cls =
    "grid size-11 place-items-center rounded-xl border border-border bg-bg text-fg shadow-[inset_0_-3px_0_var(--color-border)] hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none";
  return (
    <div className="grid gap-1">
      <form action={moveProduct}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="subir" />
        <button type="submit" className={cls} disabled={isFirst} aria-label={`Subir ${name}`}>
          <ChevronUp aria-hidden="true" className="size-5" />
        </button>
      </form>
      <form action={moveProduct}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="bajar" />
        <button type="submit" className={cls} disabled={isLast} aria-label={`Bajar ${name}`}>
          <ChevronDown aria-hidden="true" className="size-5" />
        </button>
      </form>
    </div>
  );
}
