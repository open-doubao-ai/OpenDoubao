import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  beginInplaceSelect,
  beginListPick,
  clearListPick,
  completeListPick,
  consumeListPickResult,
  exitListSelect,
  getListPick,
  isListPickActive,
  isListItemSelected,
  setListPickMode,
  toggleListPickItem,
} from "./layout-list-select.js";

if (typeof globalThis.sessionStorage === "undefined") {
  const store = new Map<string, string>();
  Object.assign(globalThis, {
    sessionStorage: {
      getItem(k: string) {
        return store.has(k) ? store.get(k)! : null;
      },
      setItem(k: string, v: string) {
        store.set(k, String(v));
      },
      removeItem(k: string) {
        store.delete(k);
      },
    },
  });
}

describe("layout-list-select", () => {
  beforeEach(() => {
    clearListPick();
    try {
      sessionStorage.removeItem("a2api.listSelectResult");
    } catch {
      /* ignore */
    }
  });

  it("defaults to multi when mode omitted", () => {
    beginListPick({ purpose: "pickArticles", returnPage: "feed" });
    assert.equal(isListPickActive(), true);
    assert.equal(getListPick()?.mode, "multi");
    assert.equal(getListPick()?.source, "picker");
  });

  it("respects single mode from caller", () => {
    beginListPick({
      purpose: "checkoutAddress",
      mode: "single",
      returnPage: "order",
    });
    assert.equal(getListPick()?.mode, "single");
  });

  it("toggles multi selection and completes result", () => {
    beginListPick({ purpose: "pickMessages" });
    toggleListPickItem({ key: "1", id: 1, label: "a" });
    toggleListPickItem({ key: "2", id: 2, label: "b" });
    assert.equal(getListPick()?.selected.length, 2);
    const done = completeListPick();
    assert.ok(done);
    assert.equal(isListPickActive(), false);
    const result = consumeListPickResult("pickMessages");
    assert.equal(result?.selected.length, 2);
    assert.equal(consumeListPickResult("pickMessages"), null);
  });

  it("single mode keeps only one item", () => {
    beginListPick({ purpose: "pickContact", mode: "single" });
    toggleListPickItem({ key: "1", id: 1, label: "a" });
    toggleListPickItem({ key: "2", id: 2, label: "b" });
    assert.equal(getListPick()?.selected.length, 1);
    assert.equal(getListPick()?.selected[0]?.key, "2");
    setListPickMode("multi");
    toggleListPickItem({ key: "1", id: 1, label: "a" });
    assert.equal(getListPick()?.selected.length, 2);
  });

  it("inplace select starts with a row", () => {
    beginInplaceSelect({ key: "9", id: 9, label: "x" });
    assert.equal(getListPick()?.source, "inplace");
    assert.equal(isListItemSelected("9"), true);
    exitListSelect();
    assert.equal(isListPickActive(), false);
  });
});
