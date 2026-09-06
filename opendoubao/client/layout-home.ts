/**
 * Content-home chrome: category nav (PC left+top, mobile top ≤2 levels)
 * and an auto-playing banner. The dedicated 分类 tab/page stays separate.
 */

import { t } from "./i18n/index.js";
import {
  categoryRecordId,
  inferCategoryIdField,
  inferNamedField,
  loadCategoryRows,
  type CategoryFlatRow,
} from "./layout-category.js";
import {
  mediaSrc,
  pickRowPresentation,
  type LayoutApp,
  type LayoutPage,
} from "./page-layout.js";
import type { SchemaComments } from "./schema-types.js";
import type { ColumnMeta } from "./field-meta.js";
import { newConditionId, type ColumnFilter } from "./table-query.js";
import { attachListRow } from "./layout-list-select.js";

type FlatRow = { key: string; cells: Record<string, unknown> };

export type HomeChromeOpts = {
  app: LayoutApp;
  rows: FlatRow[];
  columns: string[];
  primaryTable: string | null;
  comments?: SchemaComments | null;
  columnMetas?: Record<string, ColumnMeta> | null;
  apijsonBase: string;
  recordId: (row: FlatRow) => string | number | null;
  filters?: ColumnFilter[];
  onOpenRow: (key: string) => void;
  selectEnabled?: boolean;
  onReplaceFilters?: (filters: ColumnFilter[]) => void;
  onOpenCategory?: (id: string | number) => void;
  onComments?: (comments: SchemaComments) => void;
};

type CatItem = {
  id: string | number;
  name: string;
  coverUrl: string | null;
  parentId: string | number | null;
};

const PARENT_TOKENS = [
  "parentid",
  "parent",
  "pid",
  "parentcategory",
  "父级",
  "上级",
  "父分类",
];

const BANNER_MS = 4500;

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

function sameId(a: string | number | null | undefined, b: string | number | null | undefined) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

function asId(v: unknown): string | number | null {
  if (typeof v === "number" && Number.isFinite(v) && v !== 0) return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s || s === "0") return null;
    return s;
  }
  return null;
}

const PARENT_KEYS = ["parentId", "parent_id", "parentid", "pid"];

function inferParentField(
  table: string | null,
  comments: SchemaComments | null | undefined,
  columns: string[],
): string | null {
  const shorts = columns.map((col) =>
    col.includes(".") ? col.slice(col.indexOf(".") + 1) : col,
  );
  const exact = shorts.find((s) =>
    PARENT_KEYS.includes(s.replace(/[^a-zA-Z0-9]/g, "")),
  );
  if (exact) return exact;
  if (!table) return null;
  return inferNamedField(table, comments, PARENT_TOKENS, columns);
}

function readParentId(
  row: CategoryFlatRow,
  table: string | null,
  parentField: string | null,
): string | number | null {
  const keys: string[] = [];
  if (table && parentField) keys.push(`${table}.${parentField}`, parentField);
  if (parentField) keys.push(parentField);
  if (table) {
    for (const k of PARENT_KEYS) keys.push(`${table}.${k}`, k);
  } else {
    keys.push(...PARENT_KEYS);
  }
  for (const key of keys) {
    const id = asId(row.cells[key]);
    if (id != null && String(id) !== String(row.key)) return id;
  }
  return null;
}

function packCats(
  rows: CategoryFlatRow[],
  table: string | null,
  columns: string[],
  comments: SchemaComments | null | undefined,
): CatItem[] {
  const parentField = inferParentField(table, comments, columns);
  return rows.map((row) => {
    const pres = pickRowPresentation(row.cells, {
      primaryTable: table,
      columns,
      comments,
      recordId: categoryRecordId(row, table),
    });
    return {
      id: categoryRecordId(row, table) ?? row.key,
      name: pres.title || `#${row.key}`,
      coverUrl: pres.coverUrl,
      parentId: readParentId(row, table, parentField),
    };
  });
}

