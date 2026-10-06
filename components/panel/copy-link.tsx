"use client";

import { useId, useRef, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";

/** Link público de la tienda con botón "Copiar link" (y respaldo si el portapapeles no está disponible). */
export function CopyStoreLink({ url, storeName }: { url: string; storeName: string }) {
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setMsg("Link copiado");
    } catch {
      // Respaldo: deja el link seleccionado para copiarlo a mano.
      inputRef.current?.focus();
      inputRef.current?.select();
      setCopied(false);
      setMsg("No pudimos copiarlo solo. El link quedó seleccionado: mantén presionado y elige Copiar.");
    }
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <section aria-labelledby={`${id}-titulo`} className="mt-card grid gap-3">
      <h2 id={`${id}-titulo`} className="font-display text-xl font-black">
        Link de tu tienda
      </h2>
      <p className="text-sm text-fg-muted">
        Compártelo en tu estado de WhatsApp, Instagram o donde hables con clientes.
      </p>
      <label htmlFor={id} className="sr-only">
        Link de tu tienda
      </label>
      <input
        ref={inputRef}
        id={id}
        readOnly
        value={url}
        className="field-input font-mono text-sm"
        onFocus={(e) => e.currentTarget.select()}
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={copy}>
          {copied ? <Check aria-hidden="true" className="size-5" /> : <Copy aria-hidden="true" className="size-5" />}
          {copied ? "¡Copiado!" : "Copiar link"}
        </Button>
        <a
          href={whatsappLink("", `Mira mi catálogo de ${storeName}: ${url}`)}
          target="_blank"
          rel="noopener"
          className="ja-btn ja-btn--secondary"
        >
          <MessageCircle aria-hidden="true" className="size-5" /> Compartir por WhatsApp
          <span className="sr-only"> (abre WhatsApp)</span>
        </a>
      </div>
      <p role="status" aria-live="polite" className="text-sm font-bold text-status-good">
        {msg}
      </p>
    </section>
  );
}
