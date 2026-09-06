/**
 * Consumer-app layouts (YouTube / 酷狗 / 掘金 / 微信 / 腾讯新闻 / Amazon).
 * Data layout stays in result-view (table · grid · charts · form).
 */

import { t } from "./i18n/index.js";
import { openImageLightbox } from "./image-lightbox.js";
import { bindSeekBar, mountVideoChrome } from "./layout-player.js";
import {
  mountAppSearchChrome,
  renderExplorePage,
  shouldShowAppSearch,
} from "./layout-explore.js";
import type { CatalogStyle, ListPagerOpts } from "./layout-list-chrome.js";
import { mountHomeChrome, shouldShowHomeChrome } from "./layout-home.js";
import {
  collectRowFeedPhotos,
  collectRowImageUrls,
} from "./smart-image-fields.js";
import { renderUserList, renderUserProfile } from "./layout-users.js";
import { renderMeSurface } from "./layout-me.js";
import { fillChatBubble, mountChatComposer } from "./layout-chat.js";
import { downloadOneMedia } from "./layout-media-library.js";
import {
  fetchRecordComments,
  flattenComments,
  parseCommentsFromResponse,
  resolveCommentQuery,
  type ActionRunContext,
  type ActionSlotResult,
  type SocialComment,
} from "./layout-actions.js";
import {
  FEED_COMMENT_PREVIEW_MAX,
  mountCommentChrome,
  paintRatingSummary,
  renderCommentItems,
  renderFeedCommentPreview,
  shouldShowCommentRating,
  type CommentChrome,
} from "./layout-comments.js";
import {
  beginAddressPick,
  bindAddressSuggest,
  bindConsigneeSuggest,
  checkoutAddressFromRow,
  clearAddressPick,
  CHECKOUT_ADDRESS_PURPOSE,
  formatAddressLine,
  getCheckoutAddress,
  isAddressPickMode,
  openMapAddressPicker,
  parseShippingText,
  preferConsigneeParty,
  setCheckoutAddress,
  type CheckoutAddress,
  type ParsedShippingParty,
} from "./layout-address.js";
import {
  attachListRow,
  isListSelectActive,
  mountListSelectChrome,
  type ListSelectItem,
  type ListSelectSession,
} from "./layout-list-select.js";
import { isAddressTable, isOrderTable } from "./layout-entities.js";
import {
  hasLocalPurchase,
  visitorHasPurchased,
} from "./layout-purchase.js";
import { idInList, visitorId } from "./layout-social.js";
import { renderComposePage } from "./layout-compose.js";
import { renderBookReader } from "./layout-reader.js";
import type { WritePayload } from "./result-view.js";
import type { ActionBinding, ActionSlot, LayoutNav, LayoutNavTab } from "./page-layout.js";
import type { ColumnFilter } from "./table-query.js";
import {
  addCartLine,
  APP_TABS_BY_APP,
  cartTotal,
  formatCount,
  formatDuration,
  formatPrice,
  getCartLines,
  appFromKind,
  createSpecForListData,
  isArticleLikeApp,
  isBookReaderApp,
  isCartOrOrder,
  isCommentableApp,
  isDataLayout,
  isCheckoutPage,
  isExploreLayoutPage,
  isLocalLikeApp,
  isNewsLikeApp,
  isOrdersPage,
  isPurchasableApp,
  isRateableApp,
  reviewRequiresPurchase,
  isMeHubPage,
  isProducerStudioPage,
  isSettingsPage,
  isUserLayoutPage,
  layoutKindLabel,
  layoutTabLabel,
  mediaSrc,
  pickRowPresentation,
  setCartQty,
  shouldShowAppTabs,
  specsEqual,
  type CartLine,
  type LayoutApp,
  type LayoutKind,
  type LayoutPage,
  type LayoutSpec,
  type RowPresentation,
} from "./page-layout.js";
import { bindTabRemap } from "./layout-nav-ui.js";
import type { SchemaComments } from "./schema-types.js";
import type { ColumnMeta } from "./field-meta.js";

type FlatRow = { key: string; cells: Record<string, unknown> };

export type LayoutListHandlers = {
  onOpenRow: (key: string) => void;
  onAddToCart?: (row: FlatRow, pres: RowPresentation) => void;
  onBuyNow?: (row: FlatRow, pres: RowPresentation) => void;
  onCheckout?: (info: LayoutCheckoutInfo) => void;
  onOpenCheckout?: () => void;
  onSearch?: (q: string) => void;
  onOpenSearch?: (q: string) => void;
  onOpenScan?: () => void;
  onOpenCreate?: () => void;
  onOpenFilter?: (anchor: HTMLElement) => void;
  filterActive?: boolean;
  catalogStyle?: CatalogStyle;
  onToggleCatalog?: (next: CatalogStyle) => void;
  pager?: ListPagerOpts;
  onSelectPage?: (page: LayoutPage) => void;
  onSelectApp?: (app: LayoutApp) => void;
  onSelectLayoutSpec?: (spec: LayoutSpec) => void;
  onRemapTab?: (slot: LayoutPage, spec: LayoutSpec) => void;
  onOpenProfile?: () => void;
  onOpenAuthor?: (userId: string | number) => void;
  onOpenCategory?: (id: string | number) => void;
  onReplaceFilters?: (filters: ColumnFilter[]) => void;
  filters?: ColumnFilter[];
  onComments?: (comments: SchemaComments) => void;
  onWrite?: (payload: WritePayload) => void | Promise<boolean | void>;
};

export type LayoutCheckoutInfo = {
  name: string;
  phone: string;
  address: string;
  remark: string;
  lines: CartLine[];
  total: number;
};

export type LayoutDetailHandlers = {
  onBack?: () => void;
  onAddToCart?: () => void;
  onBuyNow?: () => void;
  onCheckout?: (info: LayoutCheckoutInfo) => void;
  onOpenCheckout?: () => void;
  onSelectPage?: (page: LayoutPage) => void;
  onOpenRelated?: (id: string | number, table?: string) => void;
  onOpenChat?: (userId: string | number) => void;
  onOpenFkList?: (info: {
    table: string;
    ids: Array<string | number>;
    field?: string;
  }) => void;
  onWrite?: (payload: WritePayload) => void | Promise<boolean | void>;
  onEditRecord?: (info: {
    table: string;
    id: string | number;
    cells: Record<string, unknown>;
  }) => void;
  onOpenAuthor?: (userId: string | number) => void;
  onSearch?: (q: string) => void;
  onOpenSearch?: (q: string) => void;
  onOpenScan?: () => void;
  /** Bound A2API slot, or ask AI to bindRequest then run. */
  onActionSlot?: (
    slot: ActionSlot,
    ctx: ActionRunContext,
    opts?: { bindIfMissing?: boolean },
  ) => void | Promise<boolean | ActionSlotResult | void>;
  actionBindings?: Partial<Record<ActionSlot, ActionBinding>>;
};

type RelatedPack = {
  table: string | null;
  rows: FlatRow[];
  columns: string[];
  comments?: SchemaComments | null;
  metas?: Record<string, ColumnMeta> | null;
  apijsonBase: string;
  recordId: (row: FlatRow) => string | number | null;
};

let relatedPack: RelatedPack | null = null;

function rememberRelated(pack: RelatedPack) {
  relatedPack = pack;
}

function relatedItems(exceptId: string | number | null): Array<{
  row: FlatRow;
  pres: RowPresentation;
  id: string | number;
}> {
  if (!relatedPack) return [];
  const out: Array<{ row: FlatRow; pres: RowPresentation; id: string | number }> =
    [];
  for (const row of relatedPack.rows) {
    const id = relatedPack.recordId(row);
    if (id == null || String(id) === String(exceptId)) continue;
    out.push({
      row,
      id,
      pres: present(row, {
        table: relatedPack.table,
        columns: relatedPack.columns,
        comments: relatedPack.comments,
        metas: relatedPack.metas,
        recordId: id,
      }),
    });
  }
  return out;
}

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

function showMap(
  metas?: Record<string, ColumnMeta> | null,
): Record<string, ColumnMeta["show"] | undefined> {
  const out: Record<string, ColumnMeta["show"] | undefined> = {};
  if (!metas) return out;
  for (const [p, m] of Object.entries(metas)) out[p] = m.show;
  return out;
}

function present(
  row: FlatRow,
  opts: {
    table: string | null;
    columns: string[];
    comments?: SchemaComments | null;
    metas?: Record<string, ColumnMeta> | null;
    recordId?: string | number | null;
  },
): RowPresentation {
  return pickRowPresentation(row.cells, {
    primaryTable: opts.table,
    columns: opts.columns,
    comments: opts.comments,
    showByPath: showMap(opts.metas),
    recordId: opts.recordId ?? row.key,
  });
}

function thumb(
  url: string | null,
  apijsonBase: string,
  className: string,
  emptyText: string,
): HTMLElement {
  const box = el("div", className);
  if (url) {
    const img = el("img");
    img.src = mediaSrc(url, apijsonBase);
    img.alt = "";
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.onerror = () => {
      box.classList.add("is-empty");
      img.replaceWith(document.createTextNode(emptyText));
    };
    box.appendChild(img);
  } else {
    box.classList.add("is-empty");
    box.textContent = emptyText;
  }
  return box;
}

function kicker(kind: LayoutKind): string {
  return layoutKindLabel(kind);
}

function stop(ev: Event) {
  ev.stopPropagation();
}

function chip(label: string, className = "app-chip"): HTMLButtonElement {
  const b = el("button", className, label);
  b.type = "button";
  return b;
}

const LYRIC_FIELD_NAMES = ["lyrics", "lyric", "lrc", "lyrictext"];

function lyricRawFrom(
  pres: RowPresentation,
  cells?: Record<string, unknown>,
): string {
  if (pres.lyrics?.trim()) return pres.lyrics;
  if (cells) {
    for (const key of Object.keys(cells)) {
      const short = (key.includes(".") ? key.slice(key.lastIndexOf(".") + 1) : key)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      if (!LYRIC_FIELD_NAMES.includes(short)) continue;
      const v = cells[key];
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return "";
}

type LyricLine = { t: number; text: string };

function parseLrcFrac(raw?: string): number {
  if (!raw) return 0;
  const pad = raw.padEnd(3, "0").slice(0, 3);
  const n = Number(pad);
  return Number.isFinite(n) ? n / 1000 : 0;
}

function parseLyricLines(raw: string): LyricLine[] {
  const out: LyricLine[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const s = line.trim();
    if (!s) continue;
    const stamped = s.match(/^((?:\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\])+)(.*)$/);
    if (stamped) {
      const text = stamped[2]!.trim();
      if (!text) continue;
      for (const m of stamped[1]!.matchAll(
        /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g,
      )) {
        const t =
          Number(m[1]) * 60 + Number(m[2]) + parseLrcFrac(m[3]);
        out.push({ t, text });
      }
      continue;
    }
    if (/^\[(?:ti|ar|al|by|offset):/i.test(s)) continue;
    out.push({ t: -1, text: s });
  }
  const timed = out.filter((l) => l.t >= 0).sort((a, b) => a.t - b.t);
  if (timed.length) return timed;
  return out.filter((l) => l.text);
}

function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text.trim());
}

function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,iframe,object,embed,link,meta").forEach((n) => n.remove());
  for (const node of [...doc.body.querySelectorAll("*")]) {
    for (const attr of [...node.attributes]) {
      const name = attr.name.toLowerCase();
      const val = attr.value.trim();
      if (name.startsWith("on") || (name === "href" && /^javascript:/i.test(val))) {
        node.removeAttribute(attr.name);
      }
    }
  }
  return doc.body.innerHTML;
}

function fillRichBody(host: HTMLElement, text: string) {
  const trimmed = (text || "").trim();
  if (!trimmed) return;
  if (looksLikeHtml(trimmed)) {
    host.classList.add("is-html");
    host.innerHTML = sanitizeHtml(trimmed);
    return;
  }
  for (const p of paras(trimmed)) {
    if (p.length <= 24 && !p.endsWith("。")) host.appendChild(el("h2", "jj-h2", p));
    else host.appendChild(el("p", "", p));
  }
}

function mountOwnerWriteBar(
  host: HTMLElement,
  opts: {
    table: string | null;
    recordId: string | number | null;
    authorId: string | number | null;
    cells: Record<string, unknown>;
    handlers: LayoutDetailHandlers;
  },
) {
  const table = opts.table?.trim();
  const id = opts.recordId;
  if (!table || id == null) return;
  if (!opts.handlers.onEditRecord && !opts.handlers.onWrite) return;
  const me = visitorId();
  if (me == null) return;
  if (opts.authorId != null && String(opts.authorId) !== String(me)) return;
  const bar = el("div", "layout-owner-bar");
  if (opts.handlers.onEditRecord) {
    const edit = el("button", "layout-btn", t("common.edit"));
    edit.type = "button";
    edit.onclick = () =>
      opts.handlers.onEditRecord?.({ table, id, cells: opts.cells });
    bar.appendChild(edit);
  }
  if (opts.handlers.onWrite) {
    const del = el("button", "layout-btn layout-btn-danger", t("common.delete"));
    del.type = "button";
    del.onclick = () => {
      if (!confirm(t("layout.compose.confirmDelete"))) return;
      void opts.handlers.onWrite?.({
        method: "delete",
        table,
        body: { [table]: { id }, tag: table },
        keepTag: true,
        skipTemplate: true,
      });
    };
    bar.appendChild(del);
  }
  host.prepend(bar);
}

