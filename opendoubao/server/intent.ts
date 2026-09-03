import {
  A2API_VERSION,
  type BindRequestPayload,
  type ProposeRequestPayload,
  riskForMethod,
} from "@a2api/protocol";

export type ViewMode = "list" | "detail";

export interface BootstrapPlan {
  kind:
    | "list_moments"
    | "list_users"
    | "list_comments"
    | "get_user"
    | "get_moment"
    | "get_comment"
    | "create_moment"
    | "create_comment"
    | "create_table"
    | "list_table"
    | "update_comment"
    | "delete_comment"
    | "unknown";
  title: string;
  /** list = paginated table; detail = single-record form only */
  viewMode: ViewMode;
  propose: ProposeRequestPayload;
  bind?: BindRequestPayload;
  a2uiHint: {
    surfaceId: string;
    filters: Array<{ key: string; label: string; type: "text" | "number" | "select"; options?: string[] }>;
  };
  /** Optional write fields for forms */
  writeForm?: {
    fields: Array<{ key: string; label: string; path: string }>;
    defaults?: Record<string, unknown>;
  };
  /** Open empty Add/create detail form (no Table). Prefer with viewMode detail and no bind. */
  openCreate?: boolean;
}

function rid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

const DEFAULT_BASE = process.env.APIJSON_BASE_URL ?? "http://localhost:8080";

const PAGE_COUNTS = [5, 10, 15, 20, 50, 100];

type LayoutEntity = {
  table: string;
  title: string;
  keywordField: string;
  createFields: Array<{ key: string; label: string; path: string }>;
  about: (zh: string, text: string) => boolean;
};

/** Business layout tables (User / Moment / Comment stay on dedicated plans). */
const LAYOUT_ENTITIES: LayoutEntity[] = [
  {
    table: "Cart",
    title: "Cart",
    keywordField: "title",
    createFields: [
      { key: "title", label: "Title", path: "/Cart/title" },
      { key: "productId", label: "Product ID", path: "/Cart/productId" },
    ],
    about: (zh) => /购物车|\bcarts?\b|\bbasket\b/.test(zh),
  },
  {
    table: "ShopOrder",
    title: "Order List",
    keywordField: "consignee",
    createFields: [
      { key: "consignee", label: "Name", path: "/ShopOrder/consignee" },
      { key: "phone", label: "Phone", path: "/ShopOrder/phone" },
      { key: "address", label: "Address", path: "/ShopOrder/address" },
    ],
    about: (zh) => /订单|下单|结算|\borders?\b|\bcheckout\b/.test(zh),
  },
  {
    table: "Product",
    title: "Product List",
    keywordField: "name",
    createFields: [{ key: "name", label: "Name", path: "/Product/name" }],
    about: (zh) => /商品|电商|货品|\bproducts?\b|\bgoods\b|\bshop\b/.test(zh),
  },
  {
    table: "Music",
    title: "Music List",
    keywordField: "title",
    createFields: [
      { key: "title", label: "Title", path: "/Music/title" },
      { key: "audioUrl", label: "Audio URL", path: "/Music/audioUrl" },
    ],
    about: (zh) => /音乐|歌曲|专辑|\bmusic\b|\bsongs?\b|\btracks?\b|\baudio\b/.test(zh),
  },
  {
    table: "Video",
    title: "Video List",
    keywordField: "title",
    createFields: [
      { key: "title", label: "Title", path: "/Video/title" },
      { key: "videoUrl", label: "Video URL", path: "/Video/videoUrl" },
    ],
    about: (zh) => /视频|影片|\bvideos?\b|\bmovies?\b|\bvod\b/.test(zh),
  },
  {
    table: "Article",
    title: "Article List",
    keywordField: "title",
    createFields: [{ key: "title", label: "Title", path: "/Article/title" }],
    about: (zh) => /文章|\barticles?\b|\bessays?\b/.test(zh),
  },
  {
    table: "Blog",
    title: "Blog List",
    keywordField: "title",
    createFields: [{ key: "title", label: "Title", path: "/Blog/title" }],
    about: (zh) => /博客|\bblogs?\b/.test(zh),
  },
  {
    table: "News",
    title: "News List",
    keywordField: "title",
    createFields: [{ key: "title", label: "Title", path: "/News/title" }],
    about: (zh) => /新闻|资讯|\bnews\b|\bheadlines?\b/.test(zh),
  },
  {
    table: "Notice",
    title: "Notice List",
    keywordField: "title",
    createFields: [{ key: "title", label: "Title", path: "/Notice/title" }],
    about: (zh) => /公告|通知|\bnotices?\b|\bannouncements?\b/.test(zh),
  },
  {
    table: "Book",
    title: "Novel List",
    keywordField: "title",
    createFields: [{ key: "title", label: "Title", path: "/Book/title" }],
    about: (zh) => /小说|图书|电子书|\bbooks?\b|\bnovels?\b|\bebooks?\b/.test(zh),
  },
  {
    table: "Comic",
    title: "Comic List",
    keywordField: "title",
    createFields: [{ key: "title", label: "Title", path: "/Comic/title" }],
    about: (zh) => /漫画|\bcomics?\b|\bmanga\b/.test(zh),
  },
  {
    table: "Message",
    title: "Message List",
    keywordField: "content",
    createFields: [
      { key: "content", label: "Content", path: "/Message/content" },
      { key: "toUserId", label: "To user id", path: "/Message/toUserId" },
    ],
    about: (zh) => /聊天|私信|会话|消息|\bchats?\b|\bmessages?\b|\binbox\b/.test(zh),
  },
  {
    table: "Activity",
    title: "Campaign List",
    keywordField: "title",
    createFields: [{ key: "title", label: "Title", path: "/Activity/title" }],
    about: (zh) => /运营活动|促销|campaign|\bpromos?\b|\bactivities\b/.test(zh) ||
      (/活动/.test(zh) && !/动态/.test(zh)),
  },
  {
    table: "Employee",
    title: "Employee List",
    keywordField: "name",
    createFields: [{ key: "name", label: "Name", path: "/Employee/name" }],
    about: (zh) => /员工|花名册|数据管理|\bemployees?\b|\bstaff\b/.test(zh),
  },
];

