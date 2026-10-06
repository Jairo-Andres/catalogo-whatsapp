-- =============================================================================
-- Catálogo WhatsApp · 5 · Hasta 3 fotos por producto
-- Posición 0 = foto principal (la de la tarjeta). Un índice único por
-- (producto, posición) más el rango 0..2 dejan como máximo 3 fotos por producto
-- en la base, aunque alguien salte la validación de la app.
-- =============================================================================

alter table public.product_images
  add constraint product_images_position_range check (position between 0 and 2);

-- El índice anterior (product_id, position) se deja: en el proyecto de Supabase los
-- DROP se quedaban colgados (ver README) y no estorba.
create unique index product_images_product_position_key
  on public.product_images (product_id, position);
