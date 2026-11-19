import { safeUrl } from "./core.mjs";
export const config = { ...window.STORE_CONFIG };
config.supabaseUrl = (config.supabaseUrl || "").trim().replace(/\/$/, "");
config.supabaseKey = (config.supabaseKey || "").trim();
export const live = Boolean(config.supabaseUrl && config.supabaseKey);
const storage = {
  get(k, f) {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? f;
    } catch {
      return f;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};
export { storage };
let session = null;
try {
  session = JSON.parse(sessionStorage.getItem("fhd-admin"));
} catch {}
let refreshing;
function saveSession(s) {
  session = s;
  try {
    s
      ? sessionStorage.setItem("fhd-admin", JSON.stringify(s))
      : sessionStorage.removeItem("fhd-admin");
  } catch {}
}
export function signedIn() {
  return !!session;
}
async function token() {
  if (!session) return null;
  if (session.expires_at * 1000 < Date.now() + 60000) {
    if (!refreshing)
      refreshing = fetch(
        config.supabaseUrl + "/auth/v1/token?grant_type=refresh_token",
        {
          method: "POST",
          headers: {
            apikey: config.supabaseKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        },
      )
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) {
            saveSession(null);
            throw Error("Your session expired. Please sign in again.");
          }
          saveSession({
            ...d,
            expires_at: Math.floor(Date.now() / 1000) + d.expires_in,
          });
        })
        .finally(() => (refreshing = null));
    await refreshing;
  }
  return session.access_token;
}
export async function api(
  path,
  { method = "GET", body, auth = false, raw = false, cacheControl } = {},
) {
  const access = auth ? await token() : null;
  if (auth && !access) throw Error("Please sign in.");
  const h = { apikey: config.supabaseKey };
  if (cacheControl) h["cache-control"] = "max-age=" + cacheControl;
  if (access) h.Authorization = "Bearer " + access;
  else if (config.supabaseKey.startsWith("eyJ"))
    h.Authorization = "Bearer " + config.supabaseKey;
  if (!raw) h["Content-Type"] = "application/json";
  if (method !== "GET" && path.startsWith("/rest/v1/"))
    h.Prefer = "return=representation";
  const r = await fetch(config.supabaseUrl + path, {
    method,
    headers: h,
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  const txt = await r.text();
  let d;
  try {
    d = JSON.parse(txt);
  } catch {
    d = txt;
  }
  if (!r.ok)
    throw Error(
      typeof d === "object"
        ? d.message || d.error_description || d.error || "Request failed"
        : "Request failed. Please try again.",
    );
  return d;
}
export async function login(email, password) {
  const d = await api("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email, password },
  });
  saveSession({
    ...d,
    expires_at: Math.floor(Date.now() / 1000) + d.expires_in,
  });
  try {
    const rows = await api("/rest/v1/admin_users?select=user_id", {
      auth: true,
    });
    if (!rows.length)
      throw Error("This account has not been granted admin access.");
  } catch (e) {
    await logout();
    throw e;
  }
}
export async function logout() {
  try {
    if (session) await api("/auth/v1/logout", { method: "POST", auth: true });
  } finally {
    saveSession(null);
  }
}
// UUID fallback keeps the local HTTP preview usable; production uses Web Crypto.
const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = globalThis.crypto?.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(1))[0] & 15
      : Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 3) | 8).toString(16);
  });
