"use client";

import { useActionState, useState } from "react";
import { saveProduct } from "@/lib/actions/products";
import type { FormState } from "@/lib/actions/store";
import { discountPercent, formatCOP, salePriceFromPercent } from "@/lib/format";
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

export function ProductForm({ storeId, product }: { storeId: string; product?: ProductInput }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct, {});
  const v = state.values;
  const f = state.fields ?? {};
  const [price, setPrice] = useState(v?.price ?? (product ? String(product.price) : ""));
  const [salePrice, setSalePrice] = useState(
    v?.sale_price ?? (product?.sale_price != null ? String(product.sale_price) : ""),
  );
  const initialPct = product ? discountPercent(product.price, product.sale_price) : null;
  const [percent, setPercent] = useState(initialPct ? String(initialPct) : "");
  const [isUnique, setIsUnique] = useState(v ? v.is_unique === "on" : Boolean(product?.is_unique));

  const priceNum = Number(price);
  const saleNum = salePrice === "" ? null : Number(salePrice);
  const pct = Number.isFinite(priceNum) ? discountPercent(priceNum, saleNum) : null;

  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormMessage error={state.error} />
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid gap-2">
        <h2 className="font-bold">
          Fotos <span className="font-normal text-fg-muted">(hasta {LIMITS.imagesPerProduct})</span>
        </h2>
        <p className="text-sm text-fg-muted">
          La principal sale en el catálogo; en la página del producto el cliente desliza para ver las demás.
        </p>
        <div className="grid gap-4 rounded-lg border border-border p-4">
          {IMAGE_FIELDS.map((name, i) => (
            <ImageUpload
              key={name}
              storeId={storeId}
              folder="productos"
              name={name}
              label={i === 0 ? "Foto principal" : `Foto ${i + 1}`}
              defaultUrl={v ? v[name] || null : (product?.images[i] ?? null)}
            />
          ))}
        </div>
      </div>

      <Field label="Nombre" error={f.name}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="name"
            required
            maxLength={80}
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
            maxLength={1000}
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

      <fieldset className="grid gap-3 rounded-lg border border-border p-4">
        <legend className="px-1 font-bold">
          Descuento <span className="font-normal text-fg-muted">(opcional)</span>
        </legend>
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
      </fieldset>

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
