"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductThumb } from "./product-image";
import { cn } from "@/lib/cn";

/**
 * Fotos del producto. Con una sola foto es una imagen fija; con varias es un carrusel
 * que se desliza con el dedo (scroll-snap nativo, sin librerías) y tiene flechas,
 * puntos y teclado para quien no puede deslizar.
 */
export function ProductGallery({ images, name, className }: { images: string[]; name: string; className?: string }) {
  const scroller = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  if (images.length <= 1) {
    return (
      <ProductThumb url={images[0] ?? null} className={className} sizes="(min-width: 768px) 50vw, 100vw" priority />
    );
  }

  function go(index: number) {
    const el = scroller.current;
    if (!el) return;
    const next = (index + images.length) % images.length;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  }

  function onScroll() {
    const el = scroller.current;
    if (el && el.clientWidth) setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <section aria-roledescription="carrusel" aria-label={`Fotos de ${name}`} className={cn("relative", className)}>
      <ul
        ref={scroller}
        onScroll={onScroll}
        tabIndex={0}
        aria-label={`Fotos de ${name}. Desliza o usa las flechas para ver las ${images.length}.`}
        className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((url, i) => (
          <li key={url} className="relative size-full shrink-0 snap-center bg-surface-2">
            <Image
              src={url}
              alt={`${name}, foto ${i + 1} de ${images.length}`}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority={i === 0}
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => go(active - 1)}
        aria-label="Foto anterior"
        className="absolute top-1/2 left-2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border-strong bg-bg/90 text-fg shadow"
      >
        <ChevronLeft aria-hidden="true" className="size-6" />
      </button>
      <button
        type="button"
        onClick={() => go(active + 1)}
        aria-label="Foto siguiente"
        className="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border-strong bg-bg/90 text-fg shadow"
      >
        <ChevronRight aria-hidden="true" className="size-6" />
      </button>

      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => go(i)}
            aria-label={`Ver foto ${i + 1} de ${images.length}`}
            aria-current={i === active ? "true" : undefined}
            className="grid size-8 place-items-center"
          >
            <span
              aria-hidden="true"
              className={cn(
                "block size-3 rounded-full border-2 border-bg shadow",
                i === active ? "bg-accent" : "bg-fg-muted/70",
              )}
            />
          </button>
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        Foto {active + 1} de {images.length}
      </p>
    </section>
  );
}
