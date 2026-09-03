-- Idempotent Page table + Access/Request for saved layout sync.
-- Safe to re-run. Used by POST /api/ensure-layout-pages.
-- Stores local saved-page layout + snapshot JSON per logged-in user.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `Page` (
  `id` bigint NOT NULL COMMENT '主键',
  `userId` bigint NOT NULL COMMENT '创建人 User.id',
  `pageKey` varchar(80) NOT NULL COMMENT '本地页面 id',
  `title` varchar(160) NOT NULL COMMENT '页面标题',
  `layoutApp` varchar(40) DEFAULT NULL COMMENT '布局应用',
  `layoutPage` varchar(40) DEFAULT NULL COMMENT '布局页面',
  `snapshot` mediumtext COMMENT '最新版本 JSON',
  `versions` mediumtext COMMENT '全部版本 JSON',
  `thumb` varchar(500) DEFAULT NULL COMMENT '预览图 URL',
  `contentHash` varchar(80) DEFAULT NULL COMMENT '内容指纹',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_page` (`userId`, `pageKey`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='已保存页面布局与配置';

DELETE FROM `Access` WHERE `id` = 64 OR `alias` = 'Page' OR `name` = 'Page';
INSERT INTO `Access` (`id`, `debug`, `schema`, `name`, `alias`, `get`, `head`, `gets`, `heads`, `post`, `put`, `delete`, `date`, `detail`)
VALUES
(64, 0, NULL, 'Page', 'Page',
 '["LOGIN", "OWNER", "ADMIN"]',
 '["LOGIN", "OWNER", "ADMIN"]',
 '["LOGIN", "OWNER", "ADMIN"]',
 '["LOGIN", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '已保存页面布局与配置');

DELETE FROM `Request` WHERE `id` BETWEEN 9105140 AND 9105142 OR (`tag` = 'Page' AND `method` IN ('POST', 'PUT', 'DELETE'));
INSERT INTO `Request` (`id`, `debug`, `version`, `method`, `tag`, `structure`, `detail`, `date`) VALUES
(9105140, 0, 1, 'POST', 'Page', CAST('{"MUST":"pageKey,title","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Page', NOW()),
(9105141, 0, 1, 'PUT', 'Page', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Page', NOW()),
(9105142, 0, 1, 'DELETE', 'Page', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Page', NOW());
