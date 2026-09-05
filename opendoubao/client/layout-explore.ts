/**
 * Search / history / rank / category / recommend — Taobao / YouTube / 网易云 style.
 * Uses the current bound rows; no Demo table names.
 */

import { t } from "./i18n/index.js";
import {
  formatCount,
  formatPrice,
  LAYOUT_PAGES_BY_APP,
  isDataFormPage,
  isDataListViewPage,
  mediaSrc,
  pickRowPresentation,
  type LayoutApp,
  type LayoutPage,
  type RowPresentation,
} from "./page-layout.js";
import {
  categoryRecordId,
  loadCategoryRows,
  type CategoryFlatRow,
} from "./layout-category.js";
import { mountFilterButton } from "./layout-filter.js";
import {
  mountCatalogToggle,
  mountListPager,
  shouldPageCatalog,
  type CatalogStyle,
  type ListPagerOpts,
} from "./layout-list-chrome.js";
import type { SchemaComments } from "./schema-types.js";
import type { ColumnMeta } from "./field-meta.js";

type FlatRow = { key: string; cells: Record<string, unknown> };

export type ExploreOpts = {
  app: LayoutApp;
  page: LayoutPage;
  rows: FlatRow[];
  columns: string[];
  primaryTable: string | null;
  comments?: SchemaComments | null;
  columnMetas?: Record<string, ColumnMeta> | null;
  apijsonBase: string;
  recordId: (row: FlatRow) => string | number | null;
  onOpenRow: (key: string) => void;
  onSearch?: (q: string) => void;
  onOpenSearch?: (q: string) => void;
  onOpenScan?: () => void;
  onOpenFilter?: (anchor: HTMLElement) => void;
  filterActive?: boolean;
  catalogStyle?: CatalogStyle;
  onToggleCatalog?: (next: CatalogStyle) => void;
  pager?: ListPagerOpts;
  onOpenCategory?: (id: string | number) => void;
  onComments?: (comments: SchemaComments) => void;
};

type Packed = { row: FlatRow; pres: RowPresentation; id: string | number | null };

const HIST_KEY = (app: LayoutApp) => `a2api.searchHist:${app}`;

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

function thumb(
  url: string | null,
  base: string,
  className: string,
): HTMLElement {
  const box = el("div", className);
  if (url) {
    const img = el("img");
    img.src = mediaSrc(url, base);
    img.alt = "";
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.onerror = () => {
      box.classList.add("is-empty");
      img.remove();
    };
    box.appendChild(img);
  } else {
    box.classList.add("is-empty");
  }
  return box;
}

function pack(opts: ExploreOpts): Packed[] {
  return opts.rows.map((row) => ({
    row,
    pres: pickRowPresentation(row.cells, {
      primaryTable: opts.primaryTable,
      columns: opts.columns,
      comments: opts.comments,
      recordId: opts.recordId(row),
    }),
    id: opts.recordId(row),
  }));
}

function loadHistory(app: LayoutApp): string[] {
  try {
    const raw = localStorage.getItem(HIST_KEY(app));
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.map((x) => String(x).trim()).filter(Boolean).slice(0, 16)
      : [];
  } catch {
    return [];
  }
}

function saveHistory(app: LayoutApp, items: string[]) {
  try {
    localStorage.setItem(HIST_KEY(app), JSON.stringify(items.slice(0, 16)));
  } catch {
    /* ignore */
  }
}

export function pushSearchHistory(app: LayoutApp, q: string) {
  const trimmed = q.trim();
  if (!trimmed) return;
  const next = [trimmed, ...loadHistory(app).filter((x) => x !== trimmed)];
  saveHistory(app, next);
}

const PENDING_KEY = (app: LayoutApp) => `a2api.searchPending:${app}`;

export function setPendingSearchQuery(app: LayoutApp, q: string) {
  try {
    const trimmed = q.trim();
    if (!trimmed) sessionStorage.removeItem(PENDING_KEY(app));
    else sessionStorage.setItem(PENDING_KEY(app), trimmed);
  } catch {
    /* ignore */
  }
}

