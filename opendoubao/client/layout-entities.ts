/**
 * Infer order / address tables from comments (not Demo literals).
 */

import type { SchemaComments } from "./schema-types.js";

const ORDER_TOKENS = [
  "shoporder",
  "orderlist",
  "orders",
  "order",
  "trade",
  "订单",
];
const ADDRESS_TOKENS = [
  "address",
  "shipping",
  "consignee",
  "收件地址",
  "收货地址",
  "地址簿",
];
const ORDER_PENALTY = ["checkout", "cart", "下单", "购物车"];
const ADDRESS_PENALTY = ["shoporder", "order", "订单"];

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

function scoreTokens(text: string, tokens: string[]): number {
  let n = 0;
  const h = norm(text);
  for (const tok of tokens) {
    const t = norm(tok);
    if (!t) continue;
    if (h === t) n += 8;
    else if (h.includes(t)) n += 4;
  }
  return n;
}

function bestTable(
  comments: SchemaComments | null | undefined,
  tokens: string[],
  penalty: string[] = [],
): string | null {
  if (!comments?.tables) return null;
  let best: { table: string; score: number } | null = null;
  for (const [table, note] of Object.entries(comments.tables)) {
    const text = `${table} ${note}`;
    let score = scoreTokens(text, tokens);
    score -= scoreTokens(text, penalty);
    if (score <= 0) continue;
    if (!best || score > best.score) best = { table, score };
  }
  return best?.table ?? null;
}

export function inferOrderTable(
  comments: SchemaComments | null | undefined,
): string | null {
  return bestTable(comments, ORDER_TOKENS, ORDER_PENALTY);
}

export function inferAddressTable(
  comments: SchemaComments | null | undefined,
): string | null {
  return bestTable(comments, ADDRESS_TOKENS, ADDRESS_PENALTY);
}

export function isOrderTable(
  table: string | null | undefined,
  comments: SchemaComments | null | undefined,
): boolean {
  const name = (table || "").trim();
  if (!name) return false;
  return inferOrderTable(comments) === name;
}

export function isAddressTable(
  table: string | null | undefined,
  comments: SchemaComments | null | undefined,
): boolean {
  const name = (table || "").trim();
  if (!name) return false;
  return inferAddressTable(comments) === name;
}

export type EnsureAddressPayload = {
  ok?: boolean;
  table?: string;
  created?: boolean;
  comments?: SchemaComments;
  error?: string;
};

export async function ensureLayoutAddress(): Promise<EnsureAddressPayload> {
  const res = await fetch("/api/ensure-layout-address", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: "{}",
  });
  const json = (await res.json().catch(() => null)) as EnsureAddressPayload | null;
  return json ?? { ok: false };
}
