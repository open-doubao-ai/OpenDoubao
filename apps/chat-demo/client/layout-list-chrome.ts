/**
 * List/grid toggle, PC pager, and mobile pull-to-refresh / load-more
 * for catalog pages (left of search: filter · toggle · scan · pager).
 */

import { t } from "./i18n/index.js";
import {
  DEFAULT_PAGE_COUNT,
  normalizePageCount,
  PAGE_COUNT_OPTIONS,
} from "./table-query.js";
import {
  isMeHubPage,
  isSettingsPage,
  type LayoutApp,
  type LayoutKind,
  type LayoutPage,
  type LayoutSpec,
} from "./page-layout.js";

export type CatalogStyle = "list" | "grid";

export type ListPagerOpts = {
  page: number;
  count: number;
  onPage: (page: number) => void;
  onCount: (count: number) => void;
};

export const LIST_MOBILE_MQ = "(max-width: 720px)";

const SCROLL_CLEANUP = "__a2apiListScrollCleanup";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function isListMobile(): boolean {
  return window.matchMedia(LIST_MOBILE_MQ).matches;
}

export function defaultCatalogStyle(
  spec?: LayoutSpec | null,
  kind?: LayoutKind | null,
): CatalogStyle {
  const app: LayoutApp | undefined = spec?.app;
  const page = spec?.page;
  if (app === "data" || kind === "data") return "list";
  if (
    app === "video" ||
    app === "commerce" ||
    kind === "video" ||
    kind === "commerce"
  ) {
    return "grid";
  }
  if (page === "category" || page === "recommend" || page === "search") {
    return "grid";
  }
  return "list";
}

export function resolveCatalogStyle(
  explicit: CatalogStyle | null | undefined,
  spec?: LayoutSpec | null,
  kind?: LayoutKind | null,
  displayKind?: string,
): CatalogStyle {
  if (explicit === "list" || explicit === "grid") return explicit;
  if ((spec?.app === "data" || kind === "data") && displayKind === "grid") {
    return "grid";
  }
  return defaultCatalogStyle(spec, kind);
}

export function shouldPageCatalog(page?: LayoutPage | null): boolean {
  if (!page) return true;
  if (
    page === "scan" ||
    page === "cart" ||
    page === "order" ||
    page === "create" ||
    page === "detail" ||
    page === "player" ||
    page === "orderDetail" ||
    page === "addressDetail"
  ) {
    return false;
  }
  if (isMeHubPage(page) || isSettingsPage(page)) return false;
  return true;
}

const GRID_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';

const LIST_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="4" y="5" width="5" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5h8M4 15h16M4 19h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

export function mountCatalogToggle(opts: {
  style: CatalogStyle;
  onToggle: (next: CatalogStyle) => void;
}): HTMLButtonElement {
  const next: CatalogStyle = opts.style === "grid" ? "list" : "grid";
  const btn = el("button", "app-search-view");
  btn.type = "button";
  const label =
    next === "grid" ? t("layout.catalog.toGrid") : t("layout.catalog.toList");
  btn.title = label;
  btn.setAttribute("aria-label", label);
  btn.dataset.style = opts.style;
  btn.innerHTML = next === "grid" ? GRID_ICON : LIST_ICON;
  btn.onclick = (ev) => {
    ev.stopPropagation();
    opts.onToggle(next);
  };
  return btn;
}

export function mountListPager(opts: ListPagerOpts): HTMLElement {
  const wrap = el("div", "app-search-pager");
  wrap.setAttribute("role", "navigation");
  wrap.setAttribute("aria-label", t("common.page"));

  const page0 = Math.max(0, Math.floor(Number(opts.page) || 0));
  const count = normalizePageCount(opts.count);

  const prev = el("button", "app-pager-btn");
  prev.type = "button";
  prev.textContent = `‹ ${t("layout.pager.prev")}`;
  prev.disabled = page0 <= 0;
  prev.onclick = () => opts.onPage(Math.max(0, page0 - 1));

  const pageInput = document.createElement("input");
  pageInput.type = "number";
  pageInput.className = "app-pager-page";
  pageInput.min = "1";
  pageInput.step = "1";
  pageInput.value = String(page0 + 1);
  pageInput.title = t("layout.pager.page");
  pageInput.setAttribute("aria-label", t("layout.pager.page"));
  pageInput.onchange = () => {
    const n = Math.floor(Number(pageInput.value));
    const next = Number.isFinite(n) ? Math.max(1, n) : 1;
    pageInput.value = String(next);
    opts.onPage(next - 1);
  };

  const nextBtn = el("button", "app-pager-btn");
  nextBtn.type = "button";
  nextBtn.textContent = `${t("layout.pager.next")} ›`;
  nextBtn.onclick = () => opts.onPage(page0 + 1);

  const countLab = el("label", "app-pager-count");
  countLab.appendChild(document.createTextNode(`${t("layout.pager.perPage")} `));
  const countSel = document.createElement("select");
  countSel.className = "app-pager-size";
  countSel.title = t("workspace.rowsPerPage");
  for (const n of PAGE_COUNT_OPTIONS) {
    const o = document.createElement("option");
    o.value = String(n);
    o.textContent = String(n);
    if (n === count) o.selected = true;
    countSel.appendChild(o);
  }
  countSel.onchange = () =>
    opts.onCount(normalizePageCount(countSel.value) || DEFAULT_PAGE_COUNT);
  countLab.append(countSel, document.createTextNode(` ${t("layout.pager.rows")}`));

  wrap.append(prev, pageInput, nextBtn, countLab);
  return wrap;
}

