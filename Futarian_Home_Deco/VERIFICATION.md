# Promo pricing verification — 19 November 2026

- `npm test` passed all 29 checks, including effective prices, sorting, cart totals and WhatsApp enquiry links. The checkout test uses a simulated catalogue and confirms that clearing or changing a promo prompts a cart review before any enquiry is opened or copied.
- `npm run test:sql` covers the fresh database and the three supported upgrade paths with a local PostgreSQL-compatible database. It checks that existing prices survive, rerunning the promo migration preserves active discounts, invalid discounts are rejected, and ordinary signed-in users cannot set promos.
- The browser could not access the local preview. Live Supabase, Netlify and phone layout checks are pending. Follow [PROMO_PRICES.md](PROMO_PRICES.md) for the short live test.

# Verification — 7 November 2026

## Completed locally

- 22 automated JavaScript regression tests: keyword/tag search; price sorting during search; enquiry totals; quote-only prices; demo labels; escaping/URL checks; demo product creation/edit/deletion and draft filtering; pagination; HTTP headers; invalid uploads; configured social links; catalogue failure preserves cart/wishlist and does not offer destructive cleanup.
- PostgreSQL-compatible PGlite tests run on fresh setup and three migration paths: source rows preserved, anonymous and ordinary accounts cannot edit products or upload/delete photos, drafts stay hidden, approved admins can manage products and storage, Storage metadata is admin-only, bucket is public (HTTP serving bypasses read RLS).
- Prior baseline desktop browser checks (not rerun for this revision): search plus ascending prices, cart and wishlist, quantity total and reload persistence; demo admin draft creation. These browser tests use sample data, not live Supabase.
- Prior baseline mobile/tablet layout inspected at 390px and 768px viewport widths using browser test frames. This is responsive layout QA, not a physical Redmi/WhatsApp app test.

Tests are evidence for these cases, not a zero-bug guarantee. The local database models Supabase roles and storage tables; it cannot certify the live Storage API, Auth configuration, hosting CORS or your account settings.

## Revision checks actually run

`npm test`: 22 passed. Includes any-word/plural search, relevance versus price sorting, spotlight visibility, stable public URLs, one-year upload headers, deletion ordering, shared-photo retention and cleanup failure warnings. `npm run test:sql`: fresh setup plus Claude, earlier ChatGPT and installed-final migrations passed. All nine categories and bucket restrictions are checked.

Browser checks on the revision: the query “the kettles wooden” returned matching kettle and wood products in ascending price order; spotlight hid during search and Plants filtering and returned on reset; footer Terms opened the clearly headed terms section. The sample lamp remains labelled as a lamp, not a chandelier. No real chandelier photo was supplied. The revised storefront and spotlight product detail were inspected in a 390px browser frame; the page had no horizontal overflow. This is not a physical-phone test.

## Must pass against your project before public launch

- [ ] Run `supabase/verify-rls.sql` successfully after approving your admin.
- [ ] Approved admin signs in, reloads the dashboard, edits a product and signs out.
- [ ] Upload a photo and inspect Network response headers for long Cache-Control; replace it and confirm a new URL.
- [ ] Remove a saved photo and Save; confirm its Storage file disappears unless another product references it. Delete a test product and verify its unused photos disappear too.
- [ ] Upload two real photos; save Draft; reload manager and confirm both persist.
- [ ] In a separate signed-out browser, draft is absent. A draft photo WILL be downloadable through its public URL; draft product rows must remain hidden.
- [ ] Publish the product; confirm photos and details appear in the shop. Unpublish it; fresh shop load must hide it. Direct photo links remain public while files exist; browsers may retain downloaded copies for a year.
- [ ] A temporary ordinary Auth account (not in admin_users) cannot enter the manager or create/edit/delete products or upload photos. Create this test account only in the dashboard, keep signup off, and remove its access after checking. Database tests cover denial, but test the actual API configuration too.
- [ ] Search a word that occurs only in description or tags; change price sort; check order.
- [ ] Add two products, change quantities, remove one, save a wishlist item, and reload. Totals/selections remain correct.
- [ ] Temporarily disconnect the phone's internet and reload; cart/wishlist must survive when connectivity returns.
- [ ] Change a cart item's price or stock in admin; checkout must ask the customer to review updated availability/price before proceeding.
- [ ] On Redmi 14C, open checkout and inspect the WhatsApp recipient, item quantities, subtotal and optional note. Do not send/pay unless intended. Delivery is excluded from subtotal and must be agreed.
- [ ] Check Request an item, configured social links, policy links, keyboard focus and portrait/landscape layouts.
- [ ] Confirm `demo: false`, actual product photos/prices, correct business number, and approved delivery/returns wording.

## Still blocked

No live Supabase project URL/public key or approved admin was supplied. Live login, token renewal, upload, public image serving/cache headers, actual provider policies and physical-phone WhatsApp handoff require the checklist above. Business-specific delivery and return decisions also remain yours to confirm. The private Sites review is a demo; your Cloudflare deployment is the public customer site.
