import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { StoreCard } from "@/components/store/store-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { getActiveStores, getCategories } from "@/lib/public-store";

export const metadata: Metadata = {
  title: "Tiendas",
  description: "Todas las tiendas con catálogo y pedidos por WhatsApp.",
  alternates: { canonical: "/tiendas" },
};

export default async function TiendasPage({ searchParams }: PageProps<"/tiendas">) {
  const sp = await searchParams;
  const q = String(sp.q ?? "").slice(0, 40);
  const category = String(sp.categoria ?? "") || undefined;
  const [stores, categories] = await Promise.all([getActiveStores({ q, category, limit: 60 }), getCategories()]);
  return (
    <PageShell>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
        <h1 className="ja-display text-4xl">Tiendas</h1>
        <form role="search" className="grid gap-3 sm:grid-cols-[1fr_16rem_auto] sm:items-end">
          <div className="grid gap-1.5">
            <label htmlFor="q" className="font-bold">Buscar por nombre o ciudad</label>
            <input id="q" name="q" type="search" defaultValue={q} className="field-input" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="categoria" className="font-bold">Categoría</label>
            <Select id="categoria" name="categoria" defaultValue={category ?? ""}>
              <option value="">Todas</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </Select>
          </div>
          <Button type="submit"><Search aria-hidden="true" className="size-5" /> Buscar</Button>
        </form>
        <p role="status" className="text-fg-muted">{stores.length} {stores.length === 1 ? "tienda" : "tiendas"}</p>
        {stores.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s, i) => <StoreCard key={s.slug} store={s} index={i} />)}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
