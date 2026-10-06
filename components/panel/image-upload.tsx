"use client";

import { useId, useRef, useState } from "react";
import {
  compressToWebp,
  errorText,
  imageExtension,
  isHeic,
  photoErrorMessage,
  readIntoMemory,
  type PhotoStage,
} from "@/lib/images";
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
  /** Avisa al formulario cuando cambia la foto (para guardar el borrador). */
  onUrlChange?: (url: string | null) => void;
};

/** Sube una foto comprimida a la carpeta de la tienda y guarda su URL en un campo oculto. */
export function ImageUpload({
  storeId,
  folder,
  name,
  label,
  defaultUrl,
  maxSide,
  aspect = "square",
  onUrlChange,
}: Props) {
  const [url, setUrl] = useState<string | null>(defaultUrl ?? null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [detail, setDetail] = useState<string>("");
  const [canRepick, setCanRepick] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const id = useId();

  function changeUrl(next: string | null) {
    setUrl(next);
    onUrlChange?.(next);
  }

  function fail(stage: PhotoStage, err: unknown, info: string) {
    console.error(`Error con la foto (${stage})`, err);
    const { message, canRepick } = photoErrorMessage(stage, err);
    setStatus("");
    setError(message);
    setCanRepick(canRepick);
    setDetail(`${info} · ${errorText(err)}`);
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const picked = input.files?.[0];
    if (!picked) return;
    setError("");
    setDetail("");
    setCanRepick(false);
    // Algunas galerías mandan las HEIC sin tipo: se aceptan por la extensión.
    if (!picked.type.startsWith("image/") && !isHeic(picked)) {
      input.value = "";
      setError("El archivo debe ser una imagen (JPG, PNG, WebP o HEIC).");
      return;
    }
    if (picked.size > 60 * 1024 * 1024) {
      input.value = "";
      setError("La imagen pesa más de 60 MB. Elige otra.");
      return;
    }
    const info = `${picked.type || "sin tipo"}, ${(picked.size / 1024 / 1024).toFixed(1)} MB`;
    setBusy(true);
    try {
      // 1. Copia en memoria antes que nada: en Chrome Android el archivo elegido puede dejar de leerse.
      let file: File;
      try {
        setStatus("Leyendo la foto…");
        file = await readIntoMemory(picked);
      } catch (err) {
        fail("read", err, info);
        return;
      } finally {
        input.value = "";
      }

      // 2. Comprimir (siempre sobre la copia en memoria).
      let image: File;
      try {
        setStatus("Comprimiendo la foto…");
        image = await compressToWebp(file, maxSide);
      } catch (err) {
        fail("compress", err, info);
        return;
      }

      // 3. Subir; si falla la red, se reintenta una vez.
      try {
        setStatus("Subiendo…");
        // randomUUID solo existe en https/localhost; en otro caso basta un nombre aleatorio.
        const fileId =
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        const path = `${storeId}/${folder}/${fileId}.${imageExtension(image.type)}`;
        const supabase = createClient();
        const upload = () =>
          supabase.storage
            .from(BUCKET)
            .upload(path, image, { contentType: image.type, cacheControl: "31536000", upsert: false });
        let { error: upErr } = await upload();
        if (upErr && /fetch|network/i.test(upErr.message)) {
          await new Promise((r) => setTimeout(r, 1000));
          ({ error: upErr } = await upload());
        }
        if (upErr) throw upErr;
        changeUrl(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
        setStatus(`Foto lista (${Math.round(image.size / 1024)} KB, antes ${Math.round(picked.size / 1024)} KB).`);
      } catch (err) {
        fail("upload", err, info);
      }
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
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
            className="sr-only"
            tabIndex={-1}
            aria-label={`${label}: elegir archivo`}
            onChange={onChange}
            disabled={busy}
          />
          {/* La cámara le entrega la foto directo al navegador, sin pasar por la galería. */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            tabIndex={-1}
            aria-label={`${label}: tomar foto con la cámara`}
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
          {!busy && (
            <Button variant="secondary" size="sm" onClick={() => cameraRef.current?.click()}>
              Tomar foto
            </Button>
          )}
          {url && !busy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                changeUrl(null);
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
      {error && canRepick && !busy && (
        <Button size="sm" className="justify-self-start" onClick={() => inputRef.current?.click()}>
          Elegir de nuevo
        </Button>
      )}
      {error && detail && <p className="text-xs break-words text-fg-muted">Detalle técnico: {detail}</p>}
    </fieldset>
  );
}
