import { Shape } from "./decor";
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
      <div className="px-3 pt-4 sm:px-4">
        <div className="mt-hero mx-auto max-w-[78rem]">
          <Shape kind="sphere-q" bob="fast" className="right-[12%] top-6 size-12 sm:size-16" />
          <Shape kind="cube-d" bob="slow" className="bottom-6 left-[8%] hidden size-14 sm:block" />
          <Shape kind="sphere-b" className="bottom-10 right-[6%] hidden size-10 md:block" />
          <div className="mx-auto grid max-w-md gap-2 px-5 pb-24 pt-10 sm:pt-14">
            <div className="mt-tricolor" aria-hidden="true" />
            <h1 className="ja-display text-4xl">{title}</h1>
            <p className="mt-muted">{intro}</p>
          </div>
        </div>
        <div className="relative mx-auto -mt-16 mb-12 max-w-md px-2">
          <div className="mt-card sm:p-7">{children}</div>
        </div>
      </div>
    </PageShell>
  );
}
