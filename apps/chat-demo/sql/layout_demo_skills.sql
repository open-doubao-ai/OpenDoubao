-- Scene skills (query / match / upload). Safe to re-run.
--   mysql -h127.0.0.1 -P3306 -uroot -papijson sys < apps/chat-demo/sql/layout_demo_skills.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `Skill` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '上传人 User.id',
  `name` varchar(40) NOT NULL COMMENT '场景代码：education/commerce/…',
  `title` varchar(40) NOT NULL COMMENT '中文名（四字）',
  `titleEn` varchar(80) DEFAULT NULL COMMENT '英文名',
  `tableName` varchar(40) NOT NULL COMMENT '主表',
  `family` varchar(20) NOT NULL DEFAULT 'local' COMMENT '皮肤族：news/article/local/commerce/…',
  `tokens` json DEFAULT NULL COMMENT '推断词 JSON 数组',
  `description` varchar(500) DEFAULT NULL COMMENT '何时使用',
  `url` varchar(400) DEFAULT NULL COMMENT '正文文件 URL，如 /skills/education.md',
  `body` text COMMENT '已废弃：正文改存文件，库里只留 url',
  `version` int NOT NULL DEFAULT 1 COMMENT '版本',
  `status` varchar(20) NOT NULL DEFAULT 'online' COMMENT 'online/draft',
  `cover` varchar(400) DEFAULT NULL COMMENT '封面',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新日期',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='场景技能（库里只存 URL，正文在文件）';

SET @skill_url_ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `Skill` ADD COLUMN `url` varchar(400) DEFAULT NULL COMMENT ''正文文件 URL'' AFTER `description`',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Skill' AND COLUMN_NAME = 'url'
);
PREPARE skill_url_stmt FROM @skill_url_ddl;
EXECUTE skill_url_stmt;
DEALLOCATE PREPARE skill_url_stmt;

