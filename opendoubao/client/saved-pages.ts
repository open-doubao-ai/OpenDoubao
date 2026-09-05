/**
 * Persisted generated data-view pages and their versions (localStorage).
 * Version closed label: "v2"; open menu: "v2 2026-10-01 11:23:45".
 */

import type { FkJoinSpec } from "./fk-expand.js";
import type { JoinOp } from "./join-query.js";
import type { DetailTableSlot } from "./detail-crud.js";
import type {
  CatalogStyle,
  ChartDimension,
  ColumnMeta,
  DisplayKind,
  ViewMode,
} from "./result-view.js";
import {
  isCatalogListPage,
  isDataListViewPage,
  isExploreListPage,
  isLayoutApp,
  isLayoutPage,
  type ActionBinding,
  type ActionSlot,
  type LayoutApp,
  type LayoutKind,
  type LayoutNav,
  type LayoutPage,
} from "./page-layout.js";
import type { ColumnFilter, ColumnSort } from "./table-query.js";

const STORAGE_KEY = "a2api.savedPages";
const ACTIVE_KEY = "a2api.savedPages.active";
const MAX_PAGES = 40;
const MAX_VERSIONS = 30;

/** List / detail / create are separate pages — never share a bare table id. */
export type PageKind = "list" | "detail" | "create";

export function pageKindFromViewMode(
  viewMode: ViewMode | undefined,
  openCreate?: boolean,
): PageKind {
  if (openCreate) return "create";
  if (viewMode === "detail") return "detail";
  return "list";
}

/** `music` + `rank` → `music_rank` (one saved page per layout page). */
export function surfaceIdForLayout(app: LayoutApp, page: LayoutPage): string {
  return `${app}_${page}`;
}

export function parseLayoutSurfaceId(
  id: string,
): { app: LayoutApp; page: LayoutPage } | null {
  const raw = (id || "").trim();
  const i = raw.indexOf("_");
  if (i <= 0) return null;
  const app = raw.slice(0, i);
  const page = raw.slice(i + 1);
  if (isLayoutApp(app) && isLayoutPage(page)) return { app, page };
  return null;
}

export function layoutPagesEquivalent(a: LayoutPage, b: LayoutPage): boolean {
  if (a === b) return true;
  if ((a === "home" || a === "list") && (b === "home" || b === "list")) {
    return true;
  }
  if (isDataListViewPage(a) && isDataListViewPage(b)) return true;
  const catalogView = (p: LayoutPage) =>
    p === "home" || p === "feed" || p === "list" || isExploreListPage(p);
  return catalogView(a) && catalogView(b);
}

function snapshotLooksLikeRecord(
  pageId: string,
  snap: SavedPageSnapshot,
): boolean {
  if (
    snap.layoutPage === "detail" ||
    snap.layoutPage === "player" ||
    snap.layoutPage === "form"
  ) return true;
  if (snap.pageKind === "detail" || snap.pageKind === "create") return true;
  if (snap.viewMode === "detail") return true;
  return /_(detail|create)$/i.test(pageId);
}

/** `Moment` → `moment_list` / `moment_detail` / `moment_create` */
export function surfaceIdForTable(table: string, kind: PageKind): string {
  const base = table.trim();
  if (!base) return `page_${kind}`;
  const slug =
    base.charAt(0).toLowerCase() + base.slice(1).replace(/[^A-Za-z0-9_]/g, "");
  // Strip accidental kind suffix then re-apply so Moment_list + list → moment_list
  const bare = slug.replace(/_(list|detail|create)$/i, "");
  return `${bare}_${kind}`;
}

/** Human title: always includes List / Detail / Create — never bare table name. */
export function pageTitleForTable(
  table: string,
  kind: PageKind,
  id?: string | number | null,
): string {
  const t = table.trim() || "Page";
  if (kind === "list") return `${t} List`;
  if (kind === "create") return `Create ${t}`;
  // Record id is shown in the detail header `#` control, not in the page title
  void id;
  return `${t} Detail`;
}

/**
 * Normalize plan surfaceId + title so list/detail never collapse to one table-named page.
 */
