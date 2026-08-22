-- Layout demo tables + Access/Request + seed rows for A2API chat-demo.
-- Run against the same Demo DB as APIJSONBoot (schema `sys`, MySQL).
-- Password in local Demo is typically: root / apijson
--
--   /usr/local/mysql/bin/mysql -h127.0.0.1 -P3306 -uroot -papijson sys < apps/chat-demo/sql/layout_demo_tables.sql
--
-- After import: reload Access/Request in APIJSON (TYPE_RELOAD=4 + /reload, or restart).
--
-- Categories:
--   数据管理 Employee (+ existing User)
--   运营活动 Activity (Access/Request already in Demo; table created here)
--   社交     Moment (existing)
--   聊天     Message
--   新闻     News
--   资讯     Notice
--   博客     Blog
--   文章     Article
--   视频     Video
--   音乐     Music
--   电商     Product / Cart / ShopOrder

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `Employee`;
CREATE TABLE `Employee` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '录入人 User.id',
  `name` varchar(50) NOT NULL COMMENT '姓名',
  `dept` varchar(40) NOT NULL COMMENT '部门',
  `title` varchar(40) DEFAULT NULL COMMENT '职位',
  `sex` tinyint NOT NULL DEFAULT 0 COMMENT '性别：0-男，1-女',
  `salary` decimal(10,2) NOT NULL DEFAULT 0 COMMENT '月薪',
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT '状态：active/leave',
  `email` varchar(80) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `head` varchar(400) DEFAULT NULL COMMENT '头像',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入职日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `index_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据管理-员工花名册';

DROP TABLE IF EXISTS `Activity`;
CREATE TABLE `Activity` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '发起人 User.id',
  `title` varchar(120) NOT NULL COMMENT '活动标题',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` varchar(1000) DEFAULT NULL COMMENT '活动说明',
  `startTime` datetime DEFAULT NULL COMMENT '开始时间',
  `endTime` datetime DEFAULT NULL COMMENT '结束时间',
  `status` varchar(20) NOT NULL DEFAULT 'online' COMMENT '状态：draft/online/ended',
  `signupCount` int NOT NULL DEFAULT 0 COMMENT '报名人数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `index_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运营活动';

DROP TABLE IF EXISTS `Message`;
CREATE TABLE `Message` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '发送人 User.id',
  `toUserId` bigint NOT NULL COMMENT '接收人 User.id',
  `conversationId` bigint DEFAULT NULL COMMENT '会话 id',
  `author` varchar(50) DEFAULT NULL COMMENT '发送人昵称',
  `head` varchar(400) DEFAULT NULL COMMENT '发送人头像',
  `content` varchar(1000) NOT NULL COMMENT '消息内容',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `toUserId` (`toUserId`),
  KEY `index_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天消息';

DROP TABLE IF EXISTS `News`;
CREATE TABLE `News` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '编辑 User.id',
  `title` varchar(160) NOT NULL COMMENT '新闻标题',
  `headline` varchar(200) DEFAULT NULL COMMENT '头条导语',
  `source` varchar(40) DEFAULT NULL COMMENT '新闻来源',
  `author` varchar(50) DEFAULT NULL COMMENT '记者',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '正文',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT '阅读数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `index_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='新闻';

DROP TABLE IF EXISTS `Notice`;
CREATE TABLE `Notice` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '发布人 User.id',
  `title` varchar(160) NOT NULL COMMENT '资讯标题',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` varchar(2000) DEFAULT NULL COMMENT '资讯正文',
  `status` varchar(20) NOT NULL DEFAULT 'published' COMMENT '状态：draft/published',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `index_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资讯公告';

DROP TABLE IF EXISTS `Blog`;
CREATE TABLE `Blog` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '博主 User.id',
  `title` varchar(160) NOT NULL COMMENT '博客标题',
  `author` varchar(50) DEFAULT NULL COMMENT '作者',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '正文',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `index_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='博客';

DROP TABLE IF EXISTS `Article`;
CREATE TABLE `Article` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '作者 User.id',
  `title` varchar(160) NOT NULL COMMENT '文章标题',
  `author` varchar(50) DEFAULT NULL COMMENT '作者',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `content` text COMMENT '文章正文',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `index_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章';