const img = (n) => "assets/" + n + ".jpg";
const base = [
  [
    "bed",
    "Wooden bed frame",
    "Furniture",
    85000,
    "A simple solid-looking bed frame for a comfortable student room. Ask about available sizes.",
    "wood plywood bedroom frame",
    "assets/room.webp",
  ],
  [
    "chair",
    "Everyday accent chair",
    "Furniture",
    42000,
    "A cosy fabric chair for reading, relaxing and making your space yours.",
    "seat armchair fabric living room",
    img("chair"),
  ],
  [
    "rack",
    "Wooden storage cabinet",
    "Storage & Organisation",
    18500,
    "Keep towels and everyday essentials organised in a compact wooden storage cabinet.",
    "wardrobe hanger rail storage wooden",
    img("rack"),
  ],
  [
    "duvet",
    "Soft duvet set",
    "Bedding",
    24000,
    "An inviting duvet set. Confirm colours, size and included pieces on WhatsApp.",
    "blanket sheets pillows bed linen",
    img("duvet"),
  ],
  [
    "mirror",
    "Full-length floor mirror",
    "Mirrors & Art",
    32000,
    "A warm wood-framed mirror that brightens your room and your morning routine.",
    "standing looking glass dressing wooden",
    img("mirror"),
  ],
  [
    "lamp",
    "Adjustable reading lamp",
    "Lighting & Chandeliers",
    12500,
    "An adjustable lamp for your desk or reading corner.",
    "light desk shade bedroom",
    img("lamp"),
  ],
  [
    "kettle",
    "Everyday electric kettle",
    "Appliances",
    15000,
    "A compact kettle for your daily tea and hot water. Confirm capacity and warranty.",
    "boiler kitchen electric water",
    img("kettle"),
  ],
  [
    "curtain",
    "Light-filtering curtains",
    "Curtains & Blinds",
    18000,
    "Soft neutral curtains for a calm, welcoming room. Ask about measurements and fitting.",
    "drapes window cream privacy",
    "assets/room.webp",
  ],
].map(([id, name, category, price, description, tags, image], i) => ({
  id,
  name,
  category,
  price,
  description,
  tags: tags.split(" "),
  images: [image],
  stock: 10,
  status: "published",
  condition: "New",
  featured: i < 4,
  material: "",
  dimensions: "",
  created_at: new Date(2026, 10, 1, i).toISOString(),
}));
export function demoProducts() {
  return storage
    .get("fhd-demo-products", base)
    .map((p) => ({
      ...p,
      category:
        p.category === "Lighting"
          ? "Lighting & Chandeliers"
          : p.category === "Mirrors & Decor"
            ? "Mirrors & Art"
            : p.category,
    }));
}
export async function products(admin = false) {
  if (!live) {
    if (config.demo === false)
      throw Error(
        "Store configuration is incomplete. Please contact us on WhatsApp.",
      );
    return demoProducts().filter((p) => admin || p.status === "published");
  }
  let result = [],
    offset = 0;
  while (true) {
    const page = await api(
      "/rest/v1/products?select=*&order=created_at.desc,id.asc&limit=500&offset=" +
        offset +
        (admin ? "" : "&status=eq.published"),
      { auth: admin },
    );
    result.push(...page);
    if (page.length < 500) {
      const paths = [...new Set(result.flatMap((p) => p.images || []))];
      const urls = await resolveImages(paths, admin);
      const map = new Map(paths.map((path, i) => [path, urls[i]]));
      for (const p of result)
        p.imageUrls = (p.images || []).map((path) => map.get(path));
      return result;
    }
    offset += 500;
  }
}
export async function saveProduct(p) {
  const { imageUrls, ...clean } = p;
  p = clean;
  if (!live) {
    const all = demoProducts();
    const i = all.findIndex((x) => x.id === p.id);
    if (i >= 0) all[i] = p;
    else all.unshift({ ...p, id: uid(), created_at: new Date().toISOString() });
    storage.set("fhd-demo-products", all);
    return;
  }
  const old = p.id
    ? await api(
        "/rest/v1/products?select=images&id=eq." + encodeURIComponent(p.id),
        { auth: true },
      )
    : [];
  if (p.id)
    await api("/rest/v1/products?id=eq." + encodeURIComponent(p.id), {
      method: "PATCH",
      body: p,
      auth: true,
    });
  else {
    const { id, ...rest } = p;
    await api("/rest/v1/products", { method: "POST", body: rest, auth: true });
  }
  return cleanupPhotos(
    (old[0]?.images || []).filter((path) => !p.images.includes(path)),
  );
}
export async function deleteProduct(id) {
  if (!live) {
    storage.set(
      "fhd-demo-products",
      demoProducts().filter((p) => p.id !== id),
    );
    return;
  }
  const old = await api(
    "/rest/v1/products?select=images&id=eq." + encodeURIComponent(id),
    { auth: true },
  );
  await api("/rest/v1/products?id=eq." + encodeURIComponent(id), {
    method: "DELETE",
    auth: true,
  });
  return cleanupPhotos(old[0]?.images || []);
}
export async function checkAdmin() {
  if (!live) return config.demo !== false;
  if (!signedIn()) return false;
  const rows = await api("/rest/v1/admin_users?select=user_id", { auth: true });
  return rows.length > 0;
}
export async function resolveImages(paths) {
  if (!live) return paths;
  return paths.map(
    (path) =>
      config.supabaseUrl +
      "/storage/v1/object/public/product-images/" +
      path.split("/").map(encodeURIComponent).join("/"),
  );
}
// Delete only after the row mutation succeeds, and retain files used by another product.
export async function cleanupPhotos(paths) {
  if (!live || !paths.length) return "";
  try {
    for (const path of new Set(paths)) {
      if (!path || path.includes("://")) continue;
      const refs = await api(
        "/rest/v1/products?select=id&limit=1&images=cs." +
          encodeURIComponent("{" + JSON.stringify(path) + "}"),
        { auth: true },
      );
      if (!refs.length)
        await api("/storage/v1/object/product-images", {
          method: "DELETE",
          auth: true,
          body: { prefixes: [path] },
        });
    }
    return "";
  } catch {
    return (
      "Product change saved, but some unused photos could not be deleted. In Supabase Storage, check these files against products.images before deleting: " +
      paths.join(", ")
    );
  }
}
export async function resizePhoto(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(Error("Could not resize photo.")),
      "image/jpeg",
      0.82,
    ),
  );
}
export async function upload(file, bucket = "product-images") {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw Error("Use a JPG, PNG or WebP under 5 MB.");
  if (!live) throw Error("Image uploads need a connected Supabase project.");
  const blob = await resizePhoto(file);
  const name = uid() + ".jpg";
  await api("/storage/v1/object/" + bucket + "/" + name, {
    method: "POST",
    body: blob,
    auth: true,
    raw: true,
    cacheControl: "31536000",
  });
  return name;
}
