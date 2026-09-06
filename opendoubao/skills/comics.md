---
name: comics
title: 漫画阅读
titleEn: Comics
tableName: Comic
family: article
tokens: ["comic","manga","漫画","漫画阅读"]
description: 漫画作品与话次。
---
# 漫画阅读
- 主表 Comic，分类 Category.app=comics
- 目录层 CRUD；详情为书页阅读器（竖屏单页、横屏左右两页，pictureList 分页图）
- 上传页：封面 + 分页图 pictureList，标题与简介
