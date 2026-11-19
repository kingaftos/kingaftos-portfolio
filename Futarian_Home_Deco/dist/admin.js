import {
  categories,
  hasPromo,
  productPriceMarkup,
  matches,
  escapeHTML as e,
  safeUrl,
} from "./core.mjs";
import {
  live,
  products,
  login,
  logout,
  signedIn,
  saveProduct,
  deleteProduct,
  upload,
  checkAdmin,
  resolveImages,
  config,
  cleanupPhotos,
} from "./data.js";
import { showBannerEditor } from "./banner-admin.js";
const $ = (s) => document.querySelector(s);
let all = [],
  images = [],
  busy = false,
  dirty = false,
  pendingUploads = [];
const form = $("#product-form");
$("#editor-category").innerHTML = categories
  .map((c) => `<option>${e(c)}</option>`)
  .join("");
function error(sel, t) {
  $(sel).hidden = !t;
  $(sel).textContent = t;
}
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").classList.add("visible");
  setTimeout(() => $("#toast").classList.remove("visible"), 3000);
}
function render() {
  const list = all.filter(
    (p) =>
      matches(p, $("#admin-search").value) &&
      ($("#admin-filter").value === "all" ||
        p.status === $("#admin-filter").value),
  );
  $("#total").textContent = all.length;
  $("#published").textContent = all.filter(
    (p) => p.status === "published",
  ).length;
  $("#lowstock").textContent = all.filter((p) => p.stock <= 2).length;
  $("#admin-products").innerHTML = list.length
    ? `<table><thead><tr><th>Photo</th><th>Product</th><th>Price</th><th>Stock</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>${list.map((p) => `<tr><td><img src="${e(safeUrl((p.imageUrls || p.images)?.[0]) || "assets/placeholder.svg")}" alt=""></td><td><strong>${e(p.name)}</strong><br><span class="small muted">${e(p.category)}</span></td><td>${productPriceMarkup(p, "Quote")}</td><td>${p.stock}</td><td><span class="status">${e(p.status)}</span></td><td><button class="textlink" data-edit="${e(p.id)}">Edit</button> · <button class="textlink" data-delete="${e(p.id)}">Delete</button></td></tr>`).join("")}</tbody></table>`
    : '<div class="empty"><h3>No products here yet.</h3><p>Add your first product or adjust the filter.</p></div>';
}
async function load() {
  error("#admin-error", "");
  try {
    all = await products(true);
    render();
  } catch (err) {
    error("#admin-error", err.message);
  }
}
async function view() {
  let access = false;
  try {
    access = await checkAdmin();
  } catch (err) {
    error("#login-error", err.message);
  }
  if (live && signedIn() && !access)
    error(
      "#login-error",
      "Admin approval is missing or the session expired. Sign in with your approved account.",
    );
  $("#login-box").hidden = access;
  $("#manager").hidden = !access;
  $("#logout").hidden = !live || !access;
  showBannerEditor(access && live);
  if (access) load();
}
$("#mode").hidden = live || config.demo === false;
if (!live)
  $("#mode").textContent =
    "Demo manager — changes are saved only in this browser, not in a live Supabase database. File uploads require Supabase. Connect the project in config.js before launch.";
