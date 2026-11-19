import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";

test("checkout refreshes price changes before opening or copying a WhatsApp enquiry", async () => {
  globalThis.window = {
    STORE_CONFIG: {
      supabaseUrl: "https://example.supabase.co",
      supabaseKey: "sb_publishable_test",
      whatsapp: "2348154201739",
    },
    location: { href: "" },
  };
  globalThis.localStorage = {
    getItem: (key) => key === "fhd-cart" ? '{"kettle":2}' : null,
    setItem() {},
  };
  let promo = 12000;
  globalThis.fetch = async () => ({
    ok: true,
    text: async () => JSON.stringify([{
      id: "kettle", name: "Electric kettle", category: "Appliances",
      status: "published", stock: 4, price: 15000, promo_price: promo,
    }]),
  });
  let copied = "";
  Object.defineProperty(globalThis, "navigator", {
    value: { clipboard: { writeText: async (text) => { copied = text; } } },
    configurable: true,
  });

  const nodes = new Map();
  function el(selector) {
    if (!nodes.has(selector)) nodes.set(selector, {
      value: selector === "#budget" ? "all" : "",
      textContent: "",
      isConnected: true,
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener(type, fn) { this[type] = fn; },
      showModal() { this.open = true; },
      set innerHTML(html) {
        this.markup = html;
        if (selector === "#drawer-body") {
          for (const key of ["#checkout", "#copy-order", "#order-note"]) {
            if (nodes.has(key)) nodes.get(key).isConnected = false;
            nodes.delete(key);
          }
        }
      },
      get innerHTML() { return this.markup; },
    });
    return nodes.get(selector);
  }
  globalThis.document = {
    querySelector: el,
    querySelectorAll: () => [],
    addEventListener() {},
  };
  await import("../dist/store.js");
  await setImmediate();
  assert.match(el("#products").innerHTML, /<del>.*15,000<\/del>.*promo-price.*12,000/);
  el("#cart").onclick();
  assert.match(el("#drawer-body").innerHTML, /Listed subtotal.*24,000/);
  el("#order-note").value = "Pickup near FUTA";

  promo = null;
  await el("#checkout").click();
  assert.equal(window.location.href, "");
  assert.match(el("#toast").textContent, /A price has changed/);
  assert.match(el("#drawer-body").innerHTML, /Listed subtotal.*30,000/);
  assert.equal(el("#order-note").value, "Pickup near FUTA");

  promo = 11000;
  await el("#copy-order").click();
  assert.equal(copied, "");
  assert.match(el("#drawer-body").innerHTML, /Listed subtotal.*22,000/);
  await el("#copy-order").click();
  assert.match(copied, /Electric kettle \[kettle\] × 2 — .*22,000/);

  await el("#checkout").click();
  const url = new URL(window.location.href);
  assert.equal(url.origin + url.pathname, "https://wa.me/2348154201739");
  assert.equal(url.searchParams.get("text"), copied);
  assert.match(copied, /Pickup near FUTA/);
});
