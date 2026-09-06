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

/** Parent: product family (电商购物 / 视频影像 / …). */
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
  | "commerce"
  | "education"
  | "books"
  | "comics"
  | "lifestyle"
  | "food"
  | "travel"
  | "sports"
  | "parenting"
  | "health"
  | "auto"
  | "jobs"
  | "housing"
  | "beauty"
  | "photo"
  | "office";

/** Child: concrete page (首页 / 搜索 / 用户列表 / 排行 / …). */
export type LayoutPage =
  | "home"
  | "search"
  | "history"
  | "rank"
  | "category"
  | "recommend"
  | "list"
  | "table"
  | "grid"
  | "charts"
  | "bar"
  | "hbar"
  | "line"
  | "pie"
  | "area"
  | "doughnut"
  | "form"
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
  | "published"
  | "drafts"
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
  | "skills"
  | "scan";

export type LayoutSpec = { app: LayoutApp; page: LayoutPage };

/** @deprecated use LayoutSpec — kept so saved pages / old kind strings still load. */
export type LayoutKind =
  | LayoutApp
  | "cart"
  | "order";

/**
 * Parent scene (4-char zh) → item table. Child rows live in Category.app.
 * 数据管理 Employee · 电商购物 Product · 视频影像 Video · 音乐歌曲 Music
 * 新闻资讯 News（含原资讯公告） · 博客日志 Blog · 文章专栏 Article
 * 小说阅读 Book · 漫画阅读 Comic · 社交动态 Moment · 即时通讯 Message
 * 运营活动 Activity · 教育学习 Course · 办公效率 Note · 本地生活 Local
 * 餐饮美食 Recipe · 旅游出行 Trip · 体育资讯 Sport · 母婴育儿 Baby
 * 健康运动 Workout · 汽车服务 Vehicle · 招聘求职 Job · 房产家居 House
 * 美业预约 Beauty · 摄影相册 Photo
 */
export const LAYOUT_APPS: readonly LayoutApp[] = [
  "data",
  "commerce",
  "video",
  "music",
  "news",
  "blog",
  "article",
  "books",
  "comics",
  "social",
  "chat",
  "campaign",
  "education",
  "office",
  "lifestyle",
  "food",
  "travel",
  "sports",
  "parenting",
  "health",
  "auto",
  "jobs",
  "housing",
  "beauty",
  "photo",
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
  "skills",
] as const satisfies readonly LayoutPage[];

const APP_ACCOUNT_PAGES = [
  ...ACCOUNT_PAGES,
  "upgrade",
] as const satisfies readonly LayoutPage[];

const CONTENT_PAGES = [
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
  "published",
  "drafts",
  "users",
  "user",
  ...APP_ACCOUNT_PAGES,
] as const satisfies readonly LayoutPage[];

const CONTENT_TABS = [
  "home",
  "category",
  "rank",
  "user",
] as const satisfies readonly LayoutPage[];

/** News / notices / sports — portal + article. */
export function isNewsLikeApp(
  app: LayoutApp | LayoutKind | null | undefined,
): boolean {
  return app === "news" || app === "info" || app === "sports";
}

/** Long-form reading (article stream — not book/comic spreads). */
export function isArticleLikeApp(
  app: LayoutApp | LayoutKind | null | undefined,
): boolean {
  return (
    app === "blog" ||
    app === "article" ||
    app === "education" ||
    app === "office"
  );
}

/** Novel / comic detail = book-like reader (landscape spread, portrait single). */
export function isBookReaderApp(
  app: LayoutApp | LayoutKind | null | undefined,
): boolean {
  return app === "books" || app === "comics";
}

/** Cover + body cards (local services, campaigns). */
export function isLocalLikeApp(
  app: LayoutApp | LayoutKind | null | undefined,
): boolean {
  return (
    app === "campaign" ||
    app === "lifestyle" ||
    app === "food" ||
    app === "travel" ||
    app === "parenting" ||
    app === "health" ||
    app === "auto" ||
    app === "jobs" ||
    app === "housing" ||
    app === "beauty" ||
    app === "photo"
  );
}

export function isCatalogApp(
  app: LayoutApp | LayoutKind | null | undefined,
): boolean {
  return (
    isNewsLikeApp(app) ||
    isArticleLikeApp(app) ||
    isBookReaderApp(app) ||
    isLocalLikeApp(app)
  );
}

/** toC record pages that can show a comment list + composer dock. */
export function isCommentableApp(
  app: LayoutApp | LayoutKind | null | undefined,
): boolean {
  if (!app || app === "data" || app === "chat" || app === "cart" || app === "order") {
    return false;
  }
  return true;
}

/** Bought goods / booked services — reviews with stars. Everything else is plain comments. */
export function isRateableApp(
  app: LayoutApp | LayoutKind | null | undefined,
): boolean {
  return isPurchasableApp(app);
}

/** Paid goods / tickets / booked services — review only after a purchase. */
export function isPurchasableApp(
  app: LayoutApp | LayoutKind | null | undefined,
): boolean {
  return (
    app === "commerce" ||
    app === "travel" ||
    app === "lifestyle" ||
    app === "beauty" ||
    app === "auto"
  );
}

export function reviewRequiresPurchase(opts: {
  app?: LayoutApp | LayoutKind | null;
  price?: number | null;
  hasBuy?: boolean;
}): boolean {
  if (isPurchasableApp(opts.app)) return true;
  return Boolean(
    opts.hasBuy && opts.price != null && Number.isFinite(opts.price) && opts.price > 0,
  );
}

/** Spreadsheet / list / grid / charts — not a record form. */
export const DATA_LIST_VIEW_PAGES = [
  "table",
  "list",
  "grid",
  "charts",
  "bar",
  "hbar",
  "line",
  "pie",
  "area",
  "doughnut",
] as const satisfies readonly LayoutPage[];

export type DataListViewPage = (typeof DATA_LIST_VIEW_PAGES)[number];

