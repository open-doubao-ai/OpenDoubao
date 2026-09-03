/**
 * API reuse order (locked):
 * 1) existing Document APIs
 * 2) Request + Access + Function for an existing APIJSON call
 * 3) otherwise Apply for a new API
 */

export const APIJSON_OPS = [
  "get",
  "head",
  "gets",
  "heads",
  "post",
  "put",
  "delete",
  "crud",
] as const;

export type ApiJsonOp = (typeof APIJSON_OPS)[number];

export type CatalogSource = "document" | "request" | "access" | "function";

export type CatalogDocument = {
  id: string | number;
  name?: string;
  method?: string;
  type?: string;
  url?: string;
  request?: string;
  operation?: string;
  group?: string;
};

export type CatalogFunction = {
  name: string;
  arguments?: string;
  demo?: string;
  detail?: string;
  type?: string;
  methods?: string;
  tag?: string;
};

export type AvailableRequest = {
  operation: string;
  tag: string;
  version: number;
  structure?: Record<string, unknown>;
  detail?: string;
  accessAlias?: string;
  accessName?: string;
  roles: string[];
  document?: CatalogDocument;
  function?: CatalogFunction;
  source: CatalogSource;
  open?: boolean;
};

export type WriteGateDecision = "call" | "apply" | "try";

export type WriteGate = {
  operation: string;
  tag: string;
  decision: WriteGateDecision;
  roles: string[];
  document: CatalogDocument | null;
  function?: CatalogFunction | null;
  source: CatalogSource | null;
  reason: string;
};

export type CatalogRows = {
  accessRows: Record<string, unknown>[];
  requestRows: Record<string, unknown>[];
  documentRows: Record<string, unknown>[];
  functionRows?: Record<string, unknown>[];
};

const SOURCE_RANK: Record<CatalogSource, number> = {
  document: 0,
  request: 1,
  access: 2,
  function: 3,
};

export function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

