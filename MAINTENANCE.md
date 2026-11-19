# Troubleshooting and maintenance

| Problem | Action | Expected result |
|---|---|---|
| Admin won't sign in | Check the project URL/public key, email/password and confirmed Auth user. Check its UUID is in `admin_users`. If Supabase paused, restore the project from its dashboard. Reload `/admin/`. | Approved user sees manager; others stay at login. |
| Forgot admin password | Use Supabase's account/user-management process to send a recovery/invite flow to your own email. This build has no custom password-reset screen. A developer can assist with a supported recovery flow; don't put a password in SQL or chat. | Regain access without loosening database policies. |
| Upload fails | Use JPG/PNG/WebP under 5 MB; check internet, free storage usage, approved-admin membership and PUBLIC `product-images` bucket. Retry after signing in again. | Uploaded photo appears in the editor; Save attaches it. |
| Photos missing | Refresh the page. Confirm the bucket is public and admin write policies exist. Images are stored as bucket paths, not manually pasted public URLs. | Photo links load without signing; draft product rows still require approval. |
| Saved product missing in shop | Check visibility is Published, at least one photo is attached, and search/category/budget filters aren't hiding it. Reload shop. | Published product appears. Zero stock intentionally disables Add. |
| Cart unavailable after connection failure | Restore internet and reload. Do not clear browser storage; the selections are retained. If an item was genuinely removed, remove it explicitly from the cart. | Saved products return when the catalogue loads. |
| WhatsApp doesn't open | Confirm `whatsapp` contains digits only and WhatsApp is installed or web access is available. Use Copy enquiry instead, then paste into your own chat with the business. | Itemised enquiry with subtotal; delivery confirmed separately. |
| Social accounts absent | Add full `https://` account URLs in config.js, then redeploy `dist`. Empty/invalid values intentionally hide links. | Real Instagram/TikTok links appear. |
| Sample products visible publicly | Set `demo: false` AND enter both public Supabase values, then redeploy. | Only database products appear. Samples are local preview data, never automatically inserted into Supabase. |
| Site shows old code | Create a new Production deployment with the entire updated `dist` folder, then hard-refresh. | The new files are active. Product updates alone do not need deployment. |

## Everyday use

Use `/admin/` to update products. Confirm payments in your bank, not from a screenshot alone. Maintain an order sheet with agreed item, quantity, total, delivery and payment status. Reduce stock after a confirmed sale. This website does not reserve stock or track transactions.

Removing an attached photo then saving, or deleting a product, deletes its unused Storage files after the database change succeeds. Files referenced by another product are kept. Cancelling the editor cleans new uploads; closing the browser mid-upload may leave orphan files. If cleanup fails, the admin shows a persistent warning with filenames: in Supabase → Storage → product-images, check each against `products.images`, back up, then delete only unreferenced files. Avoid simultaneous edits to products sharing photos during cleanup. Database changes and Storage deletion are separate operations, not one transaction. A code rollback cannot restore deleted photos; keep backups. Never upload identity, customer or banking documents to the catalogue bucket.

## Backups

Before migrations and at least weekly during trading:

1. Save a dated copy of the configured project folder privately. Keep the previous working `dist` folder.
2. Supabase SQL Editor: run `select * from public.products;` and export the results as CSV. Export `admin_users` privately as well. Retain the matching setup/migration SQL and the selected project's identity. For a full database backup use Supabase's documented CLI dump workflow with developer help; do not assume the Free plan includes downloadable daily backups.
3. In Storage → product-images, download original photo objects, keeping their exact names. Save them beside the CSV. Database backups do not include Storage object bytes.
4. If recovering into a new project, run the fresh setup, import the product CSV with its original UUIDs, recreate your Auth admin and approve its NEW user UUID, upload the photos with the preserved names, then update config.js and rerun verification. If the CSV contains migration-only columns (`legacy_id`, `legacy_price`, `previous_images`), retain those in the backup but omit them from a clean-schema import or add matching columns with developer help.

## Roll back website code

Cloudflare → Workers & Pages → your project → Deployments → All deployments → three-dot menu on a known good Production deployment → Rollback to this deployment. Or deploy your saved previous `dist` folder as a new Production deployment. This changes code only, not Supabase data. Use a code version compatible with the current category schema and public photo bucket.

## Database migrations

The two supplied original schemas and the installed final v1 schema are supported by the named migration files. Both run in transactions and preserve source data. Claude's legacy table is retained but API access is revoked. Do not drop that backup until a complete review and separate export. Existing sessions cannot become admins just because they are authenticated. Never fix access errors by replacing a policy with `using (true)` or exposing a secret key.

Official guidance: [Pages rollback](https://developers.cloudflare.com/pages/configuration/rollbacks/), [Supabase backups](https://supabase.com/docs/guides/platform/backups).
