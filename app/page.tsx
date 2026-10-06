import Link from "next/link";
import { BarChart3, Link2, MessageCircle, Smartphone } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { StoreCard } from "@/components/store/store-card";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { getActiveStores, getCategories } from "@/lib/public-store";
import { SITE_TAGLINE } from "@/lib/site";

const STEPS = [
  {
    n: 1,
    title: "Crea tu tienda",
    text: "Nombre, WhatsApp y ciudad. Tu tienda queda con link propio.",
  },
  {
    n: 2,
    title: "Sube tus productos",
    text: "Foto desde el celular, precio y descuento. Menos de un minuto cada uno.",
  },
  {
    n: 3,
    title: "Recibe pedidos por WhatsApp",
    text: "Tu cliente arma el carrito y te llega el mensaje con el pedido listo.",
  },
];

const BENEFITS = [
  {
    icon: MessageCircle,
    title: "Sin pasarela de pagos",
    text: "Cobras como ya lo haces. Sin comisiones.",
  },
  {
    icon: Link2,
    title: "Link propio",
    text: "Compártelo en tu estado, Instagram o con un QR.",
  },
  {
    icon: BarChart3,
    title: "Estadísticas simples",
    text: "Visitas, clics en Pedir y lo que vendiste en el mes.",
  },
  {
    icon: Smartphone,
    title: "Hecho para el celular",
    text: "Tú y tus clientes lo usan desde el teléfono.",
  },
];

/** Cómo le llega el pedido al vendedor (datos de ejemplo, marcados como tales). */
function OrderPreview() {
  return (
    <figure
      className="ja-card ja-card--raised gap-3 justify-self-center lg:justify-self-end"
      aria-label="Ejemplo de pedido que llega a WhatsApp"
    >
      <figcaption className="flex items-center justify-between gap-2">
        <span className="ja-label">Así te llega el pedido</span>
        <span className="ja-tag-example">Ejemplo</span>
      </figcaption>
      <div className="max-w-xs rounded-lg rounded-tr-sm bg-status-good-bg p-4 text-sm leading-relaxed text-fg">
        <p>
          Hola, quiero hacer un pedido en <strong>Dulces Marta</strong> 🛍️
        </p>
        <p className="mt-2 font-bold">Pedido:</p>
        <p className="ja-num">• 2 x Torta de chocolate — $ 60.000</p>
        <p className="ja-num">• 1 x Brownie — $ 8.000</p>
        <p className="ja-num mt-2 font-bold">Total: $ 68.000</p>
        <p className="mt-2">
          <strong>Entrega:</strong> Recoger en tienda
        </p>
      </div>
    </figure>
  );
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const category = String((await searchParams).categoria ?? "") || undefined;
  const [stores, categories] = await Promise.all([getActiveStores({ category, limit: 12 }), getCategories()]);

  return (
    <PageShell>
      <section className="ja-topo border-b border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1fr_22rem]">
          <div className="grid gap-6">
            <div className="route-line w-24" aria-hidden="true" />
            <h1 className="ja-display max-w-3xl text-[length:var(--text-display)]">{SITE_TAGLINE}</h1>
            <p className="max-w-2xl text-lg text-fg-muted">
              Un catálogo ordenado con tu propio link. Tus clientes eligen, y el pedido te llega armado a WhatsApp.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/registro" size="lg">
                Crear mi tienda gratis
              </ButtonLink>
              <ButtonLink href="#tiendas" variant="secondary" size="lg">
                Ver tiendas
              </ButtonLink>
            </div>
          </div>
          <OrderPreview />
        </div>
      </section>

      <section id="tiendas" aria-labelledby="tiendas-titulo" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="tiendas-titulo" className="ja-display text-3xl">
            Tiendas activas
          </h2>
          <Link href="/tiendas" className="font-bold text-ink-b underline underline-offset-4">
            Ver todas
          </Link>
        </div>
        <nav aria-label="Filtrar por categoría" className="-mx-4 mb-6 overflow-x-auto px-4">
          <ul className="flex gap-2 pb-1">
            <li>
              <Link
                href="/#tiendas"
                aria-current={!category ? "true" : undefined}
                className={buttonClass(!category ? "primary" : "secondary", "sm", "whitespace-nowrap")}
              >
                Todas
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/?categoria=${c.slug}#tiendas`}
                  aria-current={category === c.slug ? "true" : undefined}
                  className={buttonClass(category === c.slug ? "primary" : "secondary", "sm", "whitespace-nowrap")}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {stores.length === 0 ? (
          <div className="ja-card">
            <p className="font-bold">
              {category ? "Todavía no hay tiendas en esta categoría." : "Todavía no hay tiendas publicadas."}
            </p>
            <p className="text-fg-muted">¿Vendes por WhatsApp? La tuya puede ser la primera.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s, i) => (
              <StoreCard key={s.slug} store={s} index={i} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="como-titulo" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 id="como-titulo" className="ja-display mb-6 text-3xl">
            Cómo funciona
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="ja-card ja-card--raised">
                <p className="ja-card__sign">
                  <span className="ja-bullet ja-bullet--b" aria-hidden="true">
                    {s.n}
                  </span>
                  <span>
                    <span className="sr-only">Paso {s.n}: </span>
                    {s.title}
                  </span>
                </p>
                <p className="text-fg-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="ventajas-titulo" className="mx-auto max-w-6xl px-4 py-12">
        <h2 id="ventajas-titulo" className="ja-display mb-6 text-3xl">
          Ventajas
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="ja-card">
              <Icon aria-hidden="true" className="size-7 text-ink-b" />
              <p className="font-bold">{title}</p>
              <p className="text-fg-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-border bg-fg text-bg">
        <div className="mx-auto grid max-w-6xl justify-items-start gap-4 px-4 py-12">
          <h2 className="ja-display text-3xl">Tu catálogo listo hoy</h2>
          <p className="max-w-xl opacity-90">Es gratis. Solo necesitas un correo y tu número de WhatsApp.</p>
          <Link href="/registro" className="ja-btn ja-btn--lg bg-bg text-fg hover:opacity-90">
            Crear mi tienda gratis
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
