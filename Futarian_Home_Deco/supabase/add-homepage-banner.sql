-- Run after the store database setup. Safe to run again. Preserves saved banners.
begin;
create table if not exists public.homepage_banner (
  id integer primary key check (id = 1),
  revision uuid not null default gen_random_uuid(),
  mode text not null default 'original' check (mode in ('original', 'campaign', 'hidden')),
  headline text not null default '' check (char_length(headline) <= 120),
  description text not null default '' check (char_length(description) <= 1200),
  image_path text not null default '' check (
    image_path = '' or image_path ~ '^[0-9a-f-]{36}[.]jpg$'
  ),
  image_alt text not null default '' check (char_length(image_alt) <= 200),
  check (mode <> 'campaign' or (length(btrim(headline)) > 0 and
    (image_path = '' or length(btrim(image_alt)) > 0)))
);
insert into public.homepage_banner (id) values (1) on conflict do nothing;
alter table public.homepage_banner enable row level security;
revoke all on public.homepage_banner from public, anon, authenticated;
grant select on public.homepage_banner to anon, authenticated;
grant update on public.homepage_banner to authenticated;
drop policy if exists "Read homepage banner" on public.homepage_banner;
create policy "Read homepage banner" on public.homepage_banner
  for select to anon, authenticated using (true);
drop policy if exists "Edit homepage banner" on public.homepage_banner;
create policy "Edit homepage banner" on public.homepage_banner
  for update to authenticated using (public.is_store_admin()) with check (public.is_store_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('banner-images', 'banner-images', true, 5242880, array['image/jpeg'])
on conflict (id) do nothing;
drop policy if exists "Admins upload banner images" on storage.objects;
create policy "Admins upload banner images" on storage.objects
  for insert to authenticated with check (bucket_id = 'banner-images' and public.is_store_admin());
drop policy if exists "Admins view banner files" on storage.objects;
create policy "Admins view banner files" on storage.objects
  for select to authenticated using (bucket_id = 'banner-images' and public.is_store_admin());
drop policy if exists "Admins delete unused banner files" on storage.objects;
create policy "Admins delete unused banner files" on storage.objects
  for delete to authenticated using (
    bucket_id = 'banner-images' and public.is_store_admin() and not exists (
      select 1 from public.homepage_banner where image_path = storage.objects.name
    )
  );
commit;
