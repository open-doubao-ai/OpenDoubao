/**
 * Per-app user list / profile (YouTube channel, 酷狗艺人, 微信通讯录, 掘金作者 …).
 * Field values come from RowPresentation — no Demo table/column literals.
 */

import { t } from "./i18n/index.js";
import { visitorId } from "./layout-social.js";
import {
  fetchAuthorFeed,
} from "./layout-actions.js";
import {
  inferAuthorIdField,
  inferDateOrderField,
  inferItemTableForApp,
} from "./layout-category.js";
import { collectRowImageUrls } from "./smart-image-fields.js";
import type { LayoutDetailHandlers } from "./layout-views.js";
import { attachListRow } from "./layout-list-select.js";
import {
  formatCount,
  formatPrice,
  isArticleLikeApp,
  isBookReaderApp,
  isLocalLikeApp,
  isNewsLikeApp,
  mediaSrc,
  pickRowPresentation,
  type LayoutApp,
  type RowPresentation,
} from "./page-layout.js";
import type { SchemaComments } from "./schema-types.js";
import type { ColumnMeta } from "./field-meta.js";

type FlatRow = { key: string; cells: Record<string, unknown> };

export type UserListOpts = {
  app: LayoutApp;
  rows: FlatRow[];
  columns: string[];
  primaryTable: string | null;
  comments?: SchemaComments | null;
  columnMetas?: Record<string, ColumnMeta> | null;
  apijsonBase: string;
  recordId: (row: FlatRow) => string | number | null;
  onOpenRow: (key: string) => void;
  /** When false, skip long-press / pick select (data app). Default true. */
  selectEnabled?: boolean;
};

function wireUserRow(
  node: HTMLElement,
  opts: UserListOpts,
  row: FlatRow,
): void {
  const pres = rowPres(opts, row);
  attachListRow(node, {
    key: row.key,
    id: opts.recordId(row),
    label: pres.title || `#${row.key}`,
    cells: row.cells,
    onOpen: () => opts.onOpenRow(row.key),
    enabled: opts.selectEnabled !== false && opts.app !== "data",
  });
}

