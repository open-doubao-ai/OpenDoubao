-- Incremental scene tables for APIJSON-suitable app families.
-- Safe to re-run. Used by ensure-layout-categories when Course is missing.
--
--   /usr/local/mysql/bin/mysql -h127.0.0.1 -P3306 -uroot -papijson sys < opendoubao/sql/layout_demo_scenes.sql
--
-- After first import: reload Access/Request (TYPE_RELOAD=4 + /reload, or restart).

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Tables (CREATE IF NOT EXISTS — do not wipe existing demo data)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Course` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '讲师 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '课程标题',
  `author` varchar(80) DEFAULT NULL COMMENT '讲师',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '课程介绍',
  `lessons` int NOT NULL DEFAULT 0 COMMENT '课时数',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '学习人数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上架日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教育学习-课程';

CREATE TABLE IF NOT EXISTS `Teacher` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '关联 User.id',
  `name` varchar(80) NOT NULL COMMENT '姓名',
  `title` varchar(80) DEFAULT NULL COMMENT '职称',
  `head` varchar(400) DEFAULT NULL COMMENT '头像',
  `intro` text COMMENT '简介',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入职日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教育学习-老师';

CREATE TABLE IF NOT EXISTS `Student` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '关联 User.id',
  `name` varchar(80) NOT NULL COMMENT '姓名',
  `grade` varchar(40) DEFAULT NULL COMMENT '年级',
  `head` varchar(400) DEFAULT NULL COMMENT '头像',
  `intro` text COMMENT '简介',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入学日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教育学习-学生';

CREATE TABLE IF NOT EXISTS `Book` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '录入人 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '书名',
  `author` varchar(80) DEFAULT NULL COMMENT '作者',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '内容简介',
  `publisher` varchar(80) DEFAULT NULL COMMENT '出版社',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '阅读数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上架日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图书阅读-书目';

CREATE TABLE IF NOT EXISTS `Comic` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '录入人 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '漫画名',
  `author` varchar(80) DEFAULT NULL COMMENT '作者',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `pictureList` json DEFAULT NULL COMMENT '分页图 URL 列表',
  `content` text COMMENT '简介',
  `chapterCount` int NOT NULL DEFAULT 0 COMMENT '话数',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '阅读数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='漫画阅读-作品';

SET @odb := DATABASE();
SET @comic_pic := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @odb AND TABLE_NAME = 'Comic' AND COLUMN_NAME = 'pictureList'
);
SET @comic_sql := IF(@comic_pic = 0,
  'ALTER TABLE `Comic` ADD COLUMN `pictureList` json DEFAULT NULL COMMENT ''分页图 URL 列表'' AFTER `cover`',
  'SELECT 1');
PREPARE comic_pic_stmt FROM @comic_sql;
EXECUTE comic_pic_stmt;
DEALLOCATE PREPARE comic_pic_stmt;

CREATE TABLE IF NOT EXISTS `Local` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '商家 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '服务名称',
  `author` varchar(80) DEFAULT NULL COMMENT '商家',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '服务说明',
  `address` varchar(200) DEFAULT NULL COMMENT '服务地址',
  `price` decimal(10,2) NOT NULL DEFAULT 0 COMMENT '参考价',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '浏览数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='本地生活-服务';

CREATE TABLE IF NOT EXISTS `Recipe` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '作者 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '菜谱名',
  `author` varchar(80) DEFAULT NULL COMMENT '主厨',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '做法',
  `minutes` int NOT NULL DEFAULT 0 COMMENT '耗时（分钟）',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '收藏数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='餐饮美食-菜谱';

CREATE TABLE IF NOT EXISTS `Trip` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '作者 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '行程标题',
  `author` varchar(80) DEFAULT NULL COMMENT '向导',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '行程说明',
  `destination` varchar(80) DEFAULT NULL COMMENT '目的地',
  `days` int NOT NULL DEFAULT 1 COMMENT '天数',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '浏览数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='旅游出行-行程';

CREATE TABLE IF NOT EXISTS `Sport` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '编辑 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '资讯标题',
  `author` varchar(80) DEFAULT NULL COMMENT '记者',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '正文',
  `league` varchar(80) DEFAULT NULL COMMENT '联赛/项目',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '阅读数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='体育资讯-稿件';

CREATE TABLE IF NOT EXISTS `Baby` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '作者 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '标题',
  `author` varchar(80) DEFAULT NULL COMMENT '作者',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '正文',
  `monthAge` int NOT NULL DEFAULT 0 COMMENT '月龄',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '阅读数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='母婴育儿-内容';

CREATE TABLE IF NOT EXISTS `Workout` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '教练 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '计划名',
  `author` varchar(80) DEFAULT NULL COMMENT '教练',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '训练说明',
  `duration` int NOT NULL DEFAULT 0 COMMENT '时长（分钟）',
  `kcal` int NOT NULL DEFAULT 0 COMMENT '消耗热量',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '打卡数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康运动-计划';

CREATE TABLE IF NOT EXISTS `Vehicle` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '录入人 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '标题',
  `author` varchar(80) DEFAULT NULL COMMENT '门店/作者',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '说明',
  `brand` varchar(80) DEFAULT NULL COMMENT '品牌',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '浏览数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='汽车服务-车讯';

CREATE TABLE IF NOT EXISTS `Job` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '招聘方 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '职位名称',
  `author` varchar(80) DEFAULT NULL COMMENT '公司',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '职位描述',
  `company` varchar(80) DEFAULT NULL COMMENT '公司名',
  `salary` varchar(40) DEFAULT NULL COMMENT '薪资范围',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '浏览数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='招聘求职-职位';

CREATE TABLE IF NOT EXISTS `House` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '经纪人 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '房源标题',
  `author` varchar(80) DEFAULT NULL COMMENT '经纪人',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '房源说明',
  `area` decimal(10,2) NOT NULL DEFAULT 0 COMMENT '面积（㎡）',
  `price` decimal(12,2) NOT NULL DEFAULT 0 COMMENT '价格',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '浏览数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房产家居-房源';

CREATE TABLE IF NOT EXISTS `Beauty` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '门店 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '项目名称',
  `author` varchar(80) DEFAULT NULL COMMENT '门店',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '项目说明',
  `shop` varchar(80) DEFAULT NULL COMMENT '门店名',
  `price` decimal(10,2) NOT NULL DEFAULT 0 COMMENT '价格',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '预约数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上架日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='美业预约-项目';

CREATE TABLE IF NOT EXISTS `Photo` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '摄影师 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '作品标题',
  `author` varchar(80) DEFAULT NULL COMMENT '摄影师',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '作品说明',
  `location` varchar(80) DEFAULT NULL COMMENT '拍摄地',
  `pictureList` json DEFAULT NULL COMMENT '图集',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '浏览数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='摄影相册-作品';

CREATE TABLE IF NOT EXISTS `Note` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '创建人 User.id',
  `categoryId` bigint DEFAULT NULL COMMENT '分类 Category.id',
  `title` varchar(160) NOT NULL COMMENT '笔记标题',
  `author` varchar(80) DEFAULT NULL COMMENT '作者',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '正文',
  `tag` varchar(40) DEFAULT NULL COMMENT '标签',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '阅读数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `categoryId` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='办公效率-笔记';

CREATE TABLE IF NOT EXISTS `Category` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '录入人 User.id',
  `app` varchar(20) NOT NULL COMMENT '应用大类',
  `name` varchar(40) NOT NULL COMMENT '分类名',
  `cover` varchar(400) DEFAULT NULL COMMENT '分类封面图',
  `parentId` bigint DEFAULT NULL COMMENT '父分类 Category.id，空为一级',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建日期',
  PRIMARY KEY (`id`),
  KEY `app_sort` (`app`, `sort`),
  KEY `parentId` (`parentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用分类/栏目/流派';

