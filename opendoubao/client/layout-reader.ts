/**
 * Book / comic reader: portrait = one leaf, landscape = left+right spread.
 * Novels paginate text; comics use pictureList pages.
 */

import { t } from "./i18n/index.js";
import { collectRowPageImages } from "./smart-image-fields.js";
import {
  formatCount,
  mediaSrc,
  type LayoutApp,
  type LayoutKind,
  type LayoutSpec,
  type RowPresentation,
} from "./page-layout.js";
import type { SchemaComments } from "./schema-types.js";
import type { ColumnMeta } from "./field-meta.js";

type FlatRow = { key: string; cells: Record<string, unknown> };

type ReaderLeaf =
  | { kind: "text"; text: string }
  | { kind: "image"; url: string };

export type BookReaderOpts = {
  kind?: LayoutKind;
  spec?: LayoutSpec;
  apijsonBase: string;
  comments?: SchemaComments | null;
  columnMetas?: Record<string, ColumnMeta> | null;
  columns?: string[];
  primaryTable?: string | null;
  recordId?: string | number | null;
  row?: FlatRow;
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

function showMap(
  metas?: Record<string, ColumnMeta> | null,
): Record<string, ColumnMeta["show"] | undefined> {
  const out: Record<string, ColumnMeta["show"] | undefined> = {};
  if (!metas) return out;
  for (const [p, m] of Object.entries(metas)) out[p] = m.show;
  return out;
}

function looksLikeHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\s+\n/g, "\n").trim();
}