export type UserProfileOpts = {
  app: LayoutApp;
  pres: RowPresentation;
  row: FlatRow;
  related: Array<{ pres: RowPresentation; id: string | number }>;
  apijsonBase: string;
  handlers: LayoutDetailHandlers;
  primaryTable?: string | null;
  recordId?: string | number | null;
  comments?: SchemaComments | null;
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

function thumb(
  url: string | null,
  base: string,
  className: string,
  empty = "",
): HTMLElement {
  const box = el("div", className);
  if (url) {
    const img = el("img");
    img.src = mediaSrc(url, base);
    img.alt = "";
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.onerror = () => {
      box.classList.add("is-empty");
      img.replaceWith(document.createTextNode(empty));
    };
    box.appendChild(img);
  } else {
    box.classList.add("is-empty");
    if (empty) box.textContent = empty;
  }
  return box;
}

function showMap(
  metas?: Record<string, ColumnMeta> | null,
): Record<string, ColumnMeta["show"] | undefined> {
  const out: Record<string, ColumnMeta["show"] | undefined> = {};
  if (!metas) return out;
  for (const [p, m] of Object.entries(metas)) out[p] = m.show;
  return out;
}

function rowPres(opts: UserListOpts, row: FlatRow): RowPresentation {
  return pickRowPresentation(row.cells, {
    primaryTable: opts.primaryTable,
    columns: opts.columns,
    comments: opts.comments,
    showByPath: showMap(opts.columnMetas),
    recordId: opts.recordId(row),
  });
}

function roleLabel(app: LayoutApp): string {
  switch (app) {
    case "video":
      return t("layout.users.creators");
    case "music":
      return t("layout.users.artists");
    case "commerce":
      return t("layout.users.sellers");
    case "social":
      return t("layout.users.contacts");
    case "chat":
      return t("layout.users.addressBook");
    default:
      if (isNewsLikeApp(app) || isArticleLikeApp(app) || isBookReaderApp(app)) {
        return t("layout.users.authors");
      }
      if (isLocalLikeApp(app)) return t("layout.users.hosts");
      return t("layout.users.people");
  }
}

function statLine(pres: RowPresentation, app: LayoutApp): string {
  if (app === "commerce" && pres.sales != null) {
    return `${formatCount(pres.sales)} ${t("layout.sold")}`;
  }
  if (app === "music" && pres.playCount != null) {
    return `${formatCount(pres.playCount)} ${t("layout.fans")}`;
  }
  if (app === "video" && pres.playCount != null) {
    return `${formatCount(pres.playCount)} ${t("layout.users.subscribers")}`;
  }
  if (
    (isArticleLikeApp(app) || isNewsLikeApp(app) || isBookReaderApp(app)) &&
    pres.playCount != null
  ) {
    return `${formatCount(pres.playCount)} ${t("layout.reads")}`;
  }
  const bits = [
    pres.subtitle,
    pres.author && pres.author !== pres.title ? pres.author : "",
    pres.date,
  ].filter(Boolean);
  return bits.join(" · ");
}

export function renderUserList(opts: UserListOpts): HTMLElement {
  const app = opts.app;
  if (app === "video") return renderYtChannels(opts);
  if (app === "music") return renderSpArtists(opts);
  if (app === "commerce") return renderAzSellers(opts);
  if (isNewsLikeApp(app)) return renderNewsAuthors(opts);
  if (isArticleLikeApp(app) || isBookReaderApp(app)) return renderJjAuthors(opts);
  if (app === "social") return renderWxContacts(opts);
  if (app === "chat") return renderChatContacts(opts);
  if (isLocalLikeApp(app)) return renderCampHosts(opts);
  return renderDataDirectory(opts);
}

function renderYtChannels(opts: UserListOpts): HTMLElement {
  const grid = el("div", "up-yt-grid");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "up-yt-card");
    card.type = "button";
    wireUserRow(card, opts, row);
    card.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "up-yt-av", ""));
    const mid = el("div", "up-yt-mid");
    mid.appendChild(el("div", "up-yt-name", pres.title || `#${row.key}`));
    mid.appendChild(
      el("div", "layout-meta", statLine(pres, "video") || t("layout.users.creators")),
    );
    card.appendChild(mid);
    card.appendChild(el("span", "up-yt-sub", t("layout.subscribe")));
    grid.appendChild(card);
  }
  return grid;
}

function renderSpArtists(opts: UserListOpts): HTMLElement {
  const list = el("div", "up-sp-list");
  opts.rows.forEach((row, i) => {
    const pres = rowPres(opts, row);
    const card = el("button", "up-sp-row");
    card.type = "button";
    wireUserRow(card, opts, row);
    card.appendChild(el("span", "up-sp-num", String(i + 1)));
    card.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "up-sp-av", ""));
    const mid = el("div", "up-sp-mid");
    mid.appendChild(el("div", "layout-title", pres.title || `#${row.key}`));
    mid.appendChild(
      el("div", "layout-meta", statLine(pres, "music") || t("layout.users.artists")),
    );
    card.appendChild(mid);
    list.appendChild(card);
  });
  return list;
}

function renderAzSellers(opts: UserListOpts): HTMLElement {
  const grid = el("div", "up-az-grid");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "up-az-card");
    card.type = "button";
    wireUserRow(card, opts, row);
    const banner = thumb(pres.coverUrl, opts.apijsonBase, "up-az-banner", "");
    card.appendChild(banner);
    const body = el("div", "up-az-body");
    body.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "up-az-av", ""));
    body.appendChild(el("div", "layout-title", pres.title || `#${row.key}`));
    const meta = statLine(pres, "commerce") || t("layout.users.sellers");
    body.appendChild(el("div", "layout-meta", meta));
    if (pres.price != null) {
      body.appendChild(el("div", "layout-price", formatPrice(pres.price)));
    }
    card.appendChild(body);
    grid.appendChild(card);
  }
  return grid;
}

