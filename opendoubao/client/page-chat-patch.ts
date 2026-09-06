/**
 * Deterministic in-place page edits from chat text (no LLM).
 * Used by Edit mode on the client so layout changes apply even if the API
 * falls back to an explain dump.
 */

import {
  specFromUserPhrase,
  type LayoutApp,
} from "./page-layout.js";

export type ChatPagePatch = {
  displayKind?: string;
  catalogStyle?: "grid" | "list" | null;
  title?: string;
  layoutApp?: string;
  layoutPage?: string;
  hideColumns?: string[];
  showColumns?: string[];
  columnOrder?: string[];
  /** set = remap existing tab target; add = insert tab on the bar (stay on page). */
  navTabOp?: "set" | "add";
  navTab?: { slot: string; app: string; page: string };
  navJump?: { slot: string; app: string; page: string };
};

function destPhrase(text: string): string | null {
  const m = text.match(
    /(?:改成|换成|改用|变成|改为|跳转到|跳到)\s*(.+)$/,
  );
  const raw = (m?.[1] || "").replace(/[。.!！]+$/, "").trim();
  return raw || null;
}

/** “加上购物车 tab” — tab being added, not 首页 as context. */
function matchAddTabSlot(text: string): string | null {
  if (!/(?:加上|加个|添加|新增|加\s*一?\s*个)/.test(text)) return null;
  if (/购物车/.test(text)) return "cart";
  if (/订单/.test(text)) return "orders";
  if (/分类|类目/.test(text)) return "category";
  if (/排行|热榜/.test(text)) return "rank";
  if (/历史/.test(text)) return "history";
  if (/搜索/.test(text)) return "search";
  if (/我的/.test(text)) return "user";
  if (/推荐/.test(text)) return "recommend";
  return null;
}

function matchTabSlot(text: string): string | null {
  if (!/改|换|用|成/.test(text)) return null;
  if (/首页|主页|\bhome\b/i.test(text)) return "home";
  if (/分类|类目/.test(text) && /tab|标签|页/.test(text)) return "category";
  if (/排行|热榜/.test(text) && /tab|标签/.test(text)) return "rank";
  if (/我的(?:\s*tab)?/.test(text) && /tab|标签/.test(text)) return "user";
  if (/购物车(?:\s*tab)?/.test(text)) return "cart";
  return null;
}

function matchJumpSlot(text: string): string | null {
  if (/点进去|点击跳转|打开条目|点商品|点视频|条目跳转/.test(text)) {
    return "openRow";
  }
  if (/跳转/.test(text) && /播放|详情|明细/.test(text)) return "openRow";
  if (/搜索/.test(text) && /改成|换成|跳转/.test(text) && !/tab/.test(text)) {
    return "openSearch";
  }
  if (/扫码/.test(text) && /改成|换成/.test(text)) return "openScan";
  if (/(结算|下单)/.test(text) && /改成|跳转/.test(text)) return "openCheckout";
  return null;
}

function navPatchFromMessage(
  text: string,
  ctx?: { app?: string | null },
): ChatPagePatch | null {
  if (/布局|隐藏.+列/.test(text) && !/tab|跳转|点进去|首页/.test(text)) {
    return null;
  }
  const fallback = (ctx?.app || "data") as LayoutApp;
  const addSlot = matchAddTabSlot(text);
  if (addSlot) {
    const spec = specFromUserPhrase(text, fallback);
    const app =
      addSlot === "cart" || addSlot === "orders"
        ? spec.app === "data"
          ? "commerce"
          : spec.app
        : spec.app;
    return {
      navTabOp: "add",
      navTab: { slot: addSlot, app, page: addSlot },
    };
  }
  const jump = matchJumpSlot(text);
  const tab = matchTabSlot(text);
  if (!jump && !tab) return null;
  const dest = destPhrase(text) || text;
  const spec = specFromUserPhrase(dest, fallback);
  if (jump) return { navJump: { slot: jump, app: spec.app, page: spec.page } };
  if (tab) {
    return {
      navTabOp: "set",
      navTab: { slot: tab, app: spec.app, page: spec.page },
    };
  }
  return null;
}

