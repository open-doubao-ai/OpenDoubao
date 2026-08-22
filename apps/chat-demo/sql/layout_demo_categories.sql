-- Idempotent Category table + categoryId on content tables.
-- Safe to re-run. Used by chat-demo POST /api/ensure-layout-categories
-- and as the incremental tail of layout_demo_tables.sql.
--
--   /usr/local/mysql/bin/mysql -h127.0.0.1 -P3306 -uroot -papijson sys < apps/chat-demo/sql/layout_demo_categories.sql
--
-- After first import: reload Access/Request (TYPE_RELOAD=4 + /reload, or restart).

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `Category` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '录入人 User.id',
  `app` varchar(20) NOT NULL COMMENT '应用大类：commerce/music/news/video/info/blog/article/campaign/social/chat',
  `name` varchar(40) NOT NULL COMMENT '分类名',
  `cover` varchar(400) DEFAULT NULL COMMENT '分类封面图',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建日期',
  PRIMARY KEY (`id`),
  KEY `app_sort` (`app`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用分类/栏目/流派';

INSERT INTO `Category` (`id`,`userId`,`app`,`name`,`cover`,`sort`,`date`) VALUES
(1301, 82001, 'commerce', '电器', 'https://picsum.photos/id/201/400/400', 1, '2026-08-01 10:00:00'),
(1302, 82001, 'commerce', '服装', 'https://picsum.photos/id/1011/400/400', 2, '2026-08-01 10:00:00'),
(1303, 82001, 'commerce', '运动', 'https://picsum.photos/id/28/400/400', 3, '2026-08-01 10:00:00'),
(1304, 82001, 'commerce', '美妆', 'https://picsum.photos/id/1080/400/400', 4, '2026-08-01 10:00:00'),
(1305, 82001, 'commerce', '食品', 'https://picsum.photos/id/225/400/400', 5, '2026-08-01 10:00:00'),
(1306, 82001, 'commerce', '家居', 'https://picsum.photos/id/1078/400/400', 6, '2026-08-01 10:00:00'),
(1307, 82001, 'commerce', '数码', 'https://picsum.photos/id/119/400/400', 7, '2026-08-01 10:00:00'),
(1308, 82001, 'commerce', '图书', 'https://picsum.photos/id/24/400/400', 8, '2026-08-01 10:00:00'),
(1311, 82001, 'music', '流行', 'https://picsum.photos/id/39/400/400', 1, '2026-08-01 10:00:00'),
(1312, 82001, 'music', '摇滚', 'https://picsum.photos/id/88/400/400', 2, '2026-08-01 10:00:00'),
(1313, 82001, 'music', '古典', 'https://picsum.photos/id/54/400/400', 3, '2026-08-01 10:00:00'),
(1314, 82001, 'music', '电子', 'https://picsum.photos/id/58/400/400', 4, '2026-08-01 10:00:00'),
(1315, 82001, 'music', '民谣', 'https://picsum.photos/id/45/400/400', 5, '2026-08-01 10:00:00'),
(1316, 82001, 'music', '爵士', 'https://picsum.photos/id/40/400/400', 6, '2026-08-01 10:00:00'),
(1321, 82001, 'news', '要闻', 'https://picsum.photos/id/1011/400/400', 1, '2026-08-01 10:00:00'),
(1322, 82001, 'news', '财经', 'https://picsum.photos/id/20/400/400', 2, '2026-08-01 10:00:00'),
(1323, 82001, 'news', '科技', 'https://picsum.photos/id/0/400/400', 3, '2026-08-01 10:00:00'),
(1324, 82001, 'news', '体育', 'https://picsum.photos/id/28/400/400', 4, '2026-08-01 10:00:00'),
(1325, 82001, 'news', '娱乐', 'https://picsum.photos/id/1015/400/400', 5, '2026-08-01 10:00:00'),
(1326, 82001, 'news', '社会', 'https://picsum.photos/id/1019/400/400', 6, '2026-08-01 10:00:00'),
(1331, 82001, 'info', '公告', 'https://picsum.photos/id/60/400/400', 1, '2026-08-01 10:00:00'),
(1332, 82001, 'info', '制度', 'https://picsum.photos/id/180/400/400', 2, '2026-08-01 10:00:00'),
(1333, 82001, 'info', '活动', 'https://picsum.photos/id/1016/400/400', 3, '2026-08-01 10:00:00'),
(1334, 82001, 'info', '福利', 'https://picsum.photos/id/292/400/400', 4, '2026-08-01 10:00:00'),
(1335, 82001, 'info', '培训', 'https://picsum.photos/id/96/400/400', 5, '2026-08-01 10:00:00'),
(1341, 82001, 'video', '音乐', 'https://picsum.photos/id/39/400/400', 1, '2026-08-01 10:00:00'),
(1342, 82001, 'video', '游戏', 'https://picsum.photos/id/96/400/400', 2, '2026-08-01 10:00:00'),
(1343, 82001, 'video', '教育', 'https://picsum.photos/id/24/400/400', 3, '2026-08-01 10:00:00'),
(1344, 82001, 'video', '生活', 'https://picsum.photos/id/106/400/400', 4, '2026-08-01 10:00:00'),
(1345, 82001, 'video', '科技', 'https://picsum.photos/id/0/400/400', 5, '2026-08-01 10:00:00'),
(1346, 82001, 'video', '纪录片', 'https://picsum.photos/id/1015/400/400', 6, '2026-08-01 10:00:00'),
(1351, 82001, 'blog', '技术', 'https://picsum.photos/id/2/400/400', 1, '2026-08-01 10:00:00'),
(1352, 82001, 'blog', '产品', 'https://picsum.photos/id/1015/400/400', 2, '2026-08-01 10:00:00'),
(1353, 82001, 'blog', '随笔', 'https://picsum.photos/id/201/400/400', 3, '2026-08-01 10:00:00'),
(1354, 82001, 'blog', '设计', 'https://picsum.photos/id/177/400/400', 4, '2026-08-01 10:00:00'),
(1355, 82001, 'blog', '职场', 'https://picsum.photos/id/180/400/400', 5, '2026-08-01 10:00:00'),
(1361, 82001, 'article', '教程', 'https://picsum.photos/id/177/400/400', 1, '2026-08-01 10:00:00'),
(1362, 82001, 'article', '深度', 'https://picsum.photos/id/0/400/400', 2, '2026-08-01 10:00:00'),
(1363, 82001, 'article', '观点', 'https://picsum.photos/id/60/400/400', 3, '2026-08-01 10:00:00'),
(1364, 82001, 'article', '译文', 'https://picsum.photos/id/48/400/400', 4, '2026-08-01 10:00:00'),
(1365, 82001, 'article', '快讯', 'https://picsum.photos/id/1018/400/400', 5, '2026-08-01 10:00:00'),
(1371, 82001, 'campaign', '促销', 'https://picsum.photos/id/1060/400/400', 1, '2026-08-01 10:00:00'),
(1372, 82001, 'campaign', '招募', 'https://picsum.photos/id/1018/400/400', 2, '2026-08-01 10:00:00'),
(1373, 82001, 'campaign', '赛事', 'https://picsum.photos/id/1016/400/400', 3, '2026-08-01 10:00:00'),
(1374, 82001, 'campaign', '沙龙', 'https://picsum.photos/id/201/400/400', 4, '2026-08-01 10:00:00'),
(1381, 82001, 'social', '日常', 'https://picsum.photos/id/1015/400/400', 1, '2026-08-01 10:00:00'),
(1382, 82001, 'social', '旅行', 'https://picsum.photos/id/1016/400/400', 2, '2026-08-01 10:00:00'),
(1383, 82001, 'social', '美食', 'https://picsum.photos/id/292/400/400', 3, '2026-08-01 10:00:00'),
(1384, 82001, 'social', '摄影', 'https://picsum.photos/id/106/400/400', 4, '2026-08-01 10:00:00'),
(1391, 82001, 'chat', '工作', 'https://picsum.photos/id/201/400/400', 1, '2026-08-01 10:00:00'),
(1392, 82001, 'chat', '好友', 'https://picsum.photos/id/64/400/400', 2, '2026-08-01 10:00:00'),
(1393, 82001, 'chat', '通知', 'https://picsum.photos/id/60/400/400', 3, '2026-08-01 10:00:00')
ON DUPLICATE KEY UPDATE
  `app` = VALUES(`app`),
  `name` = VALUES(`name`),
  `cover` = VALUES(`cover`),
  `sort` = VALUES(`sort`);

-- categoryId on content tables (skip if already present)
SET @db := DATABASE();
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Product')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Product' AND COLUMN_NAME='categoryId'),
  'ALTER TABLE `Product` ADD COLUMN `categoryId` bigint DEFAULT NULL COMMENT ''分类 Category.id''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Music')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Music' AND COLUMN_NAME='categoryId'),
  'ALTER TABLE `Music` ADD COLUMN `categoryId` bigint DEFAULT NULL COMMENT ''流派 Category.id''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='News')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='News' AND COLUMN_NAME='categoryId'),
  'ALTER TABLE `News` ADD COLUMN `categoryId` bigint DEFAULT NULL COMMENT ''栏目 Category.id''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Notice')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Notice' AND COLUMN_NAME='categoryId'),
  'ALTER TABLE `Notice` ADD COLUMN `categoryId` bigint DEFAULT NULL COMMENT ''栏目 Category.id''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Video')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Video' AND COLUMN_NAME='categoryId'),
  'ALTER TABLE `Video` ADD COLUMN `categoryId` bigint DEFAULT NULL COMMENT ''分类 Category.id''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Blog')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Blog' AND COLUMN_NAME='categoryId'),
  'ALTER TABLE `Blog` ADD COLUMN `categoryId` bigint DEFAULT NULL COMMENT ''分类 Category.id''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Article')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Article' AND COLUMN_NAME='categoryId'),
  'ALTER TABLE `Article` ADD COLUMN `categoryId` bigint DEFAULT NULL COMMENT ''分类 Category.id''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Activity')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Activity' AND COLUMN_NAME='categoryId'),
  'ALTER TABLE `Activity` ADD COLUMN `categoryId` bigint DEFAULT NULL COMMENT ''分类 Category.id''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Moment')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Moment' AND COLUMN_NAME='categoryId'),
  'ALTER TABLE `Moment` ADD COLUMN `categoryId` bigint DEFAULT NULL COMMENT ''话题 Category.id''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Message')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Message' AND COLUMN_NAME='categoryId'),
  'ALTER TABLE `Message` ADD COLUMN `categoryId` bigint DEFAULT NULL COMMENT ''分类 Category.id''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE `Product` SET `categoryId` = 1305 WHERE `id` = 1001 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Product` SET `categoryId` = 1306 WHERE `id` = 1002 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Product` SET `categoryId` = 1307 WHERE `id` = 1003 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Product` SET `categoryId` = 1303 WHERE `id` = 1004 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Product` SET `categoryId` = 1302 WHERE `id` = 1005 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Product` SET `categoryId` = 1304 WHERE `id` = 1006 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Product` SET `categoryId` = 1301 WHERE `id` = 1007 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Product` SET `categoryId` = 1301 WHERE `id` = 1008 AND (`categoryId` IS NULL OR `categoryId` = 0);

