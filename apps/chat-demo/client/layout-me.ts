/**
 * "Me" hub + profile + settings (per app). Field names come from comments.
 */

import { t } from "./i18n/index.js";
import { loadAccount } from "./account.js";
import { fetchBoundGet, inferPersonTable } from "./layout-actions.js";
import { visitorId } from "./layout-social.js";
import {
  isSettingsPage,
  mediaSrc,
  pickRowPresentation,
  type LayoutApp,
  type LayoutPage,
  type RowPresentation,
} from "./page-layout.js";
import type { SchemaComments } from "./schema-types.js";
import type { ColumnMeta } from "./field-meta.js";

type FlatRow = { key: string; cells: Record<string, unknown> };

export type MeHandlers = {
  onSelectPage?: (page: LayoutPage) => void;
  onOpenProfile?: () => void;
  onOpenRow?: (key: string) => void;
};

export type MeOpts = {
  app: LayoutApp;
  page: LayoutPage;
  rows: FlatRow[];
  columns: string[];
  primaryTable: string | null;
  comments?: SchemaComments | null;
  columnMetas?: Record<string, ColumnMeta> | null;
  apijsonBase: string;
  recordId: (row: FlatRow) => string | number | null;
  handlers: MeHandlers;
};

const APP_VERSION = "0.1.0";
const PREF_KEY = "a2api.me.prefs";

type MePrefs = {
  push?: boolean;
  sound?: boolean;
  camera?: boolean;
  album?: boolean;
  loc?: boolean;
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function thumb(url: string | null, base: string, className: string): HTMLElement {
  const box = el("div", className);
  if (url) {
    const img = document.createElement("img");
    img.src = mediaSrc(url, base);
    img.alt = "";
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.onerror = () => {
      box.classList.add("is-empty");
      img.remove();
    };
    box.appendChild(img);
  } else {
    box.classList.add("is-empty");
  }
  return box;
}

function readPrefs(): MePrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? (JSON.parse(raw) as MePrefs) : {};
  } catch {
    return {};
  }
}

function writePrefs(next: MePrefs) {
  localStorage.setItem(PREF_KEY, JSON.stringify(next));
}

function showMap(
  metas?: Record<string, ColumnMeta> | null,
): Record<string, ColumnMeta["show"] | undefined> {
  const out: Record<string, ColumnMeta["show"] | undefined> = {};
  if (!metas) return out;
  for (const [p, m] of Object.entries(metas)) out[p] = m.show;
  return out;
}

function presentRow(opts: MeOpts, row: FlatRow): RowPresentation {
  return pickRowPresentation(row.cells, {
    primaryTable: opts.primaryTable,
    columns: opts.columns,
    comments: opts.comments,
    showByPath: showMap(opts.columnMetas),
    recordId: opts.recordId(row),
  });
}

function findMeRow(opts: MeOpts): FlatRow | undefined {
  const meId = visitorId();
  if (meId == null) return undefined;
  return opts.rows.find((row) => {
    const pres = presentRow(opts, row);
    const id = opts.recordId(row);
    return String(pres.id ?? "") === String(meId) || String(id ?? "") === String(meId);
  });
}

function fallbackRow(opts: MeOpts): FlatRow {
  const acc = loadAccount();
  const meId = visitorId();
  const table = inferPersonTable(opts.comments) || opts.primaryTable || "Account";
  return {
    key: String(meId ?? acc?.login ?? "me"),
    cells: {
      [`${table}.id`]: meId,
      [`${table}.name`]: acc?.name || acc?.login || t("layout.tab.me"),
    },
  };
}

async function loadMeCells(
  opts: MeOpts,
): Promise<{ row: FlatRow; pres: RowPresentation }> {
  const matched = findMeRow(opts);
  if (matched) return { row: matched, pres: presentRow(opts, matched) };
  const meId = visitorId();
  const table = inferPersonTable(opts.comments) || opts.primaryTable;
  if (meId != null && table && opts.apijsonBase) {
    const json = await fetchBoundGet(opts.apijsonBase, { [table]: { id: meId } });
    const rec = json?.[table];
    if (rec && typeof rec === "object" && !Array.isArray(rec)) {
      const cells: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rec as Record<string, unknown>)) {
        cells[`${table}.${k}`] = v;
      }
      const row: FlatRow = { key: String(meId), cells };
      return {
        row,
        pres: pickRowPresentation(cells, {
          primaryTable: table,
          columns: Object.keys(cells),
          comments: opts.comments,
          recordId: meId,
        }),
      };
    }
  }
  const row = fallbackRow(opts);
  return {
    row,
    pres: pickRowPresentation(row.cells, {
      primaryTable: opts.primaryTable,
      columns: Object.keys(row.cells),
      comments: opts.comments,
      recordId: visitorId(),
    }),
  };
}