function paras(text: string): string[] {
  const blocks = text
    .split(/\n{2,}|\r\n|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (blocks.length === 1 && blocks[0]!.length > 48) {
    const bits = blocks[0]!.split(/(?<=[。！？.!?])\s*/).filter(
      (s) => s.trim().length > 0,
    );
    if (bits.length > 1) return bits;
  }
  return blocks;
}

function tocFromBody(text: string): string[] {
  const lines = paras(text);
  const heads = lines.filter(
    (s) =>
      /^#{1,3}\s/.test(s) ||
      (s.length <= 24 && !s.endsWith("。") && !s.endsWith(".")),
  );
  return heads.slice(0, 8).map((s) => s.replace(/^#+\s*/, ""));
}

type ListOpts = {
  kind: LayoutKind;
  spec?: LayoutSpec;
  rows: FlatRow[];
  columns: string[];
  primaryTable: string | null;
  comments?: SchemaComments | null;
  columnMetas?: Record<string, ColumnMeta> | null;
  apijsonBase: string;
  recordId: (row: FlatRow) => string | number | null;
  handlers: LayoutListHandlers;
  catalogStyle?: CatalogStyle;
  nav?: LayoutNav | null;
  navTabSlot?: LayoutPage | null;
};

function listSelectEnabled(opts: { kind: LayoutKind; spec?: LayoutSpec }): boolean {
  return listApp(opts) !== "data";
}

function wireListRow(
  node: HTMLElement,
  opts: ListOpts,
  row: FlatRow,
  onOpen: () => void,
): void {
  const pres = rowPres(opts, row);
  attachListRow(node, {
    key: row.key,
    id: opts.recordId(row),
    label: pres.title || `#${row.key}`,
    cells: row.cells,
    onOpen,
    enabled: listSelectEnabled(opts),
  });
}

function applyCheckoutPickResult(result: ListSelectSession, table: string | null): void {
  const item = result.selected[0];
  if (!item) return;
  setCheckoutAddress(
    checkoutAddressFromRow(item.cells || {}, table, item.id),
  );
  clearAddressPick();
}

function mountSelectChromeForList(wrap: HTMLElement, opts: ListOpts): void {
  if (!listSelectEnabled(opts)) return;
  mountListSelectChrome(wrap, {
    primaryTable: opts.primaryTable,
    onCancel: () => {
      /* session already cleared */
    },
    onDone: (result) => {
      if (result.purpose === CHECKOUT_ADDRESS_PURPOSE) {
        applyCheckoutPickResult(result, opts.primaryTable);
        opts.handlers.onOpenCheckout?.();
      }
      if (result.returnSpec && opts.handlers.onSelectLayoutSpec) {
        opts.handlers.onSelectLayoutSpec(result.returnSpec);
        return;
      }
      if (result.returnPage) {
        opts.handlers.onSelectPage?.(result.returnPage);
      }
    },
    onDelete: async (items: ListSelectItem[]) => {
      const table = (opts.primaryTable || "").trim();
      if (!table || !opts.handlers.onWrite) return;
      const ids = items
        .map((i) => i.id)
        .filter((id): id is string | number => id != null && id !== "");
      if (!ids.length) return;
      const nums = ids.map((id) =>
        typeof id === "number" ? id : Number(id),
      );
      const finite = nums.filter((n) => Number.isFinite(n));
      const bodyIds = finite.length === ids.length ? finite : ids;
      const body =
        bodyIds.length === 1
          ? { [table]: { id: bodyIds[0] }, tag: table }
          : { [table]: { "id{}": bodyIds }, tag: `${table}[]` };
      const ok = await opts.handlers.onWrite({
        method: "delete",
        table,
        body,
      });
      if (ok === false) return;
      flashLayoutNote(t("layout.addressDeleted"));
      for (const item of items) {
        wrap
          .querySelectorAll(`[data-row-key="${CSS.escape(item.key)}"]`)
          .forEach((n) => n.remove());
      }
    },
  });
}

function listApp(opts: { kind: LayoutKind; spec?: LayoutSpec }): LayoutApp {
  return opts.spec?.app ?? appFromKind(opts.kind);
}

function openListCreate(opts: ListOpts) {
  const spec = createSpecForListData({
    currentApp: listApp(opts),
    currentPage: opts.spec?.page,
    table: opts.primaryTable,
    columns: opts.columns,
    comments: opts.comments,
  });
  if (opts.handlers.onSelectLayoutSpec) {
    opts.handlers.onSelectLayoutSpec(spec);
    return;
  }
  if (opts.handlers.onOpenCreate) {
    opts.handlers.onOpenCreate();
    return;
  }
  opts.handlers.onSelectPage?.(spec.page);
}

const TAB_ICON: Partial<Record<LayoutPage, string>> = {
  home: "⌂",
  feed: "☰",
  list: "▤",
  search: "⌕",
  category: "▦",
  recommend: "✦",
  rank: "♯",
  history: "◷",
  cart: "▣",
  create: "✎",
  users: "☺",
  user: "☺",
  scan: "▦",
};

function mountAppTabBar(opts: {
  app: LayoutApp;
  page?: LayoutPage;
  nav?: LayoutNav | null;
  navTabSlot?: LayoutPage | null;
  currentSpec?: LayoutSpec;
  onSelect: (page: LayoutPage) => void;
  onRemapTab?: (slot: LayoutPage, spec: LayoutSpec) => void;
}): HTMLElement | null {
  const nav = opts.nav;
  const tabItems: LayoutNavTab[] = (
    nav?.tabs?.length
      ? [...nav.tabs]
      : APP_TABS_BY_APP[opts.app].map((slot) => ({
          slot,
          spec: { app: opts.app, page: slot },
        }))
  ).filter(
    (tab) =>
      !isProducerStudioPage(tab.slot) && !isProducerStudioPage(tab.spec.page),
  );
  if (
    !tabItems.length ||
    !shouldShowAppTabs(opts.app, opts.page, nav)
  ) {
    return null;
  }
  const activeSlot =
    opts.navTabSlot ||
    (opts.currentSpec
      ? tabItems.find((t) => specsEqual(t.spec, opts.currentSpec!))?.slot
      : null) ||
    opts.page;
  const bar = el("nav", "app-tabs");
  bar.setAttribute("aria-label", t("layout.tab.bar"));
  for (const tab of tabItems) {
    const page = tab.slot;
    const btn = el(
      "button",
      "app-tab" +
        (page === activeSlot ||
        (page === "user" && isMeHubPage(opts.page))
          ? " is-active"
          : ""),
    );
    btn.type = "button";
    btn.append(
      el("span", "app-tab-icon", TAB_ICON[page] || "·"),
      el("span", "app-tab-label", tab.label || layoutTabLabel(page, opts.app)),
    );
    btn.onclick = () => opts.onSelect(page);
    if (opts.onRemapTab) {
      bindTabRemap(btn, {
        spec: tab.spec,
        onPick: (spec) => opts.onRemapTab!(page, spec),
      });
    }
    bar.appendChild(btn);
  }
  return bar;
}

/** Pin home tabs + search (+ category chips) so only banner/feed scroll. */
function pinHomeTopChrome(wrap: HTMLElement, tabBar: HTMLElement | null) {
  const isHome =
    wrap.classList.contains("has-home-chrome") ||
    wrap.classList.contains("layout-page-home");
  if (!isHome) {
    if (tabBar) wrap.appendChild(tabBar);
    return;
  }
  const pin = el("div", "layout-top-chrome");
  if (tabBar) pin.appendChild(tabBar);
  const search = wrap.querySelector(":scope > .app-search");
  if (search) pin.appendChild(search);
  const cats = wrap.querySelector(".home-cats-top");
  if (cats) pin.appendChild(cats);
  if (!pin.childNodes.length) return;
  const select = wrap.querySelector(":scope > .list-select-chrome");
  if (select?.nextSibling) wrap.insertBefore(pin, select.nextSibling);
  else wrap.insertBefore(pin, wrap.firstChild);
}

function finishLayoutList(
  container: HTMLElement,
  wrap: HTMLElement,
  opts: ListOpts,
): HTMLElement {
  mountSelectChromeForList(wrap, opts);
  const app = listApp(opts);
  const page = opts.spec?.page;
  let tabBar: HTMLElement | null = null;
  if (opts.handlers.onSelectPage) {
    tabBar = mountAppTabBar({
      app,
      page,
      nav: opts.nav,
      navTabSlot: opts.navTabSlot,
      currentSpec: opts.spec,
      onSelect: opts.handlers.onSelectPage,
      onRemapTab: opts.handlers.onRemapTab,
    });
  }
  pinHomeTopChrome(wrap, tabBar);
  container.appendChild(wrap);
  return wrap;
}

function renderMePage(opts: ListOpts, app: LayoutApp): HTMLElement {
  return renderMeSurface({
    app,
    page: opts.spec?.page ?? "user",
    rows: opts.rows,
    columns: opts.columns,
    primaryTable: opts.primaryTable,
    comments: opts.comments,
    columnMetas: opts.columnMetas,
    apijsonBase: opts.apijsonBase,
    recordId: opts.recordId,
    selectEnabled: listSelectEnabled(opts),
    handlers: {
      onSelectPage: opts.handlers.onSelectPage,
      onSelectApp: opts.handlers.onSelectApp,
      onOpenProfile: opts.handlers.onOpenProfile,
      onOpenRow: (key) => opts.handlers.onOpenRow(key),
      onWrite: opts.handlers.onWrite,
    },
  });
}

function rowPres(opts: ListOpts, row: FlatRow): RowPresentation {
  return present(row, {
    table: opts.primaryTable,
    columns: opts.columns,
    comments: opts.comments,
    metas: opts.columnMetas,
    recordId: opts.recordId(row),
  });
}

function addShopButtons(
  host: HTMLElement,
  row: FlatRow,
  pres: RowPresentation,
  handlers: LayoutListHandlers,
) {
  const rowBtns = el("div", "layout-card-actions");
  const addBtn = el("button", "layout-btn", t("layout.addToCart"));
  addBtn.type = "button";
  addBtn.onclick = (ev) => {
    stop(ev);
    handlers.onAddToCart?.(row, pres);
  };
  const buyBtn = el("button", "layout-btn layout-btn-primary", t("layout.buyNow"));
  buyBtn.type = "button";
  buyBtn.onclick = (ev) => {
    stop(ev);
    handlers.onBuyNow?.(row, pres);
  };
  rowBtns.append(addBtn, buyBtn);
  host.appendChild(rowBtns);
}

export function renderLayoutList(container: HTMLElement, opts: ListOpts): HTMLElement {
  rememberRelated({
    table: opts.primaryTable,
    rows: opts.rows,
    columns: opts.columns,
    comments: opts.comments,
    metas: opts.columnMetas,
    apijsonBase: opts.apijsonBase,
    recordId: opts.recordId,
  });
  const page = opts.spec?.page;
  const app = listApp(opts);
  const wrap = el(
    "div",
    `layout-wrap layout-${opts.kind}` +
      (page ? ` layout-page-${page}` : "") +
      (opts.catalogStyle ? ` catalog-style-${opts.catalogStyle}` : ""),
  );
  wrap.id = "result-layout-wrap";

  if (
    shouldShowAppSearch(page, "list") &&
    (opts.handlers.onSearch || opts.handlers.onOpenSearch)
  ) {
    const search = opts.handlers.onSearch ?? opts.handlers.onOpenSearch!;
    const open = opts.handlers.onOpenSearch ?? opts.handlers.onSearch!;
    wrap.appendChild(
      mountAppSearchChrome({
        app,
        page: page ?? "list",
        surface: "list",
        onSearch: search,
        onOpenSearch: open,
        onOpenScan: opts.handlers.onOpenScan,
        onOpenCreate: () => openListCreate(opts),
        onOpenFilter: opts.handlers.onOpenFilter,
        filterActive: opts.handlers.filterActive,
        catalogStyle: opts.catalogStyle ?? opts.handlers.catalogStyle,
        onToggleCatalog: opts.handlers.onToggleCatalog,
        pager: opts.handlers.pager,
      }),
    );
  }

  let feedHost: HTMLElement = wrap;
  if (shouldShowHomeChrome(app, page)) {
    wrap.classList.add("has-home-chrome");
    const chrome = mountHomeChrome({
      app,
      rows: opts.rows,
      columns: opts.columns,
      primaryTable: opts.primaryTable,
      comments: opts.comments,
      columnMetas: opts.columnMetas,
      apijsonBase: opts.apijsonBase,
      recordId: opts.recordId,
      filters: opts.handlers.filters,
      onOpenRow: (key) => opts.handlers.onOpenRow(key),
      selectEnabled: listSelectEnabled(opts),
      onReplaceFilters: opts.handlers.onReplaceFilters,
      onOpenCategory: opts.handlers.onOpenCategory,
      onComments: opts.handlers.onComments,
    });
    wrap.appendChild(chrome.root);
    feedHost = chrome.feed;
  }

  if (page === "users") {
    wrap.appendChild(
      renderUserList({
        app,
        rows: opts.rows,
        columns: opts.columns,
        primaryTable: opts.primaryTable,
        comments: opts.comments,
        columnMetas: opts.columnMetas,
        apijsonBase: opts.apijsonBase,
        recordId: opts.recordId,
        onOpenRow: (key) => opts.handlers.onOpenRow(key),
        selectEnabled: listSelectEnabled(opts),
      }),
    );
    return finishLayoutList(container, wrap, opts);
  }

  if (page === "user" || page === "profile" || isSettingsPage(page) || page === "published" || page === "drafts") {
    wrap.appendChild(renderMePage(opts, app));
    return finishLayoutList(container, wrap, opts);
  }

  if (page && isExploreLayoutPage(page)) {
    wrap.appendChild(
      renderExplorePage({
        app,
        page,
        rows: opts.rows,
        columns: opts.columns,
        primaryTable: opts.primaryTable,
        comments: opts.comments,
        columnMetas: opts.columnMetas,
        apijsonBase: opts.apijsonBase,
        recordId: opts.recordId,
        onOpenRow: (key) => opts.handlers.onOpenRow(key),
        selectEnabled: listSelectEnabled(opts),
        onSearch: opts.handlers.onSearch,
        onOpenSearch: opts.handlers.onOpenSearch,
        onOpenScan: opts.handlers.onOpenScan,
        onOpenCreate: () => openListCreate(opts),
        onOpenFilter: opts.handlers.onOpenFilter,
        filterActive: opts.handlers.filterActive,
        catalogStyle: opts.catalogStyle ?? opts.handlers.catalogStyle,
        onToggleCatalog: opts.handlers.onToggleCatalog,
        pager: opts.handlers.pager,
        onOpenCategory: opts.handlers.onOpenCategory,
        onComments: opts.handlers.onComments,
      }),
    );
    return finishLayoutList(container, wrap, opts);
  }

  if (
    page === "orders" ||
    (isOrderTable(opts.primaryTable, opts.comments) && page !== "order")
  ) {
    wrap.appendChild(renderOrderList(opts));
    return finishLayoutList(container, wrap, opts);
  }
  if (page === "addressDetail") {
    const known = opts.rows.map((row) =>
      checkoutAddressFromRow(row.cells, opts.primaryTable, opts.recordId(row)),
    );
    wrap.appendChild(
      renderAddressEditor({
        mode: "create",
        table: opts.primaryTable,
        comments: opts.comments,
        knownAddresses: known,
        onWrite: opts.handlers.onWrite,
        onDone: (toCheckout) => {
          if (toCheckout) {
            opts.handlers.onOpenCheckout?.();
            opts.handlers.onSelectPage?.("order");
            return;
          }
          opts.handlers.onSelectPage?.("address");
        },
        onSelectPage: opts.handlers.onSelectPage,
      }),
    );
    return finishLayoutList(container, wrap, opts);
  }
  if (page === "address" || isAddressTable(opts.primaryTable, opts.comments)) {
    wrap.appendChild(renderAddressList(opts));
    return finishLayoutList(container, wrap, opts);
  }

  if (opts.kind === "cart" || page === "cart") {
    wrap.appendChild(
      renderCartPanel({
        ...cartOptsFromList(opts),
        onGoCheckout: () => opts.handlers.onOpenCheckout?.(),
      }),
    );
    return finishLayoutList(container, wrap, opts);
  }
  if (opts.kind === "order" || isCheckoutPage(page)) {
    wrap.appendChild(
      renderOrderPanel({
        ...cartOptsFromList(opts),
        checkoutHandler: (info) => opts.handlers.onCheckout?.(info),
        onSelectPage: opts.handlers.onSelectPage,
      }),
    );
    return finishLayoutList(container, wrap, opts);
  }

  if (page === "create") {
    feedHost.appendChild(
      renderComposePage({
        app,
        rows: opts.rows,
        columns: opts.columns,
        primaryTable: opts.primaryTable,
        comments: opts.comments,
        apijsonBase: opts.apijsonBase,
        handlers: {
          onWrite: opts.handlers.onWrite,
          onSelectPage: opts.handlers.onSelectPage,
        },
      }),
    );
    return finishLayoutList(container, wrap, opts);
  }

  if (!opts.rows.length) {
    feedHost.appendChild(el("div", "result-empty", t("result.noMatching")));
    return finishLayoutList(container, wrap, opts);
  }

  if (page === "feed") feedHost.appendChild(renderSocialFeed(opts));
  else if (
    page === "list" &&
    (app === "chat" || app === "social" || opts.kind === "chat")
  ) {
    feedHost.appendChild(renderChatList(opts));
  } else if (opts.kind === "chat") feedHost.appendChild(renderChatList(opts));
  else if (opts.kind === "music") feedHost.appendChild(renderKugouList(opts));
  else if (opts.kind === "video") feedHost.appendChild(renderYoutubeGrid(opts));
  else if (opts.kind === "commerce") feedHost.appendChild(renderProductGrid(opts));
  else if (opts.kind === "social") feedHost.appendChild(renderSocialFeed(opts));
  else if (isNewsLikeApp(app) || isNewsLikeApp(opts.kind)) {
    feedHost.appendChild(renderNewsPortal(opts));
  } else if (isBookReaderApp(app) || isBookReaderApp(opts.kind)) {
    feedHost.appendChild(renderArticleList(opts));
  } else if (isArticleLikeApp(app) || isArticleLikeApp(opts.kind)) {
    feedHost.appendChild(renderArticleList(opts));
  } else feedHost.appendChild(renderMediaList(opts));

  return finishLayoutList(container, wrap, opts);
}

function renderMediaList(opts: ListOpts): HTMLElement {
  const list = el("div", "layout-media-list");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "layout-media-card");
    card.type = "button";
    wireListRow(card, opts, row, () => opts.handlers.onOpenRow(row.key));
    card.appendChild(
      thumb(pres.coverUrl, opts.apijsonBase, "layout-media-thumb", t("result.noImage")),
    );
    const body = el("div", "layout-media-body");
    body.appendChild(el("div", "layout-kicker", kicker(opts.kind)));
    body.appendChild(el("div", "layout-title", pres.title || `#${row.key}`));
    const excerpt = pres.headline || pres.body || pres.subtitle;
    if (excerpt) body.appendChild(el("div", "layout-excerpt", excerpt.slice(0, 120)));
    const meta = [pres.author, pres.date, pres.status].filter(Boolean).join(" · ");
    if (meta) body.appendChild(el("div", "layout-meta", meta));
    card.appendChild(body);
    list.appendChild(card);
  }
  return list;
}

function renderNewsPortal(opts: ListOpts): HTMLElement {
  const portal = el("div", "news-portal");
  const top = el("div", "news-portal-top");
  const heads = el("div", "news-headline-stack");
  for (let i = 0; i < Math.min(opts.rows.length, 6); i++) {
    const row = opts.rows[i]!;
    const pres = rowPres(opts, row);
    const b = el("button", "news-headline" + (i === 0 ? " is-lead" : ""));
    b.type = "button";
    wireListRow(b, opts, row, () => opts.handlers.onOpenRow(row.key));
    b.appendChild(el("div", "layout-title", pres.title));
    if (i === 0 && (pres.headline || pres.body)) {
      b.appendChild(
        el("div", "layout-excerpt", (pres.headline || pres.body).slice(0, 96)),
      );
    }
    heads.appendChild(b);
  }
  top.appendChild(heads);

  const lead = opts.rows[0]!;
  const leadPres = rowPres(opts, lead);
  const featured = el("button", "news-featured");
  featured.type = "button";
  wireListRow(featured, opts, lead, () => opts.handlers.onOpenRow(lead.key));
  const featBody = el("div", "news-featured-body");
  featBody.appendChild(el("div", "layout-kicker", t("layout.hotNews")));
  featBody.appendChild(el("h2", "layout-title", leadPres.title));
  if (leadPres.headline || leadPres.body) {
    featBody.appendChild(
      el("div", "layout-excerpt", (leadPres.headline || leadPres.body).slice(0, 140)),
    );
  }
  featBody.appendChild(
    el(
      "div",
      "layout-meta",
      [leadPres.source, leadPres.author, leadPres.date].filter(Boolean).join(" · "),
    ),
  );
  featured.appendChild(featBody);
  featured.appendChild(
    thumb(leadPres.coverUrl, opts.apijsonBase, "news-featured-img", t("result.noImage")),
  );
  top.appendChild(featured);
  portal.appendChild(top);

  const grid = el("div", "news-grid");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "news-card");
    card.type = "button";
    wireListRow(card, opts, row, () => opts.handlers.onOpenRow(row.key));
    card.appendChild(
      thumb(pres.coverUrl, opts.apijsonBase, "news-card-img", t("result.noImage")),
    );
    card.appendChild(el("div", "layout-title", pres.title));
    card.appendChild(
      el("div", "layout-meta", [pres.source || pres.author, pres.date].filter(Boolean).join(" · ")),
    );
    grid.appendChild(card);
  }
  portal.appendChild(grid);
  return portal;
}