UPDATE `Music` SET `categoryId` = 1311 WHERE `id` = 901 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Music` SET `categoryId` = 1312 WHERE `id` = 902 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Music` SET `categoryId` = 1313 WHERE `id` = 903 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Music` SET `categoryId` = 1314 WHERE `id` = 904 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Music` SET `categoryId` = 1315 WHERE `id` = 905 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Music` SET `categoryId` = 1316 WHERE `id` = 906 AND (`categoryId` IS NULL OR `categoryId` = 0);

UPDATE `News` SET `categoryId` = 1321 WHERE `id` = 401 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `News` SET `categoryId` = 1323 WHERE `id` = 402 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `News` SET `categoryId` = 1326 WHERE `id` = 403 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `News` SET `categoryId` = 1324 WHERE `id` = 404 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `News` SET `categoryId` = 1325 WHERE `id` = 405 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `News` SET `categoryId` = 1322 WHERE `id` = 406 AND (`categoryId` IS NULL OR `categoryId` = 0);

UPDATE `Notice` SET `categoryId` = 1331 WHERE `id` = 501 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Notice` SET `categoryId` = 1332 WHERE `id` = 502 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Notice` SET `categoryId` = 1333 WHERE `id` = 503 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Notice` SET `categoryId` = 1332 WHERE `id` = 504 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Notice` SET `categoryId` = 1334 WHERE `id` = 505 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Notice` SET `categoryId` = 1333 WHERE `id` = 506 AND (`categoryId` IS NULL OR `categoryId` = 0);

