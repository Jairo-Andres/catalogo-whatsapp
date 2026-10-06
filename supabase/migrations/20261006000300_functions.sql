-- =============================================================================
-- Catálogo WhatsApp · 3/3 · Funciones (RPC)
-- Basado en la sección 11 del documento, con estos ajustes:
--   * track_event: el producto debe ser de la misma tienda, el tipo debe traer
--     producto cuando corresponde, y hay un tope de eventos por visitante
--   * mark_product_sold: no vende productos ya vendidos ni agotados
--   * estadísticas: días/meses acotados; las de admin verifican is_admin()
-- =============================================================================

-- ===== Registrar evento (anónimo permitido) =====
create function public.track_event(
  p_store_id uuid,
  p_type public.event_type,
  p_visitor_id text,
  p_product_id uuid default null,
  p_source text default 'directo'
)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_status public.store_status;
  v_source text;
begin
  select owner_id, status into v_owner, v_status
  from public.stores where id = p_store_id;

  if not found or v_status <> 'activa' then return; end if;
  if (select auth.uid()) is not null and (select auth.uid()) = v_owner then return; end if;  -- no contar al dueño
  if p_visitor_id is null or length(p_visitor_id) not between 8 and 64
     or p_visitor_id !~ '^[A-Za-z0-9_-]+$' then return; end if;

  -- Los eventos de producto necesitan un producto de esta misma tienda.
  if p_type in ('visita_producto', 'producto_en_pedido') then
    if p_product_id is null or not exists (
      select 1 from public.products p where p.id = p_product_id and p.store_id = p_store_id
    ) then return; end if;
  elsif p_product_id is not null then
    p_product_id := null;
  end if;

  v_source := case when p_source in ('whatsapp', 'instagram', 'facebook', 'qr', 'directo')
                   then p_source else 'directo' end;

  -- Tope anti-bots: máximo 120 eventos por visitante en 10 minutos (un carrito
  -- de 30 productos genera 31 eventos en un pedido).
  if (select count(*) from public.events e
      where e.visitor_id = p_visitor_id
        and e.created_at > now() - interval '10 minutes') >= 120 then
    return;
  end if;

  -- Evitar duplicados de visitas en 30 minutos
  if p_type in ('visita_tienda', 'visita_producto') and exists (
    select 1 from public.events e
    where e.store_id = p_store_id
      and e.visitor_id = p_visitor_id
      and e.type = p_type
      and e.product_id is not distinct from p_product_id
      and e.created_at > now() - interval '30 minutes'
  ) then
    return;
  end if;

  insert into public.events (store_id, product_id, type, source, visitor_id)
  values (p_store_id, p_product_id, p_type, v_source, p_visitor_id);
end;
$$;

-- ===== Marcar producto como vendido =====
create function public.mark_product_sold(p_product_id uuid, p_quantity int default 1)
returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v public.products%rowtype;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 10000 then
    raise exception 'La cantidad debe estar entre 1 y 10000' using errcode = '22023';
  end if;

  select * into v from public.products where id = p_product_id for update;
  if not found then raise exception 'Producto no encontrado' using errcode = 'P0002'; end if;

  if not exists (
    select 1 from public.stores s
    where s.id = v.store_id and s.owner_id = (select auth.uid())
  ) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if v.status = 'vendido' then
    raise exception 'El producto ya está vendido' using errcode = '22023';
  end if;
  if v.is_unique and p_quantity <> 1 then
    raise exception 'Un producto único se vende de a 1' using errcode = '22023';
  end if;
  if v.stock is not null and p_quantity > v.stock then
    raise exception 'La cantidad supera el stock disponible' using errcode = '22023';
  end if;

  insert into public.sales (store_id, product_id, product_name, quantity, unit_price)
  values (v.store_id, v.id, v.name, p_quantity, coalesce(v.sale_price, v.price));

  if v.is_unique then
    update public.products set status = 'vendido', stock = 0 where id = v.id;
  elsif v.stock is not null then
    update public.products
    set stock = stock - p_quantity,
        status = case when stock - p_quantity <= 0
                      then 'agotado'::public.product_status else status end
    where id = v.id;
  end if;
end;
$$;

-- ===== Visitas y clics por día (tienda) =====
-- security invoker: la RLS de events solo deja ver los de la tienda propia.
create function public.stats_by_day(p_store_id uuid, p_days int default 30)
returns table (day date, visitors bigint, order_clicks bigint)
language sql stable security invoker set search_path = '' as $$
  with days as (
    select generate_series(
             (now() at time zone 'America/Bogota')::date - (least(greatest(p_days, 1), 90) - 1),
             (now() at time zone 'America/Bogota')::date,
             interval '1 day'
           )::date as day
  ),
  ev as (
    select (e.created_at at time zone 'America/Bogota')::date as day, e.type, e.visitor_id
    from public.events e
    where e.store_id = p_store_id
      and e.created_at >= ((select min(day) from days)::timestamp at time zone 'America/Bogota')
  )
  select d.day,
         count(distinct ev.visitor_id) filter (where ev.type = 'visita_tienda') as visitors,
         count(ev.type) filter (where ev.type = 'clic_pedir') as order_clicks
  from days d
  left join ev on ev.day = d.day
  group by d.day
  order by d.day;
