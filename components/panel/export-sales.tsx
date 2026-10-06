"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import type { SaleRow } from "@/lib/sales-export";
import { Button } from "@/components/ui/button";

/** Descarga las ventas en Excel. exceljs se carga solo al hacer clic (no pesa en la página). */
export function ExportSalesButton({ rows, slug, storeName }: { rows: SaleRow[]; slug: string; storeName: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onExport() {
    setBusy(true);
    setMsg("Preparando el archivo…");
    try {
      const { buildSalesWorkbook, salesFileName } = await import("@/lib/sales-export");
      const buffer = await buildSalesWorkbook(rows, storeName);
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href: url, download: salesFileName(slug) });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMsg("Listo: el archivo se descargó.");
    } catch (e) {
      console.error("No se pudo exportar a Excel", e);
      setMsg("No pudimos crear el archivo. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid justify-items-start gap-1">
      <Button variant="wa" onClick={onExport} disabled={busy || rows.length === 0}>
        <FileSpreadsheet aria-hidden="true" className="size-5" />
        {busy ? "Exportando…" : "Exportar a Excel"}
      </Button>
      <p role="status" aria-live="polite" className="text-sm text-fg-muted">
        {msg}
      </p>
    </div>
  );
}
