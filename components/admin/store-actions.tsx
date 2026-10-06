"use client";

import { updateStoreStatus } from "@/lib/actions/admin";
import { buttonClass } from "@/components/ui/button";

type Op = { op: string; label: string; variant: "primary" | "secondary" | "ghost" | "danger"; confirm?: string };

export function AdminStoreActions({ id, name, status, featured }: { id: string; name: string; status: string; featured: boolean }) {
  const ops: Op[] = [];
  if (status === "pendiente") ops.push({ op: "aprobar", label: "Aprobar", variant: "primary" });
  if (status === "suspendida") ops.push({ op: "reactivar", label: "Reactivar", variant: "primary" });
  if (status !== "suspendida") ops.push({ op: "suspender", label: "Suspender", variant: "secondary", confirm: `¿Suspender “${name}”? Dejará de ser pública.` });
  ops.push(featured ? { op: "quitar-destacado", label: "Quitar destacado", variant: "ghost" } : { op: "destacar", label: "Destacar", variant: "ghost" });
  ops.push({ op: "eliminar", label: "Eliminar", variant: "danger", confirm: `¿Eliminar “${name}” con todos sus productos, ventas y estadísticas? No se puede deshacer.` });
  return (
    <div className="flex flex-wrap gap-2">
      {ops.map((o) => (
        <form key={o.op} action={updateStoreStatus} onSubmit={(e) => { if (o.confirm && !confirm(o.confirm)) e.preventDefault(); }}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="op" value={o.op} />
          <button type="submit" className={buttonClass(o.variant, "sm")}>
            {o.label}<span className="sr-only"> {name}</span>
          </button>
        </form>
      ))}
    </div>
  );
}
