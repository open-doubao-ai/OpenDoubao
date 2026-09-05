import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fieldLabel, mapEnumOptions } from "./layout-filter.js";

describe("fieldLabel", () => {
  it("shows 分类 instead of 分类 Category.id", () => {
    assert.equal(
      fieldLabel("Product.categoryId", {
        tables: {},
        columns: { "Product.categoryId": "分类 Category.id" },
      }),
      "分类",
    );
  });

  it("falls back to the column name", () => {
    assert.equal(fieldLabel("Product.price", { tables: {}, columns: {} }), "price");
  });
});

describe("mapEnumOptions", () => {
  it("replaces ids with names when a label map is present", () => {
    const labels = new Map([
      ["1301", "电器"],
      ["1302", "服装"],
    ]);
    assert.deepEqual(mapEnumOptions(["1301", "1302", "1303"], labels), [
      { value: "1301", label: "电器" },
      { value: "1302", label: "服装" },
      { value: "1303", label: "1303" },
    ]);
  });
});
