import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  commentDisplayLabel,
  parseCommentFkRef,
  resolveFkTable,
} from "./fk-nav.js";

describe("commentDisplayLabel", () => {
  it("strips Table.field from category comments", () => {
    assert.equal(commentDisplayLabel("分类 Category.id"), "分类");
    assert.equal(commentDisplayLabel("流派 Category.id"), "流派");
    assert.equal(commentDisplayLabel("栏目 Category.id"), "栏目");
    assert.equal(commentDisplayLabel("话题 Category.id"), "话题");
  });

  it("strips Table.field and trailing notes", () => {
    assert.equal(commentDisplayLabel("商品 Product.id"), "商品");
    assert.equal(commentDisplayLabel("点赞用户 User.id 列表"), "点赞用户");
    assert.equal(commentDisplayLabel("父分类 Category.id，空为一级"), "父分类");
  });

  it("keeps the phrase before parentheses", () => {
    assert.equal(commentDisplayLabel("歌词（LRC 或纯文本）"), "歌词");
    assert.equal(commentDisplayLabel("价格"), "价格");
  });
});

describe("parseCommentFkRef", () => {
  it("reads Category.id from a Chinese label", () => {
    assert.deepEqual(parseCommentFkRef("分类 Category.id"), {
      table: "Category",
      field: "id",
    });
  });
});

describe("resolveFkTable", () => {
  const comments = {
    tables: { Category: "通用分类", Product: "商品", Music: "歌曲" },
    columns: {
      "Product.categoryId": "分类 Category.id",
      "Music.genreId": "流派 Category.id",
      "Music.categoryId": "流派 Category.id",
    },
  };

  it("maps categoryId to Category", () => {
    assert.equal(resolveFkTable("Product.categoryId", comments), "Category");
  });

  it("prefers comment Table.field over an invented stem", () => {
    assert.equal(resolveFkTable("Music.genreId", comments), "Category");
  });
});