function renderNewsAuthors(opts: UserListOpts): HTMLElement {
  const list = el("div", "up-news-list");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "up-news-row");
    card.type = "button";
    wireUserRow(card, opts, row);
    card.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "up-news-av", ""));
    const mid = el("div", "up-news-mid");
    mid.appendChild(el("div", "layout-kicker", roleLabel(opts.app)));
    mid.appendChild(el("div", "layout-title", pres.title || `#${row.key}`));
    mid.appendChild(
      el("div", "layout-meta", statLine(pres, opts.app) || pres.source),
    );
    card.appendChild(mid);
    list.appendChild(card);
  }
  return list;
}

function renderJjAuthors(opts: UserListOpts): HTMLElement {
  const list = el("div", "up-jj-list");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "up-jj-card");
    card.type = "button";
    wireUserRow(card, opts, row);
    card.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "up-jj-av", ""));
    const mid = el("div", "up-jj-mid");
    mid.appendChild(el("div", "layout-title", pres.title || `#${row.key}`));
    if (pres.body || pres.headline) {
      mid.appendChild(
        el("div", "layout-excerpt", (pres.headline || pres.body).slice(0, 80)),
      );
    }
    mid.appendChild(el("div", "layout-meta", statLine(pres, opts.app)));
    card.appendChild(mid);
    list.appendChild(card);
  }
  return list;
}

function renderWxContacts(opts: UserListOpts): HTMLElement {
  const list = el("div", "up-wx-list");
  const head = el("div", "up-wx-head", roleLabel("social"));
  list.appendChild(head);
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "up-wx-row");
    card.type = "button";
    wireUserRow(card, opts, row);
    card.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "up-wx-av", ""));
    const mid = el("div", "up-wx-mid");
    mid.appendChild(el("div", "layout-title", pres.title || `#${row.key}`));
    mid.appendChild(
      el("div", "layout-meta", pres.body || pres.subtitle || pres.date),
    );
    card.appendChild(mid);
    list.appendChild(card);
  }
  return list;
}

function renderChatContacts(opts: UserListOpts): HTMLElement {
  const list = el("div", "up-chat-list");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "up-chat-row");
    card.type = "button";
    wireUserRow(card, opts, row);
    card.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "up-chat-av", ""));
    const mid = el("div", "up-chat-mid");
    mid.appendChild(el("div", "layout-title", pres.title || `#${row.key}`));
    mid.appendChild(
      el(
        "div",
        "layout-excerpt",
        (pres.body || pres.subtitle || t("layout.users.addressBook")).slice(0, 72),
      ),
    );
    card.appendChild(mid);
    if (pres.date) card.appendChild(el("div", "up-chat-time", pres.date));
    list.appendChild(card);
  }
  return list;
}

function renderCampHosts(opts: UserListOpts): HTMLElement {
  const grid = el("div", "up-camp-grid");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "up-camp-card");
    card.type = "button";
    wireUserRow(card, opts, row);
    card.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "up-camp-av", ""));
    card.appendChild(el("div", "layout-kicker", t("layout.users.hosts")));
    card.appendChild(el("div", "layout-title", pres.title || `#${row.key}`));
    card.appendChild(el("div", "layout-meta", statLine(pres, "campaign")));
    grid.appendChild(card);
  }
  return grid;
}

function renderDataDirectory(opts: UserListOpts): HTMLElement {
  const list = el("div", "up-data-list");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "up-data-row");
    card.type = "button";
    wireUserRow(card, opts, row);
    card.appendChild(thumb(pres.coverUrl, opts.apijsonBase, "up-data-av", ""));
    const mid = el("div", "up-data-mid");
    mid.appendChild(el("div", "layout-title", pres.title || `#${row.key}`));
    mid.appendChild(el("div", "layout-meta", pres.subtitle || pres.date));
    card.appendChild(mid);
    list.appendChild(card);
  }
  return list;
}

