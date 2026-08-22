/** Few-shot table dictionary for APIJSON-Demo + layout demo tables. */
export const SCHEMA_DICT = `
Tables (APIJSON-Demo + layout categories):
- User: id, sex, name, tag, head, contactIdList, pictureList, date  (数据管理)
- Employee: id, userId, name, dept, title, sex, salary, status, email, phone, head, date  (数据管理)
- Activity: id, userId, categoryId, title, cover, content, startTime, endTime, status, signupCount, date  (运营活动)
- Moment: id, userId, categoryId, date, content, praiseUserIdList, commentCount, pictureList  (社交)
- Comment: id, toId, userId, momentId, content, date
- Message: id, userId, categoryId, toUserId, conversationId, author, head, content, date  (聊天)
- News: id, userId, categoryId, title, headline, source, author, cover, content, viewCount, date  (新闻)
- Notice: id, userId, categoryId, title, cover, content, status, date  (资讯)
- Blog: id, userId, categoryId, title, author, cover, content, date  (博客)
- Article: id, userId, categoryId, title, author, cover, content, date  (文章)
- Video: id, userId, categoryId, title, author, cover, videoUrl, duration, playCount, date  (视频)
- Music: id, userId, categoryId, title, artist, album, cover, audioUrl, duration, playCount, date  (音乐)
- Product: id, userId, categoryId, name, cover, pictureList, description, price, stock, sales, status, date  (电商)
- Cart: id, userId, productId, title, cover, price, qty, date  (购物车)
- ShopOrder: id, userId, consignee, phone, address, remark, total, status, date  (订单)
- Category: id, userId, app, name, cover, sort, date  (分类/栏目/流派；app=commerce/music/news/…)
- Address: id, userId, consignee, phone, region, address, tag, isDefault, date  (收件地址)

Identity / role / structure rules for generated requests:
- Never hardcode id or userId (no sample ids like 38710 / 1 / 22).
- Do not set outermost "@role" on POST/PUT/DELETE (server fills).
- GET/HEAD (open): client may set "@role" to Access minimum for the tables.
- Non-open methods (gets/post/put/delete, or GET with tag): must match Request
  table (method + tag + version) — honor structure MUST/REFUSE/TYPE/VERIFY.
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
