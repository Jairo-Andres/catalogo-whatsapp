-- =============================================================================
-- Catálogo WhatsApp · 1/3 · Esquema (tipos, tablas, índices, triggers)
-- Basado en la sección 9 del documento del proyecto, con estos ajustes:
--   * slugs reservados validados también en la base de datos
--   * índices en todas las llaves foráneas (lo pide el asesor de Supabase)
--   * índice por visitante para el límite de frecuencia de track_event
--   * funciones de trigger sin permiso de ejecución para anon/authenticated
-- =============================================================================

-- ========== Tipos ==========
create type public.user_role as enum ('vendedor', 'admin');
create type public.store_status as enum ('pendiente', 'activa', 'suspendida');
create type public.product_status as enum ('disponible', 'agotado', 'vendido');
create type public.event_type as enum ('visita_tienda', 'visita_producto', 'clic_pedir', 'producto_en_pedido');

-- ========== Perfiles ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'vendedor',
  full_name text check (full_name is null or length(full_name) <= 80),
  created_at timestamptz not null default now()
);

-- Crear el perfil automáticamente al registrarse. El rol nunca viene del cliente.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(new.raw_user_meta_data->>'full_name', 80));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ¿El usuario actual es admin?
create function public.is_admin()
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Evitar que un usuario se cambie el rol a sí mismo
create function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null
     and new.role is distinct from old.role
     and not public.is_admin() then
    raise exception 'No puedes cambiar el rol' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger protect_profile_role_trg
before update on public.profiles
for each row execute function public.protect_profile_role();

-- ========== Categorías de tienda ==========
create table public.store_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

-- Lista inicial sugerida por el documento (decisión pendiente 7).
insert into public.store_categories (name, slug) values
  ('Repostería y panadería', 'reposteria-panaderia'),
  ('Comida y restaurantes', 'comida'),
  ('Tienda de barrio', 'tienda-de-barrio'),
  ('Ropa y accesorios', 'ropa-accesorios'),
  ('Belleza y cuidado personal', 'belleza'),
  ('Artesanías y manualidades', 'artesanias'),
  ('Mascotas', 'mascotas'),
  ('Hogar', 'hogar'),
  ('Tecnología', 'tecnologia'),
  ('Otros', 'otros');

-- ========== Tiendas ==========
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 40)
    check (slug not in ('panel', 'admin', 'login', 'registro', 'tiendas', 'terminos',
                        'privacidad', 'api', '_next', 'static', 'auth', 'salir',
                        'sitemap', 'robots', 'favicon', 'marca')),
  name text not null check (length(name) between 2 and 60),
  description text check (length(description) <= 500),
  category_id uuid references public.store_categories(id),
  city text check (length(city) <= 60),
  address text check (length(address) <= 120),
  whatsapp text not null check (whatsapp ~ '^[0-9]{10,15}$'),
  logo_url text check (length(logo_url) <= 500),
  banner_url text check (length(banner_url) <= 500),
  schedule jsonb,                                   -- fase 2
  offers_delivery boolean not null default false,   -- fase 2
  offers_pickup boolean not null default true,      -- fase 2
  payment_methods text[] not null default '{}',     -- fase 2 (informativo)
  status public.store_status not null default 'pendiente',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stores_status_idx on public.stores (status);
create index stores_category_idx on public.stores (category_id);

-- El vendedor no puede cambiar status, featured ni el dueño
create function public.protect_store_admin_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    if new.status is distinct from old.status
       or new.featured is distinct from old.featured
       or new.owner_id is distinct from old.owner_id then
      raise exception 'Solo un administrador puede cambiar estado, destacado o dueño'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_store_admin_fields_trg
before update on public.stores
for each row execute function public.protect_store_admin_fields();

-- Función genérica para updated_at
create function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger stores_updated_at before update on public.stores
for each row execute function public.set_updated_at();

-- ========== Categorías de producto (fase 2) ==========
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (length(name) between 1 and 40),
  sort_order int not null default 0
);

create index product_categories_store_idx on public.product_categories (store_id);

-- ========== Productos ==========
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete set null,
  name text not null check (length(name) between 2 and 80),
  description text check (length(description) <= 1000),
  price numeric(12,0) not null check (price >= 0),
  sale_price numeric(12,0)
    check (sale_price is null or (sale_price >= 0 and sale_price < price)),
  stock integer check (stock is null or stock >= 0),  -- null = sin control de stock
  is_unique boolean not null default false,           -- producto único
  status public.product_status not null default 'disponible',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_store_idx on public.products (store_id, status);
create index products_category_idx on public.products (category_id);

create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

-- ========== Imágenes de producto ==========
-- MVP: una imagen por producto (position = 0). Fase 2: hasta 4 (validar en la app).
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null check (length(url) <= 500),
  position int not null default 0
);

create index product_images_product_idx on public.product_images (product_id, position);

-- ========== Eventos de analítica ==========
create table public.events (
  id bigint generated always as identity primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  type public.event_type not null,
  source text not null default 'directo',
  visitor_id text not null,
  created_at timestamptz not null default now()
);

create index events_store_date_idx on public.events (store_id, created_at);
create index events_store_type_idx on public.events (store_id, type, created_at);
create index events_product_idx on public.events (product_id, type);
create index events_visitor_idx on public.events (visitor_id, created_at);

-- ========== Ventas ==========
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,                                 -- copia del nombre al vender
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,0) not null check (unit_price >= 0),  -- precio al vender
  created_at timestamptz not null default now()
);

create index sales_store_date_idx on public.sales (store_id, created_at);
create index sales_product_idx on public.sales (product_id);

-- ========== Reportes de clientes (fase 2) ==========
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  reason text not null check (length(reason) between 3 and 100),
  details text check (length(details) <= 500),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index reports_store_idx on public.reports (store_id);
create index reports_product_idx on public.reports (product_id);

-- Las funciones de trigger no se llaman directamente.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;
revoke execute on function public.protect_store_admin_fields() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