export function renderUserProfile(host: HTMLElement, opts: UserProfileOpts): void {
  const app = el("div", `layout-app up-profile app-${opts.app}`);
  switch (opts.app) {
    case "video":
      renderYtChannel(app, opts);
      break;
    case "music":
      renderSpArtist(app, opts);
      break;
    case "commerce":
      renderAzSeller(app, opts);
      break;
    case "social":
    case "chat":
      renderPersonProfile(app, opts);
      break;
    default:
      if (isNewsLikeApp(opts.app)) renderNewsAuthor(app, opts);
      else if (isArticleLikeApp(opts.app) || isBookReaderApp(opts.app))
        renderJjAuthor(app, opts);
      else if (isLocalLikeApp(opts.app)) renderCampHost(app, opts);
      else renderDataProfile(app, opts);
  }
  host.appendChild(app);
}

function bindPersonActions(
  opts: UserProfileOpts,
  followBtn?: HTMLElement,
  messageBtn?: HTMLElement,
  authorNodes: HTMLElement[] = [],
) {
  const id = opts.recordId ?? opts.pres.id ?? opts.pres.authorId;
  if (followBtn) {
    followBtn.onclick = () => {
      if (id == null) return;
      void opts.handlers.onActionSlot?.(
        "follow",
        {
          record: opts.row.cells,
          visitorId: visitorId(),
          authorId: id,
        },
      );
    };
  }
  if (messageBtn) {
    messageBtn.onclick = () => {
      if (id == null) return;
      if (opts.handlers.onOpenChat) {
        opts.handlers.onOpenChat(id);
        return;
      }
      void opts.handlers.onActionSlot?.("message", {
        record: opts.row.cells,
        visitorId: visitorId(),
        authorId: id,
      });
    };
  }
  for (const node of authorNodes) {
    node.classList.add("author-link");
  }
}

function relatedBlock(
  opts: UserProfileOpts,
  title: string,
  className: string,
): HTMLElement | null {
  if (!opts.related.length) return null;
  const box = el("div", className);
  box.appendChild(el("h3", "up-h", title));
  for (const item of opts.related.slice(0, 8)) {
    const b = el("button", "up-related");
    b.type = "button";
    b.onclick = () => opts.handlers.onOpenRelated?.(item.id);
    b.appendChild(thumb(item.pres.coverUrl, opts.apijsonBase, "up-related-img", ""));
    b.appendChild(el("div", "layout-title", item.pres.title));
    box.appendChild(b);
  }
  return box;
}

function renderYtChannel(app: HTMLElement, opts: UserProfileOpts) {
  const page = el("div", "up-yt-page");
  page.appendChild(thumb(opts.pres.coverUrl, opts.apijsonBase, "up-yt-banner", ""));
  const row = el("div", "up-yt-ident");
  const av = thumb(opts.pres.coverUrl, opts.apijsonBase, "up-yt-av-lg", "");
  const who = el("div");
  who.appendChild(el("h1", "up-yt-title", opts.pres.title));
  who.appendChild(
    el(
      "div",
      "layout-meta",
      statLine(opts.pres, "video") || t("layout.users.creators"),
    ),
  );
  row.append(av, who);
  const sub = el("button", "up-yt-sub up-yt-sub-lg", t("layout.subscribe"));
  sub.type = "button";
  row.appendChild(sub);
  page.appendChild(row);
  if (opts.pres.body) page.appendChild(el("div", "up-bio", opts.pres.body));
  const related = relatedBlock(opts, t("layout.users.uploads"), "up-yt-uploads");
  if (related) page.appendChild(related);
  bindPersonActions(opts, sub, undefined, [av]);
  app.appendChild(page);
}

