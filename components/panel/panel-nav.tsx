"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Package, Receipt, Store, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/panel", label: "Resumen", icon: Home },
  { href: "/panel/productos", label: "Productos", icon: Package },
  { href: "/panel/ventas", label: "Ventas", icon: Receipt },
  { href: "/panel/estadisticas", label: "Estadísticas", short: "Datos", icon: BarChart3 },
  { href: "/panel/tienda", label: "Tienda", icon: Store },
  { href: "/panel/cuenta", label: "Cuenta", icon: UserRound },
] as const;

/** Barra inferior en celular y lateral en escritorio. La activa lleva una barra, no solo color. */
export function PanelNav() {
  const path = usePathname();
  const active = (href: string) => (href === "/panel" ? path === "/panel" : path.startsWith(href));
  return (
    <nav
      aria-label="Panel"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg md:static md:border-0 md:bg-transparent"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-6 md:max-w-none md:grid-cols-1 md:gap-1">
        {ITEMS.map((item) => {
          const { href, label, icon: Icon } = item;
          const on = active(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-0.5 text-[0.7rem] font-bold md:min-h-11 md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-3 md:text-base",
                  // Barra de la pestaña activa: arriba en celular, a la izquierda en escritorio.
                  "before:absolute before:rounded-full before:bg-accent before:content-['']",
                  "before:inset-x-3 before:top-0 before:h-1 md:before:inset-x-auto md:before:inset-y-2 md:before:left-0 md:before:h-auto md:before:w-1",
                  on
                    ? "text-ink-b before:block md:bg-surface-2 md:text-fg"
                    : "text-fg-muted before:hidden hover:text-fg md:hover:bg-surface",
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
                {"short" in item ? (
                  <>
                    <span className="md:hidden" aria-hidden="true">
                      {item.short}
                    </span>
                    <span className="sr-only md:not-sr-only">{label}</span>
                  </>
                ) : (
                  <span>{label}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
