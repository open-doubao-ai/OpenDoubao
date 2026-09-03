/**
 * Live table/column catalog via APIJSON (Access + information_schema Table/Column).
 * Local SCHEMA_DICT / skills are a first pass; this fills gaps.
 */

import { SCHEMA_DICT } from "./schema-dict.js";
import {
  loadSchemaComments,
  logicalTableName,
  type SchemaComments,
} from "./schema-comments.js";
import { peekSkills } from "./skills.js";
import type { ApiJsonClient } from "@a2api/runtime";

export type CatalogSource = "local" | "access" | "table" | "column";

export type LiveTable = {
  name: string;
  comment: string;
  source: CatalogSource;
};

export type LiveColumn = {
  table: string;
  name: string;
  comment: string;
  type?: string;
  source: CatalogSource;
};

const CACHE_TTL_MS = 60 * 1000;
let tableCache: { at: number; tables: LiveTable[] } | null = null;

const CONFIG_TABLES = new Set(
  [
    "Access",
    "Request",
    "Response",
    "Function",
    "Document",
    "Script",
    "Test",
    "TestRecord",
    "Random",
    "Method",
    "Verify",
    "Login",
    "Table",
    "Column",
    "SysTable",
    "SysColumn",
    "AllTable",
    "AllColumn",
    "PgAttribute",
    "PgClass",
    "ExtendedProperty",
    "Apply",
    "Call",
    "Page",
  ].map((t) => t.toLowerCase()),
);

function listBodyOk(body: unknown): unknown[] {
  if (!body || typeof body !== "object") return [];
  const arr = (body as { "[]"?: unknown })["[]"];
  return Array.isArray(arr) ? arr : [];
}

export function isBusinessTableName(name: string): boolean {
  const raw = name.trim();
  if (!raw || raw === "Record" || raw === "[]" || raw.includes(":")) {
    return false;
  }
  const lower = raw.toLowerCase();
  if (
    lower.startsWith("mysql.") ||
    lower.startsWith("information_schema.") ||
    lower.startsWith("performance_schema.") ||
    lower.startsWith("sys.")
  ) {
    return false;
  }
  if (CONFIG_TABLES.has(lower)) return false;
  const noSys = lower.startsWith("sys_") ? lower.slice(4) : lower;
  if (CONFIG_TABLES.has(noSys)) return false;
  if (!/^[A-Za-z]/.test(raw)) return false;
  return true;
}

function accessDisplayName(name: string, alias: string): string {
  if (alias && /^[A-Z]/.test(alias)) return alias;
  if (name && /^[A-Z]/.test(name)) return name;
  const logical = logicalTableName(alias || name);
  if (logical && /^[A-Z]/.test(logical)) return logical;
  return alias || name;
}

/** Parse the baked-in SCHEMA_DICT into table name + comment + field list. */
export function tablesFromSchemaDict(dict = SCHEMA_DICT): LiveTable[] {
  const out: LiveTable[] = [];
  for (const line of dict.split("\n")) {
    const m = line.trim().match(/^- ([A-Za-z][A-Za-z0-9]*):\s*(.+)$/);
    if (!m) continue;
    const name = m[1];
    const rest = m[2];
    const comment = (rest.match(/\(([^)]+)\)\s*$/)?.[1] || rest).trim();
    if (!isBusinessTableName(name)) continue;
    out.push({ name, comment, source: "local" });
  }
  return out;
}

export function tablesFromSkills(): LiveTable[] {
  const out: LiveTable[] = [];
  for (const s of peekSkills()) {
    const name = (s.tableName || "").trim();
    if (!name || !isBusinessTableName(name)) continue;
    const comment = [s.title, s.titleEn, ...(s.tokens || [])]
      .filter(Boolean)
      .join(" ");
    out.push({ name, comment, source: "local" });
  }
  return out;
}

export function localSchemaTables(): LiveTable[] {
  return mergeLiveTables(tablesFromSchemaDict(), tablesFromSkills());
}

export function mergeLiveTables(...groups: LiveTable[][]): LiveTable[] {
  const by = new Map<string, LiveTable>();
  for (const group of groups) {
    for (const t of group) {
      const key = t.name;
      const prev = by.get(key);
      if (!prev) {
        by.set(key, t);
        continue;
      }
      const comment = t.comment || prev.comment;
      const source =
        t.source === "access" || prev.source === "access"
          ? "access"
          : t.source === "table" || prev.source === "table"
            ? "table"
            : t.source;
      by.set(key, { name: key, comment, source });
    }
  }
  return [...by.values()];
}

export function catalogToComments(tables: LiveTable[]): SchemaComments {
  const comments: SchemaComments = { tables: {}, columns: {}, types: {} };
  for (const t of tables) {
    if (t.comment) comments.tables[t.name] = t.comment;
    else if (!comments.tables[t.name]) comments.tables[t.name] = "";
  }
  return comments;
}

function formatAccessPage(page: number, withDetail: boolean) {
  return {
    "[]": {
      count: 100,
      page,
      Access: {
        "@column": withDetail ? "name,alias,detail" : "name,alias",
      },
    },
  };
}