export function normalizePageIdentity(opts: {
  table: string | null | undefined;
  kind: PageKind;
  surfaceId?: string | null;
  title?: string | null;
  id?: string | number | null;
}): { surfaceId: string; title: string } {
  const table = (opts.table || "").trim();
  const kind = opts.kind;
  let surfaceId = (opts.surfaceId || "").trim();
  let title = (opts.title || "").trim();

  // Layout pages keep app_page ids (music_rank). Bare table / missing → kind suffix.
  const parsedLayout = surfaceId ? parseLayoutSurfaceId(surfaceId) : null;
  if (
    parsedLayout &&
    !(
      kind === "list" &&
      (parsedLayout.page === "detail" || parsedLayout.page === "player")
    )
  ) {
    /* keep */
  } else if (
    !surfaceId ||
    (table && surfaceId.toLowerCase() === table.toLowerCase()) ||
    (!/_(list|detail|create)$/i.test(surfaceId) && table)
  ) {
    surfaceId = table
      ? surfaceIdForTable(table, kind)
      : surfaceId || `page_${kind}_${Date.now().toString(36)}`;
  } else if (
    kind === "list" &&
    /_(detail|create)$/i.test(surfaceId) &&
    table
  ) {
    surfaceId = surfaceIdForTable(table, "list");
  } else if (
    kind === "detail" &&
    /_list$/i.test(surfaceId) &&
    table
  ) {
    surfaceId = surfaceIdForTable(table, "detail");
  } else if (
    kind === "create" &&
    !/_create$/i.test(surfaceId) &&
    table
  ) {
    surfaceId = surfaceIdForTable(table, "create");
  }

  // Only auto-fill when empty / bare table — keep custom names (e.g. "register")
  const looksBareTable =
    !!table &&
    (title === table || title.toLowerCase() === table.toLowerCase());
  // Wrong-kind auto titles (e.g. "Moment List" on a detail page) → rewrite
  const autoFor = (k: PageKind) =>
    pageTitleForTable(table || "Page", k, opts.id).toLowerCase();
  const titleLc = title.toLowerCase();
  const wrongKindAuto =
    !!table &&
    !!title &&
    ((kind === "detail" &&
      (titleLc === autoFor("list") || titleLc === autoFor("create"))) ||
      (kind === "list" &&
        (titleLc === autoFor("detail") || titleLc === autoFor("create"))) ||
      (kind === "create" &&
        (titleLc === autoFor("list") || titleLc === autoFor("detail"))));
  if (!title || looksBareTable || wrongKindAuto) {
    title = pageTitleForTable(table || "Page", kind, opts.id);
  }

  return { surfaceId, title };
}

/** Slug a custom page title for optional surfaceId (register → register). */
export function slugPageTitle(title: string): string {
  const t = title.trim();
  if (!t) return "";
  return t
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_\u4e00-\u9fff-]/g, "")
    .slice(0, 48);
}

export type PageFilterDef = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  options?: string[];
};

export type SavedPageSnapshot = {
  version: number;
  createdAt: string;
  /** list vs detail — detail/create pages are independent of list */
  viewMode?: ViewMode;
  /** Explicit kind when viewMode alone is ambiguous (create vs edit detail) */
  pageKind?: PageKind;
  /** Multi-table detail/create slots (op + table + relate) for pages like register */
  detailSlots?: DetailTableSlot[];
  filters: PageFilterDef[];
  bindMeta: {
    url: string;
    method: string;
    bodyTemplate: Record<string, unknown>;
  };
  columnSorts: ColumnSort[];
  columnFilters: ColumnFilter[];
  filterCombineExpr: string;
  tableJoins: Record<string, JoinOp>;
  fkExpand: Record<string, FkJoinSpec>;
  columnOrder: string[];
  columnMetas: Record<string, ColumnMeta>;
  displayKind: DisplayKind;
  catalogStyle?: CatalogStyle;
  /** @deprecated use layoutApp + layoutPage */
  layoutKind?: LayoutKind;
  layoutApp?: LayoutApp;
  layoutPage?: LayoutPage;
  layoutNav?: LayoutNav;
  /** True when the user picked a layout in the toolbar. */
  layoutKindManual?: boolean;
  /** A2API bindRequest per UI slot (like / comment / …). */
  actionBindings?: Partial<Record<ActionSlot, ActionBinding>>;
  chartLabelPath: string;
  chartValuePath: string;
  chartDimensions: ChartDimension[];
  chartFieldColors: Record<string, string>;
  chartFieldValues: Record<string, string>;
  combinedShowTable: boolean;
  ui: { page?: number; count?: number };
};

export type PageSyncStatus = "pending" | "syncing" | "ok" | "fail";

export type SavedPage = {
  id: string;
  title: string;
  versions: SavedPageSnapshot[];
  /** JPEG data URL or remote preview URL for the page picker grid. */
  thumbDataUrl?: string;
  /** APIJSON `Page.id` after a successful upload. */
  remoteId?: number | string;
  syncStatus?: PageSyncStatus;
  syncError?: string;
  syncedHash?: string;
};

export type SavedPagesChangeReason =
  | "add"
  | "update"
  | "rename"
  | "thumb"
  | "delete"
  | "sync-meta";

type SavedPagesChangeHandler = (
  pageId: string,
  reason: SavedPagesChangeReason,
  page?: SavedPage,
) => void;

let pagesChangeHandler: SavedPagesChangeHandler | null = null;

export function setSavedPagesChangeHandler(
  handler: SavedPagesChangeHandler | null,
): void {
  pagesChangeHandler = handler;
}