function buildTree(items: CatItem[]): {
  roots: CatItem[];
  childrenOf: Map<string, CatItem[]>;
} {
  const ids = new Set(items.map((i) => String(i.id)));
  const childrenOf = new Map<string, CatItem[]>();
  const childIds = new Set<string>();
  for (const item of items) {
    const p =
      item.parentId != null &&
      ids.has(String(item.parentId)) &&
      !sameId(item.parentId, item.id)
        ? String(item.parentId)
        : null;
    if (!p) continue;
    const list = childrenOf.get(p) ?? [];
    list.push(item);
    childrenOf.set(p, list);
    childIds.add(String(item.id));
  }
  const roots = items.filter((i) => !childIds.has(String(i.id)));
  return { roots, childrenOf };
}

function selectedFromFilters(
  filters: ColumnFilter[] | undefined,
  table: string | null,
  field: string | null,
): string | null {
  if (!table || !field || !filters?.length) return null;
  const path = `${table}.${field}`;
  const hit = filters.find(
    (f) => f.path === path || f.path === field || f.path.endsWith(`.${field}`),
  );
  const cond = hit?.conditions.find(
    (c) => (c.op === "eq" || c.op === "in") && c.value.trim(),
  );
  if (!cond) return null;
  return cond.value.split(",")[0]?.trim() || null;
}

function idsForClick(item: CatItem, childrenOf: Map<string, CatItem[]>): Array<string | number> {
  const kids = childrenOf.get(String(item.id)) ?? [];
  return kids.length ? [item.id, ...kids.map((k) => k.id)] : [item.id];
}

