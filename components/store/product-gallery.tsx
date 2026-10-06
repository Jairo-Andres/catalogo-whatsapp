"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ProductThumb } from "./product-image";
import { cn } from "@/lib/cn";

/**
 * Fotos del producto. Con una sola foto es una imagen fija; con varias es un carrusel
 * que se desliza con el dedo (scroll-snap nativo, sin librerías). Sin flechas encima de la
 * foto (tapaban información): los puntos van debajo y con foco se cambia con ← y →.
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

  function onKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    go(active + (e.key === "ArrowRight" ? 1 : -1));
  }

  return (
    <section aria-roledescription="carrusel" aria-label={`Fotos de ${name}`} className="grid gap-2">
      <ul
        ref={scroller}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        tabIndex={0}
        aria-label={`Fotos de ${name}. Desliza o usa las teclas de flecha para ver las ${images.length}.`}
        className={cn(
          "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className,
        )}
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

      <div className="flex justify-center">
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => go(i)}
            aria-label={`Ver foto ${i + 1} de ${images.length}`}
            aria-current={i === active ? "true" : undefined}
            className="grid size-11 place-items-center rounded-full"
          >
            {/* El punto activo es una pastilla más ancha: no depende solo del color. */}
            <span
              aria-hidden="true"
              className={cn(
                "block h-2.5 rounded-full transition-[width] duration-[var(--duration-base)]",
                i === active ? "w-7 bg-accent" : "w-2.5 bg-border-strong",
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
