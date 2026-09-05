/**
 * Generate A2API bindRequest for a UI action slot from the *current* project's
 * schema comments — never Demo table/field literals.
 */

import {
  type ApiJsonMethod,
  type BindRequestPayload,
  type ParamMapEntry,
} from "@a2api/protocol";
import { validateBindRequest } from "@a2api/protocol";
import { resolveLlmConfig, type LlmConfig } from "./llm-config.js";

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

export type SchemaComments = {
  tables?: Record<string, string>;
  columns?: Record<string, string>;
};

export type ActionBindContext = {
  table?: string | null;
  columns?: string[];
  comments?: SchemaComments | null;
  app?: string;
  page?: string;
};

function rid(slot: ActionSlot): string {
  return `action_${slot}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
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

function tableHay(table: string, comments?: SchemaComments | null): string {
  return `${table} ${comments?.tables?.[table] || ""}`;
}

function colHay(
  table: string,
  col: string,
  comments?: SchemaComments | null,
): string {
  const key = `${table}.${col}`;
  return `${col} ${comments?.columns?.[key] || comments?.columns?.[col] || ""}`;
}

function pickTable(
  comments: SchemaComments | null | undefined,
  tokens: string[],
  prefer?: string | null,
): string | null {
  if (prefer && scoreTokens(tableHay(prefer, comments), tokens) > 0) {
    return prefer;
  }
  let best: { table: string; score: number } | null = null;
  for (const [table, note] of Object.entries(comments?.tables || {})) {
    const score = scoreTokens(`${table} ${note}`, tokens);
    if (score <= 0) continue;
    if (!best || score > best.score) best = { table, score };
  }
  return best?.table ?? (prefer && prefer.trim() ? prefer.trim() : null);
}

function columnsOf(
  table: string,
  comments?: SchemaComments | null,
  extra?: string[],
): string[] {
  const out = new Set<string>();
  const prefix = `${table}.`;
  for (const key of Object.keys(comments?.columns || {})) {
    if (key.startsWith(prefix)) out.add(key.slice(prefix.length));
    else if (!key.includes(".")) out.add(key);
  }
  for (const col of extra || []) {
    if (col.startsWith(prefix)) out.add(col.slice(prefix.length));
    else if (!col.includes(".")) out.add(col);
    else {
      const short = col.slice(col.lastIndexOf(".") + 1);
      if (short) out.add(short);
    }
  }
  return [...out];
}

function pickColumn(
  table: string,
  comments: SchemaComments | null | undefined,
  extra: string[] | undefined,
  tokens: string[],
): string | null {
  let best: { col: string; score: number } | null = null;
  for (const col of columnsOf(table, comments, extra)) {
    const score = scoreTokens(colHay(table, col, comments), tokens);
    if (score <= 0) continue;
    if (!best || score > best.score) best = { col, score };
  }
  return best?.col ?? null;
}

function listOpField(field: string, alreadyKey = false): string {
  return alreadyKey ? `${field}}{` : `${field}<>`;
}

function fkForOwner(
  commentTable: string,
  ownerTable: string,
  comments?: SchemaComments | null,
): string | null {
  const owner = norm(ownerTable);
  let best: { col: string; score: number } | null = null;
  for (const col of columnsOf(commentTable, comments)) {
    const hay = colHay(commentTable, col, comments);
    let score = 0;
    if (/id$/i.test(col)) score += 2;
    if (norm(col).includes(owner) || norm(col).includes(`${owner}id`)) score += 10;
    score += scoreTokens(hay, [ownerTable, `${ownerTable} id`, "关联", "外键"]);
    if (score < 6) continue;
    if (!best || score > best.score) best = { col, score };
  }
  return best?.col ?? null;
}

function defaultBase(): string {
  return (process.env.APIJSON_BASE_URL ?? "http://localhost:8080").replace(
    /\/+$/,
    "",
  );
}

function bindOf(
  slot: ActionSlot,
  method: ApiJsonMethod,
  bodyTemplate: Record<string, unknown>,
  paramMap: ParamMapEntry[],
): BindRequestPayload {
  return {
    bindingId: rid(slot),
    method,
    url: `${defaultBase()}/${method}`,
    bodyTemplate,
    paramMap,
    triggerActions: [slot],
  };
}

function inferLikeCollect(
  slot: "like" | "collect",
  ctx: ActionBindContext,
): BindRequestPayload | null {
  const table = ctx.table?.trim();
  if (!table) return null;
  const tokens =
    slot === "like"
      ? ["praise", "like", "favor", "likedby", "点赞", "喜欢"]
      : ["collect", "favorite", "star", "bookmark", "收藏", "喜欢"];
  const field = pickColumn(table, ctx.comments, ctx.columns, tokens);
  if (!field) return null;
  const op = listOpField(field);
  return bindOf(
    slot,
    "put",
    { [table]: { id: 0, [op]: 0 }, tag: table },
    [
      { from: "/record/id", to: `/${table}/id` },
      { from: "/visitor/id", to: `/${table}/${op}` },
    ],
  );
}

function inferShare(ctx: ActionBindContext): BindRequestPayload | null {
  const table = ctx.table?.trim();
  if (!table) return null;
  const field = pickColumn(table, ctx.comments, ctx.columns, [
    "sharecount",
    "shares",
    "repost",
    "转发",
    "分享",
  ]);
  if (!field) return null;
  return bindOf(
    "share",
    "put",
    { [table]: { id: 0, [`${field}+`]: 1 }, tag: table },
    [{ from: "/record/id", to: `/${table}/id` }],
  );
}

function inferFollow(ctx: ActionBindContext): BindRequestPayload | null {
  const person = pickTable(ctx.comments, [
    "user",
    "member",
    "account",
    "profile",
    "用户",
    "会员",
    "账号",
  ]);
  if (!person) return null;
  const field = pickColumn(person, ctx.comments, undefined, [
    "contact",
    "follow",
    "friend",
    "关注",
    "好友",
    "联系人",
  ]);
  if (!field) return null;
  const op = listOpField(field);
  return bindOf(
    "follow",
    "put",
    { [person]: { id: 0, [op]: 0 }, tag: person },
    [
      { from: "/visitor/id", to: `/${person}/id` },
      { from: "/author/id", to: `/${person}/${op}` },
    ],
  );
}

function inferCommentPost(ctx: ActionBindContext): BindRequestPayload | null {
  const owner = ctx.table?.trim();
  const comment = pickTable(ctx.comments, ["comment", "reply", "评论", "回复"]);
  if (!comment || !owner) return null;
  const fk = fkForOwner(comment, owner, ctx.comments);
  const content =
    pickColumn(comment, ctx.comments, undefined, [
      "content",
      "text",
      "body",
      "内容",
      "评论",
    ]) || "content";
  const score = pickColumn(comment, ctx.comments, undefined, [
    "score",
    "star",
    "rating",
    "rate",
    "评分",
    "打分",
    "星级",
  ]);
  const body: Record<string, unknown> = { [content]: "" };
  const paramMap: ParamMapEntry[] = [
    { from: "/input/content", to: `/${comment}/${content}` },
  ];
  if (fk) {
    body[fk] = 0;
    paramMap.push({ from: "/record/id", to: `/${comment}/${fk}` });
  }
  if (score) {
    body[score] = 0;
    paramMap.push({ from: "/input/score", to: `/${comment}/${score}` });
  }
  const toId = pickColumn(comment, ctx.comments, undefined, [
    "toid",
    "parentid",
    "replyid",
    "replytoid",
    "父评论",
    "回复评论",
  ]);
  if (toId) {
    body[toId] = 0;
    paramMap.push({ from: "/input/toId", to: `/${comment}/${toId}` });
  }
  return bindOf("comment", "post", { [comment]: body, tag: comment }, paramMap);
}

function inferCommentList(ctx: ActionBindContext): BindRequestPayload | null {
  const owner = ctx.table?.trim();
  const comment = pickTable(ctx.comments, ["comment", "reply", "评论", "回复"]);
  if (!comment || !owner) return null;
  const fk = fkForOwner(comment, owner, ctx.comments);
  if (!fk) return null;
  const person = pickTable(ctx.comments, [
    "user",
    "member",
    "account",
    "用户",
    "会员",
  ]);
  const userFk = person
    ? pickColumn(comment, ctx.comments, undefined, [
        "userid",
        "authorid",
        "uid",
        "作者",
      ])
    : null;
  const list: Record<string, unknown> = {
    count: 40,
    [comment]: { [fk]: 0 },
  };
  if (person && userFk) {
    list[person] = { "id@": `/${comment}/${userFk}` };
  }
  return bindOf(
    "commentList",
    "get",
    { "[]": list },
    [{ from: "/record/id", to: `/[]/${comment}/${fk}` }],
  );
}

function inferMessage(ctx: ActionBindContext): BindRequestPayload | null {
  const table = pickTable(ctx.comments, [
    "message",
    "chat",
    "im",
    "私信",
    "消息",
    "聊天",
  ]);
  if (!table) return null;
  const toField = pickColumn(table, ctx.comments, undefined, [
    "touserid",
    "toid",
    "receiverid",
    "targetid",
    "收信",
    "对方",
  ]);
  const content = pickColumn(table, ctx.comments, undefined, [
    "content",
    "text",
    "body",
    "内容",
  ]);
  if (!toField || !content) return null;
  return bindOf(
    "message",
    "post",
    { [table]: { [toField]: 0, [content]: "" }, tag: table },
    [
      { from: "/author/id", to: `/${table}/${toField}` },
      { from: "/input/content", to: `/${table}/${content}` },
    ],
  );
}

function inferAuthorGet(ctx: ActionBindContext): BindRequestPayload | null {
  const person = pickTable(ctx.comments, [
    "user",
    "member",
    "account",
    "author",
    "用户",
    "会员",
    "作者",
  ]);
  if (!person) return null;
  return bindOf(
    "authorGet",
    "get",
    { [person]: { id: 0 } },
    [{ from: "/author/id", to: `/${person}/id` }],
  );
}

export function inferActionBind(
  slot: ActionSlot,
  ctx: ActionBindContext,
): BindRequestPayload | null {
  switch (slot) {
    case "like":
    case "collect":
      return inferLikeCollect(slot, ctx);
    case "share":
      return inferShare(ctx);
    case "follow":
      return inferFollow(ctx);
    case "comment":
      return inferCommentPost(ctx);
    case "commentList":
      return inferCommentList(ctx);
    case "message":
      return inferMessage(ctx);
    case "authorGet":
      return inferAuthorGet(ctx);
    default:
      return null;
  }
}

function commentsDigest(ctx: ActionBindContext): string {
  const tables = Object.entries(ctx.comments?.tables || {})
    .slice(0, 40)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
  const cols = Object.entries(ctx.comments?.columns || {})
    .slice(0, 80)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
  return [
    ctx.table ? `Current page primary table hint: ${ctx.table}` : "",
    ctx.columns?.length ? `Visible columns: ${ctx.columns.slice(0, 40).join(", ")}` : "",
    tables ? `Tables:\n${tables}` : "",
    cols ? `Columns:\n${cols}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateActionBind(
  slot: ActionSlot,
  ctx: ActionBindContext,
  llmOverride?: LlmConfig | null,
): Promise<{ bind: BindRequestPayload; source: "llm" | "schema" } | null> {
  const { apiKey, baseUrl, model, language } = resolveLlmConfig(llmOverride);
  if (apiKey) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You generate one A2API bindRequest for a UI action slot.
Reply language: ${language}.
Use ONLY the project's schema below. Do not assume Demo table or field names
(Video, Comment, User, praiseUserIdList, contactIdList, …) unless they appear in the schema.
Return JSON:
{ "method": "get|post|put|delete", "url": ".../get|post|put|delete", "bodyTemplate": {}, "paramMap": [{"from":"/record/id","to":"/Table/id"}], "bindingId": "optional" }
JSON Pointer sources: /record/id, /record/<column>, /visitor/id, /author/id, /input/content, /input/score, /input/toId.
Do not hardcode sample ids. Writes: omit userId (session injects). Write tag defaults to the table name; use Table:alias / moment_list only if that table Request is taken and unfit.
Only APIJSON, never SQL.`,
            },
            {
              role: "user",
              content: JSON.stringify({
                slot,
                app: ctx.app,
                page: ctx.page,
                schema: commentsDigest(ctx),
              }),
            },
          ],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as {
            method?: string;
            url?: string;
            bodyTemplate?: Record<string, unknown>;
            body?: Record<string, unknown>;
            paramMap?: ParamMapEntry[];
            bindingId?: string;
          };
          const method = parsed.method as ApiJsonMethod | undefined;
          const bodyTemplate = parsed.bodyTemplate || parsed.body;
          if (method && bodyTemplate && typeof bodyTemplate === "object") {
            const bind: BindRequestPayload = {
              bindingId: parsed.bindingId || rid(slot),
              method,
              url: parsed.url || `${defaultBase()}/${method}`,
              bodyTemplate,
              paramMap: Array.isArray(parsed.paramMap) ? parsed.paramMap : [],
              triggerActions: [slot],
            };
            const v = validateBindRequest(bind);
            if (v.ok || bind.paramMap.length || Object.keys(bind.bodyTemplate).length) {
              return { bind, source: "llm" };
            }
          }
        }
      }
    } catch {
      /* fall through to schema inference */
    }
  }
  const inferred = inferActionBind(slot, ctx);
  return inferred ? { bind: inferred, source: "schema" } : null;
}
