import { PageShell } from "@/components/page-shell";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell>
      <div className="ja-topo">
        <div className="mx-auto grid max-w-xl justify-items-start gap-4 px-4 py-20">
          <p className="ja-label">Error 404</p>
          <h1 className="ja-display text-4xl">No encontramos esta página</h1>
          <p className="text-fg-muted">Puede que la tienda haya cambiado de dirección o ya no esté publicada.</p>
          <ButtonLink href="/tiendas">Ver tiendas</ButtonLink>
        </div>
      </div>
    </PageShell>
  );
}
