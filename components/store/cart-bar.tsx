"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { track } from "@/lib/analytics";
import { formatCOP } from "@/lib/format";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import { emptyCart, useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";

type Catalog = Record<string, { name: string; unitPrice: number; available: boolean }>;
type Props = {
  store: { id: string; name: string; whatsapp: string; offers_delivery: boolean; offers_pickup: boolean; status: string };
  storeUrl: string;
  catalog: Catalog;
};

/** Carrito flotante con contador y total; arma el pedido y abre WhatsApp. */
export function CartBar({ store, storeUrl, catalog }: Props) {
  const hydrated = useSyncExternalStore(
    (cb) => useCart.persist.onFinishHydration(cb),
    () => useCart.persist.hasHydrated(),
    () => false,
  );
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const nameId = useId();
  const noteId = useId();
  const cart = useCart((s) => s.carts[store.id]) ?? emptyCart();
  const { setQuantity, remove, setInfo, clear } = useCart.getState();

  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Precios y disponibilidad vigentes: el carrito guardado puede tener datos viejos.
  const lines = useMemo(
    () =>
      cart.items
        .filter((i) => catalog[i.productId]?.available)
        .map((i) => ({ ...i, name: catalog[i.productId].name, unitPrice: catalog[i.productId].unitPrice })),
    [cart.items, catalog],
  );
  const dropped = cart.items.length - lines.length;
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const total = lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0);
  const deliveryOptions = [store.offers_delivery && "domicilio", store.offers_pickup && "recoger"].filter(Boolean) as ("domicilio" | "recoger")[];
  const delivery = deliveryOptions.length === 1 ? deliveryOptions[0] : cart.delivery;

  const message = buildOrderMessage({
    storeName: store.name,
    storeUrl,
    lines,
    customerName: cart.customerName,
    delivery: deliveryOptions.length ? delivery : null,
    note: cart.note,
  });
  const href = whatsappLink(store.whatsapp, message);
  const canOrder = lines.length > 0 && store.status === "activa";

  function onOrder() {
    setSent(true);
    void track(store.id, "clic_pedir");
    for (const l of lines) void track(store.id, "producto_en_pedido", l.productId);
  }

  if (!hydrated || (count === 0 && !open)) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-bg/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="ja-num">
            <span className="font-bold">{count} {count === 1 ? "producto" : "productos"}</span>
            <span className="text-fg-muted"> · {formatCOP(total)}</span>
          </p>
          <Button onClick={() => { setSent(false); setOpen(true); }} aria-haspopup="dialog">
            <ShoppingBag aria-hidden="true" className="size-5" /> Ver pedido
          </Button>
        </div>
      </div>

      <dialog ref={dialogRef} aria-labelledby={titleId} onClose={() => setOpen(false)}
        className="m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-lg border border-border bg-bg p-0 text-fg shadow-lg backdrop:bg-black/50 sm:m-auto sm:max-w-lg sm:rounded-lg">
        <div className="grid gap-4 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 id={titleId} className="font-display text-2xl font-black">Tu pedido</h2>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <X aria-hidden="true" className="size-5" /><span className="sr-only">Cerrar</span>
            </Button>
          </div>

          {dropped > 0 && (
            <p className="rounded-md bg-status-warn-bg p-3 text-sm text-status-warn">
              {dropped === 1 ? "Un producto ya no está disponible y se quitó" : `${dropped} productos ya no están disponibles y se quitaron`} del pedido.
            </p>
          )}

          <ul className="grid gap-3">
            {lines.map((l) => (
              <li key={l.productId} className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-border pb-3">
                <div className="min-w-0">
                  <p className="font-bold">{l.name}</p>
                  <p className="ja-num text-sm text-fg-muted">{formatCOP(l.unitPrice)} c/u · {formatCOP(l.unitPrice * l.quantity)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="secondary" size="sm" className="px-2" onClick={() => setQuantity(store.id, l.productId, l.quantity - 1)}>
                    <Minus aria-hidden="true" className="size-4" /><span className="sr-only">Quitar uno de {l.name}</span>
                  </Button>
                  <span className="ja-num w-8 text-center font-bold" aria-label={`Cantidad de ${l.name}`}>{l.quantity}</span>
                  <Button variant="secondary" size="sm" className="px-2" onClick={() => setQuantity(store.id, l.productId, l.quantity + 1)}>
                    <Plus aria-hidden="true" className="size-4" /><span className="sr-only">Agregar uno de {l.name}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="px-2" onClick={() => remove(store.id, l.productId)}>
                    <Trash2 aria-hidden="true" className="size-4" /><span className="sr-only">Eliminar {l.name}</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <p className="ja-num flex justify-between text-lg"><span className="font-bold">Total</span><strong>{formatCOP(total)}</strong></p>

          <div className="grid gap-1.5">
            <label htmlFor={nameId} className="font-bold">Tu nombre <span className="font-normal text-fg-muted">(opcional)</span></label>
            <Input id={nameId} autoComplete="given-name" maxLength={60} value={cart.customerName}
              onChange={(e) => setInfo(store.id, { customerName: e.target.value })} />
          </div>
          {deliveryOptions.length > 1 && (
            <fieldset className="grid gap-2">
              <legend className="mb-1 font-bold">Entrega</legend>
              {deliveryOptions.map((opt) => (
                <label key={opt} className="flex min-h-11 items-center gap-3">
                  <input type="radio" name="delivery" value={opt} checked={cart.delivery === opt}
                    onChange={() => setInfo(store.id, { delivery: opt })} className="size-5 accent-[var(--color-accent)]" />
                  {opt === "domicilio" ? "Domicilio" : "Recoger en tienda"}
                </label>
              ))}
            </fieldset>
          )}
          <div className="grid gap-1.5">
            <label htmlFor={noteId} className="font-bold">Nota <span className="font-normal text-fg-muted">(opcional)</span></label>
            <Textarea id={noteId} rows={2} maxLength={300} value={cart.note} onChange={(e) => setInfo(store.id, { note: e.target.value })} />
          </div>

          <p className="text-sm text-fg-muted">El vendedor confirmará disponibilidad y precio final por WhatsApp.</p>
          {canOrder ? (
            <a href={href} target="_blank" rel="noopener" onClick={onOrder} className="ja-btn ja-btn--wa ja-btn--lg w-full">
              Pedir por WhatsApp<span className="sr-only"> (abre WhatsApp)</span>
            </a>
          ) : (
            <p className="rounded-md bg-surface p-3 text-sm">Esta tienda aún no recibe pedidos (vista previa).</p>
          )}
          {sent && (
            <div role="status" className="grid gap-2 rounded-md bg-surface p-3 text-sm">
              <p>¿Ya enviaste el mensaje en WhatsApp?</p>
              <Button variant="secondary" size="sm" onClick={() => { clear(store.id); setOpen(false); }}>Sí, vaciar el carrito</Button>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
