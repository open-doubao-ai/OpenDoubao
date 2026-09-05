import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  checkoutAddressFromRow,
  clearAddressPick,
  clearCheckoutAddress,
  formatAddressLine,
  beginAddressPick,
  getCheckoutAddress,
  isAddressPickMode,
  parseShippingText,
  preferConsigneeParty,
  setCheckoutAddress,
  suggestConsignees,
} from "./layout-address.js";

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

describe("checkout address pick", () => {
  beforeEach(() => {
    clearCheckoutAddress();
    clearAddressPick();
  });

  it("stores and formats a selected address", () => {
    setCheckoutAddress({
      consignee: "林晓",
      phone: "13800001001",
      region: "上海市 静安区",
      address: "南京西路 100 号",
      tag: "公司",
    });
    const cur = getCheckoutAddress();
    assert.equal(cur?.consignee, "林晓");
    assert.equal(
      formatAddressLine(cur!),
      "上海市 静安区 南京西路 100 号",
    );
  });

  it("tracks pick mode", () => {
    assert.equal(isAddressPickMode(), false);
    beginAddressPick();
    assert.equal(isAddressPickMode(), true);
    clearAddressPick();
    assert.equal(isAddressPickMode(), false);
  });

  it("maps Address row cells", () => {
    const addr = checkoutAddressFromRow(
      {
        "Address.consignee": "苏晚",
        "Address.phone": "13800001003",
        "Address.region": "浙江省 杭州市",
        "Address.address": "文三路 200 号",
        "Address.isDefault": 1,
        "Address.tag": "家",
      },
      "Address",
      1404,
    );
    assert.equal(addr.id, 1404);
    assert.equal(addr.consignee, "苏晚");
    assert.equal(addr.isDefault, true);
    assert.equal(addr.tag, "家");
  });
});

describe("parseShippingText", () => {
  it("parses a single recipient line", () => {
    const parties = parseShippingText(
      "张三 13800001001 上海市静安区南京西路100号",
    );
    assert.ok(parties.length >= 1);
    const p = preferConsigneeParty(parties)!;
    assert.equal(p.phone, "13800001001");
    assert.match(p.consignee, /张三/);
    assert.match(p.region + p.address, /上海|南京西路/);
  });

  it("splits sender and recipient", () => {
    const parties = parseShippingText(
      "寄件人：李四 13900001002 北京市朝阳区工体北路8号\n收件人：王五 13700001003 广东省深圳市南山区科技园路1号",
    );
    assert.ok(parties.length >= 2);
    const sender = parties.find((p) => p.role === "sender");
    const recv = parties.find((p) => p.role === "consignee");
    assert.equal(sender?.consignee, "李四");
    assert.equal(sender?.phone, "13900001002");
    assert.equal(recv?.consignee, "王五");
    assert.equal(recv?.phone, "13700001003");
    assert.equal(preferConsigneeParty(parties)?.role, "consignee");
  });

  it("recognizes courier and pickup roles", () => {
    const parties = parseShippingText(
      "送货人赵六 13600001004 取货人钱七 13500001005 杭州市西湖区文三路200号",
    );
    assert.ok(parties.some((p) => p.role === "courier"));
    assert.ok(parties.some((p) => p.role === "pickup" || p.phone === "13500001005"));
  });

  it("suggests consignees by name prefix", () => {
    const known = [
      {
        consignee: "林晓",
        phone: "13800001001",
        region: "上海",
        address: "南京西路",
      },
      {
        consignee: "苏晚",
        phone: "13800001003",
        region: "杭州",
        address: "文三路",
      },
    ];
    const hit = suggestConsignees("林", known);
    assert.equal(hit[0]?.consignee, "林晓");
  });
});
