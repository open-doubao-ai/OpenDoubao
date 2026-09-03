/**
 * Scene skills stored in APIJSON `Skill` — list, match, upload, prompt inject.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ApiJsonClient } from "@a2api/runtime";
import { reloadAccess, runMysqlFile, runMysqlSql } from "./ensure-categories.js";

export type SkillRow = {
  id?: number;
  userId?: number;
  name: string;
  title: string;
  titleEn?: string;
  tableName: string;
  family: string;
  tokens: string[];
  description?: string;
  /** Public file URL — DB stores this, not the markdown body. */
  url?: string;
  /** Resolved markdown (from file / fallback). Never persisted. */
  body?: string;
  version?: number;
  status?: string;
  cover?: string;
};

const MIN_SKILL_BODY = 40;

type BundledSkill = {
  name: string;
  title: string;
  titleEn?: string;
  tableName: string;
  family: string;
  tokens: string[];
  description?: string;
  body: string;
};

function hereDir(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}

function bundledSkillsDir(): string {
  return path.join(hereDir(), "../skills");
}

function uploadedSkillsDir(): string {
  return path.join(hereDir(), "../data/skills");
}

function bundledCatalogPath(): string {
  return path.join(hereDir(), "../client/skill-fallbacks.json");
}

export function safeSkillName(name: string): string {
  return (
    String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "skill"
  );
}

export function skillFileUrl(name: string): string {
  return `/skills/${safeSkillName(name)}.md`;
}

function stripFrontmatter(markdown: string): string {
  const text = String(markdown || "").replace(/^\uFEFF/, "");
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  return (m ? m[1] : text).trim();
}

function bodyEnough(markdown: string | null | undefined): boolean {
  return stripFrontmatter(markdown || "").length >= MIN_SKILL_BODY;
}

let bundledCache: BundledSkill[] | null = null;

function loadBundledCatalog(): BundledSkill[] {
  if (bundledCache) return bundledCache;
  try {
    const raw = JSON.parse(readFileSync(bundledCatalogPath(), "utf8")) as unknown;
    bundledCache = Array.isArray(raw) ? (raw as BundledSkill[]) : [];
  } catch {
    bundledCache = [];
  }
  return bundledCache;
}

function bundledByName(name: string): BundledSkill | undefined {
  const n = safeSkillName(name);
  return loadBundledCatalog().find((s) => s.name === n);
}

export function skillMarkdownFromRow(row: {
  name: string;
  title?: string;
  titleEn?: string;
  tableName?: string;
  family?: string;
  tokens?: string[];
  description?: string;
  body?: string;
}): string {
  const tokens = JSON.stringify(row.tokens ?? []);
  const body = String(row.body || "").trim();
  return `---
name: ${row.name}
title: ${row.title || row.name}
titleEn: ${row.titleEn || row.title || row.name}
tableName: ${row.tableName || ""}
family: ${row.family || "local"}
tokens: ${tokens}
description: ${row.description || ""}
---
${body}
`;
}