function columnHints(text: string, re: RegExp): string[] {
  const out: string[] = [];
  const g = new RegExp(
    re.source,
    re.flags.includes("g") ? re.flags : `${re.flags}g`,
  );
  let m: RegExpExecArray | null;
  while ((m = g.exec(text))) {
    const raw = (m[1] || "").trim();
    if (raw) out.push(raw.replace(/[“”"'`]/g, ""));
  }
  return out;
}

function wantsChange(text: string): boolean {
  return /改|换|用|切|成|调|布局|显示/.test(text);
}

/** True when 表格/table is the destination, not “把表格改成…”. */
function targetsTable(text: string): boolean {
  return (
    /改成\s*表格|换成\s*表格|用\s*表格|表格布局|表格视图|\b(?:to|into)\s+(?:a\s+)?table\b/i.test(
      text,
    ) && !/表格改成|把表格|将表格/.test(text)
  );
}

function targetsList(text: string): boolean {
  return (
    /改成\s*列表|换成\s*列表|列表布局|列表视图|\b(?:to|into)\s+(?:a\s+)?list\b/i.test(
      text,
    ) && !/联系人/.test(text)
  );
}

/**
 * Map a user edit like “改成联系人列表布局” onto layout/display fields.
 */
export function chatPagePatchFromMessage(
  message: string,
  ctx?: { app?: string | null },
): ChatPagePatch | null {
  const text = message.trim();
  const nav = navPatchFromMessage(text, ctx);
  if (nav) return nav;
  const ui: ChatPagePatch = {};

  if (/联系人|通讯录|address\s*book|\bcontacts?\b/i.test(text)) {
    ui.layoutApp = /社交|朋友圈/.test(text) ? "social" : "chat";
    ui.layoutPage = "users";
  } else if (
    /卡片|网格|宫格|\bgrid\b|\bcards?\b/i.test(text) &&
    wantsChange(text)
  ) {
    ui.displayKind = "grid";
    ui.catalogStyle = "grid";
  } else if (targetsTable(text)) {
    ui.displayKind = "table";
    ui.catalogStyle = "list";
    ui.layoutApp = "data";
    ui.layoutPage = "table";
  } else if (targetsList(text)) {
    ui.displayKind = "list";
    ui.catalogStyle = "list";
  } else if (/环形|甜甜圈|\bdoughnut\b/i.test(text)) {
    ui.displayKind = "doughnut";
  } else if (/饼图|\bpie\b/i.test(text)) {
    ui.displayKind = "pie";
  } else if (/面积图|\barea\b/i.test(text) && wantsChange(text)) {
    ui.displayKind = "area";
  } else if (/折线|\bline chart\b|\bline graph\b/i.test(text)) {
    ui.displayKind = "line";
  } else if (/条形|横向柱|\bhbar\b/i.test(text)) {
    ui.displayKind = "hbar";
  } else if (/柱状|柱形|\bbar chart\b|图表/.test(text) && wantsChange(text)) {
    ui.displayKind = /组合|一起/.test(text) ? "combined" : "bar";
  }

  const hide = [
    ...columnHints(
      text,
      /隐藏\s*([A-Za-z_\u4e00-\u9fff][\w\u4e00-\u9fff]*)\s*列?/,
    ),
    ...columnHints(text, /hide\s+(?:the\s+)?([A-Za-z_][\w]*)/i),
  ];
  const show = [
    ...columnHints(
      text,
      /(?:只显示|只要)\s*([A-Za-z_\u4e00-\u9fff][\w\u4e00-\u9fff]*)\s*列?/,
    ),
    ...columnHints(text, /show\s+only\s+(?:the\s+)?([A-Za-z_][\w]*)/i),
  ];
  if (hide.length) ui.hideColumns = hide;
  if (show.length) ui.showColumns = show;
  return Object.keys(ui).length ? ui : null;
}

export function chatPatchLooksLikeDump(text: string): boolean {
  return (
    /Current GET bind/.test(text) ||
    /I can change this page/.test(text) ||
    /This is Ask mode/.test(text)
  );
}
