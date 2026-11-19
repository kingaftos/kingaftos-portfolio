import test from "node:test";
import assert from "node:assert/strict";
import {
  matches,
  searchScore,
  sortProducts,
  spotlightProducts,
  categories,
} from "../dist/core.mjs";
const kettle = {
  id: "k",
  name: "Electric kettle",
  description: "Hot water",
  category: "Appliances",
  tags: ["kitchen"],
  material: "steel",
  dimensions: "20cm",
  price: 10000,
  status: "published",
};
test("ANY word, ignored words, plural equivalence and every searchable field", () => {
  for (const q of [
    "kettles",
    "the and for with from kettle",
    "kettle sofa",
    "kitchen",
    "steels",
    "20cm",
    "appliance",
    "waters",
  ])
    assert.ok(matches(kettle, q), q);
  assert.ok(!matches(kettle, "the and sofa"));
  assert.ok(matches(kettle, "the and"));
  assert.equal(searchScore(kettle, "kettles kettle water"), 2);
});
test("relevance ranks more distinct words; explicit prices override relevance", () => {
  const a = { ...kettle, id: "a", price: 30000 },
    b = { ...kettle, id: "b", name: "Desk", price: 10000 };
  assert.deepEqual(
    sortProducts([b, a], "new", "kettle water").map((x) => x.id),
    ["a", "b"],
  );
  assert.deepEqual(
    sortProducts([a, b], "low", "kettle water").map((x) => x.id),
    ["b", "a"],
  );
  assert.deepEqual(
    sortProducts([b, a], "high", "kettle water").map((x) => x.id),
    ["a", "b"],
  );
});
test("spotlight shows only published lighting, disappears for search/filter/empty", () => {
  const lamp = { ...kettle, category: "Lighting & Chandeliers" },
    draft = { ...lamp, status: "draft" };
  assert.deepEqual(
    spotlightProducts([kettle, lamp, draft], "", "All essentials"),
    [lamp],
  );
  for (const [q, c] of [
    ["the", "All essentials"],
    ["", "Plants"],
  ])
    assert.deepEqual(spotlightProducts([lamp], q, c), []);
  assert.deepEqual(
    spotlightProducts([kettle, draft], "", "All essentials"),
    [],
  );
  assert.equal(categories.length, 9);
  assert.ok(categories.includes("Plants"));
});
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => mem.get(k) || null,
  setItem: (k, v) => mem.set(k, v),
};
globalThis.sessionStorage = {
  getItem: () =>
    JSON.stringify({ access_token: "test", expires_at: 9999999999 }),
};
globalThis.window = {
  STORE_CONFIG: {
    supabaseUrl: "https://example.supabase.co",
    supabaseKey: "sb_publishable_test",
  },
};
const data = await import("../dist/data.js?revision");
const response = (x) => ({ ok: true, text: async () => JSON.stringify(x) });
test("public URLs are stable, escaped and require no signing requests", async () => {
  globalThis.fetch = () => {
    throw Error("should not fetch");
  };
  const expected = [
    "https://example.supabase.co/storage/v1/object/public/product-images/folder/a%20b.jpg",
  ];
  assert.deepEqual(await data.resolveImages(["folder/a b.jpg"]), expected);
  assert.deepEqual(await data.resolveImages(["folder/a b.jpg"]), expected);
});
test("delete product removes unused files after row deletion, retains shared files", async () => {
  const calls = [];
  globalThis.fetch = async (url, opt) => {
    calls.push([url, opt]);
    return response(
      url.includes("select=images")
        ? [{ images: ["unused.jpg", "shared.jpg"] }]
        : url.includes("images=cs.")
          ? url.includes("shared")
            ? [{ id: "other" }]
            : []
          : [],
    );
  };
  assert.equal(await data.deleteProduct("p"), "");
  const deletion = calls.findIndex(
    ([u, o]) => u.includes("/rest/") && o.method === "DELETE",
  );
  const files = calls.filter(
    ([u, o]) => u.includes("/storage/") && o.method === "DELETE",
  );
  assert.equal(files.length, 1);
  assert.deepEqual(JSON.parse(files[0][1].body), { prefixes: ["unused.jpg"] });
  assert.ok(calls.indexOf(files[0]) > deletion);
});
test("saving a removed photo deletes only that photo, after successful PATCH", async () => {
  const calls = [];
  globalThis.fetch = async (url, opt) => {
    calls.push([url, opt]);
    return response(
      url.includes("select=images")
        ? [{ images: ["keep.jpg", "remove.jpg"] }]
        : [],
    );
  };
  await data.saveProduct({ id: "p", images: ["keep.jpg"] });
  assert.deepEqual(
    JSON.parse(calls.find(([u]) => u.includes("/storage/"))[1].body),
    { prefixes: ["remove.jpg"] },
  );
  assert.ok(
    calls.findIndex(([, o]) => o.method === "PATCH") <
      calls.findIndex(([u]) => u.includes("/storage/")),
  );
});
test("failed row save never deletes photos; failed cleanup returns a visible warning", async () => {
  let storageCalls = 0;
  globalThis.fetch = async (url, opt) => {
    if (url.includes("/storage/")) storageCalls++;
    if (opt.method === "PATCH") throw Error("offline");
    return response([{ images: ["old.jpg"] }]);
  };
  await assert.rejects(
    () => data.saveProduct({ id: "p", images: [] }),
    /offline/,
  );
  assert.equal(storageCalls, 0);
  globalThis.fetch = async () => {
    throw Error("offline");
  };
  assert.match(await data.cleanupPhotos(["old.jpg"]), /old.jpg/);
});
test("upload sends one-year cache header and unique JPEG filename", async () => {
  globalThis.createImageBitmap = async () => ({
    width: 100,
    height: 100,
    close() {},
  });
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({ fillRect() {}, drawImage() {} }),
      toBlob: (cb) => cb(new Blob(["x"], { type: "image/jpeg" })),
    }),
  };
  const calls = [];
  globalThis.fetch = async (u, o) => {
    calls.push([u, o]);
    return response({});
  };
  const a = await data.upload({ type: "image/jpeg", size: 10 }),
    b = await data.upload({ type: "image/jpeg", size: 10 });
  assert.notEqual(a, b);
  assert.match(a, /\.jpg$/);
  assert.equal(calls[0][1].headers["cache-control"], "max-age=31536000");
});