export function readPendingSearchQuery(app: LayoutApp): string {
  try {
    return sessionStorage.getItem(PENDING_KEY(app)) || "";
  } catch {
    return "";
  }
}

/** Kept for callers that used the old consume-once API. Does not remove. */
export function takePendingSearchQuery(app: LayoutApp): string {
  return readPendingSearchQuery(app);
}

/** 电商 / 视频 / 新闻等：有独立搜索页则跳转（带历史、排名）。 */
export function appJumpsToSearchPage(
  app: LayoutApp,
  page: LayoutPage,
): boolean {
  return LAYOUT_PAGES_BY_APP[app].includes("search") && page !== "search";
}

const LIST_SEARCH_PAGES = new Set<LayoutPage>([
  "home",
  "list",
  "feed",
  "users",
  "history",
  "rank",
  "category",
  "recommend",
  "orders",
  "address",
]);

const DETAIL_SEARCH_PAGES = new Set<LayoutPage>([
  "detail",
  "form",
  "player",
  "user",
  "orderDetail",
  "addressDetail",
]);

export function shouldShowAppSearch(
  page: LayoutPage | undefined,
  surface: "list" | "detail",
): boolean {
  if (
    page === "search" ||
    page === "scan" ||
    page === "cart" ||
    page === "order" ||
    page === "create" ||
    page === "published" ||
    page === "drafts" ||
    page === "user" ||
    page === "profile" ||
    page === "settings" ||
    page === "notify" ||
    page === "permission" ||
    page === "wallet" ||
    page === "favorite" ||
    page === "security" ||
    page === "help" ||
    page === "blacklist" ||
    page === "about" ||
    page === "upgrade"
  ) {
    return false;
  }
  if (!page) return true;
  if (isDataListViewPage(page)) return surface === "list";
  if (isDataFormPage(page)) return surface === "detail";
  return surface === "list"
    ? LIST_SEARCH_PAGES.has(page)
    : DETAIL_SEARCH_PAGES.has(page);
}

export function searchPlaceholder(app: LayoutApp): string {
  return searchHint(app);
}

export type SearchChromeOpts = {
  app: LayoutApp;
  page: LayoutPage;
  surface: "list" | "detail";
  initialQuery?: string;
  onSearch: (q: string) => void;
  onOpenSearch: (q: string) => void;
  onOpenScan?: () => void;
  onOpenFilter?: (anchor: HTMLElement) => void;
  filterActive?: boolean;
  catalogStyle?: CatalogStyle;
  onToggleCatalog?: (next: CatalogStyle) => void;
  pager?: ListPagerOpts;
};

export function mountScanButton(onOpen?: () => void): HTMLButtonElement {
  const btn = el("button", "app-search-scan");
  btn.type = "button";
  btn.title = t("layout.page.scan");
  btn.setAttribute("aria-label", t("layout.page.scan"));
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 8h8v8H8z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  btn.onclick = () => onOpen?.();
  return btn;
}

