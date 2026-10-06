import { StoreForm } from "@/components/panel/store-form";
import { requireUser } from "@/lib/auth";
import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Mi tienda" };

export default async function TiendaPage() {
  const session = await requireUser("/panel/tienda");
  const supabase = await createClient();
  const { data: categories } = await supabase.from("store_categories").select("id, name").order("name");
  return (
    <div className="grid max-w-2xl gap-6">
      <div className="grid gap-1">
        <h1 className="ja-display text-3xl">{session.store ? "Mi tienda" : "Crea tu tienda"}</h1>
        <p className="text-fg-muted">
          {session.store
            ? "Edita el título, la descripción, el WhatsApp y las imágenes."
            : "Solo una pantalla. Podrás cambiar todo después."}
        </p>
      </div>
      <StoreForm store={session.store} categories={categories ?? []} siteUrl={siteUrl()} />
    </div>
  );
}
