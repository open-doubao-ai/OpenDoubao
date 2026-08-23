/**
 * Category page: load real category/genre/channel rows (not item SKUs).
 * Table / field names come from comments — not Demo literals as source of truth.
 */

import { t } from "./i18n/index.js";
import { fetchBoundGet } from "./layout-actions.js";
import { getSkillHints, type LayoutApp } from "./page-layout.js";
import type { SchemaComments } from "./schema-types.js";

export type CategoryFlatRow = { key: string; cells: Record<string, unknown> };

export type CategoryLoadResult = {
  table: string | null;
  rows: CategoryFlatRow[];
  columns: string[];
  created: boolean;
  comments: SchemaComments | null;
  error?: string;
};

const CATEGORY_NAME_TOKENS = [
  "category",
  "categories",
  "genre",
  "genres",
  "catalog",
  "classify",
  "topic",
  "topics",
  "section",
  "分类",
  "类目",
  "栏目",
  "流派",
  "专题",
];

const CATEGORY_WEAK_TOKENS = ["channel", "column", "频道"];

const PERSON_PENALTY = [
  "user",
  "member",
  "account",
  "author",
  "profile",
  "用户",
  "会员",
  "作者",
];

const APP_ITEM_TOKENS: Record<LayoutApp, string[]> = {
  commerce: ["product", "goods", "sku", "commodity", "merchandise", "商品", "货品", "电商"],
  music: ["music", "song", "track", "audio", "音乐", "歌曲"],
  news: ["news", "headline", "新闻"],
  info: ["notice", "info", "bulletin", "announce", "资讯", "公告"],
  video: ["video", "film", "vod", "视频", "影片"],
  blog: ["blog", "博客"],
  article: ["article", "essay", "文章"],
  campaign: ["activity", "campaign", "event", "promo", "活动"],
  social: ["moment", "feed", "动态", "朋友圈"],
  chat: ["message", "chat", "消息", "聊天"],
  data: ["employee", "staff", "员工"],
  education: ["course", "lesson", "curriculum", "课程", "教育学习", "网课"],
  books: ["book", "ebook", "textbook", "图书", "图书阅读", "电子书"],
  comics: ["comic", "manga", "manhua", "漫画", "漫画阅读"],
  lifestyle: ["local", "localservice", "errand", "本地生活", "到家", "到店"],
  food: ["recipe", "dish", "cuisine", "菜谱", "餐饮美食", "美食"],
  travel: ["trip", "hotel", "itinerary", "旅游", "旅游出行", "行程"],
  sports: ["sport", "match", "league", "体育", "体育资讯", "赛事"],
  parenting: ["baby", "parenting", "infant", "母婴", "母婴育儿", "育儿"],
  health: ["workout", "fitness", "yoga", "健康运动", "健身"],
  auto: ["vehicle", "carinfo", "garage", "汽车", "汽车服务", "车型"],
  jobs: ["job", "recruit", "vacancy", "招聘", "招聘求职", "职位"],
  housing: ["house", "estate", "apartment", "房产", "房产家居", "房源"],
  beauty: ["beauty", "salon", "spa", "美业", "美业预约", "美发"],
  photo: ["photo", "gallery", "摄影", "摄影相册", "相册"],
  office: ["note", "notebook", "todolist", "办公效率", "待办", "笔记"],
};

const CATEGORY_ID_TOKENS = [
  "categoryid",
  "genreid",
  "channelid",
  "catalogid",
  "topicid",
  "classid",
  "分类",
  "类目",
  "栏目",
  "流派",
  "专题",
];

const APP_SCOPE_TOKENS = ["app", "appname", "kind", "scene", "biz", "应用", "大类", "业务"];

const SORT_TOKENS = ["sort", "rank", "orderno", "orderindex", "排序"];

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

function hay(name: string, comment?: string): string {
  return `${norm(name)} ${norm(comment || "")}`;
}

function scoreTokens(text: string, tokens: string[]): number {
  let n = 0;
  const h = norm(text);
  for (const tok of tokens) {
    const t = norm(tok);
    if (!t) continue;
    if (h === t) n += 8;
    else if (h.includes(t)) n += 4;
  }
  return n;
}

export function inferCategoryTable(
  comments: SchemaComments | null | undefined,
): string | null {
  if (!comments?.tables) return null;
  let best: { table: string; score: number } | null = null;
  for (const [table, note] of Object.entries(comments.tables)) {
    const text = `${table} ${note}`;
    let score = scoreTokens(text, CATEGORY_NAME_TOKENS);
    score += Math.floor(scoreTokens(text, CATEGORY_WEAK_TOKENS) / 2);
    score -= scoreTokens(text, PERSON_PENALTY);
    if (score <= 0) continue;
    if (!best || score > best.score) best = { table, score };
  }
  return best?.table ?? null;
}

