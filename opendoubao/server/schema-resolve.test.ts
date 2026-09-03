import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  localSchemaTables,
  mergeLiveTables,
  tablesFromSchemaDict,
  type LiveColumn,
  type LiveTable,
} from "./schema-catalog.js";
import {
  applyFieldAlias,
  extractFieldMentions,
  extractQueryTokens,
  parseSchemaPick,
  resolveFieldName,
  resolveTableName,
} from "./schema-resolve.js";

const SAMPLE_DICT = `
Tables:
- User: id, name  (数据管理)
- Music: id, title, playCount  (音乐)
- Product: id, name, stock, price  (电商)
- Inventory: id, sku, qty  (库存)
`.trim();

describe("tablesFromSchemaDict", () => {
  it("parses table names and comments", () => {
    const tables = tablesFromSchemaDict(SAMPLE_DICT);
    assert.ok(tables.some((t) => t.name === "Music" && t.comment.includes("音乐")));
    assert.ok(tables.some((t) => t.name === "Inventory"));
  });
});

describe("resolveTableName", () => {
  const tables: LiveTable[] = [
    { name: "Music", comment: "音乐", source: "local" },
    { name: "Video", comment: "视频", source: "local" },
    { name: "Product", comment: "电商商品", source: "access" },
    { name: "Inventory", comment: "库存", source: "access" },
    { name: "StockLog", comment: "库存流水", source: "table" },
  ];

  it("matches a unique local table from 音乐", () => {
    const d = resolveTableName("列出音乐", tables);
    assert.equal(d.status, "matched");
    if (d.status === "matched") assert.equal(d.name, "Music");
  });

  it("asks when two live tables share the same comment", () => {
    const d = resolveTableName("打开库存页", [
      { name: "Inventory", comment: "库存", source: "access" },
      { name: "Warehouse", comment: "库存", source: "table" },
      { name: "Music", comment: "音乐", source: "local" },
    ]);
    assert.equal(d.status, "ask");
    if (d.status === "ask") {
      const names = d.ranked.map((r) => r.name);
      assert.ok(names.includes("Inventory"));
      assert.ok(names.includes("Warehouse"));
    }
  });

  it("matches an exact PascalCase table name", () => {
    const d = resolveTableName("List Product", tables);
    assert.equal(d.status, "matched");
    if (d.status === "matched") assert.equal(d.name, "Product");
  });

  it("returns none when tokens miss every table", () => {
    const d = resolveTableName("列出飞船", tables);
    assert.equal(d.status, "none");
  });
});

describe("resolveFieldName", () => {
  const cols: LiveColumn[] = [
    { table: "Music", name: "playCount", comment: "播放量", source: "column" },
    { table: "Music", name: "title", comment: "歌曲名", source: "column" },
    { table: "Music", name: "lyrics", comment: "歌词", source: "column" },
  ];

  it("maps 播放量 to playCount", () => {
    const d = resolveFieldName("播放量", cols);
    assert.equal(d.status, "matched");
    if (d.status === "matched") assert.equal(d.name, "playCount");
  });

  it("accepts an exact column name", () => {
    const d = resolveFieldName("lyrics", cols);
    assert.equal(d.status, "matched");
    if (d.status === "matched") assert.equal(d.name, "lyrics");
  });
});

describe("extractFieldMentions", () => {
  it("reads 按播放量排序 and 隐藏歌词", () => {
    const a = extractFieldMentions("按播放量排序");
    assert.ok(a.includes("播放量"));
    const b = extractFieldMentions("隐藏歌词列");
    assert.ok(b.includes("歌词"));
  });
});

describe("extractQueryTokens", () => {
  it("drops 列出 and keeps 库存", () => {
    const tokens = extractQueryTokens("列出库存");
    assert.ok(tokens.includes("库存"));
    assert.ok(!tokens.includes("列出"));
  });
});

describe("parseSchemaPick", () => {
  const candidates = [
    { name: "Inventory", comment: "库存", source: "access" as const, score: 8 },
    { name: "StockLog", comment: "库存流水", source: "table" as const, score: 4 },
  ];

  it("picks by explicit name, index, and typed PascalCase", () => {
    assert.equal(parseSchemaPick("随便", candidates, "Inventory"), "Inventory");
    assert.equal(parseSchemaPick("2", candidates), "StockLog");
    assert.equal(parseSchemaPick("用 Inventory 表", candidates), "Inventory");
    assert.equal(parseSchemaPick("Warehouse", candidates), "Warehouse");
  });
});

describe("applyFieldAlias", () => {
  it("rewrites the mention to the column name", () => {
    assert.equal(applyFieldAlias("按播放量排序", "播放量", "playCount"), "按playCount排序");
  });
});

describe("mergeLiveTables", () => {
  it("prefers Access comments", () => {
    const merged = mergeLiveTables(
      [{ name: "Music", comment: "", source: "local" }],
      [{ name: "Music", comment: "歌曲", source: "access" }],
    );
    assert.equal(merged[0]?.comment, "歌曲");
    assert.equal(merged[0]?.source, "access");
  });
});

describe("localSchemaTables", () => {
  it("includes Music from SCHEMA_DICT", () => {
    assert.ok(localSchemaTables().some((t) => t.name === "Music"));
  });
});
