/**
 * Chat modes (Cursor-like):
 * generate = new bind/page · modify = patch the open page in place · explain = text only.
 */
import { SCHEMA_DICT } from "./schema-dict.js";
import {
  layoutAppForSkill,
  matchSkills,
  peekSkills,
  skillsPromptBlock,
} from "./skills.js";
import { resolveLlmConfig, type LlmConfig } from "./llm-config.js";
import {
  isWritePlanKind,
  makeCreatePlan,
  makeDetailPlan,
  makeListPlan,
  type BootstrapPlan,
} from "./intent.js";

export type ChatMode = "generate" | "modify" | "explain" | "write" | "action";

export type PageChatContext = {
  pageId?: string | null;
  title?: string | null;
  app?: string | null;
  page?: string | null;
  table?: string | null;
  pageKind?: "list" | "detail" | "create" | null;
  columns?: string[];
  bind?: {
    method?: string;
    url?: string;
    bodyTemplate?: Record<string, unknown>;
  } | null;
  generatePage?: boolean;
  targetApp?: string | null;
  targetPage?: string | null;
  /** UI radio: auto classifies; generate / modify / explain force that path. */
  preferredMode?: "auto" | "generate" | "modify" | "explain" | null;
  displayKind?: string | null;
  catalogStyle?: "grid" | "list" | null;
  columnOrder?: string[];
  columnMetas?: Record<
    string,
    { visible?: boolean; displayName?: string; show?: string }
  >;
};

/** In-place UI tweaks (layout / columns) — never a new surfaceId. */
export type PageUiPatch = {
  displayKind?: string;
  catalogStyle?: "grid" | "list" | null;
  title?: string;
  layoutApp?: string;
  layoutPage?: string;
  hideColumns?: string[];
  showColumns?: string[];
  columnOrder?: string[];
  navTab?: { slot: string; app: string; page: string };
  navJump?: { slot: string; app: string; page: string };
};

export type ModifyPageResult = {
  body?: Record<string, unknown>;
  title?: string;
  message: string;
  source: "rules" | "llm";
  ui?: PageUiPatch;
};

const APP_ITEM_TABLE: Record<string, string> = {
  music: "Music",
  video: "Video",
  commerce: "Product",
  news: "News",
  info: "Notice",
  blog: "Blog",
  article: "Article",
  social: "Moment",
  chat: "Message",
  campaign: "Activity",
  data: "Employee",
  education: "Course",
  books: "Book",
  comics: "Comic",
  lifestyle: "Local",
  food: "Recipe",
  travel: "Trip",
  sports: "Sport",
  parenting: "Baby",
  health: "Workout",
  auto: "Vehicle",
  jobs: "Job",
  housing: "House",
  beauty: "Beauty",
  photo: "Photo",
  office: "Note",
};