function renderArticleList(opts: ListOpts): HTMLElement {
  const list = el("div", "jj-list");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "jj-list-card");
    card.type = "button";
    wireListRow(card, opts, row, () => opts.handlers.onOpenRow(row.key));
    const text = el("div", "jj-list-text");
    text.appendChild(el("div", "layout-kicker", kicker(opts.kind)));
    text.appendChild(el("h2", "jj-list-title", pres.title || `#${row.key}`));
    const excerpt = pres.headline || pres.body;
    if (excerpt) {
      text.appendChild(el("div", "layout-excerpt", excerpt.slice(0, 140)));
    }
    text.appendChild(
      el(
        "div",
        "layout-meta",
        [pres.author, pres.date, pres.playCount != null ? `${formatCount(pres.playCount)} ${t("layout.reads")}` : ""]
          .filter(Boolean)
          .join(" · "),
      ),
    );
    card.appendChild(text);
    card.appendChild(
      thumb(pres.coverUrl, opts.apijsonBase, "jj-list-thumb", t("result.noImage")),
    );
    list.appendChild(card);
  }
  return list;
}

function feedPhotoLayoutClass(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return "is-1";
  if (count <= 4) return "is-2x2";
  return "is-3x3";
}

function mountFeedPhotos(
  cells: Record<string, unknown>,
  opts: {
    primaryTable: string | null;
    columns: string[];
    comments?: SchemaComments | null;
    columnMetas?: Record<string, ColumnMeta> | null;
    apijsonBase: string;
  },
): HTMLElement | null {
  const urls = collectRowFeedPhotos(
    cells,
    opts.primaryTable,
    opts.columns,
    opts.comments,
    showMap(opts.columnMetas),
  );
  if (!urls.length) return null;
  const grid = el(
    "div",
    `layout-feed-photos ${feedPhotoLayoutClass(urls.length)}`,
  );
  const srcs = urls.map((u) => mediaSrc(u, opts.apijsonBase));
  urls.forEach((url, i) => {
    const shot = thumb(url, opts.apijsonBase, "layout-social-photo", "");
    shot.title = t("layout.previewImage");
    shot.onclick = (ev) => {
      stop(ev);
      openImageLightbox(() => srcs, i);
    };
    grid.appendChild(shot);
  });
  return grid;
}

function attachFeedCommentPreview(
  opts: ListOpts,
  row: FlatRow,
  card: HTMLElement,
) {
  const spec = resolveCommentQuery(opts.primaryTable, opts.comments);
  const recordId = opts.recordId(row) ?? row.key;
  if (!spec || recordId == null || !opts.apijsonBase) return;
  void fetchRecordComments({
    base: opts.apijsonBase,
    spec,
    recordId,
    count: FEED_COMMENT_PREVIEW_MAX + 1,
  }).then((items) => {
    const hasMore = items.length > FEED_COMMENT_PREVIEW_MAX;
    const shown = items.slice(0, FEED_COMMENT_PREVIEW_MAX);
    if (!shown.length && !hasMore) return;
    const host = el("div", "layout-feed-cmt-host");
    renderFeedCommentPreview({
      host,
      items: shown,
      hasMore,
      onMore: () => opts.handlers.onOpenRow(row.key),
      onOpenAuthor: opts.handlers.onOpenAuthor,
    });
    card.appendChild(host);
  });
}

function renderSocialFeed(opts: ListOpts): HTMLElement {
  const feed = el("div", "layout-feed");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("div", "layout-feed-card");
    card.setAttribute("role", "button");
    card.tabIndex = 0;
    const open = () => opts.handlers.onOpenRow(row.key);
    wireListRow(card, opts, row, open);
    card.onkeydown = (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        if (isListSelectActive()) {
          card.click();
          return;
        }
        open();
      }
    };
    const head = el("div", "layout-feed-head");
    head.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "layout-avatar", ""));
    const who = el("div", "layout-feed-who");
    who.appendChild(
      el("div", "layout-title", pres.author || pres.title || `#${row.key}`),
    );
    if (pres.date) who.appendChild(el("div", "layout-meta", pres.date));
    head.appendChild(who);
    card.appendChild(head);
    const text = pres.body || (pres.author ? pres.title : "");
    if (text) card.appendChild(el("div", "layout-feed-text", text));
    const photos = mountFeedPhotos(row.cells, opts);
    if (photos) card.appendChild(photos);
    attachFeedCommentPreview(opts, row, card);
    feed.appendChild(card);
  }
  return feed;
}

function renderChatList(opts: ListOpts): HTMLElement {
  const list = el("div", "layout-chat-list wx-conv-list");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "layout-chat-row");
    card.type = "button";
    wireListRow(card, opts, row, () => opts.handlers.onOpenRow(row.key));
    const av = thumb(pres.coverUrl, opts.apijsonBase, "layout-avatar", "");
    const personId = pres.authorId;
    if (personId != null) {
      av.classList.add("author-link");
      av.setAttribute("role", "button");
      av.tabIndex = 0;
      av.onclick = (ev) => {
        stop(ev);
        opts.handlers.onOpenAuthor?.(personId);
      };
    }
    card.appendChild(av);
    const mid = el("div", "layout-chat-mid");
    mid.appendChild(
      el("div", "layout-title", pres.author || pres.title || `#${row.key}`),
    );
    mid.appendChild(
      el("div", "layout-excerpt", (pres.body || pres.subtitle || "").slice(0, 80)),
    );
    card.appendChild(mid);
    if (pres.date) card.appendChild(el("div", "layout-chat-time", pres.date));
    list.appendChild(card);
  }
  return list;
}

function renderYoutubeGrid(opts: ListOpts): HTMLElement {
  const grid = el("div", "yt-grid");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "yt-card");
    card.type = "button";
    wireListRow(card, opts, row, () => opts.handlers.onOpenRow(row.key));
    const cover = thumb(
      pres.coverUrl,
      opts.apijsonBase,
      "yt-thumb",
      t("layout.play"),
    );
    const dur = formatDuration(pres.durationSec);
    if (dur) cover.appendChild(el("span", "yt-duration", dur));
    card.appendChild(cover);
    const meta = el("div", "yt-card-meta");
    meta.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "yt-avatar", ""));
    const text = el("div", "yt-card-text");
    text.appendChild(el("div", "yt-card-title", pres.title || `#${row.key}`));
    text.appendChild(el("div", "layout-meta", pres.author || t("layout.video")));
    const stats = [
      pres.playCount != null ? `${formatCount(pres.playCount)} ${t("layout.views")}` : "",
      pres.date,
    ]
      .filter(Boolean)
      .join(" · ");
    if (stats) text.appendChild(el("div", "layout-meta", stats));
    meta.appendChild(text);
    card.appendChild(meta);
    grid.appendChild(card);
  }
  return grid;
}

function renderKugouList(opts: ListOpts): HTMLElement {
  const box = el("div", "kg-home");
  const featured = el("div", "kg-featured");
  featured.appendChild(el("h3", "kg-h", t("layout.music")));
  const featGrid = el("div", "kg-feat-grid");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "kg-feat-card");
    card.type = "button";
    wireListRow(card, opts, row, () => opts.handlers.onOpenRow(row.key));
    const cover = thumb(pres.coverUrl, opts.apijsonBase, "kg-feat-img", "");
    cover.appendChild(el("span", "layout-play-badge", "▶"));
    if (pres.playCount != null) {
      cover.appendChild(el("span", "kg-plays", formatCount(pres.playCount)));
    }
    card.appendChild(cover);
    card.appendChild(el("div", "layout-title", pres.title));
    featGrid.appendChild(card);
  }
  featured.appendChild(featGrid);
  box.appendChild(featured);

  const list = el("div", "kg-tracks");
  list.appendChild(el("h3", "kg-h", t("layout.queue")));
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const item = el("button", "kg-track");
    item.type = "button";
    wireListRow(item, opts, row, () => opts.handlers.onOpenRow(row.key));
    item.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "layout-track-cover", ""));
    const info = el("div", "layout-track-info");
    info.appendChild(el("div", "layout-title", pres.title || `#${row.key}`));
    info.appendChild(el("div", "layout-meta", pres.author || pres.album));
    item.appendChild(info);
    item.appendChild(el("div", "kg-dur", formatDuration(pres.durationSec) || ""));
    list.appendChild(item);
  }
  box.appendChild(list);
  return box;
}

function renderProductGrid(opts: ListOpts): HTMLElement {
  const grid = el("div", "layout-product-grid az-grid");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("div", "layout-product-card");
    const open = el("button", "layout-product-open");
    open.type = "button";
    wireListRow(open, opts, row, () => opts.handlers.onOpenRow(row.key));
    open.appendChild(
      thumb(pres.coverUrl, opts.apijsonBase, "layout-product-img", t("result.noImage")),
    );
    open.appendChild(el("div", "layout-title", pres.title || `#${row.key}`));
    const price = formatPrice(pres.price);
    if (price) open.appendChild(el("div", "layout-price", price));
    if (pres.sales != null) {
      open.appendChild(el("div", "layout-meta", `${formatCount(pres.sales)} ${t("layout.sold")}`));
    }
    card.appendChild(open);
    addShopButtons(card, row, pres, opts.handlers);
    grid.appendChild(card);
  }
  return grid;
}

export function renderLayoutDetailHero(
  host: HTMLElement,
  opts: {
    kind: LayoutKind;
    spec?: LayoutSpec;
    row: FlatRow;
    columns: string[];
    primaryTable: string | null;
    comments?: SchemaComments | null;
    columnMetas?: Record<string, ColumnMeta> | null;
    apijsonBase: string;
    recordId?: string | number | null;
    handlers: LayoutDetailHandlers;
  },
): void {
  const pres = present(opts.row, {
    table: opts.primaryTable,
    columns: opts.columns,
    comments: opts.comments,
    metas: opts.columnMetas,
    recordId: opts.recordId,
  });
  const related = relatedItems(opts.recordId ?? null);
  const specPage = opts.spec?.page;
  const specApp = listApp(opts);

  if (specPage === "profile") {
    const me = visitorId();
    const self =
      me != null &&
      String(opts.recordId ?? pres.id ?? "") === String(me);
    if (opts.kind === "data" && self) return;
    renderUserProfile(host, {
      app: specApp,
      pres,
      row: opts.row,
      related,
      apijsonBase: opts.apijsonBase,
      handlers: opts.handlers,
      primaryTable: opts.primaryTable,
      recordId: opts.recordId ?? pres.id,
      comments: opts.comments,
    });
    const titleEl = document.getElementById("page-title-input");
    if (titleEl instanceof HTMLInputElement) {
      titleEl.value = t("layout.page.profile");
    }
    return;
  }
  if (specPage === "users" || isUserLayoutPage(specPage)) {
    renderUserProfile(host, {
      app: specApp,
      pres,
      row: opts.row,
      related,
      apijsonBase: opts.apijsonBase,
      handlers: opts.handlers,
      primaryTable: opts.primaryTable,
      recordId: opts.recordId ?? pres.id,
      comments: opts.comments,
    });
    return;
  }

  if (opts.kind === "cart" || specPage === "cart") {
    host.appendChild(
      renderCartPanel({
        rows: [opts.row],
        columns: opts.columns,
        table: opts.primaryTable,
        comments: opts.comments,
        metas: opts.columnMetas,
        apijsonBase: opts.apijsonBase,
        recordId: () => opts.recordId ?? null,
        onGoCheckout: () => opts.handlers.onOpenCheckout?.(),
      }),
    );
    return;
  }
  if (
    isOrdersPage(specPage) ||
    isOrderTable(opts.primaryTable, opts.comments)
  ) {
    host.appendChild(renderOrderReceipt(opts));
    return;
  }
  if (
    specPage === "addressDetail" ||
    isAddressTable(opts.primaryTable, opts.comments)
  ) {
    const known = (relatedPack?.rows || []).map((row) =>
      checkoutAddressFromRow(
        row.cells,
        relatedPack?.table ?? opts.primaryTable,
        relatedPack?.recordId(row) ?? null,
      ),
    );
    host.appendChild(
      renderAddressEditor({
        mode: "edit",
        table: opts.primaryTable,
        row: opts.row,
        columns: opts.columns,
        comments: opts.comments,
        columnMetas: opts.columnMetas,
        recordId: opts.recordId,
        knownAddresses: known,
        onWrite: opts.handlers.onWrite,
        onDone: (toCheckout) => {
          if (toCheckout) {
            opts.handlers.onOpenCheckout?.();
            opts.handlers.onSelectPage?.("order");
            return;
          }
          opts.handlers.onSelectPage?.("address");
          opts.handlers.onBack?.();
        },
        onSelectPage: opts.handlers.onSelectPage,
      }),
    );
    return;
  }
  if (opts.kind === "order" || isCheckoutPage(specPage)) {
    host.appendChild(
      renderOrderPanel({
        rows: [opts.row],
        columns: opts.columns,
        table: opts.primaryTable,
        comments: opts.comments,
        metas: opts.columnMetas,
        apijsonBase: opts.apijsonBase,
        recordId: () => opts.recordId ?? null,
        checkoutHandler: opts.handlers.onCheckout,
        onSelectPage: opts.handlers.onSelectPage,
      }),
    );
    return;
  }

  const app = el("div", `layout-app app-${opts.kind}`);
  const musicPlayer = opts.kind === "music" || specApp === "music";
  const bookReader =
    isBookReaderApp(specApp) || isBookReaderApp(opts.kind);
  if (
    !musicPlayer &&
    !bookReader &&
    (isCommentableApp(opts.kind) || isCommentableApp(specApp))
  ) {
    app.classList.add("has-comment-dock");
  }
  if (opts.kind === "video") renderYoutubeWatch(app, pres, related, opts);
  else if (opts.kind === "music") renderSpotifyPlayer(app, pres, related, opts);
  else if (opts.kind === "commerce") renderAmazonPdp(app, pres, related, opts);
  else if (opts.kind === "chat") renderWechatThread(app, pres, related, opts);
  else if (opts.kind === "social") {
    if (pres.videoUrl) renderTikTokStage(app, pres, opts);
    else renderMomentDetail(app, pres, opts);
  }
  else if (isNewsLikeApp(specApp) || isNewsLikeApp(opts.kind)) {
    renderNewsArticle(app, pres, related, opts);
  } else if (bookReader) {
    const { commentHost, commentEntry, commentCountEl, setCommentsOpen } =
      renderBookReader(app, pres, {
        kind: opts.kind,
        spec: opts.spec,
        apijsonBase: opts.apijsonBase,
        comments: opts.comments,
        columnMetas: opts.columnMetas,
        columns: opts.columns,
        primaryTable: opts.primaryTable,
        recordId: opts.recordId,
        row: opts.row,
      });
    const chrome = makeCommentChrome(commentHost, opts, {
      recordId: opts.recordId ?? pres.id,
    });
    const paintCommentCount = (n: number) => {
      commentCountEl.textContent = formatCount(n) || "0";
      commentEntry.setAttribute(
        "aria-label",
        `${t("layout.comments")} ${commentCountEl.textContent}`,
      );
    };
    const recordId = opts.recordId ?? pres.id;
    const commentSpec = resolveCommentQuery(
      opts.primaryTable ?? null,
      opts.comments,
    );
    if (commentSpec && recordId != null) {
      void fetchRecordComments({
        base: opts.apijsonBase,
        spec: commentSpec,
        recordId,
        count: 100,
      }).then((items) => {
        paintCommentCount(flattenComments(items).length);
      });
    }
    commentEntry.onclick = () => {
      setCommentsOpen(true);
      chrome.section.scrollIntoView({ behavior: "smooth", block: "start" });
      chrome.focus();
    };
    mountSocialActions({
      pres,
      cells: opts.row?.cells,
      table: opts.primaryTable ?? null,
      recordId: opts.recordId ?? pres.id,
      apijsonBase: opts.apijsonBase,
      handlers: opts.handlers,
      followBtns: [],
      authorNodes: [],
      ...commentActionFields(chrome, () => opts.handlers.onBuyNow?.()),
      commentCountEl,
      onCommentsLoaded: (items) => {
        paintCommentCount(flattenComments(items).length);
      },
    });
  } else if (isArticleLikeApp(specApp) || isArticleLikeApp(opts.kind)) {
    renderJuejinArticle(app, pres, related, opts);
  } else if (isLocalLikeApp(specApp) || isLocalLikeApp(opts.kind)) {
    renderCampaignLanding(app, pres, opts);
  } else {
    renderJuejinArticle(app, pres, related, opts);
  }
  mountOwnerWriteBar(app, {
    table: opts.primaryTable,
    recordId: opts.recordId ?? pres.id,
    authorId: pres.authorId,
    cells: opts.row.cells,
    handlers: opts.handlers,
  });
  host.appendChild(app);
}

function openRelated(
  handlers: LayoutDetailHandlers,
  id: string | number,
) {
  handlers.onOpenRelated?.(id);
}

async function runActionSlot(
  handlers: LayoutDetailHandlers,
  slot: ActionSlot,
  ctx: ActionRunContext,
  opts?: { bindIfMissing?: boolean; quiet?: boolean },
): Promise<ActionSlotResult> {
  if (!handlers.onActionSlot) {
    if (!opts?.quiet) flashLayoutNote(t("layout.actionUnbound"));
    return { ok: false };
  }
  const result = await handlers.onActionSlot(slot, ctx, {
    bindIfMissing: opts?.bindIfMissing,
  });
  if (result === false || result == null) return { ok: false };
  if (result === true) return { ok: true };
  return result;
}

