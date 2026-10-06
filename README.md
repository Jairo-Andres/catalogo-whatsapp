# Catálogo WhatsApp

**ES** · Plataforma donde un emprendimiento crea su catálogo con link propio y recibe los pedidos armados en WhatsApp. El cliente no se registra ni paga en la web. Proyecto de portafolio de [Jairo Sierra](https://www.linkedin.com/in/jairo-andres31-analyst) (full-stack, con criterio de QA y seguridad).

**EN** · A platform where small businesses publish a catalog with their own link and receive ready-made orders on WhatsApp. Customers don't sign up or pay on the site. Portfolio project by [Jairo Sierra](https://www.linkedin.com/in/jairo-andres31-analyst). English summary [below](#english).

> El nombre comercial es provisional (decisión pendiente). Se cambia en `lib/site.ts`.

---

## Qué hace (Fase 1, MVP)

| Rol                      | Qué puede hacer                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cliente** (sin cuenta) | Ver tiendas y productos, armar un carrito por tienda y enviar el pedido por WhatsApp.                                                                                   |
| **Vendedor**             | Registrarse, crear su tienda en una pantalla, subir productos con hasta 3 fotos, descuentos, stock y estado, marcar ventas y ver estadísticas. Solo ve y edita lo suyo. |
| **Administrador**        | Ver métricas globales y aprobar, suspender, destacar o eliminar tiendas.                                                                                                |

Rutas: `/` home · `/tiendas` · `/{slug}` tienda · `/{slug}/{producto}` · `/login` · `/registro` · `/panel/*` · `/admin/*` · `/terminos` · `/privacidad`.

## Stack

Next.js 16 (App Router, Server Actions, `proxy.ts`) + TypeScript · Supabase (Postgres 17, Auth, Storage, RLS, funciones SQL) · Tailwind CSS 4 con la identidad visual **Rutas + Cota** (Atkinson Hyperlegible) · Zod · Zustand · Recharts · browser-image-compression · Vitest · Playwright + axe-core · Vercel.

```
Navegador ──► Vercel (Next.js) ──► Supabase (Postgres + RLS, Auth, Storage)
   │
   └──► wa.me/57XXXXXXXXXX?text=…   (abre WhatsApp con el pedido armado)
```

La app solo usa la **publishable key** (pública). La seguridad está en la base de datos: privilegios mínimos por rol y RLS en todas las tablas. **No usa la `service_role` key.**

## Evidencia de calidad

Todo corre en local y en GitHub Actions (`.github/workflows/ci.yml`).

| Verificación                                                                                                    | Comando                                                     | Resultado (6 oct 2026)                                          |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| Lint, tipos y formato                                                                                           | `npm run lint && npm run typecheck && npm run format:check` | sin errores                                                     |
| Unitarias (precios, descuentos, slugs, mensaje de WhatsApp, validaciones)                                       | `npm test`                                                  | 17 pasan                                                        |
| Seguridad de la base (RLS, triggers, funciones, Storage) con 2 vendedores, admin y anónimo                      | `npm run test:db`                                           | 42 pasan en Postgres 16 y en Supabase local (Postgres 17)       |
| Seguridad por la API HTTP real (Auth + PostgREST + Storage)                                                     | `npm run test:api`                                          | 10 pasan                                                        |
| Asesor de seguridad y rendimiento de Supabase                                                                   | `npm run db:advisors`                                       | 0 avisos en local; en la nube solo el esperado de `track_event` |
| Navegador de punta a punta (registro → tienda → producto con 3 fotos → aprobación → carrito → WhatsApp → venta) | `npm run test:e2e`                                          | 9 pasan                                                         |
| Accesibilidad axe WCAG 2.2 A/AA en todas las páginas, 390 y 1280 px, claro y oscuro                             | `npm run test:e2e`                                          | 12 recorridos, 0 incumplimientos, sin desborde horizontal       |

Detalles que prueban las pruebas: un vendedor no puede leer ni cambiar tienda, productos, ventas, eventos ni fotos de otro; nadie se vuelve admin desde el navegador; el vendedor no puede aprobar su propia tienda; una visita cuenta una vez cada 30 minutos y el dueño no cuenta; vender más que el stock se rechaza; la foto de 3000×3000 px se sube como WebP de menos de 260 KB; un producto acepta 3 fotos y la base rechaza la cuarta; el carrusel se mueve con flechas, puntos y deslizando; un carrito de 30 productos cabe en el enlace de WhatsApp.

## Correr en local

Requisitos: Node 22+, Docker (para Supabase local).

```bash
npm install
npx supabase start          # levanta Postgres, Auth, Storage y aplica supabase/migrations
cp .env.example .env.local  # y pega API_URL y PUBLISHABLE_KEY que muestra el comando anterior
npm run dev                 # http://localhost:3000
```

En local la confirmación de correo está apagada (`supabase/config.toml`). Para volverte admin: regístrate y corre esto en Supabase Studio local (http://127.0.0.1:54323, editor SQL) o con `psql`:

```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'TU-CORREO');
```

Pruebas completas: `npx supabase db reset && npm run test:db` (modo Postgres simple con `TEST_DATABASE_URL`, o `TEST_DB_MODE=supabase`), `npm run test:api`, y `npx supabase db reset && npm run build && npm run test:e2e`.

## Despliegue (planes gratis)

1. **Supabase**: crea un proyecto **nuevo**, separado del de la API de datos abiertos (aquí hay datos personales de vendedores). Región sugerida: `us-east-1`.
2. **Migraciones**: `npx supabase login`, `npx supabase link --project-ref TU-REF` y `npx supabase db push`. O pega en el editor SQL, en orden, los 5 archivos de `supabase/migrations/`. El bucket `catalogo` y sus políticas se crean ahí mismo. El proyecto actual (`faminwczhvkfnscmdhui`) ya las tiene aplicadas con el conector de Supabase, con otras fechas de versión: no corras `db push` sobre él sin antes `npx supabase migration repair`.
3. **Auth → URL Configuration**: _Site URL_ = tu URL de Vercel; _Redirect URLs_ = `https://TU-APP.vercel.app/auth/callback` y `http://localhost:3000/**`.
4. **Auth → Email**: la confirmación de correo viene encendida. El correo integrado de Supabase tiene un límite bajo de envíos por hora (verificar el valor actual en el panel); para un piloto real configura un SMTP propio. El enlace de confirmación debe abrirse en el mismo navegador donde se hizo el registro.
5. **Vercel**: importa el repositorio (framework Next.js) y agrega `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `NEXT_PUBLIC_SITE_URL`. Cada push a la rama principal despliega solo.
6. **Admin**: regístrate en la web y corre el SQL de arriba en el editor SQL de Supabase.
7. **Tienda demo** para quien visite el portafolio: crea una cuenta de vendedor, sube 4 a 6 productos marcados como ejemplo y apruébala desde `/admin/tiendas`.
8. **Asesor**: en Supabase, _Advisors → Security_ y _Performance_. Queda un solo aviso esperado: `track_event` es `security definer` y la puede llamar un visitante anónimo a propósito, porque es la única vía para registrar visitas (valida tienda, producto, visitante y frecuencia). Las funciones de ayuda de la RLS viven en el esquema `private`, que la API no expone. El índice sin uso es informativo mientras la base esté vacía.

## Qué revisar si algo se cae

| Síntoma                                               | Qué revisar                                                                                                                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| La web muestra "Algo salió mal" o tarda mucho         | ¿El proyecto de Supabase está **pausado**? En el plan gratis se pausa tras unos días sin actividad: entra al panel y dale _Restore_. Luego revisa _Logs → API_.                |
| Error al arrancar: "Faltan NEXT_PUBLIC_SUPABASE_URL…" | Variables de entorno en Vercel (_Settings → Environment Variables_) y vuelve a desplegar.                                                                                      |
| Las fotos no cargan                                   | `NEXT_PUBLIC_SUPABASE_URL` debe ser el mismo proyecto donde está el bucket `catalogo` (`next.config.ts` solo permite ese host). Revisa en _Storage_ que el bucket sea público. |
| El registro no envía el correo                        | Límite de correos del plan gratis o SMTP. _Auth → Logs_. Mientras tanto, desde el panel puedes confirmar al usuario a mano.                                                    |
| El enlace del correo lleva a `/login?error=enlace`    | Falta la URL en _Redirect URLs_ o se abrió en otro navegador.                                                                                                                  |
| Un vendedor no ve su tienda en el home                | Está `pendiente`: apruébala en `/admin/tiendas`.                                                                                                                               |
| Las estadísticas salen en cero                        | Las visitas solo cuentan en tiendas activas, una vez cada 30 min por visitante, y nunca las del dueño con sesión iniciada.                                                     |
| `test:e2e` falla en local                             | ¿Corriste `npx supabase db reset` y `npm run build` antes?                                                                                                                     |

## Decisiones (sección 20 del documento)

Valores sugeridos por el documento, a confirmar:

1. **Nombre y dominio**: pendiente; nombre provisional "Catálogo WhatsApp" y dominio de Vercel.
2. **Aprobación de tiendas**: manual por el admin (las tiendas nacen `pendiente`).
3. **Límites**: 60 productos por tienda, hasta 3 fotos por producto (pedido de Jairo; el documento sugería 1 en el MVP y 4 en fase 2), fotos de máximo 2 MB en el bucket (la app las comprime a ~200 KB).
4. **Una tienda por vendedor** (restricción `unique` en la base).
5. **Retención de eventos**: sin borrado automático por ahora; cuando la tabla crezca, resumen diario y 90 días de eventos crudos.
6. **Monetización**: gratis.
7. **Categorías de tienda**: la lista inicial del documento.
8. **Login con Google**: después del MVP.
9. **Identidad visual**: la del portafolio, "Rutas + Cota", sin cambios (`app/tokens.css` y `app/components.css` son copias exactas).

## Cambios frente al documento y por qué

- **Seguridad más estricta**: privilegios por rol además de RLS; una política por acción; slugs reservados validados en la base; el vendedor tampoco puede cambiar el dueño de la tienda; `track_event` exige que el producto sea de la misma tienda y limita a 120 eventos por visitante cada 10 minutos; `mark_product_sold` no vende dos veces un producto único; el bucket no permite listar archivos ajenos y solo acepta imágenes de hasta 2 MB; el formulario público de reportes queda para la fase 2 (sin él, nadie puede insertar reportes).
- **Componentes**: en vez de instalar shadcn/ui se usan componentes propios pequeños con las clases `ja-*` de la marca (mismo enfoque de copiar el código al proyecto, sin otra capa de estilos). **Animaciones** con CSS y los tokens de duración (que bajan a 0 con `prefers-reduced-motion`) en vez de Framer Motion.
- **Fase 1 sin**: QR, variantes, reportes de clientes (fase 2). Render no se usa.

## Privacidad

Del cliente no se guardan datos personales: su nombre y la nota solo viajan en el mensaje de WhatsApp. La analítica usa un ID aleatorio del navegador, sin IP. Los textos legales son un borrador que debe revisar alguien con conocimiento legal antes de un piloto con vendedores reales (Ley 1581 de 2012).

---

## English

**What it is.** Sellers sign up, create a store in one screen, upload products (photo compressed to WebP in the browser, price, discount, stock, status) and get a public link. Customers browse, build a per-store cart and tap "Order on WhatsApp", which opens `wa.me` with the order already written. Sellers mark sales to see revenue; an admin approves, suspends or features stores.

**Stack.** Next.js 16 + TypeScript on Vercel; Supabase Postgres with row-level security, Auth and Storage; Tailwind 4 with the portfolio's "Rutas + Cota" design system; Vitest, Playwright and axe-core. Only the public publishable key is used; there is no service-role key in the app.

**Evidence.** 17 unit tests; 42 database security tests (two sellers, an admin and an anonymous visitor) on plain Postgres and on local Supabase; 10 security tests through Supabase's real HTTP API; Supabase security and performance advisors clean; 9 end-to-end browser tests of the full flow; axe WCAG 2.2 A/AA with zero violations on every page at 390 and 1280 px, light and dark. All of it runs in GitHub Actions.

**Run locally.** `npm install`, `npx supabase start`, copy `.env.example` to `.env.local` with the printed URL and publishable key, `npm run dev`.

**Deploy.** New Supabase project → `supabase db push` (or paste the 5 migrations) → set Auth Site URL and redirect `/auth/callback` → import into Vercel with the 3 env vars → sign up and promote yourself to admin with the SQL above.

**If something goes down.** Check whether the free Supabase project is paused (restore it), the Vercel env vars, the Auth redirect URLs, and the email sending limit. See the Spanish table above for the full checklist.

**Contact.** [LinkedIn](https://www.linkedin.com/in/jairo-andres31-analyst).