export function writeSkillFile(
  name: string,
  markdown: string,
  kind: "upload" | "bundled" = "upload",
): string {
  const n = safeSkillName(name);
  const dir = kind === "upload" ? uploadedSkillsDir() : bundledSkillsDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${n}.md`), markdown.replace(/^\uFEFF/, ""), "utf8");
  return skillFileUrl(n);
}

export function resolveSkillMarkdown(name: string): string {
  const n = safeSkillName(name);
  const paths = [
    path.join(uploadedSkillsDir(), `${n}.md`),
    path.join(bundledSkillsDir(), `${n}.md`),
  ];
  for (const file of paths) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    if (bodyEnough(text)) return text;
  }
  const fb = bundledByName(n);
  if (fb?.body && bodyEnough(fb.body)) return skillMarkdownFromRow(fb);
  return "";
}

export function readSkillPublicFile(file: string): string | null {
  const base = path.basename(file || "");
  const name = base.replace(/\.md$/i, "");
  if (!name || name !== safeSkillName(name)) return null;
  const text = resolveSkillMarkdown(name);
  return text || null;
}

export function ensureSkillFiles() {
  mkdirSync(bundledSkillsDir(), { recursive: true });
  for (const row of loadBundledCatalog()) {
    const dest = path.join(bundledSkillsDir(), `${row.name}.md`);
    if (existsSync(dest) && bodyEnough(readFileSync(dest, "utf8"))) continue;
    writeSkillFile(row.name, skillMarkdownFromRow(row), "bundled");
  }
}

const TTL_MS = 30_000;
let cache: SkillRow[] = [];
let cacheAt = 0;

function listOk(body: unknown): unknown[] {
  if (!body || typeof body !== "object") return [];
  const arr = (body as { "[]"?: unknown })["[]"];
  return Array.isArray(arr) ? arr : [];
}

function resultOk(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const code = (body as { code?: unknown }).code;
  return code === 200 || code === "200";
}

function parseTokens(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof raw !== "string" || !raw.trim()) return [];
  const s = raw.trim();
  if (s.startsWith("[")) {
    try {
      const parsed = JSON.parse(s) as unknown;
      return parseTokens(parsed);
    } catch {
      return s
        .replace(/^\[|\]$/g, "")
        .split(/[,，|]/)
        .map((x) => x.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
  }
  return s
    .split(/[,，|]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

const FAMILY_TABLE: Record<string, string> = {
  data: "Employee",
  commerce: "Product",
  video: "Video",
  music: "Music",
  news: "News",
  info: "Notice",
  blog: "Blog",
  article: "Article",
  books: "Book",
  comics: "Comic",
  social: "Moment",
  chat: "Message",
  campaign: "Activity",
  education: "Course",
  office: "Note",
  lifestyle: "Local",
  food: "Recipe",
  travel: "Trip",
  sports: "Sport",
  parenting: "Baby",
  health: "Workout",
  auto: "Vehicle",
  jobs: "Job",
  housing: "House",
  beauty: "Beauty",
  photo: "Photo",
  local: "Local",
  catalog: "Local",
  media: "Video",
  read: "Article",
};

const FAMILY_APP: Record<string, string> = {
  local: "lifestyle",
  catalog: "lifestyle",
  media: "video",
  read: "article",
};

const LAYOUT_APP_NAMES = new Set([
  "data",
  "commerce",
  "video",
  "music",
  "news",
  "info",
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
]);

export function layoutAppForSkill(skill: {
  name: string;
  family?: string | null;
}): string {
  if (LAYOUT_APP_NAMES.has(skill.name)) {
    return skill.name === "info" ? "news" : skill.name;
  }
  const family = String(skill.family || "").trim();
  if (family === "info") return "news";
  if (LAYOUT_APP_NAMES.has(family)) return family;
  return FAMILY_APP[family] || "data";
}

function unwrapSkill(row: unknown): SkillRow | null {
  if (!row || typeof row !== "object") return null;
  const rec = row as Record<string, unknown>;
  const raw = (rec.Skill || rec.skill || rec) as Record<string, unknown>;
  const name = String(raw.name || "").trim();
  if (!name) return null;
  return {
    id: typeof raw.id === "number" ? raw.id : Number(raw.id) || undefined,
    userId:
      typeof raw.userId === "number" ? raw.userId : Number(raw.userId) || undefined,
    name,
    title: String(raw.title || name),
    titleEn: raw.titleEn != null ? String(raw.titleEn) : "",
    tableName: String(raw.tableName || ""),
    family: String(raw.family || "local"),
    tokens: parseTokens(raw.tokens),
    description: raw.description != null ? String(raw.description) : "",
    url: String(raw.url || skillFileUrl(name)),
    body: raw.body != null ? String(raw.body) : "",
    version: typeof raw.version === "number" ? raw.version : 1,
    status: String(raw.status || "online"),
    cover: raw.cover != null ? String(raw.cover) : "",
  };
}

export function peekSkills(): SkillRow[] {
  return cache;
}

export function invalidateSkillCache() {
  cacheAt = 0;
}

function skillsSqlPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "../sql/layout_demo_skills.sql");
}

export async function ensureLayoutSkills(
  client: ApiJsonClient,
): Promise<{ ok: boolean; created: boolean; error?: string }> {
  const probe = await client.execute(
    "get",
    { "[]": { count: 1, Skill: {}, query: 2 } },
    undefined,
    { injectRole: false },
  );
  const ready = probe.ok && resultOk(probe.body) && listOk(probe.body).length > 0;
  ensureSkillFiles();
  if (ready) {
    await loadSkills(client, true);
    return { ok: true, created: false };
  }
  const file = skillsSqlPath();
  if (!existsSync(file)) {
    return { ok: false, created: false, error: `SQL file missing: ${file}` };
  }
  try {
    await runMysqlFile(file);
    await reloadAccess(client);
    ensureSkillFiles();
    await loadSkills(client, true);
    return { ok: true, created: true };
  } catch (e) {
    return {
      ok: false,
      created: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function loadSkills(
  client: ApiJsonClient,
  force = false,
): Promise<SkillRow[]> {
  if (!force && cache.length && Date.now() - cacheAt < TTL_MS) return cache;
  const res = await client.execute(
    "get",
    {
      "[]": {
        count: 100,
        page: 0,
        Skill: { status: "online", "@order": "id+" },
        query: 2,
      },
    },
    undefined,
    { injectRole: false },
  );
  if (!res.ok || !resultOk(res.body)) return cache;
  const rows = listOk(res.body)
    .map(unwrapSkill)
    .filter((x): x is SkillRow => Boolean(x));
  if (rows.length) {
    migrateBodiesToFiles(rows);
    cache = rows.map((s) => ({ ...s, body: "", url: s.url || skillFileUrl(s.name) }));
    cacheAt = Date.now();
  }
  return cache;
}

function migrateBodiesToFiles(rows: SkillRow[]) {
  for (const row of rows) {
    if (bodyEnough(resolveSkillMarkdown(row.name))) continue;
    if (row.body && bodyEnough(row.body)) {
      writeSkillFile(row.name, skillMarkdownFromRow(row), "upload");
    }
  }
}

export function matchSkills(
  hay: {
    prompt?: string | null;
    table?: string | null;
    app?: string | null;
  },
  rows: SkillRow[] = cache,
): Array<SkillRow & { score: number }> {
  const blob = [hay.prompt, hay.table, hay.app]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!blob) {
    return rows.slice(0, 8).map((s) => ({ ...s, score: 0 }));
  }
  const scored = rows
    .map((s) => {
      let score = 0;
      const needles = [
        s.name,
        s.title,
        s.titleEn,
        s.tableName,
        s.family,
        ...s.tokens,
      ]
        .map((x) => String(x || "").toLowerCase())
        .filter(Boolean);
      for (const n of needles) {
        if (!n) continue;
        if (blob === n) score += 12;
        else if (blob.includes(n)) score += n.length >= 4 ? 8 : 4;
      }
      return { ...s, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored;
}

export function skillsPromptBlock(
  matched: SkillRow[],
  limit = 3,
): string {
  const top = matched.slice(0, limit);
  if (!top.length) return "";
  const blocks = top.map((s) => {
    const markdown = resolveSkillMarkdown(s.name);
    const body = stripFrontmatter(markdown);
    const head = `${s.title} (${s.name}) table=${s.tableName || "—"} family=${s.family} url=${s.url || skillFileUrl(s.name)}`;
    const desc = s.description ? `\n${s.description}` : "";
    return `### ${head}${desc}${body ? `\n${body}` : ""}`;
  });
  return `\n\nScene skills (use the matching skill; honor its table and Category.app):\n${blocks.join("\n\n")}\n`;
}

