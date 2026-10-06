-- MiTiendaW · 6 · Uso por tienda para el panel de administración.
-- Correo del vendedor (auth.users no se lee desde la API), fotos de productos,
-- archivos y espacio en Storage. Security definer porque lee auth.users y
-- storage.objects; rechaza a quien no es admin.
create or replace function public.admin_store_usage()
returns table (store_id uuid, slug text, name text, owner_email text,
               product_photos bigint, storage_files bigint, storage_bytes bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
  return query
    select s.id, s.slug, s.name, u.email::text,
           (select count(*) from public.product_images pi
              join public.products p on p.id = pi.product_id
             where p.store_id = s.id),
           (select count(*) from storage.objects o
             where o.bucket_id = 'catalogo' and split_part(o.name, '/', 1) = s.id::text),
           (select coalesce(sum((o.metadata->>'size')::bigint), 0)::bigint from storage.objects o
             where o.bucket_id = 'catalogo' and split_part(o.name, '/', 1) = s.id::text)
    from public.stores s
    left join auth.users u on u.id = s.owner_id
    order by 7 desc, s.created_at desc;
end;
$$;
revoke execute on function public.admin_store_usage() from public, anon;
grant execute on function public.admin_store_usage() to authenticated;