type MeLink = { page: LayoutPage; icon: string; label: string };

function shortcutLinks(app: LayoutApp): MeLink[] {
  switch (app) {
    case "commerce":
      return [
        { page: "orders", icon: "🧾", label: t("layout.me.purchase") },
        { page: "history", icon: "👁", label: t("layout.me.browse") },
        { page: "cart", icon: "▣", label: t("layout.page.cart") },
        { page: "address", icon: "⌂", label: t("layout.page.address") },
        { page: "favorite", icon: "♡", label: t("layout.me.favorite") },
      ];
    case "video":
      return [
        { page: "history", icon: "▶", label: t("layout.me.play") },
        { page: "favorite", icon: "♡", label: t("layout.me.favorite") },
        { page: "create", icon: "✎", label: t("layout.me.publish") },
      ];
    case "music":
      return [
        { page: "player", icon: "▶", label: t("layout.me.play") },
        { page: "history", icon: "👁", label: t("layout.me.browse") },
        { page: "favorite", icon: "♡", label: t("layout.me.favorite") },
        { page: "create", icon: "✎", label: t("layout.me.publish") },
      ];
    case "news":
    case "info":
      return [
        { page: "history", icon: "👁", label: t("layout.me.browse") },
        { page: "favorite", icon: "♡", label: t("layout.me.favorite") },
        { page: "create", icon: "✎", label: t("layout.me.publish") },
      ];
    case "blog":
    case "article":
      return [
        { page: "history", icon: "👁", label: t("layout.me.browse") },
        { page: "create", icon: "✎", label: t("layout.me.create") },
        { page: "favorite", icon: "♡", label: t("layout.me.favorite") },
      ];
    case "social":
      return [
        { page: "feed", icon: "☰", label: t("layout.page.feed") },
        { page: "history", icon: "👁", label: t("layout.me.browse") },
        { page: "create", icon: "✎", label: t("layout.me.publish") },
      ];
    case "chat":
      return [
        { page: "list", icon: "▤", label: t("layout.tab.chats") },
        { page: "users", icon: "☺", label: t("layout.tab.contacts") },
        { page: "favorite", icon: "♡", label: t("layout.me.favorite") },
      ];
    case "campaign":
      return [
        { page: "history", icon: "👁", label: t("layout.me.browse") },
        { page: "create", icon: "✎", label: t("layout.me.publish") },
        { page: "favorite", icon: "♡", label: t("layout.me.favorite") },
      ];
    default:
      return [
        { page: "profile", icon: "☺", label: t("layout.me.profile") },
        { page: "settings", icon: "⚙", label: t("layout.me.settings") },
      ];
  }
}

function menuLinks(app: LayoutApp): MeLink[] {
  const rows: MeLink[] = [
    { page: "profile", icon: "☺", label: t("layout.page.profile") },
    { page: "settings", icon: "⚙", label: t("layout.page.settings") },
  ];
  if (app === "commerce") {
    rows.push(
      { page: "orders", icon: "🧾", label: t("layout.page.orders") },
      { page: "address", icon: "⌂", label: t("layout.page.address") },
    );
  }
  rows.push({ page: "about", icon: "ⓘ", label: t("layout.page.about") });
  if (app !== "data") {
    rows.push({ page: "upgrade", icon: "↑", label: t("layout.page.upgrade") });
  }
  return rows;
}

function settingsLinks(app: LayoutApp): MeLink[] {
  const rows: MeLink[] = [
    { page: "notify", icon: "◌", label: t("layout.page.notify") },
    { page: "permission", icon: "▣", label: t("layout.page.permission") },
    { page: "wallet", icon: "◇", label: t("layout.page.wallet") },
    { page: "favorite", icon: "♡", label: t("layout.page.favorite") },
    { page: "security", icon: "◌", label: t("layout.page.security") },
    { page: "help", icon: "?", label: t("layout.page.help") },
    { page: "blacklist", icon: "⊘", label: t("layout.page.blacklist") },
  ];
  if (app === "commerce") {
    rows.push({ page: "address", icon: "⌂", label: t("layout.page.address") });
  }
  rows.push({ page: "about", icon: "ⓘ", label: t("layout.page.about") });
  if (app !== "data") {
    rows.push({ page: "upgrade", icon: "↑", label: t("layout.page.upgrade") });
  }
  return rows;
}

function mountLink(link: MeLink, go: (page: LayoutPage) => void, kind: "grid" | "row") {
  const btn = el("button", kind === "grid" ? "me-cell" : "me-row");
  btn.type = "button";
  btn.append(
    el("span", "me-ico", link.icon),
    el("span", "me-lab", link.label),
  );
  if (kind === "row") btn.appendChild(el("span", "me-chev", "›"));
  btn.onclick = () => go(link.page);
  return btn;
}

