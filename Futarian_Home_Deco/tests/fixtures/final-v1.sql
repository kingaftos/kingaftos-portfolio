-- Run once in a NEW Supabase project, using the SQL Editor as postgres.
begin;
create table public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
create policy "Admins see their own membership" on public.admin_users for select to authenticated using (user_id=(select auth.uid()));
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
create or replace function public.is_store_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.admin_users where user_id=(select auth.uid())); $$;
revoke all on function public.is_store_admin() from public;
grant execute on function public.is_store_admin() to anon,authenticated;
create table public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) between 1 and 120),
 description text not null check (length(trim(description)) between 1 and 5000),
 category text not null check (category in ('Furniture','Appliances','Bedding','Curtains & Blinds','Mirrors & Decor','Lighting','Storage & Organisation')),
 price bigint check(price between 1 and 1000000000),
 stock integer not null default 0 check(stock between 0 and 99999),
 condition text not null default 'New' check(condition in ('New','Used','Made to order')),
 material text not null default '' check(length(material)<=160),
 dimensions text not null default '' check(length(dimensions)<=160),
 tags text[] not null default '{}' check(cardinality(tags)<=30),
 images text[] not null default '{}' check(cardinality(images)<=6),
 status text not null default 'draft' check(status in ('draft','published')),
 featured boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint published_has_photo check(status='draft' or cardinality(images)>0)
);
create index products_status_date on public.products(status,created_at desc);
create or replace function public.touch_product() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now();return new;end; $$;
create trigger touch_product before update on public.products for each row execute function public.touch_product();
alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;
grant select on public.products to anon;
grant select,insert,update,delete on public.products to authenticated;
create policy "Published products are readable" on public.products for select to anon,authenticated using(status='published');
create policy "Admins manage all products" on public.products for all to authenticated using(public.is_store_admin()) with check(public.is_store_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy "Admins upload product images" on storage.objects for insert to authenticated with check(bucket_id='product-images' and public.is_store_admin());
create policy "Admins view image records" on storage.objects for select to authenticated using(bucket_id='product-images' and public.is_store_admin());
create policy "Admins delete product images" on storage.objects for delete to authenticated using(bucket_id='product-images' and public.is_store_admin());
create policy "Published photo reads" on storage.objects for select to anon,authenticated
 using(bucket_id='product-images' and exists(select 1 from public.products p where p.status='published' and storage.objects.name=any(p.images)));
-- Signed photo links expire after 60 seconds; previously downloaded images cannot be recalled.
commit;
-- After creating YOUR Auth user in the dashboard, run this separately:
-- insert into public.admin_users(user_id) values ('PASTE-YOUR-AUTH-USER-UUID');
