/**
 * Business layout categories for generated pages.
 * Auto-matched from table / field names, overridable in the workspace toolbar.
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

/** Dropdown + persist id. Cart / order are extra page templates under commerce. */
export type LayoutKind =
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
  | "cart"
  | "order";

export const LAYOUT_KINDS: readonly LayoutKind[] = [
  "data",
  "campaign",
  "social",
  "chat",
  "news",
  "info",
  "blog",
  "article",
  "video",
  "music",
  "commerce",
  "cart",
  "order",
] as const;

const LAYOUT_I18N: Record<LayoutKind, `layout.${LayoutKind}`> = {
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
  cart: "layout.cart",
  order: "layout.order",
};

export function isLayoutKind(v: unknown): v is LayoutKind {
  return typeof v === "string" && (LAYOUT_KINDS as readonly string[]).includes(v);
}

export function layoutKindLabel(kind: LayoutKind): string {
  return t(LAYOUT_I18N[kind]);
}

/** Spreadsheet / form (existing table · grid · charts · detail form). */
export function isDataLayout(kind: LayoutKind | null | undefined): boolean {
  return !kind || kind === "data";
}

export function isCartOrOrder(kind: LayoutKind | null | undefined): boolean {
  return kind === "cart" || kind === "order";
}

export type InferLayoutInput = {
  table?: string | null;
  columns?: string[] | null;
  comments?: SchemaComments | null;
  pageKind?: "list" | "detail" | "create";
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
  if (has("order", "orders", "checkout", "purchase", "trade", "订单", "下单")) {
    add(scores, "order", 38);
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
  hit(/\b(order|checkout|paystatus|address|consignee)\b|订单|收货|下单|结算/, "order", 10);
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
const PRICE_COLS = ["price", "amount", "fee", "cost", "money", "saleprice", "unitprice"];
const STOCK_COLS = ["stock", "inventory", "quantity", "qty", "remain"];
const STATUS_COLS = ["status", "state", "stage"];

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
  coverUrl: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  id: string | number | null;
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
  return resolveImageSrc(url, apijsonBase);
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
