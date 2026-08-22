/**
 * Consumer-app filter sheet (left of scan). Builds facets from comments / types,
 * then writes the same columnFilters the list query already uses.
 */

import { t } from "./i18n/index.js";
import { columnCommentOnly, fieldColName } from "./smart-image-fields.js";
import type { ColumnMeta, FieldType } from "./field-meta.js";
import type { SchemaComments } from "./schema-types.js";
import {
  newConditionId,
  type ColumnFilter,
  type FilterCondition,
} from "./table-query.js";

type FlatRow = { key: string; cells: Record<string, unknown> };

export type FilterSheetOpts = {
  anchor: HTMLElement;
  columns: string[];
  comments?: SchemaComments | null;
  metas?: Record<string, ColumnMeta> | null;
  rows: FlatRow[];
  filters: ColumnFilter[];
  onApply: (filters: ColumnFilter[]) => void;
};

type FacetKind = "enum" | "range";

type Facet = {
  path: string;
  label: string;
  kind: FacetKind;
  options?: string[];
};

const SKIP_TOKENS = [
  "id",
  "userid",
  "cover",
  "head",
  "picture",
  "picturelist",
  "url",
  "videourl",
  "audiourl",
  "content",
  "description",
  "html",
];

const ENUM_TOKENS = [
  "status",
  "state",
  "categoryid",
  "genreid",
  "sex",
  "gender",
  "tag",
  "app",
  "状态",
  "分类",
  "栏目",
  "流派",
  "性别",
];

const RANGE_TOKENS = [
  "price",
  "total",
  "sales",
  "stock",
  "amount",
  "playcount",
  "viewcount",
  "date",
  "价格",
  "销量",
  "库存",
  "金额",
  "播放",
];

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

function scoreTokens(text: string, tokens: string[]): number {
  let n = 0;
  const h = norm(text);
  for (const tok of tokens) {
    const nt = norm(tok);
    if (!nt) continue;
    if (h === nt) n += 8;
    else if (h.includes(nt)) n += 4;
  }
  return n;
}

function fieldLabel(path: string, comments?: SchemaComments | null): string {
  const tip = columnCommentOnly(path, comments);
  if (tip) return tip.split(/[（(]/)[0]!.trim() || fieldColName(path);
  return fieldColName(path);
}

function fieldType(path: string, metas?: Record<string, ColumnMeta> | null): FieldType {
  return metas?.[path]?.type ?? "text";
}

function distinctValues(rows: FlatRow[], path: string, limit = 12): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const v = row.cells[path];
    if (v == null || v === "") continue;
    const s = String(v).trim();
    if (!s) continue;
    seen.add(s);
    if (seen.size > limit) return [];
  }
  return [...seen];
}

