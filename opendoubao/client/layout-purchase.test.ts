import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPaidOrderStatus,
  orderCoversItem,
  orderWriteFields,
  resolveCheckoutOrderTable,
} from "./layout-purchase.js";

describe("isPaidOrderStatus", () => {
  it("accepts paid / shipped / done and Chinese paid tokens", () => {
    assert.equal(isPaidOrderStatus("paid"), true);
    assert.equal(isPaidOrderStatus("shipped"), true);
    assert.equal(isPaidOrderStatus("done"), true);
    assert.equal(isPaidOrderStatus("已支付"), true);
    assert.equal(isPaidOrderStatus("已完成"), true);
  });

  it("rejects pending, unpaid, empty, and cancelled", () => {
    assert.equal(isPaidOrderStatus("pending"), false);
    assert.equal(isPaidOrderStatus("unpaid"), false);
    assert.equal(isPaidOrderStatus(""), false);
    assert.equal(isPaidOrderStatus(null), false);
    assert.equal(isPaidOrderStatus("cancelled"), false);
  });
});

describe("orderCoversItem", () => {
  it("matches productId on the order row", () => {
    assert.equal(
      orderCoversItem({ productId: 1001, status: "paid" }, "Product", 1001),
      true,
    );
    assert.equal(
      orderCoversItem({ productId: 1001, status: "paid" }, "Product", 1005),
      false,
    );
  });

  it("matches items JSON including a secondary line", () => {
    const order = {
      productId: 1001,
      items: JSON.stringify([
        { table: "Product", id: 1001, qty: 1 },
        { table: "Product", id: 1005, qty: 1 },
      ]),
    };
    assert.equal(orderCoversItem(order, "Product", 1005), true);
    assert.equal(orderCoversItem(order, "Product", 1007), false);
  });

  it("matches ticketId and items without a table", () => {
    assert.equal(
      orderCoversItem({ ticketId: 202 }, "Activity", 202),
      true,
    );
    assert.equal(
      orderCoversItem({ items: [{ id: 88 }] }, "Ticket", 88),
      true,
    );
  });
});

describe("checkout helpers", () => {
  it("prefers ShopOrder unless the current table is already an order", () => {
    assert.equal(resolveCheckoutOrderTable("Product", null), "ShopOrder");
    assert.equal(resolveCheckoutOrderTable("ShopOrder", null), "ShopOrder");
    assert.equal(
      resolveCheckoutOrderTable("Cart", {
        tables: { ShopOrder: "电商订单", Product: "商品" },
      }),
      "ShopOrder",
    );
  });

  it("writes consignee, paid status, productId, and items", () => {
    const fields = orderWriteFields({
      name: "林晓",
      phone: "13800001001",
      address: "上海",
      remark: "",
      total: 367,
      lines: [
        { table: "Product", id: 1001 },
        { table: "Product", id: 1005 },
      ],
    });
    assert.equal(fields.consignee, "林晓");
    assert.equal(fields.status, "paid");
    assert.equal(fields.productId, 1001);
    assert.equal(
      fields.items,
      JSON.stringify([
        { table: "Product", id: 1001 },
        { table: "Product", id: 1005 },
      ]),
    );
  });
});
