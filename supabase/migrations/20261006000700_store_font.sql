-- MiTiendaW · 7 · Tipo de letra del nombre y la descripción de la tienda.
alter table public.stores add column if not exists font text not null default 'atkinson'
  constraint stores_font_check check (font in ('atkinson','elegante','redondeada','manuscrita','moderna','clasica'));