DROP TABLE IF EXISTS `Video`;
CREATE TABLE `Video` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '上传者 User.id',
  `title` varchar(160) NOT NULL COMMENT '视频标题',
  `author` varchar(50) DEFAULT NULL COMMENT '作者',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `videoUrl` varchar(500) NOT NULL COMMENT '视频地址',
  `duration` int NOT NULL DEFAULT 0 COMMENT '时长（秒）',
  `playCount` int NOT NULL DEFAULT 0 COMMENT '播放次数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `index_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='视频';

DROP TABLE IF EXISTS `Music`;
CREATE TABLE `Music` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '上传者 User.id',
  `title` varchar(160) NOT NULL COMMENT '歌曲名',
  `artist` varchar(80) DEFAULT NULL COMMENT '歌手',
  `album` varchar(80) DEFAULT NULL COMMENT '专辑',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面图',
  `audioUrl` varchar(500) NOT NULL COMMENT '音频地址',
  `duration` int NOT NULL DEFAULT 0 COMMENT '时长（秒）',
  `playCount` int NOT NULL DEFAULT 0 COMMENT '播放次数',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `index_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='音乐';

DROP TABLE IF EXISTS `Product`;
CREATE TABLE `Product` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '商家 User.id',
  `name` varchar(120) NOT NULL COMMENT '商品名称',
  `cover` varchar(400) DEFAULT NULL COMMENT '商品图',
  `description` varchar(1000) DEFAULT NULL COMMENT '商品描述',
  `price` decimal(10,2) NOT NULL DEFAULT 0 COMMENT '价格',
  `stock` int NOT NULL DEFAULT 0 COMMENT '库存',
  `sales` int NOT NULL DEFAULT 0 COMMENT '销量',
  `status` varchar(20) NOT NULL DEFAULT 'on' COMMENT '状态：on/off',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上架日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `index_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='电商商品';

DROP TABLE IF EXISTS `Cart`;
CREATE TABLE `Cart` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '买家 User.id',
  `productId` bigint NOT NULL COMMENT '商品 Product.id',
  `title` varchar(120) NOT NULL COMMENT '商品名称',
  `cover` varchar(400) DEFAULT NULL COMMENT '商品图',
  `price` decimal(10,2) NOT NULL DEFAULT 0 COMMENT '单价',
  `qty` int NOT NULL DEFAULT 1 COMMENT '数量',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `productId` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车';

DROP TABLE IF EXISTS `ShopOrder`;
CREATE TABLE `ShopOrder` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '买家 User.id',
  `consignee` varchar(50) NOT NULL COMMENT '收货人',
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `address` varchar(200) NOT NULL COMMENT '收货地址',
  `remark` varchar(200) DEFAULT NULL COMMENT '备注',
  `total` decimal(10,2) NOT NULL DEFAULT 0 COMMENT '订单金额',
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '状态：pending/paid/shipped/done',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下单时间',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `index_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='电商订单';

-- ---------------------------------------------------------------------------
-- Access (ids 51–61). Activity already has Access id=35.
-- alias UNIQUE: set alias = table name so JSON keys stay PascalCase.
-- ---------------------------------------------------------------------------

DELETE FROM `Access` WHERE `id` BETWEEN 51 AND 61
  OR `alias` IN ('Employee','Message','News','Notice','Blog','Article','Video','Music','Product','Cart','ShopOrder');