const ENTITY_HINTS: Array<{
  re: RegExp;
  tables: string[];
  apps: string[];
}> = [
  { re: /音乐|歌曲|专辑|\bmusic\b|\bsongs?\b|\btracks?\b/, tables: ["Music"], apps: ["music"] },
  { re: /视频|影片|\bvideos?\b|\bmovies?\b/, tables: ["Video"], apps: ["video"] },
  { re: /商品|电商|货品|\bproducts?\b|\bgoods?\b|\bshop\b/, tables: ["Product"], apps: ["commerce"] },
  { re: /订单|\borders?\b|\bcheckout\b/, tables: ["ShopOrder"], apps: ["commerce"] },
  { re: /地址|\baddress(?:es)?\b/, tables: ["Address"], apps: ["commerce"] },
  { re: /新闻资讯|新闻|\bnews\b/, tables: ["News"], apps: ["news"] },
  { re: /体育资讯|赛事|\bsports?\b|\bmatches?\b/, tables: ["Sport"], apps: ["sports"] },
  { re: /资讯公告|公告|通知|\bnotices?\b/, tables: ["Notice"], apps: ["news"] },
  { re: /资讯|\binfo\b/, tables: ["News"], apps: ["news"] },
  { re: /博客|\bblogs?\b/, tables: ["Blog"], apps: ["blog"] },
  { re: /文章|\barticles?\b/, tables: ["Article"], apps: ["article"] },
  { re: /聊天|私信|会话|\bchats?\b|\bmessages?\b/, tables: ["Message"], apps: ["chat"] },
  { re: /运营活动|促销|\bcampaigns?\b|\bpromos?\b/, tables: ["Activity"], apps: ["campaign"] },
  { re: /员工|花名册|\bemployees?\b|\bstaff\b/, tables: ["Employee"], apps: ["data"] },
  { re: /动态|朋友圈|\bmoments?\b/, tables: ["Moment"], apps: ["social"] },
  { re: /教育学习|课程|网课|\bcourses?\b|\blessons?\b/, tables: ["Course"], apps: ["education"] },
  { re: /老师|讲师|\bteachers?\b|\binstructors?\b/, tables: ["Teacher"], apps: ["education"] },
  { re: /学生|学员|\bstudents?\b/, tables: ["Student"], apps: ["education"] },
  { re: /小说|图书阅读|电子书|\bbooks?\b|\bnovels?\b|\bebooks?\b/, tables: ["Book"], apps: ["books"] },
  { re: /漫画阅读|漫画|\bcomics?\b|\bmanga\b/, tables: ["Comic"], apps: ["comics"] },
  { re: /本地生活|到家|到店|\blocals?\b/, tables: ["Local"], apps: ["lifestyle"] },
  { re: /餐饮美食|菜谱|美食|\brecipes?\b/, tables: ["Recipe"], apps: ["food"] },
  { re: /旅游出行|行程|民宿|\btrips?\b|\bhotels?\b/, tables: ["Trip"], apps: ["travel"] },
  { re: /母婴育儿|育儿|\bparenting\b|\bbaby\b/, tables: ["Baby"], apps: ["parenting"] },
  { re: /健康运动|健身|\bworkouts?\b|\bfitness\b/, tables: ["Workout"], apps: ["health"] },
  { re: /汽车服务|车型|\bvehicles?\b/, tables: ["Vehicle"], apps: ["auto"] },
  { re: /招聘求职|职位|\bjobs?\b|\brecruit/, tables: ["Job"], apps: ["jobs"] },
  { re: /房产家居|房源|\bhouses?\b|\bestate\b/, tables: ["House"], apps: ["housing"] },
  { re: /美业预约|美发|\bbeauty\b|\bsalons?\b/, tables: ["Beauty"], apps: ["beauty"] },
  { re: /摄影相册|相册|\bphotos?\b|\bgallery\b/, tables: ["Photo"], apps: ["photo"] },
  { re: /办公效率|待办|笔记|\bnotes?\b|\btodos?\b/, tables: ["Note"], apps: ["office"] },
  { re: /用户|\busers?\b/, tables: ["User"], apps: [] },
  { re: /评论|\bcomments?\b/, tables: ["Comment"], apps: [] },
];

export function hasCurrentPage(ctx?: PageChatContext | null): boolean {
  return Boolean(
    ctx?.pageId ||
      (ctx?.bind?.bodyTemplate &&
        typeof ctx.bind.bodyTemplate === "object" &&
        Object.keys(ctx.bind.bodyTemplate).length),
  );
}

export function messageLooksLikePageRequest(message: string): boolean {
  const zh = message.trim();
  return looksLikePageRequest(zh, zh.toLowerCase());
}

function looksLikePageRequest(zh: string, text: string): boolean {
  return (
    /\b(list|show|open|create|view|generate)\b/.test(text) ||
    /列出|查看|打开|生成|创建|新增|发布|详情|排行|首页|分类/.test(zh)
  );
}

function looksLikeDifferentPage(
  zh: string,
  ctx?: PageChatContext | null,
): boolean {
  const curTable = (ctx?.table || "").toLowerCase();
  const curApp = (ctx?.app || "").toLowerCase();
  for (const h of entityHints()) {
    if (!h.re.test(zh)) continue;
    if (curTable && h.tables.some((t) => t.toLowerCase() === curTable)) {
      continue;
    }
    if (curApp && h.apps.includes(curApp)) continue;
    return true;
  }
  return false;
}

function wantsNewPage(zh: string): boolean {
  return /生成(一个|一张|一份)?(新)?(页面|页)|新建(一个)?(页面|页)|另(开|做|生成|建)|再(做|生成|开|建)(一个|一页|一张)?|open a new|create a new page|generate a (new )?page/i.test(
    zh,
  );
}

function wantsAsk(zh: string): boolean {
  return /解释|说明|介绍|什么意思|为什么|怎么用|怎么做|如何|方案|建议|对比|哪种|还是|好不好|值不值得|有没有更好|帮我看看|讨论|规划|这页|这个页|当前页|\bexplain\b|\bwhy\b|\bhow (does|do|can|to|should)\b|what (if|about|is|does)|tell me|should we|recommend|discuss|\bplan\b/.test(
    zh,
  );
}