export function isCategoryTable(
  table: string | null | undefined,
  comments: SchemaComments | null | undefined,
): boolean {
  const name = (table || "").trim();
  if (!name) return false;
  const inferred = inferCategoryTable(comments);
  if (inferred && inferred === name) return true;
  return scoreTokens(`${name} ${comments?.tables?.[name] || ""}`, CATEGORY_NAME_TOKENS) >= 8;
}

export function inferItemTableForApp(
  app: LayoutApp,
  comments: SchemaComments | null | undefined,
  exclude?: string | null,
): string | null {
  const hinted = getSkillHints().find((s) => s.name === app)?.tableName?.trim();
  if (hinted && comments?.tables?.[hinted]) return hinted;
  const tokens = APP_ITEM_TOKENS[app] ?? [];
  if (!comments?.tables || !tokens.length) return null;
  let best: { table: string; score: number } | null = null;
  for (const [table, note] of Object.entries(comments.tables)) {
    if (exclude && table === exclude) continue;
    if (isCategoryTable(table, comments)) continue;
    const score = scoreTokens(`${table} ${note}`, tokens);
    if (score <= 0) continue;
    if (!best || score > best.score) best = { table, score };
  }
  return best?.table ?? null;
}

function fieldsOfTable(
  table: string,
  comments: SchemaComments | null | undefined,
  extra?: string[],
): string[] {
  const out = new Set<string>();
  for (const col of extra ?? []) {
    const name = col.includes(".") ? col.slice(col.indexOf(".") + 1) : col;
    if (col === name || col.startsWith(`${table}.`)) out.add(name);
  }
  if (comments?.columns) {
    const prefix = `${table}.`;
    for (const key of Object.keys(comments.columns)) {
      if (key.startsWith(prefix)) out.add(key.slice(prefix.length));
    }
  }
  return [...out];
}

function pickField(
  table: string,
  comments: SchemaComments | null | undefined,
  tokens: string[],
  extra?: string[],
): string | null {
  let best: { field: string; score: number } | null = null;
  for (const field of fieldsOfTable(table, comments, extra)) {
    const note = comments?.columns?.[`${table}.${field}`] || "";
    const score = scoreTokens(hay(field, note), tokens);
    if (score <= 0) continue;
    if (!best || score > best.score) best = { field, score };
  }
  return best?.field ?? null;
}

/** Score table columns + comments against tokens. Do not hardcode Demo field names. */
export function inferNamedField(
  table: string,
  comments: SchemaComments | null | undefined,
  tokens: string[],
  extra?: string[],
): string | null {
  return pickField(table, comments, tokens, extra);
}

export function inferCategoryIdField(
  table: string,
  comments: SchemaComments | null | undefined,
  extra?: string[],
): string | null {
  return pickField(table, comments, CATEGORY_ID_TOKENS, extra);
}

export function inferAppScopeField(
  table: string,
  comments: SchemaComments | null | undefined,
  extra?: string[],
): string | null {
  return pickField(table, comments, APP_SCOPE_TOKENS, extra);
}

const AUTHOR_ID_TOKENS = [
  "userid",
  "authorid",
  "ownerid",
  "uid",
  "publisherid",
  "作者",
];

const DATE_ORDER_TOKENS = [
  "date",
  "time",
  "created",
  "createtime",
  "createdat",
  "published",
  "publishtime",
  "updatetime",
  "时间",
  "日期",
];

export function inferAuthorIdField(
  table: string,
  comments: SchemaComments | null | undefined,
  extra?: string[],
): string | null {
  return pickField(table, comments, AUTHOR_ID_TOKENS, extra);
}

export function inferDateOrderField(
  table: string,
  comments: SchemaComments | null | undefined,
  extra?: string[],
): string | null {
  return pickField(table, comments, DATE_ORDER_TOKENS, extra);
}

const PEER_ID_TOKENS = [
  "toid",
  "touserid",
  "receiverid",
  "targetid",
  "peerid",
  "对方",
];

export function inferPeerIdField(
  table: string,
  comments: SchemaComments | null | undefined,
  extra?: string[],
): string | null {
  return pickField(table, comments, PEER_ID_TOKENS, extra);
}

function inferSortField(
  table: string,
  comments: SchemaComments | null | undefined,
  extra?: string[],
): string | null {
  return pickField(table, comments, SORT_TOKENS, extra);
}

function apijsonOk(json: unknown): boolean {
  if (!json || typeof json !== "object") return false;
  const code = (json as { code?: unknown }).code;
  return code === 200 || code === "200" || code == null;
}

