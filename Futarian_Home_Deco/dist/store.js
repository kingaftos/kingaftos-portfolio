import {
  categories,
  money,
  sellingPrice,
  productPriceMarkup,
  listedSubtotal,
  matches,
  escapeHTML as e,
  safeUrl,
  checkoutMessage,
  sortProducts,
  socialLinks,
  spotlightProducts,
} from "./core.mjs";
import { products, storage, live, config } from "./data.js";
const $ = (s) => document.querySelector(s);
let catalogueReady = false;
let all = [],
  category = "All essentials",
  limit = 12;
let cart = storage.get("fhd-cart", {}),
  wish = storage.get("fhd-wish", []);
if (!cart || typeof cart !== "object" || Array.isArray(cart)) cart = {};
if (!Array.isArray(wish)) wish = [];
cart = Object.fromEntries(
  Object.entries(cart).filter(
    ([id, q]) =>
      typeof id === "string" && Number.isInteger(q) && q > 0 && q <= 99,
  ),
);
wish = wish.filter((id) => typeof id === "string");
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("visible"), 2600);
}
function persist() {
  storage.set("fhd-cart", cart);
  storage.set("fhd-wish", wish);
  counts();
}
function counts() {
  $("#cart-count").textContent = Object.values(cart).reduce(
    (s, q) => s + (Number.isInteger(q) ? q : 0),
    0,
  );
  $("#wish-count").textContent = wish.length;
}
function available(p) {
  return p.stock > 0;
}
function add(id) {
  const p = all.find((p) => p.id === id);
  if (!p || !available(p)) return;
  cart[id] = Math.min((cart[id] || 0) + 1, p.stock, 99);
  persist();
  toast("Added to your cart");
}
function toggleWish(id) {
  wish = wish.includes(id) ? wish.filter((x) => x !== id) : [...wish, id];
  persist();
  render();
}
const picture = (p) =>
  safeUrl((p.imageUrls || p.images)?.[0]) || "assets/placeholder.svg";
