/**
 * Business layout: parent app family × child page type.
 * Slots bind to APIs via A2API bindRequest — never Demo table/field literals.
 */

import { t } from "./i18n/index.js";
import {
  columnCommentOnly,
  fieldColName,
  fieldNameSegments,
  pickBestImageUrl,
  resolveImageSrc,
} from "./smart-image-fields.js";
import type { SchemaComments } from "./schema-types.js";

/** Parent: product family (电商 / 视频 / …). */
export type LayoutApp =
  | "data"
  | "campaign"
  | "social"
  | "chat"
  | "news"
  | "info"
  | "blog"
  | "article"
  | "video"
  | "music"
  | "commerce";

/** Child: concrete page (首页 / 搜索 / 用户列表 / 排行 / …). */
export type LayoutPage =
  | "home"
  | "search"
  | "history"
  | "rank"
  | "category"
  | "recommend"
  | "list"
  | "detail"
  | "player"
  | "cart"
  | "order"
  | "orders"
  | "orderDetail"
  | "address"
  | "addressDetail"
  | "feed"
  | "create"
  | "users"
  | "user"
  | "profile"
  | "settings"
  | "notify"
  | "permission"
  | "wallet"
  | "favorite"
  | "security"
  | "help"
  | "blacklist"
  | "about"
  | "upgrade"
  | "scan";

export type LayoutSpec = { app: LayoutApp; page: LayoutPage };

/** @deprecated use LayoutSpec — kept so saved pages / old kind strings still load. */
export type LayoutKind =
  | LayoutApp
  | "cart"
  | "order";

export const LAYOUT_APPS: readonly LayoutApp[] = [
  "data",
  "commerce",
  "video",
  "music",
  "news",
  "info",
  "blog",
  "article",
  "social",
  "chat",
  "campaign",
] as const;

const ACCOUNT_PAGES = [
  "profile",
  "settings",
  "notify",
  "permission",
  "wallet",
  "favorite",
  "security",
  "help",
  "blacklist",
  "about",
] as const satisfies readonly LayoutPage[];

const APP_ACCOUNT_PAGES = [
  ...ACCOUNT_PAGES,
  "upgrade",
] as const satisfies readonly LayoutPage[];

export const LAYOUT_PAGES_BY_APP: Record<LayoutApp, readonly LayoutPage[]> = {
  data: ["list", "detail", "create", "search", "users", "user", ...ACCOUNT_PAGES, "scan"],
  commerce: [
    "home",
    "search",
    "scan",
    "history",
    "rank",
    "category",
    "recommend",
    "list",
    "detail",
    "cart",
    "order",
    "orders",
    "orderDetail",
    "address",
    "addressDetail",
    "users",
    "user",
    ...APP_ACCOUNT_PAGES,
  ],
  video: [
    "home",
    "search",
    "scan",
    "history",
    "rank",
    "category",
    "recommend",
    "list",
    "detail",
    "player",
    "create",
    "users",
    "user",
    ...APP_ACCOUNT_PAGES,
  ],
  music: [
    "home",
    "search",
    "scan",
    "history",
    "rank",
    "category",
    "recommend",
    "list",
    "detail",
    "player",
    "create",
    "users",
    "user",
    ...APP_ACCOUNT_PAGES,
  ],
  news: [
    "home",
    "search",
    "scan",
    "history",
    "rank",
    "category",
    "recommend",
    "list",
    "detail",
    "create",
    "users",
    "user",
    ...APP_ACCOUNT_PAGES,
  ],
  info: [
    "home",
    "search",
    "scan",
    "history",
    "rank",
    "category",
    "recommend",
    "list",
    "detail",
    "create",
    "users",
    "user",
    ...APP_ACCOUNT_PAGES,
  ],
  blog: [
    "home",
    "search",
    "scan",
    "history",
    "rank",
    "category",
    "recommend",
    "list",
    "detail",
    "create",
    "users",
    "user",
    ...APP_ACCOUNT_PAGES,
  ],
  article: [
    "home",
    "search",
    "scan",
    "history",
    "rank",
    "category",
    "recommend",
    "list",
    "detail",
    "create",
    "users",
    "user",
    ...APP_ACCOUNT_PAGES,
  ],
  social: [
    "list",
    "users",
    "feed",
    "user",
    "search",
    "scan",
    "history",
    "recommend",
    "category",
    "detail",
    "create",
    ...APP_ACCOUNT_PAGES,
  ],
  chat: [
    "list",
    "users",
    "feed",
    "user",
    "search",
    "scan",
    "history",
    "category",
    "create",
    "detail",
    ...APP_ACCOUNT_PAGES,
  ],
  campaign: [
    "home",
    "search",
    "scan",
    "history",
    "rank",
    "category",
    "recommend",
    "list",
    "detail",
    "create",
    "users",
    "user",
    ...APP_ACCOUNT_PAGES,
  ],
};

export const LAYOUT_KINDS: readonly LayoutKind[] = [
  ...LAYOUT_APPS,
  "cart",
  "order",
] as const;

const APP_I18N: Record<LayoutApp, `layout.${LayoutApp}`> = {
  data: "layout.data",
  campaign: "layout.campaign",
  social: "layout.social",
  chat: "layout.chat",
  news: "layout.news",
  info: "layout.info",
  blog: "layout.blog",
  article: "layout.article",
  video: "layout.video",
  music: "layout.music",
  commerce: "layout.commerce",
};

