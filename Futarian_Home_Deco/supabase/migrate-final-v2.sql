-- Installed final v1 / earlier ChatGPT UUID schema. Back up database AND photos first.
-- All bucket photos become public, including draft photos. Audit uploads BEFORE running.
begin;
alter table public.products drop constraint products_category_check;
update public.products set category=case category when 'Lighting' then 'Lighting & Chandeliers' when 'Mirrors & Decor' then 'Mirrors & Art' else category end;
alter table public.products add constraint products_category_check check(category in ('Furniture','Appliances','Lighting & Chandeliers','Mirrors & Art','Curtains & Blinds','Bedding','Home Decor','Plants','Storage & Organisation'));
update storage.buckets set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'] where id='product-images';
drop policy if exists "Published photo reads" on storage.objects;
commit;