function needVisitor(): string | number | null {
  const id = visitorId();
  if (id == null) {
    flashLayoutNote(t("layout.needLogin"));
    return null;
  }
  return id;
}

function askText(title: string, placeholder: string): Promise<string | null> {
  return new Promise((resolve) => {
    const mask = el("div", "layout-ask-mask");
    const box = el("div", "layout-ask");
    box.appendChild(el("div", "layout-ask-title", title));
    const input = document.createElement("textarea");
    input.className = "layout-ask-input";
    input.placeholder = placeholder;
    input.rows = 4;
    const row = el("div", "layout-ask-actions");
    const cancel = el("button", "app-chip", t("common.cancel"));
    cancel.type = "button";
    const ok = el("button", "layout-btn layout-btn-primary", t("layout.send"));
    ok.type = "button";
    const finish = (value: string | null) => {
      mask.remove();
      resolve(value);
    };
    cancel.onclick = () => finish(null);
    ok.onclick = () => finish(input.value.trim() || null);
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") finish(null);
    });
    row.append(cancel, ok);
    box.append(input, row);
    mask.appendChild(box);
    mask.addEventListener("click", (ev) => {
      if (ev.target === mask) finish(null);
    });
    document.body.appendChild(mask);
    input.focus();
  });
}

function detailApp(opts: { kind?: LayoutKind; spec?: LayoutSpec }): LayoutApp {
  return opts.spec?.app ?? appFromKind(opts.kind ?? "data");
}

function detailRateable(opts: {
  kind?: LayoutKind;
  spec?: LayoutSpec;
  comments?: SchemaComments | null;
  price?: number | null;
  hasBuy?: boolean;
}): boolean {
  const app = detailApp(opts);
  if (shouldShowCommentRating(isRateableApp(app), opts.comments)) return true;
  return Boolean(
    opts.hasBuy &&
      opts.price != null &&
      Number.isFinite(opts.price) &&
      opts.price > 0,
  );
}

function bindPurchaseGate(
  chrome: CommentChrome,
  opts: {
    kind?: LayoutKind;
    spec?: LayoutSpec;
    comments?: SchemaComments | null;
    table: string | null;
    recordId: string | number | null;
    price?: number | null;
    hasBuy?: boolean;
    apijsonBase: string;
  },
) {
  const required = reviewRequiresPurchase({
    app: detailApp(opts),
    price: opts.price,
    hasBuy: opts.hasBuy,
  });
  if (!required) {
    chrome.setPurchaseLocked(false);
    return;
  }
  if (!opts.table || opts.recordId == null) {
    chrome.setPurchaseLocked(true);
    return;
  }
  chrome.setPurchaseLocked(!hasLocalPurchase(opts.table, opts.recordId));
  void visitorHasPurchased({
    apijsonBase: opts.apijsonBase,
    comments: opts.comments,
    itemTable: opts.table,
    itemId: opts.recordId,
  }).then((ok) => chrome.setPurchaseLocked(!ok));
}

function makeCommentChrome(
  host: HTMLElement,
  view: {
    kind?: LayoutKind;
    spec?: LayoutSpec;
    comments?: SchemaComments | null;
    apijsonBase: string;
    primaryTable?: string | null;
    recordId?: string | number | null;
    handlers?: LayoutDetailHandlers;
  },
  extra?: {
    insertBefore?: HTMLElement | null;
    price?: number | null;
    hasBuy?: boolean;
    recordId?: string | number | null;
  },
): CommentChrome {
  const hasBuy = extra?.hasBuy === true;
  const required = reviewRequiresPurchase({
    app: detailApp(view),
    price: extra?.price,
    hasBuy,
  });
  const onBuy = () => view.handlers?.onBuyNow?.();
  const chrome = mountCommentChrome({
    host,
    apijsonBase: view.apijsonBase,
    rateable: detailRateable({
      ...view,
      price: extra?.price,
      hasBuy: extra?.hasBuy,
    }),
    insertBefore: extra?.insertBefore,
    purchaseRequired: required,
    onNeedPurchase: required ? onBuy : undefined,
  });
  bindPurchaseGate(chrome, {
    kind: view.kind,
    spec: view.spec,
    comments: view.comments,
    table: view.primaryTable ?? null,
    recordId: extra?.recordId ?? view.recordId ?? null,
    price: extra?.price,
    hasBuy,
    apijsonBase: view.apijsonBase,
  });
  return chrome;
}

function commentActionFields(
  chrome: CommentChrome,
  onBlocked?: () => void,
) {
  return {
    commentList: chrome.list,
    commentInput: chrome.input,
    commentSend: chrome.send,
    commentScore: chrome.getScore,
    getReplyTo: () => chrome.getReplyTarget()?.id ?? null,
    onReplyComment: (item: SocialComment) => {
      if (item.id == null || item.id === "") return;
      chrome.setReplyTarget({
        id: item.id,
        name: item.name || t("layout.authorCard"),
      });
    },
    onCommentPosted: () => {
      chrome.setScore(null);
      chrome.setReplyTarget(null);
    },
    canComment: chrome.canComment,
    onCommentBlocked: onBlocked,
    showCommentScore: chrome.rateable,
  };
}

function bindAuthorClicks(
  nodes: HTMLElement[],
  authorId: string | number | null,
  onOpen?: (id: string | number) => void,
) {
  for (const node of nodes) {
    node.classList.add("author-link");
    node.setAttribute("role", "button");
    node.tabIndex = 0;
    const go = () => {
      if (authorId == null) {
        flashLayoutNote(t("layout.noAuthor"));
        return;
      }
      onOpen?.(authorId);
    };
    node.onclick = go;
    node.onkeydown = (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        go();
      }
    };
  }
}

type SocialMount = {
  pres: RowPresentation;
  cells?: Record<string, unknown>;
  table: string | null;
  recordId: string | number | null;
  apijsonBase: string;
  handlers: LayoutDetailHandlers;
  likeBtn?: HTMLElement;
  collectBtn?: HTMLElement;
  collectBtns?: HTMLElement[];
  shareBtn?: HTMLElement;
  dislikeBtn?: HTMLElement;
  followBtns: HTMLElement[];
  messageBtns?: HTMLElement[];
  authorNodes: HTMLElement[];
  commentList?: HTMLElement;
  commentInput?: HTMLInputElement | HTMLTextAreaElement;
  commentSend?: HTMLButtonElement;
  commentScore?: () => number | null;
  getReplyTo?: () => string | number | null;
  onReplyComment?: (item: SocialComment) => void;
  canComment?: () => boolean;
  onCommentBlocked?: () => void;
  onCommentPosted?: () => void;
  onCommentsLoaded?: (items: SocialComment[]) => void;
  likeCountEl?: HTMLElement;
  collectCountEl?: HTMLElement;
  commentCountEl?: HTMLElement;
  ratingSummaryEl?: HTMLElement;
  showCommentScore?: boolean;
};

const PRAISE_LIST_FIELDS = [
  "praiseuseridlist",
  "likeuseridlist",
  "likedby",
];
const COLLECT_LIST_FIELDS = [
  "collectuseridlist",
  "favoriteuseridlist",
  "staruseridlist",
];

function collectButtons(ctx: SocialMount): HTMLElement[] {
  return [ctx.collectBtn, ...(ctx.collectBtns ?? [])].filter(
    (n): n is HTMLElement => !!n,
  );
}

function inferSocialListField(
  slot: "like" | "collect",
  cells?: Record<string, unknown>,
): string {
  const names = slot === "collect" ? COLLECT_LIST_FIELDS : PRAISE_LIST_FIELDS;
  let best: { key: string; score: number } | null = null;
  for (const key of Object.keys(cells ?? {})) {
    const short = key.includes(".") ? key.slice(key.lastIndexOf(".") + 1) : key;
    const n = short.toLowerCase().replace(/[^a-z0-9]/g, "");
    const hit = names.findIndex((x) => n === x || n.includes(x));
    if (hit < 0) continue;
    const score = n === names[0] ? 10 : 6 - hit;
    if (!best || score > best.score) best = { key: short, score };
  }
  return best?.key ?? (slot === "collect" ? "collectUserIdList" : "praiseUserIdList");
}

async function writeSocialList(
  ctx: SocialMount,
  slot: "like" | "collect",
  already: boolean,
): Promise<boolean> {
  const write = ctx.handlers.onWrite;
  const table = ctx.table?.trim();
  const me = visitorId();
  if (!write || !table || ctx.recordId == null || me == null) return false;
  const field = inferSocialListField(slot, ctx.cells);
  const op = already ? `${field}}{` : `${field}<>`;
  try {
    const ok = await write({
      method: "put",
      table,
      body: {
        [table]: { id: ctx.recordId, [op]: me },
        tag: table,
      },
      stayOnPage: true,
      keepTag: true,
      skipTemplate: true,
    });
    return ok !== false;
  } catch {
    return false;
  }
}

async function runSocialToggle(
  ctx: SocialMount,
  slot: "like" | "collect",
  already: boolean,
): Promise<boolean> {
  const bound = ctx.handlers.actionBindings?.[slot];
  if (bound) {
    const result = await runActionSlot(
      ctx.handlers,
      slot,
      recordContext(ctx, { already }),
    );
    return result.ok;
  }
  if (await writeSocialList(ctx, slot, already)) return true;
  const result = await runActionSlot(
    ctx.handlers,
    slot,
    recordContext(ctx, { already }),
  );
  return result.ok;
}

function recordContext(
  ctx: SocialMount,
  extra?: Partial<ActionRunContext>,
): ActionRunContext {
  const cells: Record<string, unknown> = { ...(ctx.cells ?? {}) };
  if (ctx.recordId != null) cells.id = ctx.recordId;
  return {
    record: cells,
    visitorId: visitorId(),
    authorId: ctx.pres.authorId,
    ...extra,
  };
}

function mountSocialActions(ctx: SocialMount) {
  const me = visitorId();
  const state = {
    liked: idInList(ctx.pres.praiseIds, me),
    collected: idInList(ctx.pres.collectIds, me),
    following: false,
    likeCount: ctx.pres.praiseIds.length,
    collectCount: ctx.pres.collectIds.length,
  };

  const paintFollow = () => {
    for (const btn of ctx.followBtns) {
      btn.classList.toggle("is-on", state.following);
      if (
        btn.classList.contains("yt-sub") ||
        btn.classList.contains("jj-follow")
      ) {
        btn.textContent = state.following
          ? btn.classList.contains("yt-sub")
            ? t("layout.subscribed")
            : t("layout.following")
          : btn.classList.contains("yt-sub")
            ? t("layout.subscribe")
            : t("layout.follow");
      }
    }
  };

  const hearts = collectButtons(ctx);

  const paintCounts = () => {
    ctx.likeBtn?.classList.toggle("is-on", state.liked);
    for (const btn of hearts) {
      btn.classList.toggle("is-on", state.collected);
      btn.setAttribute("aria-pressed", state.collected ? "true" : "false");
      btn.title = state.collected
        ? t("layout.collected")
        : t("layout.slot.collect");
      if (btn.classList.contains("app-chip") || btn.classList.contains("yt-save")) {
        btn.textContent = `${t("layout.slot.collect")}${
          state.collectCount ? ` ${formatCount(state.collectCount)}` : ""
        }`;
      }
    }
    if (ctx.likeCountEl) {
      ctx.likeCountEl.textContent = formatCount(state.likeCount) || "0";
    }
    if (ctx.collectCountEl) {
      ctx.collectCountEl.textContent = formatCount(state.collectCount) || "0";
    }
    if (
      ctx.likeBtn &&
      (ctx.likeBtn.classList.contains("app-chip") ||
        ctx.likeBtn.classList.contains("yt-like"))
    ) {
      ctx.likeBtn.textContent = `👍 ${t("layout.like")}${state.likeCount ? ` ${formatCount(state.likeCount)}` : ""}`;
    }
  };

  paintFollow();
  paintCounts();
  bindAuthorClicks(ctx.authorNodes, ctx.pres.authorId, ctx.handlers.onOpenAuthor);

  if (ctx.likeBtn) {
    ctx.likeBtn.onclick = async () => {
      if (needVisitor() == null) return;
      const ok = await runSocialToggle(ctx, "like", state.liked);
      if (!ok) return;
      state.liked = !state.liked;
      state.likeCount = Math.max(0, state.likeCount + (state.liked ? 1 : -1));
      paintCounts();
      flashLayoutNote(state.liked ? t("layout.liked") : t("layout.like"));
    };
  }

  if (ctx.dislikeBtn) {
    ctx.dislikeBtn.onclick = async () => {
      if (!state.liked || !ctx.likeBtn) return;
      ctx.likeBtn.click();
    };
  }

  const onCollect = async () => {
    if (needVisitor() == null) return;
    const ok = await runSocialToggle(ctx, "collect", state.collected);
    if (!ok) return;
    state.collected = !state.collected;
    state.collectCount = Math.max(
      0,
      state.collectCount + (state.collected ? 1 : -1),
    );
    paintCounts();
    flashLayoutNote(
      state.collected ? t("layout.collected") : t("layout.slot.collect"),
    );
  };
  for (const btn of hearts) btn.onclick = () => void onCollect();

  if (ctx.shareBtn) {
    ctx.shareBtn.onclick = async () => {
      const text = `${ctx.pres.title} ${location.href}`.trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        /* still record share */
      }
      const result = await runActionSlot(
        ctx.handlers,
        "share",
        recordContext(ctx),
      );
      if (!result.ok) return;
      flashLayoutNote(t("layout.shared"));
    };
  }

  const follow = async () => {
    if (needVisitor() == null) return;
    if (ctx.pres.authorId == null) {
      flashLayoutNote(t("layout.noAuthor"));
      return;
    }
    const result = await runActionSlot(
      ctx.handlers,
      "follow",
      recordContext(ctx, { already: state.following }),
    );
    if (!result.ok) return;
    state.following = !state.following;
    paintFollow();
    flashLayoutNote(
      state.following ? t("layout.following") : t("layout.follow"),
    );
  };
  for (const btn of ctx.followBtns) btn.onclick = () => void follow();

  for (const btn of ctx.messageBtns ?? []) {
    btn.onclick = async () => {
      if (needVisitor() == null) return;
      if (ctx.pres.authorId == null) {
        flashLayoutNote(t("layout.noAuthor"));
        return;
      }
      const text = await askText(t("layout.message"), t("layout.messageHint"));
      if (!text) return;
      const result = await runActionSlot(
        ctx.handlers,
        "message",
        recordContext(ctx, { input: text }),
      );
      if (!result.ok) return;
      flashLayoutNote(t("layout.messageSent"));
    };
  }

  const reloadComments = async (bindIfMissing = false) => {
    if (!ctx.commentList || ctx.recordId == null) return;
    const result = await runActionSlot(
      ctx.handlers,
      "commentList",
      recordContext(ctx),
      { bindIfMissing, quiet: !bindIfMissing },
    );
    if (!result.ok) return;
    const items = parseCommentsFromResponse(result.json);
    renderCommentItems(
      ctx.commentList,
      items,
      ctx.apijsonBase,
      ctx.handlers.onOpenAuthor,
      (item) => {
        if (ctx.canComment && !ctx.canComment()) {
          flashLayoutNote(t("layout.reviewNeedPurchase"));
          ctx.onCommentBlocked?.();
          return;
        }
        ctx.onReplyComment?.(item);
      },
      ctx.showCommentScore === true,
    );
    if (ctx.commentCountEl) {
      ctx.commentCountEl.textContent =
        formatCount(flattenComments(items).length) || "0";
    }
    if (ctx.showCommentScore) paintRatingSummary(ctx.ratingSummaryEl, items);
    ctx.onCommentsLoaded?.(items);
  };

  if (ctx.commentSend && ctx.commentInput) {
    const send = async () => {
      const text = ctx.commentInput!.value.trim();
      if (!text) return;
      if (ctx.canComment && !ctx.canComment()) {
        flashLayoutNote(t("layout.reviewNeedPurchase"));
        ctx.onCommentBlocked?.();
        return;
      }
      if (needVisitor() == null || ctx.recordId == null) return;
      const result = await runActionSlot(
        ctx.handlers,
        "comment",
        recordContext(ctx, {
          input: text,
          score: ctx.commentScore?.() ?? undefined,
          toId: ctx.getReplyTo?.() ?? undefined,
        }),
      );
      if (!result.ok) return;
      ctx.commentInput!.value = "";
      ctx.onCommentPosted?.();
      flashLayoutNote(t("layout.commentPosted"));
      await reloadComments(true);
    };
    ctx.commentSend.onclick = () => void send();
    ctx.commentInput.addEventListener("keydown", (ev) => {
      const kev = ev as KeyboardEvent;
      if (kev.key === "Enter" && !kev.shiftKey) {
        kev.preventDefault();
        void send();
      }
    });
  }

  void (async () => {
    if (ctx.pres.authorId != null) {
      const result = await runActionSlot(
        ctx.handlers,
        "authorGet",
        recordContext(ctx),
        { bindIfMissing: false, quiet: true },
      );
      const row =
        result.json && typeof result.json === "object"
          ? (result.json as Record<string, unknown>)
          : null;
      if (row) {
        const nested = Object.values(row).find(
          (v) => v && typeof v === "object" && !Array.isArray(v),
        ) as Record<string, unknown> | undefined;
        const person = nested || row;
        const head = Object.entries(person).find(([k, v]) =>
          /head|avatar|portrait|picture|cover|头像/i.test(k) &&
          typeof v === "string" &&
          v.trim(),
        )?.[1];
        if (typeof head === "string") {
          for (const node of ctx.authorNodes) {
            const img = node.querySelector("img");
            if (img) img.src = mediaSrc(head, ctx.apijsonBase);
          }
        }
      }
    }
    await reloadComments();
  })();
}

