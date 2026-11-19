import test from "node:test";
import assert from "node:assert/strict";
import {
  checkoutMessage,
  listedSubtotal,
  money,
  sellingPrice,
  sortProducts,
} from "../dist/core.mjs";

const kettle = {
  id: "kettle",
  name: "Electric kettle",
  price: 15000,
  promo_price: 12000,
};

test("existing prices and quotes still work and invalid promos are ignored", () => {
  assert.equal(sellingPrice({ price: 15000 }), 15000);
  assert.equal(sellingPrice({ price: null }), null);
  for (const promo_price of [null, 0, -1, 12000.5, 15000, 16000]) {
    assert.equal(sellingPrice({ ...kettle, promo_price }), 15000);
  }
  assert.equal(sellingPrice({ price: null, promo_price: 12000 }), null);
});

test("price sorting uses the active offer, even with a search query", () => {
  const products = [
    { id: "other", name: "Travel kettle", price: 13000 },
    kettle,
    { id: "quote", name: "Stove kettle", price: null },
  ];
  assert.deepEqual(sortProducts(products, "low", "kettle").map((p) => p.id), [
    "kettle", "other", "quote",
  ]);
  assert.deepEqual(sortProducts(products, "high", "kettle").map((p) => p.id), [
    "other", "kettle", "quote",
  ]);
});

test("the cart subtotal and WhatsApp enquiry use the same discounted prices", () => {
  const items = [
    { product: kettle, qty: 2 },
    { product: { id: "curtain", name: "Curtain", price: 8000 }, qty: 1 },
    { product: { id: "mirror", name: "Mirror", price: null }, qty: 1 },
  ];
  assert.equal(listedSubtotal(items), 32000);
  const message = checkoutMessage(items);
  assert.ok(message.includes(`Electric kettle [kettle] × 2 — ${money(24000)}`));
  assert.ok(message.includes("Mirror [mirror] × 1 — Please quote"));
  assert.ok(message.includes(`Listed subtotal: ${money(32000)} + items awaiting a quote`));
});
