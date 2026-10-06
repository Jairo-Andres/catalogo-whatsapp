"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getSession } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/site";
import { BUCKET, isOwnStorageUrl, publicUrl } from "@/lib/storage";
import { fieldErrors, productSchema } from "@/lib/validators";
import type { FormState } from "./store";

async function myStore() {
  const session = await getSession();
  if (!session) redirect("/login?next=/panel/productos");
  if (!session.store) redirect("/panel/tienda");
  return session.store;
}

function revalidateStore(slug: string) {
  revalidatePath("/panel", "layout");
  revalidatePath(`/${slug}`, "layout");
}

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const store = await myStore();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const productId = raw.id || null;
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values: raw };
  const { image_url, ...data } = parsed.data;
  if (!isOwnStorageUrl(image_url, store.id)) return { error: "La foto no es válida. Súbela de nuevo.", values: raw };
  if (data.is_unique && data.stock !== null && data.stock > 1) {
    return { fields: { stock: "Un producto único tiene stock 1 o vacío" }, values: raw };
  }

  const supabase = await createClient();
  let id = productId;
  if (id) {
    const { error, count } = await supabase
      .from("products")
      .update(data, { count: "exact" })
      .eq("id", id)
      .eq("store_id", store.id);
    if (error || count === 0) return { error: "No pudimos guardar el producto.", values: raw };
  } else {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", store.id);
    if ((count ?? 0) >= LIMITS.productsPerStore) {
      return { error: `Llegaste al límite de ${LIMITS.productsPerStore} productos del plan gratis.`, values: raw };
    }
    const { data: created, error } = await supabase
      .from("products")
      .insert({ ...data, store_id: store.id })
      .select("id")
      .single();
    if (error || !created) return { error: "No pudimos crear el producto.", values: raw };
    id = created.id;
  }

  // Foto: MVP con una imagen (position 0).
  const { data: oldImages } = await supabase.from("product_images").select("id, url").eq("product_id", id);
  const old = oldImages?.[0];
  if (old?.url !== image_url) {
    if (old) {
      await supabase.from("product_images").delete().eq("product_id", id);
      if (isOwnStorageUrl(old.url, store.id)) {
        await supabase.storage.from(BUCKET).remove([old.url.slice(publicUrl("").length)]);
      }
    }
    if (image_url) await supabase.from("product_images").insert({ product_id: id, url: image_url, position: 0 });
  }

  revalidateStore(store.slug);
  redirect(`/panel/productos?guardado=${productId ? "editado" : "nuevo"}`);
}

export async function setProductStatus(formData: FormData) {
  const store = await myStore();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["disponible", "agotado", "vendido"].includes(status)) return;
  const supabase = await createClient();
  await supabase
    .from("products")
    .update({ status: status as "disponible" | "agotado" | "vendido" })
    .eq("id", id)
    .eq("store_id", store.id);
  revalidateStore(store.slug);
}

export type SoldState = { error?: string; success?: string };

export async function markSold(_prev: SoldState, formData: FormData): Promise<SoldState> {
  const store = await myStore();
  const id = String(formData.get("id") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  if (!Number.isInteger(quantity) || quantity < 1) return { error: "La cantidad debe ser un número entero mayor que 0." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_product_sold", { p_product_id: id, p_quantity: quantity });
  if (error) {
    const known = ["supera el stock", "ya está vendido", "se vende de a 1", "entre 1 y 10000"];
    return { error: known.some((k) => error.message.includes(k)) ? error.message : "No pudimos registrar la venta." };
  }
  revalidateStore(store.slug);
  return { success: `Venta registrada (${quantity}).` };
}

export async function deleteProduct(formData: FormData) {
  const store = await myStore();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { data: images } = await supabase.from("product_images").select("url").eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id).eq("store_id", store.id);
  if (!error && images?.length) {
    const paths = images.filter((i) => isOwnStorageUrl(i.url, store.id)).map((i) => i.url.slice(publicUrl("").length));
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
  }
  revalidateStore(store.slug);
  redirect("/panel/productos?guardado=eliminado");
}