const PAGE_I18N: Record<LayoutPage, `layout.page.${LayoutPage}`> = {
  home: "layout.page.home",
  search: "layout.page.search",
  history: "layout.page.history",
  rank: "layout.page.rank",
  category: "layout.page.category",
  recommend: "layout.page.recommend",
  list: "layout.page.list",
  detail: "layout.page.detail",
  player: "layout.page.player",
  cart: "layout.page.cart",
  order: "layout.page.order",
  orders: "layout.page.orders",
  orderDetail: "layout.page.orderDetail",
  address: "layout.page.address",
  addressDetail: "layout.page.addressDetail",
  feed: "layout.page.feed",
  create: "layout.page.create",
  users: "layout.page.users",
  user: "layout.page.user",
  profile: "layout.page.profile",
  settings: "layout.page.settings",
  notify: "layout.page.notify",
  permission: "layout.page.permission",
  wallet: "layout.page.wallet",
  favorite: "layout.page.favorite",
  security: "layout.page.security",
  help: "layout.page.help",
  blacklist: "layout.page.blacklist",
  about: "layout.page.about",
  upgrade: "layout.page.upgrade",
  scan: "layout.page.scan",
};

export function isLayoutApp(v: unknown): v is LayoutApp {
  return typeof v === "string" && (LAYOUT_APPS as readonly string[]).includes(v);
}

export function isLayoutPage(v: unknown): v is LayoutPage {
  return typeof v === "string" && v in PAGE_I18N;
}

export function isLayoutKind(v: unknown): v is LayoutKind {
  return typeof v === "string" && (LAYOUT_KINDS as readonly string[]).includes(v);
}

export function layoutAppLabel(app: LayoutApp): string {
  return t(APP_I18N[app]);
}

export function layoutPageLabel(page: LayoutPage, app?: LayoutApp): string {
  if (page === "users" && app) {
    const key = USERS_LIST_I18N[app];
    if (key) return t(key);
  }
  return t(PAGE_I18N[page]);
}

const USERS_LIST_I18N: Partial<Record<LayoutApp, `layout.users.list.${LayoutApp}`>> = {
  video: "layout.users.list.video",
  music: "layout.users.list.music",
  commerce: "layout.users.list.commerce",
  news: "layout.users.list.news",
  info: "layout.users.list.info",
  blog: "layout.users.list.blog",
  article: "layout.users.list.article",
  social: "layout.users.list.social",
  chat: "layout.users.list.chat",
  campaign: "layout.users.list.campaign",
  data: "layout.users.list.data",
};

const USER_DETAIL_I18N: Partial<Record<LayoutApp, `layout.users.detail.${LayoutApp}`>> = {
  video: "layout.users.detail.video",
  music: "layout.users.detail.music",
  commerce: "layout.users.detail.commerce",
  news: "layout.users.detail.news",
  info: "layout.users.detail.info",
  blog: "layout.users.detail.blog",
  article: "layout.users.detail.article",
  social: "layout.users.detail.social",
  chat: "layout.users.detail.chat",
  campaign: "layout.users.detail.campaign",
  data: "layout.users.detail.data",
};

export function layoutSpecLabel(spec: LayoutSpec): string {
  return `${layoutAppLabel(spec.app)} / ${layoutPageLabel(spec.page, spec.app)}`;
}

export function layoutKindLabel(kind: LayoutKind): string {
  if (kind === "cart") return t("layout.page.cart");
  if (kind === "order") return t("layout.page.order");
  return layoutAppLabel(kind);
}

/** First-screen page when chat only names a scene / table (电商 / Product). */
export function appLandingPage(app: LayoutApp): LayoutPage {
  const allowed = LAYOUT_PAGES_BY_APP[app];
  if (app === "chat" && allowed.includes("list")) return "list";
  if (allowed.includes("home")) return "home";
  if (allowed.includes("feed")) return "feed";
  return allowed[0] ?? "list";
}

/** Bottom / top app tabs on home-like screens (not every catalog page). */
export const APP_TABS_BY_APP: Record<LayoutApp, readonly LayoutPage[]> = {
  data: [],
  commerce: ["home", "category", "cart", "orders", "user"],
  video: ["home", "category", "rank", "history", "user"],
  music: ["home", "category", "rank", "history", "user"],
  news: ["home", "category", "rank", "user"],
  info: ["home", "category", "rank", "user"],
  blog: ["home", "category", "create", "user"],
  article: ["home", "category", "rank", "create", "user"],
  social: ["list", "users", "feed", "user"],
  chat: ["list", "users", "feed", "user"],
  campaign: ["home", "category", "list", "rank", "user"],
};

export function shouldShowAppTabs(
  app: LayoutApp,
  page?: LayoutPage,
): boolean {
  const tabs = APP_TABS_BY_APP[app];
  if (!tabs.length) return false;
  if (!page) return true;
  if (tabs.includes(page)) return true;
  if (isMeHubPage(page)) return true;
  return page === "list" || page === "home" || page === "feed";
}

const TAB_I18N: Partial<Record<LayoutPage, `layout.tab.${string}`>> = {
  home: "layout.tab.home",
  search: "layout.tab.search",
  history: "layout.tab.history",
  rank: "layout.tab.rank",
  category: "layout.tab.category",
  recommend: "layout.tab.recommend",
  list: "layout.tab.list",
  cart: "layout.tab.cart",
  orders: "layout.tab.orders",
  address: "layout.tab.address",
  feed: "layout.tab.feed",
  create: "layout.tab.create",
  users: "layout.tab.users",
  user: "layout.tab.me",
  scan: "layout.tab.scan",
};

export function layoutTabLabel(page: LayoutPage, app?: LayoutApp): string {
  if (app === "chat" || app === "social") {
    if (page === "list") return t("layout.tab.chats");
    if (page === "users") return t("layout.tab.contacts");
    if (page === "user") return t("layout.tab.me");
  }
  const key = TAB_I18N[page];
  return key ? t(key as "layout.tab.home") : layoutPageLabel(page, app);
}

