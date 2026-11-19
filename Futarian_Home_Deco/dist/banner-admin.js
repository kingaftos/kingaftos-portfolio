import { bannerImage, getBanner, saveBanner } from "./banner.js";

const $ = (selector) => document.querySelector(selector);
const form = $("#banner-form");
let banner;
let active = false;
let busy = false;

function render(saved) {
  banner = saved;
  form.reset();
  for (const field of ["mode", "headline", "description", "image_alt"])
    form.elements[field].value = saved[field];
  const image = $("#banner-current-photo");
  const url = bannerImage(saved.image_path);
  image.hidden = !url;
  if (url) image.src = url;
  else image.removeAttribute("src");
  image.alt = saved.image_alt;
  $("#banner-remove-option").hidden = !url;
}

function setBusy(value) {
  busy = value;
  $("#banner-fields").disabled = busy || !banner || !active;
  $("#banner-reload").disabled = busy;
}

async function loadBanner() {
  if (!active || busy) return;
  banner = null;
  setBusy(true);
  const status = $("#banner-status");
  status.textContent = "Loading banner settings…";
  try {
    const saved = await getBanner(true);
    if (!saved) throw Error("No banner settings found. Run add-homepage-banner.sql in Supabase.");
    if (active) render(saved);
    status.textContent = "";
  } catch (err) {
    status.textContent =
      /homepage_banner|schema cache/i.test(err.message)
        ? "Run supabase/add-homepage-banner.sql in Supabase, then reload banner settings."
        : err.message;
  } finally {
    setBusy(false);
  }
}

export function showBannerEditor(allowed) {
  active = allowed;
  $("#banner-editor").hidden = !allowed;
  if (allowed) loadBanner();
  else {
    banner = null;
    form.reset();
    setBusy(busy);
  }
}

$("#banner-reload").onclick = loadBanner;
form.onsubmit = async (event) => {
  event.preventDefault();
  if (!active || busy || !banner) return;
  const fields = form.elements;
  const status = $("#banner-status");
  const file = fields.flyer.files[0];
  const settings = {
    mode: fields.mode.value,
    headline: fields.headline.value.trim(),
    description: fields.description.value.trim(),
    image_alt: fields.image_alt.value.trim(),
    image_path: fields.remove.checked ? "" : banner.image_path,
  };
  setBusy(true);
  status.textContent = "Saving banner…";
  try {
    const { saved, cleanupFailed } = await saveBanner(banner, settings, file);
    if (active) render(saved);
    status.textContent = cleanupFailed
      ? "Banner saved. The previous flyer could not be removed from Storage."
      : "Banner saved. Refresh the storefront to see it.";
  } catch (err) {
    status.textContent = err.message;
  } finally {
    setBusy(false);
    if (active && !banner) loadBanner();
  }
};
