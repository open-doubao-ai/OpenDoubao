/**
 * A2API action-slot bindings: fill bindRequest.paramMap and run the bound API.
 * Table / field names live only inside the bound template — never Demo literals.
 */

import { withApijsonAuth } from "./aj-auth.js";
import { withRequestRole } from "./access-roles.js";
import type { SchemaComments } from "./schema-types.js";
import {
  isActionSlot,
  type ActionBinding,
  type ActionSlot,
  type LayoutApp,
  type LayoutPage,
} from "./page-layout.js";

export type ParamMapEntry = { from: string; to: string };

export type ActionRunContext = {
  record: Record<string, unknown>;
  visitorId: string | number | null;
  authorId?: string | number | null;
  input?: string;
  already?: boolean;
};

export type ActionSlotResult = {
  ok: boolean;
  json?: unknown;
};

export type ActionBindContext = {
  table?: string | null;
  columns?: string[];
  comments?: SchemaComments | null;
  app?: LayoutApp;
  page?: LayoutPage;
};

const RESERVED = new Set(["tag", "[]", "@role", "format", "total@"]);

export function bindingFromPayload(
  slot: ActionSlot,
  raw: {
    bindingId?: string;
    method?: string;
    url?: string;
    bodyTemplate?: Record<string, unknown>;
    paramMap?: ParamMapEntry[];
    triggerActions?: string[];
  },
): ActionBinding | null {
  if (!raw.bodyTemplate || typeof raw.bodyTemplate !== "object") return null;
  const method = String(raw.method || "get").toLowerCase();
  const paramMap =
    Array.isArray(raw.paramMap) && raw.paramMap.length
      ? raw.paramMap.filter(
          (e) => e && typeof e.from === "string" && typeof e.to === "string",
        )
      : inferParamMapFromTemplate(slot, raw.bodyTemplate);
  return {
    slot,
    bindingId: raw.bindingId || `action_${slot}_${Date.now().toString(36)}`,
    method,
    url: raw.url || "",
    bodyTemplate: structuredClone(raw.bodyTemplate),
    paramMap,
    triggerActions: raw.triggerActions,
  };
}

export function inferParamMapFromTemplate(
  slot: ActionSlot,
  template: Record<string, unknown>,
): ParamMapEntry[] {
  const map: ParamMapEntry[] = [];
  const seen = new Set<string>();
  const add = (from: string, to: string) => {
    if (seen.has(to)) return;
    seen.add(to);
    map.push({ from, to });
  };
  walk(template, "", (path, key, value) => {
    const to = path || `/${key}`;
    if (key === "id" || key === "Id") {
      if (slot === "follow" || slot === "authorGet") {
        add(slot === "follow" ? "/visitor/id" : "/author/id", to);
      } else {
        add("/record/id", to);
      }
    }
    if (/(<>|\}\{)$/.test(key)) {
      add(slot === "follow" ? "/author/id" : "/visitor/id", to);
    }
    if (/\+$/.test(key) && (typeof value === "number" || value === 1)) {
      /* share increment — no input */
    }
    if (/^(content|text|body|message)$/i.test(key) && (value === "" || value === 0)) {
      add("/input/content", to);
    }
    if (/^(touserid|toid|receiverid|targetid)$/i.test(key)) {
      add("/author/id", to);
    }
  });
  if ((slot === "comment" || slot === "message") && !map.some((e) => e.from === "/input/content")) {
    const contentTo = findPointerByKey(template, /^(content|text|body|message)$/i);
    if (contentTo) add("/input/content", contentTo);
  }
  return map;
}

function walk(
  node: unknown,
  prefix: string,
  visit: (path: string, key: string, value: unknown) => void,
) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const path = `${prefix}/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`;
    visit(path, key, value);
    walk(value, path, visit);
  }
}

function findPointerByKey(node: unknown, re: RegExp, prefix = ""): string | null {
  if (!node || typeof node !== "object" || Array.isArray(node)) return null;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const path = `${prefix}/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`;
    if (re.test(key)) return path;
    const inner = findPointerByKey(value, re, path);
    if (inner) return inner;
  }
  return null;
}

function parsePointer(pointer: string): string[] {
  if (!pointer || pointer === "/") return [];
  return pointer
    .split("/")
    .slice(1)
    .map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));
}

function getAt(root: unknown, pointer: string): unknown {
  let cur: unknown = root;
  for (const key of parsePointer(pointer)) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function setAt(root: Record<string, unknown>, pointer: string, value: unknown) {
  const keys = parsePointer(pointer);
  if (!keys.length) return;
  let cur: Record<string, unknown> = root;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]!;
    const next = cur[k];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cur[k] = {};
    }
    cur = cur[k] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]!] = value;
}

