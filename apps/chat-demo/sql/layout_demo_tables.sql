-- Layout demo tables + Access/Request + seed rows for A2API chat-demo.
-- Run against the same Demo DB as APIJSONBoot (schema `sys`, MySQL).
-- Password in local Demo is typically: root / apijson
--
--   /usr/local/mysql/bin/mysql -h127.0.0.1 -P3306 -uroot -papijson sys < apps/chat-demo/sql/layout_demo_tables.sql
-- Existing DB (no DROP): also run layout_demo_media_text.sql for lyrics / captions / long articles.
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
--   电商购物 Product / Cart / ShopOrder
--   分类     Category（各应用类目；缺表时也可只跑 layout_demo_categories.sql）
-- Covers: same-origin /media/covers/{id}.svg (not picsum.photos — often blocked in CN).
--   更多场景 教育学习/图书阅读/… 见 layout_demo_scenes.sql
--   场景技能 Skill（查询/匹配/上传）见 layout_demo_skills.sql

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
  `content` text COMMENT '资讯正文',
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
  `praiseUserIdList` json DEFAULT NULL COMMENT '点赞用户 User.id 列表',
  `collectUserIdList` json DEFAULT NULL COMMENT '收藏用户 User.id 列表',
  `shareCount` int NOT NULL DEFAULT 0 COMMENT '分享次数',
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
  `praiseUserIdList` json DEFAULT NULL COMMENT '点赞用户 User.id 列表',
  `collectUserIdList` json DEFAULT NULL COMMENT '收藏用户 User.id 列表',
  `shareCount` int NOT NULL DEFAULT 0 COMMENT '分享次数',
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
  `subtitleList` json DEFAULT NULL COMMENT '字幕 [{lang,label,url}]，免登录 WebVTT',
  `qualityList` json DEFAULT NULL COMMENT '清晰度 [{label,url}]，同一内容多分辨率',
  `duration` int NOT NULL DEFAULT 0 COMMENT '时长（秒）',
  `playCount` int NOT NULL DEFAULT 0 COMMENT '播放次数',
  `praiseUserIdList` json DEFAULT NULL COMMENT '点赞用户 User.id 列表',
  `collectUserIdList` json DEFAULT NULL COMMENT '收藏用户 User.id 列表',
  `shareCount` int NOT NULL DEFAULT 0 COMMENT '分享次数',
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
  `lyrics` text COMMENT '歌词（LRC 或纯文本，公版/CC 曲目）',
  `duration` int NOT NULL DEFAULT 0 COMMENT '时长（秒）',
  `playCount` int NOT NULL DEFAULT 0 COMMENT '播放次数',
  `praiseUserIdList` json DEFAULT NULL COMMENT '点赞用户 User.id 列表',
  `collectUserIdList` json DEFAULT NULL COMMENT '收藏用户 User.id 列表',
  `shareCount` int NOT NULL DEFAULT 0 COMMENT '分享次数',
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
  `cover` varchar(400) DEFAULT NULL COMMENT '商品封面图',
  `pictureList` json DEFAULT NULL COMMENT '商品图集',
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

DROP TABLE IF EXISTS `Category`;
CREATE TABLE `Category` (
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

DROP TABLE IF EXISTS `Address`;
CREATE TABLE `Address` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '买家 User.id',
  `consignee` varchar(50) NOT NULL COMMENT '收货人',
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `region` varchar(80) DEFAULT NULL COMMENT '省市区',
  `address` varchar(200) NOT NULL COMMENT '详细地址',
  `tag` varchar(20) DEFAULT NULL COMMENT '标签：家/公司/学校',
  `isDefault` tinyint NOT NULL DEFAULT 0 COMMENT '默认地址：0-否，1-是',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建日期',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收件地址';

-- ---------------------------------------------------------------------------
-- Access (ids 51–63). Activity already has Access id=35.
-- alias UNIQUE: set alias = table name so JSON keys stay PascalCase.
-- ---------------------------------------------------------------------------

DELETE FROM `Access` WHERE `id` BETWEEN 51 AND 63
  OR `alias` IN ('Employee','Message','News','Notice','Blog','Article','Video','Music','Product','Cart','ShopOrder','Category','Address');

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
 '["OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]',
 NOW(), '博客'),
(56, 0, NULL, 'Article', 'Article',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]',
 NOW(), '文章'),
(57, 0, NULL, 'Video', 'Video',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]',
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
 NOW(), '电商订单'),
(62, 0, NULL, 'Category', 'Category',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '通用分类/栏目/流派'),
(63, 0, NULL, 'Address', 'Address',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '收件地址');

-- ---------------------------------------------------------------------------
-- Request POST/PUT/DELETE (Activity/Data already have rows)
-- ---------------------------------------------------------------------------