function parseListCount(zh: string, text: string, fallback = 10): number {
  const countMatch =
    zh.match(/(\d+)\s*条/) ||
    text.match(/\b(?:last|recent|top)\s+(\d+)\b/) ||
    text.match(
      /(\d+)\s+(?:moments?|items?|records?|rows?|employees?|products?|videos?|songs?|articles?|blogs?|messages?)\b/,
    );
  const asked = countMatch ? Number(countMatch[1]) : fallback;
  return PAGE_COUNTS.includes(asked) ? asked : fallback;
}

function matchLayoutEntity(zh: string, text: string): LayoutEntity | null {
  const hay = `${zh} ${text}`;
  return LAYOUT_ENTITIES.find((e) => e.about(hay, text)) ?? null;
}

export function makeListPlan(opts: {
  table: string;
  title: string;
  surfaceId: string;
  count?: number;
  order?: string;
  keywordField?: string;
  extra?: Record<string, unknown>;
  kind?: BootstrapPlan["kind"];
}): BootstrapPlan {
  const table = opts.table;
  const count = opts.count ?? 10;
  const order = opts.order || "date-";
  const keywordField = opts.keywordField || "title";
  const requestId = rid(`list_${table.toLowerCase()}`);
  const body = {
    "[]": {
      count,
      page: 0,
      [table]: { "@order": order, ...(opts.extra ?? {}) },
    },
  };
  return {
    kind: opts.kind ?? "list_table",
    title: opts.title,
    viewMode: "list",
    propose: {
      requestId,
      method: "get",
      body,
      risk: riskForMethod("get"),
      rationale: `List ${table}`,
    },
    bind: {
      bindingId: opts.surfaceId,
      method: "get",
      url: `${DEFAULT_BASE}/get`,
      bodyTemplate: body,
      paramMap: [
        { from: "/ui/page", to: "/[]/page" },
        { from: "/ui/count", to: "/[]/count" },
        { from: "/ui/order", to: `/[]/${table}/@order` },
        { from: "/ui/keyword", to: `/[]/${table}/${keywordField}$` },
      ],
      resultPath: "/rows",
      triggerActions: ["search", "page_change", "sort_change"],
    },
    a2uiHint: {
      surfaceId: opts.surfaceId,
      filters: [
        { key: "keyword", label: "Keyword", type: "text" },
        { key: "count", label: "Page size", type: "number" },
        { key: "page", label: "Page", type: "number" },
        {
          key: "order",
          label: "Sort",
          type: "select",
          options: [order, "date-", "date+", "id-", "id+"].filter(
            (v, i, a) => a.indexOf(v) === i,
          ),
        },
      ],
    },
  };
}

