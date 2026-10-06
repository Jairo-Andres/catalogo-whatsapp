"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Package, Receipt, Store } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/panel", label: "Resumen", icon: Home },
  { href: "/panel/productos", label: "Productos", icon: Package },
  { href: "/panel/ventas", label: "Ventas", icon: Receipt },
  { href: "/panel/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/panel/tienda", label: "Tienda", icon: Store },
] as const;

/** Barra inferior en celular y lateral en escritorio. */
export function PanelNav() {
  const path = usePathname();
  const active = (href: string) => (href === "/panel" ? path === "/panel" : path.startsWith(href));
  return (
    <nav
      aria-label="Panel"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg md:static md:border-0 md:bg-transparent"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 md:max-w-none md:grid-cols-1 md:gap-1">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs font-bold md:min-h-11 md:flex-row md:justify-start md:gap-3 md:rounded-md md:px-3 md:text-base",
                active(href)
                  ? "text-ink-b md:bg-surface-2 md:text-fg"
                  : "text-fg-muted hover:text-fg md:hover:bg-surface",
              )}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
