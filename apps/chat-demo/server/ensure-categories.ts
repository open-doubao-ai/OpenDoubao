/**
 * Ensure Category table + Access/Request + categoryId columns exist.
 * Runs layout_demo_categories.sql via mysql CLI when information_schema
 * shows the table (or Access) is missing, then reloads APIJSON config.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ApiJsonClient } from "@a2api/runtime";
import {
  clearSchemaCommentCache,
  loadSchemaComments,
  type SchemaComments,
} from "./schema-comments.js";

const CATEGORY_TABLE = "Category";
const LAYOUT_TABLES = [
  "Category",
  "Product",
  "ShopOrder",
  "Address",
  "Music",
  "News",
  "Notice",
  "Video",
  "Blog",
  "Article",
  "Activity",
  "Moment",
  "Message",
  "Course",
  "Book",
  "Comic",
  "Local",
  "Recipe",
  "Trip",
  "Sport",
  "Baby",
  "Workout",
  "Vehicle",
  "Job",
  "House",
  "Beauty",
  "Photo",
  "Note",
] as const;

const SCENE_PROBE = "Course";

function scenesSqlPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "../sql/layout_demo_scenes.sql");
}

export type EnsureCategoriesResult = {
  ok: boolean;
  table: string;
  created: boolean;
  reloaded: boolean;
  comments: SchemaComments;
  error?: string;
  sqlPath?: string;
};

function schemaName(): string {
  return process.env.APIJSON_SCHEMA || process.env.MYSQL_DATABASE || "sys";
}

function sqlPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "../sql/layout_demo_categories.sql");
}

function mysqlBin(): string {
  const fromEnv = process.env.MYSQL_BIN?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  for (const p of [
    "/usr/local/mysql/bin/mysql",
    "/opt/homebrew/opt/mysql/bin/mysql",
    "/opt/homebrew/bin/mysql",
    "/usr/bin/mysql",
  ]) {
    if (existsSync(p)) return p;
  }
  return "mysql";
}

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

async function tableExists(
  client: ApiJsonClient,
  table: string,
): Promise<boolean> {
  const res = await client.execute(
    "get",
    {
      "[]": {
        count: 1,
        Table: {
          TABLE_SCHEMA: schemaName(),
          TABLE_NAME: table,
          "@column": "TABLE_NAME",
        },
      },
    },
    undefined,
    { injectRole: false },
  );
  if (!res.ok) return false;
  return listOk(res.body).length > 0;
}

async function columnExists(
  client: ApiJsonClient,
  table: string,
  column: string,
): Promise<boolean> {
  const res = await client.execute(
    "get",
    {
      "[]": {
        count: 1,
        Column: {
          TABLE_SCHEMA: schemaName(),
          TABLE_NAME: table,
          COLUMN_NAME: column,
          "@column": "COLUMN_NAME",
        },
      },
    },
    undefined,
    { injectRole: false },
  );
  if (!res.ok) return false;
  return listOk(res.body).length > 0;
}

async function categoryRowCount(client: ApiJsonClient): Promise<number | null> {
  const res = await client.execute(
    "get",
    {
      "[]": {
        count: 1,
        [CATEGORY_TABLE]: {},
      },
    },
    undefined,
    { injectRole: false },
  );
  if (!res.ok || !resultOk(res.body)) return null;
  const total = (res.body as { total?: unknown }).total;
  if (typeof total === "number") return total;
  return listOk(res.body).length;
}

function extractVerifyCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const root = body as Record<string, unknown>;
  const verifyObj = root.Verify ?? root.verify;
  if (!verifyObj || typeof verifyObj !== "object") return null;
  const raw = (verifyObj as { verify?: unknown; Verify?: unknown }).verify
    ?? (verifyObj as { Verify?: unknown }).Verify;
  if (raw == null || typeof raw === "object") return null;
  const s = String(raw).trim();
  return s || null;
}

export async function reloadAccess(
  client: ApiJsonClient,
  type: "ACCESS" | "REQUEST" = "ACCESS",
): Promise<boolean> {
  const phone = (
    process.env.APIJSON_ADMIN_LOGIN || "13000082001"
  ).replace(/\D/g, "") || "13000082001";
  const verifyRes = await client.execute(
    "post",
    { type: 4, phone },
    `${client.baseUrl}/post/verify`,
    { injectRole: false },
  );
  if (!verifyRes.ok || !resultOk(verifyRes.body)) return false;
  const code = extractVerifyCode(verifyRes.body);
  if (!code) return false;
  const reloadRes = await client.execute(
    "post",
    { type, phone, verify: code },
    `${client.baseUrl}/reload`,
    { injectRole: false },
  );
  return reloadRes.ok && resultOk(reloadRes.body);
}

function mysqlArgs(): {
  bin: string;
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
} {
  return {
    bin: mysqlBin(),
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: process.env.MYSQL_PORT || "3306",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD ?? "apijson",
    database: process.env.MYSQL_DATABASE || schemaName(),
  };
}

function runMysql(feed: (stdin: NodeJS.WritableStream) => void): Promise<void> {
  const { bin, host, port, user, password, database } = mysqlArgs();
  return new Promise((resolve, reject) => {
    const child = spawn(
      bin,
      [
        `-h${host}`,
        `-P${port}`,
        `-u${user}`,
        `--default-character-set=utf8mb4`,
        database,
      ],
      {
        env: { ...process.env, MYSQL_PWD: password },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    const chunks: Buffer[] = [];
    child.stdout.on("data", (d: Buffer) => chunks.push(d));
    child.stderr.on("data", (d: Buffer) => chunks.push(d));
    child.on("error", (err) => {
      reject(
        new Error(
          `mysql CLI not found (${bin}). Install MySQL client or set MYSQL_BIN. ${err.message}`,
        ),
      );
    });
    child.on("close", (code) => {
      const out = Buffer.concat(chunks).toString("utf8").trim();
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `mysql exit ${code}${out ? `: ${out.slice(0, 500)}` : ""}`,
        ),
      );
    });
    feed(child.stdin);
  });
}

export function runMysqlFile(file: string): Promise<void> {
  return runMysql((stdin) => {
    void import("node:fs").then(({ createReadStream }) => {
      createReadStream(file).pipe(stdin);
    });
  });
}

export function runMysqlSql(sql: string): Promise<void> {
  return runMysql((stdin) => {
    stdin.end(sql);
  });
}

export async function ensureLayoutCategories(
  client: ApiJsonClient,
): Promise<EnsureCategoriesResult> {
  const file = sqlPath();
  const exists = await tableExists(client, CATEGORY_TABLE);
  const count = exists ? await categoryRowCount(client) : null;
  const itemFk = exists
    ? await columnExists(client, "Product", "categoryId")
    : false;
  const ready = exists && count != null && count > 0 && itemFk;
  let created = false;
  let reloaded = false;
  if (!ready) {
    if (!existsSync(file)) {
      return {
        ok: false,
        table: CATEGORY_TABLE,
        created: false,
        reloaded: false,
        comments: { tables: {}, columns: {}, types: {} },
        error: `SQL file missing: ${file}`,
        sqlPath: file,
      };
    }
    try {
      await runMysqlFile(file);
      created = true;
    } catch (e) {
      return {
        ok: false,
        table: CATEGORY_TABLE,
        created: false,
        reloaded: false,
        comments: { tables: {}, columns: {}, types: {} },
        error: e instanceof Error ? e.message : String(e),
        sqlPath: file,
      };
    }
    reloaded = await reloadAccess(client);
  }
  const scenesFile = scenesSqlPath();
  const scenesReady = await tableExists(client, SCENE_PROBE);
  if (!scenesReady && existsSync(scenesFile)) {
    try {
      await runMysqlFile(scenesFile);
      created = true;
      reloaded = (await reloadAccess(client)) || reloaded;
    } catch (e) {
      return {
        ok: false,
        table: SCENE_PROBE,
        created,
        reloaded,
        comments: { tables: {}, columns: {}, types: {} },
        error: e instanceof Error ? e.message : String(e),
        sqlPath: scenesFile,
      };
    }
  }
  clearSchemaCommentCache();
  const comments = await loadSchemaComments(client, [...LAYOUT_TABLES]);
  const okNow = await tableExists(client, CATEGORY_TABLE);
  return {
    ok: okNow,
    table: CATEGORY_TABLE,
    created,
    reloaded,
    comments,
    sqlPath: file,
    ...(okNow
      ? {}
      : {
          error:
            "Category table still missing after import. Run layout_demo_categories.sql and reload Access.",
        }),
  };
}

async function pageAccessLive(client: ApiJsonClient): Promise<boolean> {
  const res = await client.execute(
    "get",
    { "[]": { count: 1, Page: {} } },
    undefined,
    { injectRole: false },
  );
  if (res.ok && resultOk(res.body)) return true;
  const body =
    res.body && typeof res.body === "object"
      ? (res.body as { code?: unknown; msg?: unknown })
      : null;
  const msg = String(body?.msg ?? "");
  // UNKNOWN GET is refused only after Access.Page is loaded.
  return body?.code === 401 && /Page/.test(msg);
}

export async function ensureLayoutPages(
  client: ApiJsonClient,
): Promise<EnsureCategoriesResult> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const file = path.join(here, "../sql/layout_demo_pages.sql");
  const table = "Page";
  const exists = await tableExists(client, table);
  const accessLive = exists ? await pageAccessLive(client) : false;
  let created = false;
  let reloaded = false;
  if (!exists || !accessLive) {
    if (!existsSync(file)) {
      return {
        ok: false,
        table,
        created: false,
        reloaded: false,
        comments: { tables: {}, columns: {}, types: {} },
        error: `SQL file missing: ${file}`,
        sqlPath: file,
      };
    }
    try {
      await runMysqlFile(file);
      created = true;
    } catch (e) {
      return {
        ok: false,
        table,
        created: false,
        reloaded: false,
        comments: { tables: {}, columns: {}, types: {} },
        error: e instanceof Error ? e.message : String(e),
        sqlPath: file,
      };
    }
    reloaded = await reloadAccess(client);
    reloaded = (await reloadAccess(client, "REQUEST")) || reloaded;
  }
  clearSchemaCommentCache();
  const comments = await loadSchemaComments(client, [table]);
  const okNow = await tableExists(client, table);
  return {
    ok: okNow,
    table,
    created,
    reloaded,
    comments,
    sqlPath: file,
    ...(okNow ? {} : { error: "Page table still missing after import." }),
  };
}

export async function ensureLayoutAddress(
  client: ApiJsonClient,
): Promise<EnsureCategoriesResult> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const file = path.join(here, "../sql/layout_demo_address.sql");
  const table = "Address";
  const exists = await tableExists(client, table);
  const count = exists
    ? await (async () => {
        const res = await client.execute(
          "get",
          { "[]": { count: 1, Address: {} } },
          undefined,
          { injectRole: false },
        );
        if (!res.ok || !resultOk(res.body)) return null;
        return listOk(res.body).length;
      })()
    : null;
  const ready = exists && count != null && count > 0;
  let created = false;
  let reloaded = false;
  if (!ready) {
    if (!existsSync(file)) {
      return {
        ok: false,
        table,
        created: false,
        reloaded: false,
        comments: { tables: {}, columns: {}, types: {} },
        error: `SQL file missing: ${file}`,
        sqlPath: file,
      };
    }
    try {
      await runMysqlFile(file);
      created = true;
    } catch (e) {
      return {
        ok: false,
        table,
        created: false,
        reloaded: false,
        comments: { tables: {}, columns: {}, types: {} },
        error: e instanceof Error ? e.message : String(e),
        sqlPath: file,
      };
    }
    reloaded = await reloadAccess(client);
  }
  clearSchemaCommentCache();
  const comments = await loadSchemaComments(client, [table, "ShopOrder", "Product"]);
  const okNow = await tableExists(client, table);
  return {
    ok: okNow,
    table,
    created,
    reloaded,
    comments,
    sqlPath: file,
    ...(okNow
      ? {}
      : { error: "Address table still missing after import." }),
  };
}