/** 数据管理 picker: 表格、列表、网格、图表、柱状图… + 表单. */
export const DATA_VIEW_PAGES = [
  ...DATA_LIST_VIEW_PAGES,
  "form",
] as const satisfies readonly LayoutPage[];

export function isDataListViewPage(
  page: LayoutPage | null | undefined,
): page is DataListViewPage {
  return (
    typeof page === "string" &&
    (DATA_LIST_VIEW_PAGES as readonly string[]).includes(page)
  );
}

export function isDataFormPage(page: LayoutPage | null | undefined): boolean {
  return page === "form";
}

/** result-view DisplayKind (`charts` → `combined`). */
export function displayKindFromDataPage(page: LayoutPage): string | null {
  if (page === "charts") return "combined";
  if (isDataListViewPage(page)) return page;
  return null;
}

export function dataPageFromDisplayKind(kind: string): DataListViewPage | null {
  if (kind === "combined") return "charts";
  if (
    kind !== "charts" &&
    (DATA_LIST_VIEW_PAGES as readonly string[]).includes(kind)
  ) {
    return kind as DataListViewPage;
  }
  return null;
}

export const LAYOUT_PAGES_BY_APP: Record<LayoutApp, readonly LayoutPage[]> = {
  data: DATA_VIEW_PAGES,
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
    "create",
    "published",
    "drafts",
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
    "published",
    "drafts",
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
    "published",
    "drafts",
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
    "published",
    "drafts",
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
    "published",
    "drafts",
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
    "published",
    "drafts",
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
    "published",
    "drafts",
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
    "published",
    "drafts",
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
    "published",
    "drafts",
    "detail",
    ...APP_ACCOUNT_PAGES,
  ],
  campaign: CONTENT_PAGES,
  education: CONTENT_PAGES,
  books: CONTENT_PAGES,
  comics: CONTENT_PAGES,
  lifestyle: CONTENT_PAGES,
  food: CONTENT_PAGES,
  travel: CONTENT_PAGES,
  sports: CONTENT_PAGES,
  parenting: CONTENT_PAGES,
  health: CONTENT_PAGES,
  auto: CONTENT_PAGES,
  jobs: CONTENT_PAGES,
  housing: CONTENT_PAGES,
  beauty: CONTENT_PAGES,
  photo: CONTENT_PAGES,
  office: CONTENT_PAGES,
};

/** Saved `info` pages stay valid; picker shows them as `news`. */
const LAYOUT_APP_ALIASES = { info: "news" } as const satisfies Record<
  string,
  LayoutApp
>;

export const LAYOUT_KINDS: readonly LayoutKind[] = [
  ...LAYOUT_APPS,
  "info",
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
  education: "layout.education",
  books: "layout.books",
  comics: "layout.comics",
  lifestyle: "layout.lifestyle",
  food: "layout.food",
  travel: "layout.travel",
  sports: "layout.sports",
  parenting: "layout.parenting",
  health: "layout.health",
  auto: "layout.auto",
  jobs: "layout.jobs",
  housing: "layout.housing",
  beauty: "layout.beauty",
  photo: "layout.photo",
  office: "layout.office",
};

const PAGE_I18N: Record<LayoutPage, `layout.page.${LayoutPage}`> = {
  home: "layout.page.home",
  search: "layout.page.search",
  history: "layout.page.history",
  rank: "layout.page.rank",
  category: "layout.page.category",
  recommend: "layout.page.recommend",
  list: "layout.page.list",
  table: "layout.page.table",
  grid: "layout.page.grid",
  charts: "layout.page.charts",
  bar: "layout.page.bar",
  hbar: "layout.page.hbar",
  line: "layout.page.line",
  pie: "layout.page.pie",
  area: "layout.page.area",
  doughnut: "layout.page.doughnut",
  form: "layout.page.form",
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
  published: "layout.page.published",
  drafts: "layout.page.drafts",
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
  skills: "layout.page.skills",
  scan: "layout.page.scan",
};

export function isLayoutApp(v: unknown): v is LayoutApp {
  return (
    typeof v === "string" &&
    ((LAYOUT_APPS as readonly string[]).includes(v) || v in LAYOUT_APP_ALIASES)
  );
}

/** Notices (`info`) use the same portal as news. */
export function canonicalLayoutApp(app: LayoutApp): LayoutApp {
  return app === "info" ? "news" : app;
}

export function canonicalizeLayoutSpec(spec: LayoutSpec): LayoutSpec {
  const app = canonicalLayoutApp(spec.app);
  if (app === spec.app) return spec;
  const pages = LAYOUT_PAGES_BY_APP[app];
  const page = pages.includes(spec.page) ? spec.page : defaultPageForApp(app);
  return { app, page };
}

/** DB Skill row used to overlay inference (query / upload, no code change). */
export type SkillHint = {
  name: string;
  title?: string | null;
  titleEn?: string | null;
  tableName?: string | null;
  family?: string | null;
  tokens?: string[];
  description?: string | null;
  /** File URL for the SKILL.md body (`/skills/education.md`). */
  url?: string | null;
};

let skillHints: SkillHint[] = [];

export function setSkillHints(rows: SkillHint[]) {
  skillHints = Array.isArray(rows) ? rows : [];
}

export function getSkillHints(): SkillHint[] {
  return skillHints;
}

export function familyToLayoutApp(
  family: string | null | undefined,
): LayoutApp {
  const f = (family || "").trim().toLowerCase();
  if (isLayoutApp(f)) return canonicalLayoutApp(f);
  if (f === "media") return "video";
  if (f === "local" || f === "catalog") return "lifestyle";
  if (f === "read" || f === "article") return "article";
  if (f === "news") return "news";
  return "data";
}

