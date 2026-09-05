/**
 * Paid-item reviews: local purchase ledger + order lookup from live schema.
 */

import { inferAuthorIdField } from "./layout-category.js";
import { inferOrderTable } from "./layout-entities.js";
import { fetchBoundGet } from "./layout-actions.js";
import { visitorId } from "./layout-social.js";
import type { SchemaComments } from "./schema-types.js";

export type PurchaseRef = { table: string; id: string | number };

const PURCHASE_KEY = "a2api.purchases";

const PAID_STATUS_TOKENS = [
  "paid",
  "shipped",
  "done",
  "completed",
  "success",
  "finished",
  "已付",
  "已支付",
  "已发货",
  "已完成",
  "成功",
];

const UNPAID_STATUS_TOKENS = [
  "pending",
  "unpaid",
  "unpay",
  "cancel",
  "refund",
  "void",
  "fail",
  "failed",
  "closed",
  "待付",
  "未付",
  "未支付",
  "取消",
  "退款",
  "关闭",
];

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

function sameId(a: unknown, b: string | number): boolean {
  return a != null && a !== "" && String(a) === String(b);
}

export function purchaseKey(table: string, id: string | number): string {
  return `${table.trim()}:${String(id)}`;
}

function loadLedger(): PurchaseRef[] {
  try {
    const raw = localStorage.getItem(PURCHASE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is PurchaseRef =>
        x != null &&
        typeof x === "object" &&
        typeof (x as PurchaseRef).table === "string" &&
        ((x as PurchaseRef).id != null && (x as PurchaseRef).id !== ""),
    );
  } catch {
    return [];
  }
}

function saveLedger(rows: PurchaseRef[]) {
  try {
    localStorage.setItem(PURCHASE_KEY, JSON.stringify(rows.slice(0, 200)));
  } catch {
    /* quota */
  }
}

export function recordPurchases(lines: Array<{ table?: string; id?: string | number }>): void {
  const next = loadLedger();
  for (const line of lines) {
    const table = (line.table || "").trim();
    const id = line.id;
    if (!table || id == null || id === "") continue;
    if (next.some((p) => p.table === table && sameId(p.id, id))) continue;
    next.push({ table, id });
  }
  saveLedger(next);
}

export function hasLocalPurchase(table: string, id: string | number): boolean {
  const t = table.trim();
  if (!t) return false;
  return loadLedger().some((p) => p.table === t && sameId(p.id, id));
}

export function resolveCheckoutOrderTable(
  currentTable: string | null | undefined,
  comments?: SchemaComments | null,
): string {
  const name = (currentTable || "").trim();
  if (name && /order/i.test(name)) return name;
  return inferOrderTable(comments) || "ShopOrder";
}

export function orderWriteFields(info: {
  name: string;
  phone: string;
  address: string;
  remark: string;
  total: number;
  lines: Array<{ table?: string; id?: string | number }>;
}): Record<string, unknown> {
  recordPurchases(info.lines);
  const first = info.lines[0];
  const productLine =
    info.lines.find((line) => /product/i.test(line.table || "")) ?? first;
  return {
    consignee: info.name,
    name: info.name,
    phone: info.phone,
    address: info.address,
    remark: info.remark,
    total: info.total,
    status: "paid",
    ...(productLine?.id != null && productLine.id !== ""
      ? { productId: productLine.id }
      : {}),
    items: JSON.stringify(info.lines),
  };
}

function statusHasToken(hay: string, tok: string): boolean {
  const n = norm(tok);
  if (!n) return false;
  if (hay === n) return true;
  if (/^[a-z]+$/.test(n) && n.length <= 4) return false;
  return hay.includes(n);
}

export function isPaidOrderStatus(status: unknown): boolean {
  if (status == null || status === "") return false;
  const h = norm(String(status));
  if (UNPAID_STATUS_TOKENS.some((tok) => statusHasToken(h, tok))) return false;
  return PAID_STATUS_TOKENS.some((tok) => statusHasToken(h, tok));
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function parseItemsJson(raw: unknown): Array<{ table?: string; id?: string | number }> {
  if (Array.isArray(raw)) {
    return raw.filter((x) => x && typeof x === "object") as Array<{
      table?: string;
      id?: string | number;
    }>;
  }
  if (typeof raw !== "string") return [];
  const s = raw.trim();
  if (!s) return [];
  try {
    return parseItemsJson(JSON.parse(s));
  } catch {
    return [];
  }
}

export function orderCoversItem(
  order: Record<string, unknown>,
  itemTable: string,
  itemId: string | number,
): boolean {
  const table = itemTable.trim();
  const want = norm(table);
  for (const [key, value] of Object.entries(order)) {
    const short = key.includes(".") ? key.slice(key.lastIndexOf(".") + 1) : key;
    const n = norm(short);
    if (
      (n === `${want}id` ||
        n === "productid" ||
        n === "itemid" ||
        n === "goodsid" ||
        n === "ticketid") &&
      sameId(value, itemId)
    ) {
      return true;
    }
    if (/^(items|itemlist|goods|lines|detail|sku)$/i.test(short)) {
      for (const line of parseItemsJson(value)) {
        if (line.id == null) continue;
        if (line.table && line.table !== table) continue;
        if (sameId(line.id, itemId)) return true;
      }
    }
  }
  return false;
}

function inferOrderItemField(
  orderTable: string,
  itemTable: string,
  comments?: SchemaComments | null,
): string | null {
  const want = norm(itemTable);
  const prefix = `${orderTable}.`;
  let best: { field: string; score: number } | null = null;
  for (const key of Object.keys(comments?.columns || {})) {
    if (!key.startsWith(prefix) && key.includes(".")) continue;
    const field = key.startsWith(prefix) ? key.slice(prefix.length) : key;
    const note = comments?.columns?.[`${orderTable}.${field}`] || comments?.columns?.[field] || "";
    const n = norm(`${field} ${note}`);
    let score = 0;
    if (n.includes(`${want}id`) || n === `${want}id`) score += 12;
    if (/productid|itemid|goodsid|ticketid/.test(n)) score += 8;
    if (score <= 0) continue;
    if (!best || score > best.score) best = { field, score };
  }
  return best?.field ?? null;
}

export async function visitorHasPurchased(opts: {
  apijsonBase: string;
  comments?: SchemaComments | null;
  itemTable: string;
  itemId: string | number;
}): Promise<boolean> {
  if (hasLocalPurchase(opts.itemTable, opts.itemId)) return true;
  const me = visitorId();
  if (me == null || !opts.apijsonBase) return false;
  const orderTable = inferOrderTable(opts.comments);
  if (!orderTable) return false;
  const userField = inferAuthorIdField(orderTable, opts.comments) || "userId";
  const itemField = inferOrderItemField(orderTable, opts.itemTable, opts.comments);
  const json = await fetchBoundGet(opts.apijsonBase, {
    "[]": { count: 40, [orderTable]: { [userField]: me } },
  });
  if (!json) return false;
  const list = Array.isArray(json["[]"]) ? json["[]"] : [];
  for (const raw of list) {
    const row = asRecord(raw);
    if (!row) continue;
    const order =
      asRecord(row[orderTable]) ||
      Object.values(row).find((v) => asRecord(v)) ||
      row;
    const rec = asRecord(order) || row;
    const status = rec.status ?? rec.state ?? rec.payStatus;
    if (!isPaidOrderStatus(status)) continue;
    if (orderCoversItem(rec, opts.itemTable, opts.itemId)) return true;
    if (itemField && sameId(rec[itemField], opts.itemId)) return true;
  }
  return false;
}