function paras(text: string): string[] {
  return text
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function readerApp(opts: BookReaderOpts): LayoutApp {
  return opts.spec?.app ?? (opts.kind as LayoutApp) ?? "books";
}

function charsPerLeaf(landscape: boolean): number {
  return landscape ? 720 : 1400;
}

function paginateText(raw: string, perLeaf: number): ReaderLeaf[] {
  const trimmed = (raw || "").trim();
  if (!trimmed) return [{ kind: "text", text: "" }];
  const plain = looksLikeHtml(trimmed) ? stripHtml(trimmed) : trimmed;
  return paginatePlain(plain || trimmed, perLeaf).map((text) => ({
    kind: "text",
    text,
  }));
}

function paginatePlain(text: string, perLeaf: number): string[] {
  const parts = paras(text);
  if (!parts.length) return [text];
  const pages: string[] = [];
  let buf = "";
  const push = () => {
    if (buf) pages.push(buf);
    buf = "";
  };
  for (const p of parts) {
    if (!buf) {
      if (p.length <= perLeaf) {
        buf = p;
        continue;
      }
      for (let i = 0; i < p.length; i += perLeaf) {
        pages.push(p.slice(i, i + perLeaf));
      }
      continue;
    }
    if (buf.length + 2 + p.length <= perLeaf) {
      buf = `${buf}\n\n${p}`;
      continue;
    }
    push();
    if (p.length <= perLeaf) buf = p;
    else {
      for (let i = 0; i < p.length; i += perLeaf) {
        pages.push(p.slice(i, i + perLeaf));
      }
    }
  }
  push();
  return pages.length ? pages : [text];
}

function buildLeaves(
  app: LayoutApp,
  pres: RowPresentation,
  opts: BookReaderOpts,
  landscape: boolean,
): ReaderLeaf[] {
  const cells = opts.row?.cells;
  if (app === "comics" && cells) {
    const urls = collectRowPageImages(
      cells,
      opts.primaryTable ?? null,
      opts.columns ?? Object.keys(cells),
      opts.comments,
      showMap(opts.columnMetas),
    );
    if (urls.length) return urls.map((url) => ({ kind: "image", url }));
  }
  const body = pres.body || pres.headline || "";
  const leaves = paginateText(body, charsPerLeaf(landscape));
  if (
    app === "comics" &&
    pres.coverUrl &&
    leaves.every((l) => l.kind === "text" && !l.text)
  ) {
    return [{ kind: "image", url: pres.coverUrl }];
  }
  return leaves;
}

function paintLeaf(
  host: HTMLElement,
  leaf: ReaderLeaf | undefined,
  pageNo: number,
  apijsonBase: string,
  emptyLabel: string,
) {
  host.replaceChildren();
  host.dataset.page = String(pageNo);
  if (!leaf) {
    host.appendChild(el("div", "book-leaf-empty", emptyLabel));
    return;
  }
  if (leaf.kind === "image") {
    const frame = el("div", "book-leaf-img");
    const img = el("img");
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    img.src = mediaSrc(leaf.url, apijsonBase);
    frame.appendChild(img);
    host.appendChild(frame);
    return;
  }
  const body = el("div", "book-leaf-text");
  for (const p of paras(leaf.text)) {
    body.appendChild(el("p", "", p));
  }
  if (!leaf.text) body.appendChild(el("p", "book-leaf-empty", emptyLabel));
  host.appendChild(body);
}

export type BookReaderMount = {
  page: HTMLElement;
  /** Host for comment list + composer (inside the comments pane). */
  commentHost: HTMLElement;
  commentEntry: HTMLButtonElement;
  commentCountEl: HTMLElement;
  setCommentsOpen: (open: boolean) => void;
};

/**
 * Mount book/comic reader into `app`.
 * Comments are not inline: only a count entry on the reader; click opens the list + dock.
 */
export function renderBookReader(
  app: HTMLElement,
  pres: RowPresentation,
  opts: BookReaderOpts,
): BookReaderMount {
  const layoutApp = readerApp(opts);
  const page = el("div", "book-reader");
  page.dataset.app = layoutApp;

  const head = el("div", "book-reader-head");
  head.appendChild(el("h1", "book-reader-title", pres.title || `#${pres.id ?? ""}`));
  const metaBits = [
    pres.author,
    pres.date,
    pres.playCount != null
      ? `${formatCount(pres.playCount)} ${t("layout.reads")}`
      : "",
  ].filter(Boolean);
  if (metaBits.length) {
    head.appendChild(el("div", "book-reader-meta", metaBits.join(" · ")));
  }
  page.appendChild(head);

  const stage = el("div", "book-stage");
  const spread = el("div", "book-spread");
  const left = el("div", "book-leaf book-leaf-left");
  const right = el("div", "book-leaf book-leaf-right");
  spread.append(left, right);
  stage.appendChild(spread);

  const hitPrev = el("button", "book-hit book-hit-prev");
  hitPrev.type = "button";
  hitPrev.setAttribute("aria-label", t("common.previousPage"));
  const hitNext = el("button", "book-hit book-hit-next");
  hitNext.type = "button";
  hitNext.setAttribute("aria-label", t("common.nextPage"));
  stage.append(hitPrev, hitNext);
  page.appendChild(stage);

  const toolbar = el("div", "book-toolbar");
  const prev = el("button", "layout-btn", t("common.previousPage"));
  prev.type = "button";
  const indicator = el("div", "book-page-indicator");
  const next = el("button", "layout-btn", t("common.nextPage"));
  next.type = "button";
  const commentEntry = el(
    "button",
    "book-comment-entry sp-comment-entry layout-btn",
  );
  commentEntry.type = "button";
  const commentEntryLabel = el(
    "span",
    "sp-comment-entry-label",
    t("layout.comments"),
  );
  const commentCountEl = el("span", "sp-comment-entry-n", "0");
  commentEntry.append(commentEntryLabel, commentCountEl);
  commentEntry.title = t("layout.comments");
  commentEntry.setAttribute("aria-label", t("layout.comments"));
  toolbar.append(prev, indicator, next, commentEntry);
  page.appendChild(toolbar);

  const commentsPane = el("div", "book-comments");
  commentsPane.hidden = true;
  const commentsHead = el("div", "book-comments-head");
  const commentsBack = el(
    "button",
    "layout-btn book-comments-back",
    t("common.back"),
  );
  commentsBack.type = "button";
  commentsHead.append(
    commentsBack,
    el("h2", "book-comments-title", t("layout.comments")),
  );
  commentsPane.appendChild(commentsHead);
  const commentHost = el("div", "book-comments-body");
  commentsPane.appendChild(commentHost);
  page.appendChild(commentsPane);

  const setCommentsOpen = (open: boolean) => {
    page.classList.toggle("is-comments", open);
    commentsPane.hidden = !open;
  };
  commentsBack.onclick = () => setCommentsOpen(false);

  let landscape =
    typeof window !== "undefined" &&
    window.matchMedia("(orientation: landscape)").matches;
  let cursor = 0;
  let leaves = buildLeaves(layoutApp, pres, opts, landscape);

  const step = () => (landscape ? 2 : 1);

  const paint = () => {
    page.classList.toggle("is-landscape", landscape);
    page.classList.toggle("is-portrait", !landscape);
    const total = Math.max(1, leaves.length);
    const leftNo = Math.min(cursor, total - 1) + 1;
    const rightNo = leftNo + 1;
    paintLeaf(
      left,
      leaves[cursor],
      leftNo,
      opts.apijsonBase,
      t("layout.readerEmpty"),
    );
    if (landscape) {
      right.hidden = false;
      paintLeaf(
        right,
        leaves[cursor + 1],
        rightNo,
        opts.apijsonBase,
        cursor + 1 < leaves.length ? "" : t("layout.readerEnd"),
      );
    } else {
      right.hidden = true;
      right.replaceChildren();
    }
    const end = Math.min(cursor + step(), total);
    indicator.textContent = t("layout.readerPageOf", {
      page: landscape && end > leftNo ? `${leftNo}–${end}` : String(leftNo),
      total: String(total),
    });
    const atStart = cursor <= 0;
    const atEnd = cursor + step() >= total;
    prev.disabled = atStart;
    hitPrev.disabled = atStart;
    next.disabled = atEnd;
    hitNext.disabled = atEnd;
  };

  const go = (delta: number) => {
    const nextCursor = cursor + delta * step();
    if (nextCursor < 0 || nextCursor >= leaves.length) return;
    cursor = nextCursor;
    paint();
  };

  prev.onclick = () => go(-1);
  next.onclick = () => go(1);
  hitPrev.onclick = () => go(-1);
  hitNext.onclick = () => go(1);

  const onKey = (ev: KeyboardEvent) => {
    if (ev.key === "ArrowLeft" || ev.key === "PageUp") {
      ev.preventDefault();
      go(-1);
    } else if (ev.key === "ArrowRight" || ev.key === "PageDown" || ev.key === " ") {
      ev.preventDefault();
      go(1);
    }
  };
  page.tabIndex = 0;
  page.addEventListener("keydown", onKey);

  const mql =
    typeof window !== "undefined"
      ? window.matchMedia("(orientation: landscape)")
      : null;
  const onOrient = () => {
    const nextLandscape = Boolean(mql?.matches);
    if (nextLandscape === landscape) return;
    const approxChar = cursor * charsPerLeaf(landscape);
    landscape = nextLandscape;
    leaves = buildLeaves(layoutApp, pres, opts, landscape);
    const per = charsPerLeaf(landscape);
    cursor = Math.min(
      leaves.length - 1,
      Math.max(0, Math.floor(approxChar / per)),
    );
    if (landscape) cursor = cursor - (cursor % 2);
    paint();
  };
  mql?.addEventListener("change", onOrient);

  paint();
  app.appendChild(page);
  queueMicrotask(() => page.focus({ preventScroll: true }));
  return {
    page,
    commentHost,
    commentEntry,
    commentCountEl,
    setCommentsOpen,
  };
}
