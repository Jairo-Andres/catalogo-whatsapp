"use client";

import { useActionState, useState } from "react";
import { MessageCircle } from "lucide-react";
import { saveStore, type FormState } from "@/lib/actions/store";
import type { Database } from "@/lib/database.types";
import { slugify } from "@/lib/slug";
import { normalizeWhatsapp, whatsappLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { ImageUpload } from "./image-upload";

type Store = Database["public"]["Tables"]["stores"]["Row"];
type Category = { id: string; name: string };

export function StoreForm({ store, categories, siteUrl }: { store: Store | null; categories: Category[]; siteUrl: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveStore, {});
  const v = state.values;
  const f = state.fields ?? {};
  const [name, setName] = useState(v?.name ?? store?.name ?? "");
  const [slug, setSlug] = useState(v?.slug ?? store?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(store));
  const [whatsapp, setWhatsapp] = useState(v?.whatsapp ?? (store ? `+${store.whatsapp}` : "+57 "));
  const host = siteUrl.replace(/^https?:\/\//, "");
  const waDigits = normalizeWhatsapp(whatsapp);

  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormMessage error={state.error} success={state.success} />

      <Field label="Nombre de la tienda" error={f.name} hint="Es el título que verán tus clientes.">
        {({ id, describedBy, invalid }) => (
          <Input id={id} name="name" required maxLength={60} value={name} aria-describedby={describedBy} aria-invalid={invalid}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }} />
        )}
      </Field>

      <Field label="Dirección de tu tienda" error={f.slug}
        hint={<>Tu link quedará así: <strong className="break-all">{host}/{slug || "tu-tienda"}</strong></>}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} name="slug" required maxLength={40} value={slug} aria-describedby={describedBy} aria-invalid={invalid}
            autoCapitalize="none" spellCheck={false}
            onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase()); }} />
        )}
      </Field>

      <Field label="Número de WhatsApp" error={f.whatsapp}
        hint="Con indicativo del país. Si es un celular de Colombia basta con los 10 dígitos.">
        {({ id, describedBy, invalid }) => (
          <div className="flex flex-wrap gap-2">
            <Input id={id} name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required className="min-w-0 flex-1"
              value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} />
            <a
              href={whatsappLink(waDigits, `Hola, esto es una prueba desde mi tienda en ${host} ✅`)}
              target="_blank" rel="noopener"
              className="ja-btn ja-btn--secondary ja-btn--sm"
              aria-disabled={waDigits.length < 10}
              onClick={(e) => waDigits.length < 10 && e.preventDefault()}
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              Probar mensaje<span className="sr-only"> (abre WhatsApp)</span>
            </a>
          </div>
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ciudad" error={f.city} optional>
          {({ id, describedBy, invalid }) => (
            <Input id={id} name="city" maxLength={60} defaultValue={v?.city ?? store?.city ?? ""} autoComplete="address-level2"
              aria-describedby={describedBy} aria-invalid={invalid} />
          )}
        </Field>
        <Field label="Categoría" error={f.category_id} optional>
          {({ id, describedBy, invalid }) => (
            <Select id={id} name="category_id" defaultValue={v?.category_id ?? store?.category_id ?? ""}
              aria-describedby={describedBy} aria-invalid={invalid}>
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </Field>
      </div>

      <Field label="Descripción corta" error={f.description} optional hint="Máximo 500 caracteres.">
        {({ id, describedBy, invalid }) => (
          <Textarea id={id} name="description" maxLength={500} rows={3} defaultValue={v?.description ?? store?.description ?? ""}
            aria-describedby={describedBy} aria-invalid={invalid} />
        )}
      </Field>

      <fieldset className="grid gap-2">
        <legend className="mb-1.5 font-bold">Entrega</legend>
        <label className="flex items-center gap-3">
          <input type="checkbox" name="offers_pickup" defaultChecked={v ? v.offers_pickup === "on" : store?.offers_pickup ?? true}
            className="size-5 accent-[var(--color-accent)]" />
          Se puede recoger en la tienda
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" name="offers_delivery" defaultChecked={v ? v.offers_delivery === "on" : store?.offers_delivery ?? false}
            className="size-5 accent-[var(--color-accent)]" />
          Hago domicilios
        </label>
      </fieldset>

      {store ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <ImageUpload storeId={store.id} folder="marca" name="logo_url" label="Logo" defaultUrl={store.logo_url} maxSide={512} />
          <ImageUpload storeId={store.id} folder="marca" name="banner_url" label="Banner" defaultUrl={store.banner_url} aspect="wide" />
        </div>
      ) : (
        <p className="rounded-md bg-surface p-3 text-sm text-fg-muted">
          El logo y el banner los subes justo después de crear la tienda.
        </p>
      )}

      <label className="flex items-start gap-3">
        <input type="checkbox" name="whatsapp_public_ok" required defaultChecked={Boolean(store)}
          className="mt-1 size-5 shrink-0 accent-[var(--color-accent)]" aria-invalid={Boolean(f.whatsapp_public_ok)} />
        <span className="text-sm">
          Entiendo que mi número de WhatsApp se mostrará en mi tienda para que los clientes me escriban.
          {f.whatsapp_public_ok && <span className="block font-bold text-status-bad">{f.whatsapp_public_ok}</span>}
        </span>
      </label>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Guardando…" : store ? "Guardar cambios" : "Crear mi tienda"}
      </Button>
    </form>
  );
}