function paintHead(
  host: HTMLElement,
  opts: MeOpts,
  pres: RowPresentation,
  openProfile: () => void,
) {
  const head = el("button", "me-head");
  head.type = "button";
  head.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "me-av"));
  const who = el("div", "me-who");
  who.appendChild(el("div", "me-name", pres.title || t("layout.tab.me")));
  const bits = [pres.sex, pres.age ? `${t("layout.me.age")} ${pres.age}` : ""]
    .filter(Boolean)
    .join(" · ");
  if (bits) who.appendChild(el("div", "layout-meta", bits));
  else if (pres.subtitle) who.appendChild(el("div", "layout-meta", pres.subtitle));
  head.append(who, el("span", "me-chev", "›"));
  head.onclick = openProfile;
  host.appendChild(head);
}

function goPage(opts: MeOpts, page: LayoutPage) {
  opts.handlers.onSelectPage?.(page);
}

export function renderMeSurface(opts: MeOpts): HTMLElement {
  if (opts.page === "profile") return renderProfilePage(opts);
  if (opts.page === "settings") return renderSettingsHome(opts);
  if (isSettingsPage(opts.page)) return renderSettingsSection(opts);
  return renderMeHub(opts);
}

function renderMeHub(opts: MeOpts): HTMLElement {
  const page = el("div", `me-page me-hub app-${opts.app}`);
  const acc = loadAccount();
  paintHead(
    page,
    opts,
    pickRowPresentation(
      fallbackRow(opts).cells,
      { primaryTable: opts.primaryTable, comments: opts.comments, recordId: visitorId() },
    ),
    () => goPage(opts, "profile"),
  );
  void loadMeCells(opts).then(({ pres }) => {
    if (!page.isConnected) return;
    const next = el("div");
    paintHead(next, opts, pres, () => goPage(opts, "profile"));
    const old = page.querySelector(".me-head");
    if (old && next.firstElementChild) old.replaceWith(next.firstElementChild);
  });

  const grid = el("div", "me-grid");
  for (const link of shortcutLinks(opts.app)) {
    grid.appendChild(mountLink(link, (p) => goPage(opts, p), "grid"));
  }
  page.appendChild(grid);

  const menu = el("div", "me-menu");
  for (const link of menuLinks(opts.app)) {
    menu.appendChild(mountLink(link, (p) => goPage(opts, p), "row"));
  }
  page.appendChild(menu);
  if (!acc && !visitorId()) {
    page.appendChild(el("div", "layout-meta me-hint", t("layout.me.needLogin")));
  }
  return page;
}

function renderProfilePage(opts: MeOpts): HTMLElement {
  const page = el("div", `me-page me-profile app-${opts.app}`);
  page.appendChild(el("h2", "ex-title", t("layout.page.profile")));
  page.appendChild(el("div", "layout-meta", t("layout.explore.loading")));
  void loadMeCells(opts).then(({ row, pres }) => {
    if (!page.isConnected) return;
    page.replaceChildren(el("h2", "ex-title", t("layout.page.profile")));
    page.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "me-av-lg"));
    page.appendChild(el("div", "me-name", pres.title || t("layout.tab.me")));
    const dl = el("div", "me-dl");
    const rows: Array<[string, string]> = [
      [t("layout.me.sex"), pres.sex || t("layout.me.empty")],
      [t("layout.me.age"), pres.age || t("layout.me.empty")],
    ];
    if (pres.phone) rows.push([t("layout.phone"), pres.phone]);
    if (pres.body) rows.push([t("layout.me.profile"), pres.body]);
    if (pres.date) rows.push([t("layout.me.joined"), pres.date]);
    for (const [k, v] of rows) {
      const line = el("div", "me-dl-row");
      line.append(el("div", "me-dl-k", k), el("div", "me-dl-v", v));
      dl.appendChild(line);
    }
    page.appendChild(dl);
    const edit = el("button", "layout-btn layout-btn-primary", t("layout.me.edit"));
    edit.type = "button";
    edit.onclick = () => {
      if (opts.handlers.onOpenProfile) opts.handlers.onOpenProfile();
      else if (row.key) opts.handlers.onOpenRow?.(row.key);
    };
    page.appendChild(edit);
  });
  return page;
}

function renderSettingsHome(opts: MeOpts): HTMLElement {
  const page = el("div", `me-page me-settings app-${opts.app}`);
  page.appendChild(el("h2", "ex-title", t("layout.page.settings")));
  const menu = el("div", "me-menu");
  for (const link of settingsLinks(opts.app)) {
    menu.appendChild(mountLink(link, (p) => goPage(opts, p), "row"));
  }
  page.appendChild(menu);
  return page;
}