function thumb(url: string | null, base: string, className: string): HTMLElement {
  const box = el("div", className);
  if (url) {
    const img = el("img");
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

function bannerPerPage(): number {
  return window.matchMedia("(orientation: landscape)").matches ? 3 : 1;
}

function mountBanner(opts: HomeChromeOpts): HTMLElement | null {
  const packed = opts.rows
    .map((row) => ({
      row,
      pres: pickRowPresentation(row.cells, {
        primaryTable: opts.primaryTable,
        columns: opts.columns,
        comments: opts.comments,
        recordId: opts.recordId(row),
      }),
    }))
    .filter((x) => x.pres.coverUrl);
  const slides = packed.slice(0, 9);
  if (!slides.length) return null;

  const root = el("div", "home-banner");
  root.setAttribute("aria-label", t("layout.home.banner"));
  const view = el("div", "home-banner-view");
  const track = el("div", "home-banner-track");
  const dots = el("div", "home-banner-dots");
  let index = 0;
  let timer = 0;
  let startX = 0;

  const metrics = () => {
    const per = bannerPerPage();
    const w = view.clientWidth || root.clientWidth;
    const gap = per > 1 ? 10 : 0;
    const slideW = Math.max(0, (w - gap * (per - 1)) / per);
    const pages = Math.max(1, Math.ceil(slides.length / per));
    return { per, gap, slideW, pages };
  };

  const paintDots = (pages: number) => {
    dots.replaceChildren();
    for (let i = 0; i < pages; i++) {
      const dot = el("button", "home-banner-dot" + (i === index ? " is-on" : ""));
      dot.type = "button";
      dot.setAttribute("aria-label", String(i + 1));
      dot.onclick = (ev) => {
        ev.stopPropagation();
        go(i);
        play();
      };
      dots.appendChild(dot);
    }
  };

  const applyLayout = () => {
    const m = metrics();
    root.classList.toggle("is-landscape", m.per === 3);
    track.style.gap = m.gap ? `${m.gap}px` : "0px";
    for (const node of track.children) {
      if (!(node instanceof HTMLElement)) continue;
      node.style.flex = `0 0 ${m.slideW}px`;
      node.style.width = `${m.slideW}px`;
    }
    paintDots(m.pages);
    go(index);
  };

  const go = (n: number) => {
    const m = metrics();
    index = ((n % m.pages) + m.pages) % m.pages;
    const offset = index * m.per * (m.slideW + m.gap);
    track.style.transform = `translateX(-${offset}px)`;
    [...dots.children].forEach((d, i) => {
      d.classList.toggle("is-on", i === index);
    });
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = 0;
  };
  const play = () => {
    stop();
    const { pages } = metrics();
    if (pages < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer = window.setInterval(() => go(index + 1), BANNER_MS);
  };

  for (const item of slides) {
    const btn = el("button", "home-banner-slide");
    btn.type = "button";
    attachListRow(btn, {
      key: item.row.key,
      id: opts.recordId(item.row),
      label: item.pres.title || `#${item.row.key}`,
      cells: item.row.cells,
      onOpen: () => opts.onOpenRow(item.row.key),
      enabled: opts.selectEnabled !== false && opts.app !== "data",
    });
    btn.appendChild(thumb(item.pres.coverUrl, opts.apijsonBase, "home-banner-img"));
    const cap = el("div", "home-banner-cap");
    cap.appendChild(el("div", "home-banner-title", item.pres.title || `#${item.row.key}`));
    const meta = [item.pres.author, item.pres.source, item.pres.date]
      .filter(Boolean)
      .join(" · ");
    if (meta) cap.appendChild(el("div", "home-banner-meta", meta));
    btn.appendChild(cap);
    track.appendChild(btn);
  }

  view.appendChild(track);
  root.append(view, dots);

  const orient = window.matchMedia("(orientation: landscape)");
  const onOrient = () => {
    index = 0;
    applyLayout();
    play();
  };
  orient.addEventListener("change", onOrient);
  const ro = new ResizeObserver(() => applyLayout());
  ro.observe(view);

  view.addEventListener("pointerdown", (ev) => {
    startX = ev.clientX;
  });
  view.addEventListener("pointerup", (ev) => {
    const dx = ev.clientX - startX;
    if (Math.abs(dx) < 40) return;
    go(index + (dx < 0 ? 1 : -1));
    play();
  });
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", play);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", play);
  requestAnimationFrame(() => {
    applyLayout();
    play();
  });
  const dead = new MutationObserver(() => {
    if (document.body.contains(root)) return;
    stop();
    orient.removeEventListener("change", onOrient);
    ro.disconnect();
    dead.disconnect();
  });
  dead.observe(document.body, { childList: true, subtree: true });
  return root;
}

function applyCategoryFilter(
  opts: HomeChromeOpts,
  ids: Array<string | number> | null,
) {
  const table = opts.primaryTable;
  const field = table
    ? inferCategoryIdField(table, opts.comments, opts.columns)
    : null;
  if (!table || !field) {
    if (ids?.length === 1) opts.onOpenCategory?.(ids[0]!);
    return;
  }
  const path = `${table}.${field}`;
  const rest = (opts.filters ?? []).filter(
    (f) => f.path !== path && f.path !== field && !f.path.endsWith(`.${field}`),
  );
  if (!ids?.length) {
    opts.onReplaceFilters?.(rest);
    return;
  }
  if (!opts.onReplaceFilters) {
    opts.onOpenCategory?.(ids[0]!);
    return;
  }
  opts.onReplaceFilters([
    ...rest,
    {
      path,
      conditions: [
        {
          id: newConditionId(),
          op: ids.length === 1 ? "eq" : "in",
          value: ids.map(String).join(","),
          join: "and",
          not: false,
        },
      ],
    },
  ]);
}

export function mountHomeChrome(opts: HomeChromeOpts): {
  root: HTMLElement;
  feed: HTMLElement;
} {
  const root = el("div", "home-shell");
  const left = el("nav", "home-cats-left");
  left.setAttribute("aria-label", t("layout.home.categories"));
  left.hidden = true;
  const main = el("div", "home-main");
  const top = el("div", "home-cats-top");
  top.setAttribute("aria-label", t("layout.home.categories"));
  const row1 = el("div", "home-cats-row home-cats-l1");
  const row2 = el("div", "home-cats-row home-cats-l2");
  row2.hidden = true;
  top.append(row1, row2);
  const banner = mountBanner(opts);
  const feed = el("div", "home-feed");
  main.appendChild(top);
  if (banner) main.appendChild(banner);
  main.appendChild(feed);
  root.append(left, main);

  const field = opts.primaryTable
    ? inferCategoryIdField(opts.primaryTable, opts.comments, opts.columns)
    : null;
  const selected = selectedFromFilters(opts.filters, opts.primaryTable, field);

  row1.appendChild(el("div", "layout-meta", t("layout.explore.loading")));

  void loadCategoryRows({
    app: opts.app,
    apijsonBase: opts.apijsonBase,
    comments: opts.comments ?? null,
    primaryTable: opts.primaryTable,
  }).then((result) => {
    if (!document.body.contains(root)) return;
    if (result.comments) opts.onComments?.(result.comments);
    const items = packCats(
      result.rows,
      result.table,
      result.columns,
      result.comments ?? opts.comments,
    );
    paintCats(root, left, row1, row2, items, selected, opts);
  });

  return { root, feed };
}

function paintCats(
  shell: HTMLElement,
  left: HTMLElement,
  row1: HTMLElement,
  row2: HTMLElement,
  items: CatItem[],
  selected: string | null,
  opts: HomeChromeOpts,
) {
  left.replaceChildren();
  row1.replaceChildren();
  row2.replaceChildren();
  if (!items.length) {
    left.hidden = true;
    shell.classList.remove("has-cats");
    row1.parentElement?.classList.add("is-empty");
    return;
  }
  left.hidden = false;
  shell.classList.add("has-cats");
  row1.parentElement?.classList.remove("is-empty");
  const { roots, childrenOf } = buildTree(items);
  const selectedItem = items.find((i) => sameId(i.id, selected));
  const parentOfSelected =
    selectedItem?.parentId != null &&
    items.some((i) => sameId(i.id, selectedItem.parentId))
      ? selectedItem.parentId
      : null;
  const l1Active = parentOfSelected ?? selected;
  const l2Items =
    l1Active != null ? (childrenOf.get(String(l1Active)) ?? []) : [];

  const click = (item: CatItem | null) => {
    applyCategoryFilter(opts, item ? idsForClick(item, childrenOf) : null);
  };

  const allChip = catChip(t("layout.home.all"), selected == null, () => click(null));
  row1.appendChild(allChip);
  left.appendChild(catSide(t("layout.home.all"), null, selected == null, () => click(null)));

  for (const item of roots) {
    const on = sameId(item.id, l1Active);
    row1.appendChild(catChip(item.name, on, () => click(item)));
    left.appendChild(
      catSide(item.name, item.coverUrl, on, () => click(item), opts.apijsonBase),
    );
  }

  const top = row1.parentElement;
  if (l2Items.length && selected != null) {
    row2.hidden = false;
    top?.classList.add("has-l2");
    for (const item of l2Items) {
      row2.appendChild(
        catChip(item.name, sameId(item.id, selected), () => click(item)),
      );
    }
  } else {
    row2.hidden = true;
    top?.classList.remove("has-l2");
  }
}

function catChip(label: string, active: boolean, onClick: () => void): HTMLButtonElement {
  const b = el("button", "home-cat" + (active ? " is-active" : ""), label);
  b.type = "button";
  b.onclick = onClick;
  return b;
}

function catSide(
  label: string,
  cover: string | null,
  active: boolean,
  onClick: () => void,
  base?: string,
): HTMLButtonElement {
  const b = el("button", "home-cat-side" + (active ? " is-active" : ""));
  b.type = "button";
  b.onclick = onClick;
  if (base) b.appendChild(thumb(cover, base, "home-cat-ico"));
  else b.appendChild(el("span", "home-cat-ico is-empty"));
  b.appendChild(el("span", "home-cat-side-name", label));
  return b;
}

/** Consumer content homes (not data admin / chat / social feed). */
export function shouldShowHomeChrome(
  app: LayoutApp,
  page?: LayoutPage,
): boolean {
  if (page !== "home") return false;
  return app !== "data" && app !== "chat" && app !== "social";
}
