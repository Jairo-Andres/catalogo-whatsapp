import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

export type StoreCardData = {
  slug: string;
  name: string;
  city: string | null;
  logo_url: string | null;
  category: string | null;
  featured?: boolean;
};

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
        className="flex min-h-24 items-center gap-4 rounded-lg border border-border bg-bg p-4 shadow-sm transition-shadow duration-[var(--duration-base)] hover:shadow-md"
      >
        <div className="size-16 shrink-0 overflow-hidden rounded-md bg-surface-2">
          {store.logo_url ? (
            <Image src={store.logo_url} alt="" width={64} height={64} className="size-full object-cover" />
          ) : (
            <div
              className="grid size-full place-items-center bg-fg font-display text-xl font-black text-bg"
              aria-hidden="true"
            >
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-black">{store.name}</p>
          <p className="ja-card__meta">{store.category ?? "Tienda"}</p>
          {store.city && (
            <p className="flex items-center gap-1 text-sm text-fg-muted">
              <MapPin aria-hidden="true" className="size-4" />
              {store.city}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}
