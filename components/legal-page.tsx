import { PageShell } from "./page-shell";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <PageShell>
      <article className="mx-auto grid max-w-3xl gap-4 px-4 py-10 [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-black [&_li]:ml-5 [&_li]:list-disc [&_p]:max-w-prose">
        <h1 className="ja-display text-4xl">{title}</h1>
        <p className="text-sm text-fg-muted">Última actualización: {updated}</p>
        <p className="rounded-md border border-dashed border-border-strong p-3 text-sm">
          Borrador para un proyecto de portafolio. Antes de usarlo con vendedores reales debe revisarlo alguien con
          conocimiento legal.
        </p>
        {children}
      </article>
    </PageShell>
  );
}