function wantsEdit(zh: string): boolean {
  if (
    /改一下|改成|改改|换成|换为|加上|加个|去掉|隐藏|只要|筛选|过滤|排序|按.{0,16}排|改布局|调整(一下|这页|布局)|微调|优化|放大|缩小|列宽|add (a )?filter|sort by|hide |show only|change (the )?(sort|filter|layout|order|bind|view)|switch to (grid|list|table|chart)|make (it|this) (a )?(grid|list|table|card)|use (a )?(grid|list|table|chart)|turn (this|it) into/i.test(
      zh,
    )
  ) {
    return true;
  }
  const view = /布局|卡片|网格|宫格|表格|图表|柱状|折线|饼图|list view|grid|chart/.test(
    zh,
  );
  return view && /改|换|用|切|成|调|显示/.test(zh);
}

function wantsGenerate(zh: string, text: string): boolean {
  return (
    /生成.{0,16}页|打开.{0,16}页|查看|列出|列表|详情|排行|首页|分类页|新建|\bgenerate\b|\bcreate (a )?(page|list|form)\b|\blist\b|\bshow\b|\bopen\b/.test(
      zh,
    ) || looksLikePageRequest(zh, text)
  );
}

export function classifyChatMode(
  message: string,
  ctx?: PageChatContext | null,
): ChatMode {
  if (ctx?.generatePage) return "generate";
  const forced = ctx?.preferredMode;
  if (forced === "explain") return "explain";
  if (forced === "modify") return "modify";
  if (forced === "generate") return "generate";

  const zh = message.trim();
  const text = zh.toLowerCase();

  const wantsDelete = /删除|删掉|\bdelete\b|\bremove\b/.test(zh);
  const wantsUpdateComment =
    /(?:把)?评论.+(?:改|更新|编辑)|update comment|edit comment/.test(zh);
  const hasId = /(?:id\s*[=:：]?\s*|#|号)\s*\d+/i.test(zh);
  if ((wantsDelete || wantsUpdateComment) && hasId) return "write";

  const onPage = hasCurrentPage(ctx);
  const different = looksLikeDifferentPage(zh, ctx);
  const ask = wantsAsk(zh);
  const edit = wantsEdit(zh);
  const explicitNew = wantsNewPage(zh);

  if (ask && !edit && !explicitNew) return "explain";

  if (onPage && !explicitNew && !different) {
    if (edit || wantsGenerate(zh, text)) return "modify";
    return "explain";
  }
  if (explicitNew || different || wantsGenerate(zh, text)) return "generate";
  if (onPage) return edit ? "modify" : "explain";
  if (looksLikePageRequest(zh, text)) return "generate";
  return "explain";
}

export function chatModeForPlan(plan: BootstrapPlan): ChatMode {
  if (isWritePlanKind(plan.kind)) return "write";
  const method = plan.propose.method;
  if (method === "put" || method === "delete" || method === "post") {
    if (!plan.bind && !plan.openCreate) return "write";
  }
  if (
    plan.kind === "unknown" &&
    !plan.bind &&
    !Object.keys(plan.propose.body || {}).length
  ) {
    return "explain";
  }
  return "generate";
}

function tableForLayoutNav(app: string, page: string): string | null {
  if (page === "orders" || page === "orderDetail" || page === "order") {
    return "ShopOrder";
  }
  if (page === "address" || page === "addressDetail") return "Address";
  if (page === "category") return "Category";
  if (page === "users" || page === "user" || page === "profile") return "User";
  if (page === "cart") return "Cart";
  const fromSkill = peekSkills().find((s) => s.name === app);
  if (fromSkill?.tableName) return fromSkill.tableName;
  return APP_ITEM_TABLE[app] || null;
}

function orderForLayoutPage(page: string, table: string): string {
  if (page === "rank") {
    if (table === "Music" || table === "Video") return "playCount-";
    if (table === "Product") return "sales-";
    if (table === "News" || table === "Article" || table === "Video") {
      return "viewCount-";
    }
    if (table === "Activity") return "signupCount-";
    return "id-";
  }
  if (page === "history") return "date-";
  if (table === "Category") return "sort+";
  return "date-";
}

function keywordFieldFor(table: string): string {
  if (table === "User" || table === "Employee" || table === "Product") {
    return "name";
  }
  if (table === "Comment" || table === "Message") return "content";
  if (table === "ShopOrder") return "consignee";
  return "title";
}

function createFieldsFor(table: string): Array<{
  key: string;
  label: string;
  path: string;
}> {
  if (table === "Comment") {
    return [
      { key: "content", label: "Content", path: "/Comment/content" },
      { key: "momentId", label: "Moment ID", path: "/Comment/momentId" },
    ];
  }
  if (table === "User") {
    return [{ key: "name", label: "Name", path: "/User/name" }];
  }
  if (table === "Product") {
    return [{ key: "name", label: "Name", path: "/Product/name" }];
  }
  if (table === "Message") {
    return [
      { key: "content", label: "Content", path: "/Message/content" },
    ];
  }
  return [{ key: "title", label: "Title", path: `/${table}/title` }];
}

export function surfaceIdForLayout(app: string, page: string): string {
  return `${app}_${page}`;
}

const APP_FROM_TEXT: Array<{ re: RegExp; app: string }> = [
  { re: /音乐|\bmusic\b/, app: "music" },
  { re: /视频|\bvideo\b/, app: "video" },
  { re: /商品|电商|\bcommerce\b|\bshop\b|\bproduct/, app: "commerce" },
  { re: /新闻|\bnews\b/, app: "news" },
  { re: /体育资讯|赛事|\bsports?\b/, app: "sports" },
  { re: /资讯|公告|\binfo\b|\bnotice/, app: "news" },
  { re: /博客|\bblog\b/, app: "blog" },
  { re: /文章|\barticle/, app: "article" },
  { re: /社交|动态|\bsocial\b|\bmoment/, app: "social" },
  { re: /聊天|\bchat\b|\bmessage/, app: "chat" },
  { re: /运营|活动|\bcampaign/, app: "campaign" },
  { re: /教育|课程|\beducation\b|\bcourses?\b/, app: "education" },
  { re: /小说|图书|电子书|\bbooks?\b|\bnovels?\b/, app: "books" },
  { re: /漫画|\bcomics?\b|\bmanga\b/, app: "comics" },
  { re: /本地生活|到家|到店|\blifestyle\b/, app: "lifestyle" },
  { re: /餐饮|菜谱|美食|\bfood\b|\brecipe/, app: "food" },
  { re: /旅游|行程|\btravel\b|\btrips?\b/, app: "travel" },
  { re: /体育|赛事|\bsports?\b/, app: "sports" },
  { re: /母婴|育儿|\bparenting\b/, app: "parenting" },
  { re: /健康|健身|\bhealth\b|\bfitness\b/, app: "health" },
  { re: /汽车|\bauto\b|\bvehicles?\b/, app: "auto" },
  { re: /招聘|求职|\bjobs?\b/, app: "jobs" },
  { re: /房产|家居|\bhousing\b|\bestate\b/, app: "housing" },
  { re: /美业|美发|\bbeauty\b/, app: "beauty" },
  { re: /摄影|相册|\bphotos?\b/, app: "photo" },
  { re: /办公|笔记|\boffice\b|\bnotes?\b/, app: "office" },
];

const PAGE_FROM_TEXT: Array<{ re: RegExp; page: string }> = [
  { re: /排行|\brank/, page: "rank" },
  { re: /首页|\bhome\b/, page: "home" },
  { re: /推荐|\brecommend/, page: "recommend" },
  { re: /历史|\bhistory/, page: "history" },
  { re: /分类|\bcategor/, page: "category" },
  { re: /搜索|\bsearch/, page: "search" },
  { re: /订单|\borders?\b/, page: "orders" },
  { re: /地址|\baddress/, page: "address" },
  { re: /收藏|\bfavorite/, page: "favorite" },
];

/** Chat text that names a concrete layout page (音乐排行) → one-page plan. */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function entityHints(): Array<{ re: RegExp; tables: string[]; apps: string[] }> {
  const extra = peekSkills()
    .filter((s) => s.tokens.length || s.title || s.tableName)
    .map((s) => {
      const parts = [...s.tokens, s.title, s.titleEn, s.tableName, s.name]
        .filter((x): x is string => Boolean(x && String(x).trim()))
        .map((x) => escapeRe(String(x)));
      if (!parts.length) return null;
      return {
        re: new RegExp(parts.join("|"), "i"),
        tables: s.tableName ? [s.tableName] : [],
        apps: [layoutAppForSkill(s), s.name],
      };
    });
  return [...extra.filter((x): x is NonNullable<typeof x> => Boolean(x)), ...ENTITY_HINTS];
}

function appFromTextHints(): Array<{ re: RegExp; app: string }> {
  const extra = peekSkills().map((s) => {
    const parts = [...s.tokens, s.title, s.titleEn, s.name]
      .filter((x): x is string => Boolean(x && String(x).trim()))
      .map((x) => escapeRe(String(x)));
    if (!parts.length) return null;
    return { re: new RegExp(parts.join("|"), "i"), app: layoutAppForSkill(s) };
  });
  return [...extra.filter((x): x is NonNullable<typeof x> => Boolean(x)), ...APP_FROM_TEXT];
}

export function planFromLayoutMessage(message: string): BootstrapPlan | null {
  const zh = message.trim();
  const app = appFromTextHints().find((x) => x.re.test(zh))?.app;
  const page = PAGE_FROM_TEXT.find((x) => x.re.test(zh))?.page;
  if (!app || !page) return null;
  return planFromLayoutNav({
    generatePage: true,
    targetApp: app,
    targetPage: page,
    app,
    page,
  });
}

export function planFromLayoutNav(
  ctx: PageChatContext,
): BootstrapPlan | null {
  const rawApp = (ctx.targetApp || ctx.app || "").trim();
  const page = (ctx.targetPage || ctx.page || "").trim();
  if (!rawApp || !page) return null;
  const skill = peekSkills().find((s) => s.name === rawApp);
  const app = skill ? layoutAppForSkill(skill) : rawApp;
  const table =
    (ctx.table || "").trim() || tableForLayoutNav(rawApp, page) || "";
  if (!table) return null;
  const surfaceId = surfaceIdForLayout(app, page);
  const title = `${app} ${page}`;

  if (page === "create") {
    return makeCreatePlan({
      table,
      title: `Create ${table}`,
      surfaceId,
      fields: createFieldsFor(table),
    });
  }
  if (
    page === "detail" ||
    page === "player" ||
    page === "profile" ||
    page === "user" ||
    page === "orderDetail" ||
    page === "addressDetail"
  ) {
    return makeDetailPlan({
      table,
      title,
      surfaceId,
      kind: table === "User" ? "get_user" : "unknown",
    });
  }

  const extra =
    table === "Category" && app && app !== "data" ? { app } : undefined;
  return makeListPlan({
    table,
    title,
    surfaceId,
    count: page === "category" ? 50 : 10,
    order: orderForLayoutPage(page, table),
    keywordField: keywordFieldFor(table),
    extra,
  });
}

export function planFromModifiedBind(
  body: Record<string, unknown>,
  ctx: PageChatContext,
  title?: string,
): BootstrapPlan {
  const surfaceId = (ctx.pageId || "page").trim() || "page";
  const table = (ctx.table || "Item").trim() || "Item";
  const isDetail = ctx.pageKind === "detail" || ctx.pageKind === "create";
  if (isDetail) {
    return {
      ...makeDetailPlan({
        table,
        title: title || ctx.title || "Page",
        surfaceId,
      }),
      propose: {
        requestId: `mod_${Date.now().toString(36)}`,
        method: "get",
        body,
        risk: "read",
        rationale: "Modify current page",
      },
    };
  }
  const plan = makeListPlan({
    table,
    title: title || ctx.title || "Page",
    surfaceId,
    keywordField: keywordFieldFor(table),
  });
  plan.propose.body = body;
  plan.propose.rationale = "Modify current page";
  if (plan.bind) plan.bind.bodyTemplate = body;
  return plan;
}

function listTableKey(body: Record<string, unknown>): string | null {
  const list = body["[]"];
  if (!list || typeof list !== "object" || Array.isArray(list)) return null;
  const bucket = list as Record<string, unknown>;
  return (
    Object.keys(bucket).find(
      (k) => k !== "count" && k !== "page" && k !== "join",
    ) || null
  );
}

function ruleModifyBody(
  message: string,
  body: Record<string, unknown>,
): Record<string, unknown> | null {
  const text = message.trim();
  const tableKey = listTableKey(body);
  if (!tableKey) return null;
  const list = body["[]"] as Record<string, unknown>;
  const tableObj = list[tableKey];
  if (!tableObj || typeof tableObj !== "object" || Array.isArray(tableObj)) {
    return null;
  }
  const next = structuredClone(body) as Record<string, unknown>;
  const nextList = next["[]"] as Record<string, unknown>;
  const nextTable = nextList[tableKey] as Record<string, unknown>;
  let changed = false;

  const fieldMatch =
    text.match(/按\s*([A-Za-z_][\w]*)/) ||
    text.match(/sort\s+by\s+([A-Za-z_][\w]*)/i);
  if (fieldMatch) {
    const field = fieldMatch[1];
    const desc =
      /倒序|降序|从高|desc|-/.test(text) || !/升序|从低|asc|\+/.test(text);
    nextTable["@order"] = `${field}${desc ? "-" : "+"}`;
    changed = true;
  }

  const countMatch = text.match(
    /(?:最新|最近|每页|显示)?\s*(\d+)\s*(?:条|行|个|items?|rows?)/i,
  );
  if (countMatch) {
    const n = Number(countMatch[1]);
    if (Number.isFinite(n) && n > 0 && n <= 100) {
      nextList.count = n;
      changed = true;
    }
  }

  return changed ? next : null;
}

const DISPLAY_KIND_SET = new Set([
  "combined",
  "table",
  "list",
  "grid",
  "bar",
  "hbar",
  "line",
  "pie",
  "doughnut",
  "area",
]);

function mergePageUiPatch(
  a?: PageUiPatch | null,
  b?: PageUiPatch | null,
): PageUiPatch | undefined {
  if (!a && !b) return undefined;
  const out: PageUiPatch = { ...(a || {}), ...(b || {}) };
  const hide = [...(a?.hideColumns || []), ...(b?.hideColumns || [])];
  const show = [...(a?.showColumns || []), ...(b?.showColumns || [])];
  if (hide.length) out.hideColumns = [...new Set(hide)];
  if (show.length) out.showColumns = [...new Set(show)];
  if (b?.columnOrder?.length) out.columnOrder = b.columnOrder;
  else if (a?.columnOrder?.length) out.columnOrder = a.columnOrder;
  return Object.keys(out).length ? out : undefined;
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

function destPhrase(text: string): string | null {
  const m = text.match(/(?:改成|换成|改用|变成|改为|跳转到|跳到)\s*(.+)$/);
  const raw = (m?.[1] || "").replace(/[。.!！]+$/, "").trim();
  return raw || null;
}

function matchNavTabSlot(text: string): string | null {
  if (!/改|换|用|成/.test(text)) return null;
  if (/首页|主页|\bhome\b/i.test(text)) return "home";
  if (/分类|类目/.test(text) && /tab|标签|页/.test(text)) return "category";
  if (/排行|热榜/.test(text) && /tab|标签/.test(text)) return "rank";
  if (/我的(?:\s*tab)?/.test(text) && /tab|标签/.test(text)) return "user";
  if (/购物车(?:\s*tab)?/.test(text)) return "cart";
  return null;
}

function matchNavJumpSlot(text: string): string | null {
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

const PAGE_HINTS: Array<{ re: RegExp; page: string }> = [
  { re: /播放/, page: "player" },
  { re: /详情|明细/, page: "detail" },
  { re: /排行|热榜/, page: "rank" },
  { re: /分类|类目/, page: "category" },
  { re: /首页|主页/, page: "home" },
  { re: /搜索/, page: "search" },
  { re: /购物车/, page: "cart" },
  { re: /结算|下单/, page: "order" },
  { re: /动态|信息流|feed/i, page: "feed" },
];

function specFromNavPhrase(
  phrase: string,
  fallbackApp: string,
): { app: string; page: string } {
  const hay = phrase.trim();
  let app = fallbackApp || "data";
  for (const hint of ENTITY_HINTS) {
    if (hint.apps[0] && hint.re.test(hay)) {
      app = hint.apps[0];
      break;
    }
  }
  let page = "home";
  for (const hint of PAGE_HINTS) {
    if (hint.re.test(hay)) {
      page = hint.page;
      break;
    }
  }
  return { app, page };
}

function navUiPatchFromMessage(
  text: string,
  ctx?: PageChatContext | null,
): PageUiPatch | null {
  if (/布局|隐藏.+列/.test(text) && !/tab|跳转|点进去|首页/.test(text)) {
    return null;
  }
  const jump = matchNavJumpSlot(text);
  const tab = matchNavTabSlot(text);
  if (!jump && !tab) return null;
  const dest = destPhrase(text) || text;
  const spec = specFromNavPhrase(dest, ctx?.app || ctx?.targetApp || "data");
  if (jump) return { navJump: { slot: jump, app: spec.app, page: spec.page } };
  if (tab) return { navTab: { slot: tab, app: spec.app, page: spec.page } };
  return null;
}

/** Deterministic layout/column tweaks from chat text (no LLM). */
export function pageUiPatchFromMessage(
  message: string,
  ctx?: PageChatContext | null,
): PageUiPatch | null {
  const text = message.trim();
  const nav = navUiPatchFromMessage(text, ctx);
  if (nav) return nav;
  const ui: PageUiPatch = {};
  if (/联系人|通讯录|address\s*book|\bcontacts?\b/i.test(text)) {
    ui.layoutApp = /社交|朋友圈/.test(text) ? "social" : "chat";
    ui.layoutPage = "users";
  } else if (
    /卡片|网格|宫格|\bgrid\b|\bcards?\b/i.test(text) &&
    /改|换|用|切|布局|显示|成/.test(text)
  ) {
    ui.displayKind = "grid";
    ui.catalogStyle = "grid";
  } else if (
    /改成\s*表格|换成\s*表格|用\s*表格|表格布局|表格视图|\b(?:to|into)\s+(?:a\s+)?table\b/i.test(
      text,
    ) && !/表格改成|把表格|将表格/.test(text)
  ) {
    ui.displayKind = "table";
    ui.catalogStyle = "list";
    ui.layoutApp = "data";
    ui.layoutPage = "table";
  } else if (
    /改成\s*列表|换成\s*列表|列表布局|列表视图|\b(?:to|into)\s+(?:a\s+)?list\b/i.test(
      text,
    ) && !/联系人/.test(text)
  ) {
    ui.displayKind = "list";
    ui.catalogStyle = "list";
  } else if (/环形|甜甜圈|\bdoughnut\b/i.test(text)) {
    ui.displayKind = "doughnut";
  } else if (/饼图|\bpie\b/i.test(text)) {
    ui.displayKind = "pie";
  } else if (/面积图|\barea\b/i.test(text)) {
    ui.displayKind = "area";
  } else if (/折线|\bline chart\b|\bline graph\b/i.test(text)) {
    ui.displayKind = "line";
  } else if (/条形|横向柱|\bhbar\b/i.test(text)) {
    ui.displayKind = "hbar";
  } else if (/柱状|柱形|\bbar chart\b|\bchart\b|图表/.test(text)) {
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
    ...columnHints(text, /show\s+(?:only\s+)?(?:the\s+)?([A-Za-z_][\w]*)/i),
  ];
  if (hide.length) ui.hideColumns = hide;
  if (show.length) ui.showColumns = show;
  void ctx;
  return Object.keys(ui).length ? ui : null;
}

function patchMessage(ui: PageUiPatch): string {
  if (ui.navTab) {
    return `Updated the ${ui.navTab.slot} tab to ${ui.navTab.app}/${ui.navTab.page}.`;
  }
  if (ui.navJump) {
    return `Updated the ${ui.navJump.slot} jump to ${ui.navJump.app}/${ui.navJump.page}.`;
  }
  if (ui.layoutPage === "users") {
    return "Updated this page to a contacts list layout. Same data, no new page.";
  }
  if (ui.displayKind === "grid") {
    return "Updated this page to a card/grid layout.";
  }
  if (ui.displayKind === "table") {
    return "Updated this page to a table layout.";
  }
  if (ui.displayKind === "list") {
    return "Updated this page to a list layout.";
  }
  if (ui.hideColumns?.length) {
    return `Hid column(s): ${ui.hideColumns.join(", ")}.`;
  }
  return "Updated the current page layout.";
}

function bindBodiesEqual(
  a?: Record<string, unknown> | null,
  b?: Record<string, unknown> | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

async function llmJson(
  llm: LlmConfig | null | undefined,
  system: string,
  user: string,
): Promise<Record<string, unknown> | null> {
  const { apiKey, baseUrl, model, language } = resolveLlmConfig(llm);
  if (!apiKey) return null;
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${system}\nReply language: ${language}.` },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function explainCurrentPage(
  message: string,
  ctx: PageChatContext | undefined,
  llm?: LlmConfig | null,
  history?: Array<{ role: string; content: string }>,
): Promise<string> {
  const parsed = await llmJson(
    llm,
    `You are a coding assistant for the user's current data page (Ask mode — like Cursor Ask).
Discuss the open page, compare layout/query options, and plan changes.
Do not generate a new page, a new surfaceId, or an APIJSON body.
If they want the change applied, explain the plan and tell them to switch to Edit (修改/编辑页面) or say “按这个改”.
Return JSON: { "message": "..." } only.
${SCHEMA_DICT}${skillsPromptBlock(
      matchSkills(
        { prompt: message, table: ctx?.table, app: ctx?.app },
        peekSkills(),
      ),
    )}`,
    JSON.stringify({
      user: message,
      history: (history || []).slice(-8),
      page: ctx
        ? {
            id: ctx.pageId,
            title: ctx.title,
            app: ctx.app,
            page: ctx.page,
            table: ctx.table,
            pageKind: ctx.pageKind,
            columns: ctx.columns,
            displayKind: ctx.displayKind,
            catalogStyle: ctx.catalogStyle,
            columnOrder: ctx.columnOrder,
            columnMetas: ctx.columnMetas,
            bind: ctx.bind,
          }
        : null,
    }),
  );
  const fromLlm =
    parsed && typeof parsed.message === "string" ? parsed.message.trim() : "";
  if (fromLlm) return fromLlm;
  return fallbackExplain(message, ctx);
}

function fallbackExplain(
  message: string,
  ctx?: PageChatContext,
): string {
  if (!hasCurrentPage(ctx)) {
    return "No page is open. Switch to Generate and ask to list a table (for example “List music”), or open a layout page. Ask mode only discusses — it does not create pages.";
  }
  const label = [ctx?.title, ctx?.app && ctx?.page ? `${ctx.app}/${ctx.page}` : ""]
    .filter(Boolean)
    .join(" · ");
  const table = ctx?.table ? ` Primary table: ${ctx.table}.` : "";
  const view = ctx?.displayKind ? ` View: ${ctx.displayKind}.` : "";
  void message;
  return `${label || "Current page"}.${table}${view} This is Ask mode — I can discuss layout, query, and tradeoffs. Switch to Edit to apply changes on this page, or Generate to open a different page.`;
}

export async function modifyPageBind(
  message: string,
  ctx: PageChatContext | undefined,
  llm?: LlmConfig | null,
): Promise<ModifyPageResult | null> {
  const current =
    ctx?.bind?.bodyTemplate && typeof ctx.bind.bodyTemplate === "object"
      ? ctx.bind.bodyTemplate
      : null;
  const uiRuled = pageUiPatchFromMessage(message, ctx);
  const bodyRuled = current ? ruleModifyBody(message, current) : null;

  if (uiRuled && !bodyRuled) {
    return {
      ui: uiRuled,
      message: patchMessage(uiRuled),
      source: "rules",
    };
  }

  const parsed = await llmJson(
    llm,
    `You edit the CURRENT open page in place (like Cursor editing the current file).
Do not create a new page or change surfaceId.
Keep the same primary table unless the user explicitly asks to replace the dataset.
You may update the APIJSON GET body (sort/filter/count/columns) and/or UI:
displayKind = table|list|grid|combined|bar|hbar|line|pie|doughnut|area
catalogStyle = grid|list
hideColumns/showColumns = field paths or names
Never hardcode sample ids.
If the user is only asking for advice, return { "message": "..." } with no body/ui.
Return JSON: { "body": {...} optional, "ui": {...} optional, "title": "optional", "message": "what changed" }
${SCHEMA_DICT}${skillsPromptBlock(
      matchSkills(
        { prompt: message, table: ctx?.table, app: ctx?.app },
        peekSkills(),
      ),
    )}`,
    JSON.stringify({
      user: message,
      currentBind: current,
      page: ctx
        ? {
            id: ctx.pageId,
            title: ctx.title,
            app: ctx.app,
            page: ctx.page,
            table: ctx.table,
            pageKind: ctx.pageKind,
            displayKind: ctx.displayKind,
            catalogStyle: ctx.catalogStyle,
            columns: ctx.columns,
            columnOrder: ctx.columnOrder,
            columnMetas: ctx.columnMetas,
          }
        : null,
    }),
  );

  const llmBody =
    parsed &&
    parsed.body &&
    typeof parsed.body === "object" &&
    !Array.isArray(parsed.body)
      ? (parsed.body as Record<string, unknown>)
      : undefined;
  const llmUiRaw =
    parsed && parsed.ui && typeof parsed.ui === "object" && !Array.isArray(parsed.ui)
      ? (parsed.ui as PageUiPatch)
      : undefined;
  const llmUi = llmUiRaw
    ? {
        ...llmUiRaw,
        displayKind:
          llmUiRaw.displayKind && DISPLAY_KIND_SET.has(llmUiRaw.displayKind)
            ? llmUiRaw.displayKind
            : undefined,
        catalogStyle:
          llmUiRaw.catalogStyle === "grid" || llmUiRaw.catalogStyle === "list"
            ? llmUiRaw.catalogStyle
            : llmUiRaw.catalogStyle === null
              ? null
              : undefined,
      }
    : undefined;
  const ui = mergePageUiPatch(uiRuled, llmUi);
  const body = llmBody || bodyRuled || undefined;
  const bodyChanged = Boolean(body && current && !bindBodiesEqual(current, body));
  const title =
    parsed && typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : undefined;
  const llmMsg =
    parsed && typeof parsed.message === "string" ? parsed.message.trim() : "";

  if (!bodyChanged && !ui && !title) {
    if (llmMsg) return { message: llmMsg, source: "llm" };
    if (uiRuled) {
      return {
        ui: uiRuled,
        message: "Updated the current page layout.",
        source: "rules",
      };
    }
    return null;
  }

  const source: "rules" | "llm" = llmBody || llmUi || llmMsg ? "llm" : "rules";
  return {
    ...(bodyChanged && body ? { body } : {}),
    ...(ui ? { ui } : {}),
    ...(title ? { title } : {}),
    message:
      llmMsg ||
      (ui && !bodyChanged
        ? "Updated the current page layout."
        : "Updated the current page."),
    source,
  };
}
