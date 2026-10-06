import "server-only";
import { createClient } from "@/lib/supabase/server";

export const PRODUCT_FIELDS =
  "id, name, description, price, sale_price, stock, is_unique, status, sort_order, created_at, product_images(url, position)";

export type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  stock: number | null;
  is_unique: boolean;
  status: "disponible" | "agotado" | "vendido";
  /** Foto principal (la primera de images). */
  image_url: string | null;
  /** Hasta 3 fotos, en orden. */
  images: string[];
};

type RawProduct = Omit<ProductRow, "image_url" | "images"> & {
  product_images: { url: string; position: number }[] | null;
};

export function toProductRow(p: RawProduct): ProductRow {
  const { product_images, ...rest } = p;
  const images = [...(product_images ?? [])].sort((a, b) => a.position - b.position).map((i) => i.url);
  return {
    ...rest,
    price: Number(rest.price),
    sale_price: rest.sale_price == null ? null : Number(rest.sale_price),
    image_url: images[0] ?? null,
    images,
  };
}

export async function getStoreProducts(storeId: string): Promise<ProductRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("store_id", storeId)
    .order("sort_order")
    .order("created_at", { ascending: false });
  return (data as unknown as RawProduct[] | null)?.map(toProductRow) ?? [];
}

export async function getProduct(storeId: string, productId: string): Promise<ProductRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("store_id", storeId)
    .eq("id", productId)
    .maybeSingle();
  return data ? toProductRow(data as unknown as RawProduct) : null;
}