type ScrollHost = HTMLElement & { [SCROLL_CLEANUP]?: () => void };

export function bindMobileListScroll(
  scroller: HTMLElement,
  opts: {
    onRefresh?: () => void | Promise<void>;
    onLoadMore?: () => void | Promise<void>;
    hasMore?: boolean;
    loading?: boolean;
  },
): void {
  const host = scroller as ScrollHost;
  host[SCROLL_CLEANUP]?.();

  const pull = el("div", "list-pull-slot");
  const pullText = el("span", "list-pull-text", t("layout.pull.refresh"));
  pull.appendChild(pullText);
  scroller.insertBefore(pull, scroller.firstChild);

  const more = el("div", "list-more-status");
  more.textContent = opts.loading
    ? t("layout.pull.loadMore")
    : opts.hasMore === false
      ? t("layout.pull.noMore")
      : "";
  scroller.appendChild(more);

  let startY = 0;
  let pulling = 0;
  let refreshing = false;
  let loadingMore = false;

  const onTouchStart = (e: TouchEvent) => {
    if (!isListMobile() || refreshing || !opts.onRefresh) return;
    if (scroller.scrollTop > 2) {
      startY = 0;
      return;
    }
    startY = e.touches[0]?.clientY ?? 0;
    pulling = 0;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!isListMobile() || refreshing || !startY || !opts.onRefresh) return;
    if (scroller.scrollTop > 2) return;
    const y = e.touches[0]?.clientY ?? startY;
    const dy = y - startY;
    if (dy <= 0) {
      pulling = 0;
      pull.style.height = "0px";
      return;
    }
    pulling = Math.min(88, dy * 0.42);
    pull.style.height = `${pulling}px`;
    pullText.textContent =
      pulling > 52 ? t("layout.pull.release") : t("layout.pull.refresh");
  };

  const onTouchEnd = () => {
    if (!isListMobile() || !opts.onRefresh) {
      startY = 0;
      pulling = 0;
      pull.style.height = "0px";
      return;
    }
    const should = pulling > 52 && !refreshing;
    startY = 0;
    pulling = 0;
    if (!should) {
      pull.style.height = "0px";
      pullText.textContent = t("layout.pull.refresh");
      return;
    }
    refreshing = true;
    pull.style.height = "44px";
    pullText.textContent = t("layout.pull.refreshing");
    void Promise.resolve(opts.onRefresh()).finally(() => {
      refreshing = false;
      pull.style.height = "0px";
      pullText.textContent = t("layout.pull.refresh");
    });
  };

  const onScroll = () => {
    if (
      !isListMobile() ||
      loadingMore ||
      refreshing ||
      opts.hasMore === false ||
      !opts.onLoadMore
    ) {
      return;
    }
    if (scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 120) {
      return;
    }
    loadingMore = true;
    more.textContent = t("layout.pull.loadMore");
    void Promise.resolve(opts.onLoadMore()).finally(() => {
      loadingMore = false;
    });
  };

  scroller.addEventListener("touchstart", onTouchStart, { passive: true });
  scroller.addEventListener("touchmove", onTouchMove, { passive: true });
  scroller.addEventListener("touchend", onTouchEnd);
  scroller.addEventListener("scroll", onScroll, { passive: true });

  host[SCROLL_CLEANUP] = () => {
    scroller.removeEventListener("touchstart", onTouchStart);
    scroller.removeEventListener("touchmove", onTouchMove);
    scroller.removeEventListener("touchend", onTouchEnd);
    scroller.removeEventListener("scroll", onScroll);
    pull.remove();
    more.remove();
    delete host[SCROLL_CLEANUP];
  };
}

export function unbindMobileListScroll(scroller: HTMLElement): void {
  const host = scroller as ScrollHost;
  host[SCROLL_CLEANUP]?.();
}

export function syncInlinePagerClass(hasPager: boolean): void {
  document
    .getElementById("filters")
    ?.classList.toggle("has-inline-pager", hasPager);
}