export function layoutAppFromSkill(skill: SkillHint): LayoutApp {
  if (isLayoutApp(skill.name)) return canonicalLayoutApp(skill.name);
  return familyToLayoutApp(skill.family);
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
  if (page === "create" && app) return layoutTabLabel("create", app);
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
  education: "layout.users.list.education",
  books: "layout.users.list.books",
  comics: "layout.users.list.comics",
  lifestyle: "layout.users.list.lifestyle",
  food: "layout.users.list.food",
  travel: "layout.users.list.travel",
  sports: "layout.users.list.sports",
  parenting: "layout.users.list.parenting",
  health: "layout.users.list.health",
  auto: "layout.users.list.auto",
  jobs: "layout.users.list.jobs",
  housing: "layout.users.list.housing",
  beauty: "layout.users.list.beauty",
  photo: "layout.users.list.photo",
  office: "layout.users.list.office",
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
  education: "layout.users.detail.education",
  books: "layout.users.detail.books",
  comics: "layout.users.detail.comics",
  lifestyle: "layout.users.detail.lifestyle",
  food: "layout.users.detail.food",
  travel: "layout.users.detail.travel",
  sports: "layout.users.detail.sports",
  parenting: "layout.users.detail.parenting",
  health: "layout.users.detail.health",
  auto: "layout.users.detail.auto",
  jobs: "layout.users.detail.jobs",
  housing: "layout.users.detail.housing",
  beauty: "layout.users.detail.beauty",
  photo: "layout.users.detail.photo",
  office: "layout.users.detail.office",
};

export function layoutUserDetailLabel(app?: LayoutApp): string {
  if (app) {
    const key = USER_DETAIL_I18N[app];
    if (key) return t(key);
  }
  return t("layout.users.detail.data");
}

/** Contact / channel / store page — not the “Me” hub (`user`). */
export function contactLayoutFor(
  from: { layoutKind?: LayoutKind; layoutSpec?: LayoutSpec },
): { layoutKind: LayoutKind; layoutSpec: LayoutSpec } {
  const hinted = from.layoutSpec?.app;
  const app =
    hinted && hinted !== "data"
      ? hinted
      : appFromKind(from.layoutKind);
  const kind: LayoutKind =
    from.layoutKind &&
    from.layoutKind !== "data" &&
    from.layoutKind !== "cart" &&
    from.layoutKind !== "order"
      ? from.layoutKind
      : app;
  return { layoutKind: kind, layoutSpec: { app, page: "profile" } };
}

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
  if (app === "data" && allowed.includes("table")) return "table";
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
  blog: ["home", "category", "rank", "user"],
  article: ["home", "category", "rank", "user"],
  social: ["list", "users", "feed", "user"],
  chat: ["list", "users", "feed", "user"],
  campaign: CONTENT_TABS,
  education: CONTENT_TABS,
  books: CONTENT_TABS,
  comics: CONTENT_TABS,
  lifestyle: CONTENT_TABS,
  food: CONTENT_TABS,
  travel: CONTENT_TABS,
  sports: CONTENT_TABS,
  parenting: CONTENT_TABS,
  health: CONTENT_TABS,
  auto: CONTENT_TABS,
  jobs: CONTENT_TABS,
  housing: CONTENT_TABS,
  beauty: CONTENT_TABS,
  photo: CONTENT_TABS,
  office: CONTENT_TABS,
};

export function shouldShowAppTabs(
  app: LayoutApp,
  page?: LayoutPage,
  nav?: LayoutNav | null,
): boolean {
  const tabs = (nav?.tabs?.length
    ? nav.tabs.map((t) => t.slot)
    : APP_TABS_BY_APP[app]
  ).filter((slot) => !isProducerStudioPage(slot));
  if (!tabs.length) return false;
  if (!page) return true;
  if (tabs.includes(page)) return true;
  if (nav?.tabs.some((t) => t.spec.page === page)) return true;
  if (isMeHubPage(page)) return true;
  return page === "list" || page === "home" || page === "feed";
}

/** In-app jump buttons (item / search / cart / …) — remap to any existing page. */
export const JUMP_SLOTS = [
  "openRow",
  "openSearch",
  "openScan",
  "openCart",
  "openCheckout",
  "openProfile",
  "openAuthor",
  "openCategory",
  "openChat",
  "openRelated",
  "openCreate",
  "openOrders",
  "openAddress",
] as const;

export type JumpSlot = (typeof JUMP_SLOTS)[number];

export function isJumpSlot(v: unknown): v is JumpSlot {
  return typeof v === "string" && (JUMP_SLOTS as readonly string[]).includes(v);
}

/** Tab slots a composed app can add (existing page types only). */
export const NAV_TAB_CANDIDATES: readonly LayoutPage[] = [
  "home",
  "feed",
  "list",
  "category",
  "rank",
  "history",
  "recommend",
  "search",
  "cart",
  "orders",
  "users",
  "user",
] as const;

/** One bottom/top tab: chrome slot + destination page (any app.page). */
export type LayoutNavTab = {
  slot: LayoutPage;
  spec: LayoutSpec;
  label?: string;
};

/**
 * Composed app shell: tabs and jumps point at existing LayoutSpecs.
 * Only the home tab is typically unique; everything else reuses a known page.
 */
export type LayoutNav = {
  host: LayoutApp;
  tabs: LayoutNavTab[];
  jumps: Partial<Record<JumpSlot, LayoutSpec>>;
  pages?: Partial<Record<LayoutPage, LayoutSpec>>;
};

export function isRecordLayoutPage(page: LayoutPage | null | undefined): boolean {
  return (
    page === "detail" ||
    page === "player" ||
    page === "form" ||
    page === "orderDetail" ||
    page === "addressDetail" ||
    page === "profile"
  );
}

export function defaultRecordPage(app: LayoutApp): LayoutPage {
  if (app === "music" || app === "video") return "player";
  if (app === "data") return "form";
  const allowed = LAYOUT_PAGES_BY_APP[app];
  if (allowed.includes("detail")) return "detail";
  return defaultPageForApp(app, "detail");
}

export function defaultLayoutNav(app: LayoutApp): LayoutNav {
  const host = canonicalLayoutApp(app);
  return {
    host,
    tabs: APP_TABS_BY_APP[host].map((slot) => ({
      slot,
      spec: { app: host, page: slot },
    })),
    jumps: {},
  };
}

