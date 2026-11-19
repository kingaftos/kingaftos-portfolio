# Promo prices for Futarian Home Deco

## Update your existing Netlify site

1. Extract the ZIP. In VS Code, open `Futarian_Home_Deco/supabase/add-promo-prices.sql`. Press **Ctrl+A**, then **Ctrl+C** to copy the contents.
2. In your existing Futarian Home Deco Supabase project, open **SQL Editor → New query**. Paste the copied SQL and click **Run**. Expect **Success. No rows returned**. This is the only SQL file you need for the promo update. It adds a field to your existing products, with no promos active initially.
3. Open your existing Futarian Home Deco project in Netlify. On **Deploys**, drag the extracted `Futarian_Home_Deco/dist` folder to the manual deploy area. When Netlify publishes the deploy, the shop is available at its usual address. The ZIP includes your configured `dist/config.js` and Google Search Console verification file.
4. Open the [store admin](https://futarian-home-deco.netlify.app/admin/) and sign in. Edit one product and confirm you can see **Regular price** and **Promo price**. If the old form is still visible, refresh with **Ctrl+F5**.

[Supabase SQL Editor instructions](https://supabase.com/docs/guides/getting-started/quickstarts/refine) · [Netlify manual deploy instructions](https://docs.netlify.com/deploy/create-deploys/)

## Start, test and end a promo

1. In the product editor, enter the regular price and a lower promo price in whole naira. For example, enter `15000` for the regular price and `12000` for the promo price. Save the product.
2. Open the [storefront](https://futarian-home-deco.netlify.app/) in a private tab or on your phone. On a published product, expect ~~₦15,000~~ next to a red **₦12,000**. Add two to the cart and check for a **₦24,000** subtotal. Open the WhatsApp enquiry and check for the same total before sending.
3. To end the offer, edit the product, clear **Promo price**, and save. The regular price returns. Leave both price fields blank for an item customers should request a quote for.

Promos stay active until you clear them. Everyday promo edits take effect without another deploy. If the price changes while a customer has a cart open, both enquiry buttons refresh the subtotal and ask the customer to review it before continuing.

If the admin has the field but says it cannot find `promo_price` when saving, confirm step 2 succeeded in the Supabase project connected in `dist/config.js`. If you restore an earlier Netlify deploy, that version shows regular prices. The promo values stay in Supabase.
