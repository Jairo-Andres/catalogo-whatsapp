import Image from "next/image";
import Link from "next/link";
import { ShapePair } from "@/components/decor";

export type StoreCardData = {
  slug: string;
  name: string;
  city: string | null;
  logo_url: string | null;
  category: string | null;
  featured?: boolean;
};

/** Tarjeta de tienda: parte superior beige con el logo (o figuras), categoría · ciudad y "Ver catálogo". */
export function StoreCard({ store, index = 0 }: { store: StoreCardData; index?: number }) {
  const meta = [store.category ?? "Tienda", store.city].filter(Boolean).join(" · ");
  return (
    <li className="rise" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
      <Link
        href={`/${store.slug}`}
        className="group mt-card flex h-full flex-col overflow-hidden p-0 no-underline transition-transform duration-[var(--duration-base)] hover:-translate-y-0.5"
      >
        <div className="mt-beige grid h-36 place-items-center">
          {store.logo_url ? (
            <Image
              src={store.logo_url}
              alt=""
              width={96}
              height={96}
              className="size-24 rounded-2xl object-cover shadow-md"
            />
          ) : (
            <ShapePair index={index} />
          )}
        </div>
        <div className="grid gap-1 p-4">
          <p className="truncate font-mono text-xs text-fg-muted">{meta}</p>
          <p className="truncate font-display text-xl font-black">{store.name}</p>
          <p className="font-bold text-ink-b group-hover:underline">
            Ver catálogo <span aria-hidden="true">→</span>
          </p>
        </div>
      </Link>
    </li>
  );
}
