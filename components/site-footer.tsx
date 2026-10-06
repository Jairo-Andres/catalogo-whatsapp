import Link from "next/link";
import { AUTHOR_LINKEDIN, AUTHOR_NAME, SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 text-sm sm:flex sm:items-center sm:justify-between">
        <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/terminos" className="underline underline-offset-4">
            Términos
          </Link>
          <Link href="/privacidad" className="underline underline-offset-4">
            Privacidad
          </Link>
          <Link href="/tiendas" className="underline underline-offset-4">
            Tiendas
          </Link>
        </nav>
        <p className="flex items-center gap-2 text-fg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático de la marca */}
          <img src="/marca/monograma-jas.svg" alt="" width={28} height={28} />
          <span>
            {SITE_NAME} es un proyecto de portafolio de{" "}
            <a
              href={AUTHOR_LINKEDIN}
              className="font-bold text-fg underline underline-offset-4"
              rel="noopener"
              target="_blank"
            >
              {AUTHOR_NAME}
              <span className="sr-only"> (LinkedIn, abre en otra pestaña)</span>
            </a>
            .
          </span>
        </p>
      </div>
    </footer>
  );
}