function flattenRecord(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...record };
  for (const [k, v] of Object.entries(record)) {
    const dot = k.lastIndexOf(".");
    if (dot > 0) {
      const short = k.slice(dot + 1);
      if (out[short] == null) out[short] = v;
    }
  }
  return out;
}

export function actionSourceModel(ctx: ActionRunContext): Record<string, unknown> {
  const record = flattenRecord(ctx.record);
  return {
    record,
    visitor: { id: ctx.visitorId },
    author: { id: ctx.authorId ?? null },
    input: { content: ctx.input ?? "" },
  };
}

function rewriteToggleOps(node: unknown, already: boolean | undefined) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return;
  const obj = node as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (already === true && key.endsWith("<>")) {
      obj[`${key.slice(0, -2)}}{`] = obj[key];
      delete obj[key];
    } else if (already === false && key.endsWith("}{")) {
      obj[`${key.slice(0, -2)}<>`] = obj[key];
      delete obj[key];
    } else {
      rewriteToggleOps(obj[key], already);
    }
  }
}

export function fillActionBody(
  binding: ActionBinding,
  ctx: ActionRunContext,
): Record<string, unknown> {
  const body = structuredClone(binding.bodyTemplate);
  const src = actionSourceModel(ctx);
  for (const { from, to } of binding.paramMap) {
    const value = getAt(src, from);
    if (value === undefined) continue;
    setAt(body, to, value);
  }
  if (
    binding.slot === "like" ||
    binding.slot === "collect" ||
    binding.slot === "follow"
  ) {
    rewriteToggleOps(body, ctx.already);
  }
  return body;
}

export function inferWriteTable(body: Record<string, unknown>): string | null {
  const tag = typeof body.tag === "string" ? body.tag.trim() : "";
  if (tag) return tag;
  for (const key of Object.keys(body)) {
    if (RESERVED.has(key) || key.startsWith("@")) continue;
    if (/^[A-Z]/.test(key)) return key;
  }
  return null;
}

export async function fetchBoundGet(
  base: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const withRole = await withRequestRole(body, "get", base);
  const res = await fetch(
    `${base.replace(/\/+$/, "")}/get`,
    withApijsonAuth({
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(withRole),
    }),
  );
  const json = (await res.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  return json;
}

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

/** Person/account table from the *current* project's comments — not "User". */
export function inferPersonTable(comments: SchemaComments | null | undefined): string | null {
  if (!comments?.tables) return null;
  let best: { table: string; score: number } | null = null;
  for (const [table, note] of Object.entries(comments.tables)) {
    const score = scoreTokens(`${table} ${note}`, [
      "user",
      "member",
      "account",
      "author",
      "profile",
      "用户",
      "会员",
      "账号",
      "作者",
    ]);
    if (score <= 0) continue;
    if (!best || score > best.score) best = { table, score };
  }
  return best?.table ?? null;
}

function pickFieldByComment(
  obj: Record<string, unknown>,
  tokens: string[],
): string | null {
  let best: { key: string; score: number } | null = null;
  for (const key of Object.keys(obj)) {
    const score = scoreTokens(key, tokens);
    if (score <= 0) continue;
    if (!best || score > best.score) best = { key, score };
  }
  return best?.key ?? null;
}

export type SocialComment = {
  id: string | number | null;
  userId: string | number | null;
  name: string;
  head: string | null;
  content: string;
  date: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function firstNestedRecords(row: Record<string, unknown>): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const v of Object.values(row)) {
    const rec = asRecord(v);
    if (rec) out.push(rec);
  }
  return out;
}

function pickStr(obj: Record<string, unknown>, tokens: string[]): string {
  const key = pickFieldByComment(obj, tokens);
  if (!key) return "";
  const v = obj[key];
  return v == null ? "" : String(v).trim();
}

