import type { Metadata } from "next";
import Link from "next/link";
import { BrandLink } from "@/components/site-header";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Administración", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <>
      <header className="px-3 pt-3 sm:px-4">
        <div className="mt-nav mx-auto max-w-6xl flex-wrap">
          <BrandLink label="Administración" href="/admin" />
          <nav aria-label="Administración" className="flex flex-wrap items-center gap-0.5">
            <Link href="/admin" className="mt-nav__link">
              Métricas
            </Link>
            <Link href="/admin/tiendas" className="mt-nav__link">
              Tiendas
            </Link>
            <Link href="/panel/cuenta" className="mt-nav__link">
              Cuenta
            </Link>
            <Link href="/" className="mt-nav__link">
              Sitio
            </Link>
          </nav>
        </div>
      </header>
      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
