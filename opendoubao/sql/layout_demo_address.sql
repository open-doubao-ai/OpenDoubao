-- Idempotent Address (shipping) table + Access/Request + seed.
-- Safe to re-run. Used by POST /api/ensure-layout-address.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `Address` (
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

INSERT INTO `Address` (`id`,`userId`,`consignee`,`phone`,`region`,`address`,`tag`,`isDefault`,`date`) VALUES
(1401, 82001, '林晓', '13800001001', '上海市 静安区', '南京西路 100 号 8 楼', '公司', 1, '2026-07-01 10:00:00'),
(1402, 82001, '林晓', '13800001001', '上海市 徐汇区', '淮海中路 200 号 12 栋 3 单元', '家', 0, '2026-07-08 10:00:00'),
(1403, 38710, '陈舟', '13800001002', '广东省 深圳市 南山区', '科技园路 1 号', '公司', 1, '2026-07-12 10:00:00'),
(1404, 82002, '苏晚', '13800001003', '浙江省 杭州市 西湖区', '文三路 200 号', '家', 1, '2026-07-18 10:00:00'),
(1405, 82003, '周衡', '13800001004', '北京市 朝阳区', '工体北路 8 号', '家', 1, '2026-08-02 10:00:00')
ON DUPLICATE KEY UPDATE
  `consignee` = VALUES(`consignee`),
  `phone` = VALUES(`phone`),
  `region` = VALUES(`region`),
  `address` = VALUES(`address`),
  `tag` = VALUES(`tag`),
  `isDefault` = VALUES(`isDefault`);

DELETE FROM `Access` WHERE `id` = 63 OR `alias` = 'Address' OR `name` = 'Address';
INSERT INTO `Access` (`id`, `debug`, `schema`, `name`, `alias`, `get`, `head`, `gets`, `heads`, `post`, `put`, `delete`, `date`, `detail`)
VALUES
(63, 0, NULL, 'Address', 'Address',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["UNKNOWN", "LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["LOGIN", "CONTACT", "CIRCLE", "OWNER", "ADMIN"]',
 '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]', '["OWNER", "ADMIN"]',
 NOW(), '收件地址');

DELETE FROM `Request` WHERE `id` BETWEEN 9105137 AND 9105139 OR (`tag` = 'Address' AND `method` IN ('POST', 'PUT', 'DELETE'));
INSERT INTO `Request` (`id`, `debug`, `version`, `method`, `tag`, `structure`, `detail`, `date`) VALUES
(9105137, 0, 1, 'POST', 'Address', CAST('{"MUST":"consignee,phone,address","REFUSE":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Create Address', NOW()),
(9105138, 0, 1, 'PUT', 'Address', CAST('{"MUST":"id","REFUSE":"userId,date","INSERT":{"@role":"OWNER"}}' AS JSON), 'Update Address', NOW()),
(9105139, 0, 1, 'DELETE', 'Address', CAST('{"MUST":"id","INSERT":{"@role":"OWNER"}}' AS JSON), 'Delete Address', NOW());