export function makeCreatePlan(opts: {
  table: string;
  title: string;
  surfaceId: string;
  fields: Array<{ key: string; label: string; path: string }>;
}): BootstrapPlan {
  const requestId = rid(`create_${opts.table.toLowerCase()}`);
  return {
    kind: "create_table",
    title: opts.title,
    viewMode: "detail",
    openCreate: true,
    propose: {
      requestId,
      method: "get",
      body: { [opts.table]: {} },
      risk: "read",
      rationale: `Open empty ${opts.table} create form`,
    },
    a2uiHint: { surfaceId: opts.surfaceId, filters: [] },
    writeForm: { fields: opts.fields },
  };
}

export function makeDetailPlan(opts: {
  table: string;
  title: string;
  surfaceId: string;
  kind?: BootstrapPlan["kind"];
}): BootstrapPlan {
  return {
    kind: opts.kind ?? (opts.table === "User" ? "get_user" : "unknown"),
    title: opts.title,
    viewMode: "detail",
    propose: {
      requestId: rid(`get_${opts.table.toLowerCase()}`),
      method: "get",
      body: { [opts.table]: {} },
      risk: "read",
      rationale: `Get ${opts.table} detail`,
    },
    a2uiHint: { surfaceId: opts.surfaceId, filters: [] },
  };
}

export function makeUnknownPlan(): BootstrapPlan {
  return {
    kind: "unknown",
    title: "Chat",
    viewMode: "list",
    propose: {
      requestId: rid("chat"),
      method: "get",
      body: {},
      risk: "read",
      rationale: "No page to generate",
    },
    a2uiHint: { surfaceId: "chat", filters: [] },
  };
}

export function isWritePlanKind(kind: BootstrapPlan["kind"]): boolean {
  return kind === "update_comment" || kind === "delete_comment";
}

function slugTable(table: string): string {
  const s = table.trim();
  if (!s) return "page";
  return s.charAt(0).toLowerCase() + s.slice(1).replace(/[^A-Za-z0-9_]/g, "");
}

/** Build a list/detail/create plan after the user (or live catalog) confirmed a table. */
export function planFromResolvedTable(opts: {
  table: string;
  message: string;
  keywordField?: string;
  order?: string;
}): BootstrapPlan {
  const table = opts.table.trim();
  const zh = opts.message.trim();
  const slug = slugTable(table);
  const wantsCreate =
    /新增|创建|发一条|发布|\bcreate\b|\badd\b|\bpublish\b/i.test(zh);
  const wantsDetail =
    /详情|资料|主页|\bdetail\b|\bprofile\b/i.test(zh) &&
    !/列表|\blist\b/i.test(zh);
  const field = opts.keywordField || "title";
  if (wantsCreate) {
    return makeCreatePlan({
      table,
      title: `Create ${table}`,
      surfaceId: `${slug}_create`,
      fields: [{ key: field, label: field, path: `/${table}/${field}` }],
    });
  }
  if (wantsDetail) {
    return makeDetailPlan({
      table,
      title: `${table} Detail`,
      surfaceId: `${slug}_detail`,
    });
  }
  return makeListPlan({
    table,
    title: `${table} List`,
    surfaceId: `${slug}_list`,
    keywordField: field,
    order: opts.order,
  });
}

