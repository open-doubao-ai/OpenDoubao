import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  averageCommentScore,
  fillActionBody,
  formatStarText,
  inferCommentOwnerFk,
  inferCommentScoreField,
  inferCommentTable,
  inferParamMapFromTemplate,
  nestCommentThreads,
  parseCommentsFromResponse,
  resolveCommentQuery,
} from "./layout-actions.js";
import { shouldShowCommentRating } from "./layout-comments.js";
import { isRateableApp } from "./page-layout.js";

describe("comment score helpers", () => {
  it("formats rounded stars", () => {
    assert.equal(formatStarText(4.4), "★★★★☆");
    assert.equal(formatStarText(4.6), "★★★★★");
    assert.equal(formatStarText(0), "☆☆☆☆☆");
  });

  it("averages positive scores only", () => {
    assert.equal(
      averageCommentScore([
        { id: 1, userId: 1, name: "a", head: null, content: "x", date: "", score: 5 },
        { id: 2, userId: 2, name: "b", head: null, content: "y", date: "", score: 3 },
        { id: 3, userId: 3, name: "c", head: null, content: "z", date: "" },
      ]),
      4,
    );
    assert.equal(averageCommentScore([]), null);
  });

  it("finds a rating column from schema comments", () => {
    assert.equal(
      inferCommentScoreField({
        columns: {
          "Comment.content": "正文",
          "Comment.score": "评分 1-5",
        },
      }),
      "score",
    );
    assert.equal(inferCommentScoreField({ columns: { "Comment.content": "正文" } }), null);
  });

  it("shows stars only for purchase apps, not because Comment.score exists", () => {
    const comments = { columns: { "Comment.score": "评分 1-5" } };
    assert.equal(isRateableApp("commerce"), true);
    assert.equal(isRateableApp("social"), false);
    assert.equal(isRateableApp("video"), false);
    assert.equal(shouldShowCommentRating(true, comments), true);
    assert.equal(shouldShowCommentRating(false, comments), false);
  });
});

describe("resolveCommentQuery", () => {
  const comments = {
    tables: { Moment: "动态", Comment: "评论", User: "用户" },
    columns: {
      "Comment.momentId": "动态 Moment.id",
      "Comment.userId": "用户",
      "Comment.toId": "回复评论",
      "Comment.date": "时间",
      "Comment.content": "正文",
    },
  };

  it("picks Comment + momentId for a Moment page", () => {
    assert.equal(inferCommentTable(comments), "Comment");
    assert.equal(inferCommentOwnerFk("Comment", "Moment", comments), "momentId");
    const spec = resolveCommentQuery("Moment", comments);
    assert.ok(spec);
    assert.equal(spec!.fkField, "momentId");
    assert.equal(spec!.personTable, "User");
    assert.equal(spec!.userFk, "userId");
    assert.equal(spec!.dateField, "date");
  });
});

describe("nestCommentThreads", () => {
  it("nests replies and keeps a second-level @ on the root", () => {
    const threads = nestCommentThreads([
      { id: 1, userId: 8, name: "A", head: null, content: "根", date: "1", toId: 0 },
      { id: 2, userId: 9, name: "B", head: null, content: "回A", date: "2", toId: 1 },
      { id: 3, userId: 10, name: "C", head: null, content: "回B", date: "3", toId: 2 },
    ]);
    assert.equal(threads.length, 1);
    assert.equal(threads[0]!.name, "A");
    assert.equal(threads[0]!.replies?.length, 2);
    assert.equal(threads[0]!.replies?.[0]!.name, "B");
    assert.equal(threads[0]!.replies?.[0]!.replyToName, "A");
    assert.equal(threads[0]!.replies?.[1]!.name, "C");
    assert.equal(threads[0]!.replies?.[1]!.replyToName, "B");
  });
});

describe("parseCommentsFromResponse", () => {
  it("keeps score on review rows", () => {
    const items = parseCommentsFromResponse({
      "[]": [
        {
          Comment: { id: 1, content: "好课", score: 5, userId: 8, date: "2026-08-01" },
          User: { id: 8, name: "林夏", head: "/h.png" },
        },
      ],
    });
    assert.equal(items.length, 1);
    assert.equal(items[0]!.score, 5);
    assert.equal(items[0]!.content, "好课");
    assert.equal(items[0]!.name, "林夏");
  });

  it("builds A @ B threads from toId", () => {
    const items = parseCommentsFromResponse({
      "[]": [
        {
          Comment: { id: 1, content: "根评", toId: 0, userId: 8, date: "1" },
          User: { id: 8, name: "林夏", head: "/h.png" },
        },
        {
          Comment: { id: 2, content: "回一句", toId: 1, userId: 9, date: "2" },
          User: { id: 9, name: "陈舟", head: "/c.png" },
        },
      ],
    });
    assert.equal(items.length, 1);
    assert.equal(items[0]!.replies?.length, 1);
    assert.equal(items[0]!.replies?.[0]!.replyToName, "林夏");
    assert.equal(items[0]!.replies?.[0]!.content, "回一句");
  });
});

describe("comment action mapping", () => {
  it("maps /input/score and skips empty ratings", () => {
    const map = inferParamMapFromTemplate("comment", {
      Comment: { content: "", productId: 0, score: 0 },
      tag: "Comment",
    });
    assert.ok(map.some((e) => e.from === "/input/content"));
    assert.ok(map.some((e) => e.from === "/input/score"));
    const replyMap = inferParamMapFromTemplate("comment", {
      Comment: { content: "", toId: 0, productId: 0 },
      tag: "Comment",
    });
    assert.ok(replyMap.some((e) => e.from === "/input/toId" && e.to === "/Comment/toId"));
    assert.ok(!replyMap.some((e) => e.to === "/Comment/toId" && e.from === "/author/id"));
    const body = fillActionBody(
      {
        slot: "comment",
        bindingId: "t",
        method: "post",
        url: "/apijson/post",
        bodyTemplate: { Comment: { content: "", score: 0 }, tag: "Comment" },
        paramMap: [
          { from: "/input/content", to: "/Comment/content" },
          { from: "/input/score", to: "/Comment/score" },
        ],
      },
      {
        record: { id: 1001 },
        visitorId: 1,
        input: "不错",
        score: null,
      },
    );
    const comment = body.Comment as Record<string, unknown>;
    assert.equal(comment.content, "不错");
    assert.equal("score" in comment, false);
    const withScore = fillActionBody(
      {
        slot: "comment",
        bindingId: "t",
        method: "post",
        url: "/apijson/post",
        bodyTemplate: { Comment: { content: "", score: 0 }, tag: "Comment" },
        paramMap: [
          { from: "/input/content", to: "/Comment/content" },
          { from: "/input/score", to: "/Comment/score" },
        ],
      },
      {
        record: { id: 1001 },
        visitorId: 1,
        input: "不错",
        score: 5,
      },
    );
    assert.equal((withScore.Comment as Record<string, unknown>).score, 5);
  });
});