function renderYoutubeWatch(
  app: HTMLElement,
  pres: RowPresentation,
  related: Array<{ pres: RowPresentation; id: string | number }>,
  opts: {
    kind?: LayoutKind;
    spec?: LayoutSpec;
    comments?: SchemaComments | null;
    apijsonBase: string;
    handlers: LayoutDetailHandlers;
    primaryTable?: string | null;
    recordId?: string | number | null;
    row?: FlatRow;
  },
) {
  const page = el("div", "yt-watch");
  const main = el("div", "yt-main");
  const player = el("div", "yt-player");
  const video = el("video", "yt-video");
  video.controls = false;
  video.playsInline = true;
  video.preload = "metadata";
  video.autoplay = false;
  if (pres.videoUrl) video.src = mediaSrc(pres.videoUrl, opts.apijsonBase);
  if (pres.coverUrl) video.poster = mediaSrc(pres.coverUrl, opts.apijsonBase);
  player.appendChild(video);
  mountVideoChrome({
    shell: player,
    media: video,
    variant: "youtube",
    durationHint: pres.durationSec,
    onNext: related[0]
      ? () => openRelated(opts.handlers, related[0]!.id)
      : undefined,
    qualities: pres.qualities,
    subtitles: pres.subtitles,
    apijsonBase: opts.apijsonBase,
  });
  main.appendChild(player);
  main.appendChild(el("h1", "yt-title", pres.title));

  const row = el("div", "yt-channel-row");
  const left = el("div", "yt-channel");
  const avatar = thumb(pres.coverUrl, opts.apijsonBase, "yt-avatar-lg", "");
  const who = el("div");
  const authorName = el("div", "yt-channel-name", pres.author || t("layout.video"));
  who.appendChild(authorName);
  who.appendChild(
    el(
      "div",
      "layout-meta",
      pres.playCount != null
        ? `${formatCount(pres.playCount)} ${t("layout.views")}`
        : "",
    ),
  );
  left.appendChild(avatar);
  left.appendChild(who);
  const subBtn = chip(t("layout.subscribe"), "yt-sub");
  left.appendChild(subBtn);
  row.appendChild(left);
  const actions = el("div", "yt-actions");
  const likeBtn = chip(`👍 ${t("layout.like")}`, "app-chip yt-like");
  const dislikeBtn = chip("👎", "app-chip");
  const shareBtn = chip(t("layout.share"), "app-chip");
  const saveBtn = chip(t("layout.slot.collect"), "app-chip yt-save");
  const exportBtn = chip(t("layout.media.download"), "app-chip");
  exportBtn.onclick = () => {
    const url = pres.videoUrl || pres.audioUrl;
    if (!url) {
      flashLayoutNote(t("layout.media.downloadEmpty"));
      return;
    }
    void downloadOneMedia(url, pres.title || "video", opts.apijsonBase);
  };
  actions.append(likeBtn, dislikeBtn, shareBtn, saveBtn, exportBtn);
  row.appendChild(actions);
  main.appendChild(row);

  const desc = el("div", "yt-desc");
  const stats = [
    pres.playCount != null ? `${formatCount(pres.playCount)} ${t("layout.views")}` : "",
    pres.date,
  ]
    .filter(Boolean)
    .join("  ·  ");
  if (stats) desc.appendChild(el("div", "yt-desc-stats", stats));
  if (pres.body) desc.appendChild(el("div", "yt-desc-body", pres.body));
  main.appendChild(desc);

  const chrome = makeCommentChrome(main, opts, {
    recordId: opts.recordId ?? pres.id,
  });
  mountSocialActions({
    pres,
    cells: opts.row?.cells,
    table: opts.primaryTable ?? null,
    recordId: opts.recordId ?? pres.id,
    apijsonBase: opts.apijsonBase,
    handlers: opts.handlers,
    likeBtn,
    collectBtn: saveBtn,
    shareBtn,
    dislikeBtn,
    followBtns: [subBtn],
    authorNodes: [avatar, authorName],
    ...commentActionFields(chrome, () => opts.handlers.onBuyNow?.()),
  });
  page.appendChild(main);

  const side = el("div", "yt-related");
  side.appendChild(el("h3", "yt-h", t("layout.related")));
  for (const item of related.slice(0, 12)) {
    const card = el("button", "yt-related-card");
    card.type = "button";
    card.onclick = () => openRelated(opts.handlers, item.id);
    const th = thumb(item.pres.coverUrl, opts.apijsonBase, "yt-related-thumb", "");
    const dur = formatDuration(item.pres.durationSec);
    if (dur) th.appendChild(el("span", "yt-duration", dur));
    card.appendChild(th);
    const tx = el("div", "yt-related-text");
    tx.appendChild(el("div", "layout-title", item.pres.title));
    tx.appendChild(el("div", "layout-meta", item.pres.author));
    if (item.pres.playCount != null) {
      tx.appendChild(
        el("div", "layout-meta", `${formatCount(item.pres.playCount)} ${t("layout.views")}`),
      );
    }
    card.appendChild(tx);
    side.appendChild(card);
  }
  page.appendChild(side);
  app.appendChild(page);
}

function renderSpotifyPlayer(
  app: HTMLElement,
  pres: RowPresentation,
  related: Array<{ pres: RowPresentation; id: string | number; row?: FlatRow }>,
  opts: {
    kind?: LayoutKind;
    spec?: LayoutSpec;
    comments?: SchemaComments | null;
    apijsonBase: string;
    handlers: LayoutDetailHandlers;
    primaryTable?: string | null;
    recordId?: string | number | null;
    row?: FlatRow;
  },
) {
  const page = el("div", "sp-page");
  if (pres.coverUrl) {
    const bg = el("div", "sp-blur");
    bg.style.backgroundImage = `url("${mediaSrc(pres.coverUrl, opts.apijsonBase)}")`;
    page.appendChild(bg);
  }
  const hero = el("div", "sp-hero");
  hero.appendChild(
    thumb(pres.coverUrl, opts.apijsonBase, "sp-art", t("result.noImage")),
  );
  const info = el("div", "sp-hero-text");
  info.appendChild(el("div", "sp-kind", t("layout.music")));
  info.appendChild(el("h1", "sp-title", pres.title));
  info.appendChild(
    el(
      "div",
      "sp-sub",
      [pres.author, pres.album, formatDuration(pres.durationSec)]
        .filter(Boolean)
        .join(" · "),
    ),
  );
  if (pres.playCount != null) {
    info.appendChild(
      el("div", "layout-meta", `${formatCount(pres.playCount)} ${t("layout.plays")}`),
    );
  }
  const playRow = el("div", "sp-play-row");
  const playBtn = el("button", "sp-play", "▶");
  playBtn.type = "button";
  playBtn.title = t("layout.play");
  playRow.appendChild(playBtn);
  const heartBtn = chip("♡", "sp-heart");
  heartBtn.title = t("layout.slot.collect");
  heartBtn.setAttribute("aria-label", t("layout.slot.collect"));
  playRow.appendChild(heartBtn);
  const exportBtn = chip(t("layout.media.download"), "app-chip");
  exportBtn.onclick = () => {
    const url = pres.audioUrl || pres.videoUrl;
    if (!url) {
      flashLayoutNote(t("layout.media.downloadEmpty"));
      return;
    }
    void downloadOneMedia(url, pres.title || "track", opts.apijsonBase);
  };
  playRow.appendChild(exportBtn);
  const commentEntry = el("button", "sp-comment-entry app-chip");
  commentEntry.type = "button";
  const commentEntryLabel = el("span", "sp-comment-entry-label", t("layout.comments"));
  const commentCountEl = el("span", "sp-comment-entry-n", "0");
  commentEntry.append(commentEntryLabel, commentCountEl);
  commentEntry.title = t("layout.comments");
  commentEntry.setAttribute("aria-label", t("layout.comments"));
  playRow.appendChild(commentEntry);
  info.appendChild(playRow);
  hero.appendChild(info);

  const main = el("div", "sp-main");
  main.appendChild(hero);

  const split = el("div", "sp-split");
  const queue = el("div", "sp-queue");
  const head = el("div", "sp-q-head");
  head.appendChild(el("span", "", "#"));
  head.appendChild(el("span", "", t("layout.queue")));
  head.appendChild(el("span", "", t("layout.music")));
  head.appendChild(el("span", "", ""));
  queue.appendChild(head);

  const tracks = [
    { pres, id: pres.id ?? "", current: true, cells: opts.row?.cells },
    ...related.map((r) => ({
      pres: r.pres,
      id: r.id,
      current: false,
      cells: r.row?.cells,
    })),
  ];
  let trackIndex = 0;
  const audio = el("audio", "sp-audio-hidden");
  audio.preload = "metadata";
  const src = pres.audioUrl || pres.videoUrl;
  if (src) audio.src = mediaSrc(src, opts.apijsonBase);

  const barTitle = el("div", "sp-bar-title", pres.title);
  const barArtist = el("div", "sp-bar-artist", pres.author);
  const lyricTitle = el("div", "sp-lyric-title", pres.title);
  const lyricArtist = el("div", "sp-lyric-sub", [pres.author, pres.album].filter(Boolean).join(" · "));
  const lyricLines = el("div", "sp-lyric-lines");
  const lyricHint = el("button", "sp-lyric-hint", t("layout.lyrics"));
  lyricHint.type = "button";
  const lyricFsBtn = el("button", "sp-icon sp-lyric-fs-btn", "词");
  lyricFsBtn.type = "button";
  lyricFsBtn.title = t("layout.lyricsFullscreen");
  lyricFsBtn.setAttribute("aria-label", t("layout.lyricsFullscreen"));

  const paintLyricLines = (
    p: RowPresentation,
    cells?: Record<string, unknown>,
  ) => {
    const parsed = parseLyricLines(lyricRawFrom(p, cells));
    lyricLines.replaceChildren();
    if (!parsed.length) {
      lyricLines.appendChild(
        el("div", "sp-lyric-line is-empty", t("layout.lyricsEmpty")),
      );
      return;
    }
    for (const line of parsed) {
      const node = el("div", "sp-lyric-line", line.text);
      node.dataset.t = String(line.t);
      lyricLines.appendChild(node);
    }
  };

  const highlightLyrics = () => {
    const nodes = Array.from(lyricLines.querySelectorAll(".sp-lyric-line"));
    const usable = nodes.filter((n) => !n.classList.contains("is-empty"));
    if (!usable.length) return;
    const now = audio.currentTime || 0;
    const times = usable.map((n) => Number((n as HTMLElement).dataset.t ?? -1));
    const timed = times.some((t) => t >= 0);
    let i = 0;
    if (timed) {
      i = 0;
      for (let j = 0; j < times.length; j++) {
        if (times[j]! >= 0 && times[j]! <= now) i = j;
      }
    } else {
      const dur =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : tracks[trackIndex]?.pres.durationSec ?? 0;
      i =
        dur > 0
          ? Math.min(
              usable.length - 1,
              Math.floor((now / dur) * usable.length),
            )
          : 0;
    }
    usable.forEach((n, j) => n.classList.toggle("is-current", j === i));
    if (page.classList.contains("is-lyrics-fs")) {
      usable[i]?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };
  paintLyricLines(pres, opts.row?.cells);
  const timeCur = el("span", "sp-time", "0:00");
  const timeTot = el("span", "sp-time", formatDuration(pres.durationSec) || "0:00");
  const seek = document.createElement("input");
  seek.type = "range";
  seek.min = "0";
  seek.max = "1000";
  seek.value = "0";
  seek.className = "sp-seek";
  const prev = el("button", "sp-icon", "⏮");
  const midPlay = el("button", "sp-icon sp-icon-play", "▶");
  const next = el("button", "sp-icon", "⏭");
  prev.type = "button";
  midPlay.type = "button";
  next.type = "button";

  const markCurrent = (index: number) => {
    trackIndex = index;
    const rows = Array.from(queue.querySelectorAll(".sp-q-row"));
    rows.forEach((elRow, i) => {
      elRow.classList.toggle("is-current", i === index);
    });
  };

  const setPlayingUi = (playing: boolean) => {
    playBtn.textContent = playing ? "❚❚" : "▶";
    midPlay.textContent = playing ? "❚❚" : "▶";
  };

  const setTrack = (p: RowPresentation, index: number, autoplay: boolean) => {
    const next = p.audioUrl || p.videoUrl;
    if (next) audio.src = mediaSrc(next, opts.apijsonBase);
    barTitle.textContent = p.title;
    barArtist.textContent = p.author;
    lyricTitle.textContent = p.title;
    lyricArtist.textContent = [p.author, p.album].filter(Boolean).join(" · ");
    timeTot.textContent = formatDuration(p.durationSec) || "0:00";
    seek.value = "0";
    timeCur.textContent = "0:00";
    markCurrent(index);
    paintLyricLines(p, tracks[index]?.cells);
    highlightLyrics();
    if (autoplay) void audio.play().catch(() => undefined);
  };

  playBtn.onclick = () => {
    if (audio.paused) void audio.play().catch(() => undefined);
    else audio.pause();
  };
  audio.onplay = () => setPlayingUi(true);
  audio.onpause = () => setPlayingUi(false);
  bindSeekBar({
    media: audio,
    seek,
    currentEl: timeCur,
    totalEl: timeTot,
    durationHint: pres.durationSec,
  });
  audio.addEventListener("timeupdate", highlightLyrics);
  audio.addEventListener("seeked", highlightLyrics);
  audio.onended = () => {
    const next = (trackIndex + 1) % tracks.length;
    const item = tracks[next];
    if (item) setTrack(item.pres, next, true);
  };
  const skip = (delta: number) => {
    if (!tracks.length) return;
    const nextIndex = (trackIndex + delta + tracks.length) % tracks.length;
    const item = tracks[nextIndex];
    if (item) setTrack(item.pres, nextIndex, true);
  };
  prev.onclick = () => skip(-1);
  next.onclick = () => skip(1);
  midPlay.onclick = () => playBtn.click();

  tracks.forEach((item, i) => {
    const row = el("button", "sp-q-row" + (item.current ? " is-current" : ""));
    row.type = "button";
    row.appendChild(el("span", "sp-q-num", String(i + 1)));
    const name = el("div", "sp-q-name");
    name.appendChild(el("div", "layout-title", item.pres.title));
    name.appendChild(el("div", "layout-meta", item.pres.author));
    row.appendChild(name);
    row.appendChild(el("span", "layout-meta", item.pres.album));
    row.appendChild(
      el("span", "sp-q-dur", formatDuration(item.pres.durationSec)),
    );
    row.onclick = () => setTrack(item.pres, i, true);
    queue.appendChild(row);
  });

  const lyrics = el("div", "sp-lyrics");
  const lyricClose = el("button", "sp-lyric-close", "✕");
  lyricClose.type = "button";
  lyricClose.title = t("layout.exitFullscreen");
  lyricClose.setAttribute("aria-label", t("layout.exitFullscreen"));
  lyrics.append(
    lyricClose,
    thumb(pres.coverUrl, opts.apijsonBase, "sp-lyric-art", ""),
    lyricTitle,
    lyricArtist,
    lyricLines,
    lyricHint,
  );
  split.append(queue, lyrics);
  main.appendChild(split);
  page.appendChild(main);

  let lyricsFs = false;
  const setLyricsFs = (on: boolean, skipBrowserFs = false) => {
    lyricsFs = on;
    page.classList.toggle("is-lyrics-fs", on);
    lyricHint.textContent = on ? t("layout.exitFullscreen") : t("layout.lyrics");
    lyricFsBtn.classList.toggle("is-on", on);
    lyricFsBtn.title = on
      ? t("layout.exitFullscreen")
      : t("layout.lyricsFullscreen");
    lyricFsBtn.setAttribute("aria-label", lyricFsBtn.title);
    if (skipBrowserFs) return;
    if (on) {
      void page.requestFullscreen?.().catch(() => undefined);
    } else if (document.fullscreenElement === page) {
      void document.exitFullscreen?.();
    }
  };
  const onFsChange = () => {
    if (document.fullscreenElement !== page && lyricsFs) {
      setLyricsFs(false, true);
    }
  };
  const onLyricKey = (ev: KeyboardEvent) => {
    if (ev.key === "Escape" && lyricsFs) {
      ev.preventDefault();
      setLyricsFs(false);
    }
  };
  document.addEventListener("fullscreenchange", onFsChange);
  document.addEventListener("keydown", onLyricKey);
  const lyricObs = new MutationObserver(() => {
    if (document.body.contains(page)) return;
    document.removeEventListener("fullscreenchange", onFsChange);
    document.removeEventListener("keydown", onLyricKey);
    lyricObs.disconnect();
    if (document.fullscreenElement === page) void document.exitFullscreen?.();
  });
  lyricObs.observe(document.body, { childList: true, subtree: true });

  lyricHint.onclick = (ev) => {
    ev.stopPropagation();
    setLyricsFs(!lyricsFs);
  };
  lyricClose.onclick = (ev) => {
    ev.stopPropagation();
    setLyricsFs(false);
  };
  lyrics.onclick = () => {
    if (!lyricsFs) setLyricsFs(true);
  };

  const bar = el("div", "sp-bar");
  const barLeft = el("div", "sp-bar-left");
  barLeft.appendChild(
    thumb(pres.coverUrl, opts.apijsonBase, "sp-bar-art", ""),
  );
  const barTx = el("div");
  barTx.appendChild(barTitle);
  barTx.appendChild(barArtist);
  barLeft.appendChild(barTx);
  const barHeart = chip("♡", "sp-heart");
  barHeart.title = t("layout.slot.collect");
  barHeart.setAttribute("aria-label", t("layout.slot.collect"));
  barLeft.appendChild(barHeart);
  lyricFsBtn.onclick = () => setLyricsFs(!lyricsFs);
  const barMid = el("div", "sp-bar-mid");
  const ctrls = el("div", "sp-bar-ctrls");
  ctrls.append(prev, midPlay, next);
  const seekRow = el("div", "sp-seek-row");
  seekRow.append(timeCur, seek, timeTot);
  barMid.append(ctrls, seekRow);
  bar.append(barLeft, barMid, lyricFsBtn, audio);
  page.appendChild(bar);

  const commentsPane = el("div", "sp-comments");
  commentsPane.hidden = true;
  const commentsHead = el("div", "sp-comments-head");
  const commentsBack = el("button", "layout-btn sp-comments-back", t("common.back"));
  commentsBack.type = "button";
  commentsHead.append(
    commentsBack,
    el("h2", "sp-comments-title", t("layout.comments")),
  );
  commentsPane.appendChild(commentsHead);
  const commentHost = el("div", "sp-comments-body");
  commentsPane.appendChild(commentHost);
  page.insertBefore(commentsPane, bar);

  const chrome = makeCommentChrome(commentHost, opts, {
    recordId: opts.recordId ?? pres.id,
  });
  page.classList.add("has-sp-bar");

  const setCommentsOpen = (open: boolean) => {
    page.classList.toggle("is-comments", open);
    commentsPane.hidden = !open;
    if (open) {
      chrome.section.scrollIntoView({ behavior: "smooth", block: "start" });
      chrome.focus();
    }
  };
  commentEntry.onclick = () => setCommentsOpen(true);
  commentsBack.onclick = () => setCommentsOpen(false);

  const paintCommentCount = (n: number) => {
    commentCountEl.textContent = formatCount(n) || "0";
    commentEntry.setAttribute(
      "aria-label",
      `${t("layout.comments")} ${commentCountEl.textContent}`,
    );
  };
  const recordId = opts.recordId ?? pres.id;
  const spec = resolveCommentQuery(opts.primaryTable ?? null, opts.comments);
  if (spec && recordId != null) {
    void fetchRecordComments({
      base: opts.apijsonBase,
      spec,
      recordId,
      count: 100,
    }).then((items) => {
      paintCommentCount(flattenComments(items).length);
    });
  }

  app.appendChild(page);
  mountSocialActions({
    pres,
    cells: opts.row?.cells,
    table: opts.primaryTable ?? null,
    recordId: opts.recordId ?? pres.id,
    apijsonBase: opts.apijsonBase,
    handlers: opts.handlers,
    collectBtn: heartBtn,
    collectBtns: [barHeart],
    followBtns: [],
    authorNodes: [],
    ...commentActionFields(chrome, () => opts.handlers.onBuyNow?.()),
    commentCountEl,
    onCommentsLoaded: (items) => {
      paintCommentCount(flattenComments(items).length);
    },
  });
}

function renderAmazonPdp(
  app: HTMLElement,
  pres: RowPresentation,
  related: Array<{ pres: RowPresentation; id: string | number }>,
  opts: {
    kind?: LayoutKind;
    spec?: LayoutSpec;
    apijsonBase: string;
    handlers: LayoutDetailHandlers;
    row?: FlatRow;
    columns?: string[];
    comments?: SchemaComments | null;
    columnMetas?: Record<string, ColumnMeta> | null;
    primaryTable?: string | null;
    recordId?: string | number | null;
  },
) {
  const page = el("div", "az-pdp");
  const top = el("div", "az-top");
  const gallery = el("div", "az-gallery");
  const rawUrls = (() => {
    if (!opts.row) {
      return pres.coverUrl ? [pres.coverUrl] : [];
    }
    const found = collectRowImageUrls(
      opts.row.cells,
      opts.primaryTable ?? null,
      opts.columns ?? Object.keys(opts.row.cells),
      opts.comments,
      showMap(opts.columnMetas),
    );
    if (found.length) return found;
    return pres.coverUrl ? [pres.coverUrl] : [];
  })();
  let current = 0;
  const main = thumb(
    rawUrls[0] ?? null,
    opts.apijsonBase,
    "az-main-img",
    t("result.noImage"),
  );
  main.setAttribute("role", "button");
  main.tabIndex = rawUrls.length ? 0 : -1;
  main.title = t("layout.previewImage");
  const showAt = (i: number) => {
    if (!rawUrls[i]) return;
    current = i;
    main.classList.remove("is-empty");
    let img = main.querySelector("img");
    if (!img) {
      main.textContent = "";
      img = el("img");
      img.alt = "";
      img.referrerPolicy = "no-referrer";
      main.appendChild(img);
    }
    img.src = mediaSrc(rawUrls[i]!, opts.apijsonBase);
    thumbs.querySelectorAll(".az-thumb").forEach((node, j) => {
      node.classList.toggle("is-active", j === i);
    });
  };
  const openPreview = () => {
    if (!rawUrls.length) return;
    openImageLightbox(
      () => rawUrls.map((u) => mediaSrc(u, opts.apijsonBase)),
      current,
    );
  };
  main.onclick = () => openPreview();
  main.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      openPreview();
    }
  });
  const thumbs = el("div", "az-thumbs");
  for (let i = 0; i < rawUrls.length; i++) {
    const shot = thumb(rawUrls[i]!, opts.apijsonBase, "az-thumb", "");
    if (i === 0) shot.classList.add("is-active");
    shot.setAttribute("role", "button");
    shot.tabIndex = 0;
    shot.onclick = (ev) => {
      ev.stopPropagation();
      showAt(i);
    };
    shot.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        showAt(i);
      }
    });
    thumbs.appendChild(shot);
  }
  gallery.append(main, thumbs);
  top.appendChild(gallery);

  const info = el("div", "az-info");
  info.appendChild(el("h1", "az-title", pres.title));
  if (pres.author) {
    info.appendChild(el("div", "az-by", `${t("layout.authorCard")}: ${pres.author}`));
  }
  const starEl = el("div", "az-stars", t("layout.reviews"));
  info.appendChild(starEl);
  const price = formatPrice(pres.price);
  if (price) info.appendChild(el("div", "az-price", price));
  const stockN = Number(pres.stock);
  info.appendChild(
    el(
      "div",
      Number.isFinite(stockN) && stockN <= 0 ? "az-oos" : "az-stock",
      Number.isFinite(stockN) && stockN <= 0
        ? t("layout.outOfStock")
        : `${t("layout.inStock")}${pres.stock ? ` · ${pres.stock}` : ""}`,
    ),
  );
  if (pres.sales != null) {
    info.appendChild(
      el("div", "layout-meta", `${formatCount(pres.sales)} ${t("layout.sold")}`),
    );
  }
  if (pres.body) info.appendChild(el("div", "az-blurb", pres.body));
  top.appendChild(info);

  const buy = el("div", "az-buybox");
  buy.appendChild(el("div", "az-buy-label", t("layout.buyBox")));
  if (price) buy.appendChild(el("div", "az-price", price));
  const qty = el("div", "az-qty");
  qty.appendChild(el("span", "", t("layout.qty")));
  const qtyIn = document.createElement("select");
  qtyIn.className = "az-qty-sel";
  for (let i = 1; i <= 5; i++) {
    const o = document.createElement("option");
    o.value = String(i);
    o.textContent = String(i);
    qtyIn.appendChild(o);
  }
  qty.appendChild(qtyIn);
  buy.appendChild(qty);
  const add = el("button", "az-btn az-btn-cart", t("layout.addToCart"));
  add.type = "button";
  add.onclick = () => opts.handlers.onAddToCart?.();
  const buyNow = el("button", "az-btn az-btn-buy", t("layout.buyNow"));
  buyNow.type = "button";
  buyNow.onclick = () => opts.handlers.onBuyNow?.();
  buy.append(add, buyNow);
  top.appendChild(buy);
  page.appendChild(top);

  const tabs = el("div", "az-tabs");
  tabs.appendChild(el("h3", "az-h", t("layout.description")));
  tabs.appendChild(el("div", "az-tab-body", pres.body || pres.headline || pres.title));
  if (related.length) {
    tabs.appendChild(el("h3", "az-h", t("layout.moreFrom")));
    const rec = el("div", "az-recs");
    for (const item of related.slice(0, 6)) {
      const c = el("button", "az-rec");
      c.type = "button";
      c.onclick = () => openRelated(opts.handlers, item.id);
      c.appendChild(
        thumb(item.pres.coverUrl, opts.apijsonBase, "az-rec-img", ""),
      );
      c.appendChild(el("div", "layout-title", item.pres.title));
      const p = formatPrice(item.pres.price);
      if (p) c.appendChild(el("div", "layout-price", p));
      rec.appendChild(c);
    }
    tabs.appendChild(rec);
  }
  page.appendChild(tabs);
  const chrome = makeCommentChrome(page, opts, {
    price: pres.price,
    hasBuy: true,
    recordId: opts.recordId ?? pres.id,
  });
  app.appendChild(page);
  mountSocialActions({
    pres,
    cells: opts.row?.cells,
    table: opts.primaryTable ?? null,
    recordId: opts.recordId ?? pres.id,
    apijsonBase: opts.apijsonBase,
    handlers: opts.handlers,
    followBtns: [],
    authorNodes: [],
    ...commentActionFields(chrome, () => opts.handlers.onBuyNow?.()),
    ratingSummaryEl: starEl,
  });
}

