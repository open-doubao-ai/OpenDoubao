/**
 * Visitor / id-list helpers for consumer layouts.
 * Writes go through A2API action bindings (layout-actions) — not Demo CRUD.
 */

import { loadAccount } from "./account.js";
import type { WritePayload } from "./result-view.js";

export type { SocialComment } from "./layout-actions.js";

export function visitorId(): string | number | null {
  const id = loadAccount()?.userId;
  return id == null || id === "" ? null : id;
}

export function parseIdList(raw: unknown): Array<string | number> {
  if (Array.isArray(raw)) {
    return raw.filter((x) => x != null && x !== "") as Array<string | number>;
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      return parseIdList(JSON.parse(s));
    } catch {
      return s
        .split(/[,[\]]/)
        .map((x) => x.trim())
        .filter((x) => /^\d+$/.test(x))
        .map((x) => Number(x));
    }
  }
  return [];
}

export function idInList(
  list: Array<string | number>,
  id: string | number | null | undefined,
): boolean {
  if (id == null || id === "") return false;
  return list.some((x) => String(x) === String(id));
}

export function socialWriteFlags(
  payload: Omit<WritePayload, "stayOnPage" | "keepTag" | "skipTemplate">,
): WritePayload {
  return { ...payload, stayOnPage: true, keepTag: true, skipTemplate: true };
}
