-- Replace with the UUID from Authentication > Users.
insert into public.admin_users(user_id) values ('e268dfb7-cec8-4b07-add5-832bdd0fdd67') on conflict do nothing;