$("#login-form").onsubmit = async (ev) => {
  ev.preventDefault();
  const b = ev.submitter;
  b.disabled = true;
  error("#login-error", "");
  try {
    const d = new FormData(ev.target);
    await login(d.get("email"), d.get("password"));
    ev.target.reset();
    view();
  } catch (err) {
    error("#login-error", err.message);
  } finally {
    b.disabled = false;
  }
};
$("#logout").onclick = async () => {
  try {
    await logout();
  } catch {}
  view();
};
async function renderImages() {
  let urls;
  try {
    urls = await resolveImages(images, true);
  } catch (err) {
    error("#save-error", err.message);
    urls = [];
  }
  $("#image-list").innerHTML = images
    .map(
      (u, i) =>
        `<div><img src="${e(safeUrl(urls[i]) || "assets/placeholder.svg")}" alt="Product photo ${i + 1}"><button type="button" data-image-remove="${i}" aria-label="Remove photo ${i + 1}">✕</button></div>`,
    )
    .join("");
}
function edit(p) {
  form.reset();
  pendingUploads = [];
  images = [...(p?.images || [])];
  for (const name of [
    "id",
    "name",
    "category",
    "condition",
    "price",
    "promo_price",
    "stock",
    "material",
    "dimensions",
    "description",
    "status",
  ])
    if (p && p[name] !== null && p[name] !== undefined)
      form.elements[name].value = p[name];
  form.elements.tags.value = (p?.tags || []).join(", ");
  form.elements.featured.checked = !!p?.featured;
  $("#editor-title").textContent = p ? "Edit product" : "Add product";
  error("#save-error", "");
  renderImages();
  dirty = false;
  $("#editor").showModal();
}
$("#new-product").onclick = () => edit(null);
$("#admin-search").oninput = render;
$("#admin-filter").onchange = render;
$("#refresh").onclick = load;
form.addEventListener("input", () => (dirty = true));
async function closeEditor() {
  if (busy) return;
  if (dirty && !confirm("Discard unsaved product changes?")) return;
  $("#editor").close();
  dirty = false;
  const warning = await cleanupPhotos(pendingUploads);
  pendingUploads = [];
  if (warning) error("#admin-error", warning);
}
$("#editor").addEventListener("cancel", (ev) => {
  ev.preventDefault();
  closeEditor();
});
window.addEventListener("beforeunload", (ev) => {
  if (dirty) {
    ev.preventDefault();
    ev.returnValue = "";
  }
});
document.addEventListener("click", async (ev) => {
  const b = ev.target.closest("button");
  if (!b) return;
  if (b.hasAttribute("data-close")) closeEditor();
  if (b.dataset.edit) edit(all.find((p) => p.id === b.dataset.edit));
  if (b.dataset.delete) {
    if (
      !confirm(
        "Delete this product permanently? It will be removed from the store.",
      )
    )
      return;
    b.disabled = true;
    try {
      const warning = await deleteProduct(b.dataset.delete);
      await load();
      toast("Product deleted");
      if (warning) error("#admin-error", warning);
    } catch (err) {
      error("#admin-error", err.message);
      b.disabled = false;
    }
  }
  if (b.dataset.imageRemove !== undefined) {
    images.splice(Number(b.dataset.imageRemove), 1);
    dirty = true;
    renderImages();
  }
});
$("#url-field").hidden = live;
$("#add-url").hidden = live;
$("#add-url").onclick = () => {
  if (live) return;
  const val = $("#photo-url").value.trim();
  if (!val.startsWith("https://") || !safeUrl(val)) {
    error("#save-error", "Enter a valid HTTPS image URL.");
    return;
  }
  if (images.length >= 6) {
    error("#save-error", "Use up to 6 photos.");
    return;
  }
  images.push(val);
  $("#photo-url").value = "";
  dirty = true;
  renderImages();
};
$("#upload").onchange = async (ev) => {
  const files = [...ev.target.files];
  error("#save-error", "");
  if (files.length + images.length > 6) {
    error("#save-error", "Use up to 6 photos.");
    return;
  }
  busy = true;
  $("#save").disabled = true;
  try {
    for (const f of files) {
      const path = await upload(f);
      pendingUploads.push(path);
      images.push(path);
      dirty = true;
      renderImages();
    }
    toast("Photos uploaded. Save the product to attach them.");
  } catch (err) {
    error("#save-error", err.message);
  } finally {
    busy = false;
    $("#save").disabled = false;
    ev.target.value = "";
  }
};
form.onsubmit = async (ev) => {
  ev.preventDefault();
  if (busy) return;
  const d = new FormData(form);
  const p = {
    id: d.get("id") || undefined,
    name: d.get("name").trim(),
    category: d.get("category"),
    condition: d.get("condition"),
    price: d.get("price") === "" ? null : Number(d.get("price")),
    promo_price:
      d.get("promo_price") === "" ? null : Number(d.get("promo_price")),
    stock: Number(d.get("stock")),
    material: d.get("material").trim(),
    dimensions: d.get("dimensions").trim(),
    description: d.get("description").trim(),
    tags: d
      .get("tags")
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 30),
    status: d.get("status"),
    featured: d.has("featured"),
    images,
  };
  error("#save-error", "");
  if (!p.name || !p.description) {
    error("#save-error", "Add a product name and description.");
    return;
  }
  if (p.promo_price !== null && !hasPromo(p)) {
    error("#save-error", "Enter a regular price and a lower promo price.");
    form.elements.promo_price.focus();
    return;
  }
  if (p.status === "published" && !images.length) {
    error("#save-error", "Add at least one photo before publishing.");
    return;
  }
  busy = true;
  $("#save").disabled = true;
  $("#save").textContent = "Saving…";
  try {
    const warning = await saveProduct(p);
    const uploadWarning = await cleanupPhotos(
      pendingUploads.filter((path) => !images.includes(path)),
    );
    pendingUploads = [];
    dirty = false;
    $("#editor").close();
    await load();
    toast("Product saved");
    if (warning || uploadWarning)
      error("#admin-error", warning || uploadWarning);
  } catch (err) {
    error("#save-error", err.message);
  } finally {
    busy = false;
    $("#save").disabled = false;
    $("#save").textContent = "Save product";
  }
};
document.addEventListener(
  "error",
  (ev) => {
    if (
      ev.target.tagName === "IMG" &&
      !ev.target.src.endsWith("placeholder.svg")
    )
      ev.target.src = "assets/placeholder.svg";
  },
  true,
);
view();