function flattenCategoryRows(
  json: Record<string, unknown> | null,
  table: string,
): { rows: CategoryFlatRow[]; columns: string[] } {
  if (!json) return { rows: [], columns: [] };
  const arr = json["[]"];
  if (!Array.isArray(arr)) return { rows: [], columns: [] };
  const rows: CategoryFlatRow[] = [];
  const colSet = new Set<string>();
  arr.forEach((item, idx) => {
    if (!item || typeof item !== "object") return;
    const rec = (item as Record<string, unknown>)[table];
    const obj =
      rec && typeof rec === "object" && !Array.isArray(rec)
        ? (rec as Record<string, unknown>)
        : (item as Record<string, unknown>);
    const cells: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith("@")) continue;
      const path = k.includes(".") ? k : `${table}.${k}`;
      cells[path] = v;
      colSet.add(path);
    }
    const id = obj.id ?? cells[`${table}.id`] ?? idx;
    rows.push({ key: String(id), cells });
  });
  return { rows, columns: [...colSet] };
}

export type EnsureCategoriesPayload = {
  ok?: boolean;
  table?: string;
  created?: boolean;
  comments?: SchemaComments;
  error?: string;
  sqlPath?: string;
};

export async function ensureLayoutCategories(): Promise<EnsureCategoriesPayload> {
  const res = await fetch("/api/ensure-layout-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: "{}",
  });
  const json = (await res.json().catch(() => null)) as EnsureCategoriesPayload | null;
  if (!json) return { ok: false, error: t("layout.explore.ensureFailed") };
  return json;
}

export async function loadCategoryRows(opts: {
  app: LayoutApp;
  apijsonBase: string;
  comments: SchemaComments | null;
  primaryTable?: string | null;
  boundRows?: CategoryFlatRow[];
  boundColumns?: string[];
}): Promise<CategoryLoadResult> {
  let comments = opts.comments;
  let created = false;
  let table = inferCategoryTable(comments);
  if (!table) {
    try {
      const res = await fetch("/api/schema-comments?tables=Category");
      const extra = (await res.json()) as SchemaComments | null;
      if (extra?.tables) {
        comments = {
          tables: { ...(comments?.tables ?? {}), ...extra.tables },
          columns: { ...(comments?.columns ?? {}), ...extra.columns },
          types: { ...(comments?.types ?? {}), ...extra.types },
        };
        table = inferCategoryTable(comments);
      }
    } catch {
      /* ensure below */
    }
  }

  const useBound =
    table &&
    opts.primaryTable &&
    table === opts.primaryTable &&
    (opts.boundRows?.length ?? 0) > 0;

  if (useBound && table) {
    const appField = inferAppScopeField(table, comments, opts.boundColumns);
    const rows = appField
      ? opts.boundRows!.filter(
          (r) => String(r.cells[`${table}.${appField}`] ?? "") === opts.app,
        )
      : opts.boundRows!;
    if (rows.length) {
      return {
        table,
        rows,
        columns: opts.boundColumns ?? [],
        created: false,
        comments,
      };
    }
  }

  const fetchOnce = async (name: string) => {
    const appField = inferAppScopeField(name, comments);
    const sortField = inferSortField(name, comments);
    const filter: Record<string, unknown> = {};
    if (appField) filter[appField] = opts.app;
    if (sortField) filter["@order"] = `${sortField}+`;
    return fetchBoundGet(opts.apijsonBase, {
      "[]": {
        count: 50,
        page: 0,
        [name]: filter,
      },
    });
  };

  let json: Record<string, unknown> | null = null;
  if (table) {
    json = await fetchOnce(table);
  }
  const needEnsure =
    !table ||
    !json ||
    !apijsonOk(json) ||
    flattenCategoryRows(json, table).rows.length === 0;

  if (needEnsure) {
    const ensured = await ensureLayoutCategories();
    created = !!ensured.created;
    if (ensured.comments) {
      comments = {
        tables: { ...(comments?.tables ?? {}), ...ensured.comments.tables },
        columns: { ...(comments?.columns ?? {}), ...ensured.comments.columns },
        types: { ...(comments?.types ?? {}), ...ensured.comments.types },
      };
    }
    table = inferCategoryTable(comments) || ensured.table || table;
    if (!ensured.ok && !table) {
      return {
        table: null,
        rows: [],
        columns: [],
        created,
        comments,
        error: ensured.error || t("layout.explore.ensureFailed"),
      };
    }
    if (table) json = await fetchOnce(table);
  }

  if (!table || !json || !apijsonOk(json)) {
    return {
      table,
      rows: [],
      columns: [],
      created,
      comments,
      error: t("layout.explore.ensureFailed"),
    };
  }
  const parsed = flattenCategoryRows(json, table);
  return { table, ...parsed, created, comments };
}

export function categoryRecordId(
  row: CategoryFlatRow,
  table: string | null,
): string | number | null {
  if (table) {
    const v = row.cells[`${table}.id`];
    if (typeof v === "number" || typeof v === "string") return v;
  }
  const n = Number(row.key);
  return Number.isFinite(n) ? n : row.key;
}
