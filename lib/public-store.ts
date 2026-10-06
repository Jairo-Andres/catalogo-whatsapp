import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_FIELDS, toProductRow, type ProductRow } from "@/lib/queries";
import { isValidSlug } from "@/lib/slug";

export type PublicStore = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  city: string | null;
  whatsapp: string;
  logo_url: string | null;
  banner_url: string | null;
  status: "pendiente" | "activa" | "suspendida";
  offers_delivery: boolean;
  offers_pickup: boolean;
  category: string | null;
  font: string;
};

/**
 * Tienda por slug. La RLS decide qué se ve: activas para todos; pendientes o
 * suspendidas solo para su dueño (vista previa) y el admin.
 */
export const getStoreBySlug = cache(async (slug: string): Promise<PublicStore | null> => {
  if (!isValidSlug(slug)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select(
      "id, slug, name, description, city, whatsapp, logo_url, banner_url, font, status, offers_delivery, offers_pickup, store_categories(name)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  const { store_categories, ...rest } = data as typeof data & { store_categories: { name: string } | null };
  return { ...rest, category: store_categories?.name ?? null };
});

export const getPublicProducts = cache(async (storeId: string): Promise<ProductRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("store_id", storeId)
    .order("status") // disponible, agotado, vendido (orden del enum)
    .order("sort_order")
    .order("created_at", { ascending: false });
  return (data as unknown as Parameters<typeof toProductRow>[0][] | null)?.map(toProductRow) ?? [];
});

export async function getActiveStores(opts: { category?: string; q?: string; limit?: number } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("stores")
    .select(
      `slug, name, city, logo_url, banner_url, font, featured, store_categories${opts.category ? "!inner" : ""}(name, slug)`,
    )
    .eq("status", "activa")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 60);
  if (opts.category) query = query.eq("store_categories.slug", opts.category);
  if (opts.q) {
    const term = opts.q
      .replace(/[%_,()]/g, " ")
      .trim()
      .slice(0, 40);
    if (term) query = query.or(`name.ilike.%${term}%,city.ilike.%${term}%`);
  }
  const { data } = await query;
  return (data ?? []).map((s) => {
    const { store_categories, ...rest } = s as typeof s & { store_categories: { name: string } | null };
    return { ...rest, category: store_categories?.name ?? null };
  });
}

export async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("store_categories").select("name, slug").order("name");
  return data ?? [];
}
