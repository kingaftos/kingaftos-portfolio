const url = "https://wa.me/" + window.STORE_CONFIG.whatsapp.replace(/\D/g, "");
for (const id of ["contact", "returns-contact", "privacy-contact"]) {
  const a = document.getElementById(id);
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
}
document.getElementById("clear-data").onclick = () => {
  try {
    localStorage.removeItem("fhd-cart");
    localStorage.removeItem("fhd-wish");
    document.getElementById("cleared").textContent =
      "Your saved cart and wishlist have been cleared on this device.";
  } catch {
    document.getElementById("cleared").textContent =
      "Please clear this site’s data using your browser settings.";
  }
};
