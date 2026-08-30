/**
 * Sync local saved pages (layout + snapshot) to APIJSON `Page` rows.
 * After login, pull remotes then upload dirty/failed locals.
 */

import { withRequestRole } from "./access-roles.js";
import { loadAccount, loadSettings, logoutIfApijsonAuthFailed } from "./account.js";
import { withApijsonAuth } from "./aj-auth.js";
import { stripApiJsonRole } from "./schema-types.js";
import { ensureRemoteImageUrl } from "./upload.js";
import {
  getSavedPage,
  latestVersion,
  listSavedPages,
  patchSavedPageSync,
  setSavedPagesChangeHandler,
  upsertImportedPage,
  type SavedPage,
  type SavedPageSnapshot,
  type SavedPagesChangeReason,
} from "./saved-pages.js";

const TABLE = "Page";
const UPLOAD_DEBOUNCE_MS = 1600;

export type PageSyncListener = () => void;

let statusListener: PageSyncListener | null = null;
let inited = false;
let lastSyncUser: string | null = null;
let ensureOnce: Promise<boolean> | null = null;
const inFlight = new Set<string>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function initPageSync(opts: { onStatus?: PageSyncListener } = {}): void {
  statusListener = opts.onStatus ?? null;
  if (inited) return;
  inited = true;
  setSavedPagesChangeHandler((pageId, reason, page) => {
    if (reason === "sync-meta") {
      statusListener?.();
      return;
    }
    if (reason === "delete") {
      void deleteRemotePage(page);
      return;
    }
    schedulePageUpload(pageId);
  });
}

export function isPageUploadFailed(page: SavedPage): boolean {
  return page.syncStatus === "fail";
}

export function isPageUploading(page: SavedPage): boolean {
  return page.syncStatus === "syncing" || inFlight.has(page.id);
}

function notifyStatus() {
  try {
    statusListener?.();
  } catch {
    /* ignore */
  }
}

