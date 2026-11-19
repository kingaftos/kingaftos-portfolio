import { config } from "./data.js";
import { bannerImage, getBanner } from "./banner.js";

async function showBanner() {
  const banner = await getBanner();
  if (!banner || banner.mode === "original") return;

  if (banner.mode === "campaign") {
    document.querySelector("#campaign-title").textContent = banner.headline;
    document.querySelector("#campaign-description").textContent = banner.description;
    const photoLink = document.querySelector("#campaign-photo");
    const campaign = document.querySelector("#campaign-banner");
    const url = bannerImage(banner.image_path);
    if (url) {
      const image = document.querySelector("#campaign-image");
      image.alt = banner.image_alt;
      photoLink.href = url;
      image.addEventListener("error", () => {
        photoLink.hidden = true;
        campaign.classList.remove("has-photo");
      }, { once: true });
      campaign.classList.add("has-photo");
      photoLink.hidden = false;
      image.src = url;
    }
    const phone = (config.whatsapp || "").replace(/\D/g, "");
    if (phone) {
      const link = document.querySelector("#campaign-whatsapp");
      const message = "Hi Futarian Home Deco! I'd like to ask about " + banner.headline + ".";
      link.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
      link.hidden = false;
    }
    campaign.hidden = false;
  }

  document.querySelector("#original-banner").hidden = true;
}

// Keep the original room banner when the migration or connection is unavailable.
showBanner().catch(() => {});