INSERT INTO `Skill` (`id`,`userId`,`name`,`title`,`titleEn`,`tableName`,`family`,`tokens`,`description`,`url`,`body`,`version`,`status`,`cover`,`date`) VALUES
(4001, 82001, 'data', '数据管理', 'Data admin', 'Employee', 'data', '["employee","staff","员工","数据管理"]', '花名册、内部表、电子表格式增删改查。', '/skills/data.md', NULL, 1, 'online', NULL, NOW()),
(4002, 82001, 'commerce', '电商购物', 'Shopping', 'Product', 'commerce', '["product","goods","sku","商品","电商购物"]', '商品、购物车、订单、地址。', '/skills/commerce.md', NULL, 1, 'online', NULL, NOW()),
(4003, 82001, 'video', '视频影像', 'Video', 'Video', 'video', '["video","film","vod","视频","视频影像"]', '视频目录、播放、频道。', '/skills/video.md', NULL, 1, 'online', NULL, NOW()),
(4004, 82001, 'music', '音乐歌曲', 'Music', 'Music', 'music', '["music","song","track","音乐","音乐歌曲"]', '歌曲、专辑、歌单目录。', '/skills/music.md', NULL, 1, 'online', NULL, NOW()),
(4005, 82001, 'news', '新闻资讯', 'News', 'News', 'news', '["news","headline","新闻","新闻资讯"]', '新闻稿件、栏目、阅读数。', '/skills/news.md', NULL, 1, 'online', NULL, NOW()),
(4006, 82001, 'info', '资讯公告', 'Notices', 'Notice', 'news', '["notice","bulletin","资讯公告","公告"]', '公告、制度、内部资讯。', '/skills/info.md', NULL, 1, 'online', NULL, NOW()),
(4007, 82001, 'blog', '博客日志', 'Blog', 'Blog', 'article', '["blog","博客","博客日志"]', '个人博客、随笔。', '/skills/blog.md', NULL, 1, 'online', NULL, NOW()),
(4008, 82001, 'article', '文章专栏', 'Articles', 'Article', 'article', '["article","essay","文章","文章专栏"]', '专栏文章、教程。', '/skills/article.md', NULL, 1, 'online', NULL, NOW()),
(4009, 82001, 'books', '图书阅读', 'Books', 'Book', 'article', '["book","ebook","图书","图书阅读"]', '书目、简介、出版社。', '/skills/books.md', NULL, 1, 'online', NULL, NOW()),
(4010, 82001, 'comics', '漫画阅读', 'Comics', 'Comic', 'article', '["comic","manga","漫画","漫画阅读"]', '漫画作品与话次。', '/skills/comics.md', NULL, 1, 'online', NULL, NOW()),
(4011, 82001, 'social', '社交动态', 'Social feed', 'Moment', 'social', '["moment","feed","动态","朋友圈","社交动态"]', '动态、点赞、评论。', '/skills/social.md', NULL, 1, 'online', NULL, NOW()),
(4012, 82001, 'chat', '即时通讯', 'Messaging', 'Message', 'chat', '["message","chat","聊天","即时通讯","会话"]', '会话与消息落库。', '/skills/chat.md', NULL, 1, 'online', NULL, NOW()),
(4013, 82001, 'campaign', '运营活动', 'Campaigns', 'Activity', 'local', '["activity","campaign","活动","运营活动","促销"]', '活动报名、运营配置。', '/skills/campaign.md', NULL, 1, 'online', NULL, NOW()),
(4014, 82001, 'education', '教育学习', 'Learning', 'Course', 'article', '["course","lesson","课程","教育学习","网课"]', '课程目录、课时、讲师。', '/skills/education.md', NULL, 1, 'online', NULL, NOW()),
(4015, 82001, 'office', '办公效率', 'Office', 'Note', 'article', '["note","notebook","todolist","办公效率","待办","笔记"]', '笔记、待办、纪要。', '/skills/office.md', NULL, 1, 'online', NULL, NOW()),
(4016, 82001, 'lifestyle', '本地生活', 'Local life', 'Local', 'local', '["local","localservice","本地生活","到家","到店"]', '到家到店服务目录。', '/skills/lifestyle.md', NULL, 1, 'online', NULL, NOW()),
(4017, 82001, 'food', '餐饮美食', 'Food', 'Recipe', 'local', '["recipe","dish","菜谱","餐饮美食","美食"]', '菜谱、探店、餐饮内容。', '/skills/food.md', NULL, 1, 'online', NULL, NOW()),
(4018, 82001, 'travel', '旅游出行', 'Travel', 'Trip', 'local', '["trip","hotel","旅游","旅游出行","行程"]', '行程、攻略、民宿目录。', '/skills/travel.md', NULL, 1, 'online', NULL, NOW()),
(4019, 82001, 'sports', '体育资讯', 'Sports', 'Sport', 'news', '["sport","match","league","体育","体育资讯","赛事"]', '赛事资讯、积分与球迷内容。', '/skills/sports.md', NULL, 1, 'online', NULL, NOW()),
(4020, 82001, 'parenting', '母婴育儿', 'Parenting', 'Baby', 'local', '["baby","parenting","母婴","母婴育儿","育儿"]', '月龄内容、育儿指南。', '/skills/parenting.md', NULL, 1, 'online', NULL, NOW()),
(4021, 82001, 'health', '健康运动', 'Fitness', 'Workout', 'local', '["workout","fitness","健康运动","健身"]', '训练计划、打卡。', '/skills/health.md', NULL, 1, 'online', NULL, NOW()),
(4022, 82001, 'auto', '汽车服务', 'Auto', 'Vehicle', 'local', '["vehicle","carinfo","汽车","汽车服务","车型"]', '车讯、保养、驾考内容。', '/skills/auto.md', NULL, 1, 'online', NULL, NOW()),
(4023, 82001, 'jobs', '招聘求职', 'Jobs', 'Job', 'local', '["job","recruit","招聘","招聘求职","职位"]', '职位与招聘方。', '/skills/jobs.md', NULL, 1, 'online', NULL, NOW()),
(4024, 82001, 'housing', '房产家居', 'Housing', 'House', 'local', '["house","estate","房产","房产家居","房源"]', '房源、装修、家居。', '/skills/housing.md', NULL, 1, 'online', NULL, NOW()),
(4025, 82001, 'beauty', '美业预约', 'Beauty', 'Beauty', 'local', '["beauty","salon","美业","美业预约","美发"]', '美业项目与门店。', '/skills/beauty.md', NULL, 1, 'online', NULL, NOW()),
(4026, 82001, 'photo', '摄影相册', 'Photos', 'Photo', 'local', '["photo","gallery","摄影","摄影相册","相册"]', '作品与图集。', '/skills/photo.md', NULL, 1, 'online', NULL, NOW())
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `titleEn` = VALUES(`titleEn`),
  `tableName` = VALUES(`tableName`),
  `family` = VALUES(`family`),
  `tokens` = VALUES(`tokens`),
  `description` = VALUES(`description`),
  `url` = VALUES(`url`),
  `body` = NULL,
  `status` = VALUES(`status`);

UPDATE `Skill` SET `url` = CONCAT('/skills/', `name`, '.md') WHERE `url` IS NULL OR `url` = '';
UPDATE `Skill` SET `body` = NULL;

DELETE FROM `Access` WHERE `id` = 116 OR `alias` = 'Skill' OR `name` = 'Skill';
INSERT INTO `Access` (`id`, `debug`, `schema`, `name`, `alias`, `get`, `head`, `gets`, `heads`, `post`, `put`, `delete`, `date`, `detail`)
VALUES
(116, 0, NULL, 'Skill', 'Skill',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '场景技能');

DELETE FROM `Request` WHERE `id` BETWEEN 9105246 AND 9105248 OR (`tag` = 'Skill' AND `method` IN ('POST', 'PUT', 'DELETE'));
INSERT INTO `Request` (`id`, `debug`, `version`, `method`, `tag`, `structure`, `detail`, `date`) VALUES
(9105246, 0, 1, 'POST', 'Skill', CAST('{"MUST":"name,title,tableName","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Skill', NOW()),
(9105247, 0, 1, 'PUT', 'Skill', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Skill', NOW()),
(9105248, 0, 1, 'DELETE', 'Skill', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Skill', NOW());
