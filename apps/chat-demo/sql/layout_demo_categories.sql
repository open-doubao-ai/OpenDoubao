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
  `parentId` bigint DEFAULT NULL COMMENT '父分类 Category.id，空为一级',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建日期',
  PRIMARY KEY (`id`),
  KEY `app_sort` (`app`, `sort`),
  KEY `parentId` (`parentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用分类/栏目/流派';

INSERT INTO `Category` (`id`,`userId`,`app`,`name`,`cover`,`sort`,`date`) VALUES
(1301, 82001, 'commerce', '电器', '/media/covers/201.svg', 1, '2026-08-01 10:00:00'),
(1302, 82001, 'commerce', '服装', '/media/covers/1011.svg', 2, '2026-08-01 10:00:00'),
(1303, 82001, 'commerce', '运动', '/media/covers/28.svg', 3, '2026-08-01 10:00:00'),
(1304, 82001, 'commerce', '美妆', '/media/covers/1080.svg', 4, '2026-08-01 10:00:00'),
(1305, 82001, 'commerce', '食品', '/media/covers/225.svg', 5, '2026-08-01 10:00:00'),
(1306, 82001, 'commerce', '家居', '/media/covers/1078.svg', 6, '2026-08-01 10:00:00'),
(1307, 82001, 'commerce', '数码', '/media/covers/119.svg', 7, '2026-08-01 10:00:00'),
(1308, 82001, 'commerce', '图书', '/media/covers/24.svg', 8, '2026-08-01 10:00:00'),
(1311, 82001, 'music', '流行', '/media/covers/39.svg', 1, '2026-08-01 10:00:00'),
(1312, 82001, 'music', '摇滚', '/media/covers/88.svg', 2, '2026-08-01 10:00:00'),
(1313, 82001, 'music', '古典', '/media/covers/54.svg', 3, '2026-08-01 10:00:00'),
(1314, 82001, 'music', '电子', '/media/covers/58.svg', 4, '2026-08-01 10:00:00'),
(1315, 82001, 'music', '民谣', '/media/covers/45.svg', 5, '2026-08-01 10:00:00'),
(1316, 82001, 'music', '爵士', '/media/covers/40.svg', 6, '2026-08-01 10:00:00'),
(1321, 82001, 'news', '要闻', '/media/covers/1011.svg', 1, '2026-08-01 10:00:00'),
(1322, 82001, 'news', '财经', '/media/covers/20.svg', 2, '2026-08-01 10:00:00'),
(1323, 82001, 'news', '科技', '/media/covers/0.svg', 3, '2026-08-01 10:00:00'),
(1324, 82001, 'news', '体育', '/media/covers/28.svg', 4, '2026-08-01 10:00:00'),
(1325, 82001, 'news', '娱乐', '/media/covers/1015.svg', 5, '2026-08-01 10:00:00'),
(1326, 82001, 'news', '社会', '/media/covers/1019.svg', 6, '2026-08-01 10:00:00'),
(1331, 82001, 'info', '公告', '/media/covers/60.svg', 1, '2026-08-01 10:00:00'),
(1332, 82001, 'info', '制度', '/media/covers/180.svg', 2, '2026-08-01 10:00:00'),
(1333, 82001, 'info', '活动', '/media/covers/1016.svg', 3, '2026-08-01 10:00:00'),
(1334, 82001, 'info', '福利', '/media/covers/292.svg', 4, '2026-08-01 10:00:00'),
(1335, 82001, 'info', '培训', '/media/covers/96.svg', 5, '2026-08-01 10:00:00'),
(1341, 82001, 'video', '音乐', '/media/covers/39.svg', 1, '2026-08-01 10:00:00'),
(1342, 82001, 'video', '游戏', '/media/covers/96.svg', 2, '2026-08-01 10:00:00'),
(1343, 82001, 'video', '教育', '/media/covers/24.svg', 3, '2026-08-01 10:00:00'),
(1344, 82001, 'video', '生活', '/media/covers/106.svg', 4, '2026-08-01 10:00:00'),
(1345, 82001, 'video', '科技', '/media/covers/0.svg', 5, '2026-08-01 10:00:00'),
(1346, 82001, 'video', '纪录片', '/media/covers/1015.svg', 6, '2026-08-01 10:00:00'),
(1351, 82001, 'blog', '技术', '/media/covers/2.svg', 1, '2026-08-01 10:00:00'),
(1352, 82001, 'blog', '产品', '/media/covers/1015.svg', 2, '2026-08-01 10:00:00'),
(1353, 82001, 'blog', '随笔', '/media/covers/201.svg', 3, '2026-08-01 10:00:00'),
(1354, 82001, 'blog', '设计', '/media/covers/177.svg', 4, '2026-08-01 10:00:00'),
(1355, 82001, 'blog', '职场', '/media/covers/180.svg', 5, '2026-08-01 10:00:00'),
(1361, 82001, 'article', '教程', '/media/covers/177.svg', 1, '2026-08-01 10:00:00'),
(1362, 82001, 'article', '深度', '/media/covers/0.svg', 2, '2026-08-01 10:00:00'),
(1363, 82001, 'article', '观点', '/media/covers/60.svg', 3, '2026-08-01 10:00:00'),
(1364, 82001, 'article', '译文', '/media/covers/48.svg', 4, '2026-08-01 10:00:00'),
(1365, 82001, 'article', '快讯', '/media/covers/1018.svg', 5, '2026-08-01 10:00:00'),
(1371, 82001, 'campaign', '促销', '/media/covers/1060.svg', 1, '2026-08-01 10:00:00'),
(1372, 82001, 'campaign', '招募', '/media/covers/1018.svg', 2, '2026-08-01 10:00:00'),
(1373, 82001, 'campaign', '赛事', '/media/covers/1016.svg', 3, '2026-08-01 10:00:00'),
(1374, 82001, 'campaign', '沙龙', '/media/covers/201.svg', 4, '2026-08-01 10:00:00'),
(1381, 82001, 'social', '日常', '/media/covers/1015.svg', 1, '2026-08-01 10:00:00'),
(1382, 82001, 'social', '旅行', '/media/covers/1016.svg', 2, '2026-08-01 10:00:00'),
(1383, 82001, 'social', '美食', '/media/covers/292.svg', 3, '2026-08-01 10:00:00'),
(1384, 82001, 'social', '摄影', '/media/covers/106.svg', 4, '2026-08-01 10:00:00'),
(1391, 82001, 'chat', '工作', '/media/covers/201.svg', 1, '2026-08-01 10:00:00'),
(1392, 82001, 'chat', '好友', '/media/covers/64.svg', 2, '2026-08-01 10:00:00'),
(1393, 82001, 'chat', '通知', '/media/covers/60.svg', 3, '2026-08-01 10:00:00'),
(1401, 82001, 'education', '语言培训', '/media/covers/24.svg', 1, '2026-08-01 10:00:00'),
(1402, 82001, 'education', '编程开发', '/media/covers/0.svg', 2, '2026-08-01 10:00:00'),
(1403, 82001, 'education', '考研备考', '/media/covers/180.svg', 3, '2026-08-01 10:00:00'),
(1404, 82001, 'education', '职业技能', '/media/covers/96.svg', 4, '2026-08-01 10:00:00'),
(1405, 82001, 'education', '少儿启蒙', '/media/covers/1015.svg', 5, '2026-08-01 10:00:00'),
(1406, 82001, 'education', '兴趣爱好', '/media/covers/201.svg', 6, '2026-08-01 10:00:00'),
(1411, 82001, 'books', '文学小说', '/media/covers/24.svg', 1, '2026-08-01 10:00:00'),
(1412, 82001, 'books', '经管励志', '/media/covers/20.svg', 2, '2026-08-01 10:00:00'),
(1413, 82001, 'books', '人文历史', '/media/covers/1019.svg', 3, '2026-08-01 10:00:00'),
(1414, 82001, 'books', '科学技术', '/media/covers/0.svg', 4, '2026-08-01 10:00:00'),
(1415, 82001, 'books', '生活百科', '/media/covers/1080.svg', 5, '2026-08-01 10:00:00'),
(1416, 82001, 'books', '儿童读物', '/media/covers/1015.svg', 6, '2026-08-01 10:00:00'),
(1421, 82001, 'comics', '少年热血', '/media/covers/96.svg', 1, '2026-08-01 10:00:00'),
(1422, 82001, 'comics', '少女恋爱', '/media/covers/64.svg', 2, '2026-08-01 10:00:00'),
(1423, 82001, 'comics', '奇幻冒险', '/media/covers/1016.svg', 3, '2026-08-01 10:00:00'),
(1424, 82001, 'comics', '日常搞笑', '/media/covers/106.svg', 4, '2026-08-01 10:00:00'),
(1425, 82001, 'comics', '科幻机甲', '/media/covers/160.svg', 5, '2026-08-01 10:00:00'),
(1426, 82001, 'comics', '悬疑推理', '/media/covers/60.svg', 6, '2026-08-01 10:00:00'),
(1431, 82001, 'lifestyle', '家政保洁', '/media/covers/201.svg', 1, '2026-08-01 10:00:00'),
(1432, 82001, 'lifestyle', '维修安装', '/media/covers/180.svg', 2, '2026-08-01 10:00:00'),
(1433, 82001, 'lifestyle', '跑腿代办', '/media/covers/1018.svg', 3, '2026-08-01 10:00:00'),
(1434, 82001, 'lifestyle', '丽人美发', '/media/covers/64.svg', 4, '2026-08-01 10:00:00'),
(1435, 82001, 'lifestyle', '休闲娱乐', '/media/covers/1016.svg', 5, '2026-08-01 10:00:00'),
(1436, 82001, 'lifestyle', '便民服务', '/media/covers/292.svg', 6, '2026-08-01 10:00:00'),
(1441, 82001, 'food', '家常菜谱', '/media/covers/292.svg', 1, '2026-08-01 10:00:00'),
(1442, 82001, 'food', '烘焙甜品', '/media/covers/1080.svg', 2, '2026-08-01 10:00:00'),
(1443, 82001, 'food', '地方小吃', '/media/covers/225.svg', 3, '2026-08-01 10:00:00'),
(1444, 82001, 'food', '减脂轻食', '/media/covers/488.svg', 4, '2026-08-01 10:00:00'),
(1445, 82001, 'food', '饮品咖啡', '/media/covers/431.svg', 5, '2026-08-01 10:00:00'),
(1446, 82001, 'food', '餐厅探店', '/media/covers/42.svg', 6, '2026-08-01 10:00:00'),
(1451, 82001, 'travel', '国内游记', '/media/covers/1016.svg', 1, '2026-08-01 10:00:00'),
(1452, 82001, 'travel', '出境旅行', '/media/covers/1015.svg', 2, '2026-08-01 10:00:00'),
(1453, 82001, 'travel', '周边度假', '/media/covers/1036.svg', 3, '2026-08-01 10:00:00'),
(1454, 82001, 'travel', '酒店民宿', '/media/covers/164.svg', 4, '2026-08-01 10:00:00'),
(1455, 82001, 'travel', '景点门票', '/media/covers/28.svg', 5, '2026-08-01 10:00:00'),
(1456, 82001, 'travel', '行程攻略', '/media/covers/29.svg', 6, '2026-08-01 10:00:00'),
(1461, 82001, 'sports', '足球赛事', '/media/covers/28.svg', 1, '2026-08-01 10:00:00'),
(1462, 82001, 'sports', '篮球资讯', '/media/covers/73.svg', 2, '2026-08-01 10:00:00'),
(1463, 82001, 'sports', '综合竞技', '/media/covers/76.svg', 3, '2026-08-01 10:00:00'),
(1464, 82001, 'sports', '健身跑步', '/media/covers/66.svg', 4, '2026-08-01 10:00:00'),
(1465, 82001, 'sports', '冬夏奥运', '/media/covers/1011.svg', 5, '2026-08-01 10:00:00'),
(1466, 82001, 'sports', '球迷社区', '/media/covers/1012.svg', 6, '2026-08-01 10:00:00'),
(1471, 82001, 'parenting', '孕期指南', '/media/covers/1015.svg', 1, '2026-08-01 10:00:00'),
(1472, 82001, 'parenting', '辅食喂养', '/media/covers/292.svg', 2, '2026-08-01 10:00:00'),
(1473, 82001, 'parenting', '早教启蒙', '/media/covers/24.svg', 3, '2026-08-01 10:00:00'),
(1474, 82001, 'parenting', '用品评测', '/media/covers/201.svg', 4, '2026-08-01 10:00:00'),
(1475, 82001, 'parenting', '亲子互动', '/media/covers/1016.svg', 5, '2026-08-01 10:00:00'),
(1476, 82001, 'parenting', '疫苗提醒', '/media/covers/180.svg', 6, '2026-08-01 10:00:00'),
(1481, 82001, 'health', '力量训练', '/media/covers/66.svg', 1, '2026-08-01 10:00:00'),
(1482, 82001, 'health', '有氧燃脂', '/media/covers/28.svg', 2, '2026-08-01 10:00:00'),
(1483, 82001, 'health', '瑜伽拉伸', '/media/covers/1016.svg', 3, '2026-08-01 10:00:00'),
(1484, 82001, 'health', '饮食打卡', '/media/covers/488.svg', 4, '2026-08-01 10:00:00'),
(1485, 82001, 'health', '跑步骑行', '/media/covers/73.svg', 5, '2026-08-01 10:00:00'),
(1486, 82001, 'health', '冥想恢复', '/media/covers/54.svg', 6, '2026-08-01 10:00:00'),
(1491, 82001, 'auto', '新车资讯', '/media/covers/111.svg', 1, '2026-08-01 10:00:00'),
(1492, 82001, 'auto', '二手车源', '/media/covers/133.svg', 2, '2026-08-01 10:00:00'),
(1493, 82001, 'auto', '保养维修', '/media/covers/146.svg', 3, '2026-08-01 10:00:00'),
(1494, 82001, 'auto', '驾考题库', '/media/covers/180.svg', 4, '2026-08-01 10:00:00'),
(1495, 82001, 'auto', '用车技巧', '/media/covers/201.svg', 5, '2026-08-01 10:00:00'),
(1496, 82001, 'auto', '配件改装', '/media/covers/250.svg', 6, '2026-08-01 10:00:00'),
(1501, 82001, 'jobs', '互联网岗', '/media/covers/0.svg', 1, '2026-08-01 10:00:00'),
(1502, 82001, 'jobs', '销售运营', '/media/covers/20.svg', 2, '2026-08-01 10:00:00'),
(1503, 82001, 'jobs', '设计产品', '/media/covers/177.svg', 3, '2026-08-01 10:00:00'),
(1504, 82001, 'jobs', '教育培训', '/media/covers/24.svg', 4, '2026-08-01 10:00:00'),
(1505, 82001, 'jobs', '应届实习', '/media/covers/1015.svg', 5, '2026-08-01 10:00:00'),
(1506, 82001, 'jobs', '兼职外包', '/media/covers/180.svg', 6, '2026-08-01 10:00:00'),
(1511, 82001, 'housing', '新房楼盘', '/media/covers/164.svg', 1, '2026-08-01 10:00:00'),
(1512, 82001, 'housing', '二手住宅', '/media/covers/122.svg', 2, '2026-08-01 10:00:00'),
(1513, 82001, 'housing', '租房信息', '/media/covers/201.svg', 3, '2026-08-01 10:00:00'),
(1514, 82001, 'housing', '装修案例', '/media/covers/1078.svg', 4, '2026-08-01 10:00:00'),
(1515, 82001, 'housing', '家居软装', '/media/covers/1068.svg', 5, '2026-08-01 10:00:00'),
(1516, 82001, 'housing', '商铺写字', '/media/covers/119.svg', 6, '2026-08-01 10:00:00'),
(1521, 82001, 'beauty', '美发造型', '/media/covers/64.svg', 1, '2026-08-01 10:00:00'),
(1522, 82001, 'beauty', '美甲美睫', '/media/covers/1080.svg', 2, '2026-08-01 10:00:00'),
(1523, 82001, 'beauty', '皮肤管理', '/media/covers/1015.svg', 3, '2026-08-01 10:00:00'),
(1524, 82001, 'beauty', '医美咨询', '/media/covers/177.svg', 4, '2026-08-01 10:00:00'),
(1525, 82001, 'beauty', '瑜伽塑形', '/media/covers/1016.svg', 5, '2026-08-01 10:00:00'),
(1526, 82001, 'beauty', '男士理容', '/media/covers/91.svg', 6, '2026-08-01 10:00:00'),
(1531, 82001, 'photo', '人像写真', '/media/covers/64.svg', 1, '2026-08-01 10:00:00'),
(1532, 82001, 'photo', '风光旅行', '/media/covers/1015.svg', 2, '2026-08-01 10:00:00'),
(1533, 82001, 'photo', '街拍纪实', '/media/covers/1011.svg', 3, '2026-08-01 10:00:00'),
(1534, 82001, 'photo', '美食静物', '/media/covers/292.svg', 4, '2026-08-01 10:00:00'),
(1535, 82001, 'photo', '活动跟拍', '/media/covers/1016.svg', 5, '2026-08-01 10:00:00'),
(1536, 82001, 'photo', '后期教程', '/media/covers/177.svg', 6, '2026-08-01 10:00:00'),
(1541, 82001, 'office', '会议纪要', '/media/covers/201.svg', 1, '2026-08-01 10:00:00'),
(1542, 82001, 'office', '待办清单', '/media/covers/180.svg', 2, '2026-08-01 10:00:00'),
(1543, 82001, 'office', '知识笔记', '/media/covers/24.svg', 3, '2026-08-01 10:00:00'),
(1544, 82001, 'office', '周报月报', '/media/covers/20.svg', 4, '2026-08-01 10:00:00'),
(1545, 82001, 'office', '模板文档', '/media/covers/0.svg', 5, '2026-08-01 10:00:00'),
(1546, 82001, 'office', '团队协作', '/media/covers/96.svg', 6, '2026-08-01 10:00:00')
ON DUPLICATE KEY UPDATE
  `app` = VALUES(`app`),
  `name` = VALUES(`name`),
  `cover` = VALUES(`cover`),
  `sort` = VALUES(`sort`);

SET @db := DATABASE();
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Category')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Category' AND COLUMN_NAME='parentId'),
  'ALTER TABLE `Category` ADD COLUMN `parentId` bigint DEFAULT NULL COMMENT ''父分类 Category.id，空为一级''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT INTO `Category` (`id`,`userId`,`app`,`name`,`cover`,`parentId`,`sort`,`date`) VALUES
(1601, 82001, 'news', '互联网', '/media/covers/1.svg', 1323, 1, '2026-08-01 10:00:00'),
(1602, 82001, 'news', '数码', '/media/covers/180.svg', 1323, 2, '2026-08-01 10:00:00'),
(1611, 82001, 'article', '入门', '/media/covers/24.svg', 1361, 1, '2026-08-01 10:00:00'),
(1612, 82001, 'article', '实战', '/media/covers/96.svg', 1361, 2, '2026-08-01 10:00:00'),
(1621, 82001, 'video', '手游', '/media/covers/96.svg', 1342, 1, '2026-08-01 10:00:00'),
(1622, 82001, 'video', '电竞', '/media/covers/160.svg', 1342, 2, '2026-08-01 10:00:00'),
(1631, 82001, 'music', '华语', '/media/covers/39.svg', 1311, 1, '2026-08-01 10:00:00'),
(1632, 82001, 'music', '欧美', '/media/covers/45.svg', 1311, 2, '2026-08-01 10:00:00'),
(1641, 82001, 'blog', '前端', '/media/covers/2.svg', 1351, 1, '2026-08-01 10:00:00'),
(1642, 82001, 'blog', '后端', '/media/covers/180.svg', 1351, 2, '2026-08-01 10:00:00')
ON DUPLICATE KEY UPDATE
  `app` = VALUES(`app`),
  `name` = VALUES(`name`),
  `cover` = VALUES(`cover`),
  `parentId` = VALUES(`parentId`),
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
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Music')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Music' AND COLUMN_NAME='praiseUserIdList'),
  'ALTER TABLE `Music` ADD COLUMN `praiseUserIdList` json DEFAULT NULL COMMENT ''点赞用户 User.id 列表''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Music')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Music' AND COLUMN_NAME='collectUserIdList'),
  'ALTER TABLE `Music` ADD COLUMN `collectUserIdList` json DEFAULT NULL COMMENT ''收藏用户 User.id 列表''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Music')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Music' AND COLUMN_NAME='shareCount'),
  'ALTER TABLE `Music` ADD COLUMN `shareCount` int NOT NULL DEFAULT 0 COMMENT ''分享次数''', 'SELECT 1'));
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
UPDATE `News` SET `categoryId` = 1601 WHERE `id` = 402;

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
UPDATE `Article` SET `categoryId` = 1611 WHERE `id` = 703;
UPDATE `Blog` SET `categoryId` = 1641 WHERE `id` = 603;
UPDATE `Music` SET `categoryId` = 1631 WHERE `id` = 901;

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
