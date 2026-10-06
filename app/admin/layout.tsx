import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/site-header";
import { buttonClass } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Administración", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <>
      <header className="border-b border-border bg-fg text-bg">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <Link href="/admin" className="flex min-h-11 items-center gap-2 font-display font-black">
            <BrandMark /> Administración
          </Link>
          <nav aria-label="Administración" className="flex flex-wrap items-center gap-1">
            <Link href="/admin" className="ja-btn ja-btn--sm text-bg underline-offset-4 hover:underline">
              Métricas
            </Link>
            <Link href="/admin/tiendas" className="ja-btn ja-btn--sm text-bg underline-offset-4 hover:underline">
              Tiendas
            </Link>
            <Link href="/" className="ja-btn ja-btn--sm text-bg underline-offset-4 hover:underline">
              Sitio
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className={buttonClass("ghost", "sm", "text-bg hover:bg-transparent hover:underline")}
              >
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
