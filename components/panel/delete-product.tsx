"use client";

import { deleteProduct } from "@/lib/actions/products";
import { Button } from "@/components/ui/button";

export function DeleteProduct({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteProduct}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar “${name}”? Las ventas registradas se conservan en el historial.`)) e.preventDefault();
      }}
      className="border-t border-border pt-6"
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger">Eliminar producto</Button>
    </form>
  );
}
