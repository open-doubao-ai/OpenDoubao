import { ApiJsonClient } from "@a2api/runtime";

export type SchemaComments = {
  /** tableName -> table comment */
  tables: Record<string, string>;
  /** "Table.column" -> column comment (+ optional type suffix) */
  columns: Record<string, string>;
  /** "Table.column" -> raw COLUMN_TYPE e.g. varchar(100), timestamp */
  types: Record<string, string>;
};

const cache = new Map<string, { at: number; data: SchemaComments }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export function clearSchemaCommentCache(): void {
  cache.clear();
}

/** APIJSON Demo: logical request name → physical MySQL table name. */
const LOGICAL_TO_PHYSICAL: Record<string, string> = {
  User: "apijson_user",
  Privacy: "apijson_privacy",
};

const PHYSICAL_TO_LOGICAL: Record<string, string> = Object.fromEntries(
  Object.entries(LOGICAL_TO_PHYSICAL).map(([logical, physical]) => [
    physical,
    logical,
  ]),
);

function empty(): SchemaComments {
  return { tables: {}, columns: {}, types: {} };
}

function merge(into: SchemaComments, from: SchemaComments): SchemaComments {
  return {
    tables: { ...into.tables, ...from.tables },
    columns: { ...into.columns, ...from.columns },
    types: { ...into.types, ...from.types },
  };
}

function toPhysical(logical: string): string {
  return LOGICAL_TO_PHYSICAL[logical] ?? logical;
}

function toLogical(name: string): string {
  return PHYSICAL_TO_LOGICAL[name] ?? name;
}

function listBodyOk(body: unknown): unknown[] {
  if (!body || typeof body !== "object") return [];
  const arr = (body as { "[]"?: unknown })["[]"];
  return Array.isArray(arr) ? arr : [];
}

/**
 * Load TABLE_COMMENT / COLUMN_COMMENT from information_schema via APIJSON.
 * Note: []/count must be ≤ 100 on this server; User maps to apijson_user.
 */
