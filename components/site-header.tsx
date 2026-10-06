import Link from "next/link";
import { getSession } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/site";
import { buttonClass } from "@/components/ui/button";

export function BrandMark({ className = "" }: { className?: string }) {
  // Bolsa con la línea de ruta (azul, amarillo y rosa) en un cuadrado oscuro redondeado.
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} width="32" height="32">
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="9"
        fill="var(--ja-graphite)"
        stroke="var(--color-border-strong)"
        strokeOpacity="0.5"
      />
      <path d="M10 12.5h12l-1.2 10.5H11.2z" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M13 12.5v-1.3a3 3 0 0 1 6 0v1.3" fill="none" stroke="#fff" strokeWidth="2.2" />
      <rect x="9" y="25.5" width="5" height="2" rx="1" fill="var(--ja-b)" />
      <rect x="14" y="25.5" width="5" height="2" rx="1" fill="var(--ja-d)" />
      <rect x="19" y="25.5" width="5" height="2" rx="1" fill="var(--ja-q)" />
    </svg>
  );
}

/** Logo + nombre. Se reutiliza en el panel y en admin. */
export function BrandLink({ label = SITE_NAME, href = "/" }: { label?: string; href?: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-11 min-w-0 items-center gap-2 font-display text-base font-black no-underline sm:text-lg"
    >
      <BrandMark className="size-8 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export async function SiteHeader() {
  const session = await getSession();
  return (
    <header className="px-3 pt-3 sm:px-4">
      <div className="mt-nav mx-auto max-w-6xl">
        <BrandLink />
        <nav aria-label="Principal" className="flex shrink-0 items-center gap-0.5">
          <Link href="/tiendas" className="mt-nav__link hidden sm:inline-flex">
            Tiendas
          </Link>
          <Link href="/#como-funciona" className="mt-nav__link hidden md:inline-flex">
            Cómo funciona
          </Link>
          {session ? (
            <Link
              href={session.role === "admin" ? "/admin" : "/panel"}
              className={buttonClass("primary", "sm", "mt-btn-dark mt-pill")}
            >
              {session.role === "admin" ? "Admin" : "Mi panel"}
            </Link>
          ) : (
            <>
              <Link href="/login" className="mt-nav__link">
                Entrar
              </Link>
              <Link href="/registro" className={buttonClass("primary", "sm", "mt-btn-dark mt-pill whitespace-nowrap")}>
                Crear<span className="sr-only min-[400px]:not-sr-only"> mi tienda</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
