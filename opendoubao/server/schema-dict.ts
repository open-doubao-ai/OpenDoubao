/** Few-shot table dictionary for APIJSON-Demo + layout demo tables. */
export const SCHEMA_DICT = `
Tables (APIJSON-Demo + layout categories):
- User: id, sex, name, tag, head, contactIdList, pictureList, date  (数据管理)
- Employee: id, userId, name, dept, title, sex, salary, status, email, phone, head, date  (数据管理)
- Activity: id, userId, categoryId, title, cover, content, startTime, endTime, status, signupCount, date  (运营活动)
- Moment: id, userId, categoryId, date, content, praiseUserIdList, commentCount, pictureList  (社交)
- Comment: id, toId, userId, momentId, content, date
- Message: id, userId, categoryId, toUserId, conversationId, author, head, content, date  (聊天)
- News: id, userId, categoryId, title, headline, source, author, cover, content, viewCount, date  (新闻资讯)
- Notice: id, userId, categoryId, title, cover, content, status, date  (公告)
- Blog: id, userId, categoryId, title, author, cover, content, date  (博客)
- Article: id, userId, categoryId, title, author, cover, content, date  (文章)
- Video: id, userId, categoryId, title, author, cover, videoUrl, subtitleList, qualityList, duration, playCount, date  (视频)
- Music: id, userId, categoryId, title, artist, album, cover, audioUrl, lyrics, duration, playCount, praiseUserIdList, collectUserIdList, shareCount, date  (音乐)
- Product: id, userId, categoryId, name, cover, pictureList, description, price, stock, sales, status, date  (电商)
- Cart: id, userId, productId, title, cover, price, qty, date  (购物车)
- ShopOrder: id, userId, consignee, phone, address, remark, total, status, date  (订单)
- Category: id, userId, app, name, cover, sort, date  (分类/栏目/流派；app=commerce/education/…)
- Address: id, userId, consignee, phone, region, address, tag, isDefault, date  (收件地址)
- Course: id, userId, categoryId, title, author, cover, content, lessons, viewCount, date  (教育学习)
- Book: id, userId, categoryId, title, author, cover, content, publisher, viewCount, date  (小说阅读)
- Comic: id, userId, categoryId, title, author, cover, content, chapterCount, viewCount, date  (漫画阅读)
- Local: id, userId, categoryId, title, author, cover, content, address, price, viewCount, date  (本地生活)
- Recipe: id, userId, categoryId, title, author, cover, content, minutes, viewCount, date  (餐饮美食)
- Trip: id, userId, categoryId, title, author, cover, content, destination, days, viewCount, date  (旅游出行)
- Sport: id, userId, categoryId, title, author, cover, content, league, viewCount, date  (体育资讯)
- Baby: id, userId, categoryId, title, author, cover, content, monthAge, viewCount, date  (母婴育儿)
- Workout: id, userId, categoryId, title, author, cover, content, duration, kcal, viewCount, date  (健康运动)
- Vehicle: id, userId, categoryId, title, author, cover, content, brand, viewCount, date  (汽车服务)
- Job: id, userId, categoryId, title, author, cover, content, company, salary, viewCount, date  (招聘求职)
- House: id, userId, categoryId, title, author, cover, content, area, price, viewCount, date  (房产家居)
- Beauty: id, userId, categoryId, title, author, cover, content, shop, price, viewCount, date  (美业预约)
- Photo: id, userId, categoryId, title, author, cover, content, location, pictureList, viewCount, date  (摄影相册)
- Note: id, userId, categoryId, title, author, cover, content, tag, viewCount, date  (办公效率)
- Skill: id, userId, name, title, titleEn, tableName, family, tokens, description, url, version, status, cover, date  (场景技能；库里只存 URL，正文在 /skills/{name}.md)

Identity / role / structure rules for generated requests:
- Never hardcode id or userId (no sample ids like 38710 / 1 / 22).
- Do not set outermost "@role" on POST/PUT/DELETE (server fills).
- GET/HEAD (open): client may set "@role" to Access minimum for the tables.
- Non-open methods (gets/post/put/delete, or GET with tag): must match Request
  table (method + tag + version) — honor structure MUST/REFUSE/TYPE/VERIFY.
- Outermost "tag" defaults to the table name (Moment, Comment). Do not copy
  page ids (moment_list, moment_detail) into tag.
- Mint a new tag (Moment:minen, Comment:circle, moment_list) only when Request
  for that table+method already exists and its MUST/REFUSE/UPDATE does not fit.
- GET/HEAD lists omit tag (open). Tagged GET only to match an existing Request.
- POST writes: omit userId — session injects the visitor.
- Prefer list queries; open a row in the UI for detail / edit / delete.
- Do not JOIN User by default when the session already scopes the visitor.

Common APIJSON patterns:
GET list (omit @column on the primary table so all fields return):
{ "[]": { "count": 20, "page": 0, "Moment": { "@order": "date-" } } }
{ "[]": { "count": 20, "page": 0, "User": { "@order": "date-" } } }
{ "[]": { "count": 20, "page": 0, "Product": { "@order": "date-" } } }
{ "[]": { "count": 20, "page": 0, "News": { "@order": "date-" } } }
{ "[]": { "count": 50, "page": 0, "Category": { "app": "commerce", "@order": "sort+" } } }

POST:
{ "Moment": { "content": "..." }, "tag": "Moment" }
{ "Product": { "name": "..." }, "tag": "Product" }

PUT (id must come from the user-selected row, never invent one):
{ "Comment": { "content": "..." }, "tag": "Comment" }

DELETE: do not invent an id — list first, then delete from the UI.
`.trim();
