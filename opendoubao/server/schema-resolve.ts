/**
 * Match user text to table/field names. Local catalog first; live APIJSON
 * when that is missing or ambiguous. Uncertain → ask the user.
 */

import type { SchemaComments } from "./schema-comments.js";
import type {
  CatalogSource,
  LiveColumn,
  LiveTable,
} from "./schema-catalog.js";

export type SchemaChoiceKind = "table" | "field";

export type SchemaChoiceCandidate = {
  name: string;
  comment: string;
  source: CatalogSource;
  score: number;
};

export type SchemaChoicePayload = {
  kind: SchemaChoiceKind;
  reason: "local_miss" | "ambiguous";
  query: string;
  table?: string;
  candidates: SchemaChoiceCandidate[];
};

export type NameDecision =
  | {
      status: "matched";
      name: string;
      comment: string;
      source: CatalogSource;
      score: number;
    }
  | { status: "ask"; reason: "local_miss" | "ambiguous"; ranked: SchemaChoiceCandidate[] }
  | { status: "none" };

const STOP = new Set(
  [
    "列出",
    "查看",
    "打开",
    "生成",
    "创建",
    "新增",
    "发布",
    "详情",
    "排行",
    "首页",
    "分类",
    "页面",
    "一个",
    "一张",
    "一下",
    "列表",
    "数据",
    "帮我",
    "给我",
    "请",
    "的",
    "list",
    "show",
    "open",
    "create",
    "generate",
    "page",
    "table",
    "the",
    "a",
    "an",
    "of",
    "for",
    "my",
    "latest",
    "recent",
    "top",
    "sort",
    "by",
    "hide",
    "filter",
    "switch",
    "change",
    "make",
    "this",
    "that",
    "and",
    "with",
  ].map((s) => s.toLowerCase()),
);

export function normToken(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

const CJK_AFFIX = [
  "列出",
  "查看",
  "打开",
  "生成",
  "创建",
  "新增",
  "发布",
  "详情",
  "排行",
  "首页",
  "分类",
  "页面",
  "一个",
  "一张",
  "一下",
  "列表",
  "数据",
  "帮我",
  "给我",
  "请",
];

const CJK_TRIM = ["页", "表", "列", "栏", "的"];

function peelChinese(chunk: string): string {
  let s = chunk;
  let changed = true;
  while (changed && s.length >= 2) {
    changed = false;
    for (const affix of CJK_AFFIX) {
      if (s.startsWith(affix) && s.length > affix.length) {
        s = s.slice(affix.length);
        changed = true;
      }
      if (s.endsWith(affix) && s.length > affix.length) {
        s = s.slice(0, -affix.length);
        changed = true;
      }
    }
    for (const t of CJK_TRIM) {
      if (s.endsWith(t) && s.length > t.length) {
        s = s.slice(0, -t.length);
        changed = true;
      }
    }
  }
  return s;
}

export function extractQueryTokens(message: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string) => {
    const t = raw.trim();
    if (!t || t.length < 2) return;
    if (STOP.has(t.toLowerCase()) || STOP.has(normToken(t))) return;
    const k = normToken(t);
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };
  for (const m of message.match(/[A-Z][A-Za-z0-9]+/g) || []) add(m);
  for (const m of message.match(/[a-z][a-z0-9]{1,}/gi) || []) add(m);
  for (const m of message.match(/[\u4e00-\u9fff]{2,}/g) || []) {
    add(m);
    const peeled = peelChinese(m);
    if (peeled !== m) add(peeled);
  }
  return out;
}

export function extractFieldMentions(message: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string | undefined) => {
    const t = (raw || "").trim().replace(/[“”"'`]/g, "");
    if (!t || t.length > 40) return;
    if (STOP.has(t.toLowerCase())) return;
    const k = t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };
  const patterns = [
    /按\s*([^\s,，。；]+?)\s*(?:排|排序|升序|降序|倒序|从高|从低)/g,
    /隐藏\s*([^\s,，。；列]+)\s*列?/g,
    /(?:显示|只要)\s*([^\s,，。；列]+)\s*列?/g,
    /sort\s+by\s+([A-Za-z_][\w]*)/gi,
    /hide\s+(?:the\s+)?([A-Za-z_][\w]*)/gi,
    /show\s+(?:only\s+)?(?:the\s+)?([A-Za-z_][\w]*)/gi,
    /filter\s+(?:by\s+)?([A-Za-z_][\w]*)/gi,
  ];
  for (const re of patterns) {
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
    let m: RegExpExecArray | null;
    while ((m = g.exec(message))) add(m[1]);
  }
  return out;
}

export function scoreText(hay: string, tokens: string[]): number {
  const h = normToken(hay);
  if (!h) return 0;
  let n = 0;
  for (const tok of tokens) {
    const t = normToken(tok);
    if (!t) continue;
    if (h === t) n += 8;
    else if (h.includes(t)) n += 4;
    else if (t.length >= 2 && t.includes(h) && h.length >= 2) n += 2;
  }
  return n;
}

export function scoreTable(table: LiveTable, tokens: string[]): number {
  let n = scoreText(
    `${table.name} ${table.comment}`,
    tokens,
  );
  for (const tok of tokens) {
    if (table.name.toLowerCase() === tok.toLowerCase()) n += 12;
  }
  return n;
}

export function scoreColumn(col: LiveColumn, tokens: string[]): number {
  let n = scoreText(`${col.name} ${col.comment}`, tokens);
  for (const tok of tokens) {
    if (col.name.toLowerCase() === tok.toLowerCase()) n += 12;
  }
  return n;
}

function toCandidates(
  ranked: Array<{ name: string; comment: string; source: CatalogSource; score: number }>,
): SchemaChoiceCandidate[] {
  return ranked
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 8)
    .map((r) => ({
      name: r.name,
      comment: r.comment,
      source: r.source,
      score: r.score,
    }));
}