function parseFrontmatter(markdown: string): {
  meta: Record<string, string>;
  body: string;
} {
  const text = markdown.replace(/^\uFEFF/, "");
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text.trim() };
  const meta: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) meta[key] = val;
  }
  return { meta, body: m[2].trim() };
}

export function parseSkillUpload(input: {
  markdown?: string;
  skill?: Record<string, unknown>;
}): SkillRow {
  const fromMd = input.markdown?.trim()
    ? parseFrontmatter(input.markdown)
    : { meta: {} as Record<string, string>, body: "" };
  let fromJson: Record<string, unknown> = {};
  const maybeJson = (fromMd.body || input.markdown || "").trim();
  if (maybeJson.startsWith("{")) {
    try {
      const parsed = JSON.parse(maybeJson) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        fromJson = parsed as Record<string, unknown>;
      }
    } catch {
      /* not JSON */
    }
  }
  const raw = { ...fromMd.meta, ...fromJson, ...(input.skill || {}) };
  const name = String(raw.name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!name) {
    throw new Error("Skill needs a name (frontmatter name: or JSON name).");
  }
  const title = String(raw.title || name);
  const family = String(raw.family || "local").trim() || "local";
  const tableName =
    String(raw.tableName || raw.table || "").trim() ||
    FAMILY_TABLE[name] ||
    FAMILY_TABLE[family] ||
    "Local";
  return {
    name,
    title,
    titleEn: String(raw.titleEn || raw["title-en"] || title),
    tableName,
    family,
    tokens: parseTokens(raw.tokens),
    description: String(raw.description || ""),
    url: String(raw.url || skillFileUrl(name)),
    body: String(raw.body || (fromJson.name ? "" : fromMd.body) || ""),
    version: Number(raw.version) || 1,
    status: String(raw.status || "online"),
    cover: String(raw.cover || ""),
  };
}

