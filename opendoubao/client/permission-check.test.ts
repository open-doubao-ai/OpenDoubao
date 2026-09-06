import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isApplyTriggerIssue,
  isLoginSessionIssue,
  isPermissionGateIssue,
} from "./permission-check.js";

describe("isLoginSessionIssue", () => {
  it("treats APIJSON Demo 407 as session expiry", () => {
    assert.equal(isLoginSessionIssue("未登录或登录过期，请登录后再试！", 407), true);
  });

  it("does not logout on permission errors that use code 401", () => {
    assert.equal(isLoginSessionIssue("没有权限", 401), false);
    assert.equal(isLoginSessionIssue("无权限访问该接口", 401), false);
    assert.equal(isLoginSessionIssue("Access denied", 401), false);
  });

  it("logs out on explicit not-logged-in messages", () => {
    assert.equal(isLoginSessionIssue("未登录，请先登录", 401), true);
    assert.equal(isLoginSessionIssue("Not logged in", 401), true);
  });

  it("logs out on bare BFF 401 without permission wording", () => {
    assert.equal(isLoginSessionIssue("", 401), true);
    assert.equal(isLoginSessionIssue("Not logged in", 401), true);
  });
});

describe("isPermissionGateIssue / isApplyTriggerIssue", () => {
  it("still treats 401 + 没有权限 as Apply triggers", () => {
    assert.equal(isPermissionGateIssue("没有权限", 401), true);
    assert.equal(isApplyTriggerIssue("没有权限", 401), true);
  });

  it("does not Apply on real session expiry", () => {
    assert.equal(isApplyTriggerIssue("未登录或登录过期", 407), false);
  });
});
