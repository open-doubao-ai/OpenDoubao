/**
 * Chat is not "always generate a page".
 * generate = new bind/page · modify = change current page · explain = text only.
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
  { re: /资讯公告|公告|通知|\bnotices?\b/, tables: ["Notice"], apps: ["info"] },
  { re: /博客|\bblogs?\b/, tables: ["Blog"], apps: ["blog"] },
  { re: /文章|\barticles?\b/, tables: ["Article"], apps: ["article"] },
  { re: /聊天|私信|会话|\bchats?\b|\bmessages?\b/, tables: ["Message"], apps: ["chat"] },
  { re: /运营活动|促销|\bcampaigns?\b|\bpromos?\b/, tables: ["Activity"], apps: ["campaign"] },
  { re: /员工|花名册|\bemployees?\b|\bstaff\b/, tables: ["Employee"], apps: ["data"] },
  { re: /动态|朋友圈|\bmoments?\b/, tables: ["Moment"], apps: ["social"] },
  { re: /教育学习|课程|网课|\bcourses?\b|\blessons?\b/, tables: ["Course"], apps: ["education"] },
  { re: /图书阅读|电子书|\bbooks?\b|\bebooks?\b/, tables: ["Book"], apps: ["books"] },
  { re: /漫画阅读|漫画|\bcomics?\b|\bmanga\b/, tables: ["Comic"], apps: ["comics"] },
  { re: /本地生活|到家|到店|\blocals?\b/, tables: ["Local"], apps: ["lifestyle"] },
  { re: /餐饮美食|菜谱|美食|\brecipes?\b/, tables: ["Recipe"], apps: ["food"] },
  { re: /旅游出行|行程|民宿|\btrips?\b|\bhotels?\b/, tables: ["Trip"], apps: ["travel"] },
  { re: /体育资讯|赛事|\bsports?\b|\bmatches?\b/, tables: ["Sport"], apps: ["sports"] },
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

export function classifyChatMode(
  message: string,
  ctx?: PageChatContext | null,
): ChatMode {
  if (ctx?.generatePage) return "generate";
  const forced = ctx?.preferredMode;
  if (forced === "generate" || forced === "modify" || forced === "explain") {
    return forced;
  }
  const zh = message.trim();
  const text = zh.toLowerCase();

  const wantsDelete = /删除|删掉|\bdelete\b|\bremove\b/.test(zh);
  const wantsUpdateComment =
    /(?:把)?评论.+(?:改|更新|编辑)|update comment|edit comment/.test(zh);
  const hasId = /(?:id\s*[=:：]?\s*|#|号)\s*\d+/i.test(zh);
  if ((wantsDelete || wantsUpdateComment) && hasId) return "write";

  const explain =
    /解释|说明一下|介绍一下|什么意思|为什么|怎么用|这[个页]页|当前页|帮我看看这|\bexplain\b|what\s+(is|does)|why\s+|how\s+(does|do|can|to)\b|tell me about/.test(
      zh,
    );
  const modify =
    /改一下|改成|换成|加上|去掉|隐藏|显示|只要|筛选|过滤|排序|按.{1,16}排|布局换成|改布局|调整(一下|这页)|add (a )?filter|sort by|hide |show only|change (the )?(sort|filter|layout|order|bind)/i.test(
      zh,
    );
  const generate =
    /生成.{0,16}页|打开.{0,16}页|查看|列出|列表|详情|排行|首页|分类页|新建|\bgenerate\b|\bcreate (a )?(page|list|form)\b|\blist\b|\bshow\b|\bopen\b/.test(
      zh,
    );

  if (explain && !looksLikeDifferentPage(zh, ctx)) return "explain";
  if (modify && hasCurrentPage(ctx) && !looksLikeDifferentPage(zh, ctx)) {
    return "modify";
  }
  if (generate || looksLikeDifferentPage(zh, ctx)) return "generate";
  if (hasCurrentPage(ctx)) return modify ? "modify" : "explain";
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

function tableForLayoutNav(app: string, page: string): string {
  if (page === "orders" || page === "orderDetail" || page === "order") {
    return "ShopOrder";
  }
  if (page === "address" || page === "addressDetail") return "Address";
  if (page === "category") return "Category";
  if (page === "users" || page === "user" || page === "profile") return "User";
  if (page === "cart") return "Cart";
  const fromSkill = peekSkills().find((s) => s.name === app);
  if (fromSkill?.tableName) return fromSkill.tableName;
  return APP_ITEM_TABLE[app] || "Moment";
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
  { re: /资讯|公告|\binfo\b|\bnotice/, app: "info" },
  { re: /博客|\bblog\b/, app: "blog" },
  { re: /文章|\barticle/, app: "article" },
  { re: /社交|动态|\bsocial\b|\bmoment/, app: "social" },
  { re: /聊天|\bchat\b|\bmessage/, app: "chat" },
  { re: /运营|活动|\bcampaign/, app: "campaign" },
  { re: /教育|课程|\beducation\b|\bcourses?\b/, app: "education" },
  { re: /图书|电子书|\bbooks?\b/, app: "books" },
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
  const table = tableForLayoutNav(rawApp, page);
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

function ruleModifyBody(
  message: string,
  body: Record<string, unknown>,
): Record<string, unknown> | null {
  const text = message.trim();
  const list = body["[]"];
  if (!list || typeof list !== "object" || Array.isArray(list)) return null;
  const bucket = list as Record<string, unknown>;
  const tableKey = Object.keys(bucket).find(
    (k) => k !== "count" && k !== "page" && k !== "join",
  );
  if (!tableKey) return null;
  const tableObj = bucket[tableKey];
  if (!tableObj || typeof tableObj !== "object" || Array.isArray(tableObj)) {
    return null;
  }
  const fieldMatch =
    text.match(/按\s*([A-Za-z_][\w]*)/) ||
    text.match(/sort\s+by\s+([A-Za-z_][\w]*)/i);
  if (!fieldMatch) return null;
  const field = fieldMatch[1];
  const desc = /倒序|降序|从高|desc|-/.test(text) || !/升序|从低|asc|\+/.test(text);
  const next = structuredClone(body) as Record<string, unknown>;
  const nextList = next["[]"] as Record<string, unknown>;
  const nextTable = nextList[tableKey] as Record<string, unknown>;
  nextTable["@order"] = `${field}${desc ? "-" : "+"}`;
  return next;
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
): Promise<string> {
  const parsed = await llmJson(
    llm,
    `You explain or discuss the user's current data page. Do not generate a new page or APIJSON body.
Return JSON: { "message": "..." } only.
${SCHEMA_DICT}${skillsPromptBlock(
      matchSkills(
        { prompt: message, table: ctx?.table, app: ctx?.app },
        peekSkills(),
      ),
    )}`,
    JSON.stringify({
      user: message,
      page: ctx
        ? {
            id: ctx.pageId,
            title: ctx.title,
            app: ctx.app,
            page: ctx.page,
            table: ctx.table,
            pageKind: ctx.pageKind,
            columns: ctx.columns,
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
    return "No page is open. Ask to list a table (for example “List music”), or open a layout page so I can generate that one page.";
  }
  const label = [ctx?.title, ctx?.app && ctx?.page ? `${ctx.app}/${ctx.page}` : ""]
    .filter(Boolean)
    .join(" · ");
  const table = ctx?.table ? ` Primary table: ${ctx.table}.` : "";
  const bind = ctx?.bind?.bodyTemplate
    ? ` Current GET bind: ${JSON.stringify(ctx.bind.bodyTemplate)}.`
    : "";
  void message;
  return `${label || "Current page"}.${table}${bind} I can change this page’s query/layout if you say how, or generate a different page if you name it.`;
}

export async function modifyPageBind(
  message: string,
  ctx: PageChatContext | undefined,
  llm?: LlmConfig | null,
): Promise<{
  body: Record<string, unknown>;
  title?: string;
  message: string;
  source: "rules" | "llm";
} | null> {
  const current = ctx?.bind?.bodyTemplate;
  if (!current || typeof current !== "object") return null;

  const parsed = await llmJson(
    llm,
    `You update the CURRENT page's APIJSON GET body. Do not create a new page or change surfaceId.
Keep the same primary table unless the user asks to switch it.
Never hardcode sample ids.
Return JSON: { "body": {...}, "title": "optional", "message": "what changed" }
${SCHEMA_DICT}${skillsPromptBlock(
      matchSkills(
        { prompt: message, table: ctx?.table, app: ctx?.app },
        peekSkills(),
      ),
    )}`,
    JSON.stringify({ user: message, currentBind: current, page: ctx }),
  );
  if (parsed && parsed.body && typeof parsed.body === "object" && !Array.isArray(parsed.body)) {
    return {
      body: parsed.body as Record<string, unknown>,
      title: typeof parsed.title === "string" ? parsed.title : undefined,
      message:
        typeof parsed.message === "string" && parsed.message.trim()
          ? parsed.message.trim()
          : "Updated the current page bind.",
      source: "llm",
    };
  }

  const ruled = ruleModifyBody(message, current);
  if (ruled) {
    return {
      body: ruled,
      message: "Updated the current page sort from your message.",
      source: "rules",
    };
  }
  return null;
}