UPDATE `Video` SET `categoryId` = 1346 WHERE `id` = 801 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Video` SET `categoryId` = 1346 WHERE `id` = 802 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Video` SET `categoryId` = 1346 WHERE `id` = 803 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Video` SET `categoryId` = 1344 WHERE `id` = 804 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Video` SET `categoryId` = 1343 WHERE `id` = 805 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Video` SET `categoryId` = 1344 WHERE `id` = 806 AND (`categoryId` IS NULL OR `categoryId` = 0);

UPDATE `Blog` SET `categoryId` = 1351 WHERE `id` = 601 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Blog` SET `categoryId` = 1352 WHERE `id` = 602 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Blog` SET `categoryId` = 1351 WHERE `id` = 603 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Blog` SET `categoryId` = 1351 WHERE `id` = 604 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Blog` SET `categoryId` = 1353 WHERE `id` = 605 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Blog` SET `categoryId` = 1351 WHERE `id` = 606 AND (`categoryId` IS NULL OR `categoryId` = 0);

UPDATE `Article` SET `categoryId` = 1362 WHERE `id` = 701 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Article` SET `categoryId` = 1362 WHERE `id` = 702 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Article` SET `categoryId` = 1361 WHERE `id` = 703 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Article` SET `categoryId` = 1363 WHERE `id` = 704 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Article` SET `categoryId` = 1361 WHERE `id` = 705 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Article` SET `categoryId` = 1363 WHERE `id` = 706 AND (`categoryId` IS NULL OR `categoryId` = 0);

UPDATE `Activity` SET `categoryId` = 1371 WHERE `id` = 201 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Activity` SET `categoryId` = 1372 WHERE `id` = 202 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Activity` SET `categoryId` = 1373 WHERE `id` = 203 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Activity` SET `categoryId` = 1371 WHERE `id` = 204 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Activity` SET `categoryId` = 1371 WHERE `id` = 205 AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Activity` SET `categoryId` = 1374 WHERE `id` = 206 AND (`categoryId` IS NULL OR `categoryId` = 0);

