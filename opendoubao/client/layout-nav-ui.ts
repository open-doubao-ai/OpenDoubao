/**
 * Compose an app from existing pages: remap tabs + jump buttons.
 */

import { t } from "./i18n/index.js";
import {
  JUMP_SLOTS,
  LAYOUT_APPS,
  LAYOUT_PAGES_BY_APP,
  NAV_TAB_CANDIDATES,
  addNavTab,
  defaultJumpSpec,
  jumpSlotLabel,
  layoutAppLabel,
  layoutPageLabel,
  layoutSpecLabel,
  layoutTabLabel,
  removeNavTab,
  resolveNavJump,
  specsEqual,
  type JumpSlot,
  type LayoutApp,
  type LayoutNav,
  type LayoutPage,
  type LayoutSpec,
} from "./page-layout.js";

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

let pickerEl: HTMLElement | null = null;
let pickerOutside: ((ev: Event) => void) | null = null;

export function closeLayoutSpecPicker() {
  if (pickerOutside) {
    document.removeEventListener("pointerdown", pickerOutside, true);
    document.removeEventListener("keydown", pickerKey, true);
    pickerOutside = null;
  }
  pickerEl?.remove();
  pickerEl = null;
}

function pickerKey(ev: KeyboardEvent) {
  if (ev.key === "Escape") closeLayoutSpecPicker();
}

export function fillLayoutSpecMenu(
  menu: HTMLElement,
  opts: {
    current: LayoutSpec;
    onSelect: (spec: LayoutSpec) => void;
    onPlaced?: (menu: HTMLElement, group: HTMLElement) => void;
  },
) {
  for (const app of LAYOUT_APPS) {
    const group = el(
      "div",
      "page-layout-group" + (app === opts.current.app ? " is-current" : ""),
    );
    const parent = el(
      "button",
      "page-layout-item page-layout-parent" +
        (app === opts.current.app ? " active" : ""),
      layoutAppLabel(app),
    );
    parent.type = "button";
    const sub = el("div", "page-layout-sub");
    parent.onmousedown = (ev) => ev.stopPropagation();
    parent.onclick = (ev) => {
      ev.stopPropagation();
      for (const g of Array.from(
        menu.querySelectorAll(".page-layout-group.is-open"),
      )) {
        if (g !== group) g.classList.remove("is-open");
      }
      group.classList.toggle("is-open");
      opts.onPlaced?.(menu, group);
    };
    group.addEventListener("pointerenter", () => opts.onPlaced?.(menu, group));
    group.addEventListener("pointerleave", () => {
      sub.classList.remove("is-placed");
    });
    for (const page of LAYOUT_PAGES_BY_APP[app]) {
      const item = el(
        "button",
        "page-layout-item" +
          (app === opts.current.app && page === opts.current.page
            ? " active"
            : ""),
        layoutPageLabel(page, app),
      );
      item.type = "button";
      item.onmousedown = (ev) => ev.stopPropagation();
      item.onclick = (ev) => {
        ev.stopPropagation();
        opts.onSelect({ app, page });
      };
      sub.appendChild(item);
    }
    group.append(parent, sub);
    menu.appendChild(group);
  }
}

export function openLayoutSpecPicker(
  anchor: HTMLElement,
  current: LayoutSpec,
  onSelect: (spec: LayoutSpec) => void,
) {
  closeLayoutSpecPicker();
  const menu = el("div", "page-menu page-layout-menu layout-spec-picker is-open");
  menu.setAttribute("role", "menu");
  fillLayoutSpecMenu(menu, {
    current,
    onSelect: (spec) => {
      closeLayoutSpecPicker();
      onSelect(spec);
    },
    onPlaced: (m, group) => placePickerSub(m, group),
  });
  document.body.appendChild(menu);
  pickerEl = menu;
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 8;
  menu.style.position = "fixed";
  menu.style.zIndex = "80";
  const w = Math.min(menu.offsetWidth || 180, vw - margin * 2);
  let left = Math.round(rect.left);
  if (left + w > vw - margin) left = vw - margin - w;
  if (left < margin) left = margin;
  let top = Math.round(rect.bottom + 4);
  const h = Math.min(menu.offsetHeight || 240, vh - margin * 2);
  if (top + h > vh - margin) {
    top = Math.max(margin, Math.round(rect.top - h - 4));
  }
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.style.maxHeight = `${Math.max(120, vh - top - margin)}px`;

  pickerOutside = (ev: Event) => {
    const n = ev.target as Node | null;
    if (n && (menu.contains(n) || anchor.contains(n))) return;
    closeLayoutSpecPicker();
  };
  document.addEventListener("keydown", pickerKey, true);
  window.setTimeout(() => {
    document.addEventListener("pointerdown", pickerOutside!, true);
  }, 0);
}

