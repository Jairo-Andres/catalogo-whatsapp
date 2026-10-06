-- =============================================================================
-- Catálogo WhatsApp · 2/3 · Privilegios, RLS y Storage
-- Basado en la sección 10 del documento, con estos ajustes:
--   * privilegios mínimos por rol (además de RLS): anon solo lee lo público
--   * (select auth.uid()) en las políticas, para que Postgres lo evalúe una vez
--   * una sola política permisiva por tabla y acción (evita el aviso
--     "multiple permissive policies" del asesor de Supabase)
--   * reports: sin INSERT público en el MVP (el formulario es fase 2)
--   * Storage: sin política de SELECT pública (un bucket público no la necesita
--     para servir imágenes, y así nadie puede listar todos los archivos);
--     tipos y tamaño limitados en el bucket
-- =============================================================================

-- ========== Privilegios por rol ==========
-- Supabase da todos los privilegios sobre public a anon y authenticated;
-- aquí se recortan a lo necesario. RLS sigue siendo la segunda barrera.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.store_categories, public.stores, public.products,
                public.product_images, public.product_categories
  to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant insert, update, delete on public.stores to authenticated;
grant insert, update, delete on public.products, public.product_images,
                                public.product_categories to authenticated;
grant insert, update, delete on public.store_categories to authenticated;   -- solo admin (RLS)
grant select on public.events to authenticated;                             -- inserta track_event
grant select, insert on public.sales to authenticated;
grant select, update, delete on public.reports to authenticated;           -- solo admin (RLS)

-- ========== RLS en todas las tablas ==========
alter table public.profiles enable row level security;
alter table public.store_categories enable row level security;
alter table public.stores enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.events enable row level security;
alter table public.sales enable row level security;
alter table public.reports enable row level security;

-- Ayuda: ¿la tienda es del usuario actual (o es admin)?
create function public.owns_store(p_store_id uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.stores s
    where s.id = p_store_id and s.owner_id = (select auth.uid())
  ) or public.is_admin();
$$;

-- ¿La tienda es visible para el usuario actual? (activa, propia o admin)
create function public.can_see_store(p_store_id uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.stores s
    where s.id = p_store_id
      and (s.status = 'activa' or s.owner_id = (select auth.uid()))
  ) or public.is_admin();
$$;

-- ===== profiles =====
create policy "perfil: leer propio o admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "perfil: actualizar propio o admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- ===== store_categories =====
create policy "categorías de tienda: lectura pública" on public.store_categories
  for select to anon, authenticated using (true);
create policy "categorías de tienda: crear admin" on public.store_categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "categorías de tienda: editar admin" on public.store_categories
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "categorías de tienda: borrar admin" on public.store_categories
  for delete to authenticated using ((select public.is_admin()));

-- ===== stores =====
create policy "tienda: leer activas, propia o admin" on public.stores
  for select to anon, authenticated
  using (status = 'activa' or owner_id = (select auth.uid()) or (select public.is_admin()));
create policy "tienda: crear la propia (queda pendiente)" on public.stores
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'pendiente' and featured = false);
create policy "tienda: editar propia o admin" on public.stores
  for update to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()))
  with check (owner_id = (select auth.uid()) or (select public.is_admin()));
create policy "tienda: eliminar admin" on public.stores
  for delete to authenticated using ((select public.is_admin()));

-- ===== products =====
create policy "producto: leer de tiendas visibles" on public.products
  for select to anon, authenticated using (public.can_see_store(store_id));
create policy "producto: crear en mi tienda" on public.products
  for insert to authenticated with check (public.owns_store(store_id));
create policy "producto: editar en mi tienda" on public.products
  for update to authenticated
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));
create policy "producto: borrar en mi tienda" on public.products
  for delete to authenticated using (public.owns_store(store_id));

-- ===== product_categories (misma lógica que products) =====
create policy "cat. producto: lectura" on public.product_categories
  for select to anon, authenticated using (public.can_see_store(store_id));
