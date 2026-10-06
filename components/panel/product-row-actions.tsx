"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { markSold, setProductStatus, type SoldState } from "@/lib/actions/products";
import { Check, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

type Status = "disponible" | "agotado" | "vendido";

/** Cambio rápido de estado: se envía al elegir, sin entrar a editar. */
export function StatusSelect({ id, status, name }: { id: string; status: Status; name: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const selectId = useId();
  return (
    <form ref={formRef} action={setProductStatus} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <label htmlFor={selectId} className="sr-only">
        Estado de {name}
      </label>
      <select
        id={selectId}
        name="status"
        defaultValue={status}
        className="field-input w-auto py-1 text-sm"
        onChange={() => formRef.current?.requestSubmit()}
      >
        <option value="disponible">Disponible</option>
        <option value="agotado">Agotado</option>
        <option value="vendido">Vendido</option>
      </select>
      <noscript>
        <button type="submit" className="ja-btn ja-btn--secondary ja-btn--sm">
          Cambiar
        </button>
      </noscript>
    </form>
  );
}

/** "Marcar vendido": pide la cantidad (por defecto 1) salvo en productos únicos. */
export function MarkSold({
  id,
  name,
  stock,
  isUnique,
  disabled,
  sold = false,
}: {
  id: string;
  name: string;
  stock: number | null;
  isUnique: boolean;
  disabled: boolean;
  /** El producto ya está vendido (estado "vendido"): el botón queda marcado. */
  sold?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<SoldState, FormData>(async (prev, fd) => {
    const result = await markSold(prev, fd);
    if (result.success) setOpen(false);
    return result;
  }, {});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const qtyId = useId();

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      {sold ? (
        // Marcado: verde sólido + check + aria-pressed (no depende solo del color).
        <Button
          size="sm"
          variant="wa"
          aria-pressed="true"
          aria-disabled="true"
          className="pointer-events-none"
          tabIndex={-1}
        >
          <Check aria-hidden="true" className="size-4" /> Vendido
          <span className="sr-only">: {name}</span>
        </Button>
      ) : (
        <Button
          variant={open ? "primary" : "secondary"}
          size="sm"
          disabled={disabled}
          aria-pressed={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          {open ? <Check aria-hidden="true" className="size-4" /> : <Tag aria-hidden="true" className="size-4" />}
          {disabled ? "Sin stock" : "Marcar vendido"}
          <span className="sr-only">: {name}</span>
        </Button>
      )}
      {state.success && !open && (
        <span role="status" className="text-sm font-bold text-status-good">
          {state.success}
        </span>
      )}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-lg border border-border bg-bg p-0 text-fg shadow-lg backdrop:bg-black/50"
      >
        <form action={action} className="grid gap-4 p-5">
          <h2 id={titleId} className="font-display text-xl font-black">
            Registrar venta
          </h2>
          <p className="text-fg-muted">{name}</p>
          <input type="hidden" name="id" value={id} />
          {isUnique ? (
            <input type="hidden" name="quantity" value="1" />
          ) : (
            <div className="grid gap-1.5">
              <label htmlFor={qtyId} className="font-bold">
                Cantidad vendida
              </label>
              <Input
                id={qtyId}
                name="quantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={stock ?? 10000}
                defaultValue={1}
                required
              />
              {stock !== null && <p className="text-sm text-fg-muted">Quedan {stock} en stock.</p>}
            </div>
          )}
          {state.error && (
            <p role="alert" className="font-bold text-status-bad">
              {state.error}
            </p>
          )}
          <p className="text-sm text-fg-muted">Marca tus ventas y verás cuánto has vendido este mes.</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Registrar venta"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
