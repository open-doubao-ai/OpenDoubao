/**
 * Excel / DataGrip-style list table: click to focus, click again to edit,
 * undo/save chrome, column resize handles.
 */

import { t } from "./i18n/index.js";
import {
  clampColumnPixelWidth,
  columnPixelWidth,
  type ColumnMeta,
} from "./field-meta.js";

const UNDO_CAP = 80;
const LONG_PRESS_MS = 350;
const DRAG_SLOP_PX = 8;

export type GridDirtyCell = {
  rowKey: string;
  path: string;
  original: unknown;
  text: string;
};

type UndoEntry = {
  rowKey: string;
  path: string;
  prevText: string;
  prevDirty: boolean;
  nextText: string;
  original: unknown;
};

type GridSession = {
  response: unknown;
  dirty: Map<string, GridDirtyCell>;
  undo: UndoEntry[];
  focused: { rowKey: string; path: string } | null;
  active: boolean;
};

export type GridEditorKind = "input" | "textarea" | "select";

export type GridBindOpts = {
  table: HTMLTableElement;
  visibleCols: string[];
  rows: Array<{ key: string; cells: Record<string, unknown> }>;
  canEdit: (path: string) => boolean;
  editorKind: (path: string) => GridEditorKind;
  inputType: (path: string) => string;
  selectOptions?: (
    path: string,
  ) => Array<{ value: string; label: string }> | null;
  editValue: (path: string, raw: unknown) => string;
  displayValue: (path: string, raw: unknown, text: string) => string;
  onDirtyChange?: () => void;
};

let session: GridSession | null = null;
let bound: {
  table: HTMLTableElement;
  opts: GridBindOpts;
  editor: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
} | null = null;

function dirtyKey(rowKey: string, path: string): string {
  return `${rowKey}\0${path}`;
}

