import Image from "next/image";
import Link from "next/link";
import { MapPin, Sparkles } from "lucide-react";
import { Shape, tileClass } from "@/components/decor";

export type StoreCardData = {
  slug: string;
  name: string;
  city: string | null;
  logo_url: string | null;
  banner_url?: string | null;
  category: string | null;
  featured?: boolean;
};

/**
 * Tarjeta de tienda: el banner real de fondo (o un fondo de color con figuras 3D) y el logo
 * encima; abajo categoría, nombre, ciudad y "Ver catálogo".
 */
export function StoreCard({ store, index = 0 }: { store: StoreCardData; index?: number }) {
  const initials = store.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <li className="rise" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
      <Link
        href={`/${store.slug}`}
        className="group mt-card flex h-full flex-col overflow-hidden p-0 no-underline transition-transform duration-[var(--duration-base)] hover:-translate-y-1"
      >
        <div
          className={`relative isolate h-44 overflow-hidden ${store.banner_url ? "bg-surface-2" : tileClass(index)}`}
        >
          {store.banner_url ? (
            <>
              <Image
                src={store.banner_url}
                alt=""
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="-z-10 object-cover transition-transform duration-[var(--duration-slow)] group-hover:scale-105"
              />
              {/* Degradado para que el logo y la etiqueta se lean sobre cualquier banner. */}
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgb(0_0_0/0.45),transparent_60%)]"
              />
            </>
          ) : (
            <>
              <Shape kind={index % 2 ? "sphere-b" : "sphere-q"} className="-right-4 -top-6 size-24" />
              <Shape kind={index % 2 ? "cube-q" : "cube-d"} className="bottom-4 right-16 size-12" />
            </>
          )}
          {store.featured && (
            <span className="mt-badge mt-badge--good absolute right-3 top-3 before:hidden">
              <Sparkles aria-hidden="true" className="size-3.5" /> Destacada
            </span>
          )}
          <div className="absolute bottom-4 left-4 size-20 overflow-hidden rounded-2xl bg-bg shadow-lg ring-4 ring-[var(--mt-card-bg)]">
            {store.logo_url ? (
              <Image src={store.logo_url} alt="" width={80} height={80} className="size-full object-cover" />
            ) : (
              <span
                aria-hidden="true"
                className="mt-icon-tile mt-icon-tile--b size-full rounded-none font-display text-2xl font-black"
              >
                {initials}
              </span>
            )}
          </div>
        </div>
        <div className="grid gap-1 p-4">
          <p className="truncate font-mono text-xs text-fg-muted">{store.category ?? "Tienda"}</p>
          <p className="truncate font-display text-xl font-black">{store.name}</p>
          {store.city && (
            <p className="flex items-center gap-1 text-sm text-fg-muted">
              <MapPin aria-hidden="true" className="size-4" />
              {store.city}
            </p>
          )}
          <p className="mt-1 font-bold text-ink-b group-hover:underline">
            Ver catálogo <span aria-hidden="true">→</span>
          </p>
        </div>
      </Link>
    </li>
  );
}