export function parseJsonObject(raw: unknown): Record<string, unknown> | null {
  if (raw != null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const p = JSON.parse(raw) as unknown;
      if (p && typeof p === "object" && !Array.isArray(p)) {
        return p as Record<string, unknown>;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function parseRoles(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (Array.isArray(p)) return p.map(String);
  } catch {
    /* csv */
  }
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseStructure(
  raw: unknown,
): Record<string, unknown> | undefined {
  return parseJsonObject(raw) ?? undefined;
}

function str(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  return v == null ? "" : String(v).trim();
}

function lastPath(url: string): string {
  return (
    url.split("?")[0]?.split("/").filter(Boolean).pop()?.toLowerCase() || ""
  );
}

function isOp(s: string): s is ApiJsonOp {
  return (APIJSON_OPS as readonly string[]).includes(s);
}

function uniqueRoles(roles: string[]): string[] {
  return [...new Set(roles.map(String).filter(Boolean))];
}

export function opFromDocument(d: Record<string, unknown>): string {
  const urlOp = lastPath(str(d, "url"));
  if (isOp(urlOp)) return urlOp;
  const operation = str(d, "operation").toLowerCase();
  if (isOp(operation)) return operation;
  const method = str(d, "method").toLowerCase();
  if (isOp(method)) return method;
  return "";
}

function tagFromRequestJson(raw: unknown): string {
  const parsed = parseJsonObject(raw);
  if (!parsed) return "";
  if (typeof parsed.tag === "string" && parsed.tag.trim()) {
    return parsed.tag.trim();
  }
  const table = Object.keys(parsed).find((k) => /^[A-Z]/.test(k));
  return table || "";
}

export function tagFromDocument(d: Record<string, unknown>): string {
  const group = str(d, "group");
  if (/^[A-Z]/.test(group)) return group;
  const fromBody = tagFromRequestJson(d.request ?? d.apijson);
  if (fromBody) return fromBody;
  const name = str(d, "name");
  const named = /^(GET|HEAD|GETS|HEADS|POST|PUT|DELETE|CRUD)\s+(\S+)/i.exec(
    name,
  );
  if (named?.[2]) return named[2];
  const operation = str(d, "operation");
  if (operation && !isOp(operation.toLowerCase()) && /^[A-Z]/.test(operation)) {
    return operation;
  }
  if (/^[A-Za-z][\w:[\]]*$/.test(name) && !isOp(name.toLowerCase())) {
    return name;
  }
  return "";
}

export function toCatalogDocument(
  d: Record<string, unknown>,
): CatalogDocument {
  return {
    id: d.id as string | number,
    name: d.name != null ? String(d.name) : undefined,
    method: d.method != null ? String(d.method) : undefined,
    type: d.type != null ? String(d.type) : undefined,
    url: d.url != null ? String(d.url) : undefined,
    request:
      d.request != null
        ? String(d.request)
        : d.apijson != null
          ? String(d.apijson)
          : undefined,
    operation: d.operation != null ? String(d.operation) : undefined,
    group: d.group != null ? String(d.group) : undefined,
  };
}

export function toCatalogFunction(
  f: Record<string, unknown>,
): CatalogFunction {
  return {
    name: str(f, "name"),
    arguments: f.arguments != null ? String(f.arguments) : undefined,
    demo: f.demo != null ? String(f.demo) : undefined,
    detail: f.detail != null ? String(f.detail) : undefined,
    type: f.type != null ? String(f.type) : undefined,
    methods: f.methods != null ? String(f.methods) : undefined,
    tag: f.tag != null ? String(f.tag) : undefined,
  };
}

function accessMap(
  accessRows: Record<string, unknown>[],
): Map<string, Record<string, unknown>> {
  const accessByKey = new Map<string, Record<string, unknown>>();
  for (const a of accessRows) {
    const alias = str(a, "alias");
    const name = str(a, "name");
    if (alias) accessByKey.set(alias, a);
    if (name) accessByKey.set(name, a);
  }
  return accessByKey;
}

function accessFor(
  accessByKey: Map<string, Record<string, unknown>>,
  tag: string,
): Record<string, unknown> | undefined {
  const t = tag.trim();
  if (!t) return undefined;
  return (
    accessByKey.get(t) ||
    accessByKey.get(t.replace(/\[\]/g, "").split(":")[0] || t)
  );
}

export function rolesForAccess(
  access: Record<string, unknown> | undefined,
  operation: string,
): string[] {
  if (!access) return [];
  const op = operation.trim().toLowerCase();
  if (op === "crud") {
    return uniqueRoles([
      ...parseRoles(access.post),
      ...parseRoles(access.put),
      ...parseRoles(access.delete),
    ]);
  }
  return parseRoles(access[op]);
}

function requestMethodMatches(rowMethod: string, op: string): boolean {
  const m = rowMethod.trim().toLowerCase();
  const o = op.trim().toLowerCase();
  if (!m || !o) return false;
  if (m === o) return true;
  return o === "crud" && m === "crud";
}

type RequestHit = {
  tag: string;
  operation: string;
  version: number;
  structure?: Record<string, unknown>;
  detail?: string;
};

function indexRequests(
  requestRows: Record<string, unknown>[],
): Map<string, RequestHit> {
  const out = new Map<string, RequestHit>();
  for (const r of requestRows) {
    const method = str(r, "method");
    const tag = str(r, "tag");
    const operation = method.toLowerCase();
    if (!isOp(operation) || !tag) continue;
    const version = Number(r.version) || 0;
    const key = `${operation}::${tag}`;
    const prev = out.get(key);
    if (prev && prev.version >= version) continue;
    out.set(key, {
      tag,
      operation,
      version,
      structure: parseStructure(r.structure),
      detail: typeof r.detail === "string" ? r.detail : undefined,
    });
  }
  return out;
}

function documentOpMatches(
  d: Record<string, unknown>,
  op: string,
): boolean {
  const got = opFromDocument(d);
  if (got) return got === op;
  const url = str(d, "url").toLowerCase();
  return url.endsWith(`/${op}`);
}

function documentMentionsTag(
  d: Record<string, unknown>,
  tag: string,
): boolean {
  const t = tag.trim();
  if (!t) return false;
  const tl = t.toLowerCase();
  if (str(d, "group") === t) return true;
  if (str(d, "name") === t) return true;
  if (str(d, "name").toLowerCase().includes(tl)) return true;
  if (tagFromRequestJson(d.request ?? d.apijson) === t) return true;
  return false;
}

/** Best Document for operation + tag, or null. */
export function findDocument(
  documentRows: Record<string, unknown>[],
  operation: string,
  tag: string,
): Record<string, unknown> | null {
  const op = operation.trim().toLowerCase();
  const t = tag.trim();
  if (!op || !t) return null;
  const nameExact = `${op.toUpperCase()} ${t}`;
  let best: { score: number; row: Record<string, unknown> } | null = null;
  for (const d of documentRows) {
    const name = str(d, "name");
    const group = str(d, "group");
    const bodyTag = tagFromRequestJson(d.request ?? d.apijson);
    const opOk = documentOpMatches(d, op);
    let score = 0;
    if (group === t && opOk) score = 100;
    else if (name === nameExact) score = 90;
    else if (bodyTag === t && opOk) score = 80;
    else if (name === t && opOk) score = 70;
    else if (opOk && documentMentionsTag(d, t)) score = 40;
    if (score && (!best || score > best.score)) best = { score, row: d };
  }
  return best?.row ?? null;
}

export function findRequest(
  requestRows: Record<string, unknown>[],
  operation: string,
  tag: string,
): RequestHit | null {
  const op = operation.trim().toLowerCase();
  const t = tag.trim();
  if (!op || !t) return null;
  let best: RequestHit | null = null;
  for (const r of requestRows) {
    if (!requestMethodMatches(str(r, "method"), op)) continue;
    if (str(r, "tag") !== t) continue;
    const version = Number(r.version) || 0;
    if (best && best.version >= version) continue;
    best = {
      tag: t,
      operation: str(r, "method").toLowerCase(),
      version,
      structure: parseStructure(r.structure),
      detail: typeof r.detail === "string" ? r.detail : undefined,
    };
  }
  return best;
}

export function findFunction(
  functionRows: Record<string, unknown>[],
  tag: string,
  operation?: string,
): Record<string, unknown> | null {
  const t = tag.trim();
  if (!t) return null;
  const op = (operation || "").trim().toLowerCase();
  for (const f of functionRows) {
    if (str(f, "name") !== t && str(f, "tag") !== t) continue;
    const methods = str(f, "methods");
    if (op && methods) {
      const allowed = methods
        .split(/[,;\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (allowed.length && !allowed.includes(op)) continue;
    }
    return f;
  }
  return null;
}

function functionItem(
  f: Record<string, unknown>,
  accessByKey: Map<string, Record<string, unknown>>,
): AvailableRequest | null {
  const name = str(f, "name");
  if (!name) return null;
  const methods = str(f, "methods");
  const first = methods
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .find((s) => isOp(s));
  const operation = first || "get";
  const access = accessFor(accessByKey, str(f, "tag") || name);
  const roles = access ? rolesForAccess(access, operation) : [];
  const fn = toCatalogFunction(f);
  return {
    operation,
    tag: name,
    version: Number(f.version) || 0,
    detail: fn.detail,
    accessAlias: access
      ? String(access.alias || access.name || "")
      : undefined,
    accessName: access ? String(access.name || "") || undefined : undefined,
    roles: roles.length ? roles : ["UNKNOWN"],
    function: fn,
    source: "function",
    open: true,
  };
}

export function buildAvailableCatalog(rows: CatalogRows): AvailableRequest[] {
  const accessByKey = accessMap(rows.accessRows);
  const requests = indexRequests(rows.requestRows);
  const out: AvailableRequest[] = [];
  const seen = new Set<string>();

  const push = (item: AvailableRequest, key: string) => {
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  };

  for (const d of rows.documentRows) {
    const operation = opFromDocument(d);
    const tag = tagFromDocument(d);
    if (!operation || !tag || !isOp(operation)) continue;
    const key = `${operation}::${tag}`;
    if (seen.has(key)) continue;
    const access = accessFor(accessByKey, tag);
    const roles = access ? rolesForAccess(access, operation) : [];
    if (access && roles.length === 0) continue;
    const req = requests.get(key);
    const doc = toCatalogDocument(d);
    push(
      {
        operation,
        tag,
        version: req?.version || Number(d.version) || 0,
        structure: req?.structure,
        detail:
          (typeof d.detail === "string" && d.detail) ||
          req?.detail ||
          undefined,
        accessAlias: access
          ? String(access.alias || access.name || tag)
          : tag,
        accessName: access
          ? String(access.name || "") || undefined
          : undefined,
        roles: roles.length ? roles : ["UNKNOWN"],
        document: doc,
        source: "document",
        open: !req,
      },
      key,
    );
  }

  for (const req of requests.values()) {
    const key = `${req.operation}::${req.tag}`;
    if (seen.has(key)) continue;
    const access = accessFor(accessByKey, req.tag);
    const roles = access ? rolesForAccess(access, req.operation) : [];
    if (access && roles.length === 0) continue;
    push(
      {
        operation: req.operation,
        tag: req.tag,
        version: req.version,
        structure: req.structure,
        detail: req.detail,
        accessAlias: access
          ? String(access.alias || access.name || req.tag)
          : req.tag,
        accessName: access
          ? String(access.name || "") || undefined
          : undefined,
        roles: roles.length ? roles : ["UNKNOWN"],
        document: undefined,
        source: "request",
        open: false,
      },
      key,
    );
  }

  for (const a of rows.accessRows) {
    const alias = str(a, "alias") || str(a, "name");
    if (!alias) continue;
    for (const operation of ["get", "head"] as const) {
      const roles = parseRoles(a[operation]);
      if (!roles.length) continue;
      const key = `${operation}::${alias}`;
      if (seen.has(key)) continue;
      push(
        {
          operation,
          tag: alias,
          version: 0,
          detail:
            typeof a.detail === "string" ? a.detail : "Open Access GET/HEAD",
          accessAlias: alias,
          accessName: String(a.name || "") || undefined,
          roles,
          document: undefined,
          source: "access",
          open: true,
        },
        key,
      );
    }
  }

  for (const f of rows.functionRows || []) {
    const item = functionItem(f, accessByKey);
    if (!item) continue;
    push(item, `fn::${item.tag}`);
  }

  out.sort((a, b) => {
    const s = SOURCE_RANK[a.source] - SOURCE_RANK[b.source];
    if (s) return s;
    const t = a.tag.localeCompare(b.tag);
    if (t) return t;
    return a.operation.localeCompare(b.operation);
  });
  return out;
}

export function decideWriteGate(
  operation: string,
  tag: string,
  rows: CatalogRows,
): WriteGate {
  const op = operation.trim().toLowerCase();
  const t = tag.trim();
  if (!op || !t) {
    return {
      operation: op,
      tag: t,
      decision: "try",
      roles: [],
      document: null,
      function: null,
      source: null,
      reason: "Missing operation or tag — try then apply on permission error",
    };
  }

  const accessByKey = accessMap(rows.accessRows);
  const access = accessFor(accessByKey, t);
  const roles = rolesForAccess(access, op);
  const accessForbids = Boolean(access) && roles.length === 0;

  const docRow = findDocument(rows.documentRows, op, t);
  const document = docRow ? toCatalogDocument(docRow) : null;
  if (document) {
    if (accessForbids || !access) {
      return {
        operation: op,
        tag: t,
        decision: "apply",
        roles,
        document,
        function: null,
        source: "document",
        reason:
          "Document found but Access has no roles for this operation — submit Apply",
      };
    }
    return {
      operation: op,
      tag: t,
      decision: "call",
      roles,
      document,
      function: null,
      source: "document",
      reason: "Document found and Access allows this operation",
    };
  }

  const req = findRequest(rows.requestRows, op, t);
  if (req) {
    if (accessForbids) {
      return {
        operation: op,
        tag: t,
        decision: "apply",
        roles,
        document: null,
        function: null,
        source: "request",
        reason:
          "Request found but Access has no roles for this operation — submit Apply",
      };
    }
    return {
      operation: op,
      tag: t,
      decision: "call",
      roles: roles.length ? roles : ["UNKNOWN"],
      document: null,
      function: null,
      source: "request",
      reason: "No Document — reuse existing Request APIJSON",
    };
  }

  const isRead =
    op === "get" || op === "head" || op === "gets" || op === "heads";
  if (isRead && roles.length > 0) {
    return {
      operation: op,
      tag: t,
      decision: "call",
      roles,
      document: null,
      function: null,
      source: "access",
      reason: "No Document/Request — open Access GET/HEAD",
    };
  }

  const fnRow = findFunction(rows.functionRows || [], t, op);
  if (fnRow) {
    return {
      operation: op,
      tag: t,
      decision: "call",
      roles: roles.length ? roles : ["UNKNOWN"],
      document: null,
      function: toCatalogFunction(fnRow),
      source: "function",
      reason: "No Document/Request — reuse existing Function",
    };
  }

  return {
    operation: op,
    tag: t,
    decision: "apply",
    roles,
    document: null,
    function: null,
    source: null,
    reason:
      "No Document, Request, Access, or Function covers this call — submit Apply for a new API",
  };
}