UPDATE `Message` SET `categoryId` = 1391 WHERE `id` IN (301, 302, 303) AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Message` SET `categoryId` = 1392 WHERE `id` IN (304, 305, 308) AND (`categoryId` IS NULL OR `categoryId` = 0);
UPDATE `Message` SET `categoryId` = 1393 WHERE `id` IN (306, 307) AND (`categoryId` IS NULL OR `categoryId` = 0);

DELETE FROM `Access` WHERE `id` = 62 OR `alias` = 'Category' OR `name` = 'Category';
INSERT INTO `Access` (`id`, `debug`, `schema`, `name`, `alias`, `get`, `head`, `gets`, `heads`, `post`, `put`, `delete`, `date`, `detail`)
VALUES
(62, 0, NULL, 'Category', 'Category',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '通用分类/栏目/流派');

DELETE FROM `Request` WHERE `id` BETWEEN 9105134 AND 9105136 OR (`tag` = 'Category' AND `method` IN ('POST', 'PUT', 'DELETE'));
INSERT INTO `Request` (`id`, `debug`, `version`, `method`, `tag`, `structure`, `detail`, `date`) VALUES
(9105134, 0, 1, 'POST', 'Category', CAST('{"MUST":"name,app","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Category', NOW()),
(9105135, 0, 1, 'PUT', 'Category', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Category', NOW()),
(9105136, 0, 1, 'DELETE', 'Category', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Category', NOW());
