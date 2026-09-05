/**
 * Shared toC comment list + sticky composer dock (optional star rating).
 */

import { t } from "./i18n/index.js";
import {
  averageCommentScore,
  flattenComments,
  formatStarText,
  type SocialComment,
} from "./layout-actions.js";
import { mediaSrc } from "./page-layout.js";
import type { SchemaComments } from "./schema-types.js";

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
  apijsonBase: string,
  className: string,
): HTMLElement {
  const box = el("div", className);
  if (url) {
    const img = el("img");
    img.src = mediaSrc(url, apijsonBase);
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

export const FEED_COMMENT_PREVIEW_MAX = 10;

export function renderFeedCommentPreview(opts: {
  host: HTMLElement;
  items: SocialComment[];
  hasMore: boolean;
  onMore: () => void;
  onOpenAuthor?: (id: string | number) => void;
}) {
  opts.host.innerHTML = "";
  if (!opts.items.length && !opts.hasMore) return;
  const box = el("div", "layout-feed-comments");
  const pushLine = (item: SocialComment, reply: boolean) => {
    const row = el("div", "layout-feed-cmt" + (reply ? " is-reply" : ""));
    const name = el(
      "button",
      "layout-feed-cmt-name",
      item.name || t("layout.authorCard"),
    );
    name.type = "button";
    if (item.userId != null) {
      name.onclick = (ev) => {
        ev.stopPropagation();
        opts.onOpenAuthor?.(item.userId!);
      };
    }
    row.appendChild(name);
    if (reply && item.replyToName) {
      row.appendChild(el("span", "cmt-at", `@${item.replyToName}`));
    }
    if (item.content) {
      row.appendChild(el("span", "layout-feed-cmt-text", `：${item.content}`));
    }
    box.appendChild(row);
  };
  let shown = 0;
  for (const item of opts.items) {
    if (shown >= FEED_COMMENT_PREVIEW_MAX) break;
    pushLine(item, false);
    shown += 1;
    for (const child of item.replies ?? []) {
      if (shown >= FEED_COMMENT_PREVIEW_MAX) break;
      pushLine(child, true);
      shown += 1;
    }
  }
  if (opts.hasMore) {
    const more = el("button", "layout-feed-more", t("layout.moreComments"));
    more.type = "button";
    more.onclick = (ev) => {
      ev.stopPropagation();
      opts.onMore();
    };
    box.appendChild(more);
  }
  opts.host.appendChild(box);
}

export function renderCommentItems(
  host: HTMLElement,
  items: SocialComment[],
  apijsonBase: string,
  onOpenAuthor?: (id: string | number) => void,
  onReply?: (item: SocialComment) => void,
  showScore = false,
) {
  host.innerHTML = "";
  if (!items.length) {
    host.appendChild(el("div", "layout-meta", t("layout.commentsEmpty")));
    return;
  }
  const paintOne = (item: SocialComment, reply: boolean) => {
    const row = el("div", "yt-c-item" + (reply ? " is-reply" : ""));
    const av = thumb(item.head, apijsonBase, "yt-avatar");
    av.classList.add("author-link");
    if (item.userId != null) {
      av.style.cursor = "pointer";
      av.onclick = () => onOpenAuthor?.(item.userId!);
    }
    const body = el("div", "yt-c-body");
    const who = el("div", "cmt-who");
    const name = el("button", "yt-c-name", item.name || t("layout.authorCard"));
    name.type = "button";
    if (item.userId != null) {
      name.onclick = () => onOpenAuthor?.(item.userId!);
    }
    who.appendChild(name);
    if (reply && item.replyToName) {
      who.appendChild(el("span", "cmt-at", `@${item.replyToName}`));
    }
    body.appendChild(who);
    if (showScore && !reply && item.score != null && item.score > 0) {
      body.appendChild(el("div", "cmt-item-stars", formatStarText(item.score)));
    }
    if (item.content) body.appendChild(el("div", "yt-c-text", item.content));
    const meta = el("div", "cmt-meta");
    if (item.date) meta.appendChild(el("span", "layout-meta", item.date));
    if (onReply && item.id != null && item.id !== "") {
      const replyBtn = el("button", "cmt-reply", t("layout.reply"));
      replyBtn.type = "button";
      replyBtn.onclick = () => onReply(item);
      meta.appendChild(replyBtn);
    }
    if (meta.childNodes.length) body.appendChild(meta);
    row.append(av, body);
    return row;
  };
  for (const item of items) {
    const block = el("div", "cmt-thread");
    block.appendChild(paintOne(item, false));
    if (item.replies?.length) {
      const kids = el("div", "cmt-replies");
      for (const child of item.replies) kids.appendChild(paintOne(child, true));
      block.appendChild(kids);
    }
    host.appendChild(block);
  }
}

export function paintRatingSummary(
  elNode: HTMLElement | undefined,
  items: SocialComment[],
) {
  if (!elNode) return;
  const avg = averageCommentScore(items);
  if (avg == null) {
    const n = flattenComments(items).length;
    elNode.textContent = n ? t("layout.reviewsCount", { n }) : t("layout.reviews");
    return;
  }
  elNode.textContent = `${formatStarText(avg)} ${avg.toFixed(1)} · ${t(
    "layout.reviewsCount",
    { n: flattenComments(items).length },
  )}`;
}

export type CommentReplyTarget = { id: string | number; name: string };

export type CommentChrome = {
  section: HTMLElement;
  list: HTMLElement;
  dock: HTMLElement;
  input: HTMLTextAreaElement;
  send: HTMLButtonElement;
  getScore: () => number | null;
  setScore: (n: number | null) => void;
  getReplyTarget: () => CommentReplyTarget | null;
  setReplyTarget: (target: CommentReplyTarget | null) => void;
  setPurchaseLocked: (locked: boolean) => void;
  canComment: () => boolean;
  focus: () => void;
  rateable: boolean;
};

/** Stars only for purchase / booking reviews — not because Comment.score exists. */
export function shouldShowCommentRating(
  rateableApp: boolean,
  _comments?: SchemaComments | null,
): boolean {
  return rateableApp;
}

export function mountCommentChrome(opts: {
  host: HTMLElement;
  apijsonBase: string;
  rateable?: boolean;
  insertBefore?: HTMLElement | null;
  title?: string;
  purchaseRequired?: boolean;
  onNeedPurchase?: () => void;
}): CommentChrome {
  const section = el("section", "cmt-section");
  section.appendChild(
    el(
      "h3",
      "cmt-h",
      opts.title ||
        (opts.rateable ? t("layout.reviews") : t("layout.comments")),
    ),
  );
  const list = el("div", "yt-c-list cmt-list");
  section.appendChild(list);

  const dock = el("div", "cmt-dock");
  let score: number | null = null;
  const starBtns: HTMLButtonElement[] = [];
  if (opts.rateable) {
    const stars = el("div", "cmt-stars");
    stars.setAttribute("role", "radiogroup");
    stars.setAttribute("aria-label", t("layout.rateHint"));
    for (let i = 1; i <= 5; i++) {
      const b = el("button", "cmt-star", "☆");
      b.type = "button";
      b.dataset.n = String(i);
      b.title = t("layout.rateStars", { n: i });
      b.setAttribute("aria-label", t("layout.rateStars", { n: i }));
      starBtns.push(b);
      stars.appendChild(b);
    }
    dock.appendChild(stars);
  }
  const paintStars = () => {
    for (const b of starBtns) {
      const n = Number(b.dataset.n);
      const on = score != null && n <= score;
      b.textContent = on ? "★" : "☆";
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-checked", on && n === score ? "true" : "false");
    }
  };
  const setScore = (n: number | null) => {
    score = n != null && n > 0 ? Math.min(5, Math.round(n)) : null;
    paintStars();
  };
  for (const b of starBtns) {
    b.onclick = () => {
      const n = Number(b.dataset.n);
      setScore(score === n ? null : n);
    };
  }

  const replyBar = el("div", "cmt-reply-bar");
  replyBar.hidden = true;
  const replyLabel = el("span", "cmt-reply-text");
  const replyClear = el("button", "cmt-reply-clear", "×");
  replyClear.type = "button";
  replyClear.title = t("layout.cancelReply");
  replyClear.setAttribute("aria-label", t("layout.cancelReply"));
  replyBar.append(replyLabel, replyClear);
  dock.appendChild(replyBar);

  const input = document.createElement("textarea");
  input.className = "cmt-input";
  input.rows = 1;
  const idlePlaceholder = opts.rateable
    ? t("layout.reviewHint")
    : t("layout.commentHint");
  input.placeholder = idlePlaceholder;
  const send = el("button", "cmt-send", t("layout.sendComment"));
  send.type = "button";
  dock.append(input, send);

  let purchaseLocked = Boolean(opts.purchaseRequired);
  let replyTarget: CommentReplyTarget | null = null;
  const paintReply = () => {
    replyBar.hidden = replyTarget == null;
    replyLabel.textContent = replyTarget
      ? t("layout.replyTo", { name: replyTarget.name })
      : "";
    input.placeholder = replyTarget
      ? t("layout.replyHint", { name: replyTarget.name })
      : idlePlaceholder;
  };
  const setReplyTarget = (target: CommentReplyTarget | null) => {
    replyTarget = target && target.id != null && target.id !== "" ? target : null;
    paintReply();
    if (replyTarget && !purchaseLocked) input.focus();
  };
  replyClear.onclick = () => setReplyTarget(null);

  const gate = el("div", "cmt-gate");
  gate.appendChild(el("span", "cmt-gate-text", t("layout.reviewNeedPurchase")));
  if (opts.onNeedPurchase) {
    const buy = el("button", "cmt-gate-buy", t("layout.reviewBuyFirst"));
    buy.type = "button";
    buy.onclick = () => opts.onNeedPurchase?.();
    gate.appendChild(buy);
  }
  dock.appendChild(gate);

  const paintLock = () => {
    dock.classList.toggle("is-locked", purchaseLocked);
    input.disabled = purchaseLocked;
    send.disabled = purchaseLocked;
    for (const b of starBtns) b.disabled = purchaseLocked;
    gate.hidden = !purchaseLocked;
  };
  paintLock();

  const place = (node: HTMLElement) => {
    if (opts.insertBefore) opts.host.insertBefore(node, opts.insertBefore);
    else opts.host.appendChild(node);
  };
  place(section);
  place(dock);
  opts.host.classList.add("has-cmt-dock");

  return {
    section,
    list,
    dock,
    input,
    send,
    getScore: () => score,
    setScore,
    getReplyTarget: () => replyTarget,
    setReplyTarget,
    setPurchaseLocked: (locked) => {
      purchaseLocked = locked;
      paintLock();
    },
    canComment: () => !purchaseLocked,
    focus: () => {
      if (!purchaseLocked) input.focus();
    },
    rateable: Boolean(opts.rateable),
  };
}
