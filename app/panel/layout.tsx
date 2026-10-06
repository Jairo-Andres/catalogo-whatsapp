import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { PanelNav } from "@/components/panel/panel-nav";
import { BrandMark } from "@/components/site-header";
import { StatusBadge, STORE_STATUS } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const session = await requireUser("/panel");
  const store = session.store;
  const status = store ? STORE_STATUS[store.status] : null;
  return (
    <>
      <header className="border-b border-border bg-bg">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <Link href="/panel" className="flex min-h-11 items-center gap-2 font-display font-black">
            <BrandMark />
            <span className="max-w-[12rem] truncate">{store?.name ?? "Mi panel"}</span>
          </Link>
          <div className="flex items-center gap-1">
            {status && <StatusBadge tone={status.tone} className="hidden sm:inline-flex">{status.label}</StatusBadge>}
            {store && (
              <Link href={`/${store.slug}`} className={buttonClass("ghost", "sm")} target="_blank">
                <ExternalLink aria-hidden="true" className="size-4" />
                Ver tienda<span className="sr-only"> (abre en otra pestaña)</span>
              </Link>
            )}
            <form action={signOut}>
              <button type="submit" className={buttonClass("ghost", "sm")}>
                <LogOut aria-hidden="true" className="size-4" />
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 pb-24 pt-6 md:pb-10">
        {store && (
          <aside className="md:w-52 md:shrink-0">
            <PanelNav />
          </aside>
        )}
        <main id="contenido" className="min-w-0 flex-1">
          {store?.status === "pendiente" && (
            <div className="mb-6 rounded-lg border border-border bg-status-warn-bg p-4 text-status-warn" role="note">
              <p className="font-bold">Tu tienda está en revisión.</p>
              <p className="text-fg">
                Cuando el administrador la apruebe será pública. Mientras tanto puedes subir productos y ver la vista previa.
              </p>
            </div>
          )}
          {store?.status === "suspendida" && (
            <div className="mb-6 rounded-lg bg-status-bad-bg p-4 text-status-bad" role="note">
              <p className="font-bold">Tu tienda está suspendida y no es visible para los clientes.</p>
            </div>
          )}
          {children}
        </main>
      </div>
    </>
  );
}
