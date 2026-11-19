# Promo prices — 19 November 2026

| File | Change |
|---|---|
| `dist/admin/index.html` | Added the optional Promo price field and instructions for ending a promo. |
| `dist/admin.js` | Loads, validates, saves and clears promos and shows both prices in the product list. |
| `dist/core.mjs` | Uses the active selling price for shared price display, sorting and enquiry totals. |
| `dist/store.js` | Shows promotions on cards, details, wishlists and cart lines. Uses the discounted price for budget filters and verifies the latest price before sending or copying an enquiry. |
| `dist/styles.css` | Styles the regular price and red promo price, with room for the pair to wrap. |
| `supabase/add-promo-prices.sql` | Adds an optional price below the regular price to existing stores and refreshes the Data API schema. |
| `supabase/setup.sql` | Includes the same field and validation for a new project. |
| `tests/pricing.test.mjs` | Checks discount validation, sorting and totals. |
| `tests/checkout-pricing.test.mjs` | Checks price changes before opening or copying an enquiry. |
| `tests/security.mjs` | Checks the migration, price constraints and who can update promo prices. |
| `PROMO_PRICES.md` | Explains how to install the update on the existing Netlify site and manage promos. |
| `README.md` and `LAUNCH.md` | Point the existing site to the promo installation steps and explain when to use the migration. |
| `VERIFICATION.md` | Records the promo checks and the live smoke test still needed. |

# Revision — 7 November 2026

Patched the saved final package at commit 0950348c99517f20372a8abc54bba6fd57082fae. No rebuild or architecture change. config.js remains the only runtime settings file; config.example.js is only a template. WhatsApp checkout, the real logo, existing assets and dependencies are unchanged.

## Every changed or added file

| File | Exactly what changed |
|---|---|
| dist/core.mjs | Replaced categories with the requested nine labels. Search now ignores common filler words, normalises common English plurals, matches ANY query word across all six field groups, and counts distinct matched words. Default search order ranks matches; explicit price/name sorts still take priority. Added the published-lighting spotlight filter. |
| dist/data.js | Stable, encoded public photo URLs replace signed URLs. New optimised JPEG uploads request max-age=31536000 and retain unique filenames and upload limits. Product deletion and saved photo removal clean unused Storage objects after successful database writes, check other product references, and return cleanup warnings on failure. Old local demo category labels are translated. |
| dist/admin.js | Displays cleanup warnings after successful saves/deletes. Tracks new uploads and cleans unneeded ones on save/cancel. Removing an existing photo takes effect only on Save. |
| dist/store.js | Passes search text to relevance sorting, renders up to four published lighting cards in the spotlight, hides it during search/category filtering or when empty, extends category icons, and removes obsolete signed-image refresh requests. |
| dist/index.html | Adds the chandelier/lighting spotlight, changes default sort label to Best match / newest, and adds a visible Terms footer link. |
| dist/styles.css | Adds cream/gold spotlight styling and responsive cards, orange native-control accents, and explicit hidden-section handling. No blue UI colour introduced. |
| dist/policies.html | Makes Terms navigation explicit, heads the section Terms of shopping, explains public draft-photo URLs and caching, and updates the date. |
| supabase/setup.sql | Fresh schema accepts all nine categories and creates a public bucket with the existing 5 MB and JPEG/PNG/WebP limits. Removes published-only photo read policy; admin write policies remain. |
| supabase/migrate-chatgpt.sql | Earlier ChatGPT migration updates category constraint/rows and public bucket settings, removes obsolete photo read policy, and retains URL-to-path conversion and external-link preservation. |
| supabase/migrate-claude.sql | Keeps source backup and draft imports; preserves all nine valid category labels rather than collapsing Lighting, Plants and Home Decor; uses the public bucket with admin-only writes and limits. |
| supabase/migrate-final-v2.sql (new) | Separate transaction for an already-installed final v1 database. Renames Lighting and Mirrors & Decor, replaces the category constraint, makes photos public and removes the obsolete read policy without deleting products. |
| tests/store.test.mjs | Replaces the obsolete expectation that every search word must match. |
| tests/revision.test.mjs (new) | Eight regression tests for any-word/plural/field search, ranking vs price sort, spotlight rules, stable public URLs, upload cache headers, product/photo cleanup ordering, shared-file retention and failure handling. |
| tests/security.mjs | Adds the installed-final migration path, tests all nine categories and bucket size/type settings, expects public buckets with admin-only metadata reads, and preserves ordinary-user write/upload denial and draft-row checks. Reformatted for readability. |
| tests/fixtures/final-v1.sql (new) | Exact old final setup schema, retained solely to test upgrading an installed database. Never run as installation SQL. |
| README.md | Adds the installed-final migration, search behaviour, category-extension instructions, public-photo privacy/caching trade-off and official references. |
| LAUNCH.md | Adds the correct installed-final upgrade choice; updates bucket expectations and requires auditing existing photos before making them public. Distinguishes private draft rows from public photos. |
| MAINTENANCE.md | Updates image troubleshooting, automatic deletion and manual cleanup recovery, abandoned-upload caveat, backup/rollback implications and supported migrations. |
| VERIFICATION.md | Records revision test results and browser checks; replaces private-photo expectations with public-photo tests; adds live caching/deletion checks and retains live-project blockers. |
| CHANGES.md (new) | This complete change inventory and upgrade reminder. |

## Which SQL file to run

Use exactly ONE installation/upgrade path from LAUNCH.md. If the previous final package is already installed, back up products AND Storage files, audit existing photos for private content, then run **supabase/migrate-final-v2.sql**. Do not run setup.sql over existing tables. Deploy the complete new dist folder after the migration.

## Privacy and terms reminder

A public bucket exposes draft photos to anyone with the URL, although draft product rows stay protected. New photos request a one-year browser cache; cached/downloaded copies cannot be recalled by deletion. Existing files keep their previous cache metadata until reuploaded. Upload only images you are permitted to publish; never use this bucket for customer, identity or payment documents. Removing photos now deletes the original Storage object when unused: a previous website deployment alone cannot restore it. Keep photo backups. Confirm real return/delivery terms and flyer claims before public launch.
