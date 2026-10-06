"use client";

import { useId, useRef, useState } from "react";
import { compressToWebp, imageExtension } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";
import { BUCKET } from "@/lib/storage";
import { Button } from "@/components/ui/button";

type Props = {
  storeId: string;
  folder: "productos" | "marca";
  name: string;
  label: string;
  defaultUrl?: string | null;
  maxSide?: number;
  aspect?: "square" | "wide";
};

/** Sube una foto comprimida a la carpeta de la tienda y guarda su URL en un campo oculto. */
export function ImageUpload({ storeId, folder, name, label, defaultUrl, maxSide, aspect = "square" }: Props) {
  const [url, setUrl] = useState<string | null>(defaultUrl ?? null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen (JPG, PNG o WebP).");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("La imagen pesa más de 25 MB. Elige otra.");
      return;
    }
    setBusy(true);
    let image: File;
    try {
      setStatus("Comprimiendo la foto…");
      image = await compressToWebp(file, maxSide);
    } catch (e) {
      console.error("Error al procesar la foto", e);
      setStatus("");
      setError("No pudimos procesar esta foto. Prueba con otra o tómale captura de pantalla.");
      setBusy(false);
      return;
    }
    try {
      setStatus("Subiendo…");
      // randomUUID solo existe en https/localhost; en otro caso basta un nombre aleatorio.
      const fileId =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      const path = `${storeId}/${folder}/${fileId}.${imageExtension(image.type)}`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, image, { contentType: image.type, cacheControl: "31536000", upsert: false });
      if (upErr) throw upErr;
      setUrl(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
      setStatus(`Foto lista (${Math.round(image.size / 1024)} KB, antes ${Math.round(file.size / 1024)} KB).`);
    } catch (e) {
      console.error("Error al subir la foto", e);
      setStatus("");
      const detail = e instanceof Error && e.message ? ` (${e.message})` : "";
      setError(`No pudimos subir la foto${detail}. Intenta de nuevo.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1.5 font-bold">{label}</legend>
      <input type="hidden" name={name} value={url ?? ""} />
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={`grid shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-surface ${
            aspect === "wide" ? "aspect-[3/1] w-48" : "size-24"
          }`}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa local
            <img src={url} alt="Vista previa" className="size-full object-cover" />
          ) : (
            <span className="px-2 text-center text-xs text-fg-muted">Sin foto</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-label={`${label}: elegir archivo`}
            onChange={onChange}
            disabled={busy}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            aria-describedby={`${id}-status`}
          >
            {busy ? "Procesando…" : url ? "Cambiar foto" : "Elegir foto"}
          </Button>
          {url && !busy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setUrl(null);
                setStatus("Foto quitada. Guarda para aplicar.");
              }}
            >
              Quitar
            </Button>
          )}
        </div>
      </div>
      <p id={`${id}-status`} role="status" aria-live="polite" className="text-sm text-fg-muted">
        {status}
      </p>
      {error && (
        <p role="alert" className="text-sm font-bold text-status-bad">
          {error}
        </p>
      )}
    </fieldset>
  );
}