export function mountAppSearchChrome(opts: SearchChromeOpts): HTMLElement {
  const jump = appJumpsToSearchPage(opts.app, opts.page);
  const wrap = el(
    "div",
    `app-search app-search-${opts.surface}` + (jump ? " is-jump" : " is-inline"),
  );
  const icon = el("button", "app-search-icon");
  icon.type = "button";
  icon.title = t("layout.page.search");
  icon.setAttribute("aria-label", t("layout.page.search"));
  icon.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 16l5 5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  const field = el("div", "app-search-field");
  const input = document.createElement("input");
  input.type = "search";
  input.className = "ex-search-input app-search-input";
  input.placeholder = searchHint(opts.app);
  input.value = opts.initialQuery || readPendingSearchQuery(opts.app);
  const go = el("button", "layout-btn layout-btn-primary app-search-go", t("layout.page.search"));
  go.type = "button";
  field.append(input, go);
  if (opts.onOpenFilter) {
    wrap.appendChild(
      mountFilterButton({
        active: opts.filterActive,
        onOpen: opts.onOpenFilter,
      }),
    );
  }
  if (opts.surface === "list" && opts.onToggleCatalog && opts.catalogStyle) {
    wrap.appendChild(
      mountCatalogToggle({
        style: opts.catalogStyle,
        onToggle: opts.onToggleCatalog,
      }),
    );
  }
  wrap.append(mountScanButton(opts.onOpenScan));
  if (opts.surface === "list" && opts.pager && shouldPageCatalog(opts.page)) {
    wrap.appendChild(mountListPager(opts.pager));
  }
  wrap.append(icon, field);

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) pushSearchHistory(opts.app, trimmed);
    if (jump || opts.surface === "detail") opts.onOpenSearch(trimmed);
    else opts.onSearch(trimmed);
  };

  icon.onclick = () => {
    if (jump || opts.surface === "detail") {
      opts.onOpenSearch(input.value.trim());
      return;
    }
    wrap.classList.add("is-open");
    input.focus();
  };
  go.onclick = () => submit(input.value);
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      submit(input.value);
    }
  });
  return wrap;
}

function rankScore(pres: RowPresentation, app: LayoutApp): number {
  if (app === "commerce") return pres.sales ?? pres.price ?? 0;
  return pres.playCount ?? pres.shareCount ?? 0;
}

function ranked(items: Packed[], app: LayoutApp): Packed[] {
  return [...items].sort(
    (a, b) => rankScore(b.pres, app) - rankScore(a.pres, app),
  );
}

function searchHint(app: LayoutApp): string {
  switch (app) {
    case "commerce":
      return t("layout.explore.searchShop");
    case "video":
      return t("layout.explore.searchVideo");
    case "music":
      return t("layout.explore.searchMusic");
    case "news":
    case "info":
    case "sports":
      return t("layout.explore.searchNews");
    case "chat":
      return t("layout.explore.searchChat");
    default:
      return t("layout.explore.searchHint");
  }
}

function renderQrScanPage(): HTMLElement {
  const page = el("div", "ex-page ex-scan");
  page.appendChild(el("h2", "ex-title", t("layout.page.scan")));
  const stage = el("div", "scan-stage");
  const video = document.createElement("video");
  video.className = "scan-video";
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  const frame = el("div", "scan-frame");
  const hint = el("div", "scan-hint", t("layout.scan.hint"));
  stage.append(video, frame);
  page.append(stage, hint);
  const actions = el("div", "scan-actions");
  const album = el("button", "layout-btn", t("layout.scan.album"));
  album.type = "button";
  const file = document.createElement("input");
  file.type = "file";
  file.accept = "image/*";
  file.hidden = true;
  album.onclick = () => file.click();
  file.onchange = () => {
    const picked = file.files?.[0];
    if (!picked) return;
    const url = URL.createObjectURL(picked);
    const img = el("img", "scan-preview") as HTMLImageElement;
    img.src = url;
    img.alt = "";
    video.replaceWith(img);
  };
  actions.append(album, file);
  page.appendChild(actions);

  const stopTracks = (stream: MediaStream) => {
    for (const track of stream.getTracks()) track.stop();
  };
  if (navigator.mediaDevices?.getUserMedia) {
    void navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
      .then((stream) => {
        video.srcObject = stream;
        const obs = new MutationObserver(() => {
          if (!document.body.contains(video) && !document.body.contains(page)) {
            stopTracks(stream);
            obs.disconnect();
          }
        });
        obs.observe(document.body, { childList: true, subtree: true });
      })
      .catch(() => {
        hint.textContent = t("layout.scan.noCamera");
      });
  } else {
    hint.textContent = t("layout.scan.noCamera");
  }
  return page;
}