$$;

-- ===== Resumen para las tarjetas del panel del vendedor =====
create function public.store_summary(p_store_id uuid)
returns jsonb
language sql stable security invoker set search_path = '' as $$
  with today as (
    select ((now() at time zone 'America/Bogota')::date::timestamp at time zone 'America/Bogota') as start
  )
  select jsonb_build_object(
    'visitas_hoy', (select count(distinct visitor_id) from public.events, today
                    where store_id = p_store_id and type = 'visita_tienda' and created_at >= today.start),
    'visitas_7d',  (select count(*) from public.events
                    where store_id = p_store_id and type = 'visita_tienda'
                      and created_at > now() - interval '7 days'),
    'visitas_30d', (select count(*) from public.events
                    where store_id = p_store_id and type = 'visita_tienda'
                      and created_at > now() - interval '30 days'),
    'clics_pedir_30d', (select count(*) from public.events
                        where store_id = p_store_id and type = 'clic_pedir'
                          and created_at > now() - interval '30 days'),
    'unidades_vendidas_30d', (select coalesce(sum(quantity), 0) from public.sales
                              where store_id = p_store_id and created_at > now() - interval '30 days'),
    'total_vendido_30d', (select coalesce(sum(quantity * unit_price), 0) from public.sales
                          where store_id = p_store_id and created_at > now() - interval '30 days'),
    'total_vendido_mes', (select coalesce(sum(quantity * unit_price), 0) from public.sales
                          where store_id = p_store_id
                            and created_at >= (date_trunc('month', now() at time zone 'America/Bogota')
                                               at time zone 'America/Bogota'))
  );
$$;

-- ===== Top productos =====
create function public.stats_top_products(p_store_id uuid, p_days int default 30)
returns table (product_id uuid, name text, views bigint, in_orders bigint)
language sql stable security invoker set search_path = '' as $$
  select
    p.id,
    p.name,
    count(e.id) filter (where e.type = 'visita_producto') as views,
    count(e.id) filter (where e.type = 'producto_en_pedido') as in_orders
  from public.products p
  left join public.events e
    on e.product_id = p.id
   and e.created_at > now() - make_interval(days => least(greatest(p_days, 1), 365))
  where p.store_id = p_store_id
  group by p.id, p.name
  order by views desc, in_orders desc, p.name
  limit 10;
$$;

-- ===== Ventas por mes (tienda) =====
create function public.stats_sales_by_month(p_store_id uuid, p_months int default 6)
returns table (month date, units bigint, revenue numeric)
language sql stable security invoker set search_path = '' as $$
  select
    date_trunc('month', s.created_at at time zone 'America/Bogota')::date as month,
    sum(s.quantity)::bigint as units,
    sum(s.quantity * s.unit_price) as revenue
  from public.sales s
  where s.store_id = p_store_id
    and s.created_at > now() - make_interval(months => least(greatest(p_months, 1), 24))
  group by 1
  order by 1;
$$;

-- ===== Resumen global (solo admin) =====
create function public.admin_overview()
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
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

-- ===== Tiendas para el panel de admin (con visitas de 30 días) =====
create function public.admin_stores()
returns table (id uuid, slug text, name text, city text, status public.store_status,
               featured boolean, created_at timestamptz, products bigint, visits_30d bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
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

-- ===== Permisos de ejecución =====
revoke execute on function public.track_event(uuid, public.event_type, text, uuid, text) from public;
grant execute on function public.track_event(uuid, public.event_type, text, uuid, text) to anon, authenticated;

revoke execute on function public.mark_product_sold(uuid, int) from public, anon;
revoke execute on function public.stats_by_day(uuid, int) from public, anon;
revoke execute on function public.store_summary(uuid) from public, anon;
revoke execute on function public.stats_top_products(uuid, int) from public, anon;
revoke execute on function public.stats_sales_by_month(uuid, int) from public, anon;
revoke execute on function public.admin_overview() from public, anon;
revoke execute on function public.admin_stores() from public, anon;
grant execute on function public.mark_product_sold(uuid, int), public.stats_by_day(uuid, int),
  public.store_summary(uuid), public.stats_top_products(uuid, int),
  public.stats_sales_by_month(uuid, int), public.admin_overview(), public.admin_stores()
  to authenticated;