function notifyPagesChange(
  pageId: string,
  reason: SavedPagesChangeReason,
  page?: SavedPage,
) {
  try {
    pagesChangeHandler?.(pageId, reason, page);
  } catch {
    /* ignore sync/UI errors */
  }
}

/** Local capture: data:image JPEG/PNG within localStorage size bounds. */
export function isDataPageThumb(url: unknown): url is string {
  return (
    typeof url === "string" &&
    url.startsWith("data:image/") &&
    url.length > 64 &&
    url.length < 1_200_000
  );
}

/** Remote /upload preview (http(s) or same-origin download path). */
export function isRemotePageThumb(url: unknown): url is string {
  return (
    typeof url === "string" &&
    url.length > 8 &&
    url.length < 2000 &&
    (/^https?:\/\//i.test(url) ||
      url.startsWith("/apijson/") ||
      url.startsWith("/download/"))
  );
}

/** Non-empty preview URL suitable for the page-picker grid. */
export function isValidPageThumb(url: unknown): url is string {
  return isDataPageThumb(url) || isRemotePageThumb(url);
}

export function getSavedPageThumb(pageId: string): string | null {
  const page = getSavedPage(pageId);
  return isValidPageThumb(page?.thumbDataUrl) ? page.thumbDataUrl : null;
}

/** Persist a workspace screenshot for the page picker. */
export function setSavedPageThumb(
  pageId: string,
  thumbDataUrl: string,
): boolean {
  if (!isValidPageThumb(thumbDataUrl)) return false;
  const pages = loadAll();
  const page = pages.find((p) => p.id === pageId);
  if (!page) return false;
  page.thumbDataUrl = thumbDataUrl;
  saveAll(pages);
  notifyPagesChange(pageId, "thumb", page);
  return true;
}

/** Update sync metadata without bumping versions or re-uploading. */
export function patchSavedPageSync(
  pageId: string,
  patch: Partial<
    Pick<SavedPage, "remoteId" | "syncStatus" | "syncError" | "syncedHash">
  >,
): SavedPage | null {
  const pages = loadAll();
  const page = pages.find((p) => p.id === pageId);
  if (!page) return null;
  Object.assign(page, patch);
  saveAll(pages);
  notifyPagesChange(pageId, "sync-meta", page);
  return page;
}

/** Insert or replace a page imported from APIJSON (does not trigger upload). */
export function upsertImportedPage(page: SavedPage): SavedPage {
  const pages = loadAll();
  const i = pages.findIndex((p) => p.id === page.id);
  if (i >= 0) pages[i] = page;
  else pages.unshift(page);
  saveAll(pages);
  return page;
}

export type ActivePageRef = {
  pageId: string;
  version: number;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function loadAll(): SavedPage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is SavedPage =>
        isPlainObject(p) &&
        typeof p.id === "string" &&
        typeof p.title === "string" &&
        Array.isArray(p.versions),
    );
  } catch {
    return [];
  }
}

function saveAll(pages: SavedPage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages.slice(0, MAX_PAGES)));
  } catch {
    /* quota */
  }
}

export function listSavedPages(): SavedPage[] {
  return loadAll().sort((a, b) => a.title.localeCompare(b.title));
}

export function getSavedPage(pageId: string): SavedPage | null {
  return loadAll().find((p) => p.id === pageId) ?? null;
}

/** Saved page whose latest snapshot is this layout (or `app_page` id). */
export function findSavedPageByLayout(
  app: LayoutApp,
  page: LayoutPage,
): SavedPage | null {
  const skipRecords = isCatalogListPage(page);
  const usable = (found: SavedPage | null): SavedPage | null => {
    if (!found) return null;
    if (!skipRecords) return found;
    const snap = latestVersion(found);
    if (!snap || snapshotLooksLikeRecord(found.id, snap)) return null;
    return found;
  };

  const exact = usable(getSavedPage(surfaceIdForLayout(app, page)));
  if (exact) return exact;
  if (page === "home" || page === "list") {
    const alt = page === "home" ? "list" : "home";
    const other = usable(getSavedPage(surfaceIdForLayout(app, alt)));
    if (other) return other;
  }
  for (const p of listSavedPages()) {
    const snap = latestVersion(p);
    if (!snap) continue;
    if (skipRecords && snapshotLooksLikeRecord(p.id, snap)) continue;
    if (
      snap.layoutApp === app &&
      snap.layoutPage &&
      layoutPagesEquivalent(snap.layoutPage, page)
    ) {
      return p;
    }
  }
  return null;
}

export function getActivePageRef(): ActivePageRef | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      !isPlainObject(parsed) ||
      typeof parsed.pageId !== "string" ||
      typeof parsed.version !== "number"
    ) {
      return null;
    }
    return { pageId: parsed.pageId, version: parsed.version };
  } catch {
    return null;
  }
}