function card(p) {
  return `<article class="product"><div class="product-image"><button class="image-open" data-detail="${e(p.id)}" aria-label="View ${e(p.name)}"><img src="${e(picture(p))}" alt="${e(p.name)}" loading="lazy"></button><button class="heart ${wish.includes(p.id) ? "saved" : ""}" data-wish="${e(p.id)}" aria-label="${wish.includes(p.id) ? "Remove from" : "Add to"} wishlist" aria-pressed="${wish.includes(p.id)}">${wish.includes(p.id) ? "♥" : "♡"}</button>${p.featured ? '<span class="badge">Featured</span>' : ""}${!available(p) ? '<span class="stock-badge">Currently unavailable</span>' : ""}</div><p class="product-cat">${e(p.category)}${p.condition === "Used" ? " · Pre-owned" : ""}</p><button class="product-name" data-detail="${e(p.id)}">${e(p.name)}</button><div class="product-bottom">${productPriceMarkup(p)}<button class="add" data-add="${e(p.id)}" ${!available(p) ? "disabled" : ""} aria-label="Add ${e(p.name)} to cart">+</button></div></article>`;
}
function render() {
  const q = $("#search").value;
  const budget = $("#budget").value;
  let list = all.filter((p) => {
    const price = sellingPrice(p);
    return (
      (category === "All essentials" || p.category === category) &&
      matches(p, q) &&
      (!$("#available").checked || available(p)) &&
      (budget === "all" || (price !== null && price < Number(budget)))
    );
  });
  const sort = $("#sort").value;
  list = sortProducts(list, sort, q);
  const spotlight = spotlightProducts(all, q, category);
  $("#spotlight").hidden = !spotlight.length;
  $("#spotlight-products").innerHTML = spotlight.slice(0, 4).map(card).join("");
  $("#catalogue-title").textContent = q
    ? "Search results"
    : category === "All essentials"
      ? "All products"
      : category;
  $("#result-count").textContent =
    `${list.length} ${list.length === 1 ? "find" : "finds"}${q ? " matching “" + q + "”" : ""}`;
  $("#products").innerHTML = list.length
    ? list.slice(0, limit).map(card).join("")
    : `<div class="empty"><h3>${all.length ? "No finds just yet." : "Our collection is coming together."}</h3><p>Try a different search, or tell us what you’re looking for.</p><a class="secondary" href="${wa("Hello! I am looking for " + q)}" target="_blank" rel="noopener">Ask us on WhatsApp ↗</a></div>`;
  $("#loadmore").hidden = list.length <= limit;
  document.querySelectorAll("[data-category]").forEach((b) => {
    b.classList.toggle("active", b.dataset.category === category);
    b.setAttribute(
      "aria-current",
      b.dataset.category === category ? "true" : "false",
    );
  });
}
function wa(text) {
  return (
    "https://wa.me/" +
    config.whatsapp.replace(/\D/g, "") +
    "?text=" +
    encodeURIComponent(text)
  );
}
function openDrawer(title) {
  $("#drawer-title").textContent = title;
  if (!$("#drawer").open) $("#drawer").showModal();
}
function showWishlist() {
  openDrawer("Your wishlist");
  const list = all.filter((p) => wish.includes(p.id));
  const missing = wish.filter((id) => !all.some((p) => p.id === id));
  $("#drawer-body").innerHTML =
    `<p class="muted">Saved on this device.</p>${catalogueReady ? missing.map((id) => `<p>Item no longer listed <button class="textlink" data-unwish="${e(id)}">Remove</button></p>`).join("") : ""}${!catalogueReady ? "<p>Your wishlist is safe. Saved items will appear when the catalogue loads.</p>" : list.length ? list.map((p) => `<article class="cartline"><img src="${e(picture(p))}" alt="${e(p.name)}"><div><h3>${e(p.name)}</h3><p>${productPriceMarkup(p)}</p><button class="textlink" data-add="${e(p.id)}" ${!available(p) ? "disabled" : ""}>Add to cart</button> <button class="textlink" data-unwish="${e(p.id)}">Remove</button></div></article>`).join("") : '<div class="empty"><h3>Save a little home inspiration.</h3><p>Tap the heart on any product to keep it here.</p></div>'}`;
}
function showCart() {
  openDrawer("Your cart");
  const entries = Object.entries(cart).map(([id, qty]) => ({
    product: all.find((p) => p.id === id),
    qty,
  }));
  const missing = entries.some((x) => !x.product);
  const items = entries.filter((x) => x.product);
  const invalid =
    missing ||
    items.some(
      (x) => !Number.isInteger(x.qty) || x.qty < 1 || x.qty > x.product.stock,
    );
  $("#drawer-body").innerHTML =
    `<p class="muted">Review your selections.</p>${missing && !catalogueReady ? '<p class="error">Your saved cart is safe. Reload the catalogue to check these items.</p>' : missing ? '<p class="error">An item is no longer listed. <button class="textlink" id="remove-missing">Remove unavailable items</button></p>' : ""}${items.map(({ product: p, qty }) => `<article class="cartline"><img src="${e(picture(p))}" alt="${e(p.name)}"><div><h3>${e(p.name)}</h3><p>${productPriceMarkup(p)}${sellingPrice(p) === null ? "" : " each"}</p>${qty > p.stock ? '<p class="error">Quantity exceeds current stock. Please reduce or remove.</p>' : ""}<div class="quantity"><button data-qty="${e(p.id)}" data-change="-1" aria-label="Decrease quantity">−</button><span>${qty}</span><button data-qty="${e(p.id)}" data-change="1" aria-label="Increase quantity">+</button><button class="textlink" data-remove="${e(p.id)}">Remove</button></div></div></article>`).join("")}${items.length ? `<div class="carttotal"><span>Listed subtotal</span><strong>${money(listedSubtotal(items))}</strong></div>${items.some(({ product }) => sellingPrice(product) === null) ? "<p>Some items need a price quote.</p>" : ""}<p class="small muted">Delivery is confirmed on WhatsApp before payment. This is an enquiry, not a paid or reserved order.</p><label class="field">Anything we should know? <textarea id="order-note" maxlength="500" placeholder="Optional: preferred colour, size or delivery area"></textarea></label><button class="primary full" id="checkout" ${invalid ? "disabled" : ""}>Continue on WhatsApp ↗</button><button class="textlink" id="copy-order" ${invalid ? "disabled" : ""}>Copy enquiry instead</button><p class="small muted">You’ll review and send the message yourself. Your cart stays saved.</p>` : !missing ? '<div class="empty"><h3>A fresh start for your room.</h3><p>Your cart is empty. Browse the collection to find your first piece.</p><button class="secondary" data-close>Keep exploring</button></div>' : ""}`;
  const checkout = $("#checkout");
  if (!checkout || invalid) return;
  const copy = $("#copy-order");
  const note = $("#order-note");
  const drawer = $("#drawer");
  async function prepareEnquiry(copyInstead) {
    checkout.disabled = true;
    copy.disabled = true;
    checkout.textContent = "Checking availability and prices…";
    try {
      const latest = await products();
      if (!checkout.isConnected || !drawer.open) return;
      all = latest;
      const checked = items.map((x) => ({
        product: latest.find((p) => p.id === x.product.id),
        qty: x.qty,
      }));
      if (
        checked.some(
          (x) =>
            !x.product ||
            x.product.status !== "published" ||
            x.qty > x.product.stock,
        )
      )
        throw Error("An item changed availability. Please review your cart.");
      if (
        checked.some(
          ({ product }, i) => sellingPrice(product) !== sellingPrice(items[i].product),
        )
      )
        throw Error("A price has changed. Please review the updated subtotal.");
      const text = checkoutMessage(checked, note.value, !live);
      if (copyInstead) {
        try {
          await navigator.clipboard.writeText(text);
          toast("Enquiry copied. Paste it into WhatsApp.");
        } catch {
          toast("Clipboard unavailable. Please use the WhatsApp button.");
        }
        return;
      }
      const link = wa(text);
      if (link.length > 7500)
        throw Error(
          "Your enquiry is long. Use “Copy enquiry instead” and paste it into WhatsApp.",
        );
      window.location.href = link;
    } catch (err) {
      if (!checkout.isConnected || !drawer.open) return;
      toast(err.message);
      showCart();
      const updatedNote = $("#order-note");
      if (updatedNote) updatedNote.value = note.value;
      render();
    } finally {
      checkout.disabled = false;
      copy.disabled = false;
      checkout.textContent = "Continue on WhatsApp ↗";
    }
  }
  checkout.addEventListener("click", () => prepareEnquiry(false));
  copy.addEventListener("click", () => prepareEnquiry(true));
}
function detail(id) {
  const p = all.find((p) => p.id === id);
  if (!p) return;
  $("#detail-body").innerHTML =
    `<div class="detail-grid"><div><img id="main-image" class="detail-image" src="${e(picture(p))}" alt="${e(p.name)}"><div class="thumbs">${(p.imageUrls || p.images || []).map((u) => `<button data-image="${e(safeUrl(u))}" aria-label="Show product photo"><img src="${e(safeUrl(u))}" alt=""></button>`).join("")}</div></div><div class="detail-copy"><p class="eyebrow">${e(p.category)}</p><h2>${e(p.name)}</h2><h3>${productPriceMarkup(p, "Ask us for a price")}</h3><p class="description">${e(p.description)}</p><dl><dt>Condition</dt><dd>${e(p.condition)}</dd>${p.material ? "<dt>Material</dt><dd>" + e(p.material) + "</dd>" : ""}${p.dimensions ? "<dt>Dimensions</dt><dd>" + e(p.dimensions) + "</dd>" : ""}<dt>Availability</dt><dd>${available(p) ? "Available to enquire" : "Currently unavailable"}</dd></dl><button class="primary full" data-add="${e(p.id)}" ${!available(p) ? "disabled" : ""}>Add to cart +</button><a class="secondary full" href="${wa("Hello! Please tell me more about " + p.name + " [" + p.id + "]" + (!live ? " (sample catalogue item)" : ""))}" target="_blank" rel="noopener">Ask about this item ↗</a><p class="small muted">Confirm your preferred size, colour, stock and delivery on WhatsApp. Photos show the listed item or its style; confirm the exact supplied version before payment.</p><a class="small textlink" href="policies.html#returns">Returns & refunds</a></div></div>`;
  $("#detail").showModal();
}
document.addEventListener("click", (ev) => {
  const b = ev.target.closest("button");
  if (!b) return;
  if (b.hasAttribute("data-close")) b.closest("dialog").close();
  if (b.dataset.detail) detail(b.dataset.detail);
  if (b.dataset.add) add(b.dataset.add);
  if (b.dataset.wish) toggleWish(b.dataset.wish);
  if (b.dataset.unwish) {
    toggleWish(b.dataset.unwish);
    showWishlist();
  }
  if (b.dataset.remove) {
    delete cart[b.dataset.remove];
    persist();
    showCart();
  }
  if (b.dataset.qty) {
    const p = all.find((x) => x.id === b.dataset.qty);
    if (!p) return;
    const next = cart[p.id] + Number(b.dataset.change);
    if (next <= 0) delete cart[p.id];
    else if (p.stock <= 0) delete cart[p.id];
    else cart[p.id] = Math.min(next, p.stock, 99);
    persist();
    showCart();
  }
  if (b.dataset.image) $("#main-image").src = b.dataset.image;
  if (b.id === "remove-missing" && catalogueReady) {
    for (const id in cart) if (!all.some((p) => p.id === id)) delete cart[id];
    persist();
    showCart();
  }
});
document.addEventListener(
  "error",
  async (ev) => {
    const img = ev.target;
    if (img.tagName !== "IMG" || img.src.endsWith("placeholder.svg")) return;
    img.src = "assets/placeholder.svg";
  },
  true,
);
$("#categories").innerHTML = ["All essentials", ...categories]
  .map(
    (c, i) =>
      `<button data-category="${e(c)}"><span>${["◫", "▱", "⌁", "☼", "◯", "▥", "▤", "◇", "♧", "▦"][i]}</span>${e(c)}<span class="cat-arrow">↗</span></button>`,
  )
  .join("");
