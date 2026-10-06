"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="contenido" className="mx-auto grid max-w-xl justify-items-start gap-4 px-4 py-20">
      <h1 className="ja-display text-3xl">Algo salió mal</h1>
      <p className="text-fg-muted">
        Puede ser un problema de conexión con la base de datos. Intenta de nuevo en unos segundos.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </main>
  );
}
