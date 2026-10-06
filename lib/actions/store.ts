"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getSession } from "@/lib/supabase/server";
import { BUCKET, isOwnStorageUrl, publicUrl } from "@/lib/storage";
import { fieldErrors, storeSchema, type FieldErrors } from "@/lib/validators";

export type FormState = { error?: string; success?: string; fields?: FieldErrors; values?: Record<string, string> };

export async function saveStore(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/login?next=/panel/tienda");
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = storeSchema.safeParse(raw);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values: raw };
  const { whatsapp_public_ok: _ok, ...data } = parsed.data;
  void _ok;

  const supabase = await createClient();
  const current = session.store;

  if (current && (!isOwnStorageUrl(data.logo_url, current.id) || !isOwnStorageUrl(data.banner_url, current.id))) {
    return { error: "La imagen no es válida. Súbela de nuevo.", values: raw };
  }

  const { error } = current
    ? await supabase.from("stores").update(data).eq("id", current.id)
    : await supabase
        .from("stores")
        .insert({ ...data, logo_url: null, banner_url: null, owner_id: session.userId });

  if (error) {
    if (error.code === "23505") {
      return error.message.includes("owner_id")
        ? { error: "Ya tienes una tienda.", values: raw }
        : { fields: { slug: "Esa dirección ya la usa otra tienda. Prueba otra." }, values: raw };
    }
    return { error: "No pudimos guardar la tienda. Revisa los datos e intenta de nuevo.", values: raw };
  }

  // Si cambió el logo o el banner, se borra el archivo anterior para no gastar espacio.
  if (current) {
    const stale = [current.logo_url, current.banner_url].filter(
      (u): u is string => !!u && u !== data.logo_url && u !== data.banner_url && isOwnStorageUrl(u, current.id),
    );
    if (stale.length) await supabase.storage.from(BUCKET).remove(stale.map((u) => u.slice(publicUrl("").length)));
  }

  revalidatePath("/", "layout");
  if (!current) redirect("/panel/productos/nuevo?bienvenida=1");
  return { success: "Cambios guardados." };
}