function cssEscape(s: string): string {
  return typeof CSS !== "undefined" && typeof CSS.escape === "function"
    ? CSS.escape(s)
    : s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function createSession(response: unknown, active: boolean): GridSession {
  return {
    response,
    dirty: new Map(),
    undo: [],
    focused: null,
    active,
  };
}

export function beginTableGridSession(response: unknown): void {
  if (!session || session.response !== response) {
    session = createSession(response, true);
  } else {
    session.active = true;
  }
  paintTableEditChrome();
}

export function setTableGridActive(active: boolean): void {
  if (session) session.active = active;
  if (!active) {
    bound = null;
  }
  paintTableEditChrome();
}

export function getTableGridDirty(): GridDirtyCell[] {
  if (!session) return [];
  return [...session.dirty.values()];
}

export function tableGridHasUndo(): boolean {
  return Boolean(session && session.undo.length > 0);
}

export function clearTableGridEdits(): void {
  if (!session) return;
  session.dirty.clear();
  session.undo = [];
  session.focused = null;
  paintTableEditChrome();
}

export function commitTableGridEditor(): boolean {
  if (!bound?.editor) return false;
  return finishEditor(true);
}

function hostEl(): HTMLElement | null {
  return document.getElementById("table-edit-chrome");
}

export function paintTableEditChrome(): void {
  const host = hostEl();
  if (!host) return;
  host.replaceChildren();
  host.classList.toggle("is-dirty", getTableGridDirty().length > 0);
  if (!session?.active) return;

  const undo = document.createElement("button");
  undo.type = "button";
  undo.id = "btn-table-undo";
  undo.textContent = t("common.undo");
  undo.title = t("result.undoGrid");
  undo.disabled = !tableGridHasUndo();
  undo.onclick = () => {
    undoTableGrid();
  };

  const save = document.createElement("button");
  save.type = "button";
  save.id = "btn-table-save";
  save.className = "primary";
  save.textContent = t("common.save");
  save.title = t("result.saveGrid");
  save.disabled = getTableGridDirty().length === 0;
  save.onclick = () => {
    void saveTableGridHandler?.();
  };

  host.append(undo, save);
}

export function flashTableEditSave(msg: string, ms = 1400): void {
  const btn = document.getElementById("btn-table-save");
  if (!(btn instanceof HTMLButtonElement)) return;
  btn.textContent = msg;
  window.setTimeout(() => {
    if (btn.isConnected) btn.textContent = t("common.save");
  }, ms);
}

let saveTableGridHandler: (() => void | Promise<void>) | null = null;

export function registerTableGridSave(
  fn: (() => void | Promise<void>) | null,
): void {
  saveTableGridHandler = fn;
}

function findCell(
  table: HTMLTableElement,
  rowKey: string,
  path: string,
): HTMLTableCellElement | null {
  return table.querySelector(
    `td.table-cell[data-row-key="${cssEscape(rowKey)}"][data-path="${cssEscape(path)}"]`,
  );
}

function originalText(opts: GridBindOpts, rowKey: string, path: string): string {
  const row = opts.rows.find((r) => r.key === rowKey);
  const raw = row?.cells[path];
  return opts.editValue(path, raw);
}

function paintCellDisplay(
  td: HTMLTableCellElement,
  opts: GridBindOpts,
  rowKey: string,
  path: string,
): void {
  const dirty = session?.dirty.get(dirtyKey(rowKey, path));
  const row = opts.rows.find((r) => r.key === rowKey);
  const raw = dirty ? dirty.original : row?.cells[path];
  const text = dirty ? dirty.text : opts.editValue(path, raw);
  td.replaceChildren();
  td.textContent = opts.displayValue(path, raw, text);
  td.classList.toggle("is-dirty", Boolean(dirty));
  td.classList.remove("is-editing");
}

function applyDirtyOverlays(opts: GridBindOpts): void {
  if (!session) return;
  for (const cell of session.dirty.values()) {
    const td = findCell(opts.table, cell.rowKey, cell.path);
    if (!td) continue;
    paintCellDisplay(td, opts, cell.rowKey, cell.path);
  }
}

function setFocus(td: HTMLTableCellElement, opts: GridBindOpts): void {
  const rowKey = td.dataset.rowKey || "";
  const path = td.dataset.path || "";
  opts.table
    .querySelectorAll("td.table-cell.is-focused")
    .forEach((el) => el.classList.remove("is-focused"));
  td.classList.add("is-focused");
  if (session) session.focused = { rowKey, path };
  td.focus({ preventScroll: true });
}

function startEditor(td: HTMLTableCellElement, opts: GridBindOpts): void {
  const rowKey = td.dataset.rowKey || "";
  const path = td.dataset.path || "";
  if (!opts.canEdit(path)) return;
  finishEditor(true);
  const dirty = session?.dirty.get(dirtyKey(rowKey, path));
  const row = opts.rows.find((r) => r.key === rowKey);
  const raw = dirty ? dirty.original : row?.cells[path];
  const value = dirty ? dirty.text : opts.editValue(path, raw);
  const kind = opts.editorKind(path);
  let editor: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  if (kind === "select") {
    const sel = document.createElement("select");
    sel.className = "table-cell-editor";
    const options = opts.selectOptions?.(path) ?? [];
    const seen = new Set(options.map((o) => o.value));
    if (value && !seen.has(value)) {
      const extra = document.createElement("option");
      extra.value = value;
      extra.textContent = value;
      sel.appendChild(extra);
    }
    for (const o of options) {
      const opt = document.createElement("option");
      opt.value = o.value;
      opt.textContent = o.label;
      sel.appendChild(opt);
    }
    sel.value = value;
    editor = sel;
  } else if (kind === "textarea") {
    const ta = document.createElement("textarea");
    ta.className = "table-cell-editor";
    ta.rows = 3;
    ta.value = value;
    editor = ta;
  } else {
    const input = document.createElement("input");
    input.className = "table-cell-editor";
    input.type = opts.inputType(path) || "text";
    input.value = value;
    editor = input;
  }
  td.classList.add("is-editing");
  td.replaceChildren(editor);
  if (bound) bound.editor = editor;
  editor.focus();
  if ("select" in editor && kind !== "select") {
    try {
      (editor as HTMLInputElement | HTMLTextAreaElement).select();
    } catch {
      /* ignore */
    }
  }
  editor.addEventListener("keydown", (ev) => {
    const kev = ev as KeyboardEvent;
    if (kev.key === "Escape") {
      kev.preventDefault();
      kev.stopPropagation();
      finishEditor(false);
      td.focus();
      return;
    }
    if (kev.key === "Enter" && kind !== "textarea") {
      kev.preventDefault();
      kev.stopPropagation();
      finishEditor(true);
      td.focus();
      return;
    }
    if (kev.key === "Enter" && kind === "textarea" && (kev.ctrlKey || kev.metaKey)) {
      kev.preventDefault();
      finishEditor(true);
      td.focus();
      return;
    }
    if (kev.key === "Tab") {
      kev.preventDefault();
      finishEditor(true);
      moveFocus(0, kev.shiftKey ? -1 : 1);
    }
  });
  editor.addEventListener("blur", () => {
    window.setTimeout(() => {
      if (bound?.editor === editor) finishEditor(true);
    }, 0);
  });
}

function finishEditor(commit: boolean): boolean {
  if (!bound?.editor || !session) return false;
  const editor = bound.editor;
  const td = editor.closest("td.table-cell") as HTMLTableCellElement | null;
  const opts = bound.opts;
  bound.editor = null;
  if (!td) return false;
  const rowKey = td.dataset.rowKey || "";
  const path = td.dataset.path || "";
  td.classList.remove("is-editing");
  if (!commit) {
    paintCellDisplay(td, opts, rowKey, path);
    restoreFocusClass(opts.table);
    opts.onDirtyChange?.();
    paintTableEditChrome();
    return false;
  }
  const next = editor.value;
  applyCommittedValue(opts, rowKey, path, next);
  paintCellDisplay(td, opts, rowKey, path);
  restoreFocusClass(opts.table);
  opts.onDirtyChange?.();
  paintTableEditChrome();
  return true;
}

function restoreFocusClass(table: HTMLTableElement): void {
  if (!session?.focused) return;
  const td = findCell(table, session.focused.rowKey, session.focused.path);
  td?.classList.add("is-focused");
}

function applyCommittedValue(
  opts: GridBindOpts,
  rowKey: string,
  path: string,
  next: string,
): void {
  if (!session) return;
  const key = dirtyKey(rowKey, path);
  const orig = originalText(opts, rowKey, path);
  const existing = session.dirty.get(key);
  const prevText = existing ? existing.text : orig;
  if (next === prevText) return;
  const original = existing?.original ?? opts.rows.find((r) => r.key === rowKey)?.cells[path];
  session.undo.push({
    rowKey,
    path,
    prevText,
    prevDirty: Boolean(existing),
    nextText: next,
    original,
  });
  if (session.undo.length > UNDO_CAP) session.undo.shift();
  if (next === orig) session.dirty.delete(key);
  else {
    session.dirty.set(key, {
      rowKey,
      path,
      original,
      text: next,
    });
  }
}

export function undoTableGrid(): boolean {
  if (!session) return false;
  if (bound?.editor) {
    finishEditor(false);
    return true;
  }
  const entry = session.undo.pop();
  if (!entry) {
    paintTableEditChrome();
    return false;
  }
  const key = dirtyKey(entry.rowKey, entry.path);
  if (entry.prevDirty) {
    session.dirty.set(key, {
      rowKey: entry.rowKey,
      path: entry.path,
      original: entry.original,
      text: entry.prevText,
    });
  } else {
    session.dirty.delete(key);
  }
  if (bound) {
    const td = findCell(bound.table, entry.rowKey, entry.path);
    if (td) {
      paintCellDisplay(td, bound.opts, entry.rowKey, entry.path);
      setFocus(td, bound.opts);
    }
  }
  paintTableEditChrome();
  return true;
}

function moveFocus(dRow: number, dCol: number): void {
  if (!bound || !session?.focused) return;
  const { opts } = bound;
  const rows = opts.rows;
  const cols = opts.visibleCols;
  const ri = rows.findIndex((r) => r.key === session!.focused!.rowKey);
  const ci = cols.indexOf(session.focused.path);
  if (ri < 0 || ci < 0) return;
  const nextRi = Math.max(0, Math.min(rows.length - 1, ri + dRow));
  const nextCi = Math.max(0, Math.min(cols.length - 1, ci + dCol));
  const row = rows[nextRi]!;
  const path = cols[nextCi]!;
  const td = findCell(opts.table, row.key, path);
  if (td) setFocus(td, opts);
}

function isGridShortcutTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return Boolean(el.closest(".data-table") || el.closest("#table-edit-chrome"));
}

