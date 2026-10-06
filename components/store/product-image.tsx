import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

/** Foto del producto o un marcador neutro. alt vacío: el nombre ya está en el texto vecino. */
export function ProductThumb({ url, className, sizes = "64px", priority }: { url: string | null; className?: string; sizes?: string; priority?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden bg-surface-2", className)}>
      {url ? (
        <Image src={url} alt="" fill sizes={sizes} className="object-cover" priority={priority} />
      ) : (
        <div className="grid size-full place-items-center text-fg-muted">
          <ImageOff aria-hidden="true" className="size-6" />
        </div>
      )}
    </div>
  );
}
