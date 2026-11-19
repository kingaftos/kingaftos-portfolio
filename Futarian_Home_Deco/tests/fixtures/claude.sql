-- =====================================================================
-- RUN THIS ONCE in Supabase: SQL Editor > New query > paste all > Run.
-- It is safe to run again if something goes wrong.
-- =====================================================================

-- 1. The products table ------------------------------------------------
create table if not exists public.products (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  price       numeric(12,2) not null check (price >= 0),
  category    text not null,
  tags        text not null default '',
  image_path  text,
  in_stock    boolean not null default true,
  featured    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 2. Security rules: the public can only LOOK; only you (logged in) can change.
alter table public.products enable row level security;

drop policy if exists "Anyone can view products" on public.products;
create policy "Anyone can view products"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "Admin can add products" on public.products;
create policy "Admin can add products"
  on public.products for insert
  to authenticated
  with check (true);

drop policy if exists "Admin can edit products" on public.products;
create policy "Admin can edit products"
  on public.products for update
  to authenticated
  using (true) with check (true);

drop policy if exists "Admin can delete products" on public.products;
create policy "Admin can delete products"
  on public.products for delete
  to authenticated
  using (true);

-- 3. The photo folder (bucket): public to view, max 2 MB, images only -----
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Admin can see photos" on storage.objects;
create policy "Admin can see photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Admin can upload photos" on storage.objects;
create policy "Admin can upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "Admin can replace photos" on storage.objects;
create policy "Admin can replace photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Admin can delete photos" on storage.objects;
create policy "Admin can delete photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');