DELETE FROM `Request` WHERE `id` BETWEEN 9105101 AND 9105139
  OR `tag` IN ('Employee','Message','News','Notice','Blog','Article','Video','Music','Product','Cart','ShopOrder','Category','Address');

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
(9105133, 0, 1, 'DELETE', 'ShopOrder', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete ShopOrder', NOW()),

(9105134, 0, 1, 'POST', 'Category', CAST('{"MUST":"name,app","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Category', NOW()),
(9105135, 0, 1, 'PUT', 'Category', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Category', NOW()),
(9105136, 0, 1, 'DELETE', 'Category', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Category', NOW()),

(9105137, 0, 1, 'POST', 'Address', CAST('{"MUST":"consignee,phone,address","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Address', NOW()),
(9105138, 0, 1, 'PUT', 'Address', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Address', NOW()),
(9105139, 0, 1, 'DELETE', 'Address', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Address', NOW());

-- ---------------------------------------------------------------------------
-- Seed rows (userId values exist in apijson_user)
-- ---------------------------------------------------------------------------

INSERT INTO `Employee` (`id`,`userId`,`name`,`dept`,`title`,`sex`,`salary`,`status`,`email`,`phone`,`head`,`date`) VALUES
(101, 82001, '林晓', '产品', '产品经理', 1, 28000.00, 'active', 'linxiao@a2api.dev', '13800001001', '/media/covers/64.svg', '2024-03-01 09:00:00'),
(102, 82001, '陈舟', '研发', '后端工程师', 0, 32000.00, 'active', 'chenzhou@a2api.dev', '13800001002', '/media/covers/91.svg', '2023-11-12 09:00:00'),
(103, 38710, '苏晚', '设计', 'UI 设计师', 1, 22000.00, 'active', 'suwan@a2api.dev', '13800001003', '/media/covers/177.svg', '2024-06-18 09:00:00'),
(104, 82002, '周衡', '研发', '前端工程师', 0, 30000.00, 'active', 'zhouheng@a2api.dev', '13800001004', '/media/covers/203.svg', '2022-08-08 09:00:00'),
(105, 82001, '韩梅', '运营', '运营主管', 1, 26000.00, 'active', 'hanmei@a2api.dev', '13800001005', '/media/covers/338.svg', '2024-01-15 09:00:00'),
(106, 70793, '顾深', '研发', '数据工程师', 0, 35000.00, 'active', 'gushen@a2api.dev', '13800001006', '/media/covers/453.svg', '2021-04-20 09:00:00'),
(107, 82003, '叶青', '市场', '市场专员', 1, 18000.00, 'leave', 'yeqing@a2api.dev', '13800001007', '/media/covers/548.svg', '2025-02-10 09:00:00'),
(108, 82012, '沈牧', '产品', '产品助理', 0, 16000.00, 'active', 'shenmu@a2api.dev', '13800001008', '/media/covers/669.svg', '2025-09-01 09:00:00');

INSERT INTO `Activity` (`id`,`userId`,`title`,`cover`,`content`,`startTime`,`endTime`,`status`,`signupCount`,`date`) VALUES
(201, 82001, '春季会员日满减', '/media/covers/1015.svg', '全场满 199 减 30，会员额外 9.5 折。', '2026-03-01 00:00:00', '2026-03-15 23:59:59', 'ended', 1280, '2026-02-20 10:00:00'),
(202, 82001, '新品内测招募', '/media/covers/1018.svg', '邀请 200 位用户体验新版工作台，提交反馈可获周边。', '2026-08-01 10:00:00', '2026-08-31 18:00:00', 'online', 176, '2026-07-22 09:30:00'),
(203, 38710, '夏日夜跑城市赛', '/media/covers/1016.svg', '5 公里城市夜跑，完赛奖牌 + 补给。', '2026-07-12 19:30:00', '2026-07-12 22:00:00', 'ended', 860, '2026-06-01 12:00:00'),
(204, 82002, '开学季满赠图书', '/media/covers/24.svg', '指定书单满 3 本赠帆布袋。', '2026-08-20 00:00:00', '2026-09-15 23:59:59', 'online', 432, '2026-08-10 08:00:00'),
(205, 82001, '双十一预热抽奖', '/media/covers/1060.svg', '每日签到抽免单，奖池每日刷新。', '2026-10-20 00:00:00', '2026-11-11 23:59:59', 'draft', 0, '2026-08-18 16:00:00'),
(206, 82003, '开发者沙龙·上海', '/media/covers/201.svg', 'APIJSON / A2API 线下交流，限 80 人。', '2026-09-05 13:30:00', '2026-09-05 17:30:00', 'online', 64, '2026-08-01 11:00:00');

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
(401, 82001, '城市轨道交通新线今日开通', '早高峰预计分流 12 万人次', '都市日报', '林晓', '/media/covers/1011.svg', '新开通的 15 号线连接南北新城，全程约 42 分钟。首日列车准点率 99%。', 19200, '2026-08-22 07:30:00'),
(402, 38710, '开源协议治理进入企业议程', 'API 先行团队开始审计依赖许可证', '技术周刊', '陈舟', '/media/covers/0.svg', '多家公司将 SPDX 扫描接入 CI，未声明协议的依赖将被阻断合并。', 8600, '2026-08-21 11:00:00'),
(403, 82002, '台风将于周末登陆东部沿海', '气象台发布橙色预警', '气象台', '苏晚', '/media/covers/1019.svg', '预计登陆时中心风力 12 级，沿海市县停课停工安排稍后公布。', 45100, '2026-08-20 16:45:00'),
(404, 82001, '本地足球队晋级半决赛', '加时赛 2:1 逆转', '体育报', '周衡', '/media/covers/28.svg', '第 108 分钟点球绝杀，主场球迷提前庆祝。下一轮对阵卫冕冠军。', 22300, '2026-08-19 22:10:00'),
(405, 82003, '博物馆夜场预约开放', '每周五延长至 21 点', '文化资讯', '韩梅', '/media/covers/1015.svg', '夜场限流 800 人，需提前 3 天预约。特展「丝绸之路」同步开放。', 5400, '2026-08-18 09:00:00'),
(406, 70793, '央行宣布降准 0.25 个百分点', '释放长期资金约 5000 亿', '财经早报', '顾深', '/media/covers/20.svg', '降准将于下周一落地，银行间流动性有望改善。', 31800, '2026-08-17 08:20:00');

INSERT INTO `Notice` (`id`,`userId`,`title`,`cover`,`content`,`status`,`date`) VALUES
(501, 82001, '系统维护通知：8 月 24 日 02:00–04:00', '/media/covers/60.svg', '该窗口将升级数据库索引，期间写入接口返回 503，只读查询不受影响。', 'published', '2026-08-21 10:00:00'),
(502, 82001, '办公区门禁升级完成', '/media/covers/180.svg', '请使用工卡 + 人脸双因子。访客请提前在前台登记。', 'published', '2026-08-20 14:20:00'),
(503, 38710, 'Q3 团建意向征集', '/media/covers/1016.svg', '选项：郊外徒步 / 密室 / 野餐。请于周五前在表格中投票。', 'published', '2026-08-19 09:15:00'),
(504, 82002, '开源贡献奖励办法（试行）', '/media/covers/96.svg', '合并到主仓的 PR 按复杂度计分，季度兑换周边与调休。', 'published', '2026-08-12 11:00:00'),
(505, 82001, '食堂本周菜单调整', '/media/covers/292.svg', '周三增加素食窗口；周五供应牛肉面。过敏原见告示牌。', 'published', '2026-08-11 08:40:00'),
(506, 82003, '草稿：年会场地待定', '/media/covers/201.svg', '候选两家酒店，预算对比表稍后发出。', 'draft', '2026-08-22 17:00:00');

INSERT INTO `Blog` (`id`,`userId`,`title`,`author`,`cover`,`content`,`praiseUserIdList`,`collectUserIdList`,`shareCount`,`date`) VALUES
(601, 38710, '把聊天变成可绑定的 API', 'TommyLemon', '/media/covers/2.svg', 'Agent 不该每次点击都再跑一遍模型。一次生成 UI 与请求模板，之后筛选分页直接打 HTTP。', '[82001,82002]', '[82003]', 12, '2026-08-15 10:00:00'),
(602, 82001, '周末在江边散步想到的产品细节', 'Test User', '/media/covers/1015.svg', '列表页和详情页必须是独立页面：标题、surfaceId、保存快照都不能混用。', '[38710]', '[]', 3, '2026-08-10 19:20:00'),
(603, 82002, '前端布局分类的一次试验', 'Jan', '/media/covers/119.svg', '按表名和字段推断社交/新闻/电商模板，用户仍可在工具栏手动覆盖。', '[82001]', '[38710,82001]', 5, '2026-08-08 13:11:00'),
(604, 70793, '图表默认分组为什么不能用 id', 'Strong', '/media/covers/180.svg', '主键几乎唯一，GROUP BY id 会得到一堆单点。部门、状态、日期更合适。', '[]', '[]', 1, '2026-07-29 09:45:00'),
(605, 82003, '一次失败的线下沙龙筹备', 'Wechat', '/media/covers/201.svg', '场地确认晚了两天，物料印刷来不及。以后活动表必须有开始/结束时间。', '[82012]', '[]', 0, '2026-07-02 21:00:00'),
(606, 82012, '笔记：APIJSON 的 Access 与 Request', 'Steve', '/media/covers/24.svg', 'GET 可以 UNKNOWN；POST 需要 tag 对应的 Request.structure，OWNER 会注入 userId。', '[82001,70793]', '[82002]', 8, '2026-06-18 08:30:00');

INSERT INTO `Article` (`id`,`userId`,`title`,`author`,`cover`,`content`,`praiseUserIdList`,`collectUserIdList`,`shareCount`,`date`) VALUES
(701, 38710, '从文本到结构化请求：A2API 0.1', 'TommyLemon', '/media/covers/0.svg', 'proposeRequest / bindRequest 把一次成功的 APIJSON 调用冻成模板。稳态阶段 usedLlm=false。', '[82001,82002,70793]', '[82001]', 21, '2026-08-16 11:00:00'),
(702, 82001, '权限门控：缺 Access 时自动提交 Apply', 'Test User', '/media/covers/48.svg', '编辑删除先打业务 API；若权限或结构不合法，Demo 自动向 Admin 提交配置申请。', '[38710]', '[]', 4, '2026-08-09 15:40:00'),
(703, 82002, '智能字段：图片、性别与外键', 'Jan', '/media/covers/177.svg', 'Show=Auto 时根据字段名与注释推断图片；sex 显示男女；*Id 跳转关联详情。', '[82001]', '[38710]', 6, '2026-08-04 10:22:00'),
(704, 70793, '不要把 SQL 交给模型临场拼装', 'Strong', '/media/covers/60.svg', '可控的是 HTTP 上的 JSON ORM。表级角色与 Request.structure 仍在你信任的 API 层。', '[]', '[82012]', 2, '2026-07-21 09:00:00'),
(705, 82003, '运营活动页需要的最小字段集', 'Wechat', '/media/covers/1018.svg', '标题、封面、说明、开始结束时间、状态、报名人数。其余放到详情里编辑。', '[82001]', '[]', 0, '2026-07-11 16:18:00'),
(706, 82012, '电商列表为什么要独立购物车页', 'Steve', '/media/covers/292.svg', '商品浏览是 commerce 布局；结算是 order。同一份 Product 数据，两种页面模板。', '[38710,82002]', '[82001]', 9, '2026-06-30 12:00:00');

-- Public HTTPS MP4s: no login, no cookie, browser <video> can play + seek (Accept-Ranges).
-- Avoid Google gtv-videos-bucket — often blocked / hangs from CN networks.
INSERT INTO `Video` (`id`,`userId`,`title`,`author`,`cover`,`videoUrl`,`duration`,`playCount`,`praiseUserIdList`,`collectUserIdList`,`shareCount`,`date`) VALUES
(801, 82001, 'Sintel Trailer', 'Blender Foundation', 'https://media.w3.org/2010/05/sintel/poster.png', 'https://media.w3.org/2010/05/sintel/trailer.mp4', 52, 92000, '[38710,82002]', '[82003]', 44, '2026-08-01 10:00:00'),
(802, 38710, 'Big Buck Bunny Trailer', 'Blender Foundation', 'https://media.w3.org/2010/05/bunny/poster.png', 'https://media.w3.org/2010/05/bunny/trailer.mp4', 33, 54000, '[82001]', '[]', 18, '2026-07-20 10:00:00'),
(803, 82002, 'Oceans', 'Video.js', 'https://vjs.zencdn.net/v/oceans.png', 'https://vjs.zencdn.net/v/oceans.mp4', 47, 121000, '[82001,70793]', '[38710]', 61, '2026-07-02 10:00:00'),
(804, 82001, 'Flower', 'MDN', '/media/covers/106.svg', 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 5, 78000, '[]', '[82002]', 12, '2026-06-18 10:00:00'),
(805, 82003, 'HTML5 Test Movie', 'W3C', 'https://media.w3.org/2010/05/video/poster.png', 'https://media.w3.org/2010/05/video/movie_300.mp4', 300, 21000, '[82012]', '[]', 3, '2026-08-12 10:00:00'),
(806, 70793, 'Rabbit', 'MDN', 'https://mdn.github.io/learning-area/html/multimedia-and-embedding/video-and-audio-content/poster.png', 'https://mdn.github.io/learning-area/html/multimedia-and-embedding/video-and-audio-content/rabbit320.mp4', 8, 33400, '[82001,82002]', '[82001]', 9, '2026-08-14 10:00:00');

INSERT INTO `Music` (`id`,`userId`,`title`,`artist`,`album`,`cover`,`audioUrl`,`duration`,`playCount`,`date`) VALUES
(901, 82001, 'SoundHelix Song 1', 'Tilo Burkhardt', 'SoundHelix', '/media/covers/39.svg', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 372, 18000, '2026-08-01 12:00:00'),
(902, 38710, 'SoundHelix Song 2', 'Tilo Burkhardt', 'SoundHelix', '/media/covers/40.svg', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 352, 9600, '2026-08-02 12:00:00'),
(903, 82002, 'SoundHelix Song 3', 'Tilo Burkhardt', 'SoundHelix', '/media/covers/45.svg', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 297, 7200, '2026-08-03 12:00:00'),
(904, 82001, 'SoundHelix Song 8', 'Tilo Burkhardt', 'SoundHelix', '/media/covers/54.svg', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', 314, 5400, '2026-08-04 12:00:00'),
(905, 82003, 'SoundHelix Song 13', 'Tilo Burkhardt', 'SoundHelix', '/media/covers/58.svg', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', 281, 4100, '2026-08-05 12:00:00'),
(906, 70793, 'SoundHelix Song 16', 'Tilo Burkhardt', 'SoundHelix', '/media/covers/88.svg', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', 266, 3800, '2026-08-06 12:00:00');

INSERT INTO `Product` (`id`,`userId`,`name`,`cover`,`pictureList`,`description`,`price`,`stock`,`sales`,`status`,`date`) VALUES
(1001, 82001, '陶瓷滤杯套装', '/media/covers/225.svg', CAST('["/media/covers/225.svg","/media/covers/30.svg","/media/covers/42.svg","/media/covers/366.svg"]' AS JSON), '手冲咖啡滤杯 + 分享壶，适合 1–2 人。', 168.00, 42, 320, 'on', '2026-07-01 10:00:00'),
(1002, 82001, '亚麻沙发靠垫', '/media/covers/1078.svg', CAST('["/media/covers/1078.svg","/media/covers/201.svg","/media/covers/101.svg","/media/covers/1067.svg"]' AS JSON), '45×45 cm，可拆洗外套，四色可选。', 89.00, 120, 860, 'on', '2026-06-18 10:00:00'),
(1003, 38710, '机械键盘套件', '/media/covers/119.svg', CAST('["/media/covers/119.svg","/media/covers/160.svg","/media/covers/180.svg","/media/covers/250.svg","/media/covers/2.svg"]' AS JSON), '75% 配列，热插拔，附键帽与试轴器。', 459.00, 18, 140, 'on', '2026-08-01 10:00:00'),
(1004, 82002, '登山折叠杖', '/media/covers/29.svg', CAST('["/media/covers/29.svg","/media/covers/28.svg","/media/covers/14.svg"]' AS JSON), '铝合金，可调 65–135 cm，含泥托。', 129.00, 64, 210, 'on', '2026-05-20 10:00:00'),
(1005, 82001, '帆布托特包', '/media/covers/1015.svg', CAST('["/media/covers/1015.svg","/media/covers/1011.svg","/media/covers/103.svg","/media/covers/21.svg"]' AS JSON), '16 oz 帆布，内袋分层，可装 14 寸笔记本。', 199.00, 35, 540, 'on', '2026-07-22 10:00:00'),
(1006, 82003, '香薰蜡烛礼盒', '/media/covers/1080.svg', CAST('["/media/covers/1080.svg","/media/covers/1081.svg","/media/covers/292.svg"]' AS JSON), '三罐季节限定气味，燃烧约 28 小时/罐。', 138.00, 80, 390, 'on', '2026-08-08 10:00:00'),
(1007, 70793, '无线降噪耳机', '/media/covers/3.svg', CAST('["/media/covers/3.svg","/media/covers/7.svg","/media/covers/60.svg","/media/covers/96.svg"]' AS JSON), '主动降噪，续航 30 小时，USB-C 快充。', 799.00, 12, 95, 'on', '2026-08-12 10:00:00'),
(1008, 82012, '桌面显示器灯', '/media/covers/201.svg', CAST('["/media/covers/201.svg","/media/covers/366.svg","/media/covers/1.svg","/media/covers/24.svg"]' AS JSON), '无频闪，色温 2700–6500K，屏幕挂灯。', 259.00, 0, 410, 'off', '2026-04-02 10:00:00');

INSERT INTO `Cart` (`id`,`userId`,`productId`,`title`,`cover`,`price`,`qty`,`date`) VALUES
(1101, 82001, 1001, '陶瓷滤杯套装', '/media/covers/225.svg', 168.00, 1, '2026-08-20 12:00:00'),
(1102, 82001, 1005, '帆布托特包', '/media/covers/1015.svg', 199.00, 2, '2026-08-21 09:10:00'),
(1103, 38710, 1003, '机械键盘套件', '/media/covers/119.svg', 459.00, 1, '2026-08-22 08:30:00'),
(1104, 82002, 1006, '香薰蜡烛礼盒', '/media/covers/1080.svg', 138.00, 3, '2026-08-19 21:00:00');

INSERT INTO `ShopOrder` (`id`,`userId`,`consignee`,`phone`,`address`,`remark`,`total`,`status`,`date`) VALUES
(1201, 82001, '林晓', '13800001001', '上海市静安区南京西路 100 号 8 楼', '工作日白天可收', 367.00, 'paid', '2026-08-12 11:20:00'),
(1202, 38710, '陈舟', '13800001002', '深圳市南山区科技园路 1 号', '放前台', 459.00, 'shipped', '2026-08-10 16:05:00'),
(1203, 82002, '苏晚', '13800001003', '杭州市西湖区文三路 200 号', NULL, 414.00, 'done', '2026-07-28 09:48:00'),
(1204, 82003, '周衡', '13800001004', '北京市朝阳区工体北路 8 号', '不要电话营销', 799.00, 'pending', '2026-08-22 19:01:00');

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
(1393, 82001, 'chat', '通知', '/media/covers/60.svg', 3, '2026-08-01 10:00:00');

INSERT INTO `Address` (`id`,`userId`,`consignee`,`phone`,`region`,`address`,`tag`,`isDefault`,`date`) VALUES
(1401, 82001, '林晓', '13800001001', '上海市 静安区', '南京西路 100 号 8 楼', '公司', 1, '2026-07-01 10:00:00'),
(1402, 82001, '林晓', '13800001001', '上海市 徐汇区', '淮海中路 200 号 12 栋 3 单元', '家', 0, '2026-07-08 10:00:00'),
(1403, 38710, '陈舟', '13800001002', '广东省 深圳市 南山区', '科技园路 1 号', '公司', 1, '2026-07-12 10:00:00'),
(1404, 82002, '苏晚', '13800001003', '浙江省 杭州市 西湖区', '文三路 200 号', '家', 1, '2026-07-18 10:00:00'),
(1405, 82003, '周衡', '13800001004', '北京市 朝阳区', '工体北路 8 号', '家', 1, '2026-08-02 10:00:00');

-- Comment: optional momentId + video/article/blog FKs (Demo table, do not DROP)
ALTER TABLE `Comment` MODIFY `momentId` bigint DEFAULT NULL COMMENT '动态 Moment.id';

SET @db := DATABASE();
SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Comment' AND COLUMN_NAME='videoId'),
    'SELECT 1',
    'ALTER TABLE `Comment` ADD COLUMN `videoId` bigint DEFAULT NULL COMMENT ''视频 Video.id'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Comment' AND COLUMN_NAME='articleId'),
    'SELECT 1',
    'ALTER TABLE `Comment` ADD COLUMN `articleId` bigint DEFAULT NULL COMMENT ''文章 Article.id'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Comment' AND COLUMN_NAME='blogId'),
    'SELECT 1',
    'ALTER TABLE `Comment` ADD COLUMN `blogId` bigint DEFAULT NULL COMMENT ''博客 Blog.id'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Product' AND COLUMN_NAME='pictureList'),
    'SELECT 1',
    'ALTER TABLE `Product` ADD COLUMN `pictureList` json DEFAULT NULL COMMENT ''商品图集'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
UPDATE `Product` SET `pictureList` = CAST('["/media/covers/225.svg","/media/covers/30.svg","/media/covers/42.svg","/media/covers/366.svg"]' AS JSON) WHERE `id` = 1001 AND (`pictureList` IS NULL OR JSON_LENGTH(`pictureList`) < 2 OR CAST(`pictureList` AS CHAR) LIKE '%picsum.photos%');
UPDATE `Product` SET `pictureList` = CAST('["/media/covers/1078.svg","/media/covers/201.svg","/media/covers/101.svg","/media/covers/1067.svg"]' AS JSON) WHERE `id` = 1002 AND (`pictureList` IS NULL OR JSON_LENGTH(`pictureList`) < 2 OR CAST(`pictureList` AS CHAR) LIKE '%picsum.photos%');
UPDATE `Product` SET `pictureList` = CAST('["/media/covers/119.svg","/media/covers/160.svg","/media/covers/180.svg","/media/covers/250.svg","/media/covers/2.svg"]' AS JSON) WHERE `id` = 1003 AND (`pictureList` IS NULL OR JSON_LENGTH(`pictureList`) < 2 OR CAST(`pictureList` AS CHAR) LIKE '%picsum.photos%');
UPDATE `Product` SET `pictureList` = CAST('["/media/covers/29.svg","/media/covers/28.svg","/media/covers/14.svg"]' AS JSON) WHERE `id` = 1004 AND (`pictureList` IS NULL OR JSON_LENGTH(`pictureList`) < 2 OR CAST(`pictureList` AS CHAR) LIKE '%picsum.photos%');
UPDATE `Product` SET `pictureList` = CAST('["/media/covers/1015.svg","/media/covers/1011.svg","/media/covers/103.svg","/media/covers/21.svg"]' AS JSON) WHERE `id` = 1005 AND (`pictureList` IS NULL OR JSON_LENGTH(`pictureList`) < 2 OR CAST(`pictureList` AS CHAR) LIKE '%picsum.photos%');
UPDATE `Product` SET `pictureList` = CAST('["/media/covers/1080.svg","/media/covers/1081.svg","/media/covers/292.svg"]' AS JSON) WHERE `id` = 1006 AND (`pictureList` IS NULL OR JSON_LENGTH(`pictureList`) < 2 OR CAST(`pictureList` AS CHAR) LIKE '%picsum.photos%');
UPDATE `Product` SET `pictureList` = CAST('["/media/covers/3.svg","/media/covers/7.svg","/media/covers/60.svg","/media/covers/96.svg"]' AS JSON) WHERE `id` = 1007 AND (`pictureList` IS NULL OR JSON_LENGTH(`pictureList`) < 2 OR CAST(`pictureList` AS CHAR) LIKE '%picsum.photos%');
UPDATE `Product` SET `pictureList` = CAST('["/media/covers/201.svg","/media/covers/366.svg","/media/covers/1.svg","/media/covers/24.svg"]' AS JSON) WHERE `id` = 1008 AND (`pictureList` IS NULL OR JSON_LENGTH(`pictureList`) < 2 OR CAST(`pictureList` AS CHAR) LIKE '%picsum.photos%');

UPDATE `Request`
SET `structure` = CAST('{"MUST":"content","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON),
    `detail` = 'Create Comment (momentId / videoId / articleId / blogId optional)'
WHERE `tag` = 'Comment' AND `method` = 'POST';

DELETE FROM `Comment` WHERE `id` BETWEEN 91001 AND 91012;
INSERT INTO `Comment` (`id`,`userId`,`toId`,`momentId`,`videoId`,`articleId`,`blogId`,`date`,`content`) VALUES
(91001, 38710, 0, NULL, 801, NULL, NULL, '2026-08-02 11:00:00', '片头音乐和演示素材都够用。'),
(91002, 82002, 0, NULL, 801, NULL, NULL, '2026-08-02 12:20:00', '建议详情页把相关视频做成接下来播放。'),
(91003, 70793, 0, NULL, 803, NULL, NULL, '2026-07-03 09:10:00', 'Sintel 当 16:9 播放器测试正好。'),
(91004, 82001, 0, NULL, NULL, 701, NULL, '2026-08-16 12:30:00', '稳态 usedLlm=false 这点写得很清楚。'),
(91005, 82002, 0, NULL, NULL, 701, NULL, '2026-08-16 14:05:00', '评论和点赞也必须走绑定后的 /apijson，而不是假按钮。'),
(91006, 38710, 0, NULL, NULL, 703, NULL, '2026-08-05 10:00:00', '外键跳转作者详情就是这里该接的。'),
(91007, 82001, 0, NULL, NULL, NULL, 601, '2026-08-15 16:40:00', '绑定一次，后面筛选分页直接 HTTP。');

-- categoryId on content tables (idempotent). Standalone: layout_demo_categories.sql
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

-- Lyrics / captions / long copy (idempotent; same as layout_demo_media_text.sql)
-- Idempotent lyrics / captions / long article bodies for layout demo.
-- Safe to re-run. Also appended from layout_demo_tables.sql.
SET NAMES utf8mb4;
SET @db := DATABASE();
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Music')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Music' AND COLUMN_NAME='lyrics'),
  'ALTER TABLE `Music` ADD COLUMN `lyrics` text COMMENT ''歌词（LRC 或纯文本，公版/CC 曲目）''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Video')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Video' AND COLUMN_NAME='subtitleList'),
  'ALTER TABLE `Video` ADD COLUMN `subtitleList` json DEFAULT NULL COMMENT ''字幕 [{lang,label,url}]，免登录 WebVTT''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Video')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Video' AND COLUMN_NAME='qualityList'),
  'ALTER TABLE `Video` ADD COLUMN `qualityList` json DEFAULT NULL COMMENT ''清晰度 [{label,url}]，同一内容多分辨率''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Notice' AND COLUMN_NAME='content' AND DATA_TYPE='varchar'),
  'ALTER TABLE `Notice` MODIFY `content` text COMMENT ''资讯正文''', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
INSERT INTO `News` (`id`,`userId`,`title`,`headline`,`source`,`author`,`cover`,`content`,`viewCount`,`date`,`categoryId`) VALUES (401, 82001, '城市轨道交通新线今日开通', '早高峰预计分流 12 万人次', '都市日报', '林晓', '/media/covers/1011.svg', '今日凌晨，城市轨道交通15号线一期正式载客。线路北起临江新城、南至空港枢纽，全长约38公里，设站24座，可与2、6、9号线换乘。早高峰最小间隔3分30秒，预计分流中心城约12万人次。运营方称首日列车准点率达到99%。', 19200, '2026-08-22 07:30:00', 1321) ON DUPLICATE KEY UPDATE title=VALUES(title), headline=VALUES(headline), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `News` (`id`,`userId`,`title`,`headline`,`source`,`author`,`cover`,`content`,`viewCount`,`date`,`categoryId`) VALUES (404, 82001, '本地足球队晋级半决赛', '加时赛 2:1 逆转', '体育报', '周衡', '/media/covers/28.svg', '主场加时赛2比1逆转，本地足球队晋级半决赛。第108分钟点球绝杀，看台提前点燃彩带。主教练赛后表示下一轮将对阵卫冕冠军，全队只休息一天，明天上午合练定位球。球迷散场请走东侧通道。', 22300, '2026-08-19 22:10:00', 1324) ON DUPLICATE KEY UPDATE title=VALUES(title), headline=VALUES(headline), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `News` (`id`,`userId`,`title`,`headline`,`source`,`author`,`cover`,`content`,`viewCount`,`date`,`categoryId`) VALUES (405, 82001, '博物馆夜场预约开放', '每周五延长至 21 点', '文化资讯', '韩梅', '/media/covers/1015.svg', '市博物馆宣布每周五延长至21点开放夜场，限流800人，须提前3天预约。特展「丝绸之路」同步对夜场观众开放，讲解耳机在东门领取，闭馆前30分钟停止入场。夜场票与日场票不通用。', 5400, '2026-08-18 09:00:00', 1325) ON DUPLICATE KEY UPDATE title=VALUES(title), headline=VALUES(headline), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `News` (`id`,`userId`,`title`,`headline`,`source`,`author`,`cover`,`content`,`viewCount`,`date`,`categoryId`) VALUES (402, 82001, '开源协议治理进入企业议程', 'API 先行团队开始审计依赖许可证', '技术周刊', '陈舟', '/media/covers/0.svg', '多家公司把SPDX许可证扫描接入持续集成，未声明协议的依赖会被直接阻断合并。法务与工程本周开了联合例会，要求新增开源组件必须附带NOTICE文件，并在变更说明里写清传染性条款风险。API先行团队已把审计报告挂到内部看板，计划在下个迭代清掉高风险包，同时给历史依赖补上例外清单，避免误伤正在线上跑的服务。审计清单会每周更新，过期例外必须重新申请，不能无限期挂着。采购合同也将增加开源交付清单附件，供应商少交一份就不得验收。', 8600, '2026-08-21 11:00:00', 1323) ON DUPLICATE KEY UPDATE title=VALUES(title), headline=VALUES(headline), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `News` (`id`,`userId`,`title`,`headline`,`source`,`author`,`cover`,`content`,`viewCount`,`date`,`categoryId`) VALUES (403, 82001, '台风将于周末登陆东部沿海', '气象台发布橙色预警', '气象台', '苏晚', '/media/covers/1019.svg', '气象台发布台风橙色预警，预计周末登陆东部沿海，登陆时中心风力12级，阵风可达14级。沿海市县将视风雨情况安排停课停工，渔船已陆续回港。应急部门提醒居民提前检查门窗、备好饮水和手电，低洼小区注意转移车辆。公交夜班可能提前收车，具体停运与避险名单将在登陆前12小时公布，请以区县通告为准，不要只看社交平台截图。社区网格员会再上门提醒行动不便的住户。地下室泵闸今晚试运行一次，发现问题立刻报修。', 45100, '2026-08-20 16:45:00', 1326) ON DUPLICATE KEY UPDATE title=VALUES(title), headline=VALUES(headline), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `News` (`id`,`userId`,`title`,`headline`,`source`,`author`,`cover`,`content`,`viewCount`,`date`,`categoryId`) VALUES (406, 82001, '央行宣布降准 0.25 个百分点', '释放长期资金约 5000 亿', '财经早报', '顾深', '/media/covers/20.svg', '央行宣布下调存款准备金率0.25个百分点，预计释放长期资金约5000亿元，将于下周一落地。银行间流动性有望改善，市场对中小银行信贷投放抱有期待。分析人士指出，降准更多是对冲到期工具，不代表宽松转向，企业仍需把资金用在设备和订单上，而不是加杠杆囤货。地方分支行已被要求优先满足制造业和小微的续贷需求。票据利率若明显下行，才能说明资金传到了实体。外贸企业续贷材料请提前准备报关单和订单复印件。', 31800, '2026-08-17 08:20:00', 1322) ON DUPLICATE KEY UPDATE title=VALUES(title), headline=VALUES(headline), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `News` (`id`,`userId`,`title`,`headline`,`source`,`author`,`cover`,`content`,`viewCount`,`date`,`categoryId`) VALUES (407, 82001, '15 号线首日：换乘通道、票价与加车观察', '大学城站安检扩到六条仍短暂排队', '都市日报', '林晓', '/media/covers/1011.svg', '城市轨道交通15号线一期今日开通后，早高峰客流主要集中在临江新城、大学城和空港枢纽三站。记者在大学城站看到，安检通道由四条增到六条，仍有短时排队，工作人员用便携闸机分流出站客流。换乘2号线需走约180米通道，地面用黄色箭头标出「去往空港」和「去往老城」两个方向，减少对向人流对撞。票价与既有线网贯通，起步3元，全程最高7元，通勤月票可直接使用。运营方介绍，首日开行图按平日执行，未另加临时车，目的是先观察实际换乘压力。沿线三所中学已调整校车接驳点，改到C口公交站。周边商户反映，早餐摊位比平时多出两成，但停车位仍然紧张，建议骑行或公交进站。下一阶段，15号线还将与在建的市域铁路在空港站预留换乘厅，预计明年才能打通。市民热线提醒，开通首周请预留比平时多15分钟的进站时间，不要在车门关闭提示后强行上车。开通一周后，运营方会公布分时断面客流，作为是否加车的依据。电子发票可在乘车次日于官方小程序开具。残障电梯在A口和D口各一台，高峰期请听从志愿者疏导。失物招领仍在2号线换乘厅值班台，15号线本站暂不设独立窗口。夜间末班车与2号线对齐，错过需改乘机场巴士。', 8600, '2026-08-22 18:00:00', 1321) ON DUPLICATE KEY UPDATE title=VALUES(title), headline=VALUES(headline), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `News` (`id`,`userId`,`title`,`headline`,`source`,`author`,`cover`,`content`,`viewCount`,`date`,`categoryId`) VALUES (408, 82001, '台风Ⅱ级响应：停课、回港与内涝准备', '名单以区县官网为准', '气象台', '苏晚', '/media/covers/1019.svg', '第18号台风将于周末登陆东部沿海。气象台在例行发布会上给出三条路径，其中概率最高的一条在周六午后擦过河口，周日凌晨减弱为热带风暴。市防汛指挥部已把响应提到Ⅱ级：中小学、幼儿园周六周日停课，建筑工地停止户外作业，景区关闭索道和玻璃栈道。海事部门从昨夜起禁止渔船出港，回港船舶在指定避风锚地集结。供电公司对易涝箱变做了预加固，低洼小区物业接到通知，地下车库坡道要堆沙袋。公交集团准备在风雨最大的6小时里缩短沿海线路，改由地铁和高峰临线接驳。卫健委提醒慢病患者提前配药，不要等风雨天气再去医院。记者走访两个城中村，部分租户仍未看到纸质通知，社区表示会在今晚再发一遍短信和楼道广播。所有停运、停课名单以各区县官网和政务号为准，转发截图前请核对时间戳。台风过境后的前两个潮汐仍可能内涝，不要立刻撤掉沙袋。车损和商铺进水可先拍照备案。学校复课时间另行通知，不要只听家长群口头消息。宠物主人请提前备好笼具，临时安置点不接收未登记犬只。沿海步道和码头即日起关闭，不要赶去拍照。', 12800, '2026-08-20 20:10:00', 1326) ON DUPLICATE KEY UPDATE title=VALUES(title), headline=VALUES(headline), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `News` (`id`,`userId`,`title`,`headline`,`source`,`author`,`cover`,`content`,`viewCount`,`date`,`categoryId`) VALUES (409, 82001, '降准落地后的信贷窗口：额度给谁', '窗口指导优先技改与小微续贷', '财经早报', '顾深', '/media/covers/20.svg', '存款准备金率下调0.25个百分点将于下周一落地，央行有关司局在答记者问时强调，此举主要是保持流动性合理充裕，对冲中期借贷便利到期，并不等于全面放松。商业银行接到的窗口指导是：新增额度优先用于制造业技改、绿色设备和小微续贷，禁止借转贷名义进入楼市和股市。一家城商行信贷经理告诉记者，他们已经把审批时限从平均11天压到7天，但抵押物不足的商户仍要走担保公司。出口企业关心汇率波动，外汇部门表示将继续用逆周期因子平滑单边预期。债券市场早盘利率债收益率下行约3个基点，股票银行板块反应平淡。分析认为，真正要观察的是未来两周票据利率和普惠贷款加权成本，而不是降准当天的指数涨跌。财政部门同期公布，对吸纳就业的小微企业，失业保险稳岗返还将提前到9月拨付，与信贷政策形成组合。若资金仍淤积在银行间，公开市场可能回笼对冲，企业不要按宽松周期已经开始去排产能。各地工信部门会把技改项目清单对接到银行，减少重复尽调。担保费率上限本周也会对小微再降两个千分点，具体以各地公告为准。', 9100, '2026-08-17 16:40:00', 1322) ON DUPLICATE KEY UPDATE title=VALUES(title), headline=VALUES(headline), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `Notice` (`id`,`userId`,`title`,`cover`,`content`,`status`,`date`,`categoryId`) VALUES (501, 82001, '系统维护通知：8 月 24 日 02:00–04:00', '/media/covers/60.svg', '8月24日02:00至04:00升级数据库索引。窗口期内写入接口返回503，列表与详情只读查询不受影响。请把批量导入改到05:00之后，值班号已同步到运维群。不要在窗口期重试写脚本。', 'published', '2026-08-21 10:00:00', 1331) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), status=VALUES(status), categoryId=VALUES(categoryId);
INSERT INTO `Notice` (`id`,`userId`,`title`,`cover`,`content`,`status`,`date`,`categoryId`) VALUES (502, 82001, '办公区门禁升级完成', '/media/covers/180.svg', '办公区门禁升级完成，进出需工卡加人脸双因子。访客请提前在前台登记，临时码当天有效。如识别失败，走西侧人工通道，不要尾随进门。快递停在一层柜，骑手不得上楼。', 'published', '2026-08-20 14:20:00', 1332) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), status=VALUES(status), categoryId=VALUES(categoryId);
INSERT INTO `Notice` (`id`,`userId`,`title`,`cover`,`content`,`status`,`date`,`categoryId`) VALUES (505, 82001, '食堂本周菜单调整', '/media/covers/292.svg', '食堂本周菜单调整：周三增加素食窗口，周五供应牛肉面。过敏原见各窗口告示牌。请自带杯具打汤，一次性碗筷按份计费，剩饭请倒进回收桶。高峰请错峰十分钟。', 'published', '2026-08-11 08:40:00', 1334) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), status=VALUES(status), categoryId=VALUES(categoryId);
INSERT INTO `Notice` (`id`,`userId`,`title`,`cover`,`content`,`status`,`date`,`categoryId`) VALUES (503, 82001, 'Q3 团建意向征集', '/media/covers/1016.svg', '第三季度团建开始征集意向，选项为郊外徒步、密室逃脱和湖边野餐。请于本周五下班前在表格中投票，过期按弃权处理。名额按部门人数分配，家属门票需自付。活动当天如遇暴雨，自动改到备用室内场馆，不再另行投票。集合时间与包车座位表将在投票截止后下一个工作日公布，请不要私下换人导致保险名单对不上。逾期报名不再加座。素食和过敏信息请一并填在备注里，后勤按表备餐。', 'published', '2026-08-19 09:15:00', 1333) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), status=VALUES(status), categoryId=VALUES(categoryId);
INSERT INTO `Notice` (`id`,`userId`,`title`,`cover`,`content`,`status`,`date`,`categoryId`) VALUES (504, 82001, '开源贡献奖励办法（试行）', '/media/covers/96.svg', '开源贡献奖励办法进入试行：合并到主仓的PR按复杂度计分，文档与测试补齐后可再加分。季度末按积分兑换周边或调休，封顶两天。抄袭、代提和未经评审强合的记录一律不计分，并会在贡献榜备注。积分只统计主仓和官方插件仓，个人实验仓库不算。有异议可在公示期内向架构组提交说明，逾期视为接受当期结果。调休须在次季度内用完，不能折现。', 'published', '2026-08-12 11:00:00', 1332) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), status=VALUES(status), categoryId=VALUES(categoryId);
INSERT INTO `Notice` (`id`,`userId`,`title`,`cover`,`content`,`status`,`date`,`categoryId`) VALUES (506, 82001, '草稿：年会场地待定', '/media/covers/201.svg', '年会场地仍在两家酒店之间比选，预算表和交通接驳方案本周发出。节目彩排暂定11月，部门请先报节目时长，不要先定灯光舞美。草稿状态仅供内部讨论，对外不要传播候选报价。如需预定住宿，请等场地敲定后再走差旅系统，避免两头占房。主持人候选名单也先放在同一份表格里，方便行政统一对接。供应商询价邮件请抄送行政，不要单独承诺桌数。', 'draft', '2026-08-22 17:00:00', 1333) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), status=VALUES(status), categoryId=VALUES(categoryId);
INSERT INTO `Notice` (`id`,`userId`,`title`,`cover`,`content`,`status`,`date`,`categoryId`) VALUES (507, 82001, '数据库索引升级细则（值班与回滚）', '/media/covers/60.svg', '本次数据库索引升级安排在8月24日02:00至04:00。升级内容包括为Comment、Video、Music三张表补联合索引，以及重建ShopOrder的date字段统计索引。窗口期内所有POST、PUT、DELETE将返回503，并在响应头带Retry-After。GET列表、详情和导出不受影响，但分析接口会暂时关闭，以免扫全表。请各业务在23日下班前把定时导入、对账和爬虫停掉，24日05:00后再启动。值班顺序：02:00至03:00由数据组值守，03:00至04:00由平台组值守，手机保持接通。若主从延迟超过30秒，会自动中止切换并回滚到旧索引，不会强行切写。升级完成后，会在运维群发一条「索引可用」消息，同时把执行计划和慢查询对比贴到文档站。不要在窗口期内用本地脚本重试写接口，以免堆积错误工单。完成后如需核对，请用只读账号查information_schema，不要直接改线上统计表。回滚演练记录放在运维周报附件，审计抽查时要能打开。缓存和搜索索引不必同步重建，等主库稳定后再刷。', 'published', '2026-08-21 16:00:00', 1331) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), status=VALUES(status), categoryId=VALUES(categoryId);
INSERT INTO `Notice` (`id`,`userId`,`title`,`cover`,`content`,`status`,`date`,`categoryId`) VALUES (508, 82001, '开源贡献奖励办法全文（试行）', '/media/covers/96.svg', '开源贡献奖励办法（试行）适用于所有把代码、文档或测试合并进主仓的同事。计分规则：修复缺陷1至3分，新增接口或页面3至8分，重构或性能优化需架构组确认后可到10分。补齐文档、示例和单测各加1分。季度末按积分兑换：20分周边礼包，40分调休一天，70分调休两天，封顶两天，不可累计到下一季度。以下情况不计分：未走评审、代他人提交、复制外部仓库不注明出处、把密钥写进仓库。公示期为季度最后五个工作日，有异议先找直属经理，再提交架构组。积分只统计主仓和官方插件仓。本办法解释权在工程委员会，试行满两个季度后复盘是否写入正式制度。对外宣传请用「试行」字样，不要写成已生效的薪酬政策。积分看板每周五更新，以合并时间为准，不以提交时间为准。跨组协作的PR由两边经理各确认一次，避免重复计分。调休须走人事系统，不能口头抵班。', 'published', '2026-08-12 15:00:00', 1332) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), status=VALUES(status), categoryId=VALUES(categoryId);
INSERT INTO `Notice` (`id`,`userId`,`title`,`cover`,`content`,`status`,`date`,`categoryId`) VALUES (509, 82001, '门禁、访客与外卖通行说明', '/media/covers/180.svg', '办公区门禁已切换为工卡加人脸双因子。本人进出时先刷卡再正视摄像头，戴口罩或逆光失败请走西侧人工通道，不要尾随。访客须由接待人提前在前台登记，临时码当天23:00失效，过闸一次即作废。快递和外卖停在一层柜，员工自行取件，骑手不得上楼。外包同事使用橙色工卡，权限仅覆盖所在项目楼层，周末需单独申请。丢失工卡请当天挂失，补卡工本费20元。监控按法规保存九十天，仅供安保和合规调阅。本通知从发布之日起执行，旧的密码门方案同步停用。如需带领媒体或外部评审进楼，请至少提前一个工作日邮件告知行政。消防通道严禁堆放纸箱。访客离开时接待人负责送出闸机，不得把临时码转发给下一位未登记人员。夜间加班请在前台登记预计离开时间，保安巡楼时好核对。自行车棚也已纳入门禁，旧钥匙本周五作废。', 'published', '2026-08-20 18:00:00', 1332) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), status=VALUES(status), categoryId=VALUES(categoryId);
INSERT INTO `Article` (`id`,`userId`,`title`,`author`,`cover`,`content`,`date`,`categoryId`) VALUES (703, 82002, '智能字段：图片、性别与外键', 'Jan', '/media/covers/177.svg', 'Show设为Auto时，会按字段名和注释推断图片列；sex显示为男女；以Id结尾的外键跳到关联详情。列表里的id数组可以点进单条，也可以用全部打开过滤后的列表页。这些都不改库存里的原始值。', '2026-08-04 10:22:00', 1361) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `Article` (`id`,`userId`,`title`,`author`,`cover`,`content`,`date`,`categoryId`) VALUES (705, 82001, '运营活动页需要的最小字段集', 'Wechat', '/media/covers/1018.svg', '运营活动页最少要有标题、封面、说明、开始结束时间、状态和报名人数。其余字段放到详情里再编辑，避免列表被一长串配置项撑开，筛选也会更好做。报名人数用计数，不要每次打开详情再去数行。', '2026-07-11 16:18:00', 1361) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `Article` (`id`,`userId`,`title`,`author`,`cover`,`content`,`date`,`categoryId`) VALUES (706, 82001, '电商列表为什么要独立购物车页', 'Steve', '/media/covers/292.svg', '商品浏览用commerce布局，结算用独立订单页。同一份Product数据两套模板，购物车不要塞回商品列表，否则筛选和分页会把未结算行一起带上。地址和备注属于订单，不属于商品卡片。', '2026-06-30 12:00:00', 1363) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `Article` (`id`,`userId`,`title`,`author`,`cover`,`content`,`date`,`categoryId`) VALUES (702, 82001, '权限门控：缺 Access 时自动提交 Apply', 'Test User', '/media/covers/48.svg', '编辑和删除先打业务API。若权限不足或Request结构不合法，Demo会自动向Admin提交配置申请，而不是在页面上放审批按钮。Apply的tag由页面标题生成，空格改下划线。等状态变化时再通知，不要轮询刷屏。敏感删除默认走审批，其他写入自动执行并记一笔auto_approved，方便事后对账。不要把密钥写进聊天再让模型去改权限。页面标题改了就要重新生成tag，旧申请不要复用。', '2026-08-09 15:40:00', 1362) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `Article` (`id`,`userId`,`title`,`author`,`cover`,`content`,`date`,`categoryId`) VALUES (704, 82001, '不要把 SQL 交给模型临场拼装', 'Strong', '/media/covers/60.svg', '不要让模型临场拼SQL。可控的是HTTP上的JSON ORM，表级角色和Request.structure仍留在你信任的API层。图表默认分组也不要用主键，部门、状态、日期才分得开。一次成功的调用冻成模板后，稳态筛选分页必须usedLlm为false，由客户端自己拼请求体。浏览器也不要直连8080，会话留在Node代理这一侧。模板里的id必须来自用户点过的行，禁止编造示例主键。', '2026-07-21 09:00:00', 1363) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `Article` (`id`,`userId`,`title`,`author`,`cover`,`content`,`date`,`categoryId`) VALUES (707, 82001, '列表与详情为什么必须是两页', 'Test User', '/media/covers/1015.svg', '列表页和详情页必须是独立页面：标题、surfaceId和保存快照都不能混用。改详情标题会分叉出新页面，旧页保持不动。多表槽位要一起持久化，才能从顶部菜单重新打开。这样回退按钮才有明确的上一页，而不是把列表和表单叠在同一个surface上。筛选条件也不要写进详情快照，以免回来时列表被清空。创建页同样要带create后缀，不能和详情抢同一个tag。', '2026-08-10 19:20:00', 1362) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `Article` (`id`,`userId`,`title`,`author`,`cover`,`content`,`date`,`categoryId`) VALUES (701, 38710, '从文本到结构化请求：A2API 0.1', 'TommyLemon', '/media/covers/0.svg', 'proposeRequest和bindRequest把一次成功的APIJSON调用冻成模板，这是A2API 0.1的核心。聊天里只负责提出意图和确认字段，真正列表、筛选、分页、排序必须usedLlm为false，由客户端按绑定模板重建请求体，再打同源的apijson代理。不要从浏览器直连Java的8080端口，会话cookie要留在Node这一侧。权限不足时不要改成「先问模型怎么办」，而是走Admin的Apply：把页面标题收成tag，结构写进Request，等审批后再reload。图表字段池来自所有查询表的字段，而不是当前表格可见列。性别、图片、外键这些智能显示属于UI层，不改变存库值。这样Agent才能被限制在你已经批准过的信封里，而不是每次点击都重新发明接口。把一次对话变成可重复的HTTP，比把模型留在热路径上更安全，也更便宜。绑定失败时把原始响应留下，方便对照MUST和REFUSE，不要只丢一句失败。UI语言和AI回复语言分开设置，不要把界面文案交给模型临场翻译。', '2026-08-16 11:00:00', 1362) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `Article` (`id`,`userId`,`title`,`author`,`cover`,`content`,`date`,`categoryId`) VALUES (708, 82001, 'Apply 门控怎么和页面 tag 对齐', 'Test User', '/media/covers/48.svg', '缺Access或Request不合法时，Demo会自动提交Apply，页面上不出现通过或驳回。这是刻意的：审批只属于Admin。tag从页面标题生成，例如Moment Detail变成moment_detail，重试写入时也要带上同一个tag。Apply通过后需要TYPE_RELOAD等于4并调用reload，客户端只在状态变化时提示，避免定时器刷出一堆相同通知。编辑删除一律先打业务API，只有权限、参数或结构错误才升级成配置申请。自动通过的普通写入仍要落auto_approved审计行，方便和人工审批对账。不要把敏感删除改成前端假成功。这一套门控让演示环境可以大胆点按钮，同时不把生产策略写进聊天提示词。Apply的结构里Verify要放在前面，电话和邮箱校验码才能先于User写入。页面标题改了就要重新生成tag，不要沿用旧申请。多表详情的Relate也要写进structure，用vice字段和IN或Contains表达，而不是让模型下次再猜一遍。', '2026-08-09 18:00:00', 1362) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `Article` (`id`,`userId`,`title`,`author`,`cover`,`content`,`date`,`categoryId`) VALUES (709, 82012, 'Access 与 Request：到底约束什么', 'Steve', '/media/covers/24.svg', 'APIJSON的Access决定谁能摸哪张表，Request.structure决定一次写入必须带什么字段、拒绝什么字段、以及OWNER如何注入userId。GET对公开表可以UNKNOWN，带tag的GET、以及POST PUT DELETE必须命中Request。会话里的访客身份由服务端注入，客户端不要写死38710这类示例id。列表查询默认不要给主表加过窄的column，详情才按需取列。Comment可以挂momentId、videoId、articleId或blogId，这些外键要用onTable和onField描述，而不是靠截断单词去猜。理解这两张配置表，比再学一套新的权限SDK更接近本项目的真实约束。把结构写对，模型只负责填值，就不会在生产里拼出无法审计的SQL。POST写操作省略userId，由会话注入访客，避免把别人的数据写成自己的。JOIN User时默认带name、tag、head和pictureList，不要只取一个名字字段。', '2026-06-18 08:30:00', 1363) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);
INSERT INTO `Music` (`id`,`userId`,`title`,`artist`,`album`,`cover`,`audioUrl`,`lyrics`,`duration`,`playCount`,`date`,`categoryId`) VALUES (907, 82001, 'Amazing Grace', 'United States Marine Band', 'Public Domain Hymns', '/media/covers/1015.svg', 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/21/Amazing_Grace_US_Marine_Band.ogg/Amazing_Grace_US_Marine_Band.ogg.mp3', '[ti:Amazing Grace]
[ar:United States Marine Band]
[00:29.46]Amazing Grace, how sweet the sound
[00:29.46]奇异恩典，何等甘甜
[00:39.54]That saved a wretch like me
[00:39.54]我罪已得赦免
[00:50.41]I once was lost, but now am found
[00:50.41]前我迷失，今被寻回
[01:01.53]Was blind, but now I see
[01:01.53]瞎眼今得看见
[01:34.22]T''was Grace that taught my heart to fear
[01:34.22]如此恩典，使我敬畏
[01:43.30]And Grace, my fears relieved
[01:43.30]使我心得安慰
[01:52.23]How precious did that Grace appear
[01:52.23]初信之时，即蒙恩惠
[02:01.82]The hour I first believed
[02:01.82]真是何等宝贵
[02:31.50]Through many dangers, toils and snares
[02:31.50]许多危险试炼网罗
[02:40.86]I have already come
[02:40.86]我已安然经过
[02:53.71]T''is Grace that brought me safe thus far
[02:53.71]靠主恩典，安全度过
[03:04.19]And Grace will lead me home
[03:04.19]使我归回天家', 234, 42000, '2026-08-08 12:00:00', 1313) ON DUPLICATE KEY UPDATE lyrics=VALUES(lyrics), audioUrl=VALUES(audioUrl), title=VALUES(title), cover=VALUES(cover), categoryId=VALUES(categoryId);
INSERT INTO `Music` (`id`,`userId`,`title`,`artist`,`album`,`cover`,`audioUrl`,`lyrics`,`duration`,`playCount`,`date`,`categoryId`) VALUES (908, 38710, 'Amazing Grace (1922)', 'Original Sacred Harp Choir', 'Library of Congress', '/media/covers/1016.svg', 'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f2/Amazing_grace_1922.ogg/Amazing_grace_1922.ogg.mp3', '[ti:Amazing Grace]
[ar:Original Sacred Harp Choir]
[00:04.00]Amazing grace, how sweet the sound
[00:04.00]奇异恩典，何等甘甜
[00:14.00]That saved a wretch like me
[00:14.00]我罪已得赦免
[00:24.00]I once was lost, but now am found
[00:24.00]前我迷失，今被寻回
[00:34.00]Was blind, but now I see
[00:34.00]瞎眼今得看见
[00:50.00]The Lord has promised good to me
[00:50.00]主应许恩惠与我
[01:00.00]His word my hope secures
[01:00.00]其言是我盼望
[01:12.00]He will my shield and portion be
[01:12.00]他是我的盾牌产业
[01:24.00]As long as life endures
[01:24.00]一生一世不忘', 120, 18000, '2026-08-08 12:10:00', 1313) ON DUPLICATE KEY UPDATE lyrics=VALUES(lyrics), audioUrl=VALUES(audioUrl), title=VALUES(title), cover=VALUES(cover), categoryId=VALUES(categoryId);
INSERT INTO `Music` (`id`,`userId`,`title`,`artist`,`album`,`cover`,`audioUrl`,`lyrics`,`duration`,`playCount`,`date`,`categoryId`) VALUES (909, 82002, 'Auld Lang Syne', 'U.S. Navy Band', 'Ceremonial Music', '/media/covers/1018.svg', 'https://upload.wikimedia.org/wikipedia/commons/transcoded/7/74/Auld_Lang_Syne_-_U.S._Navy_Band.ogg/Auld_Lang_Syne_-_U.S._Navy_Band.ogg.mp3', '[ti:Auld Lang Syne]
[ar:U.S. Navy Band]
[00:04.00]Should auld acquaintance be forgot
[00:04.00]怎能忘记旧日朋友
[00:12.00]And never brought to mind
[00:12.00]心中能不怀想
[00:20.00]Should auld acquaintance be forgot
[00:20.00]旧日朋友岂能相忘
[00:28.00]And auld lang syne
[00:28.00]友谊地久天长
[00:36.00]For auld lang syne, my dear
[00:36.00]友谊万岁，友谊万岁
[00:44.00]For auld lang syne
[00:44.00]举杯痛饮，同声歌唱
[00:52.00]We''ll take a cup of kindness yet
[00:52.00]让我们来举杯畅饮
[01:00.00]For auld lang syne
[01:00.00]友谊地久天长', 64, 26000, '2026-08-08 12:20:00', 1311) ON DUPLICATE KEY UPDATE lyrics=VALUES(lyrics), audioUrl=VALUES(audioUrl), title=VALUES(title), cover=VALUES(cover), categoryId=VALUES(categoryId);
INSERT INTO `Music` (`id`,`userId`,`title`,`artist`,`album`,`cover`,`audioUrl`,`lyrics`,`duration`,`playCount`,`date`,`categoryId`) VALUES (910, 82001, 'Oh! Susanna', 'United States Navy Band', 'American Folk', '/media/covers/1080.svg', 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c3/Oh_Susanna.ogg/Oh_Susanna.ogg.mp3', '[ti:Oh! Susanna]
[ar:United States Navy Band]
[00:12.00]I come from Alabama with a banjo on my knee
[00:12.00]我从阿拉巴马来，膝上搁着班卓琴
[00:28.00]I''m going to Louisiana, my true love for to see
[00:28.00]我要去路易斯安那，去看我的爱人
[00:44.00]Oh! Susanna, oh don''t you cry for me
[00:44.00]哦苏珊娜，你不要为我哭泣
[01:00.00]For I come from Alabama with a banjo on my knee
[01:00.00]我从阿拉巴马来，膝上搁着班卓琴
[01:28.00]It rained all night the day I left, the weather it was dry
[01:28.00]动身那夜大雨下个不停，天却还是干的
[01:48.00]The sun so hot I froze to death, Susanna, don''t you cry
[01:48.00]太阳很热我却冻僵，苏珊娜你别哭
[02:08.00]Oh! Susanna, oh don''t you cry for me
[02:08.00]哦苏珊娜，你不要为我哭泣
[02:28.00]For I come from Alabama with a banjo on my knee
[02:28.00]我从阿拉巴马来，膝上搁着班卓琴
[03:00.00]I had a dream the other night, when everything was still
[03:00.00]那天夜里万籁俱寂，我做了一个梦
[03:20.00]I thought I saw Susanna dear, a-coming down the hill
[03:20.00]仿佛看见亲爱的苏珊娜，从山坡上走来', 233, 31000, '2026-08-08 12:30:00', 1315) ON DUPLICATE KEY UPDATE lyrics=VALUES(lyrics), audioUrl=VALUES(audioUrl), title=VALUES(title), cover=VALUES(cover), categoryId=VALUES(categoryId);
INSERT INTO `Music` (`id`,`userId`,`title`,`artist`,`album`,`cover`,`audioUrl`,`lyrics`,`duration`,`playCount`,`date`,`categoryId`) VALUES (911, 82003, 'Twinkle Twinkle Little Star', 'John Casale', 'Nursery (CC BY-SA)', '/media/covers/1025.svg', 'https://upload.wikimedia.org/wikipedia/commons/transcoded/9/91/Twinkle_Twinkle_Little_Star.ogg/Twinkle_Twinkle_Little_Star.ogg.mp3', '[ti:Twinkle Twinkle Little Star]
[ar:John Casale]
[00:02.00]Twinkle, twinkle, little star
[00:02.00]一闪一闪小星星
[00:08.00]How I wonder what you are
[00:08.00]我想知道你是谁
[00:14.00]Up above the world so high
[00:14.00]高高挂在天空里
[00:20.00]Like a diamond in the sky
[00:20.00]好像钻石放光明
[00:26.00]Twinkle, twinkle, little star
[00:26.00]一闪一闪小星星
[00:32.00]How I wonder what you are
[00:32.00]我想知道你是谁', 44, 15000, '2026-08-08 12:40:00', 1313) ON DUPLICATE KEY UPDATE lyrics=VALUES(lyrics), audioUrl=VALUES(audioUrl), title=VALUES(title), cover=VALUES(cover), categoryId=VALUES(categoryId);
INSERT INTO `Music` (`id`,`userId`,`title`,`artist`,`album`,`cover`,`audioUrl`,`lyrics`,`duration`,`playCount`,`date`,`categoryId`) VALUES (912, 70793, 'America the Beautiful', 'United States Navy Band', 'Ceremonial Vocals', '/media/covers/1043.svg', 'https://upload.wikimedia.org/wikipedia/commons/transcoded/0/0e/America_the_Beautiful_%28male_vocalist%29_-_United_States_Navy_Band.opus/America_the_Beautiful_%28male_vocalist%29_-_United_States_Navy_Band.opus.mp3', '[ti:America the Beautiful]
[ar:United States Navy Band]
[00:10.00]O beautiful for spacious skies
[00:10.00]啊，美丽的广阔天空
[00:22.00]For amber waves of grain
[00:22.00]琥珀色的麦浪
[00:34.00]For purple mountain majesties
[00:34.00]紫色山峦何等壮丽
[00:46.00]Above the fruited plain
[00:46.00]俯瞰果实累累的平原
[01:00.00]America! America!
[01:00.00]美利坚！美利坚！
[01:12.00]God shed his grace on thee
[01:12.00]愿恩惠降于你
[01:28.00]And crown thy good with brotherhood
[01:28.00]以手足情谊加冕良善
[01:46.00]From sea to shining sea
[01:46.00]从这片海到那片海
[02:10.00]O beautiful for pilgrim feet
[02:10.00]朝圣者的脚步多么坚定
[02:28.00]Whose stern, impassioned stress
[02:28.00]热情而严峻的步伐
[02:46.00]A thoroughfare for freedom beat
[02:46.00]踏出一条自由大道
[03:04.00]Across the wilderness
[03:04.00]穿过荒野向前', 226, 22000, '2026-08-08 12:50:00', 1311) ON DUPLICATE KEY UPDATE lyrics=VALUES(lyrics), audioUrl=VALUES(audioUrl), title=VALUES(title), cover=VALUES(cover), categoryId=VALUES(categoryId);
UPDATE `Video` SET `subtitleList` = CAST('[{"lang":"en","label":"English","url":"/media/captions/sintel.en.vtt"},{"lang":"zh","label":"中文","url":"/media/captions/sintel.zh.vtt"}]' AS JSON), `qualityList` = CAST('[{"label":"480P","url":"https://media.w3.org/2010/05/sintel/trailer.mp4"},{"label":"720P","url":"https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4"},{"label":"1080P","url":"https://download.blender.org/durian/trailer/sintel_trailer-1080p.mp4"},{"label":"2K","url":"https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.1440p.webm"},{"label":"4K","url":"https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.2160p.webm"}]' AS JSON) WHERE `id` = 801;
UPDATE `Video` SET `subtitleList` = CAST('[{"lang":"en","label":"English","url":"/media/captions/bunny.en.vtt"},{"lang":"zh","label":"中文","url":"/media/captions/bunny.zh.vtt"}]' AS JSON), `qualityList` = CAST('[{"label":"480P","url":"https://media.w3.org/2010/05/bunny/trailer.mp4"},{"label":"720P","url":"https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4"},{"label":"1080P","url":"https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4"},{"label":"2K","url":"https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.1440p.webm"},{"label":"4K","url":"https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.2160p.webm"}]' AS JSON) WHERE `id` = 802;
UPDATE `Video` SET `subtitleList` = CAST('[{"lang":"en","label":"English","url":"/media/captions/oceans.en.vtt"},{"lang":"zh","label":"中文","url":"/media/captions/oceans.zh.vtt"}]' AS JSON), `qualityList` = CAST('[{"label":"720P","url":"https://vjs.zencdn.net/v/oceans.mp4"}]' AS JSON) WHERE `id` = 803;
UPDATE `Video` SET `subtitleList` = CAST('[{"lang":"en","label":"English","url":"/media/captions/flower.en.vtt"},{"lang":"zh","label":"中文","url":"/media/captions/flower.zh.vtt"}]' AS JSON), `qualityList` = CAST('[{"label":"480P","url":"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"}]' AS JSON) WHERE `id` = 804;
UPDATE `Video` SET `subtitleList` = CAST('[{"lang":"en","label":"English","url":"/media/captions/movie.en.vtt"},{"lang":"zh","label":"中文","url":"/media/captions/movie.zh.vtt"}]' AS JSON), `qualityList` = CAST('[{"label":"480P","url":"https://media.w3.org/2010/05/video/movie_300.mp4"}]' AS JSON) WHERE `id` = 805;
UPDATE `Video` SET `subtitleList` = CAST('[{"lang":"en","label":"English","url":"/media/captions/rabbit.en.vtt"},{"lang":"zh","label":"中文","url":"/media/captions/rabbit.zh.vtt"}]' AS JSON), `qualityList` = CAST('[{"label":"480P","url":"https://mdn.github.io/learning-area/html/multimedia-and-embedding/video-and-audio-content/rabbit320.mp4"}]' AS JSON) WHERE `id` = 806;
INSERT INTO `Video` (`id`,`userId`,`title`,`author`,`cover`,`videoUrl`,`subtitleList`,`qualityList`,`duration`,`playCount`,`date`,`categoryId`) VALUES
(807, 82001, 'Big Buck Bunny 10s', 'Blender Foundation', 'https://media.w3.org/2010/05/bunny/poster.png', 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4', CAST('[{"lang":"en","label":"English","url":"/media/captions/bbb10.en.vtt"},{"lang":"zh","label":"中文","url":"/media/captions/bbb10.zh.vtt"}]' AS JSON), CAST('[{"label":"480P","url":"https://media.w3.org/2010/05/bunny/trailer.mp4"},{"label":"720P","url":"https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4"},{"label":"1080P","url":"https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4"},{"label":"2K","url":"https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.1440p.webm"},{"label":"4K","url":"https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.2160p.webm"}]' AS JSON), 10, 6400, '2026-08-16 10:00:00', 1346),
(808, 38710, 'Sintel Short (captions)', 'Blender Foundation / MDN', 'https://media.w3.org/2010/05/sintel/poster.png', 'https://media.w3.org/2010/05/sintel/trailer.mp4', CAST('[{"lang":"en","label":"English","url":"/media/captions/sintel.en.vtt"},{"lang":"zh","label":"中文","url":"/media/captions/sintel.zh.vtt"}]' AS JSON), CAST('[{"label":"480P","url":"https://media.w3.org/2010/05/sintel/trailer.mp4"},{"label":"720P","url":"https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4"},{"label":"1080P","url":"https://download.blender.org/durian/trailer/sintel_trailer-1080p.mp4"},{"label":"2K","url":"https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.1440p.webm"},{"label":"4K","url":"https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.2160p.webm"}]' AS JSON), 52, 8800, '2026-08-16 11:00:00', 1346)
ON DUPLICATE KEY UPDATE subtitleList=VALUES(subtitleList), qualityList=VALUES(qualityList), videoUrl=VALUES(videoUrl), cover=VALUES(cover);
