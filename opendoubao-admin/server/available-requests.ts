/**
 * Load API catalog from APIJSON: Document first, then Request / Access / Function.
 */

import { ApiJsonClient } from "@a2api/runtime";
import {
  asRecord,
  buildAvailableCatalog,
  decideWriteGate,
  type AvailableRequest,
  type WriteGate,
} from "./api-catalog.js";
import { ensureAdminSession } from "./approve-writer.js";

export type {
  AvailableRequest,
  CatalogDocument,
  CatalogFunction,
  CatalogSource,
  WriteGate,
  WriteGateDecision,
} from "./api-catalog.js";
export { buildAvailableCatalog, decideWriteGate } from "./api-catalog.js";

function resultOk(body: unknown): boolean {
  const root = asRecord(body);
  if (!root) return false;
  const code = root.code;
  return code === 200 || code === "200";
}

async function listTable(
  client: ApiJsonClient,
  table: string,
  column?: string,
  pages = 20,
): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  for (let page = 0; page < pages; page++) {
    const body: Record<string, unknown> = {
      "[]": {
        count: 100,
        page,
        [table]: column ? { "@column": column } : {},
      },
    };
    const res = await client.execute("get", body);
    if (!res.ok || !resultOk(res.body)) break;
    const arr = asRecord(res.body)?.["[]"];
    if (!Array.isArray(arr) || !arr.length) break;
    for (const wrap of arr) {
      const w = asRecord(wrap);
      const row = asRecord(w?.[table]);
      if (row) out.push(row);
    }
    if (arr.length < 100) break;
  }
  return out;
}

async function loadCatalogRows(client: ApiJsonClient): Promise<{
  accessRows: Record<string, unknown>[];
  requestRows: Record<string, unknown>[];
  documentRows: Record<string, unknown>[];
  functionRows: Record<string, unknown>[];
}> {
  const [accessRows, requestRows, documentRows, functionRows] =
    await Promise.all([
      listTable(
        client,
        "Access",
        "id,name,alias,get,head,gets,heads,post,put,delete,detail",
      ),
      listTable(client, "Request", "id,method,tag,version,structure,detail"),
      listTable(
        client,
        "Document",
        "id,name,operation,method,type,url,request,apijson,version,detail",
      ),
      listTable(client, "Function"),
    ]);
  return { accessRows, requestRows, documentRows, functionRows };
}

export async function loadAvailableRequests(
  client: ApiJsonClient,
): Promise<AvailableRequest[]> {
  const session = await ensureAdminSession(client);
  if (!session.ok) {
    throw new Error(session.error || "APIJSON login failed");
  }
  return buildAvailableCatalog(await loadCatalogRows(client));
}

/**
 * Resolve which existing API to use:
 * Document → Request / Access / Function → Apply for a new API.
 */
export async function resolveWriteGate(
  client: ApiJsonClient,
  operation: string,
  tag: string,
): Promise<WriteGate> {
  const session = await ensureAdminSession(client);
  if (!session.ok) {
    throw new Error(session.error || "APIJSON login failed");
  }
  return decideWriteGate(operation, tag, await loadCatalogRows(client));
}