-- ---------------------------------------------------------------------------
-- Child categories (4-char names where natural)
-- ---------------------------------------------------------------------------

INSERT INTO `Category` (`id`,`userId`,`app`,`name`,`cover`,`sort`,`date`) VALUES
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

-- ---------------------------------------------------------------------------
-- Seed rows
-- ---------------------------------------------------------------------------

INSERT INTO `Course` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`lessons`,`viewCount`,`date`) VALUES
(1601, 82001, 1401, '30 天英语口语入门', '林夏', '/media/covers/24.svg', '从日常对话开始，带你开口说英语。', 30, 1280, '2026-08-02 09:00:00'),
(1602, 82002, 1402, '零基础 Python 实战', '周启', '/media/covers/0.svg', '用小项目学会变量、函数和接口调用。', 24, 2560, '2026-08-03 09:00:00'),
(1603, 82001, 1403, '考研英语真题精讲', '陈砚', '/media/covers/180.svg', '近五年阅读与作文拆解。', 18, 980, '2026-08-04 09:00:00'),
(1604, 82002, 1404, '短视频剪辑入门', '阿凯', '/media/covers/96.svg', '字幕、转场、BGM 一次讲清。', 12, 1760, '2026-08-05 09:00:00'),
(1605, 82001, 1405, '儿童拼音启蒙课', '苗苗', '/media/covers/1015.svg', '游戏化认读，适合 4–6 岁。', 16, 640, '2026-08-06 09:00:00'),
(1606, 82002, 1406, '吉他弹唱 21 天', '老周', '/media/covers/39.svg', '三和弦就能唱完一首歌。', 21, 890, '2026-08-07 09:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `categoryId`=VALUES(`categoryId`);

INSERT INTO `Book` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`publisher`,`viewCount`,`date`) VALUES
(1701, 82001, 1411, '海边的清晨', '苏晚', '/media/covers/24.svg', '一部关于离家与归来的长篇小说。', '春山文艺', 2100, '2026-08-02 10:00:00'),
(1702, 82002, 1412, '小团队增长手册', '何川', '/media/covers/20.svg', '把增长拆成可执行的周计划。', '远帆出版', 1560, '2026-08-03 10:00:00'),
(1703, 82001, 1413, '长安夜市考', '裴衡', '/media/covers/1019.svg', '从夜市看一座城的生活史。', '古籍新社', 870, '2026-08-04 10:00:00'),
(1704, 82002, 1414, '给所有人的电路', '韩石', '/media/covers/0.svg', '用生活例子讲清基础电路。', '工科读本', 640, '2026-08-05 10:00:00'),
(1705, 82001, 1415, '家庭收纳 100 问', '米儿', '/media/covers/1078.svg', '小户型也能腾出一间房。', '生活家', 1320, '2026-08-06 10:00:00'),
(1706, 82002, 1416, '月亮邮局', '小橙', '/media/covers/1015.svg', '写给睡前的十二封信。', '童心社', 980, '2026-08-07 10:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `categoryId`=VALUES(`categoryId`);

INSERT INTO `Comic` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`chapterCount`,`viewCount`,`date`) VALUES
(1801, 82001, 1421, '少年剑客行', '墨白', '/media/covers/96.svg', '一把断剑，一座江湖。', 86, 4200, '2026-08-02 11:00:00'),
(1802, 82002, 1422, '便利店恋爱日志', '浅浅', '/media/covers/64.svg', '夜班遇见的那个人。', 42, 3100, '2026-08-03 11:00:00'),
(1803, 82001, 1423, '星海旅团', '南风', '/media/covers/1016.svg', '跨星系寻找失落的故乡。', 60, 2800, '2026-08-04 11:00:00'),
(1804, 82002, 1424, '合租的猫', '土豆', '/media/covers/106.svg', '四个人和一只不讲理的猫。', 28, 1900, '2026-08-05 11:00:00'),
(1805, 82001, 1425, '机甲晨星', '铁木', '/media/covers/160.svg', '废墟上的第一台自制机甲。', 55, 2600, '2026-08-06 11:00:00'),
(1806, 82002, 1426, '雾城谜案', '冷杉', '/media/covers/60.svg', '每场雨都会带走一条线索。', 33, 1700, '2026-08-07 11:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `categoryId`=VALUES(`categoryId`);

INSERT INTO `Local` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`address`,`price`,`viewCount`,`date`) VALUES
(1901, 82001, 1431, '两小时深度保洁', '洁雅家政', '/media/covers/201.svg', '厨房卫生间重点，自带工具。', '城西·桂花路', 168.00, 320, '2026-08-02 12:00:00'),
(1902, 82002, 1432, '空调清洗上门', '快修哥', '/media/covers/180.svg', '挂机柜机都做，当天可约。', '城东·望江街', 128.00, 210, '2026-08-03 12:00:00'),
(1903, 82001, 1433, '同城文件闪送', '小跑腿', '/media/covers/1018.svg', '5 公里内 40 分钟达。', '全市', 25.00, 540, '2026-08-04 12:00:00'),
(1904, 82002, 1434, '剪发+护理套餐', '青木造型', '/media/covers/64.svg', '设计师剪裁，含基础护理。', '湖滨银泰 3F', 188.00, 160, '2026-08-05 12:00:00'),
(1905, 82001, 1435, '密室逃脱双人票', '迷雾馆', '/media/covers/1016.svg', '周末场可改期一次。', '文创园 B2', 158.00, 90, '2026-08-06 12:00:00'),
(1906, 82002, 1436, '社区代缴水电', '便民站', '/media/covers/292.svg', '代缴代办，收 2 元服务费。', '翠苑一区门口', 2.00, 410, '2026-08-07 12:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `categoryId`=VALUES(`categoryId`);

INSERT INTO `Recipe` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`minutes`,`viewCount`,`date`) VALUES
(2001, 82001, 1441, '番茄炒蛋不会失败版', '阿圆', '/media/covers/292.svg', '先炒蛋再烩番茄，汤汁挂住。', 15, 2400, '2026-08-02 13:00:00'),
(2002, 82002, 1442, '原味磅蛋糕', '小烘', '/media/covers/1080.svg', '室温黄油是关键。', 70, 980, '2026-08-03 13:00:00'),
(2003, 82001, 1443, '葱油拌面', '老街口', '/media/covers/225.svg', '热油浇葱蒜，一碗就够。', 20, 1560, '2026-08-04 13:00:00'),
(2004, 82002, 1444, '鸡胸生菜卷', '轻食记', '/media/covers/488.svg', '低油煎鸡胸，酸奶酱。', 25, 720, '2026-08-05 13:00:00'),
(2005, 82001, 1445, '冰美式在家做', '杯测', '/media/covers/431.svg', '1:2 浓缩加冰块。', 8, 640, '2026-08-06 13:00:00'),
(2006, 82002, 1446, '巷口黄鱼面馆', '探店员', '/media/covers/42.svg', '汤鲜，面偏软，建议配小黄鱼。', 0, 880, '2026-08-07 13:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `categoryId`=VALUES(`categoryId`);

INSERT INTO `Trip` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`destination`,`days`,`viewCount`,`date`) VALUES
(2101, 82001, 1451, '大理慢走四日', '路人甲', '/media/covers/1016.svg', '洱海骑行 + 古城夜市，不赶行程。', '大理', 4, 1880, '2026-08-02 14:00:00'),
(2102, 82002, 1452, '大阪美食三日', '阿食', '/media/covers/1015.svg', '心斋桥到黑门市场的走路路线。', '大阪', 3, 2100, '2026-08-03 14:00:00'),
(2103, 82001, 1453, '莫干山周末', '山风', '/media/covers/1036.svg', '民宿泡汤，第二天再上山。', '莫干山', 2, 960, '2026-08-04 14:00:00'),
(2104, 82002, 1454, '湖景亲子民宿', '安安', '/media/covers/164.svg', '带滑梯的院子，含早餐。', '千岛湖', 2, 740, '2026-08-05 14:00:00'),
(2105, 82001, 1455, '园林联票攻略', '小导', '/media/covers/28.svg', '拙政园+狮子林一天走完。', '苏州', 1, 1320, '2026-08-06 14:00:00'),
(2106, 82002, 1456, '桂林阳朔六日', '背包客', '/media/covers/29.svg', '漓江、西街、遇龙河分段走。', '桂林', 6, 1540, '2026-08-07 14:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `categoryId`=VALUES(`categoryId`);

INSERT INTO `Sport` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`league`,`viewCount`,`date`) VALUES
(2201, 82001, 1461, '夜场逆转：补时绝杀', '球场记', '/media/covers/28.svg', '主队 2-1 完成翻盘。', '中超', 3200, '2026-08-02 15:00:00'),
(2202, 82002, 1462, '夏季联赛新秀观察', '篮下', '/media/covers/73.svg', '三名后卫的投射数据对比。', 'CBA', 2100, '2026-08-03 15:00:00'),
(2203, 82001, 1463, '世锦赛首日看点', '综合台', '/media/covers/76.svg', '游泳与田径同一晚开赛。', '世锦赛', 980, '2026-08-04 15:00:00'),
(2204, 82002, 1464, '城市半马配速建议', '跑者', '/media/covers/66.svg', '按完赛目标拆 5 公里配速。', '路跑', 760, '2026-08-05 15:00:00'),
(2205, 82001, 1465, '奥运周期选拔名单', '观察员', '/media/covers/1011.svg', '新增两名年轻选手入围。', '奥运', 1500, '2026-08-06 15:00:00'),
(2206, 82002, 1466, '球迷观赛公约更新', '社群', '/media/covers/1012.svg', '客场远征拼车与文明观赛。', '球迷会', 430, '2026-08-07 15:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `categoryId`=VALUES(`categoryId`);

INSERT INTO `Baby` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`monthAge`,`viewCount`,`date`) VALUES
(2301, 82001, 1471, '孕中期散步怎么走', '禾禾', '/media/covers/1015.svg', '饭后 20 分钟，避开正午。', 20, 860, '2026-08-02 16:00:00'),
(2302, 82002, 1472, '6 月龄辅食第一口', '厨房妈妈', '/media/covers/292.svg', '米粉+一种蔬菜，观察三天。', 6, 1240, '2026-08-03 16:00:00'),
(2303, 82001, 1473, '手指谣怎么带', '早教社', '/media/covers/24.svg', '睡前 5 分钟就够。', 12, 540, '2026-08-04 16:00:00'),
(2304, 82002, 1474, '学步车要不要买', '测评组', '/media/covers/201.svg', '更建议学步推车和防撞条。', 10, 710, '2026-08-05 16:00:00'),
(2305, 82001, 1475, '周末公园半日', '爸爸档', '/media/covers/1016.svg', '沙坑+绘本，回家午睡。', 24, 390, '2026-08-06 16:00:00'),
(2306, 82002, 1476, '疫苗日提醒清单', '社区护士', '/media/covers/180.svg', '空腹、带手册、观察 30 分钟。', 8, 980, '2026-08-07 16:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `categoryId`=VALUES(`categoryId`);

INSERT INTO `Workout` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`duration`,`kcal`,`viewCount`,`date`) VALUES
(2401, 82001, 1481, '上肢力量 30 分钟', '岩教练', '/media/covers/66.svg', '推、拉、核心各 3 组。', 30, 220, 640, '2026-08-02 17:00:00'),
(2402, 82002, 1482, '居家 HIIT 20 分钟', '燃', '/media/covers/28.svg', '40 秒练 20 秒歇，循环 4 轮。', 20, 180, 890, '2026-08-03 17:00:00'),
(2403, 82001, 1483, '睡前拉伸 15 分钟', '湖边瑜伽', '/media/covers/1016.svg', '髋和胸椎打开即可。', 15, 60, 720, '2026-08-04 17:00:00'),
(2404, 82002, 1484, '高蛋白午餐模板', '营养员', '/media/covers/488.svg', '鸡胸、杂粮饭、西兰花。', 0, 0, 510, '2026-08-05 17:00:00'),
(2405, 82001, 1485, '滨江骑行 40 公里', '风行', '/media/covers/73.svg', '早高峰前出发，补给带水。', 120, 680, 330, '2026-08-06 17:00:00'),
(2406, 82002, 1486, '呼吸冥想 10 分钟', '止', '/media/covers/54.svg', '4-7-8 呼吸，睡前做。', 10, 20, 410, '2026-08-07 17:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `categoryId`=VALUES(`categoryId`);

INSERT INTO `Vehicle` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`brand`,`viewCount`,`date`) VALUES
(2501, 82001, 1491, '紧凑型 SUV 对比', '车评社', '/media/covers/111.svg', '空间、油耗、保修三项。', '多家', 1420, '2026-08-02 18:00:00'),
(2502, 82002, 1492, '三年准新代步车', '车行老李', '/media/covers/133.svg', '本地一手，记录可查。', '日产', 680, '2026-08-03 18:00:00'),
(2503, 82001, 1493, '小保养套餐', '快保', '/media/covers/146.svg', '机油机滤，预约减免等候。', '通用', 540, '2026-08-04 18:00:00'),
(2504, 82002, 1494, '科目二直角转弯', '驾校王', '/media/covers/180.svg', '看右后视镜压线再打轮。', '驾考', 2100, '2026-08-05 18:00:00'),
(2505, 82001, 1495, '雨天高速注意事项', '老司机', '/media/covers/201.svg', '拉大车距，少并线。', '通用', 760, '2026-08-06 18:00:00'),
(2506, 82002, 1496, '行车记录仪选购', '改装铺', '/media/covers/250.svg', '前后双录，注意供电。', '配件', 430, '2026-08-07 18:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `categoryId`=VALUES(`categoryId`);

INSERT INTO `Job` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`company`,`salary`,`viewCount`,`date`) VALUES
(2601, 82001, 1501, '前端工程师', '星河科技', '/media/covers/0.svg', '熟悉 TypeScript 与组件化。', '星河科技', '18-28k', 980, '2026-08-02 19:00:00'),
(2602, 82002, 1502, '电商运营', '南货铺', '/media/covers/20.svg', '负责活动页与转化。', '南货铺', '10-16k', 640, '2026-08-03 19:00:00'),
(2603, 82001, 1503, '产品设计师', '青柠设计', '/media/covers/177.svg', 'B 端表格与表单经验优先。', '青柠设计', '15-22k', 510, '2026-08-04 19:00:00'),
(2604, 82002, 1504, '少儿英语老师', '苗苗学堂', '/media/covers/24.svg', '周末班，提供教案。', '苗苗学堂', '8-12k', 390, '2026-08-05 19:00:00'),
(2605, 82001, 1505, '暑期产品实习', '远帆', '/media/covers/1015.svg', '协助调研与周报，可转正。', '远帆', '150/天', 870, '2026-08-06 19:00:00'),
(2606, 82002, 1506, '周末活动执行', '会务组', '/media/covers/180.svg', '布置签到与物料，按场结算。', '会务组', '400/场', 220, '2026-08-07 19:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `categoryId`=VALUES(`categoryId`);

INSERT INTO `House` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`area`,`price`,`viewCount`,`date`) VALUES
(2701, 82001, 1511, '江景三期洋房', '方圆地产', '/media/covers/164.svg', '低密，带花园，交房两年。', 128.00, 2680000.00, 760, '2026-08-02 20:00:00'),
(2702, 82002, 1512, '学区两房急售', '阿强', '/media/covers/122.svg', '满五唯一，看房需预约。', 78.00, 2150000.00, 980, '2026-08-03 20:00:00'),
(2703, 82001, 1513, '近地铁精装单间', '翠苑管家', '/media/covers/201.svg', '押一付三，可短租。', 28.00, 2800.00, 1540, '2026-08-04 20:00:00'),
(2704, 82002, 1514, '老房翻新实景', '木作', '/media/covers/1078.svg', '拆除承重外的隔墙，重做收纳。', 89.00, 180000.00, 430, '2026-08-05 20:00:00'),
(2705, 82001, 1515, '原木风客厅', '软装工作室', '/media/covers/1068.svg', '沙发与灯具清单可复用。', 0.00, 12600.00, 610, '2026-08-06 20:00:00'),
(2706, 82002, 1516, '园区临街旺铺', '招商部', '/media/covers/119.svg', '展示面 8 米，可餐饮。', 96.00, 18000.00, 280, '2026-08-07 20:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `categoryId`=VALUES(`categoryId`);

INSERT INTO `Beauty` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`shop`,`price`,`viewCount`,`date`) VALUES
(2801, 82001, 1521, '设计师剪发', '青木造型', '/media/covers/64.svg', '含洗发吹整，可改期。', '青木造型', 188.00, 420, '2026-08-02 21:00:00'),
(2802, 82002, 1522, '日式美甲套餐', '指尖', '/media/covers/1080.svg', '固态甲油胶，约 90 分钟。', '指尖美甲', 158.00, 360, '2026-08-03 21:00:00'),
(2803, 82001, 1523, '补水护理 60 分钟', '澄光', '/media/covers/1015.svg', '敏感肌友好，先做测试。', '澄光皮肤', 268.00, 210, '2026-08-04 21:00:00'),
(2804, 82002, 1524, '皮肤检测咨询', '医美顾问', '/media/covers/177.svg', '仅咨询与方案，不含项目。', '澄光皮肤', 0.00, 180, '2026-08-05 21:00:00'),
(2805, 82001, 1525, '小团课普拉提', '形', '/media/covers/1016.svg', '每班 6 人，需自备袜。', '形工作室', 98.00, 150, '2026-08-06 21:00:00'),
(2806, 82002, 1526, '男士理容套餐', '理', '/media/covers/91.svg', '剪发+修面，工作日更空。', '理男士', 128.00, 190, '2026-08-07 21:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `categoryId`=VALUES(`categoryId`);

INSERT INTO `Photo` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`location`,`pictureList`,`viewCount`,`date`) VALUES
(2901, 82001, 1531, '黄昏窗边', '阿年', '/media/covers/64.svg', '侧光人像，未加闪。', '工作室', '["/media/covers/64.svg","/media/covers/65.svg"]', 860, '2026-08-02 22:00:00'),
(2902, 82002, 1532, '雨后山脊', '远山', '/media/covers/1015.svg', '云海只出现了十分钟。', '黄山', '["/media/covers/1015.svg","/media/covers/1016.svg"]', 1240, '2026-08-03 22:00:00'),
(2903, 82001, 1533, '早市人流', '街拍', '/media/covers/1011.svg', '28mm，不打扰。', '湖滨', '["/media/covers/1011.svg"]', 540, '2026-08-04 22:00:00'),
(2904, 82002, 1534, '一碗面', '静物', '/media/covers/292.svg', '窗光，深色背景。', '家里', '["/media/covers/292.svg"]', 410, '2026-08-05 22:00:00'),
(2905, 82001, 1535, '毕业礼跟拍', '活动组', '/media/covers/1016.svg', '主舞台与家长席两条线。', '大学路', '["/media/covers/1016.svg","/media/covers/1018.svg"]', 720, '2026-08-06 22:00:00'),
(2906, 82002, 1536, '肤色与曲线', '后期课', '/media/covers/177.svg', '只调曲线，不磨皮。', '教室', '["/media/covers/177.svg"]', 630, '2026-08-07 22:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `pictureList`=VALUES(`pictureList`), `categoryId`=VALUES(`categoryId`);

INSERT INTO `Note` (`id`,`userId`,`categoryId`,`title`,`author`,`cover`,`content`,`tag`,`viewCount`,`date`) VALUES
(3001, 82001, 1541, '周一产品评审纪要', 'Jan', '/media/covers/201.svg', '结论：分类页先上，支付仍走独立服务。', '会议', 12, '2026-08-02 08:00:00'),
(3002, 82002, 1542, '本周发布清单', 'Lotus', '/media/covers/180.svg', 'DDL、文案、回归三条必须打勾。', '待办', 8, '2026-08-03 08:00:00'),
(3003, 82001, 1543, 'APIJSON 场景备忘', 'Jan', '/media/covers/24.svg', '适合内容与目录，不适合资金与对战。', '知识', 36, '2026-08-04 08:00:00'),
(3004, 82002, 1544, '七月月报草稿', 'Lotus', '/media/covers/20.svg', '完成布局分类，下一期做导入校验。', '月报', 5, '2026-08-05 08:00:00'),
(3005, 82001, 1545, '周会文档模板', 'Jan', '/media/covers/0.svg', '目标 / 进展 / 风险 / 求助。', '模板', 19, '2026-08-06 08:00:00'),
(3006, 82002, 1546, '联调值班约定', 'Lotus', '/media/covers/96.svg', '出问题先看 Access，再看 Request.tag。', '协作', 14, '2026-08-07 08:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `cover`=VALUES(`cover`), `categoryId`=VALUES(`categoryId`);

-- ---------------------------------------------------------------------------
-- Access 101–117  Request 9105201–9105251
-- ---------------------------------------------------------------------------

DELETE FROM `Access` WHERE `id` BETWEEN 101 AND 117
  OR `alias` IN ('Course','Book','Comic','Local','Recipe','Trip','Sport','Baby','Workout','Vehicle','Job','House','Beauty','Photo','Note','Teacher','Student');

INSERT INTO `Access` (`id`, `debug`, `schema`, `name`, `alias`, `get`, `head`, `gets`, `heads`, `post`, `put`, `delete`, `date`, `detail`)
VALUES
(101, 0, NULL, 'Course', 'Course',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '教育学习-课程'),
(102, 0, NULL, 'Book', 'Book',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '图书阅读-书目'),
(103, 0, NULL, 'Comic', 'Comic',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '漫画阅读-作品'),
(104, 0, NULL, 'Local', 'Local',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '本地生活-服务'),
(105, 0, NULL, 'Recipe', 'Recipe',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '餐饮美食-菜谱'),
(106, 0, NULL, 'Trip', 'Trip',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '旅游出行-行程'),
(107, 0, NULL, 'Sport', 'Sport',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '体育资讯-稿件'),
(108, 0, NULL, 'Baby', 'Baby',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '母婴育儿-内容'),
(109, 0, NULL, 'Workout', 'Workout',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '健康运动-计划'),
(110, 0, NULL, 'Vehicle', 'Vehicle',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '汽车服务-车讯'),
(111, 0, NULL, 'Job', 'Job',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '招聘求职-职位'),
(112, 0, NULL, 'House', 'House',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '房产家居-房源'),
(113, 0, NULL, 'Beauty', 'Beauty',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '美业预约-项目'),
(114, 0, NULL, 'Photo', 'Photo',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '摄影相册-作品'),
(115, 0, NULL, 'Note', 'Note',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '办公效率-笔记'),
(116, 0, NULL, 'Teacher', 'Teacher',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '教育学习-老师'),
(117, 0, NULL, 'Student', 'Student',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '教育学习-学生');

DELETE FROM `Request` WHERE `id` BETWEEN 9105201 AND 9105251
  OR (`tag` IN ('Course','Book','Comic','Local','Recipe','Trip','Sport','Baby','Workout','Vehicle','Job','House','Beauty','Photo','Note','Teacher','Student') AND `method` IN ('POST','PUT','DELETE'));

INSERT INTO `Request` (`id`, `debug`, `version`, `method`, `tag`, `structure`, `detail`, `date`) VALUES
(9105201, 0, 1, 'POST', 'Course', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Course', NOW()),
(9105202, 0, 1, 'PUT', 'Course', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Course', NOW()),
(9105203, 0, 1, 'DELETE', 'Course', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Course', NOW()),
(9105204, 0, 1, 'POST', 'Book', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Book', NOW()),
(9105205, 0, 1, 'PUT', 'Book', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Book', NOW()),
(9105206, 0, 1, 'DELETE', 'Book', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Book', NOW()),
(9105207, 0, 1, 'POST', 'Comic', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Comic', NOW()),
(9105208, 0, 1, 'PUT', 'Comic', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Comic', NOW()),
(9105209, 0, 1, 'DELETE', 'Comic', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Comic', NOW()),
(9105210, 0, 1, 'POST', 'Local', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Local', NOW()),
(9105211, 0, 1, 'PUT', 'Local', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Local', NOW()),
(9105212, 0, 1, 'DELETE', 'Local', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Local', NOW()),
(9105213, 0, 1, 'POST', 'Recipe', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Recipe', NOW()),
(9105214, 0, 1, 'PUT', 'Recipe', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Recipe', NOW()),
(9105215, 0, 1, 'DELETE', 'Recipe', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Recipe', NOW()),
(9105216, 0, 1, 'POST', 'Trip', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Trip', NOW()),
(9105217, 0, 1, 'PUT', 'Trip', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Trip', NOW()),
(9105218, 0, 1, 'DELETE', 'Trip', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Trip', NOW()),
(9105219, 0, 1, 'POST', 'Sport', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Sport', NOW()),
(9105220, 0, 1, 'PUT', 'Sport', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Sport', NOW()),
(9105221, 0, 1, 'DELETE', 'Sport', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Sport', NOW()),
(9105222, 0, 1, 'POST', 'Baby', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Baby', NOW()),
(9105223, 0, 1, 'PUT', 'Baby', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Baby', NOW()),
(9105224, 0, 1, 'DELETE', 'Baby', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Baby', NOW()),
(9105225, 0, 1, 'POST', 'Workout', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Workout', NOW()),
(9105226, 0, 1, 'PUT', 'Workout', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Workout', NOW()),
(9105227, 0, 1, 'DELETE', 'Workout', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Workout', NOW()),
(9105228, 0, 1, 'POST', 'Vehicle', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Vehicle', NOW()),
(9105229, 0, 1, 'PUT', 'Vehicle', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Vehicle', NOW()),
(9105230, 0, 1, 'DELETE', 'Vehicle', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Vehicle', NOW()),
(9105231, 0, 1, 'POST', 'Job', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Job', NOW()),
(9105232, 0, 1, 'PUT', 'Job', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Job', NOW()),
(9105233, 0, 1, 'DELETE', 'Job', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Job', NOW()),
(9105234, 0, 1, 'POST', 'House', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create House', NOW()),
(9105235, 0, 1, 'PUT', 'House', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update House', NOW()),
(9105236, 0, 1, 'DELETE', 'House', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete House', NOW()),
(9105237, 0, 1, 'POST', 'Beauty', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Beauty', NOW()),
(9105238, 0, 1, 'PUT', 'Beauty', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Beauty', NOW()),
(9105239, 0, 1, 'DELETE', 'Beauty', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Beauty', NOW()),
(9105240, 0, 1, 'POST', 'Photo', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Photo', NOW()),
(9105241, 0, 1, 'PUT', 'Photo', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Photo', NOW()),
(9105242, 0, 1, 'DELETE', 'Photo', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Photo', NOW()),
(9105243, 0, 1, 'POST', 'Note', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Note', NOW()),
(9105244, 0, 1, 'PUT', 'Note', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Note', NOW()),
(9105245, 0, 1, 'DELETE', 'Note', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Note', NOW()),
(9105246, 0, 1, 'POST', 'Teacher', CAST('{"MUST":"name","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Teacher', NOW()),
(9105247, 0, 1, 'PUT', 'Teacher', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Teacher', NOW()),
(9105248, 0, 1, 'DELETE', 'Teacher', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Teacher', NOW()),
(9105249, 0, 1, 'POST', 'Student', CAST('{"MUST":"name","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Student', NOW()),
(9105250, 0, 1, 'PUT', 'Student', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Student', NOW()),
(9105251, 0, 1, 'DELETE', 'Student', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Student', NOW());