function renderWechatThread(
  app: HTMLElement,
  pres: RowPresentation,
  related: Array<{ pres: RowPresentation; id: string | number }>,
  opts: {
    apijsonBase: string;
    handlers: LayoutDetailHandlers;
    primaryTable?: string | null;
    recordId?: string | number | null;
    row?: FlatRow;
  },
) {
  const page = el("div", "wx-page");
  const head = el("div", "wx-head");
  const headTitle = el("div", "wx-head-title", pres.author || pres.title);
  if (pres.authorId != null) {
    headTitle.classList.add("author-link");
    headTitle.setAttribute("role", "button");
    headTitle.onclick = () => opts.handlers.onOpenAuthor?.(pres.authorId!);
  }
  head.appendChild(headTitle);
  const headTools = el("div", "wx-head-tools");
  const voiceHead = el("button", "wx-head-btn", "📞");
  voiceHead.type = "button";
  voiceHead.title = t("layout.im.voiceCall");
  const videoHead = el("button", "wx-head-btn", "📹");
  videoHead.type = "button";
  videoHead.title = t("layout.im.videoCall");
  headTools.append(voiceHead, videoHead);
  head.appendChild(headTools);
  page.appendChild(head);
  const thread = el("div", "wx-thread");
  const msgs = [
    { pres, mine: false },
    ...related.slice(0, 16).map((r, i) => ({ pres: r.pres, mine: i % 2 === 0 })),
  ];
  const pushBubble = (
    text: string,
    mine: boolean,
    meta?: { author?: string; date?: string; cover?: string | null; personId?: string | number | null },
  ) => {
    const row = el("div", "wx-row" + (mine ? " is-mine" : ""));
    const personId = meta?.personId ?? (mine ? visitorId() : null);
    const av = thumb(meta?.cover ?? pres.coverUrl, opts.apijsonBase, "wx-av", "");
    if (personId != null) {
      av.classList.add("author-link");
      av.setAttribute("role", "button");
      av.onclick = () => opts.handlers.onOpenAuthor?.(personId);
    }
    row.appendChild(av);
    const bubble = el("div", "wx-bubble");
    if (meta?.author) bubble.appendChild(el("div", "wx-name", meta.author));
    fillChatBubble(bubble, text, opts.apijsonBase);
    if (meta?.date) bubble.appendChild(el("div", "wx-time", meta.date));
    row.appendChild(bubble);
    thread.appendChild(row);
    thread.scrollTop = thread.scrollHeight;
  };
  for (const m of msgs) {
    pushBubble(m.pres.body || m.pres.title, m.mine, {
      author: m.pres.author,
      date: m.pres.date,
      cover: m.pres.coverUrl,
      personId: m.mine ? visitorId() : m.pres.authorId,
    });
  }
  page.appendChild(thread);
  const composer = mountChatComposer({
    apijsonBase: opts.apijsonBase,
    onNote: (msg) => flashLayoutNote(msg),
    onSend: async (text) => {
      const result = await runActionSlot(opts.handlers, "message", {
        record: { ...(opts.row?.cells ?? {}), id: opts.recordId ?? pres.id },
        visitorId: visitorId(),
        authorId: pres.authorId,
        input: text,
      });
      if (!result.ok) return false;
      pushBubble(text, true, { cover: pres.coverUrl, personId: visitorId() });
      flashLayoutNote(t("layout.messageSent"));
      return true;
    },
  });
  page.appendChild(composer);
  const clickTool = (id: string) => {
    composer.querySelector<HTMLButtonElement>(`[data-chat-tool="${id}"]`)?.click();
  };
  voiceHead.onclick = () => clickTool("voiceCall");
  videoHead.onclick = () => clickTool("videoCall");
  app.appendChild(page);
}

function renderMomentDetail(
  app: HTMLElement,
  pres: RowPresentation,
  opts: {
    kind?: LayoutKind;
    spec?: LayoutSpec;
    comments?: SchemaComments | null;
    columnMetas?: Record<string, ColumnMeta> | null;
    columns?: string[];
    apijsonBase: string;
    handlers: LayoutDetailHandlers;
    primaryTable?: string | null;
    recordId?: string | number | null;
    row?: FlatRow;
  },
) {
  const page = el("div", "moment-detail");
  const head = el("div", "layout-feed-head");
  const avatar = thumb(pres.coverUrl, opts.apijsonBase, "layout-avatar", "");
  head.appendChild(avatar);
  const who = el("div", "layout-feed-who");
  const authorName = el(
    "div",
    "layout-title",
    pres.author || pres.title || (pres.id != null ? `#${pres.id}` : ""),
  );
  who.appendChild(authorName);
  if (pres.date) who.appendChild(el("div", "layout-meta", pres.date));
  head.appendChild(who);
  page.appendChild(head);
  const text = pres.body || (pres.author ? pres.title : "");
  if (text) page.appendChild(el("div", "layout-feed-text", text));
  const photos = opts.row
    ? mountFeedPhotos(opts.row.cells, {
        primaryTable: opts.primaryTable ?? null,
        columns: opts.columns ?? Object.keys(opts.row.cells),
        comments: opts.comments,
        columnMetas: opts.columnMetas,
        apijsonBase: opts.apijsonBase,
      })
    : null;
  if (photos) page.appendChild(photos);
  app.appendChild(page);
  const chrome = makeCommentChrome(app, opts, {
    recordId: opts.recordId ?? pres.id,
  });
  mountSocialActions({
    pres,
    cells: opts.row?.cells,
    table: opts.primaryTable ?? null,
    recordId: opts.recordId ?? pres.id,
    apijsonBase: opts.apijsonBase,
    handlers: opts.handlers,
    followBtns: [],
    authorNodes: [avatar, authorName],
    ...commentActionFields(chrome, () => opts.handlers.onBuyNow?.()),
  });
}

function renderTikTokStage(
  app: HTMLElement,
  pres: RowPresentation,
  opts: {
    kind?: LayoutKind;
    spec?: LayoutSpec;
    comments?: SchemaComments | null;
    apijsonBase: string;
    handlers: LayoutDetailHandlers;
    primaryTable?: string | null;
    recordId?: string | number | null;
    row?: FlatRow;
  },
) {
  const stage = el("div", "tt-stage");
  const video = pres.videoUrl ? el("video", "tt-video") : null;
  if (video) {
    video.controls = false;
    video.playsInline = true;
    video.preload = "metadata";
    video.loop = true;
    video.muted = true;
    video.src = mediaSrc(pres.videoUrl!, opts.apijsonBase);
    if (pres.coverUrl) video.poster = mediaSrc(pres.coverUrl, opts.apijsonBase);
    stage.appendChild(video);
    mountVideoChrome({
      shell: stage,
      media: video,
      variant: "tiktok",
      durationHint: pres.durationSec,
      qualities: pres.qualities,
      subtitles: pres.subtitles,
      apijsonBase: opts.apijsonBase,
    });
    void video.play().catch(() => undefined);
  } else {
    stage.appendChild(
      thumb(pres.coverUrl, opts.apijsonBase, "tt-photo", t("layout.noMedia")),
    );
  }
  const overlay = el("div", "tt-overlay");
  overlay.appendChild(el("div", "tt-user", `@${pres.author || "user"}`));
  overlay.appendChild(el("div", "tt-caption", pres.body || pres.title));
  if (pres.date) overlay.appendChild(el("div", "tt-time", pres.date));
  stage.appendChild(overlay);
  const rail = el("div", "tt-rail");
  const avatar = thumb(pres.coverUrl, opts.apijsonBase, "tt-av", "");
  rail.appendChild(avatar);
  const mk = (icon: string, n: string) => {
    const b = el("div", "tt-act");
    b.appendChild(el("div", "tt-act-icon", icon));
    const count = el("div", "tt-act-n", n);
    b.appendChild(count);
    return { btn: b, count };
  };
  const likeAct = mk("♥", formatCount(pres.praiseIds.length) || "—");
  const commentAct = mk("💬", "—");
  const saveAct = mk("★", formatCount(pres.collectIds.length) || "—");
  const shareAct = mk("↗", t("layout.share"));
  rail.append(likeAct.btn, commentAct.btn, saveAct.btn, shareAct.btn);
  rail.addEventListener("click", (ev) => ev.stopPropagation());
  stage.appendChild(rail);
  app.appendChild(stage);
  const chrome = makeCommentChrome(app, opts, {
    recordId: opts.recordId ?? pres.id,
  });
  commentAct.btn.onclick = () => {
    chrome.section.scrollIntoView({ behavior: "smooth", block: "start" });
    chrome.focus();
  };
  mountSocialActions({
    pres,
    cells: opts.row?.cells,
    table: opts.primaryTable ?? null,
    recordId: opts.recordId ?? pres.id,
    apijsonBase: opts.apijsonBase,
    handlers: opts.handlers,
    likeBtn: likeAct.btn,
    collectBtn: saveAct.btn,
    shareBtn: shareAct.btn,
    followBtns: [avatar],
    authorNodes: [avatar],
    ...commentActionFields(chrome, () => opts.handlers.onBuyNow?.()),
    likeCountEl: likeAct.count,
    collectCountEl: saveAct.count,
    commentCountEl: commentAct.count,
  });
}

