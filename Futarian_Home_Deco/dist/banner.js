import { api, config, live, upload } from "./data.js";

const endpoint = "/rest/v1/homepage_banner";
const bucket = "banner-images";

export function bannerImage(path) {
  return /^[0-9a-f-]{36}[.]jpg$/.test(path || "")
    ? config.supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + path
    : "";
}

export async function getBanner(auth = false) {
  if (!live) return null;
  const [banner] = await api(endpoint + "?id=eq.1&select=*", { auth });
  return banner || null;
}

export async function saveBanner(banner, settings, file) {
  if (settings.mode === "campaign" && !settings.headline)
    throw Error("Enter a title for your custom offer.");
  if (settings.mode === "campaign" && (file || settings.image_path) && !settings.image_alt)
    throw Error("Describe the flyer so customers who use a screen reader can understand it.");

  const imagePath = file ? await upload(file, bucket) : settings.image_path;
  const [saved] = await api(
    endpoint + "?id=eq.1&revision=eq." + encodeURIComponent(banner.revision),
    {
      method: "PATCH",
      auth: true,
      body: { ...settings, image_path: imagePath, revision: crypto.randomUUID() },
    },
  );
  if (!saved) {
    if (file) await removeBannerImage(imagePath).catch(() => {});
    throw Error("The banner changed in another session. Reload banner settings before saving again.");
  }
  let cleanupFailed = false;
  if (banner.image_path && banner.image_path !== saved.image_path) {
    try {
      await removeBannerImage(banner.image_path);
    } catch {
      cleanupFailed = true;
    }
  }
  return { saved, cleanupFailed };
}

function removeBannerImage(path) {
  return api("/storage/v1/object/" + bucket, {
    method: "DELETE",
    auth: true,
    body: { prefixes: [path] },
  });
}