export function setActivePageRef(ref: ActivePageRef | null) {
  try {
    if (!ref) localStorage.removeItem(ACTIVE_KEY);
    else localStorage.setItem(ACTIVE_KEY, JSON.stringify(ref));
  } catch {
    /* ignore */
  }
}

/** Format for version menu: `v2 2026-10-01 11:23:45` */
export function formatVersionOption(
  version: number,
  createdAt: string,
): string {
  return `v${version} ${formatVersionTime(createdAt)}`;
}

export function formatVersionShort(version: number): string {
  return `v${version}`;
}

export function formatVersionTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function renameSavedPage(pageId: string, title: string): SavedPage | null {
  const pages = loadAll();
  const page = pages.find((p) => p.id === pageId);
  if (!page) return null;
  const next = title.trim() || page.title;
  page.title = next;
  saveAll(pages);
  notifyPagesChange(pageId, "rename", page);
  return page;
}

/** Update snapshot for an existing version (no version bump). */
export function updatePageVersion(
  pageId: string,
  version: number,
  patch: Omit<SavedPageSnapshot, "version" | "createdAt">,
): SavedPageSnapshot | null {
  const pages = loadAll();
  const page = pages.find((p) => p.id === pageId);
  if (!page) return null;
  const snap = page.versions.find((v) => v.version === version);
  if (!snap) return null;
  Object.assign(snap, patch);
  saveAll(pages);
  notifyPagesChange(pageId, "update", page);
  return snap;
}

/**
 * Append a new version for a page (or create the page).
 * Returns the new snapshot and page.
 */
export function addPageVersion(
  pageId: string,
  title: string,
  snapshot: Omit<SavedPageSnapshot, "version" | "createdAt">,
): { page: SavedPage; snapshot: SavedPageSnapshot } {
  const pages = loadAll();
  let page = pages.find((p) => p.id === pageId);
  if (!page) {
    page = { id: pageId, title: title.trim() || pageId, versions: [] };
    pages.unshift(page);
  } else if (title.trim() && page.title === pageId) {
    // Only auto-fill title when still the raw id
    page.title = title.trim();
  }
  const nextVer =
    page.versions.reduce((m, v) => Math.max(m, v.version), 0) + 1;
  const snap: SavedPageSnapshot = {
    ...snapshot,
    version: nextVer,
    createdAt: new Date().toISOString(),
  };
  page.versions.unshift(snap);
  if (page.versions.length > MAX_VERSIONS) {
    page.versions = page.versions.slice(0, MAX_VERSIONS);
  }
  // Move page to front of recents
  const rest = pages.filter((p) => p.id !== pageId);
  saveAll([page, ...rest]);
  setActivePageRef({ pageId, version: nextVer });
  notifyPagesChange(pageId, "add", page);
  return { page, snapshot: snap };
}

export function getPageVersion(
  pageId: string,
  version: number,
): SavedPageSnapshot | null {
  const page = getSavedPage(pageId);
  return page?.versions.find((v) => v.version === version) ?? null;
}

export function latestVersion(page: SavedPage): SavedPageSnapshot | null {
  if (!page.versions.length) return null;
  return page.versions.reduce((a, b) => (a.version >= b.version ? a : b));
}

/** Remove an entire page. Returns true if removed. */
export function deleteSavedPage(pageId: string): boolean {
  const pages = loadAll();
  const page = pages.find((p) => p.id === pageId);
  const next = pages.filter((p) => p.id !== pageId);
  if (next.length === pages.length) return false;
  saveAll(next);
  const active = getActivePageRef();
  if (active?.pageId === pageId) setActivePageRef(null);
  notifyPagesChange(pageId, "delete", page);
  return true;
}

/**
 * Remove one version. If the page has no versions left, remove the page.
 * Returns the page after deletion (or null if page was removed).
 */
export function deletePageVersion(
  pageId: string,
  version: number,
): SavedPage | null {
  const pages = loadAll();
  const page = pages.find((p) => p.id === pageId);
  if (!page) return null;
  const before = page.versions.length;
  page.versions = page.versions.filter((v) => v.version !== version);
  if (page.versions.length === before) return page;
  if (!page.versions.length) {
    saveAll(pages.filter((p) => p.id !== pageId));
    const active = getActivePageRef();
    if (active?.pageId === pageId) setActivePageRef(null);
    notifyPagesChange(pageId, "delete", page);
    return null;
  }
  saveAll(pages);
  notifyPagesChange(pageId, "update", page);
  const active = getActivePageRef();
  if (active?.pageId === pageId && active.version === version) {
    const latest = latestVersion(page);
    setActivePageRef(
      latest ? { pageId, version: latest.version } : null,
    );
  }
  return page;
}
