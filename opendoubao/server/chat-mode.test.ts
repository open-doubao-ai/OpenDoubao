import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyChatMode,
  pageUiPatchFromMessage,
  type PageChatContext,
} from "./chat-mode.js";

const musicPage: PageChatContext = {
  pageId: "music_list",
  title: "Music List",
  app: "music",
  page: "list",
  table: "Music",
  pageKind: "list",
  bind: {
    method: "get",
    url: "/apijson/get",
    bodyTemplate: { "[]": { count: 10, Music: {} } },
  },
};

const momentPage: PageChatContext = {
  ...musicPage,
  pageId: "moment_list",
  title: "Moment List",
  app: "social",
  page: "list",
  table: "Moment",
  bind: {
    method: "get",
    url: "/apijson/get",
    bodyTemplate: { "[]": { count: 10, Moment: {} } },
  },
};

describe("classifyChatMode", () => {
  it("forces Ask even when the text looks like generate", () => {
    assert.equal(
      classifyChatMode("列出音乐", {
        ...musicPage,
        preferredMode: "explain",
      }),
      "explain",
    );
  });

  it("forces Edit and never generate", () => {
    assert.equal(
      classifyChatMode("列出音乐", {
        ...musicPage,
        preferredMode: "modify",
      }),
      "modify",
    );
  });

  it("forces Generate", () => {
    assert.equal(
      classifyChatMode("这页是干什么的", { preferredMode: "generate" }),
      "generate",
    );
  });

  it("layout nav generatePage wins", () => {
    assert.equal(
      classifyChatMode("改成卡片", {
        ...musicPage,
        generatePage: true,
        preferredMode: "modify",
      }),
      "generate",
    );
  });

  it("Auto with no page + list request → generate", () => {
    assert.equal(classifyChatMode("列出音乐"), "generate");
  });

  it("Auto on current page + layout tweak → modify", () => {
    assert.equal(classifyChatMode("改成卡片布局", musicPage), "modify");
    assert.equal(classifyChatMode("隐藏 lyrics 列", musicPage), "modify");
    assert.equal(classifyChatMode("按 playCount 排序", musicPage), "modify");
  });

  it("Auto on current page + question → explain", () => {
    assert.equal(classifyChatMode("这页是干什么的", musicPage), "explain");
    assert.equal(
      classifyChatMode("网格和列表哪种更适合这页？", musicPage),
      "explain",
    );
    assert.equal(classifyChatMode("有没有更好的方案", musicPage), "explain");
  });

  it("Auto same-entity list request stays on the page (modify), not a new page", () => {
    assert.equal(classifyChatMode("列出音乐", musicPage), "modify");
  });

  it("Auto different entity → generate", () => {
    assert.equal(classifyChatMode("列出音乐", momentPage), "generate");
  });

  it("Auto explicit new page → generate", () => {
    assert.equal(classifyChatMode("再生成一个页面列出视频", musicPage), "generate");
  });

  it("Auto discussion about another app stays Ask, not generate", () => {
    assert.equal(
      classifyChatMode("介绍一下音乐排行这个场景", momentPage),
      "explain",
    );
  });

  it("does not treat “这页显示什么” as edit", () => {
    assert.equal(classifyChatMode("这页显示什么", musicPage), "explain");
  });
});

describe("pageUiPatchFromMessage", () => {
  it("maps 卡片/网格 to grid", () => {
    const ui = pageUiPatchFromMessage("改成卡片布局");
    assert.equal(ui?.displayKind, "grid");
    assert.equal(ui?.catalogStyle, "grid");
  });

  it("maps 表格 to table", () => {
    assert.equal(pageUiPatchFromMessage("换成表格")?.displayKind, "table");
  });

  it("maps 联系人列表 to chat/users, not a data table", () => {
    const ui = pageUiPatchFromMessage("改成联系人列表布局");
    assert.equal(ui?.layoutApp, "chat");
    assert.equal(ui?.layoutPage, "users");
    assert.equal(ui?.displayKind, undefined);
  });

  it("does not treat 把表格改成联系人 as a table target", () => {
    const ui = pageUiPatchFromMessage("把右侧表格改成联系人列表布局");
    assert.equal(ui?.layoutPage, "users");
    assert.notEqual(ui?.displayKind, "table");
  });

  it("hides a named column", () => {
    const ui = pageUiPatchFromMessage("隐藏 lyrics 列");
    assert.ok(ui?.hideColumns?.includes("lyrics"));
  });

  it("remaps the home tab to another existing page", () => {
    const ui = pageUiPatchFromMessage("首页改成视频排行", musicPage);
    assert.equal(ui?.navTab?.slot, "home");
    assert.equal(ui?.navTab?.app, "video");
    assert.equal(ui?.navTab?.page, "rank");
  });

  it("adds a cart tab on 电商首页加上购物车 tab", () => {
    const ui = pageUiPatchFromMessage("电商首页加上 购物车 tab", {
      ...musicPage,
      pageId: "commerce_home",
      title: "Shopping",
      app: "commerce",
      page: "home",
      table: "Product",
    });
    assert.equal(ui?.navTabOp, "add");
    assert.equal(ui?.navTab?.slot, "cart");
    assert.equal(ui?.navTab?.app, "commerce");
    assert.equal(ui?.navTab?.page, "cart");
  });

  it("remaps item tap to a player page", () => {
    const ui = pageUiPatchFromMessage("点击跳转到播放页", musicPage);
    assert.equal(ui?.navJump?.slot, "openRow");
    assert.equal(ui?.navJump?.page, "player");
  });
});