function inferFacets(opts: FilterSheetOpts): Facet[] {
  const scored: Array<Facet & { score: number }> = [];
  for (const path of opts.columns) {
    const col = fieldColName(path);
    const note = columnCommentOnly(path, opts.comments);
    const text = `${col} ${note}`;
    if (scoreTokens(text, SKIP_TOKENS) >= 8 && scoreTokens(text, ENUM_TOKENS) < 4) {
      continue;
    }
    if (opts.metas?.[path]?.filterable === false) continue;
    const type = fieldType(path, opts.metas);
    const enumScore = scoreTokens(text, ENUM_TOKENS);
    const rangeScore = scoreTokens(text, RANGE_TOKENS);
    const numeric = type === "number" || type === "percent" || type === "date" || type === "time";
    if (enumScore >= 4) {
      const options = distinctValues(opts.rows, path);
      scored.push({
        path,
        label: fieldLabel(path, opts.comments),
        kind: "enum",
        options: options.length ? options : undefined,
        score: enumScore + 4,
      });
      continue;
    }
    if (rangeScore >= 4 || numeric) {
      scored.push({
        path,
        label: fieldLabel(path, opts.comments),
        kind: "range",
        score: rangeScore + (numeric ? 3 : 0),
      });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: Facet[] = [];
  for (const f of scored) {
    if (seen.has(f.path)) continue;
    seen.add(f.path);
    out.push(f);
    if (out.length >= 6) break;
  }
  return out;
}

function existingFor(filters: ColumnFilter[], path: string): ColumnFilter | undefined {
  return filters.find((f) => f.path === path);
}

export function mountFilterButton(opts: {
  active?: boolean;
  onOpen: (anchor: HTMLButtonElement) => void;
}): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "app-search-filter" + (opts.active ? " is-active" : "");
  btn.title = t("layout.filter.title");
  btn.setAttribute("aria-label", t("layout.filter.title"));
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  btn.onclick = (ev) => {
    ev.stopPropagation();
    opts.onOpen(btn);
  };
  return btn;
}

export function openAppFilterSheet(opts: FilterSheetOpts): void {
  document.getElementById("app-filter-sheet")?.remove();
  const facets = inferFacets(opts);
  const pop = document.createElement("div");
  pop.id = "app-filter-sheet";
  pop.className = "app-filter-sheet";

  const title = document.createElement("div");
  title.className = "app-filter-title";
  title.textContent = t("layout.filter.title");
  pop.appendChild(title);

  if (!facets.length) {
    const empty = document.createElement("div");
    empty.className = "layout-meta";
    empty.textContent = t("layout.filter.empty");
    pop.appendChild(empty);
  }

  type Draft = { path: string; kind: FacetKind; min: string; max: string; picked: Set<string>; text: string };
  const drafts: Draft[] = facets.map((f) => {
    const cur = existingFor(opts.filters, f.path);
    const picked = new Set<string>();
    let min = "";
    let max = "";
    let text = "";
    for (const c of cur?.conditions ?? []) {
      if (c.op === "eq" || c.op === "in") {
        for (const part of String(c.value).split(",")) {
          const s = part.trim();
          if (s) picked.add(s);
        }
      } else if (c.op === "gte" || c.op === "gt") min = String(c.value);
      else if (c.op === "lte" || c.op === "lt") max = String(c.value);
      else if (c.op === "contains") text = String(c.value);
    }
    return { path: f.path, kind: f.kind, min, max, picked, text };
  });

  facets.forEach((facet, i) => {
    const draft = drafts[i]!;
    const block = document.createElement("div");
    block.className = "app-filter-facet";
    block.appendChild(Object.assign(document.createElement("div"), {
      className: "app-filter-facet-label",
      textContent: facet.label,
    }));
    if (facet.kind === "enum") {
      const row = document.createElement("div");
      row.className = "app-filter-chips";
      const values = facet.options?.length ? facet.options : [];
      if (!values.length) {
        const input = document.createElement("input");
        input.className = "app-filter-input";
        input.placeholder = facet.label;
        input.value = draft.text || [...draft.picked][0] || "";
        input.oninput = () => {
          draft.text = input.value;
          draft.picked.clear();
        };
        block.appendChild(input);
      } else {
        for (const v of values) {
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "ex-chip" + (draft.picked.has(v) ? " is-on" : "");
          chip.textContent = v;
          chip.onclick = () => {
            if (draft.picked.has(v)) draft.picked.delete(v);
            else draft.picked.add(v);
            chip.classList.toggle("is-on", draft.picked.has(v));
          };
          row.appendChild(chip);
        }
        block.appendChild(row);
      }
    } else {
      const row = document.createElement("div");
      row.className = "app-filter-range";
      const min = document.createElement("input");
      min.className = "app-filter-input";
      min.placeholder = t("layout.filter.min");
      min.value = draft.min;
      min.oninput = () => {
        draft.min = min.value;
      };
      const max = document.createElement("input");
      max.className = "app-filter-input";
      max.placeholder = t("layout.filter.max");
      max.value = draft.max;
      max.oninput = () => {
        draft.max = max.value;
      };
      const sep = document.createElement("span");
      sep.className = "layout-meta";
      sep.textContent = "–";
      row.append(min, sep, max);
      block.appendChild(row);
    }
    pop.appendChild(block);
  });

  const actions = document.createElement("div");
  actions.className = "app-filter-actions";
  const apply = document.createElement("button");
  apply.type = "button";
  apply.className = "layout-btn layout-btn-primary";
  apply.textContent = t("layout.filter.apply");
  apply.onclick = () => {
    const next: ColumnFilter[] = [];
    const touched = new Set(drafts.map((d) => d.path));
    for (const prev of opts.filters) {
      if (!touched.has(prev.path)) next.push(prev);
    }
    for (const d of drafts) {
      const conditions: FilterCondition[] = [];
      if (d.kind === "enum") {
        const vals = [...d.picked];
        if (vals.length === 1) {
          conditions.push({
            id: newConditionId(),
            op: "eq",
            value: vals[0]!,
            join: "and",
            not: false,
          });
        } else if (vals.length > 1) {
          conditions.push({
            id: newConditionId(),
            op: "in",
            value: vals.join(","),
            join: "and",
            not: false,
          });
        } else if (d.text.trim()) {
          conditions.push({
            id: newConditionId(),
            op: "contains",
            value: d.text.trim(),
            join: "and",
            not: false,
          });
        }
      } else {
        if (d.min.trim()) {
          conditions.push({
            id: newConditionId(),
            op: "gte",
            value: d.min.trim(),
            join: "and",
            not: false,
          });
        }
        if (d.max.trim()) {
          conditions.push({
            id: newConditionId(),
            op: "lte",
            value: d.max.trim(),
            join: "and",
            not: false,
          });
        }
      }
      if (conditions.length) next.push({ path: d.path, conditions });
    }
    opts.onApply(next);
    pop.remove();
  };
  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "layout-btn";
  clear.textContent = t("layout.filter.clear");
  clear.onclick = () => {
    const touched = new Set(drafts.map((d) => d.path));
    opts.onApply(opts.filters.filter((f) => !touched.has(f.path)));
    pop.remove();
  };
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "layout-btn";
  cancel.textContent = t("common.cancel");
  cancel.onclick = () => pop.remove();
  actions.append(apply, clear, cancel);
  pop.appendChild(actions);
  document.body.appendChild(pop);

  const rect = opts.anchor.getBoundingClientRect();
  pop.style.top = `${Math.min(rect.bottom + 8, window.innerHeight - 24)}px`;
  pop.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 360))}px`;

  const closer = (ev: MouseEvent) => {
    if (!pop.contains(ev.target as Node) && ev.target !== opts.anchor) {
      pop.remove();
      document.removeEventListener("mousedown", closer);
    }
  };
  setTimeout(() => document.addEventListener("mousedown", closer), 0);
}
