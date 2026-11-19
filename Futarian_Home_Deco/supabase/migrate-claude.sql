-- Claude bigint-ID schema ONLY. Do not run setup.sql first. Back up first.
begin;
do $$ begin if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='image_path') then raise exception 'Expected Claude image_path schema'; end if;end $$;
alter table public.products rename to products_claude_backup;
revoke all on public.products_claude_backup from anon,authenticated;
alter index public.products_pkey rename to products_claude_backup_pkey;
drop policy if exists "Admin can see photos" on storage.objects;
drop policy if exists "Admin can upload photos" on storage.objects;
drop policy if exists "Admin can replace photos" on storage.objects;
drop policy if exists "Admin can delete photos" on storage.objects;
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
 category text not null check (category in ('Furniture','Appliances','Lighting & Chandeliers','Mirrors & Art','Curtains & Blinds','Bedding','Home Decor','Plants','Storage & Organisation')),
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
update storage.buckets set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'] where id='product-images';
create policy "Admins upload product images" on storage.objects for insert to authenticated with check(bucket_id='product-images' and public.is_store_admin());
create policy "Admins view image records" on storage.objects for select to authenticated using(bucket_id='product-images' and public.is_store_admin());
create policy "Admins delete product images" on storage.objects for delete to authenticated using(bucket_id='product-images' and public.is_store_admin());
-- Public photo URLs bypass read policies, including draft photos; writes remain admin-only.

alter table public.products add column legacy_id bigint unique;
alter table public.products add column legacy_price numeric(12,2);
insert into public.products(name,description,price,category,tags,images,stock,status,featured,created_at,legacy_id,legacy_price)
select name,case when trim(description)='' then 'Description to be completed before publication.' else description end,
 case when price>0 and price=trunc(price) then price::bigint else null end,
 case when category in ('Furniture','Appliances','Lighting & Chandeliers','Mirrors & Art','Curtains & Blinds','Bedding','Home Decor','Plants','Storage & Organisation') then category when category='Lighting' then 'Lighting & Chandeliers' when category='Mirrors & Decor' then 'Mirrors & Art' else 'Home Decor' end,
 (string_to_array(tags,','))[1:30],case when image_path is null then '{}'::text[] else array[image_path] end,
 case when in_stock then 1 else 0 end,'draft',featured,created_at,id,price from public.products_claude_backup;
commit;
-- Review every imported draft before publishing: stock, category, photos and price.
-- All exact original values remain in products_claude_backup; legacy_id links rows.
