-- Run in the existing Futarian Home Deco Supabase project before deploying the updated dist folder.
begin;

alter table public.products add column if not exists promo_price bigint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_valid_promo_price'
  ) then
    alter table public.products add constraint products_valid_promo_price check (
      promo_price is null or (price is not null and promo_price > 0 and promo_price < price)
    );
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