export function decideName(
  ranked: Array<{ name: string; comment: string; source: CatalogSource; score: number }>,
  opts?: { minScore?: number; gap?: number },
): NameDecision {
  const minScore = opts?.minScore ?? 4;
  const gap = opts?.gap ?? 4;
  const positive = ranked
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  if (!positive.length) return { status: "none" };
  const best = positive[0]!;
  const second = positive[1];
  if (best.score >= minScore && (!second || best.score - second.score >= gap)) {
    return {
      status: "matched",
      name: best.name,
      comment: best.comment,
      source: best.source,
      score: best.score,
    };
  }
  return {
    status: "ask",
    reason: second && best.score >= minScore ? "ambiguous" : "local_miss",
    ranked: toCandidates(positive),
  };
}

export function resolveTableName(
  message: string,
  tables: LiveTable[],
): NameDecision {
  const tokens = extractQueryTokens(message);
  if (!tokens.length || !tables.length) return { status: "none" };
  const ranked = tables.map((t) => ({
    name: t.name,
    comment: t.comment,
    source: t.source,
    score: scoreTable(t, tokens),
  }));
  return decideName(ranked);
}

export function resolveFieldName(
  mention: string,
  columns: LiveColumn[],
): NameDecision {
  const tokens = extractQueryTokens(mention);
  if (!mention.trim() || !columns.length) return { status: "none" };
  const exact = columns.find(
    (c) => c.name.toLowerCase() === mention.trim().toLowerCase(),
  );
  if (exact) {
    return {
      status: "matched",
      name: exact.name,
      comment: exact.comment,
      source: exact.source,
      score: 20,
    };
  }
  const ranked = columns.map((c) => ({
    name: c.name,
    comment: c.comment,
    source: c.source,
    score: scoreColumn(c, tokens.length ? tokens : [mention]),
  }));
  return decideName(ranked, { minScore: 4, gap: 4 });
}

export function parseSchemaPick(
  message: string,
  candidates: SchemaChoiceCandidate[],
  explicit?: string | null,
): string | null {
  const fromExplicit = (explicit || "").trim();
  if (fromExplicit) {
    const hit = candidates.find(
      (c) => c.name.toLowerCase() === fromExplicit.toLowerCase(),
    );
    if (hit) return hit.name;
    if (/^[A-Z][A-Za-z0-9]{0,48}$/.test(fromExplicit)) return fromExplicit;
  }
  const t = message.trim();
  if (!t) return null;
  const indexed = t.match(/^(?:第|#)?\s*(\d+)\s*(?:个|项|号)?$/);
  if (indexed) {
    const i = Number(indexed[1]) - 1;
    if (i >= 0 && i < candidates.length) return candidates[i]!.name;
  }
  for (const c of candidates) {
    if (c.name.toLowerCase() === t.toLowerCase()) return c.name;
  }
  const hits = candidates.filter((c) => {
    const hay = t.toLowerCase();
    if (hay.includes(c.name.toLowerCase())) return true;
    const note = (c.comment || "").trim();
    return note.length >= 2 && hay.includes(note.toLowerCase());
  });
  if (hits.length === 1) return hits[0]!.name;
  if (/^[A-Z][A-Za-z0-9]{0,48}$/.test(t)) return t;
  return null;
}

export function applyFieldAlias(
  message: string,
  from: string,
  to: string,
): string {
  if (!from || !to || from === to) return message;
  return message.split(from).join(to);
}

export function pickKeywordField(
  table: string,
  comments: SchemaComments | null | undefined,
  extra?: string[],
): string {
  const names = new Set<string>();
  const prefix = `${table}.`;
  for (const key of Object.keys(comments?.columns || {})) {
    if (key.startsWith(prefix)) names.add(key.slice(prefix.length));
    else if (!key.includes(".")) names.add(key);
  }
  for (const col of extra || []) {
    names.add(col.includes(".") ? col.slice(col.lastIndexOf(".") + 1) : col);
  }
  for (const c of ["title", "name", "content", "headline", "consignee"]) {
    if (names.has(c)) return c;
  }
  for (const n of names) {
    if (n !== "id" && n !== "userId" && n !== "date" && n !== "status") {
      return n;
    }
  }
  return "title";
}

export function candidatesToPayload(
  kind: SchemaChoiceKind,
  reason: "local_miss" | "ambiguous",
  query: string,
  ranked: SchemaChoiceCandidate[],
  table?: string,
): SchemaChoicePayload {
  return {
    kind,
    reason,
    query,
    table,
    candidates: ranked.slice(0, 8),
  };
}

export function looksLikeCancel(message: string): boolean {
  return /^(取消|算了|不用了|cancel|never\s*mind)$/i.test(message.trim());
}