function onDocumentKey(ev: KeyboardEvent): void {
  if (!session?.active) return;
  const meta = ev.metaKey || ev.ctrlKey;
  if (meta && ev.key.toLowerCase() === "s") {
    if (!isGridShortcutTarget(ev.target)) return;
    ev.preventDefault();
    commitTableGridEditor();
    void saveTableGridHandler?.();
    return;
  }
  if (meta && ev.key.toLowerCase() === "z" && !ev.shiftKey) {
    if (bound?.editor) return;
    if (!isGridShortcutTarget(ev.target)) return;
    ev.preventDefault();
    undoTableGrid();
  }
}

let docKeyBound = false;
function ensureDocKeys(): void {
  if (docKeyBound) return;
  docKeyBound = true;
  document.addEventListener("keydown", onDocumentKey);
}

export function bindTableGrid(opts: GridBindOpts): void {
  ensureDocKeys();
  bound = { table: opts.table, opts, editor: null };
  applyDirtyOverlays(opts);
  if (session?.focused) {
    const td = findCell(opts.table, session.focused.rowKey, session.focused.path);
    if (td) setFocus(td, opts);
  }

  const tbody = opts.table.tBodies[0];
  if (!tbody) return;

  tbody.addEventListener(
    "click",
    (e) => {
      const td = (e.target as HTMLElement | null)?.closest("td.table-cell");
      if (!(td instanceof HTMLTableCellElement) || !opts.table.contains(td)) {
        return;
      }
      if (td.querySelector(".table-cell-editor")) return;
      const interactive = (e.target as HTMLElement).closest(
        "a, button, input, select, textarea, .fk-link, .table-cell-img, .table-file-link, .table-img-more",
      );
      if (interactive && (e.ctrlKey || e.metaKey)) return;
      if (interactive) {
        e.preventDefault();
        e.stopPropagation();
      }
      handleCellClick(td, opts);
    },
    true,
  );

  opts.table.addEventListener("keydown", (e) => {
    if (!session?.active || bound?.editor) return;
    const td = (e.target as HTMLElement).closest("td.table-cell");
    if (!(td instanceof HTMLTableCellElement)) return;
    if (e.key === "F2" || e.key === "Enter") {
      e.preventDefault();
      startEditor(td, opts);
      return;
    }
    if (e.key === "Escape") {
      td.classList.remove("is-focused");
      if (session) session.focused = null;
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveFocus(0, 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveFocus(0, -1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveFocus(1, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveFocus(-1, 0);
    } else if (e.key === "Tab") {
      e.preventDefault();
      moveFocus(0, e.shiftKey ? -1 : 1);
    }
  });
}

function handleCellClick(td: HTMLTableCellElement, opts: GridBindOpts): void {
  const rowKey = td.dataset.rowKey || "";
  const path = td.dataset.path || "";
  const same =
    session?.focused?.rowKey === rowKey && session?.focused?.path === path;
  if (bound?.editor) finishEditor(true);
  if (same && !td.classList.contains("is-editing")) {
    startEditor(td, opts);
    return;
  }
  setFocus(td, opts);
}

export function markGridCell(
  td: HTMLTableCellElement,
  rowKey: string,
  path: string,
): void {
  td.classList.add("table-cell");
  td.dataset.rowKey = rowKey;
  td.dataset.path = path;
  td.tabIndex = -1;
}

export function hintGridCells(
  table: HTMLTableElement,
  canEdit: (path: string) => boolean,
): void {
  for (const td of Array.from(
    table.querySelectorAll<HTMLTableCellElement>("td.table-cell"),
  )) {
    const path = td.dataset.path || "";
    const extra = canEdit(path)
      ? t("result.clickToFocus")
      : t("result.readOnlyCell");
    td.title = td.title ? `${td.title}\n${extra}` : extra;
  }
}

export function appendTableColGroup(
  table: HTMLTableElement,
  visibleCols: string[],
  metas: Record<string, ColumnMeta>,
  rows: Array<{ cells: Record<string, unknown> }>,
): void {
  const cg = document.createElement("colgroup");
  const check = document.createElement("col");
  check.className = "col-fixed-check";
  check.style.width = "36px";
  cg.appendChild(check);
  for (const col of visibleCols) {
    const c = document.createElement("col");
    c.dataset.path = col;
    c.style.width = `${columnPixelWidth(col, metas[col], rows)}px`;
    cg.appendChild(c);
  }
  const settings = document.createElement("col");
  settings.className = "col-fixed-settings";
  settings.style.width = "36px";
  cg.appendChild(settings);
  const actions = document.createElement("col");
  actions.className = "col-fixed-actions";
  actions.style.width = "128px";
  cg.appendChild(actions);
  table.appendChild(cg);
}

export function enableColumnResize(
  table: HTMLTableElement,
  metas: Record<string, ColumnMeta>,
  onCommit: (path: string, width: number) => void,
): void {
  const headRow = table.tHead?.rows[0];
  if (!headRow) return;
  for (const th of Array.from(
    headRow.querySelectorAll<HTMLElement>("th.col-head"),
  )) {
    const path = th.dataset.path;
    if (!path) continue;
    let handle = th.querySelector<HTMLElement>(":scope > .col-resize-handle");
    if (!handle) {
      handle = document.createElement("span");
      handle.className = "col-resize-handle";
      handle.title = t("result.resizeColumn");
      th.appendChild(handle);
    }
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const col = table.querySelector(
        `col[data-path="${cssEscape(path)}"]`,
      ) as HTMLElement | null;
      const startX = e.clientX;
      const startW =
        col?.getBoundingClientRect().width || th.getBoundingClientRect().width;
      handle!.classList.add("is-resizing");
      document.body.classList.add("is-resizing-col");
      const apply = (clientX: number) => {
        const w = clampColumnPixelWidth(startW + (clientX - startX));
        if (col) col.style.width = `${w}px`;
        else th.style.width = `${w}px`;
        return w;
      };
      const onMove = (ev: PointerEvent | MouseEvent) => {
        apply(ev.clientX);
      };
      const onUp = (ev: PointerEvent | MouseEvent) => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("mouseup", onUp);
        handle!.classList.remove("is-resizing");
        document.body.classList.remove("is-resizing-col");
        const w = apply(ev.clientX);
        if (w !== metas[path]?.width) onCommit(path, w);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("mousemove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("mouseup", onUp);
    });
  }
}

/** Long-press (~350ms) then drag to reorder columns. */
export function enableColumnDrag(
  headRow: HTMLTableRowElement,
  visibleCols: string[],
  fullOrder: string[],
  onChange: (order: string[]) => void,
): void {
  let pressTimer: number | null = null;
  let draggingPath: string | null = null;
  let startX = 0;
  let startY = 0;

  const clearTimer = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  const clearHints = () => {
    for (const other of Array.from(
      headRow.querySelectorAll<HTMLElement>("th.col-head"),
    )) {
      other.classList.remove("drop-target", "dragging");
    }
  };

  for (const th of Array.from(
    headRow.querySelectorAll<HTMLElement>("th.col-head"),
  )) {
    const path = th.dataset.path!;
    th.addEventListener("pointerdown", (e) => {
      if ((e.target as HTMLElement).closest("button, .col-resize-handle")) {
        return;
      }
      startX = e.clientX;
      startY = e.clientY;
      pressTimer = window.setTimeout(() => {
        draggingPath = path;
        th.classList.add("dragging");
        try {
          th.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }, LONG_PRESS_MS);
    });
    th.addEventListener("pointerup", (e) => {
      clearTimer();
      if (!draggingPath) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const targetTh = el?.closest("th.col-head") as HTMLElement | null;
      const targetPath = targetTh?.dataset.path;
      if (targetPath && targetPath !== draggingPath) {
        const vis = [...visibleCols];
        const from = vis.indexOf(draggingPath);
        const to = vis.indexOf(targetPath);
        if (from >= 0 && to >= 0) {
          vis.splice(from, 1);
          vis.splice(to, 0, draggingPath);
          const next = [...fullOrder];
          const hidden = next.filter((p) => !vis.includes(p));
          onChange([...vis, ...hidden]);
        }
      }
      draggingPath = null;
      clearHints();
    });
    th.addEventListener("pointermove", (e) => {
      if (
        pressTimer &&
        Math.hypot(e.clientX - startX, e.clientY - startY) > DRAG_SLOP_PX
      ) {
        clearTimer();
      }
      if (!draggingPath) return;
      for (const other of Array.from(
        headRow.querySelectorAll<HTMLElement>("th.col-head"),
      )) {
        other.classList.remove("drop-target");
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const targetTh = el?.closest("th.col-head") as HTMLElement | null;
      if (targetTh && targetTh.dataset.path !== draggingPath) {
        targetTh.classList.add("drop-target");
      }
    });
    th.addEventListener("pointercancel", () => {
      clearTimer();
      draggingPath = null;
      clearHints();
    });
  }
}