function renderSpArtist(app: HTMLElement, opts: UserProfileOpts) {
  const page = el("div", "up-sp-page");
  const hero = el("div", "up-sp-hero");
  hero.appendChild(thumb(opts.pres.coverUrl, opts.apijsonBase, "up-sp-av-lg", ""));
  const who = el("div");
  who.appendChild(el("div", "layout-kicker", t("layout.users.artists")));
  who.appendChild(el("h1", "up-sp-title", opts.pres.title));
  who.appendChild(el("div", "layout-meta", statLine(opts.pres, "music")));
  const follow = el("button", "layout-btn layout-btn-primary", t("layout.follow"));
  follow.type = "button";
  who.appendChild(follow);
  hero.appendChild(who);
  page.appendChild(hero);
  const related = relatedBlock(opts, t("layout.queue"), "up-sp-tracks");
  if (related) page.appendChild(related);
  bindPersonActions(opts, follow);
  app.appendChild(page);
}

function renderAzSeller(app: HTMLElement, opts: UserProfileOpts) {
  const page = el("div", "up-az-page");
  page.appendChild(thumb(opts.pres.coverUrl, opts.apijsonBase, "up-az-store-banner", ""));
  const ident = el("div", "up-az-ident");
  ident.appendChild(thumb(opts.pres.coverUrl, opts.apijsonBase, "up-az-av-lg", ""));
  const who = el("div");
  who.appendChild(el("div", "layout-kicker", t("layout.users.store")));
  who.appendChild(el("h1", "layout-title", opts.pres.title));
  who.appendChild(el("div", "layout-meta", statLine(opts.pres, "commerce")));
  ident.appendChild(who);
  page.appendChild(ident);
  if (opts.pres.body) page.appendChild(el("div", "up-bio", opts.pres.body));
  const related = relatedBlock(opts, t("layout.moreFrom"), "up-az-goods");
  if (related) page.appendChild(related);
  app.appendChild(page);
}

function renderNewsAuthor(app: HTMLElement, opts: UserProfileOpts) {
  const page = el("div", "up-news-page");
  const mast = el("div", "up-news-mast");
  mast.appendChild(thumb(opts.pres.coverUrl, opts.apijsonBase, "up-news-av-lg", ""));
  const who = el("div");
  who.appendChild(el("div", "layout-kicker", roleLabel(opts.app)));
  who.appendChild(el("h1", "news-h1", opts.pres.title));
  who.appendChild(
    el("div", "layout-meta", [opts.pres.source, opts.pres.date].filter(Boolean).join(" · ")),
  );
  const follow = el("button", "app-chip", t("layout.follow"));
  follow.type = "button";
  who.appendChild(follow);
  mast.appendChild(who);
  page.appendChild(mast);
  if (opts.pres.body) page.appendChild(el("div", "news-body", opts.pres.body));
  const related = relatedBlock(opts, t("layout.relatedNews"), "up-news-more");
  if (related) page.appendChild(related);
  bindPersonActions(opts, follow);
  app.appendChild(page);
}

function renderJjAuthor(app: HTMLElement, opts: UserProfileOpts) {
  const page = el("div", "up-jj-page");
  const card = el("div", "jj-card up-jj-hero");
  card.appendChild(thumb(opts.pres.coverUrl, opts.apijsonBase, "up-jj-av-lg", ""));
  card.appendChild(el("h1", "layout-title", opts.pres.title));
  if (opts.pres.body) card.appendChild(el("div", "layout-excerpt", opts.pres.body));
  const btns = el("div", "jj-card-btns");
  const follow = el("button", "jj-follow", t("layout.follow"));
  follow.type = "button";
  const msg = el("button", "app-chip", t("layout.message"));
  msg.type = "button";
  btns.append(follow, msg);
  card.appendChild(btns);
  page.appendChild(card);
  const related = relatedBlock(opts, t("layout.articles"), "up-jj-more");
  if (related) page.appendChild(related);
  bindPersonActions(opts, follow, msg);
  app.appendChild(page);
}

function cellValue(row: FlatRow, names: string[]): string {
  for (const [path, raw] of Object.entries(row.cells)) {
    const col = (path.includes(".") ? path.slice(path.lastIndexOf(".") + 1) : path)
      .replace(/[^a-z0-9\u4e00-\u9fff]/gi, "")
      .toLowerCase();
    if (!names.some((n) => col === n || col.endsWith(n))) continue;
    if (raw == null) continue;
    const text = typeof raw === "string" ? raw.trim() : String(raw).trim();
    if (text) return text;
  }
  return "";
}