export async function uploadSkill(
  client: ApiJsonClient,
  input: { markdown?: string; skill?: Record<string, unknown> },
): Promise<{ ok: boolean; skill?: SkillRow; id?: number; error?: string }> {
  let row: SkillRow;
  try {
    row = parseSkillUpload(input);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  const existing = await findSkillByName(client, row.name);
  const markdown = input.markdown?.trim() || skillMarkdownFromRow(row);
  const url = writeSkillFile(row.name, markdown, "upload");
  row.url = url;
  const payload: Record<string, unknown> = {
    name: row.name,
    title: row.title,
    titleEn: row.titleEn,
    tableName: row.tableName,
    family: row.family,
    tokens: row.tokens,
    description: row.description,
    url,
    version: row.version ?? 1,
    status: row.status || "online",
    cover: row.cover || "",
  };
  if (existing?.id) {
    const res = await client.execute(
      "put",
      { Skill: { id: existing.id, ...payload }, tag: "Skill" },
      undefined,
      { injectRole: true },
    );
    if (res.ok && resultOk(res.body)) {
      invalidateSkillCache();
      await loadSkills(client, true);
      return { ok: true, skill: { ...row, id: existing.id }, id: existing.id };
    }
  } else {
    const res = await client.execute(
      "post",
      { Skill: payload, tag: "Skill" },
      undefined,
      { injectRole: true },
    );
    if (res.ok && resultOk(res.body)) {
      const created = unwrapSkill(res.body);
      invalidateSkillCache();
      await loadSkills(client, true);
      return { ok: true, skill: created || row, id: created?.id };
    }
  }
  try {
    await upsertSkillMysql(row, existing?.id);
    invalidateSkillCache();
    const skills = await loadSkills(client, true);
    const saved = skills.find((s) => s.name === row.name);
    return { ok: true, skill: saved || row, id: saved?.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function findSkillByName(
  client: ApiJsonClient,
  name: string,
): Promise<SkillRow | null> {
  const cached = cache.find((s) => s.name === name);
  if (cached?.id) return cached;
  const res = await client.execute(
    "get",
    { Skill: { name } },
    undefined,
    { injectRole: false },
  );
  if (!res.ok || !resultOk(res.body)) return null;
  return unwrapSkill(res.body);
}

function sqlQuote(s: string): string {
  return `'${s.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

async function upsertSkillMysql(row: SkillRow, existingId?: number): Promise<number> {
  const tokens = sqlQuote(JSON.stringify(row.tokens));
  const cols = `
    userId = 82001,
    name = ${sqlQuote(row.name)},
    title = ${sqlQuote(row.title)},
    titleEn = ${sqlQuote(row.titleEn || "")},
    tableName = ${sqlQuote(row.tableName)},
    family = ${sqlQuote(row.family)},
    tokens = CAST(${tokens} AS JSON),
    description = ${sqlQuote(row.description || "")},
    url = ${sqlQuote(row.url || skillFileUrl(row.name))},
    body = NULL,
    version = ${Number(row.version) || 1},
    status = ${sqlQuote(row.status || "online")},
    cover = ${sqlQuote(row.cover || "")}`;
  if (existingId) {
    await runMysqlSql(`UPDATE Skill SET ${cols} WHERE id = ${existingId};`);
    return existingId;
  }
  await runMysqlSql(`
INSERT INTO Skill (id, userId, name, title, titleEn, tableName, family, tokens, description, url, body, version, status, cover, date)
SELECT COALESCE((SELECT MAX(id) FROM Skill s), 4000) + 1, 82001,
  ${sqlQuote(row.name)}, ${sqlQuote(row.title)}, ${sqlQuote(row.titleEn || "")},
  ${sqlQuote(row.tableName)}, ${sqlQuote(row.family)}, CAST(${tokens} AS JSON),
  ${sqlQuote(row.description || "")}, ${sqlQuote(row.url || skillFileUrl(row.name))},
  NULL,
  ${Number(row.version) || 1}, ${sqlQuote(row.status || "online")},
  ${sqlQuote(row.cover || "")}, NOW()
FROM DUAL
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  titleEn = VALUES(titleEn),
  tableName = VALUES(tableName),
  family = VALUES(family),
  tokens = VALUES(tokens),
  description = VALUES(description),
  url = VALUES(url),
  body = NULL,
  version = VALUES(version),
  status = VALUES(status),
  cover = VALUES(cover);
`);
  const found = cache.find((s) => s.name === row.name);
  return found?.id || existingId || 0;
}

export function skillToHint(row: SkillRow): {
  name: string;
  title: string;
  titleEn?: string;
  tableName: string;
  family: string;
  tokens: string[];
  description?: string;
  url?: string;
} {
  return {
    name: row.name,
    title: row.title,
    titleEn: row.titleEn,
    tableName: row.tableName,
    family: row.family,
    tokens: row.tokens,
    description: row.description,
    url: row.url || skillFileUrl(row.name),
  };
}