export async function loadSchemaComments(
  client: ApiJsonClient,
  tableNames: string[],
  schema = process.env.APIJSON_SCHEMA ?? "sys",
): Promise<SchemaComments> {
  const unique = [...new Set(tableNames.filter(Boolean))];
  if (unique.length === 0) return empty();

  const cacheKey = `${schema}:${unique.slice().sort().join(",")}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  const physicalNames = [
    ...new Set(unique.flatMap((t) => [t, toPhysical(t)])),
  ];

  let result = empty();

  // Tables
  const tableRes = await client.execute(
    "get",
    {
      "[]": {
        count: Math.min(100, Math.max(physicalNames.length, 10)),
        Table: {
          TABLE_SCHEMA: schema,
          "TABLE_NAME{}": physicalNames,
          "@column": "TABLE_NAME,TABLE_COMMENT",
        },
      },
    },
    undefined,
    { injectRole: false },
  );
  if (tableRes.ok) {
    for (const item of listBodyOk(tableRes.body)) {
      const t = (item as { Table?: Record<string, unknown> }).Table;
      if (!t?.TABLE_NAME) continue;
      const logical = toLogical(String(t.TABLE_NAME));
      const comment = String(t.TABLE_COMMENT ?? "")
        .replace(/\n+/g, " ")
        .trim();
      result.tables[logical] = comment;
      // also keep physical key if different (defensive)
      if (logical !== String(t.TABLE_NAME)) {
        result.tables[String(t.TABLE_NAME)] = comment;
      }
    }
  }

  // Columns — page if needed (max count 100)
  const pageSize = 100;
  let page = 0;
  let fetched = 0;
  do {
    const colRes = await client.execute(
      "get",
      {
        "[]": {
          count: pageSize,
          page,
          Column: {
            TABLE_SCHEMA: schema,
            "TABLE_NAME{}": physicalNames,
            "@column": "TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,COLUMN_COMMENT",
          },
        },
      },
      undefined,
      { injectRole: false },
    );
    if (!colRes.ok) break;
    const rows = listBodyOk(colRes.body);
    fetched = rows.length;
    for (const item of rows) {
      const c = (item as { Column?: Record<string, unknown> }).Column;
      if (!c?.TABLE_NAME || !c?.COLUMN_NAME) continue;
      const physical = String(c.TABLE_NAME);
      const logical = toLogical(physical);
      const comment = String(c.COLUMN_COMMENT ?? "")
        .replace(/\n+/g, " ")
        .trim();
      const type = c.COLUMN_TYPE ? String(c.COLUMN_TYPE) : "";
      const text = comment
        ? type
          ? `${comment} (${type})`
          : comment
        : type
          ? `(${type})`
          : "";
      // Index under both logical (Privacy) and physical (apijson_privacy)
      for (const table of new Set([logical, physical])) {
        const key = `${table}.${c.COLUMN_NAME}`;
        if (type) result.types[key] = type;
        result.columns[key] = text;
      }
    }
    page += 1;
  } while (fetched >= pageSize && page < 5);

  // Demo fallback when information_schema misses a logical table
  result = merge(demoFallback(unique), result);

  cache.set(cacheKey, { at: Date.now(), data: result });
  return result;
}

/** Minimal built-in comments so DDL UI is never blank for Demo tables. */
function demoFallback(tables: string[]): SchemaComments {
  const all: SchemaComments = {
    tables: {
      User: "Public user profile (logical name: User)",
      Moment: "Moment / post",
      Comment: "Comment",
      Privacy: "User privacy (physical: apijson_privacy)",
      apijson_user: "Public user profile (logical name: User)",
      apijson_privacy: "User privacy (logical name: Privacy)",
      Employee: "数据管理-员工花名册",
      Activity: "运营活动",
      Message: "聊天消息",
      News: "新闻",
      Notice: "资讯公告",
      Blog: "博客",
      Article: "文章",
      Video: "视频",
      Music: "音乐",
      Product: "电商商品",
      Cart: "购物车",
      ShopOrder: "电商订单",
      Category: "通用分类/栏目/流派",
      Address: "收件地址",
    },
    columns: {
      "User.id": "Primary key (bigint)",
      "User.name": "Display name (varchar(20))",
      "User.sex": "Gender: 0-male, 1-female (tinyint)",
      "User.tag": "Tag (varchar(45))",
      "User.head": "Avatar URL (varchar(300))",
      "User.contactIdList": "Contact User.id list (FK array)",
      "User.pictureList": "Picture list (json)",
      "User.date": "Created at (timestamp)",
      "Moment.id": "Primary key (bigint)",
      "Moment.userId": "Author user id (bigint)",
      "Moment.date": "Created at (timestamp)",
      "Moment.content": "Content (varchar(300))",
      "Moment.praiseUserIdList": "Liked-by User.id list (FK array)",
      "Moment.pictureList": "Picture list (json)",
      "Comment.id": "Primary key (bigint)",
      "Comment.toId": "Reply-to Comment id (FK Comment, self)",
      "Comment.userId": "Commenter User id (bigint)",
      "Comment.momentId": "Moment id (bigint)",
      "Comment.videoId": "Video id (bigint)",
      "Comment.articleId": "Article id (bigint)",
      "Comment.blogId": "Blog id (bigint)",
      "Comment.date": "Created at (timestamp)",
      "Comment.content": "Content (varchar(1000))",
      "Privacy.id": "Primary key (bigint)",
      "Privacy.certified": "Certified (tinyint)",
      "Privacy.phone": "Phone (bigint, 11 digits)",
      "Privacy.balance": "Balance (decimal)",
      "Privacy._password": "Login password",
      "Privacy._payPassword": "Pay password",
      "Employee.name": "姓名",
      "Employee.dept": "部门",
      "Employee.head": "头像",
      "Employee.salary": "月薪",
      "Activity.title": "活动标题",
      "Activity.cover": "封面图",
      "Activity.startTime": "开始时间",
      "Activity.endTime": "结束时间",
      "Message.content": "消息内容",
      "Message.head": "发送人头像",
      "Message.toUserId": "接收人 User.id",
      "News.title": "新闻标题",
      "News.cover": "封面图",
      "News.source": "新闻来源",
      "Notice.title": "资讯标题",
      "Notice.cover": "封面图",
      "Blog.title": "博客标题",
      "Blog.cover": "封面图",
      "Blog.praiseUserIdList": "点赞用户 User.id 列表",
      "Blog.collectUserIdList": "收藏用户 User.id 列表",
      "Blog.shareCount": "分享次数",
      "Article.title": "文章标题",
      "Article.cover": "封面图",
      "Article.praiseUserIdList": "点赞用户 User.id 列表",
      "Article.collectUserIdList": "收藏用户 User.id 列表",
      "Article.shareCount": "分享次数",
      "Video.title": "视频标题",
      "Video.cover": "封面图",
      "Video.videoUrl": "视频地址",
      "Video.praiseUserIdList": "点赞用户 User.id 列表",
      "Video.collectUserIdList": "收藏用户 User.id 列表",
      "Video.shareCount": "分享次数",
      "Music.title": "歌曲名",
      "Music.cover": "封面图",
      "Music.audioUrl": "音频地址",
      "Music.artist": "歌手",
      "Product.name": "商品名称",
      "Product.cover": "商品封面图",
      "Product.pictureList": "商品图集",
      "Product.price": "价格",
      "Product.stock": "库存",
      "Cart.title": "商品名称",
      "Cart.cover": "商品图",
      "Cart.productId": "商品 Product.id",
      "ShopOrder.consignee": "收货人",
      "ShopOrder.total": "订单金额",
      "ShopOrder.address": "收货地址",
      "Category.app": "应用大类：commerce/music/news/…",
      "Category.name": "分类名",
      "Category.cover": "分类封面图",
      "Category.sort": "排序",
      "Product.categoryId": "分类 Category.id",
      "Music.categoryId": "流派 Category.id",
      "News.categoryId": "栏目 Category.id",
      "Notice.categoryId": "栏目 Category.id",
      "Video.categoryId": "分类 Category.id",
      "Blog.categoryId": "分类 Category.id",
      "Article.categoryId": "分类 Category.id",
      "Activity.categoryId": "分类 Category.id",
      "Moment.categoryId": "话题 Category.id",
      "Message.categoryId": "分类 Category.id",
      "Address.consignee": "收货人",
      "Address.phone": "手机号",
      "Address.region": "省市区",
      "Address.address": "详细地址",
      "Address.tag": "标签：家/公司/学校",
      "Address.isDefault": "默认地址：0-否，1-是",
    },
    types: {
      "User.id": "bigint",
      "User.name": "varchar(20)",
      "User.sex": "tinyint",
      "User.tag": "varchar(45)",
      "User.head": "varchar(300)",
      "User.contactIdList": "json",
      "User.pictureList": "json",
      "User.date": "timestamp",
      "Moment.id": "bigint",
      "Moment.userId": "bigint",
      "Moment.date": "timestamp",
      "Moment.content": "varchar(300)",
      "Moment.praiseUserIdList": "json",
      "Moment.pictureList": "json",
      "Comment.id": "bigint",
      "Comment.toId": "bigint",
      "Comment.userId": "bigint",
      "Comment.momentId": "bigint",
      "Comment.videoId": "bigint",
      "Comment.articleId": "bigint",
      "Comment.blogId": "bigint",
      "Comment.date": "timestamp",
      "Comment.content": "varchar(1000)",
      "Privacy.id": "bigint",
      "Privacy.certified": "tinyint",
      "Privacy.phone": "bigint",
      "Privacy.balance": "decimal(10,2)",
      "Privacy._password": "varchar(20)",
      "Privacy._payPassword": "int",
      "Employee.salary": "decimal(10,2)",
      "Activity.cover": "varchar(400)",
      "Message.toUserId": "bigint",
      "News.viewCount": "int",
      "Video.videoUrl": "varchar(500)",
      "Music.audioUrl": "varchar(500)",
      "Product.pictureList": "json",
      "Product.price": "decimal(10,2)",
      "Cart.qty": "int",
      "ShopOrder.total": "decimal(10,2)",
      "Category.app": "varchar(20)",
      "Category.name": "varchar(40)",
      "Category.cover": "varchar(400)",
      "Category.sort": "int",
      "Product.categoryId": "bigint",
    },
  };
  // Mirror logical ↔ physical keys for alias-tolerant clients
  for (const [logical, physical] of Object.entries(LOGICAL_TO_PHYSICAL)) {
    for (const [k, v] of Object.entries({ ...all.columns })) {
      if (!k.startsWith(`${logical}.`)) continue;
      const col = k.slice(logical.length + 1);
      all.columns[`${physical}.${col}`] = v;
    }
    for (const [k, v] of Object.entries({ ...all.types })) {
      if (!k.startsWith(`${logical}.`)) continue;
      const col = k.slice(logical.length + 1);
      all.types[`${physical}.${col}`] = v;
    }
  }
  const out = empty();
  const want = new Set(
    tables.flatMap((t) => [t, toLogical(t), toPhysical(t)]),
  );
  for (const t of want) {
    if (all.tables[t]) out.tables[t] = all.tables[t]!;
    for (const [k, v] of Object.entries(all.columns)) {
      if (k.startsWith(`${t}.`)) out.columns[k] = v;
    }
    for (const [k, v] of Object.entries(all.types)) {
      if (k.startsWith(`${t}.`)) out.types[k] = v;
    }
  }
  return out;
}

/** Extract table names from an APIJSON request or response body. */
export function extractTableNames(doc: unknown): string[] {
  const names = new Set<string>();
  walk(doc, names);
  return [...names];
}

function walk(node: unknown, names: Set<string>): void {
  if (node == null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, names);
    return;
  }
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (/^[A-Z][A-Za-z0-9]*$/.test(k) && k !== "Table" && k !== "Column") {
      names.add(k);
    }
    if (typeof v === "object") walk(v, names);
  }
}

export async function commentsForPayload(
  client: ApiJsonClient,
  ...docs: unknown[]
): Promise<SchemaComments> {
  const tables = new Set<string>();
  for (const d of docs) {
    for (const t of extractTableNames(d)) tables.add(t);
  }
  // Always include Demo core tables as baseline
  for (const t of [
    "User",
    "Moment",
    "Comment",
    "Employee",
    "Activity",
    "Message",
    "News",
    "Notice",
    "Blog",
    "Article",
    "Video",
    "Music",
    "Product",
    "Cart",
    "ShopOrder",
    "Category",
    "Address",
  ]) {
    tables.add(t);
  }
  return loadSchemaComments(client, [...tables]);
}

export { merge as mergeComments };
