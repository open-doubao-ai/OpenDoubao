/**
 * Shared list select: picker jump-in (single/multi) + long-press inplace multi-select.
 * Not used on data-management (app === "data") lists.
 */

import { t } from "./i18n/index.js";
import type { LayoutPage, LayoutSpec } from "./page-layout.js";

export type ListSelectMode = "single" | "multi";
export type ListSelectSource = "picker" | "inplace";

export type ListSelectItem = {
  key: string;
  id: string | number | null;
  label: string;
  cells?: Record<string, unknown>;
};

export type ListSelectSession = {
  purpose: string;
  mode: ListSelectMode;
  source: ListSelectSource;
  returnPage?: LayoutPage;
  returnSpec?: LayoutSpec;
  selected: ListSelectItem[];
  /** When true, session is waiting for user to pick; when false after Done, result is ready. */
  active: boolean;
};

const SESSION_KEY = "a2api.listSelect";
const RESULT_KEY = "a2api.listSelectResult";
const LONG_PRESS_MS = 520;

type SessionListener = () => void;
const listeners = new Set<SessionListener>();

function readJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

function removeKey(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function notify(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}

export function subscribeListSelect(fn: SessionListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getListPick(): ListSelectSession | null {
  const s = readJson<ListSelectSession>(SESSION_KEY);
  if (!s || typeof s !== "object") return null;
  if (!s.purpose || !Array.isArray(s.selected)) return null;
  if (s.mode !== "single" && s.mode !== "multi") s.mode = "multi";
  if (s.source !== "picker" && s.source !== "inplace") s.source = "picker";
  return s;
}

export function isListPickActive(): boolean {
  const s = getListPick();
  return !!s?.active;
}

export function isListSelectActive(): boolean {
  return isListPickActive();
}

function saveSession(s: ListSelectSession): void {
  writeJson(SESSION_KEY, s);
  notify();
}

export function beginListPick(opts: {
  purpose: string;
  mode?: ListSelectMode;
  returnPage?: LayoutPage;
  returnSpec?: LayoutSpec;
}): void {
  saveSession({
    purpose: opts.purpose,
    mode: opts.mode ?? "multi",
    source: "picker",
    returnPage: opts.returnPage,
    returnSpec: opts.returnSpec,
    selected: [],
    active: true,
  });
}

export function beginInplaceSelect(
  first?: ListSelectItem,
  mode: ListSelectMode = "multi",
): void {
  saveSession({
    purpose: "inplace",
    mode,
    source: "inplace",
    selected: first ? [first] : [],
    active: true,
  });
}

export function clearListPick(): void {
  removeKey(SESSION_KEY);
  notify();
}

export function exitListSelect(): void {
  clearListPick();
}

export function setListPickMode(mode: ListSelectMode): void {
  const s = getListPick();
  if (!s?.active) return;
  s.mode = mode;
  if (mode === "single" && s.selected.length > 1) {
    s.selected = s.selected.slice(-1);
  }
  saveSession(s);
}

export function toggleListPickItem(item: ListSelectItem): void {
  const s = getListPick();
  if (!s?.active) return;
  const idx = s.selected.findIndex((x) => x.key === item.key);
  if (s.mode === "single") {
    s.selected = idx >= 0 ? [] : [item];
  } else if (idx >= 0) {
    s.selected.splice(idx, 1);
  } else {
    s.selected.push(item);
  }
  saveSession(s);
}

export function isListItemSelected(key: string): boolean {
  const s = getListPick();
  if (!s?.active) return false;
  return s.selected.some((x) => x.key === key);
}

export function getListPickResult(): ListSelectSession | null {
  return readJson<ListSelectSession>(RESULT_KEY);
}

export function consumeListPickResult(
  purpose?: string,
): ListSelectSession | null {
  const r = getListPickResult();
  if (!r) return null;
  if (purpose && r.purpose !== purpose) return null;
  removeKey(RESULT_KEY);
  return r;
}

/** Finish picker: store result, clear active session. Caller navigates back. */
export function completeListPick(): ListSelectSession | null {
  const s = getListPick();
  if (!s?.active || s.source !== "picker") return null;
  if (!s.selected.length) return null;
  const result: ListSelectSession = { ...s, active: false, selected: [...s.selected] };
  writeJson(RESULT_KEY, result);
  clearListPick();
  return result;
}

export type AttachListRowOpts = {
  key: string;
  id?: string | number | null;
  label?: string;
  cells?: Record<string, unknown>;
  onOpen: () => void;
  /** When false, skip long-press / select (e.g. data app). Default true. */
  enabled?: boolean;
  onSelectChange?: () => void;
};

function itemFromOpts(opts: AttachListRowOpts): ListSelectItem {
  return {
    key: opts.key,
    id: opts.id ?? null,
    label: opts.label || `#${opts.key}`,
    cells: opts.cells,
  };
}

function syncRowSelectedClass(el: HTMLElement, key: string): void {
  el.classList.toggle("is-list-selected", isListItemSelected(key));
}

/**
 * Wire click + long-press on a list row/card.
 * Long-press enters inplace multi-select; while select active, click toggles.
 */
export function attachListRow(
  el: HTMLElement,
  opts: AttachListRowOpts,
): void {
  el.dataset.rowKey = opts.key;
  el.classList.add("list-select-row");
  syncRowSelectedClass(el, opts.key);

  if (opts.enabled === false) {
    el.onclick = (ev) => {
      ev.preventDefault();
      opts.onOpen();
    };
    return;
  }

  let timer: number | null = null;
  let longPressed = false;
  const clear = () => {
    if (timer != null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const enterInplace = () => {
    longPressed = true;
    beginInplaceSelect(itemFromOpts(opts), "multi");
    syncRowSelectedClass(el, opts.key);
    opts.onSelectChange?.();
  };

  el.addEventListener("pointerdown", (ev) => {
    if (ev.pointerType === "mouse" && ev.button !== 0) return;
    longPressed = false;
    clear();
    if (isListSelectActive()) return;
    timer = window.setTimeout(enterInplace, LONG_PRESS_MS);
  });
  el.addEventListener("pointerup", clear);
  el.addEventListener("pointerleave", clear);
  el.addEventListener("pointercancel", clear);
  el.addEventListener("pointermove", (ev) => {
    if (timer == null) return;
    if (Math.abs(ev.movementX) + Math.abs(ev.movementY) > 8) clear();
  });
  el.addEventListener("contextmenu", (ev) => {
    if (opts.enabled === false) return;
    ev.preventDefault();
    clear();
    if (!isListSelectActive()) enterInplace();
  });

  el.onclick = (ev) => {
    if (longPressed) {
      ev.preventDefault();
      ev.stopPropagation();
      longPressed = false;
      return;
    }
    if (isListSelectActive()) {
      ev.preventDefault();
      ev.stopPropagation();
      toggleListPickItem(itemFromOpts(opts));
      syncRowSelectedClass(el, opts.key);
      opts.onSelectChange?.();
      return;
    }
    opts.onOpen();
  };
}

export type ListSelectChromeOpts = {
  primaryTable: string | null;
  onCancel: () => void;
  onDone: (session: ListSelectSession) => void;
  onDelete: (items: ListSelectItem[]) => void | Promise<void>;
  onChange?: () => void;
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

/** Sticky select bar; returns paint() to refresh after selection changes. */
export function mountListSelectChrome(
  host: HTMLElement,
  opts: ListSelectChromeOpts,
): { paint: () => void; root: HTMLElement; dispose: () => void } {
  const root = el("div", "list-select-chrome");
  root.hidden = true;

  const paint = () => {
    const s = getListPick();
    root.innerHTML = "";
    if (!s?.active) {
      root.hidden = true;
      host.querySelectorAll(".list-select-row").forEach((node) => {
        const key = (node as HTMLElement).dataset.rowKey;
        if (key) syncRowSelectedClass(node as HTMLElement, key);
      });
      return;
    }
    root.hidden = false;

    const hint = el(
      "div",
      "list-select-hint",
      s.source === "picker"
        ? t("layout.listSelect.pickHint")
        : t("layout.listSelect.inplaceHint"),
    );
    root.appendChild(hint);

    const row = el("div", "list-select-bar");
    const count = el(
      "span",
      "list-select-count",
      t("layout.listSelect.selected", { n: String(s.selected.length) }),
    );
    row.appendChild(count);

    const modeWrap = el("div", "list-select-mode");
    const singleBtn = el(
      "button",
      "list-select-mode-btn" + (s.mode === "single" ? " is-active" : ""),
      t("layout.listSelect.single"),
    );
    singleBtn.type = "button";
    singleBtn.onclick = () => {
      setListPickMode("single");
      paint();
      opts.onChange?.();
      host.querySelectorAll(".list-select-row").forEach((node) => {
        const key = (node as HTMLElement).dataset.rowKey;
        if (key) syncRowSelectedClass(node as HTMLElement, key);
      });
    };
    const multiBtn = el(
      "button",
      "list-select-mode-btn" + (s.mode === "multi" ? " is-active" : ""),
      t("layout.listSelect.multi"),
    );
    multiBtn.type = "button";
    multiBtn.onclick = () => {
      setListPickMode("multi");
      paint();
      opts.onChange?.();
    };
    modeWrap.append(singleBtn, multiBtn);
    row.appendChild(modeWrap);

    const cancel = el("button", "layout-btn", t("common.cancel"));
    cancel.type = "button";
    cancel.onclick = () => {
      exitListSelect();
      paint();
      opts.onCancel();
    };
    row.appendChild(cancel);

    if (s.source === "picker") {
      const done = el("button", "layout-btn layout-btn-primary", t("common.confirm"));
      done.type = "button";
      done.disabled = s.selected.length === 0;
      done.onclick = () => {
        const result = completeListPick();
        if (!result) return;
        paint();
        opts.onDone(result);
      };
      row.appendChild(done);
    } else {
      const del = el(
        "button",
        "layout-btn layout-btn-danger",
        t("layout.listSelect.delete"),
      );
      del.type = "button";
      del.disabled = s.selected.length === 0;
      del.onclick = () => {
        const items = [...s.selected];
        if (!items.length) return;
        if (!confirm(t("layout.listSelect.confirmDelete", { n: String(items.length) }))) {
          return;
        }
        void Promise.resolve(opts.onDelete(items)).then(() => {
          exitListSelect();
          paint();
        });
      };
      row.appendChild(del);
    }

    root.appendChild(row);

    host.querySelectorAll(".list-select-row").forEach((node) => {
      const key = (node as HTMLElement).dataset.rowKey;
      if (key) syncRowSelectedClass(node as HTMLElement, key);
    });
  };

  host.prepend(root);
  const unsub = subscribeListSelect(paint);
  paint();
  return { paint, root, dispose: unsub };
}
