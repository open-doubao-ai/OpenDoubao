/**
 * Per-app user list / profile (YouTube channel, 酷狗艺人, 微信通讯录, 掘金作者 …).
 * Field values come from RowPresentation — no Demo table/column literals.
 */

import { t } from "./i18n/index.js";
import { visitorId } from "./layout-social.js";
import type { LayoutDetailHandlers } from "./layout-views.js";
import {
  formatCount,
  formatPrice,
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
};

export type UserProfileOpts = {
  app: LayoutApp;
  pres: RowPresentation;
  row: FlatRow;
  related: Array<{ pres: RowPresentation; id: string | number }>;
  apijsonBase: string;
  handlers: LayoutDetailHandlers;
  primaryTable?: string | null;
  recordId?: string | number | null;
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
    case "news":
    case "info":
    case "blog":
    case "article":
      return t("layout.users.authors");
    case "social":
      return t("layout.users.contacts");
    case "chat":
      return t("layout.users.addressBook");
    case "campaign":
      return t("layout.users.hosts");
    default:
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
  if ((app === "article" || app === "blog") && pres.playCount != null) {
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
  if (app === "news" || app === "info") return renderNewsAuthors(opts);
  if (app === "blog" || app === "article") return renderJjAuthors(opts);
  if (app === "social") return renderWxContacts(opts);
  if (app === "chat") return renderChatContacts(opts);
  if (app === "campaign") return renderCampHosts(opts);
  return renderDataDirectory(opts);
}

function renderYtChannels(opts: UserListOpts): HTMLElement {
  const grid = el("div", "up-yt-grid");
  for (const row of opts.rows) {
    const pres = rowPres(opts, row);
    const card = el("button", "up-yt-card");
    card.type = "button";
    card.onclick = () => opts.onOpenRow(row.key);
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
    card.onclick = () => opts.onOpenRow(row.key);
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
    card.onclick = () => opts.onOpenRow(row.key);
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
    card.onclick = () => opts.onOpenRow(row.key);
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
    card.onclick = () => opts.onOpenRow(row.key);
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
    card.onclick = () => opts.onOpenRow(row.key);
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
    card.onclick = () => opts.onOpenRow(row.key);
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
    card.onclick = () => opts.onOpenRow(row.key);
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
    card.onclick = () => opts.onOpenRow(row.key);
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
    case "news":
    case "info":
      renderNewsAuthor(app, opts);
      break;
    case "blog":
    case "article":
      renderJjAuthor(app, opts);
      break;
    case "social":
      renderWxProfile(app, opts);
      break;
    case "chat":
      renderChatProfile(app, opts);
      break;
    case "campaign":
      renderCampHost(app, opts);
      break;
    default:
      renderDataProfile(app, opts);
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

function renderWxProfile(app: HTMLElement, opts: UserProfileOpts) {
  const page = el("div", "up-wx-page");
  page.appendChild(thumb(opts.pres.coverUrl, opts.apijsonBase, "up-wx-cover", ""));
  const ident = el("div", "up-wx-ident");
  ident.appendChild(thumb(opts.pres.coverUrl, opts.apijsonBase, "up-wx-av-lg", ""));
  const who = el("div");
  who.appendChild(el("h1", "layout-title", opts.pres.title));
  who.appendChild(el("div", "layout-meta", opts.pres.subtitle || opts.pres.date));
  ident.appendChild(who);
  page.appendChild(ident);
  if (opts.pres.body) page.appendChild(el("div", "up-wx-sign", opts.pres.body));
  const actions = el("div", "up-wx-actions");
  const follow = el("button", "layout-btn", t("layout.follow"));
  follow.type = "button";
  const msg = el("button", "layout-btn layout-btn-primary", t("layout.message"));
  msg.type = "button";
  actions.append(follow, msg);
  page.appendChild(actions);
  const related = relatedBlock(opts, t("layout.page.feed"), "up-wx-moments");
  if (related) page.appendChild(related);
  bindPersonActions(opts, follow, msg);
  app.appendChild(page);
}

function renderChatProfile(app: HTMLElement, opts: UserProfileOpts) {
  const page = el("div", "up-chat-page");
  page.appendChild(thumb(opts.pres.coverUrl, opts.apijsonBase, "up-chat-av-xl", ""));
  page.appendChild(el("h1", "layout-title", opts.pres.title));
  page.appendChild(el("div", "layout-meta", opts.pres.subtitle || t("layout.users.addressBook")));
  if (opts.pres.body) page.appendChild(el("div", "up-bio", opts.pres.body));
  const msg = el("button", "wx-send", t("layout.message"));
  msg.type = "button";
  page.appendChild(msg);
  bindPersonActions(opts, undefined, msg);
  app.appendChild(page);
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