export function cloneLayoutNav(nav: LayoutNav): LayoutNav {
  return {
    host: nav.host,
    tabs: nav.tabs.map((t) => ({
      slot: t.slot,
      spec: { ...t.spec },
      ...(t.label ? { label: t.label } : {}),
    })),
    jumps: { ...nav.jumps },
    ...(nav.pages ? { pages: { ...nav.pages } } : {}),
  };
}

function parseSpecPair(raw: unknown): LayoutSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { app?: unknown; page?: unknown };
  if (isLayoutApp(o.app) && isLayoutPage(o.page)) {
    return canonicalizeLayoutSpec({ app: o.app, page: o.page });
  }
  return null;
}

function parseNavTab(raw: unknown, host: LayoutApp): LayoutNavTab | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { slot?: unknown; spec?: unknown; page?: unknown; app?: unknown; label?: unknown };
  const spec =
    parseSpecPair(o.spec) ??
    (isLayoutApp(o.app) && isLayoutPage(o.page)
      ? canonicalizeLayoutSpec({ app: o.app, page: o.page })
      : null);
  const slot = isLayoutPage(o.slot)
    ? o.slot
    : spec
      ? spec.page
      : isLayoutPage(o.page)
        ? o.page
        : null;
  if (!slot) return null;
  const resolved = spec ?? { app: host, page: slot };
  const label = typeof o.label === "string" && o.label.trim() ? o.label.trim() : undefined;
  return { slot, spec: resolved, ...(label ? { label } : {}) };
}

export function parseLayoutNav(raw: unknown, fallbackApp: LayoutApp): LayoutNav {
  const fallback = defaultLayoutNav(fallbackApp);
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as {
    host?: unknown;
    tabs?: unknown;
    jumps?: unknown;
    pages?: unknown;
  };
  const host = isLayoutApp(o.host) ? canonicalLayoutApp(o.host) : fallback.host;
  const tabs: LayoutNavTab[] = [];
  if (Array.isArray(o.tabs)) {
    for (const item of o.tabs) {
      const tab = parseNavTab(item, host);
      if (tab) tabs.push(tab);
    }
  }
  const jumps: Partial<Record<JumpSlot, LayoutSpec>> = {};
  if (o.jumps && typeof o.jumps === "object" && !Array.isArray(o.jumps)) {
    for (const [k, v] of Object.entries(o.jumps as Record<string, unknown>)) {
      if (!isJumpSlot(k)) continue;
      const spec = parseSpecPair(v);
      if (spec) jumps[k] = spec;
    }
  }
  const pages: Partial<Record<LayoutPage, LayoutSpec>> = {};
  if (o.pages && typeof o.pages === "object" && !Array.isArray(o.pages)) {
    for (const [k, v] of Object.entries(o.pages as Record<string, unknown>)) {
      if (!isLayoutPage(k)) continue;
      const spec = parseSpecPair(v);
      if (spec) pages[k] = spec;
    }
  }
  return sanitizeLayoutNav({
    host,
    tabs: tabs.length ? tabs : defaultLayoutNav(host).tabs,
    jumps,
    ...(Object.keys(pages).length ? { pages } : {}),
  });
}

/** Producer compose lives in Me — never a consumer bottom tab. */
export function sanitizeLayoutNav(nav: LayoutNav): LayoutNav {
  const next = cloneLayoutNav(nav);
  next.tabs = next.tabs.filter(
    (t) =>
      !isProducerStudioPage(t.slot) && !isProducerStudioPage(t.spec.page),
  );
  if (!next.tabs.length) {
    const host = canonicalLayoutApp(next.host);
    next.tabs = APP_TABS_BY_APP[host].map((slot) => ({
      slot,
      spec: { app: host, page: slot },
    }));
  }
  return next;
}

export function layoutNavIsCustom(nav: LayoutNav): boolean {
  const def = defaultLayoutNav(nav.host);
  if (nav.tabs.length !== def.tabs.length) return true;
  for (let i = 0; i < nav.tabs.length; i++) {
    const a = nav.tabs[i]!;
    const b = def.tabs[i]!;
    if (a.slot !== b.slot || !specsEqual(a.spec, b.spec)) return true;
  }
  if (Object.keys(nav.jumps).length) return true;
  if (nav.pages && Object.keys(nav.pages).length) return true;
  return false;
}

export function setNavTab(
  nav: LayoutNav,
  slot: LayoutPage,
  spec: LayoutSpec,
  label?: string,
): LayoutNav {
  if (isProducerStudioPage(slot) || isProducerStudioPage(spec.page)) {
    return cloneLayoutNav(nav);
  }
  const next = cloneLayoutNav(nav);
  const resolved = canonicalizeLayoutSpec(spec);
  const idx = next.tabs.findIndex((t) => t.slot === slot);
  const tab: LayoutNavTab = {
    slot,
    spec: resolved,
    ...(label || next.tabs[idx]?.label
      ? { label: label ?? next.tabs[idx]?.label }
      : {}),
  };
  if (idx >= 0) next.tabs[idx] = tab;
  else next.tabs.push(tab);
  return next;
}

export function addNavTab(
  nav: LayoutNav,
  slot: LayoutPage,
  spec?: LayoutSpec,
): LayoutNav {
  if (isProducerStudioPage(slot) || (spec && isProducerStudioPage(spec.page))) {
    return cloneLayoutNav(nav);
  }
  if (nav.tabs.some((t) => t.slot === slot)) {
    return spec ? setNavTab(nav, slot, spec) : cloneLayoutNav(nav);
  }
  const next = cloneLayoutNav(nav);
  const tab: LayoutNavTab = {
    slot,
    spec: spec ?? { app: nav.host, page: slot },
  };
  const order = APP_TABS_BY_APP[canonicalLayoutApp(nav.host)];
  const ideal = order.indexOf(slot);
  if (ideal >= 0) {
    let insertAt = next.tabs.length;
    for (let i = 0; i < next.tabs.length; i++) {
      const oi = order.indexOf(next.tabs[i]!.slot);
      if (oi < 0 || oi > ideal) {
        insertAt = i;
        break;
      }
    }
    next.tabs.splice(insertAt, 0, tab);
  } else {
    const beforeUser = next.tabs.findIndex((t) => t.slot === "user");
    if (beforeUser >= 0) next.tabs.splice(beforeUser, 0, tab);
    else next.tabs.push(tab);
  }
  return next;
}

