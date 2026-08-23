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
(1393, 82001, 'chat', '通知', 'https://picsum.photos/id/60/400/400', 3, '2026-08-01 10:00:00'),
(1401, 82001, 'education', '语言培训', 'https://picsum.photos/id/24/400/400', 1, '2026-08-01 10:00:00'),
(1402, 82001, 'education', '编程开发', 'https://picsum.photos/id/0/400/400', 2, '2026-08-01 10:00:00'),
(1403, 82001, 'education', '考研备考', 'https://picsum.photos/id/180/400/400', 3, '2026-08-01 10:00:00'),
(1404, 82001, 'education', '职业技能', 'https://picsum.photos/id/96/400/400', 4, '2026-08-01 10:00:00'),
(1405, 82001, 'education', '少儿启蒙', 'https://picsum.photos/id/1015/400/400', 5, '2026-08-01 10:00:00'),
(1406, 82001, 'education', '兴趣爱好', 'https://picsum.photos/id/201/400/400', 6, '2026-08-01 10:00:00'),
(1411, 82001, 'books', '文学小说', 'https://picsum.photos/id/24/400/400', 1, '2026-08-01 10:00:00'),
(1412, 82001, 'books', '经管励志', 'https://picsum.photos/id/20/400/400', 2, '2026-08-01 10:00:00'),
(1413, 82001, 'books', '人文历史', 'https://picsum.photos/id/1019/400/400', 3, '2026-08-01 10:00:00'),
(1414, 82001, 'books', '科学技术', 'https://picsum.photos/id/0/400/400', 4, '2026-08-01 10:00:00'),
(1415, 82001, 'books', '生活百科', 'https://picsum.photos/id/1080/400/400', 5, '2026-08-01 10:00:00'),
(1416, 82001, 'books', '儿童读物', 'https://picsum.photos/id/1015/400/400', 6, '2026-08-01 10:00:00'),
(1421, 82001, 'comics', '少年热血', 'https://picsum.photos/id/96/400/400', 1, '2026-08-01 10:00:00'),
(1422, 82001, 'comics', '少女恋爱', 'https://picsum.photos/id/64/400/400', 2, '2026-08-01 10:00:00'),
(1423, 82001, 'comics', '奇幻冒险', 'https://picsum.photos/id/1016/400/400', 3, '2026-08-01 10:00:00'),
(1424, 82001, 'comics', '日常搞笑', 'https://picsum.photos/id/106/400/400', 4, '2026-08-01 10:00:00'),
(1425, 82001, 'comics', '科幻机甲', 'https://picsum.photos/id/160/400/400', 5, '2026-08-01 10:00:00'),
(1426, 82001, 'comics', '悬疑推理', 'https://picsum.photos/id/60/400/400', 6, '2026-08-01 10:00:00'),
(1431, 82001, 'lifestyle', '家政保洁', 'https://picsum.photos/id/201/400/400', 1, '2026-08-01 10:00:00'),
(1432, 82001, 'lifestyle', '维修安装', 'https://picsum.photos/id/180/400/400', 2, '2026-08-01 10:00:00'),
(1433, 82001, 'lifestyle', '跑腿代办', 'https://picsum.photos/id/1018/400/400', 3, '2026-08-01 10:00:00'),
(1434, 82001, 'lifestyle', '丽人美发', 'https://picsum.photos/id/64/400/400', 4, '2026-08-01 10:00:00'),
(1435, 82001, 'lifestyle', '休闲娱乐', 'https://picsum.photos/id/1016/400/400', 5, '2026-08-01 10:00:00'),
(1436, 82001, 'lifestyle', '便民服务', 'https://picsum.photos/id/292/400/400', 6, '2026-08-01 10:00:00'),
(1441, 82001, 'food', '家常菜谱', 'https://picsum.photos/id/292/400/400', 1, '2026-08-01 10:00:00'),
(1442, 82001, 'food', '烘焙甜品', 'https://picsum.photos/id/1080/400/400', 2, '2026-08-01 10:00:00'),
(1443, 82001, 'food', '地方小吃', 'https://picsum.photos/id/225/400/400', 3, '2026-08-01 10:00:00'),
(1444, 82001, 'food', '减脂轻食', 'https://picsum.photos/id/488/400/400', 4, '2026-08-01 10:00:00'),
(1445, 82001, 'food', '饮品咖啡', 'https://picsum.photos/id/431/400/400', 5, '2026-08-01 10:00:00'),
(1446, 82001, 'food', '餐厅探店', 'https://picsum.photos/id/42/400/400', 6, '2026-08-01 10:00:00'),
(1451, 82001, 'travel', '国内游记', 'https://picsum.photos/id/1016/400/400', 1, '2026-08-01 10:00:00'),
(1452, 82001, 'travel', '出境旅行', 'https://picsum.photos/id/1015/400/400', 2, '2026-08-01 10:00:00'),
(1453, 82001, 'travel', '周边度假', 'https://picsum.photos/id/1036/400/400', 3, '2026-08-01 10:00:00'),
(1454, 82001, 'travel', '酒店民宿', 'https://picsum.photos/id/164/400/400', 4, '2026-08-01 10:00:00'),
(1455, 82001, 'travel', '景点门票', 'https://picsum.photos/id/28/400/400', 5, '2026-08-01 10:00:00'),
(1456, 82001, 'travel', '行程攻略', 'https://picsum.photos/id/29/400/400', 6, '2026-08-01 10:00:00'),
(1461, 82001, 'sports', '足球赛事', 'https://picsum.photos/id/28/400/400', 1, '2026-08-01 10:00:00'),
(1462, 82001, 'sports', '篮球资讯', 'https://picsum.photos/id/73/400/400', 2, '2026-08-01 10:00:00'),
(1463, 82001, 'sports', '综合竞技', 'https://picsum.photos/id/76/400/400', 3, '2026-08-01 10:00:00'),
(1464, 82001, 'sports', '健身跑步', 'https://picsum.photos/id/66/400/400', 4, '2026-08-01 10:00:00'),
(1465, 82001, 'sports', '冬夏奥运', 'https://picsum.photos/id/1011/400/400', 5, '2026-08-01 10:00:00'),
(1466, 82001, 'sports', '球迷社区', 'https://picsum.photos/id/1012/400/400', 6, '2026-08-01 10:00:00'),
(1471, 82001, 'parenting', '孕期指南', 'https://picsum.photos/id/1015/400/400', 1, '2026-08-01 10:00:00'),
(1472, 82001, 'parenting', '辅食喂养', 'https://picsum.photos/id/292/400/400', 2, '2026-08-01 10:00:00'),
(1473, 82001, 'parenting', '早教启蒙', 'https://picsum.photos/id/24/400/400', 3, '2026-08-01 10:00:00'),
(1474, 82001, 'parenting', '用品评测', 'https://picsum.photos/id/201/400/400', 4, '2026-08-01 10:00:00'),
(1475, 82001, 'parenting', '亲子互动', 'https://picsum.photos/id/1016/400/400', 5, '2026-08-01 10:00:00'),
(1476, 82001, 'parenting', '疫苗提醒', 'https://picsum.photos/id/180/400/400', 6, '2026-08-01 10:00:00'),
(1481, 82001, 'health', '力量训练', 'https://picsum.photos/id/66/400/400', 1, '2026-08-01 10:00:00'),
(1482, 82001, 'health', '有氧燃脂', 'https://picsum.photos/id/28/400/400', 2, '2026-08-01 10:00:00'),
(1483, 82001, 'health', '瑜伽拉伸', 'https://picsum.photos/id/1016/400/400', 3, '2026-08-01 10:00:00'),
(1484, 82001, 'health', '饮食打卡', 'https://picsum.photos/id/488/400/400', 4, '2026-08-01 10:00:00'),
(1485, 82001, 'health', '跑步骑行', 'https://picsum.photos/id/73/400/400', 5, '2026-08-01 10:00:00'),
(1486, 82001, 'health', '冥想恢复', 'https://picsum.photos/id/54/400/400', 6, '2026-08-01 10:00:00'),
(1491, 82001, 'auto', '新车资讯', 'https://picsum.photos/id/111/400/400', 1, '2026-08-01 10:00:00'),
(1492, 82001, 'auto', '二手车源', 'https://picsum.photos/id/133/400/400', 2, '2026-08-01 10:00:00'),
(1493, 82001, 'auto', '保养维修', 'https://picsum.photos/id/146/400/400', 3, '2026-08-01 10:00:00'),
(1494, 82001, 'auto', '驾考题库', 'https://picsum.photos/id/180/400/400', 4, '2026-08-01 10:00:00'),
(1495, 82001, 'auto', '用车技巧', 'https://picsum.photos/id/201/400/400', 5, '2026-08-01 10:00:00'),
(1496, 82001, 'auto', '配件改装', 'https://picsum.photos/id/250/400/400', 6, '2026-08-01 10:00:00'),
(1501, 82001, 'jobs', '互联网岗', 'https://picsum.photos/id/0/400/400', 1, '2026-08-01 10:00:00'),
(1502, 82001, 'jobs', '销售运营', 'https://picsum.photos/id/20/400/400', 2, '2026-08-01 10:00:00'),
(1503, 82001, 'jobs', '设计产品', 'https://picsum.photos/id/177/400/400', 3, '2026-08-01 10:00:00'),
(1504, 82001, 'jobs', '教育培训', 'https://picsum.photos/id/24/400/400', 4, '2026-08-01 10:00:00'),
(1505, 82001, 'jobs', '应届实习', 'https://picsum.photos/id/1015/400/400', 5, '2026-08-01 10:00:00'),
(1506, 82001, 'jobs', '兼职外包', 'https://picsum.photos/id/180/400/400', 6, '2026-08-01 10:00:00'),
(1511, 82001, 'housing', '新房楼盘', 'https://picsum.photos/id/164/400/400', 1, '2026-08-01 10:00:00'),
(1512, 82001, 'housing', '二手住宅', 'https://picsum.photos/id/122/400/400', 2, '2026-08-01 10:00:00'),
(1513, 82001, 'housing', '租房信息', 'https://picsum.photos/id/201/400/400', 3, '2026-08-01 10:00:00'),
(1514, 82001, 'housing', '装修案例', 'https://picsum.photos/id/1078/400/400', 4, '2026-08-01 10:00:00'),
(1515, 82001, 'housing', '家居软装', 'https://picsum.photos/id/1068/400/400', 5, '2026-08-01 10:00:00'),
(1516, 82001, 'housing', '商铺写字', 'https://picsum.photos/id/119/400/400', 6, '2026-08-01 10:00:00'),
(1521, 82001, 'beauty', '美发造型', 'https://picsum.photos/id/64/400/400', 1, '2026-08-01 10:00:00'),
(1522, 82001, 'beauty', '美甲美睫', 'https://picsum.photos/id/1080/400/400', 2, '2026-08-01 10:00:00'),
(1523, 82001, 'beauty', '皮肤管理', 'https://picsum.photos/id/1015/400/400', 3, '2026-08-01 10:00:00'),
(1524, 82001, 'beauty', '医美咨询', 'https://picsum.photos/id/177/400/400', 4, '2026-08-01 10:00:00'),
(1525, 82001, 'beauty', '瑜伽塑形', 'https://picsum.photos/id/1016/400/400', 5, '2026-08-01 10:00:00'),
(1526, 82001, 'beauty', '男士理容', 'https://picsum.photos/id/91/400/400', 6, '2026-08-01 10:00:00'),
(1531, 82001, 'photo', '人像写真', 'https://picsum.photos/id/64/400/400', 1, '2026-08-01 10:00:00'),
(1532, 82001, 'photo', '风光旅行', 'https://picsum.photos/id/1015/400/400', 2, '2026-08-01 10:00:00'),
(1533, 82001, 'photo', '街拍纪实', 'https://picsum.photos/id/1011/400/400', 3, '2026-08-01 10:00:00'),
(1534, 82001, 'photo', '美食静物', 'https://picsum.photos/id/292/400/400', 4, '2026-08-01 10:00:00'),
(1535, 82001, 'photo', '活动跟拍', 'https://picsum.photos/id/1016/400/400', 5, '2026-08-01 10:00:00'),
(1536, 82001, 'photo', '后期教程', 'https://picsum.photos/id/177/400/400', 6, '2026-08-01 10:00:00'),
(1541, 82001, 'office', '会议纪要', 'https://picsum.photos/id/201/400/400', 1, '2026-08-01 10:00:00'),
(1542, 82001, 'office', '待办清单', 'https://picsum.photos/id/180/400/400', 2, '2026-08-01 10:00:00'),
(1543, 82001, 'office', '知识笔记', 'https://picsum.photos/id/24/400/400', 3, '2026-08-01 10:00:00'),
(1544, 82001, 'office', '周报月报', 'https://picsum.photos/id/20/400/400', 4, '2026-08-01 10:00:00'),
(1545, 82001, 'office', '模板文档', 'https://picsum.photos/id/0/400/400', 5, '2026-08-01 10:00:00'),
(1546, 82001, 'office', '团队协作', 'https://picsum.photos/id/96/400/400', 6, '2026-08-01 10:00:00')
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
