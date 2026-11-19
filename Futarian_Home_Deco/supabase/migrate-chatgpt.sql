-- Installed final v1 / earlier ChatGPT UUID schema. Back up database AND photos first.
-- All bucket photos become public, including draft photos. Audit uploads BEFORE running.
begin;
alter table public.products drop constraint products_category_check;
update public.products set category=case category when 'Lighting' then 'Lighting & Chandeliers' when 'Mirrors & Decor' then 'Mirrors & Art' else category end;
alter table public.products add constraint products_category_check check(category in ('Furniture','Appliances','Lighting & Chandeliers','Mirrors & Art','Curtains & Blinds','Bedding','Home Decor','Plants','Storage & Organisation'));
update storage.buckets set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'] where id='product-images';
drop policy if exists "Published photo reads" on storage.objects;
update public.products set images=array(select regexp_replace(x,'^https://[^/]+/storage/v1/object/public/product-images/','') from unnest(images) x);
alter table public.products add column if not exists previous_images text[];
update public.products set previous_images=images,status='draft',images='{}' where exists(select 1 from unnest(images) x where x like 'http%');
commit;
