import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut, UserRound } from "lucide-react";
import { PanelNav } from "@/components/panel/panel-nav";
import { BrandLink } from "@/components/site-header";
import { StatusBadge, STORE_STATUS } from "@/components/ui/badge";
import { signOut } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const session = await requireUser("/panel");
  const store = session.store;
  const status = store ? STORE_STATUS[store.status] : null;
  return (
    <>
      <header className="px-3 pt-3 sm:px-4">
        <div className="mt-nav mx-auto max-w-6xl">
          <BrandLink label={store?.name ?? "Mi panel"} href="/panel" />
          <div className="flex shrink-0 items-center gap-0.5">
            {status && (
              <StatusBadge tone={status.tone} className="mr-1 hidden lg:inline-flex">
                {status.label}
              </StatusBadge>
            )}
            {store && (
              <Link href={`/${store.slug}`} className="mt-nav__link gap-1.5" target="_blank">
                <ExternalLink aria-hidden="true" className="size-4" />
                <span className="sr-only sm:not-sr-only">Ver tienda</span>
                <span className="sr-only"> (abre en otra pestaña)</span>
              </Link>
            )}
            {/* Sin tienda (o admin) no hay menú del panel: la cuenta se abre desde aquí. */}
            {!store && (
              <Link href="/panel/cuenta" className="mt-nav__link gap-1.5">
                <UserRound aria-hidden="true" className="size-4" />
                Cuenta
              </Link>
            )}
            <form action={signOut}>
              <button type="submit" className="mt-nav__link gap-1.5">
                <LogOut aria-hidden="true" className="size-4" />
                <span className="sr-only sm:not-sr-only">Salir</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:gap-8 md:pb-10">
        {store && (
          <aside className="md:w-52 md:shrink-0">
            <PanelNav />
          </aside>
        )}
        <main id="contenido" className="min-w-0 flex-1">
          {store?.status === "pendiente" && (
            <div className="mb-6 rounded-2xl border border-border bg-status-warn-bg p-4 text-status-warn" role="note">
              <p className="font-bold">Tu tienda está en revisión.</p>
              <p className="text-fg">
                Cuando el administrador la apruebe será pública. Mientras tanto puedes subir productos y ver la vista
                previa.
              </p>
            </div>
          )}
          {store?.status === "suspendida" && (
            <div className="mb-6 rounded-2xl bg-status-bad-bg p-4 text-status-bad" role="note">
              <p className="font-bold">Tu tienda está suspendida y no es visible para los clientes.</p>
            </div>
          )}
          {children}
        </main>
      </div>
    </>
  );
}
