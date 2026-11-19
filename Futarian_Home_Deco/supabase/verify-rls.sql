-- Run AFTER setup.sql and after adding your admin membership.
-- Tests roll back; no fixtures remain. Any error is a failed launch check.
begin;
select set_config('fhd.test_admin',(select user_id::text from public.admin_users limit 1),true);
do $$ begin if nullif(current_setting('fhd.test_admin',true),'') is null then raise exception 'Add your admin to admin_users before running this check.';end if;end $$;
insert into public.products(id,name,description,category,stock,status,images) values
('ff111111-1111-4111-8111-111111111111','RLS public fixture','Test only','Furniture',1,'published',array['https://example.com/photo.jpg']),
('ff222222-2222-4222-8222-222222222222','RLS draft fixture','Test only','Furniture',1,'draft','{}');
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true),set_config('request.jwt.claim.sub','',true);
do $$ begin
 if (select count(*) from public.products where id='ff111111-1111-4111-8111-111111111111')<>1 then raise exception 'FAIL: anon cannot see published product';end if;
 if exists(select 1 from public.products where id='ff222222-2222-4222-8222-222222222222') then raise exception 'FAIL: anon can see draft';end if;
 begin insert into public.products(name,description,category) values('Denied','Denied','Furniture');raise exception 'FAIL: anon can write';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"ff333333-3333-4333-8333-333333333333"}',true),set_config('request.jwt.claim.sub','ff333333-3333-4333-8333-333333333333',true);
do $$ begin
 if public.is_store_admin() then raise exception 'FAIL: ordinary account recognised as admin';end if;
 if exists(select 1 from public.products where id='ff222222-2222-4222-8222-222222222222') then raise exception 'FAIL: ordinary account can see draft';end if;
 begin insert into public.products(name,description,category) values('Denied','Denied','Furniture');raise exception 'FAIL: ordinary account can write';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('fhd.test_admin'),true),set_config('request.jwt.claims',json_build_object('role','authenticated','sub',current_setting('fhd.test_admin'))::text,true);
do $$ begin
 if not public.is_store_admin() then raise exception 'FAIL: admin not recognised';end if;
 if not exists(select 1 from public.products where id='ff222222-2222-4222-8222-222222222222') then raise exception 'FAIL: admin cannot see draft';end if;
 update public.products set name='Admin edited fixture' where id='ff222222-2222-4222-8222-222222222222';
 if not found then raise exception 'FAIL: admin cannot update';end if;
 delete from public.products where id='ff222222-2222-4222-8222-222222222222';
 if not found then raise exception 'FAIL: admin cannot delete';end if;
end $$;
reset role;
rollback;
select 'PASS: anonymous and ordinary users read only published products; admin updates work. Fixtures rolled back.' as result;