function sexMark(sex: string): string {
  if (sex === t("layout.me.sexFemale")) return "♀";
  if (sex === t("layout.me.sexMale")) return "♂";
  return "";
}

type ProfileRel = {
  remark?: string;
  tags?: string;
  blocked?: boolean;
  hideTheirFeed?: boolean;
  hideMine?: boolean;
};

const REL_KEY = "a2api.profile.rel";

function relStore(): Record<string, ProfileRel> {
  try {
    return JSON.parse(localStorage.getItem(REL_KEY) || "{}") as Record<
      string,
      ProfileRel
    >;
  } catch {
    return {};
  }
}

function relKey(target: string | number): string {
  return `${visitorId() ?? "anon"}:${target}`;
}

function readRel(target: string | number): ProfileRel {
  return relStore()[relKey(target)] || {};
}

function writeRel(target: string | number, patch: ProfileRel) {
  const all = relStore();
  all[relKey(target)] = { ...readRel(target), ...patch };
  localStorage.setItem(REL_KEY, JSON.stringify(all));
}

function profileNote(text: string) {
  document.getElementById("layout-toast")?.remove();
  const toast = el("div", "layout-toast", text);
  toast.id = "layout-toast";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1600);
}

function askLine(
  title: string,
  placeholder: string,
  initial = "",
): Promise<string | null> {
  return new Promise((resolve) => {
    const mask = el("div", "layout-ask-mask");
    const box = el("div", "layout-ask");
    box.appendChild(el("div", "layout-ask-title", title));
    const input = document.createElement("input");
    input.className = "layout-ask-input";
    input.placeholder = placeholder;
    input.value = initial;
    const row = el("div", "layout-ask-actions");
    const cancel = el("button", "app-chip", t("common.cancel"));
    cancel.type = "button";
    const ok = el("button", "layout-btn layout-btn-primary", t("common.save"));
    ok.type = "button";
    const finish = (value: string | null) => {
      mask.remove();
      resolve(value);
    };
    cancel.onclick = () => finish(null);
    ok.onclick = () => finish(input.value.trim());
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        finish(input.value.trim());
      }
      if (ev.key === "Escape") finish(null);
    });
    row.append(cancel, ok);
    box.append(input, row);
    mask.appendChild(box);
    mask.addEventListener("click", (ev) => {
      if (ev.target === mask) finish(null);
    });
    document.body.appendChild(mask);
    input.focus();
    input.select();
  });
}

function actionCell(
  label: string,
  value: string,
  onClick: () => void,
): HTMLButtonElement {
  const row = el("button", "up-wx-cell") as HTMLButtonElement;
  row.type = "button";
  row.append(
    el("div", "up-wx-cell-k", label),
    el("div", "up-wx-cell-v", value || t("layout.me.empty")),
    el("div", "up-wx-cell-go", "›"),
  );
  row.onclick = onClick;
  return row;
}

function toggleCell(
  label: string,
  on: boolean,
  change: (next: boolean) => void,
): HTMLElement {
  const row = el("label", "me-toggle up-wx-toggle");
  row.appendChild(el("span", "me-lab", label));
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = on;
  input.onchange = () => change(input.checked);
  row.appendChild(input);
  return row;
}

