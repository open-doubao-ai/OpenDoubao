/**
 * Prefer existing Document APIs when generating a page bind.
 */

import { extractRequestTables } from "@a2api/protocol";
import type { BootstrapPlan } from "./intent.js";

export type CatalogHit = {
  source?: string;
  operation: string;
  tag: string;
  document?: {
    request?: string;
    url?: string;
    method?: string;
    name?: string;
  } | null;
};

const NO_OVERLAY_KINDS = new Set<BootstrapPlan["kind"]>([
  "get_user",
  "get_moment",
  "get_comment",
  "create_moment",
  "create_comment",
]);

function parseJsonObject(raw: unknown): Record<string, unknown> | null {
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

function isListBody(body: Record<string, unknown>): boolean {
  return "[]" in body;
}

/** Compact catalog for the generate LLM — Document first. */
export function formatApiCatalogPrompt(items: CatalogHit[]): string {
  if (!items.length) return "";
  const lines: string[] = [
    "Reuse existing APIs in this order: (1) Document (2) Request/Access/Function (3) otherwise the runtime will Apply for a new API. Do not invent a new tag when one of these covers the call.",
  ];
  const cap = 80;
  for (const r of items.slice(0, cap)) {
    const src = r.source || "request";
    const url = r.document?.url ? ` url=${r.document.url}` : "";
    const name = r.document?.name ? ` name=${r.document.name}` : "";
    lines.push(
      `[${src}] ${r.operation.toUpperCase()} ${r.tag}${name}${url}`,
    );
  }
  if (items.length > cap) {
    lines.push(`… ${items.length - cap} more`);
  }
  return `\n${lines.join("\n")}\n`;
}

/**
 * If a Document sample matches this plan's method + table and list/detail
 * shape, use it instead of a synthesized APIJSON body.
 */
export function overlayPlanWithDocument(
  plan: BootstrapPlan,
  items: CatalogHit[],
): BootstrapPlan {
  if (!plan.bind || NO_OVERLAY_KINDS.has(plan.kind)) return plan;
  const method = plan.propose.method.toLowerCase();
  const tables = extractRequestTables(plan.propose.body);
  const table = tables.find((t) => t !== "Verify") || tables[0] || "";
  if (!table) return plan;
  const hit = items.find(
    (i) =>
      (i.source === "document" || Boolean(i.document?.request)) &&
      i.operation.toLowerCase() === method &&
      (i.tag === table ||
        i.document?.name?.toLowerCase().includes(table.toLowerCase())),
  );
  const parsed = parseJsonObject(hit?.document?.request);
  if (!parsed || !hit) return plan;
  const wantList = plan.viewMode === "list" || isListBody(plan.propose.body);
  if (wantList !== isListBody(parsed)) return plan;
  const next: BootstrapPlan = {
    ...plan,
    propose: { ...plan.propose, body: parsed },
    bind: {
      ...plan.bind,
      method: plan.bind.method,
      bodyTemplate: parsed,
      ...(hit.document?.url ? { url: hit.document.url } : {}),
    },
  };
  return next;
}
