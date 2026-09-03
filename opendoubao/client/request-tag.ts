/**
 * Assign APIJSON outermost `tag` for demo writes / open GET.
 * Default = table name; variant only when that Request is taken and unfit.
 */

import {
  resolveRequestTag,
  shouldOmitOpenGetTag,
  validateRequestStructure,
  variantRequestTagCandidates,
  type ApiJsonMethod,
  type RequestStructureRow,
} from "@a2api/protocol";
import {
  ensureRequestStructures,
  lookupRequestStructure,
} from "./request-structures.js";

const STRUCTURE_METHODS = new Set<string>([
  "get",
  "gets",
  "head",
  "heads",
  "post",
  "put",
  "delete",
]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function extraTablesUnfit(
  table: string,
  body: Record<string, unknown>,
  row: RequestStructureRow,
): boolean {
  const extra = Object.keys(body).filter(
    (k) => /^[A-Z]/.test(k) && k !== table && isPlainObject(body[k]),
  );
  if (!extra.length) return false;
  const nested = Object.keys(row.structure).filter((k) => /^[A-Z]/.test(k));
  return extra.some((t) => !nested.includes(t));
}

export function tableTagUnfit(
  method: string,
  table: string,
  body: Record<string, unknown>,
  relateUnfit = false,
): boolean {
  if (relateUnfit) return true;
  const row = lookupRequestStructure(method, table);
  if (!row) return false;
  if (extraTablesUnfit(table, body, row)) return true;
  const m = method.toLowerCase();
  if (m === "crud") {
    const tables = Object.keys(body).filter(
      (k) => /^[A-Z]/.test(k) && isPlainObject(body[k]),
    );
    if (tables.length <= 1) return false;
    const nested = Object.keys(row.structure).filter((k) => /^[A-Z]/.test(k));
    if (!nested.length) return true;
    return tables.some((t) => !nested.includes(t));
  }
  if (!STRUCTURE_METHODS.has(m)) return false;
  return !validateRequestStructure(
    m as ApiJsonMethod,
    { ...body, tag: table },
    row,
  ).ok;
}

export function omitOpenGetPageTag(
  body: Record<string, unknown>,
  method: string,
  table: string | null | undefined,
): Record<string, unknown> {
  const tag = typeof body.tag === "string" ? body.tag.trim() : "";
  const tbl = (table || "").trim();
  if (!tag || !tbl || !shouldOmitOpenGetTag(method, tag, tbl)) return body;
  const next = { ...body };
  delete next.tag;
  return next;
}

export async function assignRequestTag(opts: {
  method: string;
  body: Record<string, unknown>;
  table: string;
  baseUrl: string;
  pageTitle?: string;
  pageId?: string;
  relateUnfit?: boolean;
  missingRequest?: boolean;
}): Promise<Record<string, unknown>> {
  const table = opts.table.trim();
  const method = opts.method.toLowerCase();
  const body = { ...opts.body };
  if (!table) return body;

  if (method === "get" || method === "head") {
    return omitOpenGetPageTag(body, method, table);
  }

  await ensureRequestStructures(opts.baseUrl);
  const row = lookupRequestStructure(method, table);
  const tag = resolveRequestTag({
    table,
    currentTag: typeof body.tag === "string" ? body.tag : "",
    tableTagOccupied: row != null,
    tableTagUnfit: tableTagUnfit(
      method,
      table,
      body,
      Boolean(opts.relateUnfit),
    ),
    missingRequest: opts.missingRequest,
    variants: variantRequestTagCandidates(table, {
      title: opts.pageTitle,
      pageId: opts.pageId,
    }),
    variantOccupied: (t) => lookupRequestStructure(method, t) != null,
  });
  return { ...body, tag };
}