function renderPersonProfile(app: HTMLElement, opts: UserProfileOpts) {
  const target = opts.recordId ?? opts.pres.id ?? opts.pres.authorId;
  const page = el("div", "up-chat-page up-wx-contact up-wx-profile");
  page.appendChild(el("div", "layout-kicker", t("layout.page.profile")));
  const ident = el("div", "up-wx-ident");
  ident.appendChild(thumb(opts.pres.coverUrl, opts.apijsonBase, "up-wx-av-lg", ""));
  const who = el("div");
  const nameRow = el("div", "up-wx-name-row");
  nameRow.appendChild(el("h1", "layout-title", opts.pres.title));
  const mark = sexMark(opts.pres.sex);
  if (mark) nameRow.appendChild(el("span", "up-wx-sex", mark));
  who.appendChild(nameRow);
  if (opts.pres.sex) who.appendChild(el("div", "layout-meta", opts.pres.sex));
  ident.appendChild(who);
  page.appendChild(ident);

  const sign =
    opts.pres.body ||
    cellValue(opts.row, ["tag", "sign", "signature", "motto", "bio", "intro"]);
  const phone = opts.pres.phone || cellValue(opts.row, ["phone", "mobile", "tel"]);
  const info = el("div", "up-wx-cells");
  const addInfo = (label: string, value: string) => {
    if (!value) return;
    const row = el("div", "up-wx-cell");
    row.append(el("div", "up-wx-cell-k", label), el("div", "up-wx-cell-v", value));
    info.appendChild(row);
  };
  addInfo(t("layout.users.signature"), sign);
  addInfo(t("layout.users.phone"), phone);
  addInfo(t("layout.me.age"), opts.pres.age);
  if (info.childElementCount) page.appendChild(info);

  const rel = target != null ? readRel(target) : {};
  const relBox = el("div", "up-wx-cells");
  const remarkCell = actionCell(
    t("layout.users.remark"),
    rel.remark || "",
    () => {
      if (target == null) return;
      void askLine(
        t("layout.users.remark"),
        t("layout.users.addRemark"),
        readRel(target).remark || "",
      ).then((next) => {
        if (next == null) return;
        writeRel(target, { remark: next });
        remarkCell.querySelector(".up-wx-cell-v")!.textContent =
          next || t("layout.me.empty");
      });
    },
  );
  const tagsCell = actionCell(
    t("layout.users.tags"),
    rel.tags || "",
    () => {
      if (target == null) return;
      void askLine(
        t("layout.users.tags"),
        t("layout.users.addTags"),
        readRel(target).tags || "",
      ).then((next) => {
        if (next == null) return;
        writeRel(target, { tags: next });
        tagsCell.querySelector(".up-wx-cell-v")!.textContent =
          next || t("layout.me.empty");
      });
    },
  );
  relBox.append(remarkCell, tagsCell);
  page.appendChild(relBox);

  const feedHost = el("div", "up-wx-moments");
  feedHost.appendChild(el("h3", "up-h", t("layout.users.moments")));
  page.appendChild(feedHost);
  void paintAuthorFeed(feedHost, opts, target);

  const more = el("div", "up-wx-cells");
  const share = el("button", "up-wx-cell");
  share.type = "button";
  share.append(
    el("div", "up-wx-cell-k", t("layout.share")),
    el("div", "up-wx-cell-v", ""),
    el("div", "up-wx-cell-go", "›"),
  );
  share.onclick = () => {
    void navigator.clipboard?.writeText(location.href).catch(() => undefined);
    if (target != null) {
      void opts.handlers.onActionSlot?.("share", {
        record: opts.row.cells,
        visitorId: visitorId(),
        authorId: target,
      });
    }
    profileNote(t("layout.shared"));
  };
  more.appendChild(share);
  more.appendChild(
    toggleCell(t("layout.users.hideTheirFeed"), !!rel.hideTheirFeed, (v) => {
      if (target == null) return;
      writeRel(target, { hideTheirFeed: v });
    }),
  );
  more.appendChild(
    toggleCell(t("layout.users.hideMine"), !!rel.hideMine, (v) => {
      if (target == null) return;
      writeRel(target, { hideMine: v });
    }),
  );
  const block = el("button", "up-wx-cell up-wx-cell-danger");
  block.type = "button";
  const setBlockLabel = () => {
    const now = target != null ? readRel(target).blocked : rel.blocked;
    block.replaceChildren(
      el("div", "up-wx-cell-k", now ? t("layout.users.unblock") : t("layout.users.block")),
      el("div", "up-wx-cell-v", ""),
      el("div", "up-wx-cell-go", "›"),
    );
  };
  setBlockLabel();
  block.onclick = () => {
    if (target == null) return;
    const next = !readRel(target).blocked;
    writeRel(target, { blocked: next });
    setBlockLabel();
    profileNote(next ? t("layout.users.blocked") : t("layout.users.unblocked"));
  };
  more.appendChild(block);
  page.appendChild(more);

  const actions = el("div", "up-wx-actions");
  const follow = el("button", "layout-btn", t("layout.follow"));
  follow.type = "button";
  const msg = el("button", "wx-send", t("layout.message"));
  msg.type = "button";
  actions.append(follow, msg);
  page.appendChild(actions);
  bindPersonActions(opts, follow, msg);
  app.appendChild(page);
}

