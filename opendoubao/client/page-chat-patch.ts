/**
 * Deterministic in-place page edits from chat text (no LLM).
 * Used by Edit mode on the client so layout changes apply even if the API
 * falls back to an explain dump.
 */

export type ChatPagePatch = {
  displayKind?: string;
  catalogStyle?: "grid" | "list" | null;
  title?: string;
  layoutApp?: string;
  layoutPage?: string;
  hideColumns?: string[];
  showColumns?: string[];
  columnOrder?: string[];
};

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
  _ctx?: { app?: string | null },
): ChatPagePatch | null {
  const text = message.trim();
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