async function fetchAccessTables(client: ApiJsonClient): Promise<LiveTable[]> {
  const out: LiveTable[] = [];
  let withDetail = true;
  for (let page = 0; page < 50; page++) {
    const result = await client.execute(
      "get",
      formatAccessPage(page, withDetail),
      undefined,
      { injectRole: false },
    );
    if (!result.ok && withDetail && page === 0) {
      withDetail = false;
      page = -1;
      continue;
    }
    if (!result.ok) break;
    const list = listBodyOk(result.body);
    for (const item of list) {
      const wrap = item as Record<string, unknown>;
      const access =
        wrap.Access && typeof wrap.Access === "object"
          ? (wrap.Access as Record<string, unknown>)
          : wrap;
      const name = String(access.name ?? "").trim();
      const alias = String(access.alias ?? "").trim();
      const display = accessDisplayName(name, alias);
      if (!display || !isBusinessTableName(display)) continue;
      const comment = String(access.detail ?? "").replace(/\n+/g, " ").trim();
      out.push({ name: display, comment, source: "access" });
    }
    if (list.length < 100) break;
  }
  return out;
}

async function fetchInformationSchemaTables(
  client: ApiJsonClient,
): Promise<LiveTable[]> {
  const schema = process.env.APIJSON_SCHEMA ?? "sys";
  const out: LiveTable[] = [];
  for (let page = 0; page < 20; page++) {
    const result = await client.execute(
      "get",
      {
        "[]": {
          count: 100,
          page,
          Table: {
            TABLE_SCHEMA: schema,
            "@column": "TABLE_NAME,TABLE_COMMENT",
          },
        },
      },
      undefined,
      { injectRole: false },
    );
    if (!result.ok) break;
    const list = listBodyOk(result.body);
    for (const item of list) {
      const t = (item as { Table?: Record<string, unknown> }).Table;
      if (!t?.TABLE_NAME) continue;
      const logical = logicalTableName(String(t.TABLE_NAME));
      if (!isBusinessTableName(logical)) continue;
      const comment = String(t.TABLE_COMMENT ?? "")
        .replace(/\n+/g, " ")
        .trim();
      out.push({ name: logical, comment, source: "table" });
    }
    if (list.length < 100) break;
  }
  return out;
}

/** Access first, then information_schema Table. Cached briefly. */
export async function loadLiveTableCatalog(
  client: ApiJsonClient,
): Promise<LiveTable[]> {
  if (tableCache && Date.now() - tableCache.at < CACHE_TTL_MS) {
    return tableCache.tables;
  }
  let access: LiveTable[] = [];
  let tables: LiveTable[] = [];
  try {
    access = await fetchAccessTables(client);
  } catch {
    access = [];
  }
  try {
    tables = await fetchInformationSchemaTables(client);
  } catch {
    tables = [];
  }
  const merged = mergeLiveTables(access, tables);
  if (merged.length) {
    tableCache = { at: Date.now(), tables: merged };
  }
  return merged;
}

export function columnsFromComments(
  table: string,
  comments: SchemaComments | null | undefined,
  extra?: string[],
): LiveColumn[] {
  const out = new Map<string, LiveColumn>();
  const prefix = `${table}.`;
  for (const [key, note] of Object.entries(comments?.columns || {})) {
    if (!key.startsWith(prefix) && key.includes(".")) continue;
    const name = key.startsWith(prefix) ? key.slice(prefix.length) : key;
    if (!name) continue;
    out.set(name, {
      table,
      name,
      comment: String(note || ""),
      type: comments?.types?.[`${table}.${name}`],
      source: "column",
    });
  }
  for (const col of extra || []) {
    const name = col.includes(".") ? col.slice(col.lastIndexOf(".") + 1) : col;
    if (!name || out.has(name)) continue;
    out.set(name, { table, name, comment: "", source: "local" });
  }
  return [...out.values()];
}

export async function loadLiveColumns(
  client: ApiJsonClient,
  table: string,
): Promise<{ comments: SchemaComments; columns: LiveColumn[] }> {
  const comments = await loadSchemaComments(client, [table]);
  return { comments, columns: columnsFromComments(table, comments) };
}

export function formatSchemaDigest(
  comments: SchemaComments | null | undefined,
  table?: string,
): string {
  if (!comments) return "";
  const tables = Object.entries(comments.tables || {});
  const cols = Object.entries(comments.columns || {});
  const tableLines = tables
    .filter(([n]) => !table || n === table)
    .slice(0, 40)
    .map(([n, c]) => `- ${n}: ${c}`)
    .join("\n");
  const colLines = cols
    .filter(([k]) => !table || k.startsWith(`${table}.`))
    .slice(0, 80)
    .map(([k, c]) => `- ${k}: ${c}`)
    .join("\n");
  return [
    tableLines ? `Live tables:\n${tableLines}` : "",
    colLines ? `Live columns:\n${colLines}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function clearLiveTableCatalogCache(): void {
  tableCache = null;
}
