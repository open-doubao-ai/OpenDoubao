import { t } from "./i18n/index.js";

/** Full-viewport image preview (table cells, detail form, product gallery). */
export function openImageLightbox(
  getUrls: () => string[],
  startIndex: number,
): void {
  document.getElementById("detail-image-lightbox")?.remove();
  let urls = getUrls().filter(Boolean);
  if (!urls.length) return;
  let idx = Math.max(0, Math.min(startIndex, urls.length - 1));

  const modal = document.createElement("div");
  modal.id = "detail-image-lightbox";
  modal.className = "detail-lightbox";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  Object.assign(modal.style, {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "2147483646",
    margin: "0",
    display: "flex",
    flexDirection: "column",
    background: "rgba(0, 0, 0, 0.88)",
    boxSizing: "border-box",
  });

  const body = document.createElement("div");
  body.className = "detail-lightbox-body";

  const stage = document.createElement("div");
  stage.className = "detail-lightbox-stage";
  const img = document.createElement("img");
  img.className = "detail-lightbox-img";
  img.referrerPolicy = "no-referrer";
  stage.appendChild(img);

  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "detail-lightbox-nav";
  prev.textContent = "<";
  prev.title = t("common.previous");
  prev.setAttribute("aria-label", "Previous");
  const next = document.createElement("button");
  next.type = "button";
  next.className = "detail-lightbox-nav detail-lightbox-nav-next";
  next.textContent = ">";
  next.title = t("common.next");
  next.setAttribute("aria-label", "Next");
  const close = document.createElement("button");
  close.type = "button";
  close.className = "detail-lightbox-close";
  close.textContent = "×";
  close.setAttribute("aria-label", "Close");

  const caption = document.createElement("div");
  caption.className = "detail-lightbox-caption";

  const strip = document.createElement("div");
  strip.className = "detail-lightbox-strip";

  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const teardown = () => {
    document.body.style.overflow = prevOverflow;
    document.removeEventListener("keydown", onKey);
    modal.remove();
  };

  const paint = () => {
    urls = getUrls().filter(Boolean);
    if (!urls.length) {
      teardown();
      return;
    }
    if (idx >= urls.length) idx = urls.length - 1;
    if (idx < 0) idx = 0;
    img.src = urls[idx] || "";
    caption.textContent = `${idx + 1} / ${urls.length}`;
    prev.style.visibility = urls.length > 1 ? "visible" : "hidden";
    next.style.visibility = urls.length > 1 ? "visible" : "hidden";
    strip.innerHTML = "";
    urls.forEach((u, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className =
        "detail-lightbox-strip-item" + (i === idx ? " is-active" : "");
      const thumb = document.createElement("img");
      thumb.src = u;
      thumb.alt = "";
      thumb.referrerPolicy = "no-referrer";
      thumb.loading = "lazy";
      b.appendChild(thumb);
      b.onclick = (e) => {
        e.stopPropagation();
        idx = i;
        paint();
      };
      strip.appendChild(b);
    });
    const active = strip.querySelector(".is-active");
    active?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  prev.onclick = (e) => {
    e.stopPropagation();
    idx = (idx - 1 + urls.length) % urls.length;
    paint();
  };
  next.onclick = (e) => {
    e.stopPropagation();
    idx = (idx + 1) % urls.length;
    paint();
  };
  close.onclick = (e) => {
    e.stopPropagation();
    teardown();
  };
  modal.onclick = (e) => {
    if (e.target === modal || e.target === body) teardown();
  };
  stage.onclick = (e) => e.stopPropagation();
  strip.onclick = (e) => e.stopPropagation();

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") teardown();
    if (e.key === "ArrowLeft") prev.click();
    if (e.key === "ArrowRight") next.click();
  }
  document.addEventListener("keydown", onKey);

  body.append(stage, caption, strip);
  modal.append(close, prev, next, body);
  document.body.appendChild(modal);
  paint();
}