export function renderExplorePage(opts: ExploreOpts): HTMLElement {
  if (opts.page === "scan") return renderQrScanPage();
  if (opts.page === "search") return renderSearchLanding(opts);
  if (opts.page === "history") return renderHistoryPage(opts);
  if (opts.page === "rank") return renderRankPage(opts);
  if (opts.page === "category") return renderCategoryPage(opts);
  return renderRecommendPage(opts);
}

function renderSearchLanding(opts: ExploreOpts): HTMLElement {
  const page = el("div", `ex-page ex-search app-${opts.app}`);
  const items = pack(opts);
  const pending = takePendingSearchQuery(opts.app);
  const hist = loadHistory(opts.app);
  const chips = hist.length
    ? hist
    : items.slice(0, 8).map((x) => x.pres.title).filter(Boolean);

  const bar = el("div", "ex-search-bar");
  const input = document.createElement("input");
  input.type = "search";
  input.className = "ex-search-input";
  input.placeholder = searchHint(opts.app);
  const go = el("button", "layout-btn layout-btn-primary", t("layout.page.search"));
  go.type = "button";
  if (opts.onOpenFilter) {
    bar.appendChild(
      mountFilterButton({
        active: opts.filterActive,
        onOpen: opts.onOpenFilter,
      }),
    );
  }
  if (opts.onToggleCatalog && opts.catalogStyle) {
    bar.appendChild(
      mountCatalogToggle({
        style: opts.catalogStyle,
        onToggle: opts.onToggleCatalog,
      }),
    );
  }
  bar.append(mountScanButton(opts.onOpenScan));
  if (opts.pager) bar.appendChild(mountListPager(opts.pager));
  bar.append(input, go);
  page.appendChild(bar);

  const histBox = el("div", "ex-block");
  const histHead = el("div", "ex-block-head");
  histHead.appendChild(el("h3", "ex-h", t("layout.explore.history")));
  const clear = el("button", "ex-clear", t("layout.explore.clearHistory"));
  clear.type = "button";
  histHead.appendChild(clear);
  histBox.appendChild(histHead);
  const chipRow = el("div", "ex-chips");
  const paintChips = (list: string[]) => {
    chipRow.innerHTML = "";
    if (!list.length) {
      chipRow.appendChild(el("div", "layout-meta", t("layout.explore.noHistory")));
      return;
    }
    for (const q of list) {
      const chip = el("button", "ex-chip", q);
      chip.type = "button";
      chip.onclick = () => {
        input.value = q;
        applyQuery(q);
      };
      chipRow.appendChild(chip);
    }
  };
  paintChips(chips);
  histBox.appendChild(chipRow);
  clear.onclick = () => {
    saveHistory(opts.app, []);
    paintChips([]);
  };
  page.appendChild(histBox);

  const hot = ranked(items, opts.app).slice(0, 10);
  if (hot.length) {
    const rankBox = el("div", "ex-block");
    rankBox.appendChild(el("h3", "ex-h", t("layout.explore.hotSearch")));
    rankBox.appendChild(renderRankList(hot, opts, true));
    page.appendChild(rankBox);
  }

  const results = el("div", "ex-results");
  results.appendChild(el("h3", "ex-h", t("layout.explore.results")));
  const grid = el("div", "ex-result-grid");
  results.appendChild(grid);
  page.appendChild(results);

  const paintResults = (q: string) => {
    grid.innerHTML = "";
    const needle = q.trim().toLowerCase();
    const shown = needle
      ? items.filter((x) =>
          `${x.pres.title} ${x.pres.body} ${x.pres.author} ${x.pres.headline}`
            .toLowerCase()
            .includes(needle),
        )
      : items;
    if (!shown.length) {
      grid.appendChild(el("div", "result-empty", t("result.noMatching")));
      return;
    }
    for (const item of shown) {
      grid.appendChild(resultCard(item, opts));
    }
  };

  const applyQuery = (q: string, remote = false) => {
    const trimmed = q.trim();
    if (trimmed) {
      pushSearchHistory(opts.app, trimmed);
      paintChips(loadHistory(opts.app));
    }
    paintResults(trimmed);
    if (remote) {
      setPendingSearchQuery(opts.app, trimmed);
      opts.onSearch?.(trimmed);
    }
  };

  go.onclick = () => applyQuery(input.value, true);
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      applyQuery(input.value, true);
    }
  });
  if (pending) {
    input.value = pending;
    applyQuery(pending, false);
  } else {
    paintResults("");
  }
  return page;
}