export function removeNavTab(nav: LayoutNav, slot: LayoutPage): LayoutNav {
  const next = cloneLayoutNav(nav);
  const tabs = next.tabs.filter((t) => t.slot !== slot);
  next.tabs = tabs.length ? tabs : nav.tabs;
  return next;
}

export function setNavJump(
  nav: LayoutNav,
  slot: JumpSlot,
  spec: LayoutSpec | null,
): LayoutNav {
  const next = cloneLayoutNav(nav);
  if (!spec) delete next.jumps[slot];
  else next.jumps[slot] = canonicalizeLayoutSpec(spec);
  return next;
}

export function setNavPage(
  nav: LayoutNav,
  page: LayoutPage,
  spec: LayoutSpec | null,
): LayoutNav {
  const next = cloneLayoutNav(nav);
  if (!spec) {
    if (next.pages) delete next.pages[page];
    if (next.pages && !Object.keys(next.pages).length) delete next.pages;
    return next;
  }
  next.pages = { ...(next.pages || {}), [page]: canonicalizeLayoutSpec(spec) };
  return next;
}

export function resolveNavTab(nav: LayoutNav, slot: LayoutPage): LayoutSpec {
  const tab = nav.tabs.find((t) => t.slot === slot);
  return tab?.spec ?? { app: nav.host, page: slot };
}

export function defaultJumpSpec(current: LayoutSpec, slot: JumpSlot): LayoutSpec {
  const app = current.app;
  switch (slot) {
    case "openRow":
      return { app, page: defaultRecordPage(app) };
    case "openSearch":
      return { app, page: "search" };
    case "openScan":
      return { app, page: "scan" };
    case "openCart":
      return { app: "commerce", page: "cart" };
    case "openCheckout":
      return { app: "commerce", page: "order" };
    case "openProfile":
      return { app, page: "profile" };
    case "openAuthor":
      return { app, page: "profile" };
    case "openCategory":
      return { app, page: "category" };
    case "openChat":
      return { app: "chat", page: "list" };
    case "openRelated":
      return { app, page: defaultRecordPage(app) };
    case "openCreate":
      return { app, page: app === "data" ? "form" : "create" };
    case "openOrders":
      return { app: "commerce", page: "orders" };
    case "openAddress":
      return { app: "commerce", page: "address" };
    default:
      return current;
  }
}

export function resolveNavJump(
  nav: LayoutNav,
  slot: JumpSlot,
  current: LayoutSpec,
): LayoutSpec {
  return nav.jumps[slot] ?? defaultJumpSpec(current, slot);
}

export function jumpSlotForPage(page: LayoutPage): JumpSlot | null {
  if (page === "search") return "openSearch";
  if (page === "scan") return "openScan";
  if (page === "cart") return "openCart";
  if (page === "order") return "openCheckout";
  if (page === "profile") return "openProfile";
  if (page === "orders" || page === "orderDetail") return "openOrders";
  if (page === "address" || page === "addressDetail") return "openAddress";
  if (page === "category") return "openCategory";
  if (page === "create") return "openCreate";
  return null;
}

/** Tab click / Me-hub / in-app page: tab override, then page map, then jump, then host. */
export function resolveNavSelect(nav: LayoutNav, page: LayoutPage): LayoutSpec {
  const tab = nav.tabs.find((t) => t.slot === page);
  if (tab) return tab.spec;
  const mapped = nav.pages?.[page];
  if (mapped) return mapped;
  const jump = jumpSlotForPage(page);
  if (jump && nav.jumps[jump]) return nav.jumps[jump]!;
  return { app: nav.host, page };
}

export function matchingNavTabSlot(
  nav: LayoutNav,
  spec: LayoutSpec,
  preferred?: LayoutPage | null,
): LayoutPage | null {
  if (preferred) {
    const tab = nav.tabs.find((t) => t.slot === preferred);
    if (tab && (specsEqual(tab.spec, spec) || tab.spec.page === spec.page)) {
      return preferred;
    }
  }
  const exact = nav.tabs.find((t) => specsEqual(t.spec, spec));
  if (exact) return exact.slot;
  const byPage = nav.tabs.find((t) => t.slot === spec.page);
  return byPage?.slot ?? null;
}

const JUMP_I18N: Record<JumpSlot, `layout.nav.jump.${JumpSlot}`> = {
  openRow: "layout.nav.jump.openRow",
  openSearch: "layout.nav.jump.openSearch",
  openScan: "layout.nav.jump.openScan",
  openCart: "layout.nav.jump.openCart",
  openCheckout: "layout.nav.jump.openCheckout",
  openProfile: "layout.nav.jump.openProfile",
  openAuthor: "layout.nav.jump.openAuthor",
  openCategory: "layout.nav.jump.openCategory",
  openChat: "layout.nav.jump.openChat",
  openRelated: "layout.nav.jump.openRelated",
  openCreate: "layout.nav.jump.openCreate",
  openOrders: "layout.nav.jump.openOrders",
  openAddress: "layout.nav.jump.openAddress",
};