async function paintAuthorFeed(
  host: HTMLElement,
  opts: UserProfileOpts,
  authorId: string | number | null,
) {
  const table = inferItemTableForApp("social", opts.comments);
  const authorField = table
    ? inferAuthorIdField(table, opts.comments)
    : null;
  const openFeed = () => {
    if (authorId == null || !table || !authorField) {
      profileNote(t("layout.users.momentsEmpty"));
      return;
    }
    opts.handlers.onOpenFkList?.({
      table,
      ids: [authorId],
      field: authorField,
    });
  };
  const mount = (urls: string[]) => {
    host.replaceChildren();
    const hit = el("button", "up-wx-moments-hit");
    hit.type = "button";
    hit.onclick = openFeed;
    const head = el("div", "up-wx-moments-head");
    head.append(
      el("h3", "up-h", t("layout.users.moments")),
      el("span", "up-wx-cell-go", "›"),
    );
    hit.appendChild(head);
    if (!urls.length) {
      hit.appendChild(el("div", "layout-meta", t("layout.users.momentsEmpty")));
    } else {
      const row = el("div", "up-wx-moments-row");
      for (const url of urls.slice(0, 3)) {
        row.appendChild(thumb(url, opts.apijsonBase, "up-wx-moments-pic", ""));
      }
      hit.appendChild(row);
    }
    host.appendChild(hit);
  };

  if (authorId == null || !opts.apijsonBase || !table || !authorField) {
    mount([]);
    return;
  }
  try {
    const rows = await fetchAuthorFeed({
      base: opts.apijsonBase,
      table,
      authorField,
      authorId,
      dateField: inferDateOrderField(table, opts.comments),
      count: 8,
    });
    const urls: string[] = [];
    for (const row of rows) {
      for (const url of collectRowImageUrls(
        row.cells,
        table,
        Object.keys(row.cells),
        opts.comments,
      )) {
        if (urls.includes(url)) continue;
        urls.push(url);
        if (urls.length >= 3) break;
      }
      if (urls.length >= 3) break;
    }
    mount(urls);
  } catch {
    mount([]);
  }
}

function renderCampHost(app: HTMLElement, opts: UserProfileOpts) {
  const page = el("div", "up-camp-page");
  page.appendChild(thumb(opts.pres.coverUrl, opts.apijsonBase, "up-camp-av-lg", ""));
  page.appendChild(el("div", "layout-kicker", t("layout.users.hosts")));
  page.appendChild(el("h1", "camp-h1", opts.pres.title));
  if (opts.pres.body) page.appendChild(el("div", "camp-copy", opts.pres.body));
  const related = relatedBlock(opts, t("layout.campaign"), "up-camp-more");
  if (related) page.appendChild(related);
  app.appendChild(page);
}

function renderDataProfile(app: HTMLElement, opts: UserProfileOpts) {
  const page = el("div", "up-data-page");
  page.appendChild(thumb(opts.pres.coverUrl, opts.apijsonBase, "up-data-av-lg", ""));
  page.appendChild(el("h1", "layout-title", opts.pres.title));
  page.appendChild(el("div", "layout-meta", opts.pres.subtitle));
  if (opts.pres.body) page.appendChild(el("div", "up-bio", opts.pres.body));
  app.appendChild(page);
}
