# Futarian Home Deco — start here

This is one buildless website: the shop at `/`, the manager at `/admin/`, and Supabase for products, public product photos and admin login. `dist/` contains both the editable source and the deployable files. No build command or customer accounts are required. Checkout sends an enquiry to **+234 815 420 1739**; it does not take payment, reserve stock or create an order record.

**Updating the existing Netlify shop?** Follow [PROMO_PRICES.md](PROMO_PRICES.md) for the database update, deployment, and live test.

**Setting up from scratch?** Use LAUNCH.md for the original setup. Fresh `supabase/setup.sql` includes the promo-price field. If you are migrating one of the three older schemas, run its matching original migration, then `supabase/add-promo-prices.sql`.

- `dist/` — upload this folder to the existing Netlify project.
- `LAUNCH.md` — exact setup and launch actions, results and costs.
- `MAINTENANCE.md` — fixes, backups, updates and rollback.
- `VERIFICATION.md` — what was tested and what still needs your live project.
- `supabase/setup.sql` — fresh project only.
- `supabase/migrate-claude.sql` — existing supplied Claude database only.
- `supabase/migrate-chatgpt.sql` — existing earlier ChatGPT database only.
- `supabase/migrate-final-v2.sql` — installed final v1 package only.
- `supabase/add-promo-prices.sql` — adds promo prices to an existing products table.
- `supabase/approve-admin.sql` — approve your Auth user after setup/migration.
- `supabase/verify-rls.sql` — live database permission checks; rolls back test fixtures.
- `tests/` — developer tests and original SQL fixtures; never upload this folder.

## What was retained from each version

The earlier ChatGPT source was recovered from its saved Sites repository (commit `cb79b412b8e14fe3c66711cc3f4bccae1468110e`). Claude's source was inspected from the attached nested `futarian-home-deco.zip`. The ChatGPT base keeps multiple photos, drafts, stock quantities, protected admin membership, catalogue pagination, wishlist and checkout revalidation. Claude's photo-resizing approach was adapted to reduce upload sizes. Its broad authenticated-user permissions were not retained. Its simpler settings approach informed the configuration guide.

Additional fixes cover failed-catalogue cart handling, search sorting, social links, resumed admin approval, admin-only photo writes, the real logo and a lighter local-font design. Fresh databases and all three known old schemas have separate, tested paths. This package is ready to configure; it is not proof that an unconnected live Supabase project works.

## Where to edit

| Change | File / action |
|---|---|
| Supabase URL, public key, WhatsApp, Instagram, TikTok, demo mode | `dist/config.js` |
| Everyday products, regular and promo prices, tags, photos, stock, publishing | `/admin/` |
| Colours and layout | CSS variables at the top of `dist/styles.css` |
| Logo, icon, sharing image | `dist/assets/logo.webp`, `favicon.png`, `social.jpg` |
| Home page wording and location | `dist/index.html` |
| Privacy, delivery, returns and shopping terms | `dist/policies.html` |
| Shared search, sorting, escaping, money, enquiry text | `dist/core.mjs` |
| Supabase requests, login, photo resizing | `dist/data.js` |
| Shop behaviour / manager behaviour | `dist/store.js` / `dist/admin.js` |

Category labels must match the database constraint. If changing them, update `core.mjs`, the database constraint and existing product rows together; adding products to existing categories needs no code changes.

Developer checks: install Node.js, run `npm ci`, `npm test`, then `npm run test:sql`. These tools are for local verification only and aren't needed to host the shop. To preview locally, use VS Code Live Server on `dist/index.html`; don't double-click the file, because JavaScript modules need HTTP.

## Revision notes

Read CHANGES.md for every changed file. Search uses any meaningful word, simple English plural normalisation and partial matches; default search order ranks more matching words first. Selecting a price sort overrides relevance, so prices remain ordered. A stopword-only query behaves like an empty search.

### Add a category later

Add the label to `categories` in `dist/core.mjs`. In a NEW migration, wrap `alter table public.products drop constraint products_category_check;` and a replacement `add constraint products_category_check check(category in (...));` containing EVERY existing label plus the new label in `begin; ... commit;`. Do not rerun setup. Update setup.sql and original-schema migrations for future installations, test, then deploy core.mjs. If renaming, update existing rows inside that transaction before adding the constraint. No product records need deleting.

### Public-photo trade-off

All bucket photos, including draft and abandoned uploads, are public to anyone with their URL. Draft product descriptions/prices remain protected by RLS. New uploads request a one-year browser cache and use unique filenames; replacement photos get new URLs. Existing objects retain their earlier cache metadata: re-upload through admin if long caching is needed. Check actual response Cache-Control in the browser Network tab before launch. Do not edit storage tables to change file metadata.

Unpublishing does not make a photo private; deletion cannot recall browser caches or copies. Upload only pictures you own or have permission to publish, with no customer identities, addresses, receipts or banking documents. Public hosting does not grant copyright permission. No new payment gateway, tracking or customer account was added. Confirm business returns/delivery terms and flyer claims before launch.

Official references: [public buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [cache control](https://supabase.com/docs/guides/storage/cdn/smart-cdn), [file removal](https://supabase.com/docs/reference/javascript/storage-from-remove).