export function jumpSlotLabel(slot: JumpSlot): string {
  return t(JUMP_I18N[slot]);
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
  if (page === "create" && app) {
    if (
      app === "blog" ||
      app === "article" ||
      app === "news" ||
      app === "info" ||
      app === "office" ||
      app === "books"
    ) {
      return t("layout.tab.write");
    }
    if (app === "comics" || app === "video" || app === "music" || app === "photo") {
      return t("layout.tab.upload");
    }
    if (app === "education") return t("layout.tab.submit");
    if (app === "commerce") return t("layout.tab.sell");
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
    pageKind === "create" || pageKind === "detail"
      ? app === "data" && allowed.includes("form")
        ? "form"
        : pageKind === "create"
          ? "create"
          : app === "music"
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
  const app = canonicalLayoutApp(isLayoutApp(kind) ? kind : "data");
  return { app, page: defaultPageForApp(app, pageKind) };
}

export function legacyKindFromSpec(spec: LayoutSpec): LayoutKind {
  if (spec.page === "cart") return "cart";
  if (spec.page === "order") return "order";
  return spec.app;
}

export function appFromKind(kind: LayoutKind | null | undefined): LayoutApp {
  if (kind === "cart" || kind === "order") return "commerce";
  return isLayoutApp(kind) ? canonicalLayoutApp(kind) : "data";
}

function remapDataLayoutPage(app: LayoutApp, page: unknown): unknown {
  if (app !== "data") return page;
  if (page === "detail" || page === "create") return "form";
  return page;
}

export function parseLayoutSpec(
  raw: unknown,
  pageKind?: "list" | "detail" | "create",
): LayoutSpec {
  if (raw && typeof raw === "object") {
    const o = raw as { app?: unknown; page?: unknown };
    if (isLayoutApp(o.app)) {
      const requested = remapDataLayoutPage(o.app, o.page);
      const pages = LAYOUT_PAGES_BY_APP[o.app];
      const page =
        isLayoutPage(requested) && pages.includes(requested)
          ? requested
          : defaultPageForApp(o.app, pageKind);
      return canonicalizeLayoutSpec({ app: o.app, page });
    }
  }
  if (typeof raw === "string" && raw.includes(".")) {
    const [a, p] = raw.split(".", 2);
    const page = isLayoutApp(a) ? remapDataLayoutPage(a, p) : p;
    if (
      isLayoutApp(a) &&
      isLayoutPage(page) &&
      LAYOUT_PAGES_BY_APP[a].includes(page)
    ) {
      return canonicalizeLayoutSpec({ app: a, page });
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
    "skill",
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
  if (has("news", "headline", "新闻", "资讯")) add(scores, "news", 34);
  if (has("blog", "博客")) add(scores, "blog", 34);
  if (has("article", "essay", "文章")) add(scores, "article", 32);
  if (has("info", "information", "notice", "announcement", "资讯公告", "公告", "通知")) {
    add(scores, "news", 30);
  }
  if (has("course", "lesson", "curriculum", "课程", "教育学习", "网课")) {
    add(scores, "education", 36);
  }
  if (has("book", "ebook", "textbook", "novel", "图书", "图书阅读", "小说", "电子书")) {
    add(scores, "books", 36);
  }
  if (has("comic", "manga", "manhua", "漫画", "漫画阅读")) {
    add(scores, "comics", 36);
  }
  if (has("local", "localservice", "errand", "本地生活", "到家", "到店")) {
    add(scores, "lifestyle", 34);
  }
  if (has("recipe", "dish", "cuisine", "catering", "菜谱", "餐饮美食", "美食")) {
    add(scores, "food", 36);
  }
  if (has("trip", "hotel", "itinerary", "旅游", "旅游出行", "行程", "民宿")) {
    add(scores, "travel", 36);
  }
  if (has("sport", "match", "league", "fixture", "体育", "体育资讯", "赛事")) {
    add(scores, "sports", 36);
  }
  if (has("baby", "parenting", "infant", "母婴", "母婴育儿", "育儿")) {
    add(scores, "parenting", 36);
  }
  if (has("workout", "fitness", "yoga", "健康运动", "健身", "运动打卡")) {
    add(scores, "health", 36);
  }
  if (has("vehicle", "carinfo", "garage", "汽车", "汽车服务", "车型")) {
    add(scores, "auto", 36);
  }
  if (has("job", "recruit", "vacancy", "招聘", "招聘求职", "职位")) {
    add(scores, "jobs", 36);
  }
  if (has("house", "estate", "apartment", "房产", "房产家居", "房源")) {
    add(scores, "housing", 36);
  }
  if (has("beauty", "salon", "spa", "美业", "美业预约", "美发")) {
    add(scores, "beauty", 36);
  }
  if (has("photo", "gallery", "album", "摄影", "摄影相册", "相册")) {
    add(scores, "photo", 34);
  }
  if (
    tokens.includes("note") ||
    has("notebook", "todolist", "办公效率", "待办", "笔记")
  ) {
    add(scores, "office", 36);
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
  for (const skill of skillHints) {
    const toks = [
      skill.name,
      skill.title,
      skill.titleEn,
      skill.tableName,
      ...(skill.tokens ?? []),
    ].filter((x): x is string => Boolean(x && String(x).trim()));
    if (toks.length && has(...toks)) {
      add(scores, layoutAppFromSkill(skill), 38);
    }
  }
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
  hit(/\b(headline|newstime|source)\b|新闻|头条|资讯/, "news", 8);
  hit(/\b(blog|blogtitle)\b|博客/, "blog", 8);
  hit(/\b(article|bodyhtml|markdown)\b|正文|文章/, "article", 8);
  hit(/\b(notice|announcement|infotitle)\b|资讯公告|公告/, "news", 8);
  hit(/\b(campaign|activity|starttime|endtime|promo)\b|活动|运营|促销/, "campaign", 8);
  hit(/\b(course|lesson|curriculum)\b|课程|教育学习|网课/, "education", 10);
  hit(/\b(ebook|textbook|isbn|novel)\b|图书阅读|小说|电子书/, "books", 10);
  hit(/\b(comic|manga|manhua)\b|漫画阅读|漫画/, "comics", 10);
  hit(/\b(localservice|errand)\b|本地生活|到家|到店/, "lifestyle", 10);
  hit(/\b(recipe|cuisine|catering)\b|餐饮美食|菜谱|美食/, "food", 10);
  hit(/\b(itinerary|hotel|destination)\b|旅游出行|行程|民宿/, "travel", 10);
  hit(/\b(match|league|fixture|scoreboard)\b|体育资讯|赛事/, "sports", 10);
  hit(/\b(parenting|infant|monthage)\b|母婴育儿|育儿/, "parenting", 10);
  hit(/\b(workout|fitness|kcal)\b|健康运动|健身/, "health", 10);
  hit(/\b(vehicle|garage|mileage)\b|汽车服务|车型/, "auto", 10);
  hit(/\b(recruit|vacancy|salary)\b|招聘求职|职位/, "jobs", 10);
  hit(/\b(estate|apartment|floorarea)\b|房产家居|房源/, "housing", 10);
  hit(/\b(salon|spa|manicure)\b|美业预约|美发/, "beauty", 10);
  hit(/\b(gallery|exif|shotat)\b|摄影相册|相册/, "photo", 10);
  hit(/\b(notebook|todolist)\b|办公效率|待办|笔记/, "office", 10);
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

  const winner = pickWinner(scores, table);
  return winner === "info" ? "news" : winner;
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
  if (hayHits(hay, ["form", "recordform"], ["表单"])) {
    return pick("form");
  }
  if (hayHits(hay, ["spreadsheet", "datatable"], ["表格"])) {
    return pick("table");
  }
  if (hayHits(hay, ["grid", "gallery"], ["网格", "宫格"])) {
    return pick("grid");
  }
  if (hayHits(hay, ["columnchart"], ["柱状图", "柱图"])) {
    return pick("bar");
  }
  if (hayHits(hay, ["barchart", "horizontalbar"], ["条形图"])) {
    return pick("hbar");
  }
  if (hayHits(hay, ["linechart"], ["折线图", "折线"])) {
    return pick("line");
  }
  if (hayHits(hay, ["piechart"], ["饼状图", "饼图"])) {
    return pick("pie");
  }
  if (hayHits(hay, ["areachart"], ["面积图"])) {
    return pick("area");
  }
  if (hayHits(hay, ["doughnut", "donut"], ["环形图", "圆环"])) {
    return pick("doughnut");
  }
  if (hayHits(hay, ["charts", "chart"], ["图表"])) {
    return pick("charts");
  }
  // Explore tabs first — "playCount" / 播放次数 must not steal rank/history.
  if (hayHits(hay, ["search", "find"], ["搜索", "查找", "检索"])) {
    return pick("search");
  }
  if (
    hayHits(
      hay,
      ["scan", "qrcode", "qr", "localfile"],
      ["扫码", "扫一扫", "二维码", "扫描本地", "本地文件"],
    )
  ) {
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
  if (hayHits(hay, ["mydrafts", "drafts", "draftbox"], ["草稿箱", "草稿"])) {
    return pick("drafts");
  }
  if (
    hayHits(
      hay,
      ["mypublished", "published", "myposts", "myworks"],
      ["已发布", "我的作品", "我的发布"],
    )
  ) {
    return pick("published");
  }
  if (
    hayHits(
      hay,
      ["create", "compose", "publish", "newpost"],
      ["新增", "新建", "创建", "发布", "发帖", "发动态"],
    )
  ) {
    return pick("create") ?? pick("form");
  }
  if (
    hayHits(
      hay,
      ["detail", "editing", "player", "playback"],
      ["详情", "明细", "编辑", "修改", "播放页", "播放器", "观看页"],
    )
  ) {
    return pick(app === "data" ? "form" : app === "music" ? "player" : "detail");
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
  if (hayHits(hay, ["skills", "skill"], ["场景技能", "技能库"])) {
    return pick("skills");
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

function inferAppFromPhrase(hay: string): LayoutApp | null {
  const scores: KindScore = { data: 0 };
  scoreFieldsAndComments(hay, scores);
  scoreTableName(hay, scores);
  if (hayHits(hay, ["shopping", "shop", "taobao"], ["电商购物", "电商", "购物"])) {
    add(scores, "commerce", 18);
  }
  if (hayHits(hay, ["youtube", "tiktok"], ["视频影像", "短视频"])) {
    add(scores, "video", 18);
  }
  const winner = pickWinner(scores, "");
  if (winner === "cart" || winner === "order") return "commerce";
  if (winner === "data" || (scores[winner] ?? 0) < 10) return null;
  return canonicalLayoutApp(winner as LayoutApp);
}

/** “视频排行 / 电商详情 / 播放页” → an existing app.page (no new page types). */
export function specFromUserPhrase(
  phrase: string,
  fallback: LayoutApp,
): LayoutSpec {
  const hay = phrase.trim();
  const app = inferAppFromPhrase(hay) ?? canonicalLayoutApp(fallback);
  const page =
    inferPageFromPrompt(hay, app) ??
    inferPageFromPrompt(hay, fallback) ??
    appLandingPage(app);
  return canonicalizeLayoutSpec({ app, page });
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
    page === "upgrade" ||
    page === "skills"
  );
}

/** Producer compose / published / drafts — opened from Me, not consumer tabs. */
export function isProducerStudioPage(
  page: LayoutPage | null | undefined,
): boolean {
  return page === "create" || page === "published" || page === "drafts";
}

export function isMeHubPage(page: LayoutPage | null | undefined): boolean {
  return (
    page === "user" ||
    page === "profile" ||
    isSettingsPage(page) ||
    isProducerStudioPage(page)
  );
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

/** Explore lists (分类 / 排行 / 历史…) — never a player or record form. */
export function isExploreListPage(page: LayoutPage | null | undefined): boolean {
  return isExploreLayoutPage(page) && page !== "scan";
}

/** Home / feed / list portals + explore lists — never a record form. */
export function isCatalogListPage(page: LayoutPage | null | undefined): boolean {
  return (
    page === "home" ||
    page === "feed" ||
    isDataListViewPage(page) ||
    isExploreListPage(page)
  );
}

/** toC content lists (home / list / feed / 分类 / 排行 / 搜索…). */
export function isConsumerCreateListPage(
  page: LayoutPage | null | undefined,
): boolean {
  return page === "home" || page === "list" || page === "feed" || isExploreListPage(page);
}

/** Scan-row 新增: toC list/grid pages that have an app compose page. */
export function shouldShowListCreate(
  app: LayoutApp | undefined,
  page: LayoutPage | undefined,
  surface: "list" | "detail" = "list",
): boolean {
  if (surface !== "list") return false;
  if (!app || app === "data") return false;
  if (!LAYOUT_PAGES_BY_APP[app].includes("create")) return false;
  if (!page) return true;
  return isConsumerCreateListPage(page);
}

function composePageForApp(app: LayoutApp): LayoutSpec {
  const a = canonicalLayoutApp(app);
  if (a === "data" || !LAYOUT_PAGES_BY_APP[a].includes("create")) {
    return { app: "data", page: "form" };
  }
  return { app: a, page: "create" };
}

/**
 * Create/compose target for a list/grid: infer the app from the bound table
 * (Video → video upload, Article → article editor, Moment → 想法…).
 * Weak inference keeps the open list's app — never nav.host.
 */
export function createSpecForListData(opts: {
  currentApp?: LayoutApp | null;
  currentPage?: LayoutPage | null;
  table?: string | null;
  columns?: string[] | null;
  comments?: SchemaComments | null;
}): LayoutSpec {
  const current = opts.currentApp
    ? canonicalLayoutApp(opts.currentApp)
    : undefined;
  if (opts.currentPage === "address") {
    return { app: current && current !== "data" ? current : "commerce", page: "addressDetail" };
  }
  const inferred = inferLayoutSpec({
    table: opts.table,
    columns: opts.columns,
    comments: opts.comments,
    pageKind: "create",
  });
  const fromData =
    inferred.app !== "data" ? canonicalLayoutApp(inferred.app) : null;
  const app = fromData ?? current;
  if (!app) return { app: "data", page: "form" };
  return composePageForApp(app);
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
const LYRIC_COLS = ["lyrics", "lyric", "lrc", "lyrictext"];
const QUALITY_COLS = ["qualitylist", "qualities", "qualityurls"];
const SUBTITLE_COLS = ["subtitlelist", "subtitles", "captions", "captionlist"];

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

function parseJsonArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      const v = JSON.parse(s);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function parseMediaQualities(raw: unknown): MediaQuality[] {
  const byLabel = new Map<VideoQualityLabel, string>();
  for (const item of parseJsonArray(raw)) {
    if (!item || typeof item !== "object") continue;
    const rec = item as { label?: unknown; url?: unknown; src?: unknown };
    const url = String(rec.url ?? rec.src ?? "").trim();
    if (!url) continue;
    const label = normalizeQualityLabel(String(rec.label ?? ""), url);
    if (!label) continue;
    byLabel.set(label, url);
  }
  return VIDEO_QUALITY_LADDER.filter((label) => byLabel.has(label)).map(
    (label) => ({ label, url: byLabel.get(label)! }),
  );
}

export function parseMediaSubtitles(raw: unknown): MediaSubtitle[] {
  const out: MediaSubtitle[] = [];
  for (const item of parseJsonArray(raw)) {
    if (!item || typeof item !== "object") continue;
    const rec = item as {
      lang?: unknown;
      language?: unknown;
      label?: unknown;
      url?: unknown;
      src?: unknown;
      vtt?: unknown;
    };
    const url = String(rec.url ?? rec.src ?? "").trim();
    const vtt = String(rec.vtt ?? "").trim();
    if (!url && !vtt) continue;
    const lang = String(rec.lang ?? rec.language ?? "und").trim() || "und";
    const label = String(rec.label ?? lang).trim() || lang;
    out.push({ lang, label, url: url || undefined, vtt: vtt || undefined });
  }
  return out;
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

export type MediaQuality = { label: string; url: string };
export type MediaSubtitle = { lang: string; label: string; url?: string; vtt?: string };

/** Player quality rungs — resolution only, never container names like MP4/WebM. */
export const VIDEO_QUALITY_LADDER = ["480P", "720P", "1080P", "2K", "4K"] as const;
export type VideoQualityLabel = (typeof VIDEO_QUALITY_LADDER)[number];

const QUALITY_ALIAS: Record<string, VideoQualityLabel> = {
  "320p": "480P",
  "360p": "480P",
  "480p": "480P",
  "480": "480P",
  "720p": "720P",
  "720": "720P",
  "1080p": "1080P",
  "1080": "1080P",
  "1440p": "2K",
  "1440": "2K",
  "2560": "2K",
  "2k": "2K",
  "2160p": "4K",
  "2160": "4K",
  "3840": "4K",
  "4k": "4K",
  uhd: "4K",
};

export function normalizeQualityLabel(
  label: string,
  url = "",
): VideoQualityLabel | null {
  const key = label.trim().toLowerCase().replace(/\s+/g, "");
  if (QUALITY_ALIAS[key]) return QUALITY_ALIAS[key];
  if (/^(mp4|webm|mkv|mov|源|source|auto|原画)$/.test(key)) {
    return inferQualityFromUrl(url);
  }
  return inferQualityFromUrl(url);
}

export function inferQualityFromUrl(url: string): VideoQualityLabel | null {
  const u = url.toLowerCase();
  if (/2160|3840|4k|uhd/.test(u)) return "4K";
  if (/1440|2560|2k/.test(u)) return "2K";
  if (/1080/.test(u)) return "1080P";
  if (/720/.test(u)) return "720P";
  if (/480/.test(u)) return "480P";
  if (/360|320/.test(u)) return "480P";
  return url.trim() ? "480P" : null;
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
  lyrics: string;
  qualities: MediaQuality[];
  subtitles: MediaSubtitle[];
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
    lyrics: pickByNames(cells, columns, LYRIC_COLS, table),
    qualities: parseMediaQualities([
      ...parseJsonArray(pickRaw(cells, columns, QUALITY_COLS, table)),
      ...(() => {
        const u = pickMediaUrl(cells, columns, "video", table);
        return u ? [{ label: inferQualityFromUrl(u) ?? "480P", url: u }] : [];
      })(),
    ]),
    subtitles: parseMediaSubtitles(
      pickRaw(cells, columns, SUBTITLE_COLS, table),
    ),
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
