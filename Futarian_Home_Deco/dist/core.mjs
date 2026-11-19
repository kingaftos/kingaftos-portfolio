export const categories = [
  "Furniture",
  "Appliances",
  "Lighting & Chandeliers",
  "Mirrors & Art",
  "Curtains & Blinds",
  "Bedding",
  "Home Decor",
  "Plants",
  "Storage & Organisation",
];
export const money = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
export function hasPromo({ price, promo_price }) {
  return (
    Number.isInteger(price) &&
    Number.isInteger(promo_price) &&
    promo_price > 0 &&
    promo_price < price
  );
}
export function sellingPrice(product) {
  return hasPromo(product) ? product.promo_price : (product.price ?? null);
}
export function productPriceMarkup(product, quoteLabel = "Ask for price") {
  const price = sellingPrice(product);
  if (hasPromo(product))
    return `<span class="price-pair"><del><span class="visually-hidden">Regular price </span>${money(product.price)}</del> <strong class="promo-price"><span class="visually-hidden">Promo price </span>${money(price)}</strong></span>`;
  return `<strong>${price === null ? escapeHTML(quoteLabel) : money(price)}</strong>`;
}
export function listedSubtotal(items) {
  return items.reduce(
    (total, { product, qty }) => total + (sellingPrice(product) ?? 0) * qty,
    0,
  );
}
export const normalise = (s) =>
  String(s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const stopwords = new Set(
  "the and for with from a an of to in on at by or".split(" "),
);
const singular = (word) =>
  word.endsWith("ies") && word.length > 4
    ? word.slice(0, -3) + "y"
    : /(?:ches|shes|xes|zes|sses)$/.test(word)
      ? word.slice(0, -2)
      : word.endsWith("s") && !/(ss|us|is)$/.test(word) && word.length > 3
        ? word.slice(0, -1)
        : word;
export const searchWords = (q) => [
  ...new Set(
    normalise(q)
      .split(" ")
      .filter((w) => w && !stopwords.has(w))
      .map(singular),
  ),
];
export function searchScore(p, q) {
  const hay = normalise(
    [
      p.name,
      p.description,
      p.category,
      p.material,
      p.dimensions,
      ...(p.tags || []),
    ].join(" "),
  )
    .split(" ")
    .map(singular);
  return searchWords(q).filter((word) =>
    hay.some((value) => value.includes(word)),
  ).length;
}
export function matches(p, q) {
  return !searchWords(q).length || searchScore(p, q) > 0;
}
export function spotlightProducts(list, query, category) {
  return query.trim() || category !== "All essentials"
    ? []
    : list.filter(
        (p) =>
          p.status === "published" && p.category === "Lighting & Chandeliers",
      );
}
export function safeUrl(s) {
  if (typeof s !== "string" || !s.trim()) return "";
  try {
    const u = new URL(s, globalThis.location?.origin || "https://example.com");
    return ["https:", "http:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}
export const escapeHTML = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function checkoutMessage(items, note = "", demo = false) {
  const lines = items.map(({ product, qty }) => {
    const price = sellingPrice(product);
    return `• ${product.name} [${product.id}] × ${qty} — ${price === null ? "Please quote" : money(price * qty)}`;
  });
  const needsQuote = items.some(({ product }) => sellingPrice(product) === null);
  return `${demo ? "DEMO ENQUIRY — sample products/prices, not an order.\n\n" : ""}Hello Futarian Home Deco! I'd like to enquire about:\n\n${lines.join("\n")}\n\nListed subtotal: ${money(listedSubtotal(items))}${needsQuote ? " + items awaiting a quote" : ""}\nDelivery fee: please confirm.\nPlease confirm availability, final total and delivery timing before payment.${note ? "\n\nMy note: " + note : ""}`;
}

export function sortProducts(list, sort, query = "") {
  return [...list].sort((a, b) =>
    sort === "low"
      ? (sellingPrice(a) ?? Infinity) - (sellingPrice(b) ?? Infinity)
      : sort === "high"
        ? (sellingPrice(b) ?? -1) - (sellingPrice(a) ?? -1)
        : sort === "name"
          ? a.name.localeCompare(b.name)
          : searchScore(b, query) - searchScore(a, query) ||
            new Date(b.created_at) - new Date(a.created_at),
  );
}
export function socialLinks(config) {
  return ["instagram", "tiktok"].filter(
    (k) => /^https:\/\//.test(config[k] || "") && safeUrl(config[k]),
  );
}
