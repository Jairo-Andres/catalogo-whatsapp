import Link from "next/link";
import { getSession } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/site";
import { buttonClass } from "@/components/ui/button";

export function BrandMark({ className = "" }: { className?: string }) {
  // Bolsa con la línea de ruta: símbolo propio del catálogo dentro de la marca "Rutas".
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} width="32" height="32">
      <rect x="2" y="2" width="28" height="28" rx="8" fill="var(--color-fg)" />
      <path d="M10 13h12l-1.2 11H11.2z" fill="none" stroke="var(--color-bg)" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M13 13v-1.5a3 3 0 0 1 6 0V13" fill="none" stroke="var(--color-bg)" strokeWidth="2.2" />
      <rect x="9" y="26" width="5" height="2" rx="1" fill="var(--ja-b)" />
      <rect x="14" y="26" width="5" height="2" rx="1" fill="var(--ja-d)" />
      <rect x="19" y="26" width="5" height="2" rx="1" fill="var(--ja-q)" />
    </svg>
  );
}

export async function SiteHeader() {
  const session = await getSession();
  return (
    <header className="border-b border-border bg-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="flex min-h-11 items-center gap-2 font-display text-lg font-black no-underline">
          <BrandMark />
          <span>{SITE_NAME}</span>
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1">
          <Link href="/tiendas" className={buttonClass("ghost", "sm")}>
            Tiendas
          </Link>
          {session ? (
            <Link href={session.role === "admin" ? "/admin" : "/panel"} className={buttonClass("secondary", "sm")}>
              {session.role === "admin" ? "Admin" : "Mi panel"}
            </Link>
          ) : (
            <Link href="/login" className={buttonClass("secondary", "sm")}>
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
