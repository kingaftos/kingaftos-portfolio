import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const read = (p) => fs.readFile(new URL("../" + p, import.meta.url), "utf8");
async function base() {
  const db = new PGlite();
  await db.exec(
    `create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);alter table storage.objects enable row level security;grant usage on schema public,auth,storage to anon,authenticated;grant select,insert,update,delete on storage.objects to anon,authenticated;insert into auth.users values ('aa111111-1111-4111-8111-111111111111');`,
  );
  return db;
}
async function verify(db) {
  const { categories } = await import("../dist/core.mjs");
  for (const category of categories)
    await db.query(
      "insert into products(name,description,category) values ($1,$2,$3)",
      ["Category test", "Category test", category],
    );
  const bucket = (
    await db.query("select * from storage.buckets where id='product-images'")
  ).rows[0];
  assert.equal(Number(bucket.file_size_limit), 5242880);
  assert.deepEqual(bucket.allowed_mime_types, [
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
  await db.exec(
    `insert into admin_users values('aa111111-1111-4111-8111-111111111111') on conflict do nothing;`,
  );
  await db.exec(await read("supabase/verify-rls.sql"));
  await db.exec(
    `insert into products(name,description,category,status,images) values('Photo test','Photo test','Furniture','published',array['public.jpg']),('Draft test','Draft test','Furniture','draft',array['draft.jpg']);insert into storage.objects(bucket_id,name) values('product-images','public.jpg'),('product-images','draft.jpg');`,
  );
  for (const [role, uid, count] of [
    ["anon", "", 0],
    ["authenticated", "bb111111-1111-4111-8111-111111111111", 0],
    ["authenticated", "aa111111-1111-4111-8111-111111111111", 2],
  ]) {
    await db.exec(
      `begin;set local role ${role};select set_config('request.jwt.claim.sub','${uid}',true);`,
    );
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      count,
    );
    if (count === 0) {
      await db.exec(
        `do $$ begin begin insert into storage.objects(bucket_id,name) values('product-images','bad.jpg');raise exception 'Upload allowed';exception when insufficient_privilege then null;end;end $$;`,
      );
      assert.equal(
        (
          await db.query(
            "delete from storage.objects where name='public.jpg' returning *",
          )
        ).rows.length,
        0,
      );
      if (role === "authenticated")
        assert.equal(
          (await db.query("update products set name='hacked' returning *")).rows
            .length,
          0,
        );
      else
        await db.exec(
          "do $$ begin begin update products set name='hacked';raise exception 'Update allowed';exception when insufficient_privilege then null;end;end $$;",
        );
    } else
      await db.exec(
        "insert into storage.objects(bucket_id,name) values('product-images','good.jpg');",
      );
    await db.exec("rollback;");
  }
  assert.equal(
    (
      await db.query(
        "select public from storage.buckets where id='product-images'",
      )
    ).rows[0].public,
    true,
  );
}
async function verifyBanner(db) {
  const migration = await read("supabase/add-homepage-banner.sql");
  await db.exec(migration);
  const flyer = "01234567-abcd-4abc-8def-000000000000.jpg";
  for (const [role, uid, admin] of [
    ["anon", "", false],
    ["authenticated", "bb111111-1111-4111-8111-111111111111", false],
    ["authenticated", "aa111111-1111-4111-8111-111111111111", true],
  ]) {
    await db.exec(`begin; set local role ${role}; select set_config('request.jwt.claim.sub','${uid}',true);`);
    const banner = (await db.query("select * from homepage_banner")).rows[0];
    assert.equal(banner.mode, "original");
    if (admin) {
      await db.query("insert into storage.objects(bucket_id,name) values('banner-images',$1)", [flyer]);
      assert.equal((await db.query(
        "update homepage_banner set mode='campaign', headline='Room bundle', image_path=$1, image_alt='Bundle flyer' where id=1 returning id",
        [flyer],
      )).rows.length, 1);
      assert.equal((await db.query("delete from storage.objects where bucket_id='banner-images' returning id")).rows.length, 0);
    } else {
      await db.exec(`do $$ begin
        begin insert into storage.objects(bucket_id,name) values('banner-images','bad.jpg');
          raise exception 'Banner upload allowed'; exception when insufficient_privilege then null; end;
        begin
          update homepage_banner set mode='hidden';
          if found then raise exception 'Banner edit allowed'; end if;
          exception when insufficient_privilege then null;
        end;
      end $$;`);
    }
    await db.exec("rollback");
  }
  await db.exec("update homepage_banner set mode='hidden', headline='Saved bundle'");
  await db.exec(migration);
  const saved = (await db.query("select mode, headline from homepage_banner")).rows[0];
  assert.deepEqual(saved, {mode:"hidden", headline:"Saved bundle"});
}

async function verifyPromoPrices(db, fresh) {
  const migration = await read("supabase/add-promo-prices.sql");
  const { id } = (await db.query(
    "insert into products(name,description,category,price,status,images) values('Promo test','Promo test','Furniture',15000,'published',array['promo.jpg']) returning id",
  )).rows[0];
  if (!fresh) await db.exec(migration);
  const readPrice = async () => (await db.query(
    "select price, promo_price from products where id=$1", [id],
  )).rows[0];
  assert.deepEqual(await readPrice(), { price: 15000, promo_price: null });
  for (const [price, promo] of [[null, 12000], [15000, 15000], [15000, 16000], [15000, 0]]) {
    await assert.rejects(
      db.query("update products set price=$2,promo_price=$3 where id=$1", [id, price, promo]),
      { code: "23514" },
    );
  }

  await db.exec("begin; set local role authenticated; select set_config('request.jwt.claim.sub','bb111111-1111-4111-8111-111111111111',true);");
  assert.equal((await db.query(
    "update products set promo_price=12000 where id=$1 returning id", [id],
  )).rows.length, 0);
  await db.exec("rollback;");

  await db.exec("begin; set local role authenticated; select set_config('request.jwt.claim.sub','aa111111-1111-4111-8111-111111111111',true);");
  assert.equal((await db.query(
    "update products set promo_price=12000 where id=$1 returning promo_price", [id],
  )).rows[0].promo_price, 12000);
  await db.exec("commit;");
  await db.exec(migration);
  await db.exec("begin; set local role anon;");
  assert.deepEqual(await readPrice(), { price: 15000, promo_price: 12000 });
  await db.exec("rollback;");
  await db.query("update products set promo_price=null where id=$1", [id]);
  assert.deepEqual(await readPrice(), { price: 15000, promo_price: null });
}

for (const mode of ["fresh", "claude", "chatgpt", "final-v1"]) {
  const db = await base();
  if (mode === "fresh") await db.exec(await read("supabase/setup.sql"));
  else {
    await db.exec(await read("tests/fixtures/" + mode + ".sql"));
    if (mode === "claude")
      await db.exec(
        "insert into products(name,description,category,price,image_path) values('Original','Details','Home Decor',123.45,'old.jpg');",
      );
    else
      await db.exec(
        "insert into products(name,description,category,price,images) values('Original','Details','Lighting',123,array['https://abc.supabase.co/storage/v1/object/public/product-images/old.jpg']);",
      );
    await db.exec(
      await read(
        "supabase/migrate-" +
          (mode === "final-v1" ? "final-v2" : mode) +
          ".sql",
      ),
    );
    assert.equal(
      (await db.query("select * from products where name='Original'")).rows
        .length,
      1,
    );
    if (mode !== "claude")
      assert.equal(
        (await db.query("select category from products where name='Original'"))
          .rows[0].category,
        "Lighting & Chandeliers",
      );
    if (mode === "claude")
      assert.equal(
        (await db.query("select price from products_claude_backup")).rows[0]
          .price,
        "123.45",
      );
  }
  await verify(db);
  await verifyPromoPrices(db, mode === "fresh");
  if (mode === "fresh") {
    await verifyBanner(db);
    console.log("PASS homepage banner: public read, admin-only writes and uploads, active flyer retained, migration rerun preserves settings");
  }
  console.log(
    "PASS " +
      mode +
      ": preserved rows, valid promo prices, draft-row privacy, public photo bucket, denied ordinary writes/uploads, approved admin",
  );
  await db.close();
}
