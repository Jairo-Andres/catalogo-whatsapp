import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/site";

/** Home, listado y tiendas activas (cliente sin cookies: solo lo público). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/tiendas`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
  ];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return pages;
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supabase.from("stores").select("slug, updated_at").eq("status", "activa").limit(5000);
    for (const s of data ?? []) {
      pages.push({ url: `${base}/${s.slug}`, lastModified: s.updated_at, changeFrequency: "weekly", priority: 0.7 });
    }
  } catch {
    // Sin base de datos el sitemap sigue sirviendo las páginas fijas.
  }
  return pages;
}

export const revalidate = 3600;
