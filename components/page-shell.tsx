import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** Encabezado + contenido + pie para las páginas públicas. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

export function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <PageShell>
      <div className="ja-topo">
        <div className="mx-auto grid max-w-md gap-6 px-4 py-10">
          <div className="grid gap-2">
            <h1 className="ja-display text-3xl">{title}</h1>
            <p className="text-fg-muted">{intro}</p>
          </div>
          <div className="ja-card ja-card--raised">{children}</div>
        </div>
      </div>
    </PageShell>
  );
}