export function defaultPageForApp(
  app: LayoutApp,
  pageKind?: "list" | "detail" | "create",
): LayoutPage {
  const allowed = LAYOUT_PAGES_BY_APP[app];
  const prefer =
    pageKind === "create"
      ? "create"
      : pageKind === "detail"
        ? app === "music"
          ? "player"
          : "detail"
        : appLandingPage(app);
  return allowed.includes(prefer) ? prefer : (allowed[0] ?? "list");
}

export function specFromLegacy(
  kind: LayoutKind | null | undefined,
  pageKind?: "list" | "detail" | "create",
): LayoutSpec {
  if (kind === "cart") return { app: "commerce", page: "cart" };
  if (kind === "order") return { app: "commerce", page: "order" };
  const app = isLayoutApp(kind) ? kind : "data";
  return { app, page: defaultPageForApp(app, pageKind) };
}

export function legacyKindFromSpec(spec: LayoutSpec): LayoutKind {
  if (spec.page === "cart") return "cart";
  if (spec.page === "order") return "order";
  return spec.app;
}

export function appFromKind(kind: LayoutKind | null | undefined): LayoutApp {
  if (kind === "cart" || kind === "order") return "commerce";
  return isLayoutApp(kind) ? kind : "data";
}

export function parseLayoutSpec(
  raw: unknown,
  pageKind?: "list" | "detail" | "create",
): LayoutSpec {
  if (raw && typeof raw === "object") {
    const o = raw as { app?: unknown; page?: unknown };
    if (isLayoutApp(o.app)) {
      const pages = LAYOUT_PAGES_BY_APP[o.app];
      const page = isLayoutPage(o.page) && pages.includes(o.page)
        ? o.page
        : defaultPageForApp(o.app, pageKind);
      return { app: o.app, page };
    }
  }
  if (typeof raw === "string" && raw.includes(".")) {
    const [a, p] = raw.split(".", 2);
    if (isLayoutApp(a) && isLayoutPage(p) && LAYOUT_PAGES_BY_APP[a].includes(p)) {
      return { app: a, page: p };
    }
  }
  if (isLayoutKind(raw)) return specFromLegacy(raw, pageKind);
  return specFromLegacy("data", pageKind);
}

export function layoutSpecId(spec: LayoutSpec): string {
  return `${spec.app}.${spec.page}`;
}

export function specsEqual(a: LayoutSpec, b: LayoutSpec): boolean {
  return a.app === b.app && a.page === b.page;
}

/** Spreadsheet / form (existing table · grid · charts · detail form). */
export function isDataLayout(kind: LayoutKind | LayoutSpec | null | undefined): boolean {
  if (!kind) return true;
  if (typeof kind === "object") return kind.app === "data";
  return kind === "data";
}

export function isCartOrOrder(kind: LayoutKind | LayoutSpec | null | undefined): boolean {
  if (!kind) return false;
  if (typeof kind === "object") return kind.page === "cart" || kind.page === "order";
  return kind === "cart" || kind === "order";
}

export function isCheckoutPage(page: LayoutPage | null | undefined): boolean {
  return page === "order";
}

export function isOrdersPage(page: LayoutPage | null | undefined): boolean {
  return page === "orders" || page === "orderDetail";
}

export function isAddressPage(page: LayoutPage | null | undefined): boolean {
  return page === "address" || page === "addressDetail";
}

export const ACTION_SLOTS = [
  "like",
  "collect",
  "share",
  "follow",
  "comment",
  "commentList",
  "message",
  "authorGet",
] as const;

export type ActionSlot = (typeof ACTION_SLOTS)[number];

export function isActionSlot(v: unknown): v is ActionSlot {
  return typeof v === "string" && (ACTION_SLOTS as readonly string[]).includes(v);
}

/** A2API bindRequest stored on a page for one UI slot (like / comment / …). */
export type ActionBinding = {
  slot: ActionSlot;
  bindingId: string;
  method: string;
  url: string;
  bodyTemplate: Record<string, unknown>;
  paramMap: Array<{ from: string; to: string }>;
  triggerActions?: string[];
};

export type InferLayoutInput = {
  table?: string | null;
  columns?: string[] | null;
  comments?: SchemaComments | null;
  pageKind?: "list" | "detail" | "create";
  /** Latest chat text — 列表/详情/搜索… override the default home landing. */
  prompt?: string | null;
};

const DATA_TABLES = new Set(
  [
    "user",
    "employee",
    "privacy",
    "access",
    "request",
    "document",
    "apply",
    "call",
    "verify",
    "login",
    "function",
    "response",
    "script",
  ].map((s) => s.toLowerCase()),
);

type KindScore = Partial<Record<LayoutKind, number>>;

function add(scores: KindScore, kind: LayoutKind, n: number) {
  scores[kind] = (scores[kind] ?? 0) + n;
}

