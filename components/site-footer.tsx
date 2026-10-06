import Link from "next/link";
import { AUTHOR_LINKEDIN, AUTHOR_NAME, SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto px-4">
      <div className="mx-auto grid max-w-6xl gap-4 border-t border-border py-8 font-mono text-xs text-fg-muted sm:flex sm:items-center sm:justify-between">
        <div className="grid gap-2">
          <p>
            <span className="font-bold text-fg">{SITE_NAME}</span> · Hecho para emprendimientos y tiendas de barrio
          </p>
          <p>
            Proyecto de portafolio de{" "}
            <a
              href={AUTHOR_LINKEDIN}
              className="font-bold text-fg underline underline-offset-4"
              rel="noopener"
              target="_blank"
            >
              {AUTHOR_NAME}
              <span className="sr-only"> (LinkedIn, abre en otra pestaña)</span>
            </a>
          </p>
        </div>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-1">
          {[
            ["/tiendas", "Tiendas"],
            ["/terminos", "Términos"],
            ["/privacidad", "Privacidad"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-11 items-center px-2 text-fg underline underline-offset-4"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
