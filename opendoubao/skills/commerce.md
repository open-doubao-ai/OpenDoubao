---
name: commerce
title: 电商购物
titleEn: Shopping
tableName: Product
family: commerce
tokens: ["product","goods","sku","商品","电商购物"]
description: 商品、购物车、订单、地址。
---
# 电商购物
- 主表 Product，订单 ShopOrder，地址 Address，购物车 Cart
- 分类 Category.app=commerce
- 列表按 date-；排行用 sales-
- 支付清结算不要用 APIJSON 硬扛