function normToken(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

function tableTokens(table: string): string[] {
  const segs = fieldNameSegments(table);
  const compact = normToken(table);
  return [...new Set([...segs, compact, table.toLowerCase()])].filter(Boolean);
}

function haystackOf(opts: InferLayoutInput): string {
  const parts: string[] = [];
  const table = (opts.table || "").trim();
  if (table) {
    parts.push(table);
    const tc = opts.comments?.tables?.[table];
    if (tc) parts.push(tc);
  }
  for (const col of opts.columns ?? []) {
    parts.push(col);
    parts.push(fieldColName(col));
    const cc = columnCommentOnly(col, opts.comments);
    if (cc) parts.push(cc);
  }
  if (opts.comments?.columns) {
    const prefix = table ? `${table}.` : "";
    for (const [k, v] of Object.entries(opts.comments.columns)) {
      if (!prefix || k.startsWith(prefix) || !k.includes(".")) {
        parts.push(k, v);
      }
    }
  }
  return parts.join(" ").toLowerCase();
}

function scoreTableName(table: string, scores: KindScore) {
  const tokens = tableTokens(table);
  const blob = tokens.join(" ");
  const has = (...needles: string[]) =>
    needles.some((n) => blob.includes(n) || tokens.includes(n));

  if (has("cart", "basket", "购物车", "shopcart")) add(scores, "cart", 40);
  if (has("checkout", "placeorder", "下单", "结算") && !has("orderlist", "shoporder")) {
    add(scores, "order", 40);
  }
  if (has("shoporder", "orderlist", "订单")) add(scores, "commerce", 36);
  if (has("address", "shipping", "收件地址", "收货地址", "地址簿")) {
    add(scores, "commerce", 34);
  }
  if (has("video", "movie", "film", "vod", "clip", "视频", "影片")) {
    add(scores, "video", 36);
  }
  if (has("music", "song", "audio", "track", "album", "playlist", "音乐", "歌曲")) {
    add(scores, "music", 36);
  }
  if (
    has(
      "product",
      "goods",
      "sku",
      "item",
      "shop",
      "store",
      "commodity",
      "merchandise",
      "商品",
      "货品",
      "电商",
    )
  ) {
    add(scores, "commerce", 34);
  }
  if (has("moment", "feed", "status", "weibo", "moments", "动态", "朋友圈")) {
    add(scores, "social", 36);
  }
  if (has("post") && !has("postage", "postal")) add(scores, "social", 18);
  if (
    has("message", "chat", "im", "conversation", "session", "inbox", "聊天", "消息", "会话")
  ) {
    add(scores, "chat", 34);
  }
  if (has("comment", "comments", "评论")) add(scores, "social", 22);
  if (has("news", "headline", "新闻")) add(scores, "news", 34);
  if (has("blog", "博客")) add(scores, "blog", 34);
  if (has("article", "essay", "story", "文章")) add(scores, "article", 32);
  if (has("info", "information", "notice", "announcement", "资讯", "公告", "通知")) {
    add(scores, "info", 30);
  }
  if (
    has(
      "campaign",
      "activity",
      "event",
      "promo",
      "promotion",
      "operation",
      "活动",
      "运营",
      "促销",
    )
  ) {
    add(scores, "campaign", 32);
  }
  if (DATA_TABLES.has(normToken(table))) add(scores, "data", 28);
}

function scoreFieldsAndComments(hay: string, scores: KindScore) {
  const hit = (re: RegExp, kind: LayoutKind, n: number) => {
    if (re.test(hay)) add(scores, kind, n);
  };

  hit(/\b(videourl|video_url|playurl|play_url|mp4|webm|m3u8|vod)\b|视频地址|播放地址/, "video", 16);
  hit(/\b(video|movie|film|clip)\b|视频|影片/, "video", 8);
  hit(/\b(audiourl|audio_url|musicurl|mp3|m4a|wav|flac)\b|音频|歌曲地址/, "music", 16);
  hit(/\b(audio|music|song|track|album)\b|音乐|歌曲|专辑/, "music", 8);
  hit(/\b(price|amount|sku|stock|inventory|cartcount)\b|价格|单价|库存|sku/, "commerce", 12);
  hit(/\b(goods|product|commodity|shop)\b|商品|货品/, "commerce", 8);
  hit(/\b(cart|basket|qty|quantity)\b|购物车|数量/, "cart", 8);
  hit(/\b(checkout|placeorder|paystatus)\b|下单|结算/, "order", 10);
  hit(/\b(shoporder|orderno|totalprice)\b|订单号|订单金额/, "commerce", 10);
  hit(/\b(consignee|shippingaddr)\b|收货人|收件地址/, "commerce", 8);
  hit(/\b(content|picturelist|praise|likecount|commentcount)\b|点赞|动态/, "social", 8);
  hit(/\b(message|msgid|fromid|toid|conversation)\b|聊天|会话|私信/, "chat", 10);
  hit(/\b(headline|newstime|source)\b|新闻|头条/, "news", 8);
  hit(/\b(blog|blogtitle)\b|博客/, "blog", 8);
  hit(/\b(article|bodyhtml|markdown)\b|正文|文章/, "article", 8);
  hit(/\b(notice|announcement|infotitle)\b|资讯|公告/, "info", 8);
  hit(/\b(campaign|activity|starttime|endtime|promo)\b|活动|运营|促销/, "campaign", 8);
}

function pickWinner(scores: KindScore, table: string): LayoutKind {
  let best: LayoutKind = "data";
  let bestN = scores.data ?? 0;
  for (const kind of LAYOUT_KINDS) {
    if (kind === "data") continue;
    const n = scores[kind] ?? 0;
    if (n > bestN) {
      best = kind;
      bestN = n;
    }
  }
  if (DATA_TABLES.has(normToken(table)) && best !== "video" && best !== "music") {
    const dataN = scores.data ?? 0;
    if (bestN < dataN + 16) return "data";
  }
  if (bestN < 10) return "data";
  return best;
}

/**
 * Default layout from table name, field names, and comments.
 * List vs detail vs player is applied later from pageKind + this category.
 */
export function inferLayoutKind(opts: InferLayoutInput): LayoutKind {
  const table = (opts.table || "").trim();
  const scores: KindScore = { data: 4 };
  if (table) scoreTableName(table, scores);
  scoreFieldsAndComments(haystackOf(opts), scores);

  if (opts.pageKind === "create" && (scores.cart || scores.order)) {
    // Create Order → checkout; create Cart → cart
    if ((scores.order ?? 0) >= (scores.cart ?? 0) && (scores.order ?? 0) >= 20) {
      return "order";
    }
    if ((scores.cart ?? 0) >= 20) return "cart";
  }

  return pickWinner(scores, table);
}

function hayHits(hay: string, en: string[], zh: string[]): boolean {
  const n = hay.toLowerCase();
  for (const token of en) {
    if (new RegExp(`\\b${token}\\b`, "i").test(n)) return true;
  }
  return zh.some((z) => n.includes(z));
}

function inferPageFromPrompt(
  prompt: string,
  app: LayoutApp,
): LayoutPage | null {
  const hay = prompt.trim();
  if (!hay) return null;
  const allowed = LAYOUT_PAGES_BY_APP[app];
  const pick = (page: LayoutPage) => (allowed.includes(page) ? page : null);
  if (
    hayHits(
      hay,
      ["detail", "editing", "player", "playback"],
      ["详情", "明细", "编辑", "修改", "播放"],
    )
  ) {
    return pick(app === "music" ? "player" : "detail");
  }
  if (
    hayHits(
      hay,
      ["create", "compose", "publish", "newpost"],
      ["新增", "新建", "创建", "发布", "发帖", "发动态"],
    )
  ) {
    return pick("create");
  }
  if (hayHits(hay, ["search", "find"], ["搜索", "查找", "检索"])) {
    return pick("search");
  }
  if (hayHits(hay, ["scan", "qrcode", "qr"], ["扫码", "扫一扫", "二维码"])) {
    return pick("scan");
  }
  if (
    hayHits(hay, ["category", "categories", "catalog", "classify"], [
      "分类",
      "类目",
      "栏目",
    ])
  ) {
    return pick("category");
  }
  if (hayHits(hay, ["recommend", "foryou"], ["推荐", "猜你喜欢"])) {
    return pick("recommend");
  }
  if (hayHits(hay, ["rank", "ranking", "toplist", "leaderboard"], ["排行", "热榜"])) {
    return pick("rank");
  }
  if (hayHits(hay, ["history", "recent"], ["历史", "足迹", "最近"])) {
    return pick("history");
  }
  if (hayHits(hay, ["cart", "shoppingcart"], ["购物车", "购物篮"])) {
    return pick("cart");
  }
  if (hayHits(hay, ["checkout", "placeorder"], ["下单", "结算"])) {
    return pick("order");
  }
  if (
    hayHits(hay, ["orderdetail"], ["订单详情"]) ||
    (hayHits(hay, ["order"], ["订单"]) &&
      hayHits(hay, ["detail"], ["详情", "明细"]))
  ) {
    return pick("orderDetail");
  }
  if (hayHits(hay, ["orders", "orderlist"], ["订单列表", "我的订单", "订单"])) {
    return pick("orders") ?? pick("order");
  }
  if (
    hayHits(hay, ["addressdetail"], ["地址详情"]) ||
    (hayHits(hay, ["address"], ["地址", "收件", "收货"]) &&
      hayHits(hay, ["detail"], ["详情"]))
  ) {
    return pick("addressDetail");
  }
  if (hayHits(hay, ["address", "shipping"], ["收件地址", "收货地址", "地址"])) {
    return pick("address");
  }
  if (
    hayHits(hay, ["profile", "myprofile"], ["个人资料", "我的资料", "编辑资料"])
  ) {
    return pick("profile");
  }
  if (hayHits(hay, ["settings", "preferences"], ["设置", "设定"])) {
    return pick("settings");
  }
  if (hayHits(hay, ["wallet", "balance"], ["钱包", "余额"])) {
    return pick("wallet");
  }
  if (hayHits(hay, ["favorite", "favorites", "collect"], ["收藏"])) {
    return pick("favorite");
  }
  if (hayHits(hay, ["blacklist", "blocklist"], ["黑名单"])) {
    return pick("blacklist");
  }
  if (hayHits(hay, ["upgrade", "version"], ["版本", "升级"])) {
    return pick("upgrade");
  }
  if (hayHits(hay, ["list", "listing"], ["列表", "清单"])) {
    return pick("list");
  }
  return null;
}

function inferConcretePage(
  opts: InferLayoutInput,
  app: LayoutApp,
): LayoutPage | null {
  const fromPrompt = opts.prompt
    ? inferPageFromPrompt(opts.prompt, app)
    : null;
  if (fromPrompt) return fromPrompt;
  const table = (opts.table || "").trim();
  const hay = `${table} ${opts.comments?.tables?.[table] || ""}`.toLowerCase();
  const allowed = LAYOUT_PAGES_BY_APP[app];
  const pick = (page: LayoutPage) => (allowed.includes(page) ? page : null);
  if (
    hayHits(
      hay,
      ["searchhistory", "watchhistory", "playhistory", "recentplay"],
      ["浏览历史", "搜索历史", "观看历史", "播放历史", "最近播放", "足迹"],
    )
  ) {
    return pick("history");
  }
  if (
    hayHits(
      hay,
      ["rank", "ranking", "hotlist", "toplist", "leaderboard"],
      ["排行", "热榜", "热门榜", "销量榜"],
    )
  ) {
    return pick("rank");
  }
  if (
    hayHits(hay, ["category", "catalog", "classify"], ["类目", "分类", "栏目"])
  ) {
    return pick("category");
  }
  if (
    hayHits(
      hay,
      ["recommend", "guessyou", "relatedgoods"],
      ["猜你喜欢", "相关推荐", "为你推荐"],
    )
  ) {
    return pick("recommend");
  }
  if (personTableHint(opts.table, opts.comments)) {
    return opts.pageKind === "detail" ? pick("user") : pick("users");
  }
  if (
    hayHits(hay, ["shoporder", "orderlist", "orders"], ["订单"]) &&
    !hayHits(hay, ["checkout"], ["下单", "结算"])
  ) {
    return opts.pageKind === "detail" ? pick("orderDetail") : pick("orders");
  }
  if (hayHits(hay, ["address", "shippingaddr"], ["收件", "收货地址", "地址簿"])) {
    return opts.pageKind === "detail" ? pick("addressDetail") : pick("address");
  }
  return null;
}

function personHay(hay: string): boolean {
  return hayHits(
    hay,
    [
      "user",
      "member",
      "seller",
      "vendor",
      "channel",
      "artist",
      "author",
      "writer",
      "contact",
      "creator",
      "uploader",
    ],
    ["主播", "博主", "作者", "艺人", "卖家", "店铺", "频道", "用户", "会员", "通讯录", "联系人"],
  );
}

function personTableHint(
  table: string | null | undefined,
  comments?: SchemaComments | null,
): boolean {
  const name = (table || "").trim();
  if (!name) return false;
  const note = comments?.tables?.[name] || "";
  return personHay(`${name} ${note}`);
}

/** App family + concrete page (首页 / 列表 / 播放 / 购物车 / …). */
export function inferLayoutSpec(opts: InferLayoutInput): LayoutSpec {
  const spec = specFromLegacy(inferLayoutKind(opts), opts.pageKind);
  const page = inferConcretePage(opts, spec.app);
  return page ? { app: spec.app, page } : spec;
}

export function isUserLayoutPage(page: LayoutPage | null | undefined): boolean {
  return page === "users" || page === "user";
}

export function isSettingsPage(page: LayoutPage | null | undefined): boolean {
  return (
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
  );
}

export function isMeHubPage(page: LayoutPage | null | undefined): boolean {
  return page === "user" || page === "profile" || isSettingsPage(page);
}

export function isExploreLayoutPage(page: LayoutPage | null | undefined): boolean {
  return (
    page === "search" ||
    page === "history" ||
    page === "rank" ||
    page === "category" ||
    page === "recommend" ||
    page === "scan"
  );
}

const TITLE_COLS = [
  "title",
  "name",
  "subject",
  "headline",
  "caption",
  "nickname",
  "nick",
  "song",
  "productname",
  "goodsname",
  "consignee",
  "receiver",
  "标题",
  "名称",
  "商品名",
  "歌名",
  "收货人",
];
const BODY_COLS = [
  "content",
  "body",
  "text",
  "description",
  "summary",
  "intro",
  "article",
  "message",
  "remark",
  "detail",
  "html",
  "address",
  "region",
];
const AUTHOR_COLS = [
  "author",
  "username",
  "nickname",
  "nick",
  "user",
  "writer",
  "singer",
  "artist",
];
const DATE_COLS = [
  "date",
  "time",
  "created",
  "createtime",
  "createdat",
  "publishtime",
  "published",
  "updatetime",
  "datetime",
];
const PRICE_COLS = [
  "price",
  "amount",
  "fee",
  "cost",
  "money",
  "saleprice",
  "unitprice",
  "total",
];
const PHONE_COLS = ["phone", "mobile", "tel", "telephone"];
const STOCK_COLS = ["stock", "inventory", "quantity", "qty", "remain"];
const STATUS_COLS = ["status", "state", "stage"];
const SEX_COLS = ["sex", "gender", "性别"];
const AGE_COLS = ["age", "ages", "年龄"];

const VIDEO_EXT_RE = /\.(mp4|webm|ogg|m3u8|mov)(\?|#|$)/i;
const AUDIO_EXT_RE = /\.(mp3|m4a|wav|flac|aac|ogg|opus)(\?|#|$)/i;
const URLISH_RE = /^(https?:\/\/|\/\/|\/|data:)/i;

function colKey(path: string): string {
  return fieldColName(path).replace(/[^a-z0-9\u4e00-\u9fff]/gi, "").toLowerCase();
}

function cellStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function looksUrl(s: string): boolean {
  return URLISH_RE.test(s) || /^[\w.-]+\.[a-z]{2,}([/?#]|$)/i.test(s);
}

function scoreNameList(path: string, names: string[]): number {
  const key = colKey(path);
  const idx = names.findIndex((n) => key === n || key.endsWith(n));
  if (idx >= 0) return 80 - idx;
  if (names.some((n) => key.includes(n))) return 20;
  return 0;
}

/** Best title / name / body column for in-place contains search. */
export function pickSearchColumnPath(
  columns: string[],
  primaryTable?: string | null,
): string | null {
  let best: { path: string; score: number } | null = null;
  for (const path of columns) {
    let score = scoreNameList(path, TITLE_COLS);
    if (score <= 0) {
      const body = scoreNameList(path, BODY_COLS);
      if (body > 0) score = Math.max(1, Math.floor(body * 0.45));
    }
    if (score <= 0) continue;
    if (primaryTable && path.startsWith(`${primaryTable}.`)) score += 8;
    if (!best || score > best.score) best = { path, score };
  }
  return best?.path ?? null;
}

export function formatGender(value: unknown): string {
  const s = String(value ?? "").trim();
  if (!s) return "";
  if (s === "0" || /^m(ale)?$/i.test(s) || s === "男") return t("layout.me.sexMale");
  if (s === "1" || /^f(emale)?$/i.test(s) || s === "女") return t("layout.me.sexFemale");
  if (s === "2" || /^other$/i.test(s)) return t("layout.me.sexOther");
  return s;
}

function pickByNames(
  cells: Record<string, unknown>,
  columns: string[],
  names: string[],
  primaryTable?: string | null,
): string {
  let best: { text: string; score: number } | null = null;
  const paths = [...new Set([...columns, ...Object.keys(cells)])];
  for (const path of paths) {
    let score = scoreNameList(path, names);
    if (score <= 0) continue;
    if (primaryTable && path.startsWith(`${primaryTable}.`)) score += 8;
    const text = cellStr(cells[path]);
    if (!text) continue;
    if (!best || score > best.score) best = { text, score };
  }
  return best?.text ?? "";
}

function pickNumber(
  cells: Record<string, unknown>,
  columns: string[],
  names: string[],
  primaryTable?: string | null,
): number | null {
  const raw = pickByNames(cells, columns, names, primaryTable);
  if (!raw) {
    for (const path of [...columns, ...Object.keys(cells)]) {
      if (scoreNameList(path, names) <= 0) continue;
      const n = Number(cells[path]);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }
  const n = Number(String(raw).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function pickMediaUrl(
  cells: Record<string, unknown>,
  columns: string[],
  kind: "video" | "audio",
  primaryTable?: string | null,
): string | null {
  const ext = kind === "video" ? VIDEO_EXT_RE : AUDIO_EXT_RE;
  const nameHint =
    kind === "video"
      ? ["video", "videourl", "playurl", "mp4", "vod", "movie", "clip"]
      : ["audio", "audiourl", "musicurl", "mp3", "song", "track", "voice"];
  const paths = [...new Set([...columns, ...Object.keys(cells)])];
  let best: { url: string; score: number } | null = null;
  for (const path of paths) {
    const raw = cells[path];
    const texts: string[] = [];
    if (typeof raw === "string") texts.push(raw);
    else if (Array.isArray(raw)) {
      for (const x of raw) if (typeof x === "string") texts.push(x);
    }
    for (const text of texts) {
      const s = text.trim();
      if (!s) continue;
      let score = 0;
      if (ext.test(s)) score += 50;
      else if (!looksUrl(s)) continue;
      score += scoreNameList(path, nameHint);
      if (primaryTable && path.startsWith(`${primaryTable}.`)) score += 6;
      if (score < 12) continue;
      if (!best || score > best.score) best = { url: s, score };
    }
  }
  return best?.url ?? null;
}

const ALBUM_COLS = ["album", "albumname"];
const DURATION_COLS = ["duration", "length", "seconds", "durationsec"];
const PLAY_COLS = ["playcount", "viewcount", "views", "plays", "readcount"];
const SALES_COLS = ["sales", "sold", "salecount"];
const SOURCE_COLS = ["source", "from", "publisher", "media"];
const HEADLINE_COLS = ["headline", "lead", "subtitle", "digest"];
const SHARE_COLS = ["sharecount", "shares"];
const PRAISE_LIST_COLS = ["praiseuseridlist", "likeuseridlist", "likedby"];
const COLLECT_LIST_COLS = ["collectuseridlist", "favoriteuseridlist", "staruseridlist"];

function pickRaw(
  cells: Record<string, unknown>,
  columns: string[],
  names: string[],
  primaryTable?: string | null,
): unknown {
  let best: { value: unknown; score: number } | null = null;
  const paths = [...new Set([...columns, ...Object.keys(cells)])];
  for (const path of paths) {
    let score = scoreNameList(path, names);
    if (score <= 0) continue;
    if (primaryTable && path.startsWith(`${primaryTable}.`)) score += 8;
    const value = cells[path];
    if (value == null || value === "") continue;
    if (!best || score > best.score) best = { value, score };
  }
  return best?.value;
}

function parseIdListValue(raw: unknown): Array<string | number> {
  if (Array.isArray(raw)) {
    return raw.filter((x) => x != null && x !== "") as Array<string | number>;
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      return parseIdListValue(JSON.parse(s));
    } catch {
      return [];
    }
  }
  return [];
}

const AUTHOR_ID_COLS = [
  "userid",
  "authorid",
  "ownerid",
  "publisherid",
  "uid",
  "creatorid",
];

function pickAuthorId(
  cells: Record<string, unknown>,
  table: string | null,
  columns?: string[],
): string | number | null {
  const paths = [
    ...new Set([...(columns ?? []), ...Object.keys(cells)]),
  ];
  let best: { value: string | number; score: number } | null = null;
  for (const path of paths) {
    let score = scoreNameList(path, AUTHOR_ID_COLS);
    if (score <= 0) continue;
    if (table && path.startsWith(`${table}.`)) score += 8;
    const v = cells[path];
    const id =
      typeof v === "number" && Number.isFinite(v)
        ? v
        : typeof v === "string" && v.trim()
          ? v.trim()
          : null;
    if (id == null) continue;
    if (!best || score > best.score) best = { value: id, score };
  }
  return best?.value ?? null;
}

export type RowPresentation = {
  title: string;
  subtitle: string;
  body: string;
  date: string;
  author: string;
  album: string;
  source: string;
  headline: string;
  durationSec: number | null;
  playCount: number | null;
  sales: number | null;
  price: number | null;
  stock: string;
  status: string;
  phone: string;
  sex: string;
  age: string;
  coverUrl: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  id: string | number | null;
  authorId: string | number | null;
  praiseIds: Array<string | number>;
  collectIds: Array<string | number>;
  shareCount: number | null;
};

export function pickRowPresentation(
  cells: Record<string, unknown>,
  opts: {
    primaryTable?: string | null;
    columns?: string[];
    comments?: SchemaComments | null;
    showByPath?: Record<string, "auto" | "text" | "picture" | "file" | undefined> | null;
    recordId?: string | number | null;
  },
): RowPresentation {
  const columns = opts.columns?.length ? opts.columns : Object.keys(cells);
  const table = opts.primaryTable ?? null;
  const title =
    pickByNames(cells, columns, TITLE_COLS, table) ||
    pickByNames(cells, columns, BODY_COLS, table).slice(0, 48);
  const body = pickByNames(cells, columns, BODY_COLS, table);
  const author = pickByNames(cells, columns, AUTHOR_COLS, table);
  const date = pickByNames(cells, columns, DATE_COLS, table);
  const price = pickNumber(cells, columns, PRICE_COLS, table);
  const stock = pickByNames(cells, columns, STOCK_COLS, table);
  const status = pickByNames(cells, columns, STATUS_COLS, table);
  const phone = pickByNames(cells, columns, PHONE_COLS, table);
  const sex = formatGender(pickByNames(cells, columns, SEX_COLS, table));
  const age = pickByNames(cells, columns, AGE_COLS, table);
  const album = pickByNames(cells, columns, ALBUM_COLS, table);
  const source = pickByNames(cells, columns, SOURCE_COLS, table);
  const headline = pickByNames(cells, columns, HEADLINE_COLS, table);
  const durationSec = pickNumber(cells, columns, DURATION_COLS, table);
  const playCount = pickNumber(cells, columns, PLAY_COLS, table);
  const sales = pickNumber(cells, columns, SALES_COLS, table);
  const subtitle = [author, date].filter(Boolean).join(" · ");
  return {
    title: title || (opts.recordId != null ? `#${opts.recordId}` : ""),
    subtitle,
    body,
    date,
    author,
    album,
    source,
    headline,
    durationSec,
    playCount,
    sales,
    price,
    stock,
    status,
    phone,
    sex,
    age,
    coverUrl: pickBestImageUrl(
      cells,
      table,
      columns,
      opts.comments,
      opts.showByPath,
    ),
    videoUrl: pickMediaUrl(cells, columns, "video", table),
    audioUrl: pickMediaUrl(cells, columns, "audio", table),
    id: opts.recordId ?? null,
    authorId: pickAuthorId(cells, table, columns),
    praiseIds: parseIdListValue(
      pickRaw(cells, columns, PRAISE_LIST_COLS, table),
    ),
    collectIds: parseIdListValue(
      pickRaw(cells, columns, COLLECT_LIST_COLS, table),
    ),
    shareCount: pickNumber(cells, columns, SHARE_COLS, table),
  };
}

export function formatPrice(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "CNY",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `¥${n.toFixed(2)}`;
  }
}

export function formatDuration(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return "";
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function formatCount(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}亿`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function mediaSrc(url: string | null | undefined, apijsonBase: string): string {
  if (!url) return "";
  return preferHttpsMedia(resolveImageSrc(url, apijsonBase));
}

/** Demo seeds and some CDNs still store http://; browsers on https pages block those. */
function preferHttpsMedia(url: string): string {
  if (!/^http:\/\//i.test(url)) return url;
  try {
    const u = new URL(url);
    if (
      /(?:^|\.)(?:googleapis|gstatic|commondatastorage\.googleapis|soundhelix)\.com$/i.test(
        u.hostname,
      )
    ) {
      u.protocol = "https:";
      return u.href;
    }
  } catch {
    return url;
  }
  return url;
}

export type CartLine = {
  table: string;
  id: string | number;
  title: string;
  price: number;
  qty: number;
  image?: string | null;
};

const CART_KEY = "a2api.shopCart";

function loadCartRaw(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CartLine =>
        x != null &&
        typeof x === "object" &&
        typeof (x as CartLine).table === "string" &&
        (typeof (x as CartLine).id === "string" ||
          typeof (x as CartLine).id === "number") &&
        typeof (x as CartLine).title === "string" &&
        typeof (x as CartLine).price === "number" &&
        typeof (x as CartLine).qty === "number",
    );
  } catch {
    return [];
  }
}

function saveCart(lines: CartLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines.slice(0, 80)));
  } catch {
    /* quota */
  }
}

export function getCartLines(): CartLine[] {
  return loadCartRaw();
}

export function cartCount(): number {
  return loadCartRaw().reduce((n, l) => n + l.qty, 0);
}

export function cartTotal(): number {
  return loadCartRaw().reduce((n, l) => n + l.price * l.qty, 0);
}

export function addCartLine(line: Omit<CartLine, "qty"> & { qty?: number }): CartLine[] {
  const lines = loadCartRaw();
  const qty = Math.max(1, line.qty ?? 1);
  const i = lines.findIndex(
    (l) => l.table === line.table && String(l.id) === String(line.id),
  );
  if (i >= 0) {
    lines[i] = { ...lines[i]!, qty: lines[i]!.qty + qty };
  } else {
    lines.push({
      table: line.table,
      id: line.id,
      title: line.title,
      price: line.price,
      qty,
      image: line.image ?? null,
    });
  }
  saveCart(lines);
  return lines;
}

export function setCartQty(
  table: string,
  id: string | number,
  qty: number,
): CartLine[] {
  let lines = loadCartRaw();
  if (qty <= 0) {
    lines = lines.filter(
      (l) => !(l.table === table && String(l.id) === String(id)),
    );
  } else {
    const i = lines.findIndex(
      (l) => l.table === table && String(l.id) === String(id),
    );
    if (i >= 0) lines[i] = { ...lines[i]!, qty };
  }
  saveCart(lines);
  return lines;
}

export function clearCart(): void {
  saveCart([]);
}

export function rowsAsCartLines(
  rows: Array<{
    cells: Record<string, unknown>;
    key: string;
  }>,
  opts: {
    table: string | null;
    columns: string[];
    comments?: SchemaComments | null;
    recordId: (row: { cells: Record<string, unknown>; key: string }) =>
      | string
      | number
      | null;
  },
): CartLine[] {
  const out: CartLine[] = [];
  for (const row of rows) {
    const id = opts.recordId(row);
    if (id == null) continue;
    const p = pickRowPresentation(row.cells, {
      primaryTable: opts.table,
      columns: opts.columns,
      comments: opts.comments,
      recordId: id,
    });
    out.push({
      table: opts.table || "Item",
      id,
      title: p.title || `#${id}`,
      price: p.price ?? 0,
      qty: 1,
      image: p.coverUrl,
    });
  }
  return out;
}
