-- =============================================================================
-- Catálogo WhatsApp · 4/4 · Funciones de ayuda fuera de la API
-- El asesor de Supabase (lints 0028 y 0029) avisa que las funciones
-- security definer de "public" se pueden llamar como /rest/v1/rpc/...
--   * is_admin, owns_store, can_see_store, product_store_id e is_my_store_folder
--     solo las usan las políticas: pasan al esquema "private", que la API no expone.
--   * admin_overview y admin_stores pasan a security invoker: la RLS ya deja
--     al admin ver todo y siguen rechazando a quien no es admin.
--   * track_event sigue siendo security definer y pública a propósito: es la
--     única forma de registrar eventos (events no tiene política de INSERT).
-- Las políticas apuntan a las funciones por OID, así que siguen funcionando.
-- =============================================================================

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

alter function public.is_admin() set schema private;
alter function public.owns_store(uuid) set schema private;
alter function public.can_see_store(uuid) set schema private;
alter function public.product_store_id(uuid) set schema private;
alter function public.is_my_store_folder(text) set schema private;

-- Los cuerpos que nombraban public.is_admin() se reescriben.
create or replace function private.owns_store(p_store_id uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.stores s
    where s.id = p_store_id and s.owner_id = (select auth.uid())
  ) or private.is_admin();
$$;

create or replace function private.can_see_store(p_store_id uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.stores s
    where s.id = p_store_id
      and (s.status = 'activa' or s.owner_id = (select auth.uid()))
  ) or private.is_admin();
$$;

create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null
     and new.role is distinct from old.role
     and not private.is_admin() then
    raise exception 'No puedes cambiar el rol' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.protect_store_admin_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null and not private.is_admin() then
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

create or replace function public.admin_overview()
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
  return jsonb_build_object(
    'vendedores',          (select count(*) from public.profiles where role = 'vendedor'),
    'tiendas_activas',     (select count(*) from public.stores where status = 'activa'),
    'tiendas_pendientes',  (select count(*) from public.stores where status = 'pendiente'),
    'tiendas_suspendidas', (select count(*) from public.stores where status = 'suspendida'),
    'productos',           (select count(*) from public.products),
    'visitas_30d',         (select count(*) from public.events
                             where type = 'visita_tienda' and created_at > now() - interval '30 days'),
    'clics_pedir_30d',     (select count(*) from public.events
                             where type = 'clic_pedir' and created_at > now() - interval '30 days'),
    'ventas_30d',          (select coalesce(sum(quantity * unit_price), 0) from public.sales
                             where created_at > now() - interval '30 days'),
    'reportes_pendientes', (select count(*) from public.reports where resolved = false),
    'fotos_mb',            (select round(coalesce(sum((o.metadata->>'size')::bigint), 0) / 1048576.0, 1)
                             from storage.objects o where o.bucket_id = 'catalogo')
  );
end;
$$;

create or replace function public.admin_stores()
returns table (id uuid, slug text, name text, city text, status public.store_status,
               featured boolean, created_at timestamptz, products bigint, visits_30d bigint)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
  return query
    select s.id, s.slug, s.name, s.city, s.status, s.featured, s.created_at,
           (select count(*) from public.products p where p.store_id = s.id),
           (select count(*) from public.events e
             where e.store_id = s.id and e.type = 'visita_tienda'
               and e.created_at > now() - interval '30 days')
    from public.stores s
    order by (s.status = 'pendiente') desc, s.created_at desc;
end;
$$;

-- Permisos (create or replace conserva los de antes; se repiten por claridad).
revoke execute on all functions in schema private from public;
grant execute on function private.can_see_store(uuid), private.product_store_id(uuid),
                          private.is_admin() to anon, authenticated;
grant execute on function private.owns_store(uuid), private.is_my_store_folder(text) to authenticated;