function renderNewsArticle(
  app: HTMLElement,
  pres: RowPresentation,
  related: Array<{ pres: RowPresentation; id: string | number }>,
  opts: {
    kind?: LayoutKind;
    spec?: LayoutSpec;
    comments?: SchemaComments | null;
    apijsonBase: string;
    handlers: LayoutDetailHandlers;
    primaryTable?: string | null;
    recordId?: string | number | null;
    row?: FlatRow;
  },
) {
  const page = el("div", "news-read");
  const main = el("div", "news-read-main");
  const heads = el("div", "news-heads");
  heads.appendChild(el("h1", "news-h1", pres.title));
  if (related[0]) {
    const sub = el("button", "news-subhead");
    sub.type = "button";
    sub.textContent = related[0].pres.title;
    sub.onclick = () => openRelated(opts.handlers, related[0]!.id);
    heads.appendChild(sub);
  }
  main.appendChild(heads);
  main.appendChild(
    el(
      "div",
      "news-byline",
      [pres.source, pres.author, pres.date, pres.playCount != null ? `${formatCount(pres.playCount)} ${t("layout.reads")}` : ""]
        .filter(Boolean)
        .join("  ·  "),
    ),
  );
  if (pres.coverUrl) {
    main.appendChild(
      thumb(pres.coverUrl, opts.apijsonBase, "news-cover", ""),
    );
  }
  const body = el("div", "news-body");
  fillRichBody(body, pres.body || pres.headline || "");
  main.appendChild(body);
  const chrome = makeCommentChrome(main, opts, {
    recordId: opts.recordId ?? pres.id,
  });
  page.appendChild(main);

  const side = el("div", "news-side");
  side.appendChild(el("h3", "news-side-h", t("layout.relatedNews")));
  for (const item of related.slice(0, 8)) {
    const a = el("button", "news-side-item");
    a.type = "button";
    a.onclick = () => openRelated(opts.handlers, item.id);
    a.appendChild(
      thumb(item.pres.coverUrl, opts.apijsonBase, "news-side-img", ""),
    );
    const tx = el("div");
    tx.appendChild(el("div", "layout-title", item.pres.title));
    tx.appendChild(el("div", "layout-meta", item.pres.date));
    a.appendChild(tx);
    side.appendChild(a);
  }
  page.appendChild(side);
  app.appendChild(page);
  mountSocialActions({
    pres,
    cells: opts.row?.cells,
    table: opts.primaryTable ?? null,
    recordId: opts.recordId ?? pres.id,
    apijsonBase: opts.apijsonBase,
    handlers: opts.handlers,
    followBtns: [],
    authorNodes: [],
    ...commentActionFields(chrome, () => opts.handlers.onBuyNow?.()),
  });
}

function renderJuejinArticle(
  app: HTMLElement,
  pres: RowPresentation,
  related: Array<{ pres: RowPresentation; id: string | number }>,
  opts: {
    kind?: LayoutKind;
    spec?: LayoutSpec;
    comments?: SchemaComments | null;
    apijsonBase: string;
    handlers: LayoutDetailHandlers;
    primaryTable?: string | null;
    recordId?: string | number | null;
    row?: FlatRow;
  },
) {
  const page = el("div", "jj-page");
  const rail = el("div", "jj-rail");
  const mk = (icon: string, n: string) => {
    const b = el("button", "jj-act");
    b.type = "button";
    b.appendChild(el("span", "jj-act-icon", icon));
    const count = el("span", "", n);
    b.appendChild(count);
    return { btn: b, count };
  };
  const likeAct = mk("👍", formatCount(pres.praiseIds.length) || "0");
  const commentAct = mk("💬", "0");
  const starAct = mk("⭐", formatCount(pres.collectIds.length) || "0");
  const shareAct = mk("↗", formatCount(pres.shareCount) || "");
  rail.append(likeAct.btn, commentAct.btn, starAct.btn, shareAct.btn);
  page.appendChild(rail);

  const article = el("article", "jj-article");
  article.appendChild(el("h1", "jj-h1", pres.title));
  const meta = el("div", "jj-meta");
  const avatar = thumb(pres.coverUrl, opts.apijsonBase, "jj-av", "");
  meta.appendChild(avatar);
  const who = el("div");
  const authorName = el("div", "jj-author", pres.author || t("layout.authorCard"));
  who.appendChild(authorName);
  who.appendChild(
    el(
      "div",
      "layout-meta",
      [pres.date, pres.playCount != null ? `${formatCount(pres.playCount)} ${t("layout.reads")}` : ""]
        .filter(Boolean)
        .join(" · "),
    ),
  );
  meta.appendChild(who);
  const followTop = chip(t("layout.follow"), "jj-follow");
  meta.appendChild(followTop);
  article.appendChild(meta);
  if (pres.coverUrl) {
    article.appendChild(
      thumb(pres.coverUrl, opts.apijsonBase, "jj-cover", ""),
    );
  }
  const body = el("div", "jj-body");
  fillRichBody(body, pres.body || pres.headline || "");
  article.appendChild(body);
  const chrome = makeCommentChrome(article, opts, {
    recordId: opts.recordId ?? pres.id,
  });
  page.appendChild(article);

  const side = el("div", "jj-side");
  const author = el("div", "jj-card");
  const ah = el("div", "jj-card-head");
  const sideAv = thumb(pres.coverUrl, opts.apijsonBase, "jj-av-lg", "");
  ah.appendChild(sideAv);
  const at = el("div");
  const sideName = el("div", "layout-title", pres.author || t("layout.authorCard"));
  at.appendChild(sideName);
  at.appendChild(el("div", "layout-meta", kicker("blog")));
  ah.appendChild(at);
  author.appendChild(ah);
  const stats = el("div", "jj-stats");
  const stat = (label: string, value: string) => {
    const d = el("div", "jj-stat");
    d.appendChild(el("div", "jj-stat-n", value));
    d.appendChild(el("div", "jj-stat-l", label));
    return d;
  };
  stats.appendChild(stat(t("layout.articles"), String(related.length + 1)));
  stats.appendChild(stat(t("layout.reads"), formatCount(pres.playCount) || "—"));
  stats.appendChild(stat(t("layout.fans"), "—"));
  author.appendChild(stats);
  const follow = chip(t("layout.follow"), "jj-follow");
  const msg = chip(t("layout.message"), "app-chip");
  const btns = el("div", "jj-card-btns");
  btns.append(follow, msg);
  author.appendChild(btns);
  side.appendChild(author);

  const toc = tocFromBody(pres.body);
  if (toc.length) {
    const tocCard = el("div", "jj-card");
    tocCard.appendChild(el("h3", "jj-card-h", t("layout.toc")));
    for (const h of toc) tocCard.appendChild(el("div", "jj-toc-item", h));
    side.appendChild(tocCard);
  }
  if (related.length) {
    const rec = el("div", "jj-card");
    rec.appendChild(el("h3", "jj-card-h", t("layout.moreFrom")));
    for (const item of related.slice(0, 5)) {
      const a = el("button", "jj-more");
      a.type = "button";
      a.textContent = item.pres.title;
      a.onclick = () => openRelated(opts.handlers, item.id);
      rec.appendChild(a);
    }
    side.appendChild(rec);
  }
  page.appendChild(side);
  app.appendChild(page);
  commentAct.btn.onclick = () => {
    chrome.section.scrollIntoView({ behavior: "smooth", block: "start" });
    chrome.focus();
  };
  mountSocialActions({
    pres,
    cells: opts.row?.cells,
    table: opts.primaryTable ?? null,
    recordId: opts.recordId ?? pres.id,
    apijsonBase: opts.apijsonBase,
    handlers: opts.handlers,
    likeBtn: likeAct.btn,
    collectBtn: starAct.btn,
    shareBtn: shareAct.btn,
    followBtns: [followTop, follow],
    messageBtns: [msg],
    authorNodes: [avatar, authorName, sideAv, sideName],
    ...commentActionFields(chrome, () => opts.handlers.onBuyNow?.()),
    likeCountEl: likeAct.count,
    collectCountEl: starAct.count,
    commentCountEl: commentAct.count,
  });
}

function renderCampaignLanding(
  app: HTMLElement,
  pres: RowPresentation,
  opts: {
    kind?: LayoutKind;
    spec?: LayoutSpec;
    comments?: SchemaComments | null;
    apijsonBase: string;
    handlers?: LayoutDetailHandlers;
    primaryTable?: string | null;
    recordId?: string | number | null;
    row?: FlatRow;
  },
) {
  const page = el("div", "camp-page");
  page.appendChild(
    thumb(pres.coverUrl, opts.apijsonBase, "camp-banner", t("result.noImage")),
  );
  const body = el("div", "camp-body");
  body.appendChild(el("div", "layout-kicker", t("layout.campaign")));
  body.appendChild(el("h1", "camp-h1", pres.title));
  body.appendChild(
    el("div", "camp-dates", [pres.date, pres.status].filter(Boolean).join("  →  ")),
  );
  if (pres.body) {
    const box = el("div", "camp-copy");
    fillRichBody(box, pres.body);
    body.appendChild(box);
  }
  const purchasable = reviewRequiresPurchase({
    app: detailApp(opts),
    price: pres.price,
    hasBuy: isPurchasableApp(detailApp(opts)),
  });
  const cta = el(
    "button",
    "camp-cta",
    purchasable ? t("layout.buyNow") : t("layout.signup"),
  );
  cta.type = "button";
  cta.onclick = () => opts.handlers?.onBuyNow?.();
  body.appendChild(cta);
  page.appendChild(body);
  const chrome = makeCommentChrome(page, opts, {
    price: pres.price,
    hasBuy: isPurchasableApp(detailApp(opts)),
    recordId: opts.recordId ?? pres.id,
  });
  app.appendChild(page);
  if (opts.handlers) {
    mountSocialActions({
      pres,
      cells: opts.row?.cells,
      table: opts.primaryTable ?? null,
      recordId: opts.recordId ?? pres.id,
      apijsonBase: opts.apijsonBase,
      handlers: opts.handlers,
      followBtns: [],
      authorNodes: [],
      ...commentActionFields(chrome, () => opts.handlers?.onBuyNow?.()),
    });
  }
}

function cartOptsFromList(opts: ListOpts) {
  return {
    rows: opts.rows,
    columns: opts.columns,
    table: opts.primaryTable,
    comments: opts.comments,
    metas: opts.columnMetas,
    apijsonBase: opts.apijsonBase,
    recordId: opts.recordId,
  };
}

function effectiveCartLines(opts: {
  rows: FlatRow[];
  columns: string[];
  table: string | null;
  comments?: SchemaComments | null;
  metas?: Record<string, ColumnMeta> | null;
  recordId: (row: FlatRow) => string | number | null;
}): CartLine[] {
  const stored = getCartLines();
  if (stored.length) return stored;
  const fromRows: CartLine[] = [];
  for (const row of opts.rows) {
    const id = opts.recordId(row);
    if (id == null) continue;
    const p = present(row, {
      table: opts.table,
      columns: opts.columns,
      comments: opts.comments,
      metas: opts.metas,
      recordId: id,
    });
    fromRows.push({
      table: opts.table || "Item",
      id,
      title: p.title || `#${id}`,
      price: p.price ?? 0,
      qty: 1,
      image: p.coverUrl,
    });
  }
  return fromRows;
}

function renderOrderList(opts: ListOpts): HTMLElement {
  const page = el("div", "ex-page az-orders");
  page.appendChild(el("h2", "ex-title", t("layout.page.orders")));
  if (!opts.rows.length) {
    page.appendChild(el("div", "result-empty", t("layout.orderEmpty")));
    return page;
  }
  const list = el("div", "az-order-list");
  for (const row of opts.rows) {
    const pres = present(row, {
      table: opts.primaryTable,
      columns: opts.columns,
      comments: opts.comments,
      metas: opts.columnMetas,
      recordId: opts.recordId(row),
    });
    const card = el("button", "az-order-card");
    card.type = "button";
    wireListRow(card, opts, row, () => {
      opts.handlers.onSelectPage?.("orderDetail");
      opts.handlers.onOpenRow(row.key);
    });
    const top = el("div", "az-order-top");
    top.appendChild(el("div", "layout-title", pres.title || `#${row.key}`));
    if (pres.status) top.appendChild(el("div", "az-order-status", pres.status));
    card.appendChild(top);
    if (pres.body) card.appendChild(el("div", "layout-meta", pres.body));
    const foot = el("div", "az-order-foot");
    if (pres.date) foot.appendChild(el("div", "layout-meta", pres.date));
    const price = formatPrice(pres.price);
    if (price) foot.appendChild(el("div", "layout-price", price));
    card.appendChild(foot);
    list.appendChild(card);
  }
  page.appendChild(list);
  return page;
}

function renderAddressList(opts: ListOpts): HTMLElement {
  const page = el("div", "ex-page az-addresses");
  const headBar = el("div", "az-addr-toolbar");
  headBar.appendChild(el("h2", "ex-title", t("layout.consigneeBook")));
  const add = el("button", "az-btn az-btn-buy", t("layout.addressAdd"));
  add.type = "button";
  add.onclick = () => {
    if (opts.handlers.onSelectLayoutSpec) {
      opts.handlers.onSelectLayoutSpec({
        app: listApp(opts),
        page: "addressDetail",
      });
    } else {
      opts.handlers.onSelectPage?.("addressDetail");
    }
  };
  headBar.appendChild(add);
  page.appendChild(headBar);

  if (isAddressPickMode() || isListSelectActive()) {
    page.appendChild(
      el(
        "div",
        "layout-meta",
        isAddressPickMode()
          ? t("layout.addressPickHint")
          : t("layout.listSelect.pickHint"),
      ),
    );
  }

  if (!opts.rows.length) {
    page.appendChild(el("div", "result-empty", t("layout.addressEmpty")));
    return page;
  }

  const list = el("div", "az-addr-list");
  for (const row of opts.rows) {
    const pres = present(row, {
      table: opts.primaryTable,
      columns: opts.columns,
      comments: opts.comments,
      metas: opts.columnMetas,
      recordId: opts.recordId(row),
    });
    const addr = checkoutAddressFromRow(
      row.cells,
      opts.primaryTable,
      opts.recordId(row),
    );
    const card = el("div", "az-addr-card");
    const main = el("button", "az-addr-main");
    main.type = "button";
    wireListRow(main, opts, row, () => {
      opts.handlers.onSelectPage?.("addressDetail");
      opts.handlers.onOpenRow(row.key);
    });
    const top = el("div", "az-addr-head");
    top.appendChild(
      el("div", "layout-title", addr.consignee || pres.title || `#${row.key}`),
    );
    if (addr.phone) top.appendChild(el("div", "layout-meta", addr.phone));
    if (addr.isDefault) {
      top.appendChild(el("span", "az-addr-default", t("layout.defaultAddress")));
    }
    if (addr.tag) top.appendChild(el("span", "az-addr-tag", addr.tag));
    main.appendChild(top);
    const line = formatAddressLine(addr);
    if (line) main.appendChild(el("div", "layout-meta", line));
    card.appendChild(main);

    const tools = el("div", "az-addr-tools");
    const edit = el("button", "layout-btn", t("common.edit"));
    edit.type = "button";
    edit.onclick = (ev) => {
      ev.stopPropagation();
      opts.handlers.onSelectPage?.("addressDetail");
      opts.handlers.onOpenRow(row.key);
    };
    tools.appendChild(edit);
    const del = el("button", "layout-btn layout-btn-danger", t("common.delete"));
    del.type = "button";
    del.onclick = (ev) => {
      ev.stopPropagation();
      const id = opts.recordId(row);
      const table = (opts.primaryTable || "Address").trim() || "Address";
      if (id == null || !opts.handlers.onWrite) return;
      if (!confirm(t("layout.compose.confirmDelete"))) return;
      void Promise.resolve(
        opts.handlers.onWrite({
          method: "delete",
          table,
          body: { [table]: { id }, tag: table },
        }),
      ).then((ok) => {
        if (ok === false) return;
        flashLayoutNote(t("layout.addressDeleted"));
        card.remove();
      });
    };
    tools.appendChild(del);
    if (isAddressPickMode()) {
      const use = el("button", "az-btn az-btn-buy", t("layout.addressUse"));
      use.type = "button";
      use.onclick = (ev) => {
        ev.stopPropagation();
        setCheckoutAddress(addr);
        clearAddressPick();
        opts.handlers.onOpenCheckout?.();
        opts.handlers.onSelectPage?.("order");
      };
      tools.appendChild(use);
    }
    card.appendChild(tools);
    list.appendChild(card);
  }
  page.appendChild(list);
  return page;
}