function pickId(obj: Record<string, unknown>): string | number | null {
  const v = obj.id ?? obj.Id ?? obj.ID;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

export type AuthorFeedItem = {
  id: string | number;
  cells: Record<string, unknown>;
};

/** Latest posts by one author — table/field names come from comments. */
export async function fetchAuthorFeed(opts: {
  base: string;
  table: string;
  authorField: string;
  authorId: string | number;
  dateField?: string | null;
  count?: number;
}): Promise<AuthorFeedItem[]> {
  const item: Record<string, unknown> = {
    [opts.authorField]: opts.authorId,
  };
  if (opts.dateField) item["@order"] = `${opts.dateField}-`;
  const json = await fetchBoundGet(opts.base, {
    "[]": {
      [opts.table]: item,
      count: opts.count ?? 6,
      query: 2,
    },
  });
  if (!json) return [];
  const list = Array.isArray(json["[]"])
    ? json["[]"]
    : Array.isArray(json.list)
      ? json.list
      : [];
  const out: AuthorFeedItem[] = [];
  for (const raw of list) {
    const row = asRecord(raw);
    if (!row) continue;
    const rec =
      asRecord(row[opts.table]) ||
      firstNestedRecords(row)[0] ||
      row;
    const id = pickId(rec);
    if (id == null) continue;
    const cells: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rec)) {
      cells[`${opts.table}.${k}`] = v;
    }
    out.push({ id, cells });
  }
  return out;
}

export function parseCommentsFromResponse(json: unknown): SocialComment[] {
  if (!json || typeof json !== "object") return [];
  const root = json as Record<string, unknown>;
  const list = Array.isArray(root["[]"])
    ? root["[]"]
    : Array.isArray(root.list)
      ? root.list
      : [];
  const out: SocialComment[] = [];
  for (const item of list) {
    const row = asRecord(item);
    if (!row) continue;
    const nested = firstNestedRecords(row);
    let comment = row;
    let person: Record<string, unknown> = {};
    if (nested.length) {
      let bestC: { rec: Record<string, unknown>; score: number } | null = null;
      let bestP: { rec: Record<string, unknown>; score: number } | null = null;
      for (const rec of nested) {
        const keys = Object.keys(rec).join(" ");
        const cScore = scoreTokens(keys, [
          "content",
          "text",
          "body",
          "comment",
          "message",
          "内容",
          "评论",
        ]);
        const pScore = scoreTokens(keys, [
          "name",
          "nickname",
          "head",
          "avatar",
          "picture",
          "姓名",
          "昵称",
          "头像",
        ]);
        if (!bestC || cScore > bestC.score) bestC = { rec, score: cScore };
        if (!bestP || pScore > bestP.score) bestP = { rec, score: pScore };
      }
      if (bestC && bestC.score > 0) comment = bestC.rec;
      if (bestP && bestP.score > 0 && bestP.rec !== comment) person = bestP.rec;
    }
    const content = pickStr(comment, [
      "content",
      "text",
      "body",
      "comment",
      "message",
      "内容",
      "评论",
    ]);
    if (!content) continue;
    const userId =
      pickId(
        Object.fromEntries(
          Object.entries({ ...person, ...comment }).filter(([k]) =>
            /^(userid|uid|authorid|ownerid)$/i.test(k),
          ),
        ),
      ) ??
      (typeof comment.userId === "number" || typeof comment.userId === "string"
        ? (comment.userId as string | number)
        : typeof person.id === "number" || typeof person.id === "string"
          ? (person.id as string | number)
          : null);
    out.push({
      id: pickId(comment),
      userId,
      name: pickStr(person, ["name", "nickname", "nick", "author", "姓名", "昵称"]),
      head: (() => {
        const h = pickStr(person, [
          "head",
          "avatar",
          "portrait",
          "picture",
          "cover",
          "头像",
        ]);
        return h || null;
      })(),
      content,
      date: pickStr(comment, ["date", "time", "created", "createtime", "时间", "日期"]),
    });
  }
  return out;
}

export function actionBindPrompt(
  slot: ActionSlot,
  ctx: ActionBindContext,
): string {
  const table = ctx.table || "";
  const cols = (ctx.columns || []).slice(0, 40).join(", ");
  return [
    `Bind the "${slot}" action for this page via A2API bindRequest.`,
    `App/page: ${ctx.app || "?"} / ${ctx.page || "?"}.`,
    table ? `Current primary table hint (from this page's list bind, not a Demo name): ${table}.` : "",
    cols ? `Visible columns: ${cols}.` : "",
    "Use the project's live schema (comments / tables). Do not assume Demo names such as Video, Comment, User, praiseUserIdList.",
    "Return bindRequest: method, url, bodyTemplate, paramMap.",
    "paramMap JSON Pointers: /record/id, /record/<column>, /visitor/id, /author/id, /input/content.",
    "Do not replace or change the page's existing list GET bind.",
    "Do not hardcode sample ids.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function isActionBindChatResponse(data: {
  actionBind?: unknown;
  actionSlot?: unknown;
}): data is { actionBind: Record<string, unknown>; actionSlot?: ActionSlot } {
  return Boolean(data.actionBind && typeof data.actionBind === "object");
}

export function slotFromUnknown(v: unknown): ActionSlot | null {
  return isActionSlot(v) ? v : null;
}
