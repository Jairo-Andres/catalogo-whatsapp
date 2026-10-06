import Link from "next/link";
import { ArrowRight, Check, Link2, MessageCircleHeart, ShoppingBag, Store } from "lucide-react";
import { Shape } from "@/components/decor";
import { PageShell } from "@/components/page-shell";
import { StoreCard } from "@/components/store/store-card";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { getActiveStores, getCategories } from "@/lib/public-store";

const STEPS = [
  {
    title: "Crea tu tienda",
    text: "Sube tus productos con una foto y el precio. Tu catálogo queda ordenado en tu propio link.",
    icon: Store,
    tile: "mt-icon-tile--b",
  },
  {
    title: "Comparte tu link",
    text: "Pásalo por WhatsApp, Instagram o donde hables con tus clientes.",
    icon: Link2,
    tile: "mt-icon-tile--d",
  },
  {
    title: "Recibe el pedido armado",
    text: "Tus clientes eligen y el pedido te llega a WhatsApp con productos, cantidades y total.",
    icon: MessageCircleHeart,
    tile: "mt-icon-tile--q",
  },
];

const CHECKS = ["Gratis para empezar", "Sin comisiones", "Link propio", "Listo en minutos", "Celular y computador"];

/** Celular con una tienda y tarjetas flotantes. Todo son datos de ejemplo y lo dice. */
function HeroPreview() {
  return (
    <div
      role="img"
      aria-label="Ejemplo: una tienda en el celular, un producto con descuento, un pedido nuevo y las visitas del día"
      className="relative mx-auto h-[25rem] w-full max-w-[26rem] sm:h-[28rem]"
    >
      <Shape kind="sphere-q" bob="fast" className="right-[24%] -top-2 size-14" />
      <Shape kind="cube-d" bob="slow" className="right-0 top-2 size-16" />
      <div className="absolute left-1/2 top-6 -translate-x-1/2">
        <div className="mt-phone">
          <div className="mt-phone__screen">
            <div className="h-16 rounded-xl bg-[conic-gradient(from_200deg_at_70%_100%,#f58a2b,#e2407f,#f7f1e8_60%)]" />
            <p className="font-display text-sm font-black leading-tight">Repostería Demo</p>
            <p className="-mt-2 font-mono text-[0.6rem] text-[#5c636b]">Repostería · Bogotá</p>
            {[
              ["Torta", "$ 48.000", "bg-[#f9d6e2]"],
              ["Cupcakes x 6", "$ 36.000", "bg-[#d6e3fb]"],
            ].map(([n, p, bg]) => (
              <div key={n} className="grid gap-1 rounded-xl bg-[#fff] p-1.5 shadow-sm">
                <div className={`h-10 rounded-lg ${bg}`} />
                <p className="text-[0.65rem] font-bold leading-none">{n}</p>
                <p className="font-mono text-[0.6rem] leading-none">{p}</p>
                <div className="h-2.5 rounded-full bg-[#1959d1]" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute left-0 top-10 hidden rotate-[-4deg] rounded-2xl sm:block bg-[#fff] p-3 pr-4 text-[#1a1d21] shadow-lg">
        <span className="ja-tag-example mt-example">Ejemplo</span>
        <p className="text-xs font-bold">Torta de chocolate</p>
        <p className="flex items-center gap-1.5 font-mono text-sm font-bold">
          $ 48.000 <span className="tag-discount rounded-full">-20%</span>
        </p>
      </div>
      <div className="absolute right-0 top-[45%] w-48 rotate-[3deg] rounded-2xl bg-[var(--mt-mint)] p-3 text-[var(--mt-on-mint)] shadow-lg">
        <span className="ja-tag-example mt-example">Ejemplo</span>
        <p className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wide">
          <span className="size-2 rounded-full bg-current" /> Nuevo pedido
        </p>
        <p className="mt-1 text-xs">• 2 x Torta de chocolate</p>
        <p className="text-xs">• 1 x Cupcakes x 6</p>
        <p className="mt-1 text-xs font-bold">Total: $ 132.000 · Domicilio</p>
      </div>
      <div className="absolute bottom-0 right-4 hidden rotate-[-3deg] sm:flex items-center gap-2 rounded-2xl bg-[#fff] px-3 py-2 text-[#1a1d21] shadow-lg">
        <span className="ja-tag-example mt-example">Ejemplo</span>
        <span className="font-mono text-2xl font-bold">38</span>
        <span className="text-[0.65rem] leading-tight text-[#5c636b]">
          visitas
          <br />
          hoy
        </span>
        <svg viewBox="0 0 48 20" className="h-5 w-12" aria-hidden="true">
          <path d="M1 17 L12 11 L20 14 L32 5 L47 2" fill="none" stroke="#1959d1" strokeWidth="2.5" />
        </svg>
      </div>
      <span
        aria-hidden="true"
        className="mt-icon-tile mt-icon-tile--b absolute bottom-10 left-2 size-20 rotate-[-8deg] rounded-3xl"
      >
        <ShoppingBag className="size-9" />
      </span>
    </div>
  );
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const category = String((await searchParams).categoria ?? "") || undefined;
  const [stores, categories] = await Promise.all([getActiveStores({ category, limit: 12 }), getCategories()]);
  const demo = stores[0]?.slug;

  return (
    <PageShell>
      <div className="px-3 pt-4 sm:px-4">
        <section className="mt-hero mx-auto max-w-[78rem]" aria-labelledby="hero-titulo">
          <Shape kind="sphere-b" bob="slow" className="bottom-8 left-[46%] hidden size-10 lg:block" />
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1.1fr_1fr]">
            <div className="grid gap-6">
              <div className="mt-tricolor" aria-hidden="true" />
              <h1 id="hero-titulo" className="ja-display text-[length:var(--text-display)]">
                Crea tu catálogo y recibe pedidos por{" "}
                <span className="mt-underline whitespace-nowrap text-[var(--mt-wa-ink)]">WhatsApp</span>.
              </h1>
              <p className="mt-muted max-w-xl text-lg">
                Sube tus productos con una foto, comparte tu link y recibe el pedido armado: productos, cantidades y
                total.
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/registro" size="lg">
                  Crear mi tienda gratis <ArrowRight aria-hidden="true" className="size-5" />
                </ButtonLink>
                <Link href={demo ? `/${demo}` : "/tiendas"} className={buttonClass("secondary", "lg", "mt-btn-night")}>
                  Ver una tienda
                </Link>
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {CHECKS.map((c) => (
                  <li key={c} className="mt-muted flex items-center gap-1.5">
                    <Check aria-hidden="true" className="size-4 text-[var(--mt-wa-ink)]" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <HeroPreview />
          </div>
        </section>
      </div>

      <section
        id="como-funciona"
        aria-labelledby="como-titulo"
        className="mx-auto max-w-6xl scroll-mt-4 px-4 pb-6 pt-16"
      >
        <p className="ja-label">Cómo funciona</p>
        <h2 id="como-titulo" className="ja-display mb-8 mt-2 max-w-xl text-3xl sm:text-4xl">
          De tus productos al pedido, en tres pasos
        </h2>
        <ol className="grid gap-5 md:grid-cols-3">
          {STEPS.map(({ title, text, icon: Icon, tile }, i) => (
            <li key={title} className="mt-card grid content-start gap-3">
              <div className="flex items-start justify-between">
                <span className={`mt-icon-tile ${tile}`} aria-hidden="true">
                  <Icon className="size-5" />
                </span>
                <span className="font-mono text-lg font-bold text-fg-muted" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-display text-xl font-black">
                <span className="sr-only">Paso {i + 1}: </span>
                {title}
              </h3>
              <p className="text-fg-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="tiendas" aria-labelledby="tiendas-titulo" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-12">
        <p className="ja-label">Tiendas</p>
        <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-3">
          <h2 id="tiendas-titulo" className="ja-display text-3xl sm:text-4xl">
            Tiendas activas
          </h2>
          <Link
            href="/tiendas"
            className="inline-flex min-h-11 items-center font-bold text-ink-b underline-offset-4 hover:underline"
          >
            Ver todas
          </Link>
        </div>
        <nav aria-label="Filtrar por categoría" className="mb-6">
          <ul className="flex flex-wrap gap-2">
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
          <div className="mt-card grid gap-1">
            <p className="font-bold">
              {category ? "Todavía no hay tiendas en esta categoría." : "Todavía no hay tiendas publicadas."}
            </p>
            <p className="text-fg-muted">¿Vendes por WhatsApp? La tuya puede ser la primera.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s, i) => (
              <StoreCard key={s.slug} store={s} index={i} />
            ))}
          </ul>
        )}
      </section>

      <section className="px-4 pb-14">
        <div className="mt-cta mx-auto grid max-w-6xl items-center gap-6 px-6 py-10 sm:px-12 md:grid-cols-[1fr_auto]">
          <Shape kind="sphere-d" className="-right-8 -top-10 hidden size-36 md:block" />
          <Shape kind="cube-q" className="-bottom-8 left-[45%] size-20" />
          <div className="grid gap-2">
            <h2 className="ja-display text-3xl sm:text-4xl">Abre tu tienda en minutos</h2>
            <p className="max-w-xl text-[#fff]/90">
              Sube tus productos, comparte tu link y empieza a recibir pedidos armados en WhatsApp.
            </p>
          </div>
          <Link href="/registro" className={buttonClass("primary", "lg", "mt-btn-yellow justify-self-start")}>
            Crear mi tienda gratis
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