function renderHistoryPage(opts: ExploreOpts): HTMLElement {
  const page = el("div", `ex-page ex-history app-${opts.app}`);
  page.appendChild(el("h2", "ex-title", t("layout.explore.history")));
  const stored = loadHistory(opts.app);
  if (stored.length) {
    const chips = el("div", "ex-chips");
    for (const q of stored) {
      const chip = el("button", "ex-chip", q);
      chip.type = "button";
      chip.onclick = () => {
        if (opts.onOpenSearch) opts.onOpenSearch(q);
        else opts.onSearch?.(q);
      };
      chips.appendChild(chip);
    }
    page.appendChild(chips);
  }
  const items = pack(opts);
  if (!items.length) {
    page.appendChild(el("div", "result-empty", t("layout.explore.noHistory")));
    return page;
  }
  const list = el("div", "ex-history-list");
  for (const item of items) {
    const row = el("button", "ex-hist-row");
    row.type = "button";
    row.onclick = () => opts.onOpenRow(item.row.key);
    row.appendChild(thumb(item.pres.coverUrl, opts.apijsonBase, "ex-hist-img"));
    const mid = el("div", "ex-hist-mid");
    mid.appendChild(el("div", "layout-title", item.pres.title || `#${item.row.key}`));
    mid.appendChild(
      el("div", "layout-meta", [item.pres.author, item.pres.date].filter(Boolean).join(" · ")),
    );
    row.appendChild(mid);
    list.appendChild(row);
  }
  page.appendChild(list);
  return page;
}

function renderRankPage(opts: ExploreOpts): HTMLElement {
  const page = el("div", `ex-page ex-rank app-${opts.app}`);
  page.appendChild(el("h2", "ex-title", t("layout.explore.rank")));
  const items = ranked(pack(opts), opts.app);
  if (!items.length) {
    page.appendChild(el("div", "result-empty", t("result.noMatching")));
    return page;
  }
  page.appendChild(renderRankList(items, opts, false));
  return page;
}

function renderRankList(
  items: Packed[],
  opts: ExploreOpts,
  compact: boolean,
): HTMLElement {
  const list = el("div", compact ? "ex-rank-list is-compact" : "ex-rank-list");
  items.forEach((item, i) => {
    const row = el("button", "ex-rank-row");
    row.type = "button";
    row.onclick = () => opts.onOpenRow(item.row.key);
    const n = el("span", "ex-rank-n" + (i < 3 ? " is-top" : ""), String(i + 1));
    row.appendChild(n);
    if (!compact) {
      row.appendChild(thumb(item.pres.coverUrl, opts.apijsonBase, "ex-rank-img"));
    }
    const mid = el("div", "ex-rank-mid");
    mid.appendChild(el("div", "layout-title", item.pres.title || `#${item.row.key}`));
    const score =
      opts.app === "commerce"
        ? item.pres.sales != null
          ? `${formatCount(item.pres.sales)} ${t("layout.sold")}`
          : formatPrice(item.pres.price)
        : item.pres.playCount != null
          ? `${formatCount(item.pres.playCount)} ${t("layout.views")}`
          : item.pres.subtitle;
    if (score) mid.appendChild(el("div", "layout-meta", score));
    row.appendChild(mid);
    list.appendChild(row);
  });
  return list;
}