INSERT INTO `Access` (`id`, `debug`, `schema`, `name`, `alias`, `get`, `head`, `gets`, `heads`, `post`, `put`, `delete`, `date`, `detail`)
VALUES
(51, 0, NULL, 'Employee', 'Employee',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '数据管理-员工花名册'),
(52, 0, NULL, 'Message', 'Message',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '聊天消息'),
(53, 0, NULL, 'News', 'News',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '新闻'),
(54, 0, NULL, 'Notice', 'Notice',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '资讯公告'),
(55, 0, NULL, 'Blog', 'Blog',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '博客'),
(56, 0, NULL, 'Article', 'Article',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '文章'),
(57, 0, NULL, 'Video', 'Video',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '视频'),
(58, 0, NULL, 'Music', 'Music',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '音乐'),
(59, 0, NULL, 'Product', 'Product',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '电商商品'),
(60, 0, NULL, 'Cart', 'Cart',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '购物车'),
(61, 0, NULL, 'ShopOrder', 'ShopOrder',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '电商订单');

-- ---------------------------------------------------------------------------
-- Request POST/PUT/DELETE (Activity/Data already have rows)
-- ---------------------------------------------------------------------------

DELETE FROM `Request` WHERE `id` BETWEEN 9105101 AND 9105133
  OR `tag` IN ('Employee','Message','News','Notice','Blog','Article','Video','Music','Product','Cart','ShopOrder');