function isPlain(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function thumbFingerprint(url: string | undefined): string {
  if (!url) return "";
  if (url.startsWith("data:")) return `data:${url.length}:${url.slice(-48)}`;
  return url;
}

export function pageContentHash(page: SavedPage): string {
  return hashString(
    JSON.stringify({
      title: page.title,
      versions: page.versions,
      thumb: thumbFingerprint(page.thumbDataUrl),
    }),
  );
}

function needsUpload(page: SavedPage): boolean {
  if (page.syncStatus === "fail") return true;
  if (page.syncStatus === "syncing") return false;
  return pageContentHash(page) !== (page.syncedHash || "");
}

function accountKey(): string | null {
  const acc = loadAccount();
  if (!acc) return null;
  return String(acc.userId ?? acc.login ?? acc.name ?? "").trim() || null;
}

function accountUserId(): string | number | null {
  const id = loadAccount()?.userId;
  if (id == null || id === "") return null;
  return id;
}

function apijsonBase(): string {
  return (loadSettings().apijsonBaseUrl || "/apijson").replace(/\/+$/, "");
}

function ajOk(json: Record<string, unknown> | null): boolean {
  if (!json) return false;
  const code = json.code;
  return code === 200 || code === 0 || code === "200" || code == null;
}

function pickNamed(
  json: Record<string, unknown> | null,
  key: string,
): Record<string, unknown> | null {
  if (!json) return null;
  const lower = key.charAt(0).toLowerCase() + key.slice(1);
  const a = json[key];
  const b = json[lower];
  if (isPlain(a)) return a;
  if (isPlain(b)) return b;
  return null;
}

function pickId(row: Record<string, unknown> | null): string | number | null {
  if (!row) return null;
  const id = row.id;
  if (id == null || id === "") return null;
  return id as string | number;
}

function listItems(json: Record<string, unknown> | null): unknown[] {
  if (!json) return [];
  const arr = json["[]"];
  return Array.isArray(arr) ? arr : [];
}

function parseJson<T>(v: unknown, fallback: T): T {
  if (v == null || v === "") return fallback;
  if (typeof v === "object") return v as T;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function ajError(json: Record<string, unknown> | null): string {
  if (!json) return "No response";
  const msg = json.msg ?? json.message ?? json.debug;
  return msg != null && String(msg).trim() ? String(msg) : `code ${json.code}`;
}

async function aj(
  method: "get" | "post" | "put" | "delete",
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const base = apijsonBase();
  let next = stripApiJsonRole(body);
  if (method === "get") {
    next = await withRequestRole(next, method, base);
    if (accountUserId() == null) next["@role"] = "OWNER";
  }
  const res = await fetch(
    `${base}/${method}`,
    withApijsonAuth({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }),
  );
  const json = (await res.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  logoutIfApijsonAuthFailed(json);
  return json;
}

async function ensurePageTable(): Promise<boolean> {
  if (!ensureOnce) {
    ensureOnce = (async () => {
      try {
        const res = await fetch("/api/ensure-layout-pages", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: "{}",
        });
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
        } | null;
        return Boolean(json?.ok);
      } catch {
        return false;
      }
    })();
  }
  const ok = await ensureOnce;
  if (!ok) ensureOnce = null;
  return ok;
}

function shouldReensure(msg: string): boolean {
  return /access|request|table|not exist|不存在|没有权限|403|404|illegal/i.test(
    msg,
  );
}

type RemotePage = {
  id: string | number;
  pageKey: string;
  title: string;
  layoutApp?: string;
  layoutPage?: string;
  snapshot?: unknown;
  versions?: unknown;
  thumb?: string;
  contentHash?: string;
};

function unwrapRemote(item: unknown): RemotePage | null {
  if (!isPlain(item)) return null;
  const row = isPlain(item[TABLE]) ? item[TABLE] : item;
  const pageKey = String(row.pageKey ?? "").trim();
  const title = String(row.title ?? "").trim();
  const id = pickId(row);
  if (!pageKey || !title || id == null) return null;
  return {
    id,
    pageKey,
    title,
    layoutApp: row.layoutApp != null ? String(row.layoutApp) : undefined,
    layoutPage: row.layoutPage != null ? String(row.layoutPage) : undefined,
    snapshot: row.snapshot,
    versions: row.versions,
    thumb: row.thumb != null ? String(row.thumb) : undefined,
    contentHash: row.contentHash != null ? String(row.contentHash) : undefined,
  };
}

async function findRemote(
  pageKey: string,
): Promise<RemotePage | null> {
  const userId = accountUserId();
  const pageFilter: Record<string, unknown> = { pageKey };
  if (userId != null) pageFilter.userId = userId;
  const json = await aj("get", {
    "[]": { count: 1, [TABLE]: pageFilter },
  });
  if (!ajOk(json)) return null;
  const first = listItems(json)[0];
  return unwrapRemote(first);
}

async function listRemotePages(): Promise<RemotePage[]> {
  const userId = accountUserId();
  const out: RemotePage[] = [];
  for (let page = 0; page < 5; page++) {
    const filter: Record<string, unknown> = {};
    if (userId != null) filter.userId = userId;
    const json = await aj("get", {
      "[]": { count: 40, page, [TABLE]: filter },
    });
    if (!ajOk(json)) break;
    const items = listItems(json).map(unwrapRemote).filter(Boolean) as RemotePage[];
    out.push(...items);
    if (items.length < 40) break;
  }
  return out;
}

function importRemote(remote: RemotePage): SavedPage | null {
  const versions = parseJson<SavedPageSnapshot[]>(remote.versions, []);
  const snap = parseJson<SavedPageSnapshot | null>(remote.snapshot, null);
  const list = versions.length ? versions : snap ? [snap] : [];
  if (!list.length) return null;
  const page: SavedPage = {
    id: remote.pageKey,
    title: remote.title,
    versions: list,
    thumbDataUrl: remote.thumb,
    remoteId: remote.id,
    syncStatus: "ok",
    syncedHash: "",
  };
  page.syncedHash = pageContentHash(page);
  return page;
}

async function pullRemotePages(): Promise<void> {
  const remotes = await listRemotePages();
  for (const remote of remotes) {
    const local = getSavedPage(remote.pageKey);
    if (!local) {
      const imported = importRemote(remote);
      if (imported) upsertImportedPage(imported);
      continue;
    }
    const patch: Parameters<typeof patchSavedPageSync>[1] = {
      remoteId: remote.id,
    };
    if (!needsUpload(local) || pageContentHash(local) === remote.contentHash) {
      patch.syncStatus = "ok";
      patch.syncError = "";
      patch.syncedHash = pageContentHash(local);
    }
    patchSavedPageSync(local.id, patch);
  }
}

async function resolveThumbUrl(page: SavedPage): Promise<string> {
  const raw = (page.thumbDataUrl || "").trim();
  if (!raw) return "";
  if (!raw.startsWith("data:") && !raw.startsWith("blob:")) return raw;
  try {
    return await ensureRemoteImageUrl(apijsonBase(), raw);
  } catch {
    return "";
  }
}

async function writePage(page: SavedPage): Promise<void> {
  const latest = latestVersion(page);
  const thumb = await resolveThumbUrl(page);
  const row: Record<string, unknown> = {
    pageKey: page.id,
    title: page.title,
    layoutApp: latest?.layoutApp || "",
    layoutPage: latest?.layoutPage || "",
    snapshot: JSON.stringify(latest ?? {}),
    versions: JSON.stringify(page.versions),
    thumb,
    contentHash: pageContentHash(page),
  };
  let remoteId = page.remoteId;
  if (remoteId == null) {
    const existing = await findRemote(page.id);
    if (existing) remoteId = existing.id;
  }
  if (remoteId != null) {
    const json = await aj("put", {
      [TABLE]: { id: remoteId, ...row },
      tag: TABLE,
    });
    if (!ajOk(json) || !pickNamed(json, TABLE)) {
      throw new Error(ajError(json));
    }
    patchSavedPageSync(page.id, {
      remoteId,
      syncStatus: "ok",
      syncError: "",
      syncedHash: pageContentHash(page),
    });
    return;
  }
  const json = await aj("post", { [TABLE]: row, tag: TABLE });
  const created = pickNamed(json, TABLE);
  const id = pickId(created);
  if (!ajOk(json) || id == null) {
    throw new Error(ajError(json));
  }
  patchSavedPageSync(page.id, {
    remoteId: id,
    syncStatus: "ok",
    syncError: "",
    syncedHash: pageContentHash(page),
  });
}

export async function uploadSavedPage(pageId: string): Promise<boolean> {
  if (!loadAccount()) return false;
  const page = getSavedPage(pageId);
  if (!page) return false;
  if (inFlight.has(pageId)) return false;
  const timer = timers.get(pageId);
  if (timer) {
    clearTimeout(timer);
    timers.delete(pageId);
  }
  inFlight.add(pageId);
  notifyStatus();
  try {
    await ensurePageTable();
    const latest = getSavedPage(pageId);
    if (!latest) return false;
    try {
      await writePage(latest);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (shouldReensure(msg)) {
        ensureOnce = null;
        await ensurePageTable();
        const again = getSavedPage(pageId);
        if (!again) return false;
        await writePage(again);
      } else {
        throw e;
      }
    }
    return true;
  } catch (e) {
    patchSavedPageSync(pageId, {
      syncStatus: "fail",
      syncError: e instanceof Error ? e.message : String(e),
    });
    return false;
  } finally {
    inFlight.delete(pageId);
    notifyStatus();
  }
}

function schedulePageUpload(pageId: string, delay = UPLOAD_DEBOUNCE_MS) {
  if (!loadAccount()) return;
  const prev = timers.get(pageId);
  if (prev) clearTimeout(prev);
  timers.set(
    pageId,
    setTimeout(() => {
      timers.delete(pageId);
      void uploadSavedPage(pageId);
    }, delay),
  );
}

async function deleteRemotePage(page?: SavedPage): Promise<void> {
  if (!loadAccount() || !page) return;
  let remoteId = page.remoteId;
  if (remoteId == null) {
    const found = await findRemote(page.id).catch(() => null);
    remoteId = found?.id;
  }
  if (remoteId == null) return;
  try {
    await aj("delete", { [TABLE]: { id: remoteId }, tag: TABLE });
  } catch {
    /* best-effort */
  }
}

export async function syncAllSavedPages(): Promise<void> {
  if (!loadAccount()) return;
  await ensurePageTable();
  try {
    await pullRemotePages();
  } catch {
    /* upload locals even if pull fails */
  }
  for (const page of listSavedPages()) {
    if (!needsUpload(page)) continue;
    await uploadSavedPage(page.id);
  }
  notifyStatus();
}

export async function syncSavedPagesAfterLogin(): Promise<void> {
  const key = accountKey();
  if (!key) {
    lastSyncUser = null;
    return;
  }
  const dirty = listSavedPages().some(needsUpload);
  if (key === lastSyncUser && !dirty) return;
  lastSyncUser = key;
  await syncAllSavedPages();
}