function toggleRow(
  label: string,
  on: boolean,
  change: (next: boolean) => void,
): HTMLElement {
  const row = el("label", "me-toggle");
  row.appendChild(el("span", "me-lab", label));
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = on;
  input.onchange = () => change(input.checked);
  row.appendChild(input);
  return row;
}

function sectionShell(opts: MeOpts, title: string): HTMLElement {
  const page = el("div", `me-page me-section app-${opts.app}`);
  const back = el("button", "me-back", `‹ ${t("layout.page.settings")}`);
  back.type = "button";
  back.onclick = () => goPage(opts, "settings");
  page.append(back, el("h2", "ex-title", title));
  return page;
}

function renderSettingsSection(opts: MeOpts): HTMLElement {
  const page = opts.page;
  const title = t(
    `layout.page.${page}` as "layout.page.settings",
  );
  const host = sectionShell(opts, title);
  const prefs = readPrefs();

  if (page === "notify") {
    host.appendChild(
      toggleRow(t("layout.me.push"), prefs.push !== false, (v) => {
        writePrefs({ ...readPrefs(), push: v });
      }),
    );
    host.appendChild(
      toggleRow(t("layout.me.sound"), !!prefs.sound, (v) => {
        writePrefs({ ...readPrefs(), sound: v });
      }),
    );
    return host;
  }
  if (page === "permission") {
    host.appendChild(
      toggleRow(t("layout.me.camera"), !!prefs.camera, (v) => {
        writePrefs({ ...readPrefs(), camera: v });
      }),
    );
    host.appendChild(
      toggleRow(t("layout.me.album"), !!prefs.album, (v) => {
        writePrefs({ ...readPrefs(), album: v });
      }),
    );
    host.appendChild(
      toggleRow(t("layout.me.loc"), !!prefs.loc, (v) => {
        writePrefs({ ...readPrefs(), loc: v });
      }),
    );
    return host;
  }
  if (page === "wallet") {
    host.appendChild(el("div", "result-empty", t("layout.me.walletEmpty")));
    return host;
  }
  if (page === "favorite") {
    const mine = visitorId();
    const kept = mine
      ? opts.rows.filter((row) =>
          presentRow(opts, row).collectIds.some((id) => String(id) === String(mine)),
        )
      : [];
    if (!kept.length) {
      host.appendChild(el("div", "result-empty", t("layout.me.favoriteEmpty")));
      return host;
    }
    const list = el("div", "me-fav");
    for (const row of kept) {
      const pres = presentRow(opts, row);
      const card = el("button", "me-fav-card");
      card.type = "button";
      card.onclick = () => opts.handlers.onOpenRow?.(row.key);
      card.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "me-fav-img"));
      card.appendChild(el("div", "layout-title", pres.title || `#${row.key}`));
      list.appendChild(card);
    }
    host.appendChild(list);
    return host;
  }
  if (page === "security") {
    host.appendChild(el("div", "layout-meta", t("layout.me.securityHint")));
    return host;
  }
  if (page === "help") {
    host.appendChild(el("div", "layout-meta", t("layout.me.helpHint")));
    const box = document.createElement("textarea");
    box.className = "me-help";
    box.rows = 5;
    const send = el("button", "layout-btn layout-btn-primary", t("layout.me.helpSend"));
    send.type = "button";
    send.onclick = () => {
      const text = box.value.trim();
      if (!text) return;
      const prev = localStorage.getItem("a2api.me.feedback") || "[]";
      let list: unknown[] = [];
      try {
        list = JSON.parse(prev) as unknown[];
      } catch {
        list = [];
      }
      list.push({ at: Date.now(), text, app: opts.app });
      localStorage.setItem("a2api.me.feedback", JSON.stringify(list));
      box.value = "";
      send.textContent = t("layout.me.helpSent");
    };
    host.append(box, send);
    return host;
  }
  if (page === "blacklist") {
    host.appendChild(el("div", "result-empty", t("layout.me.blacklistEmpty")));
    return host;
  }
  if (page === "about") {
    host.appendChild(el("div", "me-about", t("layout.me.aboutBody")));
    host.appendChild(
      el("div", "layout-meta", t("layout.me.version", { version: APP_VERSION })),
    );
    return host;
  }
  if (page === "upgrade") {
    host.appendChild(
      el("div", "me-name", t("layout.me.version", { version: APP_VERSION })),
    );
    host.appendChild(el("div", "layout-meta", t("layout.me.latest")));
    const btn = el("button", "layout-btn", t("layout.me.checkUpdate"));
    btn.type = "button";
    btn.onclick = () => {
      btn.textContent = t("layout.me.latest");
    };
    host.appendChild(btn);
    return host;
  }
  return host;
}
