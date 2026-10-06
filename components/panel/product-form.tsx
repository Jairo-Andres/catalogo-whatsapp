"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { saveProduct } from "@/lib/actions/products";
import type { FormState } from "@/lib/actions/store";
import { discountPercent, formatCOP, salePriceFromPercent } from "@/lib/format";
import { clearDraft, draftKey, formToDraft, loadDraft, saveDraft, type ProductDraft } from "@/lib/product-draft";
import { LIMITS } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { ImageUpload } from "./image-upload";

export type ProductInput = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  stock: number | null;
  is_unique: boolean;
  status: "disponible" | "agotado" | "vendido";
  images: string[];
};

const IMAGE_FIELDS = ["image_url", "image_url_2", "image_url_3"] as const;

type FormProps = { storeId: string; product?: ProductInput };

/**
 * Formulario de producto con borrador: si Chrome recarga la página (en celulares con poca memoria
 * pasa al abrir la cámara o la galería), se recupera lo escrito y las fotos ya subidas.
 */
export function ProductForm({ storeId, product }: FormProps) {
  const key = draftKey(storeId, product?.id);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [wasDiscarded, setWasDiscarded] = useState(false);

  // sessionStorage y document.wasDiscarded solo existen en el navegador: se leen después de montar.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- lectura única del navegador al montar */
    setDraft(loadDraft(key));
    setWasDiscarded(Boolean((document as Document & { wasDiscarded?: boolean }).wasDiscarded));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [key]);

  return (
    <ProductFormFields
      // Al recuperar un borrador se vuelve a montar el formulario con esos valores.
      key={draft ? "borrador" : "limpio"}
      storeId={storeId}
      product={product}
      draft={draft}
      draftStorageKey={key}
      wasDiscarded={wasDiscarded}
      onDiscardDraft={() => {
        clearDraft(key);
        setDraft(null);
      }}
    />
  );
}