function paintCategoryGrid(
  page: HTMLElement,
  rows: CategoryFlatRow[],
  columns: string[],
  table: string | null,
  opts: ExploreOpts,
) {
  const title = page.querySelector(".ex-title");
  page.replaceChildren(title ?? el("h2", "ex-title", t("layout.explore.category")));
  if (!rows.length) {
    page.appendChild(el("div", "result-empty", t("layout.explore.categoryEmpty")));
    return;
  }
  const packed = rows.map((row) => ({
    row,
    pres: pickRowPresentation(row.cells, {
      primaryTable: table,
      columns,
      comments: opts.comments,
      recordId: categoryRecordId(row, table),
    }),
    id: categoryRecordId(row, table),
  }));
  const grid = el("div", "ex-cat-grid");
  for (const item of packed) {
    const card = el("button", "ex-cat-card");
    card.type = "button";
    card.onclick = () => {
      if (item.id != null && opts.onOpenCategory) opts.onOpenCategory(item.id);
      else opts.onOpenRow(item.row.key);
    };
    card.appendChild(thumb(item.pres.coverUrl, opts.apijsonBase, "ex-cat-img"));
    card.appendChild(el("div", "ex-cat-name", item.pres.title || `#${item.row.key}`));
    grid.appendChild(card);
  }
  page.appendChild(grid);
}

function renderCategoryPage(opts: ExploreOpts): HTMLElement {
  const page = el("div", `ex-page ex-category app-${opts.app}`);
  page.appendChild(el("h2", "ex-title", t("layout.explore.category")));
  page.appendChild(el("div", "result-empty", t("layout.explore.loading")));
  void loadCategoryRows({
    app: opts.app,
    apijsonBase: opts.apijsonBase,
    comments: opts.comments ?? null,
    primaryTable: opts.primaryTable,
    boundRows: opts.rows,
    boundColumns: opts.columns,
  }).then((result) => {
    if (result.comments) opts.onComments?.(result.comments);
    if (result.error && !result.rows.length) {
      const title = page.querySelector(".ex-title");
      page.replaceChildren(
        title ?? el("h2", "ex-title", t("layout.explore.category")),
      );
      page.appendChild(el("div", "result-empty", result.error));
      return;
    }
    paintCategoryGrid(page, result.rows, result.columns, result.table, {
      ...opts,
      comments: result.comments ?? opts.comments,
    });
  });
  return page;
}

function renderRecommendPage(opts: ExploreOpts): HTMLElement {
  const page = el("div", `ex-page ex-recommend app-${opts.app}`);
  page.appendChild(el("h2", "ex-title", t("layout.explore.recommend")));
  const items = pack(opts);
  if (!items.length) {
    page.appendChild(el("div", "result-empty", t("result.noMatching")));
    return page;
  }
  const guess = el("div", "ex-rail");
  guess.appendChild(el("h3", "ex-h", t("layout.explore.guess")));
  const row = el("div", "ex-rail-row");
  for (const item of items.slice(0, 12)) {
    row.appendChild(resultCard(item, opts, true));
  }
  guess.appendChild(row);
  page.appendChild(guess);

  const more = el("div", "ex-block");
  more.appendChild(el("h3", "ex-h", t("layout.explore.moreLike")));
  const grid = el("div", "ex-result-grid");
  for (const item of items) grid.appendChild(resultCard(item, opts));
  more.appendChild(grid);
  page.appendChild(more);
  return page;
}

function resultCard(item: Packed, opts: ExploreOpts, slim = false): HTMLElement {
  const card = el("button", slim ? "ex-card is-slim" : "ex-card");
  card.type = "button";
  card.onclick = () => opts.onOpenRow(item.row.key);
  card.appendChild(thumb(item.pres.coverUrl, opts.apijsonBase, "ex-card-img"));
  card.appendChild(el("div", "layout-title", item.pres.title || `#${item.row.key}`));
  if (opts.app === "commerce") {
    const price = formatPrice(item.pres.price);
    if (price) card.appendChild(el("div", "layout-price", price));
  } else if (item.pres.author) {
    card.appendChild(el("div", "layout-meta", item.pres.author));
  }
  return card;
}