INSERT INTO `Request` (`id`, `debug`, `version`, `method`, `tag`, `structure`, `detail`, `date`) VALUES
(9105101, 0, 1, 'POST', 'Employee', CAST('{"MUST":"name","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Employee', NOW()),
(9105102, 0, 1, 'PUT', 'Employee', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Employee', NOW()),
(9105103, 0, 1, 'DELETE', 'Employee', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Employee', NOW()),

(9105104, 0, 1, 'POST', 'Message', CAST('{"MUST":"content,toUserId","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Message', NOW()),
(9105105, 0, 1, 'PUT', 'Message', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Message', NOW()),
(9105106, 0, 1, 'DELETE', 'Message', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Message', NOW()),

(9105107, 0, 1, 'POST', 'News', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create News', NOW()),
(9105108, 0, 1, 'PUT', 'News', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update News', NOW()),
(9105109, 0, 1, 'DELETE', 'News', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete News', NOW()),

(9105110, 0, 1, 'POST', 'Notice', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Notice', NOW()),
(9105111, 0, 1, 'PUT', 'Notice', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Notice', NOW()),
(9105112, 0, 1, 'DELETE', 'Notice', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Notice', NOW()),

(9105113, 0, 1, 'POST', 'Blog', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Blog', NOW()),
(9105114, 0, 1, 'PUT', 'Blog', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Blog', NOW()),
(9105115, 0, 1, 'DELETE', 'Blog', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Blog', NOW()),

(9105116, 0, 1, 'POST', 'Article', CAST('{"MUST":"title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Article', NOW()),
(9105117, 0, 1, 'PUT', 'Article', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Article', NOW()),
(9105118, 0, 1, 'DELETE', 'Article', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Article', NOW()),

(9105119, 0, 1, 'POST', 'Video', CAST('{"MUST":"title,videoUrl","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Video', NOW()),
(9105120, 0, 1, 'PUT', 'Video', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Video', NOW()),
(9105121, 0, 1, 'DELETE', 'Video', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Video', NOW()),

(9105122, 0, 1, 'POST', 'Music', CAST('{"MUST":"title,audioUrl","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Music', NOW()),
(9105123, 0, 1, 'PUT', 'Music', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Music', NOW()),
(9105124, 0, 1, 'DELETE', 'Music', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Music', NOW()),

(9105125, 0, 1, 'POST', 'Product', CAST('{"MUST":"name","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Product', NOW()),
(9105126, 0, 1, 'PUT', 'Product', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Product', NOW()),
(9105127, 0, 1, 'DELETE', 'Product', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Product', NOW()),

(9105128, 0, 1, 'POST', 'Cart', CAST('{"MUST":"title,productId","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Cart line', NOW()),
(9105129, 0, 1, 'PUT', 'Cart', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Cart', NOW()),
(9105130, 0, 1, 'DELETE', 'Cart', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Cart', NOW()),

(9105131, 0, 1, 'POST', 'ShopOrder', CAST('{"MUST":"consignee,phone,address","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create ShopOrder', NOW()),
(9105132, 0, 1, 'PUT', 'ShopOrder', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update ShopOrder', NOW()),
(9105133, 0, 1, 'DELETE', 'ShopOrder', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete ShopOrder', NOW());

-- ---------------------------------------------------------------------------
-- Seed rows (userId values exist in apijson_user)
-- ---------------------------------------------------------------------------

INSERT INTO `Employee` (`id`,`userId`,`name`,`dept`,`title`,`sex`,`salary`,`status`,`email`,`phone`,`head`,`date`) VALUES
(101, 82001, '林晓', '产品', '产品经理', 1, 28000.00, 'active', 'linxiao@a2api.dev', '13800001001', 'https://picsum.photos/id/64/200/200', '2024-03-01 09:00:00'),
(102, 82001, '陈舟', '研发', '后端工程师', 0, 32000.00, 'active', 'chenzhou@a2api.dev', '13800001002', 'https://picsum.photos/id/91/200/200', '2023-11-12 09:00:00'),
(103, 38710, '苏晚', '设计', 'UI 设计师', 1, 22000.00, 'active', 'suwan@a2api.dev', '13800001003', 'https://picsum.photos/id/177/200/200', '2024-06-18 09:00:00'),
(104, 82002, '周衡', '研发', '前端工程师', 0, 30000.00, 'active', 'zhouheng@a2api.dev', '13800001004', 'https://picsum.photos/id/203/200/200', '2022-08-08 09:00:00'),
(105, 82001, '韩梅', '运营', '运营主管', 1, 26000.00, 'active', 'hanmei@a2api.dev', '13800001005', 'https://picsum.photos/id/338/200/200', '2024-01-15 09:00:00'),
(106, 70793, '顾深', '研发', '数据工程师', 0, 35000.00, 'active', 'gushen@a2api.dev', '13800001006', 'https://picsum.photos/id/453/200/200', '2021-04-20 09:00:00'),
(107, 82003, '叶青', '市场', '市场专员', 1, 18000.00, 'leave', 'yeqing@a2api.dev', '13800001007', 'https://picsum.photos/id/548/200/200', '2025-02-10 09:00:00'),
(108, 82012, '沈牧', '产品', '产品助理', 0, 16000.00, 'active', 'shenmu@a2api.dev', '13800001008', 'https://picsum.photos/id/669/200/200', '2025-09-01 09:00:00');

INSERT INTO `Activity` (`id`,`userId`,`title`,`cover`,`content`,`startTime`,`endTime`,`status`,`signupCount`,`date`) VALUES
(201, 82001, '春季会员日满减', 'https://picsum.photos/id/1015/800/450', '全场满 199 减 30，会员额外 9.5 折。', '2026-03-01 00:00:00', '2026-03-15 23:59:59', 'ended', 1280, '2026-02-20 10:00:00'),
(202, 82001, '新品内测招募', 'https://picsum.photos/id/1018/800/450', '邀请 200 位用户体验新版工作台，提交反馈可获周边。', '2026-08-01 10:00:00', '2026-08-31 18:00:00', 'online', 176, '2026-07-22 09:30:00'),
(203, 38710, '夏日夜跑城市赛', 'https://picsum.photos/id/1016/800/450', '5 公里城市夜跑，完赛奖牌 + 补给。', '2026-07-12 19:30:00', '2026-07-12 22:00:00', 'ended', 860, '2026-06-01 12:00:00'),
(204, 82002, '开学季满赠图书', 'https://picsum.photos/id/24/800/450', '指定书单满 3 本赠帆布袋。', '2026-08-20 00:00:00', '2026-09-15 23:59:59', 'online', 432, '2026-08-10 08:00:00'),
(205, 82001, '双十一预热抽奖', 'https://picsum.photos/id/1060/800/450', '每日签到抽免单，奖池每日刷新。', '2026-10-20 00:00:00', '2026-11-11 23:59:59', 'draft', 0, '2026-08-18 16:00:00'),
(206, 82003, '开发者沙龙·上海', 'https://picsum.photos/id/201/800/450', 'APIJSON / A2API 线下交流，限 80 人。', '2026-09-05 13:30:00', '2026-09-05 17:30:00', 'online', 64, '2026-08-01 11:00:00');

INSERT INTO `Message` (`id`,`userId`,`toUserId`,`conversationId`,`author`,`head`,`content`,`date`) VALUES
(301, 82001, 38710, 9001, 'Test User', 'https://static.oschina.net/uploads/user/1/3064_50.jpg?t=1449', '今晚一起看下活动报名数据？', '2026-08-22 09:12:00'),
(302, 38710, 82001, 9001, 'TommyLemon', 'https://static.oschina.net/uploads/user/1218/2437072_100.jpg', '可以，我把看板链接发你。', '2026-08-22 09:13:20'),
(303, 82001, 38710, 9001, 'Test User', 'https://static.oschina.net/uploads/user/1/3064_50.jpg?t=1449', '收到。另外商品图还缺几张封面。', '2026-08-22 09:14:01'),
(304, 82002, 82001, 9002, 'Jan', 'https://avatars.githubusercontent.com/u/41146037?v=4', '前端布局模板已经合进去了。', '2026-08-21 18:40:00'),
(305, 82001, 82002, 9002, 'Test User', 'https://static.oschina.net/uploads/user/1/3064_50.jpg?t=1449', '好，我补一批测试数据。', '2026-08-21 18:41:12'),
(306, 82003, 82001, 9003, 'Wechat', 'https://common.cnblogs.com/images/wechat.png', '沙龙场地确认在静安，下午 1 点开门。', '2026-08-20 11:02:00'),
(307, 70793, 82001, 9004, 'Strong', 'https://static.oschina.net/uploads/user/585/1170143_50.jpg?t', '员工表示薪资字段用月薪即可。', '2026-08-19 15:28:00'),
(308, 82012, 82001, 9005, 'Steve', 'https://static.oschina.net/uploads/user/1/3064_50.jpg?t=1449', '购物车结算页文案我改了一版。', '2026-08-18 20:05:00');

INSERT INTO `News` (`id`,`userId`,`title`,`headline`,`source`,`author`,`cover`,`content`,`viewCount`,`date`) VALUES
(401, 82001, '城市轨道交通新线今日开通', '早高峰预计分流 12 万人次', '都市日报', '林晓', 'https://picsum.photos/id/1011/800/450', '新开通的 15 号线连接南北新城，全程约 42 分钟。首日列车准点率 99%。', 19200, '2026-08-22 07:30:00'),
(402, 38710, '开源协议治理进入企业议程', 'API 先行团队开始审计依赖许可证', '技术周刊', '陈舟', 'https://picsum.photos/id/0/800/450', '多家公司将 SPDX 扫描接入 CI，未声明协议的依赖将被阻断合并。', 8600, '2026-08-21 11:00:00'),
(403, 82002, '台风将于周末登陆东部沿海', '气象台发布橙色预警', '气象台', '苏晚', 'https://picsum.photos/id/1019/800/450', '预计登陆时中心风力 12 级，沿海市县停课停工安排稍后公布。', 45100, '2026-08-20 16:45:00'),
(404, 82001, '本地足球队晋级半决赛', '加时赛 2:1 逆转', '体育报', '周衡', 'https://picsum.photos/id/28/800/450', '第 108 分钟点球绝杀，主场球迷提前庆祝。下一轮对阵卫冕冠军。', 22300, '2026-08-19 22:10:00'),
(405, 82003, '博物馆夜场预约开放', '每周五延长至 21 点', '文化资讯', '韩梅', 'https://picsum.photos/id/1015/800/450', '夜场限流 800 人，需提前 3 天预约。特展「丝绸之路」同步开放。', 5400, '2026-08-18 09:00:00'),
(406, 70793, '央行宣布降准 0.25 个百分点', '释放长期资金约 5000 亿', '财经早报', '顾深', 'https://picsum.photos/id/20/800/450', '降准将于下周一落地，银行间流动性有望改善。', 31800, '2026-08-17 08:20:00');

INSERT INTO `Notice` (`id`,`userId`,`title`,`cover`,`content`,`status`,`date`) VALUES
(501, 82001, '系统维护通知：8 月 24 日 02:00–04:00', 'https://picsum.photos/id/60/800/450', '该窗口将升级数据库索引，期间写入接口返回 503，只读查询不受影响。', 'published', '2026-08-21 10:00:00'),
(502, 82001, '办公区门禁升级完成', 'https://picsum.photos/id/180/800/450', '请使用工卡 + 人脸双因子。访客请提前在前台登记。', 'published', '2026-08-20 14:20:00'),
(503, 38710, 'Q3 团建意向征集', 'https://picsum.photos/id/1016/800/450', '选项：郊外徒步 / 密室 / 野餐。请于周五前在表格中投票。', 'published', '2026-08-19 09:15:00'),
(504, 82002, '开源贡献奖励办法（试行）', 'https://picsum.photos/id/96/800/450', '合并到主仓的 PR 按复杂度计分，季度兑换周边与调休。', 'published', '2026-08-12 11:00:00'),
(505, 82001, '食堂本周菜单调整', 'https://picsum.photos/id/292/800/450', '周三增加素食窗口；周五供应牛肉面。过敏原见告示牌。', 'published', '2026-08-11 08:40:00'),
(506, 82003, '草稿：年会场地待定', 'https://picsum.photos/id/201/800/450', '候选两家酒店，预算对比表稍后发出。', 'draft', '2026-08-22 17:00:00');

INSERT INTO `Blog` (`id`,`userId`,`title`,`author`,`cover`,`content`,`date`) VALUES
(601, 38710, '把聊天变成可绑定的 API', 'TommyLemon', 'https://picsum.photos/id/2/800/450', 'Agent 不该每次点击都再跑一遍模型。一次生成 UI 与请求模板，之后筛选分页直接打 HTTP。', '2026-08-15 10:00:00'),
(602, 82001, '周末在江边散步想到的产品细节', 'Test User', 'https://picsum.photos/id/1015/800/450', '列表页和详情页必须是独立页面：标题、surfaceId、保存快照都不能混用。', '2026-08-10 19:20:00'),
(603, 82002, '前端布局分类的一次试验', 'Jan', 'https://picsum.photos/id/119/800/450', '按表名和字段推断社交/新闻/电商模板，用户仍可在工具栏手动覆盖。', '2026-08-08 13:11:00'),
(604, 70793, '图表默认分组为什么不能用 id', 'Strong', 'https://picsum.photos/id/180/800/450', '主键几乎唯一，GROUP BY id 会得到一堆单点。部门、状态、日期更合适。', '2026-07-29 09:45:00'),
(605, 82003, '一次失败的线下沙龙筹备', 'Wechat', 'https://picsum.photos/id/201/800/450', '场地确认晚了两天，物料印刷来不及。以后活动表必须有开始/结束时间。', '2026-07-02 21:00:00'),
(606, 82012, '笔记：APIJSON 的 Access 与 Request', 'Steve', 'https://picsum.photos/id/24/800/450', 'GET 可以 UNKNOWN；POST 需要 tag 对应的 Request.structure，OWNER 会注入 userId。', '2026-06-18 08:30:00');

INSERT INTO `Article` (`id`,`userId`,`title`,`author`,`cover`,`content`,`date`) VALUES
(701, 38710, '从文本到结构化请求：A2API 0.1', 'TommyLemon', 'https://picsum.photos/id/0/800/450', 'proposeRequest / bindRequest 把一次成功的 APIJSON 调用冻成模板。稳态阶段 usedLlm=false。', '2026-08-16 11:00:00'),
(702, 82001, '权限门控：缺 Access 时自动提交 Apply', 'Test User', 'https://picsum.photos/id/48/800/450', '编辑删除先打业务 API；若权限或结构不合法，Demo 自动向 Admin 提交配置申请。', '2026-08-09 15:40:00'),
(703, 82002, '智能字段：图片、性别与外键', 'Jan', 'https://picsum.photos/id/177/800/450', 'Show=Auto 时根据字段名与注释推断图片；sex 显示男女；*Id 跳转关联详情。', '2026-08-04 10:22:00'),
(704, 70793, '不要把 SQL 交给模型临场拼装', 'Strong', 'https://picsum.photos/id/60/800/450', '可控的是 HTTP 上的 JSON ORM。表级角色与 Request.structure 仍在你信任的 API 层。', '2026-07-21 09:00:00'),
(705, 82003, '运营活动页需要的最小字段集', 'Wechat', 'https://picsum.photos/id/1018/800/450', '标题、封面、说明、开始结束时间、状态、报名人数。其余放到详情里编辑。', '2026-07-11 16:18:00'),
(706, 82012, '电商列表为什么要独立购物车页', 'Steve', 'https://picsum.photos/id/292/800/450', '商品浏览是 commerce 布局；结算是 order。同一份 Product 数据，两种页面模板。', '2026-06-30 12:00:00');

INSERT INTO `Video` (`id`,`userId`,`title`,`author`,`cover`,`videoUrl`,`duration`,`playCount`,`date`) VALUES
(801, 82001, 'Big Buck Bunny', 'Blender', 'https://picsum.photos/id/1015/800/450', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 596, 92000, '2026-08-01 10:00:00'),
(802, 38710, 'Elephant Dream', 'Blender', 'https://picsum.photos/id/1018/800/450', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 653, 54000, '2026-07-20 10:00:00'),
(803, 82002, 'Sintel', 'Blender', 'https://picsum.photos/id/1016/800/450', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 888, 121000, '2026-07-02 10:00:00'),
(804, 82001, 'Tears of Steel', 'Blender', 'https://picsum.photos/id/201/800/450', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 734, 78000, '2026-06-18 10:00:00'),
(805, 82003, 'For Bigger Blazes', 'Google', 'https://picsum.photos/id/28/800/450', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 15, 21000, '2026-08-12 10:00:00'),
(806, 70793, 'For Bigger Fun', 'Google', 'https://picsum.photos/id/1060/800/450', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 60, 33400, '2026-08-14 10:00:00');

INSERT INTO `Music` (`id`,`userId`,`title`,`artist`,`album`,`cover`,`audioUrl`,`duration`,`playCount`,`date`) VALUES
(901, 82001, 'SoundHelix Song 1', 'Tilo Burkhardt', 'SoundHelix', 'https://picsum.photos/id/39/400/400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 372, 18000, '2026-08-01 12:00:00'),
(902, 38710, 'SoundHelix Song 2', 'Tilo Burkhardt', 'SoundHelix', 'https://picsum.photos/id/40/400/400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 352, 9600, '2026-08-02 12:00:00'),
(903, 82002, 'SoundHelix Song 3', 'Tilo Burkhardt', 'SoundHelix', 'https://picsum.photos/id/45/400/400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 297, 7200, '2026-08-03 12:00:00'),
(904, 82001, 'SoundHelix Song 8', 'Tilo Burkhardt', 'SoundHelix', 'https://picsum.photos/id/54/400/400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', 314, 5400, '2026-08-04 12:00:00'),
(905, 82003, 'SoundHelix Song 13', 'Tilo Burkhardt', 'SoundHelix', 'https://picsum.photos/id/58/400/400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', 281, 4100, '2026-08-05 12:00:00'),
(906, 70793, 'SoundHelix Song 16', 'Tilo Burkhardt', 'SoundHelix', 'https://picsum.photos/id/88/400/400', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', 266, 3800, '2026-08-06 12:00:00');

INSERT INTO `Product` (`id`,`userId`,`name`,`cover`,`description`,`price`,`stock`,`sales`,`status`,`date`) VALUES
(1001, 82001, '陶瓷滤杯套装', 'https://picsum.photos/id/225/600/600', '手冲咖啡滤杯 + 分享壶，适合 1–2 人。', 168.00, 42, 320, 'on', '2026-07-01 10:00:00'),
(1002, 82001, '亚麻沙发靠垫', 'https://picsum.photos/id/1078/600/600', '45×45 cm，可拆洗外套，四色可选。', 89.00, 120, 860, 'on', '2026-06-18 10:00:00'),
(1003, 38710, '机械键盘套件', 'https://picsum.photos/id/119/600/600', '75% 配列，热插拔，附键帽与试轴器。', 459.00, 18, 140, 'on', '2026-08-01 10:00:00'),
(1004, 82002, '登山折叠杖', 'https://picsum.photos/id/29/600/600', '铝合金，可调 65–135 cm，含泥托。', 129.00, 64, 210, 'on', '2026-05-20 10:00:00'),
(1005, 82001, '帆布托特包', 'https://picsum.photos/id/1015/600/600', '16 oz 帆布，内袋分层，可装 14 寸笔记本。', 199.00, 35, 540, 'on', '2026-07-22 10:00:00'),
(1006, 82003, '香薰蜡烛礼盒', 'https://picsum.photos/id/1080/600/600', '三罐季节限定气味，燃烧约 28 小时/罐。', 138.00, 80, 390, 'on', '2026-08-08 10:00:00'),
(1007, 70793, '无线降噪耳机', 'https://picsum.photos/id/3/600/600', '主动降噪，续航 30 小时，USB-C 快充。', 799.00, 12, 95, 'on', '2026-08-12 10:00:00'),
(1008, 82012, '桌面显示器灯', 'https://picsum.photos/id/201/600/600', '无频闪，色温 2700–6500K，屏幕挂灯。', 259.00, 0, 410, 'off', '2026-04-02 10:00:00');

INSERT INTO `Cart` (`id`,`userId`,`productId`,`title`,`cover`,`price`,`qty`,`date`) VALUES
(1101, 82001, 1001, '陶瓷滤杯套装', 'https://picsum.photos/id/225/600/600', 168.00, 1, '2026-08-20 12:00:00'),
(1102, 82001, 1005, '帆布托特包', 'https://picsum.photos/id/1015/600/600', 199.00, 2, '2026-08-21 09:10:00'),
(1103, 38710, 1003, '机械键盘套件', 'https://picsum.photos/id/119/600/600', 459.00, 1, '2026-08-22 08:30:00'),
(1104, 82002, 1006, '香薰蜡烛礼盒', 'https://picsum.photos/id/1080/600/600', 138.00, 3, '2026-08-19 21:00:00');

INSERT INTO `ShopOrder` (`id`,`userId`,`consignee`,`phone`,`address`,`remark`,`total`,`status`,`date`) VALUES
(1201, 82001, '林晓', '13800001001', '上海市静安区南京西路 100 号 8 楼', '工作日白天可收', 367.00, 'paid', '2026-08-12 11:20:00'),
(1202, 38710, '陈舟', '13800001002', '深圳市南山区科技园路 1 号', '放前台', 459.00, 'shipped', '2026-08-10 16:05:00'),
(1203, 82002, '苏晚', '13800001003', '杭州市西湖区文三路 200 号', NULL, 414.00, 'done', '2026-07-28 09:48:00'),
(1204, 82003, '周衡', '13800001004', '北京市朝阳区工体北路 8 号', '不要电话营销', 799.00, 'pending', '2026-08-22 19:01:00');