create policy "cat. producto: crear en mi tienda" on public.product_categories
  for insert to authenticated with check (public.owns_store(store_id));
create policy "cat. producto: editar en mi tienda" on public.product_categories
  for update to authenticated
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));
create policy "cat. producto: borrar en mi tienda" on public.product_categories
  for delete to authenticated using (public.owns_store(store_id));

-- ===== product_images =====
create function public.product_store_id(p_product_id uuid)
returns uuid language sql security definer stable set search_path = '' as $$
  select store_id from public.products where id = p_product_id;
$$;

create policy "imagen: lectura" on public.product_images
  for select to anon, authenticated
  using (public.can_see_store(public.product_store_id(product_id)));
create policy "imagen: crear en mi tienda" on public.product_images
  for insert to authenticated
  with check (public.owns_store(public.product_store_id(product_id)));
create policy "imagen: editar en mi tienda" on public.product_images
  for update to authenticated
  using (public.owns_store(public.product_store_id(product_id)))
  with check (public.owns_store(public.product_store_id(product_id)));
create policy "imagen: borrar en mi tienda" on public.product_images
  for delete to authenticated
  using (public.owns_store(public.product_store_id(product_id)));

-- ===== events =====
-- Sin política de INSERT: los eventos se registran solo con la función track_event.
create policy "evento: leer los de mi tienda o admin" on public.events
  for select to authenticated using (public.owns_store(store_id));

-- ===== sales =====
create policy "venta: leer las de mi tienda o admin" on public.sales
  for select to authenticated using (public.owns_store(store_id));
-- Solo el dueño (no el admin) registra ventas; lo normal es hacerlo con mark_product_sold.
create policy "venta: registrar en mi tienda" on public.sales
  for insert to authenticated
  with check (exists (select 1 from public.stores s
                      where s.id = sales.store_id and s.owner_id = (select auth.uid())));

-- ===== reports (fase 2: el formulario público se agrega con su RPC y límite) =====
create policy "reporte: admin lee" on public.reports
  for select to authenticated using ((select public.is_admin()));
create policy "reporte: admin edita" on public.reports
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "reporte: admin borra" on public.reports
  for delete to authenticated using ((select public.is_admin()));

-- ========== Storage (fotos) ==========
-- Bucket público "catalogo": {store_id}/productos/{archivo}.webp y {store_id}/marca/{archivo}.webp
-- Máximo 2 MB por archivo (la app comprime a ~200 KB) y solo imágenes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalogo', 'catalogo', true, 2097152,
        array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create function public.is_my_store_folder(p_name text)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.stores s
    where s.owner_id = (select auth.uid())
      and s.id::text = (storage.foldername(p_name))[1]
  );
$$;

-- El dueño necesita SELECT sobre sus propios archivos para reemplazarlos o borrarlos.
create policy "catalogo: ver mis archivos" on storage.objects
  for select to authenticated
  using (bucket_id = 'catalogo' and public.is_my_store_folder(name));

create policy "catalogo: subir en la carpeta de mi tienda" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'catalogo' and public.is_my_store_folder(name));

create policy "catalogo: actualizar en mi carpeta" on storage.objects
  for update to authenticated
  using (bucket_id = 'catalogo' and public.is_my_store_folder(name))
  with check (bucket_id = 'catalogo' and public.is_my_store_folder(name));

create policy "catalogo: borrar en mi carpeta" on storage.objects
  for delete to authenticated
  using (bucket_id = 'catalogo' and public.is_my_store_folder(name));

-- Las funciones de ayuda las usan las políticas; anon solo necesita las de lectura.
revoke execute on function public.owns_store(uuid) from public, anon;
revoke execute on function public.is_my_store_folder(text) from public, anon;
grant execute on function public.owns_store(uuid), public.is_my_store_folder(text) to authenticated;
grant execute on function public.can_see_store(uuid), public.product_store_id(uuid),
                          public.is_admin() to anon, authenticated;
