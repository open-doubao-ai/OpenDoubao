/**
 * Available API catalog from admin (Document first, then Request / Access / Function).
 */

export type CatalogSource = "document" | "request" | "access" | "function";

export type AvailableRequest = {
  operation: string;
  tag: string;
  version: number;
  structure?: Record<string, unknown>;
  detail?: string;
  accessAlias?: string;
  accessName?: string;
  roles: string[];
  source?: CatalogSource;
  document?: {
    id: string | number;
    name?: string;
    method?: string;
    type?: string;
    url?: string;
    request?: string;
    operation?: string;
    group?: string;
  };
  function?: {
    name: string;
    arguments?: string;
    demo?: string;
    detail?: string;
    type?: string;
    methods?: string;
    tag?: string;
  };
  open?: boolean;
};

let items: AvailableRequest[] = [];
let loaded = false;
let loading: Promise<void> | null = null;

export function clearAvailableRequests(): void {
  items = [];
  loaded = false;
  loading = null;
}

export function listAvailableRequests(): AvailableRequest[] {
  return items.slice();
}

export async function ensureAvailableRequests(): Promise<AvailableRequest[]> {
  if (loaded) return items;
  if (loading) {
    await loading;
    return items;
  }
  loading = (async () => {
    const res = await fetch("/api/available-requests");
    const data = (await res.json().catch(() => null)) as {
      items?: AvailableRequest[];
      error?: string;
    } | null;
    if (!res.ok) {
      throw new Error(data?.error || `available-requests failed (${res.status})`);
    }
    items = Array.isArray(data?.items) ? data!.items! : [];
    loaded = true;
  })()
    .catch(() => {
      loaded = false;
      items = [];
    })
    .finally(() => {
      loading = null;
    });
  await loading;
  return items;
}

export async function reloadAvailableRequests(): Promise<AvailableRequest[]> {
  clearAvailableRequests();
  return ensureAvailableRequests();
}

/** Label for Data tab picker. Document first in the catalog. */
export function availableRequestLabel(r: AvailableRequest): string {
  const roles = r.roles?.length ? ` [${r.roles.join(",")}]` : "";
  const open = r.open ? " · open" : "";
  const src =
    r.source === "document"
      ? "DOC "
      : r.source === "function"
        ? "FN "
        : r.source === "access"
          ? "OPEN "
          : r.source === "request"
            ? "REQ "
            : "";
  if (r.source === "function") {
    const args = r.function?.arguments ? `(${r.function.arguments})` : "";
    return `${src}${r.tag}${args}${roles}`;
  }
  return `${src}${r.operation.toUpperCase()} ${r.tag} v${r.version}${open}${roles}`;
}

export type WriteGateDecision = "call" | "apply" | "try";

export type WriteGate = {
  operation: string;
  tag: string;
  decision: WriteGateDecision;
  roles: string[];
  document?: AvailableRequest["document"] | null;
  function?: AvailableRequest["function"] | null;
  source?: CatalogSource | null;
  reason?: string;
  error?: string;
};

/** Document → Request/Access/Function → Apply (via admin). */
export async function fetchWriteGate(
  operation: string,
  tag: string,
): Promise<WriteGate> {
  const qs = new URLSearchParams({
    operation: operation.toLowerCase(),
    tag,
  });
  try {
    const res = await fetch(`/api/write-gate?${qs}`);
    const data = (await res.json().catch(() => null)) as WriteGate | null;
    if (!res.ok || !data) {
      return {
        operation,
        tag,
        decision: "try",
        roles: [],
        reason: data?.error || "write-gate unavailable — try call",
      };
    }
    return data;
  } catch {
    return {
      operation,
      tag,
      decision: "try",
      roles: [],
      reason: "write-gate unreachable — try call",
    };
  }
}
