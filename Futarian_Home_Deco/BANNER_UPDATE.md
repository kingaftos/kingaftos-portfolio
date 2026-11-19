# Homepage banner update for Netlify

1. In Supabase, open your existing Futarian Home Deco project. In Authentication → Users, choose Add user → Create new user. Use your store email, set a password privately, and select Auto Confirm User if shown. Copy the new user's UID. If the store email is already listed, open it and copy its UID.
2. Open a new SQL Editor query. Paste the contents of supabase/approve-admin.sql, replace PASTE-YOUR-AUTH-USER-UUID with the UID, and run the query. “Success. No rows returned” is normal.
3. Open a separate SQL Editor query. Paste and run all of supabase/add-homepage-banner.sql. It adds banner settings and a separate flyer bucket. Your existing database has the original store tables, so do not rerun setup.sql.
4. In the existing Futarian Home Deco Netlify project, upload the dist folder from this ZIP. The URL and publishable key from your supplied package are already in dist/config.js.
5. Open https://futarian-home-deco.netlify.app/admin/ and sign in. Open Homepage banner. Select Custom offer, enter a title and details, and attach the flyer when it is ready. For a flyer, describe the image and include the offer price and main inclusions in Offer details so they are readable without opening the image. Click Save banner.
6. Refresh the storefront, ideally on your phone. The banner should show the offer. Tap the picture to open the full flyer and test the WhatsApp button. Future changes take effect after saving and refreshing; no upload to Netlify is needed.

Select Original room banner or No banner to take a promotion down while keeping its text and flyer for reuse. To replace the flyer, select a new file and save. To remove it, select Remove current flyer and save. Uploaded flyers are public images, so use promotional content approved for customers. If a save fails after an upload and an unused file remains, check the current banner before removing the unused file in Supabase Storage → banner-images.

Keep public signups and anonymous sign-ins disabled for this shop. In Supabase Authentication → URL Configuration, set the Site URL to https://futarian-home-deco.netlify.app/ if it has not been set yet. The store is hosted on Netlify.
