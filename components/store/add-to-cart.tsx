"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { LIMITS } from "@/lib/site";

export function AddToCart({ storeId, productId, name, unitPrice, size = "sm", className }: {
  storeId: string; productId: string; name: string; unitPrice: number; size?: "sm" | "lg"; className?: string;
}) {
  const add = useCart((s) => s.add);
  const [msg, setMsg] = useState("");
  return (
    <>
      <Button
        size={size}
        className={className}
        onClick={() => {
          const r = add(storeId, { productId, name, unitPrice });
          setMsg(r === "full" ? `El carrito admite hasta ${LIMITS.cartDistinctItems} productos distintos.` : `${name} agregado al carrito.`);
        }}
      >
        <Plus aria-hidden="true" className="size-4" /> Agregar<span className="sr-only"> {name} al carrito</span>
      </Button>
      <span role="status" aria-live="polite" className="sr-only">{msg}</span>
    </>
  );
}