function ProductFormFields({
  storeId,
  product,
  draft,
  draftStorageKey,
  wasDiscarded,
  onDiscardDraft,
}: FormProps & {
  draft: ProductDraft | null;
  draftStorageKey: string;
  wasDiscarded: boolean;
  onDiscardDraft: () => void;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct, {});
  const v = state.values ?? draft ?? undefined;
  const f = state.fields ?? {};
  const formRef = useRef<HTMLFormElement>(null);
  const [price, setPrice] = useState(v?.price ?? (product ? String(product.price) : ""));
  const [salePrice, setSalePrice] = useState(
    v?.sale_price ?? (product?.sale_price != null ? String(product.sale_price) : ""),
  );
  const initialPct = v
    ? discountPercent(Number(v.price), v.sale_price ? Number(v.sale_price) : null)
    : product
      ? discountPercent(product.price, product.sale_price)
      : null;
  const [percent, setPercent] = useState(initialPct ? String(initialPct) : "");
  const [isUnique, setIsUnique] = useState(v ? v.is_unique === "on" : Boolean(product?.is_unique));
  // Fotos: se muestra la principal y un botón para agregar más; al editar, tantos espacios como fotos haya.
  const initialImages = IMAGE_FIELDS.map((name, i) => (v ? v[name] || null : (product?.images[i] ?? null)));
  const [photoSlots, setPhotoSlots] = useState(() =>
    Math.max(
      1,
      initialImages.reduce((last, url, i) => (url ? i + 1 : last), 0),
    ),
  );

  // El bloque de descuento empieza cerrado, salvo que el producto ya tenga uno.
  const [hasDiscountAtStart] = useState(() => salePrice !== "");

  // Guarda el borrador después de que React actualiza los campos.
  function persistDraft() {
    setTimeout(() => {
      if (formRef.current) saveDraft(draftStorageKey, formToDraft(new FormData(formRef.current)));
    }, 0);
  }

  const priceNum = Number(price);
  const saleNum = salePrice === "" ? null : Number(salePrice);
  const pct = Number.isFinite(priceNum) ? discountPercent(priceNum, saleNum) : null;

  return (
    <form
      ref={formRef}
      action={action}
      onChange={persistDraft}
      onSubmit={() => clearDraft(draftStorageKey)}
      className="grid gap-5"
      noValidate
    >
      <FormMessage error={state.error} />
      {draft && !state.values && (
        <div role="status" className="grid gap-2 rounded-md bg-surface-2 px-4 py-3">
          <p>
            <strong>Recuperamos lo que llevabas en este formulario.</strong>{" "}
            {wasDiscarded && "Chrome recargó la página por falta de memoria."}
          </p>
          <Button variant="ghost" size="sm" className="justify-self-start" onClick={onDiscardDraft}>
            Descartar y empezar de nuevo
          </Button>
        </div>
      )}
      {!draft && wasDiscarded && (
        <p role="status" className="rounded-md bg-surface-2 px-4 py-3">
          Chrome cerró la página por falta de memoria mientras usabas la cámara o la galería. Cierra las pestañas que no
          uses y vuelve a intentarlo.
        </p>
      )}
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid gap-2">
        <h2 className="font-bold">
          Fotos <span className="font-normal text-fg-muted">(hasta {LIMITS.imagesPerProduct})</span>
        </h2>
        <p className="text-sm text-fg-muted">
          La principal sale en el catálogo; en la página del producto el cliente desliza para ver las demás.
        </p>
        <div className="grid gap-4 rounded-lg border border-border p-4">
          {IMAGE_FIELDS.slice(0, photoSlots).map((name, i) => (
            <ImageUpload
              key={name}
              storeId={storeId}
              folder="productos"
              name={name}
              label={i === 0 ? "Foto principal" : `Foto ${i + 1}`}
              defaultUrl={initialImages[i] ?? null}
              onUrlChange={persistDraft}
            />
          ))}
          {photoSlots < IMAGE_FIELDS.length && (
            <Button
              variant="secondary"
              size="sm"
              className="justify-self-start"
              onClick={() => setPhotoSlots((n) => Math.min(n + 1, IMAGE_FIELDS.length))}
            >
              + Agregar otra foto
            </Button>
          )}
        </div>
      </div>

      <Field label="Nombre" error={f.name}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="name"
            required
            defaultValue={v?.name ?? product?.name}
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>

      <Field label="Descripción" error={f.description} optional>
        {({ id, describedBy, invalid }) => (
          <Textarea
            id={id}
            name="description"
            rows={3}
            defaultValue={v?.description ?? product?.description ?? ""}
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>

      <Field
        label="Precio (COP)"
        error={f.price}
        hint={priceNum > 0 ? formatCOP(priceNum) : "Sin puntos ni decimales, por ejemplo 25000."}
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="price"
            inputMode="numeric"
            required
            value={price}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, "");
              setPrice(next);
              const p = Number(percent);
              if (p > 0) setSalePrice(String(salePriceFromPercent(Number(next), p) ?? ""));
            }}
          />
        )}
      </Field>

      <details open={hasDiscountAtStart} className="group rounded-lg border border-border">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
          <span>
            Descuento <span className="font-normal text-fg-muted">(opcional)</span>
          </span>
          <ChevronDown aria-hidden="true" className="size-5 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-3 px-4 pb-4">
          <p className="text-sm text-fg-muted">Escribe el porcentaje o el precio de oferta; el otro se calcula solo.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Porcentaje">
              {({ id }) => (
                <Input
                  id={id}
                  inputMode="numeric"
                  value={percent}
                  placeholder="20"
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setPercent(next);
                    setSalePrice(next ? String(salePriceFromPercent(priceNum, Number(next)) ?? "") : "");
                  }}
                />
              )}
            </Field>
            <Field label="Precio de oferta (COP)" error={f.sale_price}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  name="sale_price"
                  inputMode="numeric"
                  value={salePrice}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, "");
                    setSalePrice(next);
                    const p = discountPercent(priceNum, next === "" ? null : Number(next));
                    setPercent(p ? String(p) : "");
                  }}
                />
              )}
            </Field>
          </div>
          {pct !== null && saleNum !== null && (
            <p className="text-sm" aria-live="polite">
              Se verá así: <s className="text-fg-muted">{formatCOP(priceNum)}</s> <strong>{formatCOP(saleNum)}</strong>{" "}
              <span className="tag-discount">-{pct}%</span>
            </p>
          )}
        </div>
      </details>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Stock" error={f.stock} optional hint="Déjalo vacío si no llevas control de unidades.">
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="stock"
              inputMode="numeric"
              defaultValue={v?.stock ?? product?.stock ?? ""}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>
        <Field label="Estado" error={f.status}>
          {({ id, describedBy }) => (
            <Select
              id={id}
              name="status"
              defaultValue={v?.status ?? product?.status ?? "disponible"}
              aria-describedby={describedBy}
            >
              <option value="disponible">Disponible</option>
              <option value="agotado">Agotado</option>
              <option value="vendido">Vendido</option>
            </Select>
          )}
        </Field>
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="is_unique"
          checked={isUnique}
          onChange={(e) => setIsUnique(e.target.checked)}
          className="mt-1 size-5 shrink-0 accent-[var(--color-accent)]"
        />
        <span>
          <span className="font-bold">Es un producto único</span>
          <span className="block text-sm text-fg-muted">
            Por ejemplo una artesanía o ropa de segunda. Al venderlo pasa a “Vendido”.
          </span>
        </span>
      </label>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Guardando…" : product ? "Guardar cambios" : "Publicar producto"}
      </Button>
    </form>
  );
}
