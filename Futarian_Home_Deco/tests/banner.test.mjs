import test from "node:test";
import assert from "node:assert/strict";

globalThis.window = { STORE_CONFIG: {
  supabaseUrl: "https://example.supabase.co",
  supabaseKey: "sb_publishable_fake",
  whatsapp: "2348000000000",
} };
globalThis.sessionStorage = { getItem: () => JSON.stringify({
  access_token: "test-admin",
  expires_at: Date.now() / 1000 + 3600,
}) };

const { getBanner, saveBanner } = await import("../dist/banner.js");
const baseline = {
  revision: "3ebd5157-dcdb-49df-8fd2-3c24eb85f721",
  mode: "original",
  headline: "Starter bundle",
  description: "Bedding and curtains",
  image_path: "",
  image_alt: "",
};

test("storefront fetches settings without an admin token", async () => {
  globalThis.fetch = async (url, request) => {
    assert.match(url, /homepage_banner\?id=eq\.1/);
    assert.equal(request.headers.Authorization, undefined);
    return Response.json([baseline]);
  };
  assert.deepEqual(await getBanner(), baseline);
});

test("admin can hide a promotion without losing the offer and flyer", async () => {
  const flyer = "01234567-abcd-4abc-8def-000000000000.jpg";
  const current = { ...baseline, mode: "campaign", image_path: flyer, image_alt: "Flyer" };
  globalThis.fetch = async (url, request) => {
    assert.ok(url.endsWith("&revision=eq." + baseline.revision));
    assert.equal(request.headers.Authorization, "Bearer test-admin");
    const body = JSON.parse(request.body);
    assert.notEqual(body.revision, baseline.revision);
    assert.equal(body.image_path, flyer);
    return Response.json([body]);
  };
  const { revision, ...fields } = current;
  const { saved } = await saveBanner(current, { ...fields, mode: "hidden" });
  assert.equal(saved.mode, "hidden");
  assert.equal(saved.headline, baseline.headline);
});

test("an older editor cannot overwrite a more recent save", async () => {
  globalThis.fetch = async () => Response.json([]);
  await assert.rejects(saveBanner(baseline, { mode: "hidden" }), /Reload banner settings/);
});