function placePickerSub(menu: HTMLElement, group: HTMLElement) {
  const parentBtn = group.querySelector<HTMLElement>(".page-layout-parent");
  const sub = group.querySelector<HTMLElement>(".page-layout-sub");
  if (!parentBtn || !sub) return;
  const margin = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = parentBtn.getBoundingClientRect();
  sub.style.position = "fixed";
  sub.style.display = "block";
  sub.classList.add("is-placed");
  const subW = Math.min(sub.offsetWidth || 148, vw - margin * 2);
  const subH = Math.min(sub.offsetHeight || 0, vh - margin * 2);
  let left = Math.round(rect.right - 4);
  if (left + subW > vw - margin) left = Math.round(rect.left - subW + 4);
  if (left < margin) left = margin;
  let top = Math.round(rect.top);
  if (top + subH > vh - margin) top = Math.max(margin, vh - margin - subH);
  sub.style.left = `${left}px`;
  sub.style.top = `${top}px`;
  sub.style.maxHeight = `${Math.max(120, vh - margin * 2)}px`;
}

export function bindTabRemap(
  btn: HTMLElement,
  opts: {
    spec: LayoutSpec;
    onPick: (spec: LayoutSpec) => void;
  },
) {
  btn.title = `${btn.title || ""}\n${t("layout.nav.tabHint")}`.trim();
  let timer: number | null = null;
  const clear = () => {
    if (timer != null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };
  btn.addEventListener("pointerdown", (ev) => {
    if (ev.pointerType === "mouse" && ev.button !== 0) return;
    clear();
    timer = window.setTimeout(() => {
      timer = null;
      openLayoutSpecPicker(btn, opts.spec, opts.onPick);
    }, 520);
  });
  btn.addEventListener("pointerup", clear);
  btn.addEventListener("pointerleave", clear);
  btn.addEventListener("pointercancel", clear);
  btn.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    clear();
    openLayoutSpecPicker(btn, opts.spec, opts.onPick);
  });
}

function navRow(
  label: string,
  spec: LayoutSpec,
  onPick: (anchor: HTMLElement) => void,
  onRemove?: () => void,
): HTMLElement {
  const row = el("div", "page-layout-nav-row");
  const btn = el("button", "page-layout-item page-layout-nav-btn");
  btn.type = "button";
  const name = el("span", "page-layout-nav-name", label);
  const target = el("span", "page-layout-nav-target", layoutSpecLabel(spec));
  btn.append(name, target);
  btn.onclick = (ev) => {
    ev.stopPropagation();
    onPick(btn);
  };
  row.appendChild(btn);
  if (onRemove) {
    const x = el("button", "page-layout-nav-x", "×");
    x.type = "button";
    x.title = t("layout.nav.removeTab");
    x.onclick = (ev) => {
      ev.stopPropagation();
      onRemove();
    };
    row.appendChild(x);
  }
  return row;
}

export type LayoutNavEditorHandlers = {
  nav: LayoutNav;
  current: LayoutSpec;
  onNav: (nav: LayoutNav) => void;
};

export function prependNavEditor(
  menu: HTMLElement,
  opts: LayoutNavEditorHandlers,
) {
  const { nav } = opts;
  const block = el("div", "page-layout-nav");

  const tabsHead = el("div", "page-layout-nav-head", t("layout.nav.tabs"));
  block.appendChild(tabsHead);
  for (const tab of nav.tabs) {
    block.appendChild(
      navRow(
        tab.label || layoutTabLabel(tab.slot, nav.host),
        tab.spec,
        (anchor) => {
          openLayoutSpecPicker(anchor, tab.spec, (spec) => {
            opts.onNav(addNavTab(nav, tab.slot, spec));
          });
        },
        nav.tabs.length > 1
          ? () => opts.onNav(removeNavTab(nav, tab.slot))
          : undefined,
      ),
    );
  }
  const unused = NAV_TAB_CANDIDATES.filter(
    (p) => !nav.tabs.some((t) => t.slot === p),
  );
  if (unused.length) {
    const add = el(
      "button",
      "page-layout-item page-layout-nav-add",
      t("layout.nav.addTab"),
    );
    add.type = "button";
    add.onclick = (ev) => {
      ev.stopPropagation();
      const slot = unused[0]!;
      opts.onNav(addNavTab(nav, slot, { app: nav.host, page: slot }));
    };
    block.appendChild(add);
  }

  const jumpsHead = el("div", "page-layout-nav-head", t("layout.nav.jumps"));
  block.appendChild(jumpsHead);
  for (const slot of JUMP_SLOTS) {
    const spec = resolveNavJump(nav, slot, opts.current);
    const def = defaultJumpSpec(opts.current, slot);
    block.appendChild(
      navRow(jumpSlotLabel(slot), spec, (anchor) => {
        openLayoutSpecPicker(anchor, spec, (next) => {
          const jumps = { ...nav.jumps };
          if (specsEqual(next, def)) delete jumps[slot];
          else jumps[slot] = next;
          opts.onNav({ ...nav, jumps });
        });
      }),
    );
  }

  menu.insertBefore(block, menu.firstChild);
}

export function navTabLabel(tab: {
  slot: LayoutPage;
  spec: LayoutSpec;
  label?: string;
}, host?: LayoutApp): string {
  return tab.label || layoutTabLabel(tab.slot, host);
}