function renderOrderReceipt(opts: {
  row: FlatRow;
  columns: string[];
  primaryTable: string | null;
  comments?: SchemaComments | null;
  columnMetas?: Record<string, ColumnMeta> | null;
  recordId?: string | number | null;
}): HTMLElement {
  const pres = present(opts.row, {
    table: opts.primaryTable,
    columns: opts.columns,
    comments: opts.comments,
    metas: opts.columnMetas,
    recordId: opts.recordId,
  });
  const page = el("div", "ex-page az-order-detail");
  page.appendChild(el("h2", "ex-title", t("layout.page.orderDetail")));
  const card = el("div", "az-order-receipt");
  const id = pres.id ?? opts.recordId;
  if (id != null) card.appendChild(el("div", "layout-meta", `#${id}`));
  card.appendChild(el("div", "layout-title", pres.title || t("layout.page.orderDetail")));
  if (pres.status) card.appendChild(el("div", "az-order-status", pres.status));
  if (pres.phone) card.appendChild(el("div", "layout-meta", pres.phone));
  if (pres.body) card.appendChild(el("div", "layout-meta", pres.body));
  if (pres.date) card.appendChild(el("div", "layout-meta", pres.date));
  const price = formatPrice(pres.price);
  if (price) card.appendChild(el("div", "layout-price layout-price-lg", price));
  page.appendChild(card);
  return page;
}

function roleTag(party: ParsedShippingParty): string {
  if (party.role === "sender") return t("layout.shippingRole.sender");
  if (party.role === "courier") return t("layout.shippingRole.courier");
  if (party.role === "pickup") return t("layout.shippingRole.pickup");
  if (party.role === "consignee") return t("layout.shippingRole.consignee");
  return party.roleLabel || "";
}

function renderAddressEditor(opts: {
  mode: "create" | "edit";
  table: string | null;
  row?: FlatRow;
  columns?: string[];
  comments?: SchemaComments | null;
  columnMetas?: Record<string, ColumnMeta> | null;
  recordId?: string | number | null;
  knownAddresses?: CheckoutAddress[];
  onWrite?: (payload: WritePayload) => void | Promise<boolean | void>;
  onDone?: (toCheckout?: boolean) => void;
  onSelectPage?: (page: LayoutPage) => void;
}): HTMLElement {
  const table = (opts.table || "Address").trim() || "Address";
  const initial: CheckoutAddress = opts.row
    ? checkoutAddressFromRow(opts.row.cells, table, opts.recordId)
    : { consignee: "", phone: "", region: "", address: "" };
  const known = opts.knownAddresses?.length
    ? opts.knownAddresses
    : initial.consignee
      ? [initial]
      : [];

  const page = el("div", "ex-page az-addr-edit");
  page.appendChild(
    el(
      "h2",
      "ex-title",
      opts.mode === "create" ? t("layout.addressAdd") : t("layout.page.addressDetail"),
    ),
  );

  const form = el("div", "layout-order-form az-addr-form");

  const pasteLab = el("label", "layout-field az-addr-paste");
  pasteLab.appendChild(el("span", "", t("layout.addressPaste")));
  const paste = document.createElement("textarea");
  paste.className = "layout-input";
  paste.rows = 3;
  paste.placeholder = t("layout.addressPasteHint");
  pasteLab.appendChild(paste);
  const parseRow = el("div", "az-addr-parse-row");
  const parseBtn = el("button", "az-btn az-btn-buy", t("layout.addressParse"));
  parseBtn.type = "button";
  parseRow.appendChild(parseBtn);
  const partyHost = el("div", "az-addr-parties");
  parseRow.appendChild(partyHost);
  pasteLab.appendChild(parseRow);
  form.appendChild(pasteLab);

  const field = (
    key: string,
    label: string,
    value: string,
    multiline = false,
  ) => {
    const lab = el("label", "layout-field");
    lab.appendChild(el("span", "", label));
    const input = multiline
      ? document.createElement("textarea")
      : document.createElement("input");
    input.className = "layout-input";
    if (!multiline) (input as HTMLInputElement).type = "text";
    input.dataset.key = key;
    input.value = value;
    lab.appendChild(input);
    form.appendChild(lab);
    return input;
  };

  const name = field("consignee", t("layout.consignee"), initial.consignee);
  const phone = field("phone", t("layout.phone"), initial.phone);
  const region = field("region", t("layout.addressRegion"), initial.region);
  const address = field("address", t("layout.address"), initial.address, true);
  const tag = field("tag", t("layout.addressTag"), initial.tag || "");

  const applyParty = (party: ParsedShippingParty) => {
    if (party.consignee) (name as HTMLInputElement).value = party.consignee;
    if (party.phone) (phone as HTMLInputElement).value = party.phone;
    if (party.region) (region as HTMLInputElement).value = party.region;
    if (party.address) (address as HTMLTextAreaElement).value = party.address;
    const role = roleTag(party);
    if (role) (tag as HTMLInputElement).value = role;
  };

  const paintParties = (parties: ParsedShippingParty[]) => {
    partyHost.innerHTML = "";
    if (parties.length <= 1) return;
    for (const party of parties) {
      const label =
        roleTag(party) ||
        party.consignee ||
        party.phone ||
        t("layout.shippingRole.unknown");
      const btn = el(
        "button",
        "az-addr-party",
        `${label}${party.consignee ? ` · ${party.consignee}` : ""}`,
      );
      btn.type = "button";
      btn.onclick = () => applyParty(party);
      partyHost.appendChild(btn);
    }
  };

  parseBtn.onclick = () => {
    const parties = parseShippingText(paste.value);
    if (!parties.length) {
      flashLayoutNote(t("layout.addressParseEmpty"));
      return;
    }
    const preferred = preferConsigneeParty(parties)!;
    applyParty(preferred);
    paintParties(parties);
    flashLayoutNote(
      t("layout.addressParseOk", { n: String(parties.length) }),
    );
  };

  const defLab = el("label", "layout-field az-addr-default-row");
  const def = document.createElement("input");
  def.type = "checkbox";
  def.checked = !!initial.isDefault;
  defLab.append(def, document.createTextNode(` ${t("layout.defaultAddress")}`));
  form.appendChild(defLab);

  bindConsigneeSuggest(name as HTMLInputElement, {
    known,
    onPick: (addr) => {
      (name as HTMLInputElement).value = addr.consignee;
      if (addr.phone) (phone as HTMLInputElement).value = addr.phone;
      if (addr.region) (region as HTMLInputElement).value = addr.region;
      if (addr.address) (address as HTMLTextAreaElement).value = addr.address;
      if (addr.tag) (tag as HTMLInputElement).value = addr.tag;
    },
  });

  const addrWrap = address.parentElement;
  if (addrWrap) addrWrap.classList.add("az-addr-suggest-host");
  bindAddressSuggest(address, {
    regionInput: region,
    onPick: (place) => {
      if (place.region) region.value = place.region;
      address.value = place.address || place.label;
    },
  });

  const mapBtn = el("button", "layout-btn", t("layout.addressMapPick"));
  mapBtn.type = "button";
  mapBtn.onclick = () => {
    openMapAddressPicker({
      initialQuery:
        [region.value, address.value].filter(Boolean).join(" ") || address.value,
      onPick: (place) => {
        if (place.region) region.value = place.region;
        address.value = place.address || place.label;
      },
    });
  };
  form.appendChild(mapBtn);

  const save = el("button", "az-btn az-btn-buy", t("layout.compose.save"));
  save.type = "button";
  save.onclick = () => {
    const consignee = (name as HTMLInputElement).value.trim();
    const phoneVal = (phone as HTMLInputElement).value.trim();
    const regionVal = (region as HTMLInputElement).value.trim();
    const addressVal = (address as HTMLTextAreaElement).value.trim();
    if (!consignee || !phoneVal || !addressVal) {
      flashLayoutNote(t("layout.addressNeedFields"));
      return;
    }
    const fields: Record<string, unknown> = {
      consignee,
      phone: phoneVal,
      region: regionVal,
      address: addressVal,
      tag: (tag as HTMLInputElement).value.trim() || null,
      isDefault: def.checked ? 1 : 0,
    };
    const me = visitorId();
    if (opts.mode === "create" && me != null) fields.userId = me;

    const recordId = opts.recordId ?? initial.id;
    const method = opts.mode === "edit" && recordId != null ? "put" : "post";
    if (method === "put") fields.id = recordId;

    const done = (toCheckout: boolean) => {
      const picked: CheckoutAddress = {
        id: recordId,
        consignee,
        phone: phoneVal,
        region: regionVal,
        address: addressVal,
        tag: (tag as HTMLInputElement).value.trim() || undefined,
        isDefault: def.checked,
      };
      if (toCheckout) {
        setCheckoutAddress(picked);
        clearAddressPick();
      } else if (opts.mode === "create") {
        setCheckoutAddress(picked);
      }
      flashLayoutNote(
        opts.mode === "create"
          ? t("layout.addressSaved")
          : t("layout.compose.saved"),
      );
      opts.onDone?.(toCheckout);
    };

    const toCheckout = isAddressPickMode();
    if (!opts.onWrite) {
      done(toCheckout);
      return;
    }
    void Promise.resolve(
      opts.onWrite({
        method,
        table,
        body: { [table]: fields, tag: table },
      }),
    ).then((ok) => {
      if (ok === false) return;
      done(toCheckout);
    });
  };
  form.appendChild(save);

  if (opts.mode === "edit" && (opts.recordId ?? initial.id) != null) {
    const del = el("button", "layout-btn layout-btn-danger", t("common.delete"));
    del.type = "button";
    del.onclick = () => {
      const id = opts.recordId ?? initial.id;
      if (id == null || !opts.onWrite) return;
      if (!confirm(t("layout.compose.confirmDelete"))) return;
      void Promise.resolve(
        opts.onWrite({
          method: "delete",
          table,
          body: { [table]: { id }, tag: table },
        }),
      ).then((ok) => {
        if (ok === false) return;
        flashLayoutNote(t("layout.addressDeleted"));
        opts.onSelectPage?.("address");
        opts.onDone?.(false);
      });
    };
    form.appendChild(del);
  }

  const back = el("button", "layout-btn", t("common.back"));
  back.type = "button";
  back.onclick = () => opts.onSelectPage?.("address");
  form.appendChild(back);

  page.appendChild(form);
  return page;
}

function renderCartPanel(opts: {
  rows: FlatRow[];
  columns: string[];
  table: string | null;
  comments?: SchemaComments | null;
  metas?: Record<string, ColumnMeta> | null;
  apijsonBase: string;
  recordId: (row: FlatRow) => string | number | null;
  onGoCheckout?: () => void;
}): HTMLElement {
  const panel = el("div", "layout-cart az-cart");
  panel.appendChild(el("h2", "layout-title", t("layout.cart")));
  const linesHost = el("div", "layout-cart-lines");
  const foot = el("div", "layout-cart-foot");
  const totalEl = el("div", "layout-price layout-price-lg");

  const paint = () => {
    const lines = effectiveCartLines(opts);
    linesHost.innerHTML = "";
    if (!lines.length) {
      linesHost.appendChild(el("div", "result-empty", t("layout.cartEmpty")));
      totalEl.textContent = formatPrice(0);
      return;
    }
    for (const line of lines) {
      const row = el("div", "layout-cart-line");
      row.appendChild(
        thumb(line.image ?? null, opts.apijsonBase, "layout-cart-thumb", ""),
      );
      const info = el("div", "layout-cart-info");
      info.appendChild(el("div", "layout-title", line.title));
      info.appendChild(el("div", "layout-price", formatPrice(line.price)));
      row.appendChild(info);
      const qty = document.createElement("input");
      qty.className = "layout-qty";
      qty.type = "number";
      qty.min = "0";
      qty.value = String(line.qty);
      qty.onchange = () => {
        if (getCartLines().length) {
          setCartQty(line.table, line.id, Number(qty.value) || 0);
        }
        paint();
      };
      row.appendChild(qty);
      linesHost.appendChild(row);
    }
    const stored = getCartLines();
    const total = stored.length
      ? cartTotal()
      : lines.reduce((n, l) => n + l.price * l.qty, 0);
    totalEl.textContent = formatPrice(total);
  };

  paint();
  panel.appendChild(linesHost);
  foot.appendChild(totalEl);
  const go = el("button", "az-btn az-btn-buy", t("layout.checkout"));
  go.type = "button";
  go.onclick = () => opts.onGoCheckout?.();
  foot.appendChild(go);
  panel.appendChild(foot);
  return panel;
}

function renderOrderPanel(opts: {
  rows: FlatRow[];
  columns: string[];
  table: string | null;
  comments?: SchemaComments | null;
  metas?: Record<string, ColumnMeta> | null;
  apijsonBase: string;
  recordId: (row: FlatRow) => string | number | null;
  checkoutHandler?: (info: LayoutCheckoutInfo) => void;
  onSelectPage?: (page: LayoutPage) => void;
}): HTMLElement {
  const panel = el("div", "layout-order az-order");
  panel.appendChild(el("h2", "layout-title", t("layout.order")));
  const lines = effectiveCartLines(opts);
  const summary = el("div", "layout-order-items");
  if (!lines.length) {
    summary.appendChild(el("div", "result-empty", t("layout.cartEmpty")));
  } else {
    for (const line of lines) {
      summary.appendChild(
        el(
          "div",
          "layout-order-item",
          `${line.title} × ${line.qty}  ${formatPrice(line.price * line.qty)}`,
        ),
      );
    }
  }
  panel.appendChild(summary);

  const form = el("div", "layout-order-form");
  const selected = getCheckoutAddress();

  const addrLab = el("label", "layout-field");
  addrLab.appendChild(el("span", "", t("layout.consignee")));
  const addrBtn = el("button", "az-addr-pick");
  addrBtn.type = "button";
  const paintAddr = () => {
    const cur = getCheckoutAddress();
    addrBtn.innerHTML = "";
    if (!cur) {
      addrBtn.appendChild(
        el("div", "az-addr-pick-empty", t("layout.addressSelect")),
      );
      return;
    }
    addrBtn.appendChild(
      el(
        "div",
        "layout-title",
        [cur.consignee, cur.phone].filter(Boolean).join(" · "),
      ),
    );
    const line = formatAddressLine(cur);
    if (line) addrBtn.appendChild(el("div", "layout-meta", line));
    if (cur.tag) addrBtn.appendChild(el("span", "az-addr-tag", cur.tag));
  };
  paintAddr();
  addrBtn.onclick = () => {
    beginAddressPick();
    opts.onSelectPage?.("address");
  };
  addrLab.appendChild(addrBtn);
  form.appendChild(addrLab);

  const remarkLab = el("label", "layout-field");
  remarkLab.appendChild(el("span", "", t("layout.remark")));
  const remark = document.createElement("textarea");
  remark.className = "layout-input";
  remark.dataset.key = "remark";
  remarkLab.appendChild(remark);
  form.appendChild(remarkLab);

  const total = getCartLines().length
    ? cartTotal()
    : lines.reduce((n, l) => n + l.price * l.qty, 0);
  form.appendChild(el("div", "layout-price layout-price-lg", formatPrice(total)));

  const submit = el("button", "az-btn az-btn-buy", t("layout.placeOrder"));
  submit.type = "button";
  submit.onclick = () => {
    const cur = getCheckoutAddress() || selected;
    if (!cur?.consignee || !cur.phone || !cur.address) {
      flashLayoutNote(t("layout.addressSelectFirst"));
      beginAddressPick();
      opts.onSelectPage?.("address");
      return;
    }
    opts.checkoutHandler?.({
      name: cur.consignee,
      phone: cur.phone,
      address: formatAddressLine(cur) || cur.address,
      remark: remark.value.trim(),
      lines,
      total,
    });
  };
  form.appendChild(submit);
  panel.appendChild(form);
  return panel;
}

export function addRowToCart(
  table: string | null,
  row: FlatRow,
  pres: RowPresentation,
): void {
  const id = pres.id ?? row.key;
  addCartLine({
    table: table || "Item",
    id,
    title: pres.title || `#${id}`,
    price: pres.price ?? 0,
    image: pres.coverUrl,
  });
}

export function flashLayoutNote(text: string) {
  document.getElementById("layout-toast")?.remove();
  const toast = el("div", "layout-toast", text);
  toast.id = "layout-toast";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1600);
}

export function shouldReplaceList(
  kind: LayoutKind,
  spec?: LayoutSpec,
): boolean {
  if (spec?.app === "data") return isUserLayoutPage(spec.page);
  return kind !== "data";
}

export function shouldHideDetailForm(
  kind?: LayoutKind,
  spec?: LayoutSpec,
): boolean {
  if (isCartOrOrder(kind) || isCartOrOrder(spec)) return true;
  // Consumer scenes keep the skin only. The field editor (编辑字段 / 收起字段)
  // is for toB 数据/内容管理 (data layout), not chat / shop / player / CMS skins.
  if (spec) return !isDataLayout(spec);
  if (kind) return !isDataLayout(kind);
  return false;
}