$("#categories").addEventListener("click", (ev) => {
  const b = ev.target.closest("button");
  if (b) {
    category = b.dataset.category;
    limit = 12;
    render();
  }
});
$(".search").addEventListener("submit", (ev) => {
  ev.preventDefault();
  $("#catalogue").scrollIntoView({ behavior: "smooth" });
});
for (const sel of ["#search", "#sort", "#available", "#budget"])
  $(sel).addEventListener(sel === "#search" ? "input" : "change", () => {
    limit = 12;
    render();
  });
$("#reset").onclick = () => {
  $("#search").value = "";
  $("#budget").value = "all";
  $("#available").checked = false;
  category = "All essentials";
  render();
};
$("#loadmore").onclick = () => {
  limit += 12;
  render();
};
$("#wishlist").onclick = showWishlist;
$("#cart").onclick = showCart;
for (const s of ["#request-link", "#request-bottom"])
  $(s).href = wa(
    "Hello Futarian Home Deco! I'm looking for something for my room.",
  );
$("#demo-banner").hidden = live || config.demo === false;
$("#year").textContent = new Date().getFullYear();
$("#socials").innerHTML = socialLinks(config)
  .map(
    (k) =>
      `<a href="${e(safeUrl(config[k]))}" target="_blank" rel="noopener">${k === "instagram" ? "Instagram" : "TikTok"} ↗</a>`,
  )
  .join("");
counts();
async function load() {
  try {
    all = await products();
    catalogueReady = true;
    render();
  } catch {
    catalogueReady = false;
    $("#result-count").textContent = "The catalogue could not load.";
    $("#products").innerHTML =
      '<div class="empty"><h3>Unable to load products.</h3><p>Please try again, or contact us on WhatsApp.</p><button class="secondary" id="retry">Try again</button></div>';
    $("#retry").onclick = load;
  }
}
load();
