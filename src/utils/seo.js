const SITE_NAME = "Kitchen Shop";
const SITE_URL = "https://ulichigor.github.io/kitchen-shop/";

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export function setPageSeo({ title, description, path = "", type = "website" }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : "Товари для дому, ремонту, двері та вікна";
  const canonical = SITE_URL;
  const pageUrl = SITE_URL + path;
  document.title = fullTitle;
  setMeta("name", "description", description);
  setMeta("property", "og:type", type);
  setMeta("property", "og:site_name", SITE_NAME);
  setMeta("property", "og:title", fullTitle);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", pageUrl);
  setMeta("name", "twitter:card", "summary");
  setMeta("name", "twitter:title", fullTitle);
  setMeta("name", "twitter:description", description);

  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = canonical;
}
