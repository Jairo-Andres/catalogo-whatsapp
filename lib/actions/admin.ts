"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { createClient, getSession } from "@/lib/supabase/server";

async function assertAdmin() {
  const session = await getSession();
  if (session?.role !== "admin") notFound();
}

export async function updateStoreStatus(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const op = String(formData.get("op") ?? "");
  const supabase = await createClient();
  if (op === "aprobar" || op === "reactivar") await supabase.from("stores").update({ status: "activa" }).eq("id", id);
  else if (op === "suspender") await supabase.from("stores").update({ status: "suspendida" }).eq("id", id);
  else if (op === "destacar") await supabase.from("stores").update({ featured: true }).eq("id", id);
  else if (op === "quitar-destacado") await supabase.from("stores").update({ featured: false }).eq("id", id);
  else if (op === "eliminar") {
    // Borra también sus fotos del bucket (la tienda en cascada borra productos, eventos y ventas).
    const paths: string[] = [];
    for (const folder of ["productos", "marca"]) {
      const { data: files } = await supabase.storage.from("catalogo").list(`${id}/${folder}`, { limit: 1000 });
      for (const f of files ?? []) paths.push(`${id}/${folder}/${f.name}`);
    }
    const { error } = await supabase.from("stores").delete().eq("id", id);
    if (!error && paths.length) await supabase.storage.from("catalogo").remove(paths);
  }
  revalidatePath("/", "layout");
}