function listTablePlan(entity: LayoutEntity, count: number): BootstrapPlan {
  return makeListPlan({
    table: entity.table,
    title: entity.title,
    surfaceId: `${entity.table.toLowerCase()}_list`,
    count,
    keywordField: entity.keywordField,
  });
}

function createTablePlan(entity: LayoutEntity): BootstrapPlan {
  return makeCreatePlan({
    table: entity.table,
    title: `Create ${entity.table}`,
    surfaceId: `${entity.table.toLowerCase()}_create`,
    fields: entity.createFields,
  });
}

/** Extract numeric id from Chinese or English entity phrases. */
function matchEntityId(message: string): RegExpMatchArray | null {
  return (
    message.match(/(?:user|moment|comment)\s+id\s*(\d+)/i) ||
    message.match(/(?:id\s*[=:：]?\s*)(\d+)/i) ||
    message.match(/(?:用户|动态|评论|user|moment|comment)\s*[#号]?\s*(\d+)/i) ||
    message.match(/(?:评论|comment)\s+(\d+)/i)
  );
}

/** Extract comment id for write operations. */
function matchCommentId(message: string): RegExpMatchArray | null {
  return (
    message.match(
      /(?:comment\s*(?:id\s*[=:：]?|#)?|评论\s*|id\s*[=:：]?\s*)(\d+)/i,
    ) || message.match(/(?:评论|comment)\s+(\d+)/i)
  );
}

export function planFromIntent(message: string): BootstrapPlan {
  const text = message.trim().toLowerCase();
  const zh = message.trim();

  const wantsDelete =
    /删除|删掉|delete|remove/.test(zh) || /delete|remove/.test(text);
  const wantsUpdate =
    /修改|更新|改成|编辑|update|put|change|edit/.test(zh) ||
    /update|edit|change/.test(text);
  const wantsCreate =
    /新增|创建|发一条|发布|post|create|add|publish/.test(zh) ||
    /create|post|add|publish/.test(text);
  const aboutComment =
    /评论|comment/.test(zh) ||
    /comment/.test(text) ||
    /\bcomments?\b/.test(text);
  const aboutUser =
    /用户|user/.test(zh) ||
    /\busers?\b/.test(text);
  const aboutMoment =
    /动态|moment|朋友圈/.test(zh) ||
    /moment/.test(text) ||
    /\bmoments?\b/.test(text);

  const layoutEntity = matchLayoutEntity(zh, text);

  if (wantsCreate && layoutEntity && !aboutComment && !aboutMoment) {
    return createTablePlan(layoutEntity);
  }

  // Delete / update: never invent id — only when the user typed an explicit id.
  // Template chips must not embed sample ids (permission / OWNER issues).
  if (wantsDelete && aboutComment) {
    const idMatch = matchCommentId(zh);
    const id = idMatch ? Number(idMatch[1]) : NaN;
    if (Number.isFinite(id) && id > 0) {
      const requestId = rid("del_comment");
      return {
        kind: "delete_comment",
        title: "Delete Comment",
        viewMode: "detail",
        propose: {
          requestId,
          method: "delete",
          body: { Comment: { id }, tag: "Comment" },
          risk: "write",
          rationale: "Delete a Comment by id from the user message",
        },
        a2uiHint: {
          surfaceId: "comment_delete",
          filters: [],
        },
        writeForm: {
          fields: [{ key: "id", label: "Comment ID", path: "/Comment/id" }],
        },
      };
    }
    // No id → fall through to comment list; delete from the table UI
  }

  if (wantsUpdate && aboutComment) {
    const idMatch = matchCommentId(zh);
    const id = idMatch ? Number(idMatch[1]) : NaN;
    if (Number.isFinite(id) && id > 0) {
      const contentMatch =
        zh.match(/改成[「"']?(.+?)[」"']?\s*$/) ||
        zh.match(/内容[为是:：]\s*[「"']?(.+?)[」"']?\s*$/) ||
        text.match(/(?:to|as)\s+[「"']?(.+?)[」"']?\s*$/i) ||
        text.match(/content\s*[:=]\s*(.+)$/i);
      const content = contentMatch?.[1]?.trim() || "updated by A2API";
      const requestId = rid("put_comment");
      return {
        kind: "update_comment",
        title: "Update Comment",
        viewMode: "detail",
        propose: {
          requestId,
          method: "put",
          body: { Comment: { id, content }, tag: "Comment" },
          risk: "write",
          rationale: "Update Comment content",
        },
        a2uiHint: {
          surfaceId: "comment_edit",
          filters: [],
        },
        writeForm: {
          fields: [
            { key: "id", label: "Comment ID", path: "/Comment/id" },
            { key: "content", label: "Content", path: "/Comment/content" },
          ],
        },
      };
    }
    // No id → fall through to comment list; edit a row from the UI
  }

  if (wantsCreate && aboutComment) {
    // Empty detail create form (no Table bind). Client mounts Add Comment.
    const contentMatch =
      zh.match(/[「"'](.+?)[」"']/) ||
      zh.match(/(?:内容|content)[为是:：]\s*(.+)$/i) ||
      text.match(/content\s*[:=]\s*(.+)$/i) ||
      text.match(/[「"'](.+?)[」"']/);
    const content = contentMatch?.[1]?.trim();
    const requestId = rid("create_comment");
    return {
      kind: "create_comment",
      title: "Create Comment",
      viewMode: "detail",
      openCreate: true,
      propose: {
        requestId,
        method: "get",
        // Schema hint only — orchestrator skips execute for openCreate detail.
        body: { Comment: {} },
        risk: "read",
        rationale: "Open empty Comment create form",
      },
      a2uiHint: { surfaceId: "comment_create", filters: [] },
      writeForm: {
        fields: [
          { key: "content", label: "Content", path: "/Comment/content" },
          { key: "momentId", label: "Moment ID", path: "/Comment/momentId" },
        ],
        defaults: content ? { content } : undefined,
      },
    };
  }

  if (wantsCreate && aboutMoment && !aboutComment) {
    // Empty detail create form (do not auto-POST / do not open Moment Table).
    const contentMatch =
      zh.match(/[「"'](.+?)[」"']/) ||
      zh.match(/(?:内容|content)[为是:：]\s*(.+)$/i) ||
      text.match(/content\s*[:=]\s*(.+)$/i) ||
      text.match(/[「"'](.+?)[」"']/);
    const content = contentMatch?.[1]?.trim();
    const requestId = rid("create_moment");
    return {
      kind: "create_moment",
      title: "Create Moment",
      viewMode: "detail",
      openCreate: true,
      propose: {
        requestId,
        method: "get",
        body: { Moment: {} },
        risk: "read",
        rationale: "Open empty Moment create form",
      },
      a2uiHint: { surfaceId: "moment_create", filters: [] },
      writeForm: {
        fields: [
          { key: "content", label: "Content", path: "/Moment/content" },
        ],
        defaults: content ? { content } : undefined,
      },
    };
  }

  // Single-record-by-id reads are not offered as templates (hardcoded ids
  // break OWNER). Prefer list + click row. Explicit NL with an id still works.
  const singleId = matchEntityId(zh);
  if (
    singleId &&
    !wantsCreate &&
    !wantsUpdate &&
    !wantsDelete &&
    /\b(?:id|#|号)\b/i.test(zh)
  ) {
    const id = Number(singleId[1]);
    if (Number.isFinite(id) && id > 0) {
      if (aboutComment) {
        return {
          kind: "get_comment",
          title: `Comment #${id}`,
          viewMode: "detail",
          propose: {
            requestId: rid("get_comment"),
            method: "get",
            body: { Comment: { id } },
            risk: "read",
            rationale: "Get one Comment",
          },
          a2uiHint: { surfaceId: "comment_detail", filters: [] },
        };
      }
      if (aboutMoment) {
        return {
          kind: "get_moment",
          title: `Moment #${id}`,
          viewMode: "detail",
          propose: {
            requestId: rid("get_moment"),
            method: "get",
            body: { Moment: { id } },
            risk: "read",
            rationale: "Get one Moment",
          },
          a2uiHint: { surfaceId: "moment_detail", filters: [] },
        };
      }
      if (aboutUser) {
        return {
          kind: "get_user",
          title: `User #${id}`,
          viewMode: "detail",
          propose: {
            requestId: rid("get_user"),
            method: "get",
            body: { User: { id } },
            risk: "read",
            rationale: "Get one User",
          },
          a2uiHint: { surfaceId: "user_detail", filters: [] },
        };
      }
    }
  }

  // Current visitor profile — no hardcoded id (session injects visitorUserId).
  const wantsUserDetail =
    /用户详情|我的资料|个人资料|个人主页/.test(zh) ||
    /\buser\s*[-_]?\s*detail\b/.test(text) ||
    /\bmy\s+(?:profile|user|account)\b/.test(text) ||
    /\bshow\s+(?:my\s+)?user\b/.test(text);
  if (wantsUserDetail && !wantsCreate && !wantsUpdate && !wantsDelete) {
    return {
      kind: "get_user",
      title: "User Detail",
      viewMode: "detail",
      propose: {
        requestId: rid("get_user"),
        method: "get",
        // id filled from session.visitorUserId in orchestrator.ownerBody
        body: { User: {} },
        risk: "read",
        rationale: "Get the logged-in user's User record (detail)",
      },
      a2uiHint: { surfaceId: "user_detail", filters: [] },
    };
  }

  const wantsUserList =
    /用户列表|查看用户|list\s+users?|users?\s+list/.test(zh) ||
    /\b(?:user|users)\s+list\b/.test(text) ||
    /\blist\s+users?\b/.test(text);
  if (
    !wantsUserDetail &&
    ((aboutUser && !aboutMoment && !aboutComment) || wantsUserList)
  ) {
    const requestId = rid("list_users");
    const body = {
      "[]": {
        count: 20,
        page: 0,
        // No @column — return all User fields (tag/head/pictureList/…)
        User: { "@order": "date-" },
      },
    };
    return {
      kind: "list_users",
      title: "User List",
      viewMode: "list",
      propose: {
        requestId,
        method: "get",
        body,
        risk: riskForMethod("get"),
        rationale: "List users",
      },
      bind: {
        bindingId: "user_list",
        method: "get",
        url: `${DEFAULT_BASE}/get`,
        bodyTemplate: body,
        paramMap: [
          { from: "/ui/page", to: "/[]/page" },
          { from: "/ui/count", to: "/[]/count" },
          { from: "/ui/order", to: "/[]/User/@order" },
          { from: "/ui/keyword", to: "/[]/User/name$" },
        ],
        resultPath: "/rows",
        triggerActions: ["search", "page_change", "sort_change"],
      },
      a2uiHint: {
        surfaceId: "user_list",
        filters: [
          { key: "keyword", label: "Name keyword", type: "text" },
          { key: "count", label: "Page size", type: "number" },
          { key: "page", label: "Page", type: "number" },
          {
            key: "order",
            label: "Sort",
            type: "select",
            options: ["date-", "date+", "name+", "name-"],
          },
        ],
      },
    };
  }

  const wantsCommentList =
    /评论列表|查看评论|list\s+comments?|comments?\s+list/.test(zh) ||
    /\b(?:comment|comments)\s+list\b/.test(text) ||
    /\blist\s+comments?\b/.test(text);
  if (
    (aboutComment && !wantsUpdate && !wantsDelete && !wantsCreate) ||
    wantsCommentList
  ) {
    const requestId = rid("list_comments");
    const body = {
      "[]": {
        count: 20,
        page: 0,
        join: "@/Moment",
        Comment: { "@order": "date-" },
        // No User JOIN — OWNER already scopes to the current visitor
        Moment: {
          "id@": "/Comment/momentId",
          "@column": "content",
        },
      },
    };
    return {
      kind: "list_comments",
      title: "Comment List",
      viewMode: "list",
      propose: {
        requestId,
        method: "get",
        body,
        risk: "read",
        rationale: "List comments",
      },
      bind: {
        bindingId: "comment_list",
        method: "get",
        url: `${DEFAULT_BASE}/get`,
        bodyTemplate: body,
        paramMap: [
          { from: "/ui/page", to: "/[]/page" },
          { from: "/ui/count", to: "/[]/count" },
          { from: "/ui/order", to: "/[]/Comment/@order" },
          { from: "/ui/keyword", to: "/[]/Comment/content$" },
        ],
        resultPath: "/rows",
        triggerActions: ["search", "page_change", "sort_change"],
      },
      a2uiHint: {
        surfaceId: "comment_list",
        filters: [
          { key: "keyword", label: "Content keyword", type: "text" },
          { key: "count", label: "Page size", type: "number" },
          { key: "page", label: "Page", type: "number" },
          {
            key: "order",
            label: "Sort",
            type: "select",
            options: ["date-", "date+"],
          },
        ],
      },
    };
  }

  if (layoutEntity && !wantsCreate && !wantsUpdate && !wantsDelete) {
    return listTablePlan(layoutEntity, parseListCount(zh, text, 10));
  }

  const wantsMomentList =
    aboutMoment ||
    /动态列表|朋友圈|最近动态/.test(zh) ||
    /\b(?:recent|latest)\s+moments?\b/.test(text) ||
    /\blist\s+(?:the\s+)?(?:latest\s+|recent\s+)?moments?\b/.test(text);
  if (!wantsMomentList) {
    return makeUnknownPlan();
  }

  // Moment list (no User JOIN — OWNER already scopes to visitor)
  const requestId = rid("list_moments");
  const count = parseListCount(zh, text, 10);
  const body = {
    "[]": {
      count,
      page: 0,
      Moment: { "@order": "date-" },
    },
  };
  const wantsRecentMoments =
    /最近|recent|latest/.test(zh) || /\b(?:recent|latest)\s+moments?\b/.test(text);
  return {
    kind: "list_moments",
    title: wantsRecentMoments ? "Recent Moments" : "Moment List",
    viewMode: "list",
    propose: {
      requestId,
      method: "get",
      body,
      risk: "read",
      rationale: "List moments for the current user",
    },
    bind: {
      bindingId: "moment_list",
      method: "get",
      url: `${DEFAULT_BASE}/get`,
      bodyTemplate: body,
      paramMap: [
        { from: "/ui/page", to: "/[]/page" },
        { from: "/ui/count", to: "/[]/count" },
        { from: "/ui/order", to: "/[]/Moment/@order" },
        { from: "/ui/keyword", to: "/[]/Moment/content$" },
      ],
      resultPath: "/rows",
      triggerActions: ["search", "page_change", "sort_change"],
    },
    a2uiHint: {
      surfaceId: "moment_list",
      filters: [
        { key: "keyword", label: "Content keyword", type: "text" },
        { key: "count", label: "Page size", type: "number" },
        { key: "page", label: "Page", type: "number" },
        {
          key: "order",
          label: "Sort",
          type: "select",
          options: ["date-", "date+", "id-", "id+"],
        },
      ],
    },
  };
}

export function toProposeEnvelope(propose: ProposeRequestPayload) {
  return { version: A2API_VERSION, proposeRequest: propose };
}

export function toBindEnvelope(bind: BindRequestPayload) {
  return { version: A2API_VERSION, bindRequest: bind };
}
