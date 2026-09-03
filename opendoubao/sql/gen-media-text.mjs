import { writeFileSync } from "node:fs";

const esc = (s) =>
  String(s).replace(/\\/g, "\\\\").replace(/'/g, "''").replace(/\r\n/g, "\n");

const count = (s) => [...s.replace(/\n/g, "")].length;

const caps = (name) =>
  JSON.stringify([
    { lang: "en", label: "English", url: `/media/captions/${name}.en.vtt` },
    { lang: "zh", label: "中文", url: `/media/captions/${name}.zh.vtt` },
  ]);

const news = [
  [
    401,
    100,
    "城市轨道交通新线今日开通",
    "早高峰预计分流 12 万人次",
    "都市日报",
    "林晓",
    "/media/covers/1011.svg",
    19200,
    "2026-08-22 07:30:00",
    1321,
    "今日凌晨，城市轨道交通15号线一期正式载客。线路北起临江新城、南至空港枢纽，全长约38公里，设站24座，可与2、6、9号线换乘。早高峰最小间隔3分30秒，预计分流中心城约12万人次。运营方称首日列车准点率达到99%。",
  ],
  [
    404,
    100,
    "本地足球队晋级半决赛",
    "加时赛 2:1 逆转",
    "体育报",
    "周衡",
    "/media/covers/28.svg",
    22300,
    "2026-08-19 22:10:00",
    1324,
    "主场加时赛2比1逆转，本地足球队晋级半决赛。第108分钟点球绝杀，看台提前点燃彩带。主教练赛后表示下一轮将对阵卫冕冠军，全队只休息一天，明天上午合练定位球。球迷散场请走东侧通道。",
  ],
  [
    405,
    100,
    "博物馆夜场预约开放",
    "每周五延长至 21 点",
    "文化资讯",
    "韩梅",
    "/media/covers/1015.svg",
    5400,
    "2026-08-18 09:00:00",
    1325,
    "市博物馆宣布每周五延长至21点开放夜场，限流800人，须提前3天预约。特展「丝绸之路」同步对夜场观众开放，讲解耳机在东门领取，闭馆前30分钟停止入场。夜场票与日场票不通用。",
  ],
  [
    402,
    200,
    "开源协议治理进入企业议程",
    "API 先行团队开始审计依赖许可证",
    "技术周刊",
    "陈舟",
    "/media/covers/0.svg",
    8600,
    "2026-08-21 11:00:00",
    1323,
    "多家公司把SPDX许可证扫描接入持续集成，未声明协议的依赖会被直接阻断合并。法务与工程本周开了联合例会，要求新增开源组件必须附带NOTICE文件，并在变更说明里写清传染性条款风险。API先行团队已把审计报告挂到内部看板，计划在下个迭代清掉高风险包，同时给历史依赖补上例外清单，避免误伤正在线上跑的服务。审计清单会每周更新，过期例外必须重新申请，不能无限期挂着。采购合同也将增加开源交付清单附件，供应商少交一份就不得验收。",
  ],
  [
    403,
    200,
    "台风将于周末登陆东部沿海",
    "气象台发布橙色预警",
    "气象台",
    "苏晚",
    "/media/covers/1019.svg",
    45100,
    "2026-08-20 16:45:00",
    1326,
    "气象台发布台风橙色预警，预计周末登陆东部沿海，登陆时中心风力12级，阵风可达14级。沿海市县将视风雨情况安排停课停工，渔船已陆续回港。应急部门提醒居民提前检查门窗、备好饮水和手电，低洼小区注意转移车辆。公交夜班可能提前收车，具体停运与避险名单将在登陆前12小时公布，请以区县通告为准，不要只看社交平台截图。社区网格员会再上门提醒行动不便的住户。地下室泵闸今晚试运行一次，发现问题立刻报修。",
  ],
  [
    406,
    200,
    "央行宣布降准 0.25 个百分点",
    "释放长期资金约 5000 亿",
    "财经早报",
    "顾深",
    "/media/covers/20.svg",
    31800,
    "2026-08-17 08:20:00",
    1322,
    "央行宣布下调存款准备金率0.25个百分点，预计释放长期资金约5000亿元，将于下周一落地。银行间流动性有望改善，市场对中小银行信贷投放抱有期待。分析人士指出，降准更多是对冲到期工具，不代表宽松转向，企业仍需把资金用在设备和订单上，而不是加杠杆囤货。地方分支行已被要求优先满足制造业和小微的续贷需求。票据利率若明显下行，才能说明资金传到了实体。外贸企业续贷材料请提前准备报关单和订单复印件。",
  ],
  [
    407,
    500,
    "15 号线首日：换乘通道、票价与加车观察",
    "大学城站安检扩到六条仍短暂排队",
    "都市日报",
    "林晓",
    "/media/covers/1011.svg",
    8600,
    "2026-08-22 18:00:00",
    1321,
    "城市轨道交通15号线一期今日开通后，早高峰客流主要集中在临江新城、大学城和空港枢纽三站。记者在大学城站看到，安检通道由四条增到六条，仍有短时排队，工作人员用便携闸机分流出站客流。换乘2号线需走约180米通道，地面用黄色箭头标出「去往空港」和「去往老城」两个方向，减少对向人流对撞。票价与既有线网贯通，起步3元，全程最高7元，通勤月票可直接使用。运营方介绍，首日开行图按平日执行，未另加临时车，目的是先观察实际换乘压力。沿线三所中学已调整校车接驳点，改到C口公交站。周边商户反映，早餐摊位比平时多出两成，但停车位仍然紧张，建议骑行或公交进站。下一阶段，15号线还将与在建的市域铁路在空港站预留换乘厅，预计明年才能打通。市民热线提醒，开通首周请预留比平时多15分钟的进站时间，不要在车门关闭提示后强行上车。开通一周后，运营方会公布分时断面客流，作为是否加车的依据。电子发票可在乘车次日于官方小程序开具。残障电梯在A口和D口各一台，高峰期请听从志愿者疏导。失物招领仍在2号线换乘厅值班台，15号线本站暂不设独立窗口。夜间末班车与2号线对齐，错过需改乘机场巴士。",
  ],
  [
    408,
    500,
    "台风Ⅱ级响应：停课、回港与内涝准备",
    "名单以区县官网为准",
    "气象台",
    "苏晚",
    "/media/covers/1019.svg",
    12800,
    "2026-08-20 20:10:00",
    1326,
    "第18号台风将于周末登陆东部沿海。气象台在例行发布会上给出三条路径，其中概率最高的一条在周六午后擦过河口，周日凌晨减弱为热带风暴。市防汛指挥部已把响应提到Ⅱ级：中小学、幼儿园周六周日停课，建筑工地停止户外作业，景区关闭索道和玻璃栈道。海事部门从昨夜起禁止渔船出港，回港船舶在指定避风锚地集结。供电公司对易涝箱变做了预加固，低洼小区物业接到通知，地下车库坡道要堆沙袋。公交集团准备在风雨最大的6小时里缩短沿海线路，改由地铁和高峰临线接驳。卫健委提醒慢病患者提前配药，不要等风雨天气再去医院。记者走访两个城中村，部分租户仍未看到纸质通知，社区表示会在今晚再发一遍短信和楼道广播。所有停运、停课名单以各区县官网和政务号为准，转发截图前请核对时间戳。台风过境后的前两个潮汐仍可能内涝，不要立刻撤掉沙袋。车损和商铺进水可先拍照备案。学校复课时间另行通知，不要只听家长群口头消息。宠物主人请提前备好笼具，临时安置点不接收未登记犬只。沿海步道和码头即日起关闭，不要赶去拍照。",
  ],
  [
    409,
    500,
    "降准落地后的信贷窗口：额度给谁",
    "窗口指导优先技改与小微续贷",
    "财经早报",
    "顾深",
    "/media/covers/20.svg",
    9100,
    "2026-08-17 16:40:00",
    1322,
    "存款准备金率下调0.25个百分点将于下周一落地，央行有关司局在答记者问时强调，此举主要是保持流动性合理充裕，对冲中期借贷便利到期，并不等于全面放松。商业银行接到的窗口指导是：新增额度优先用于制造业技改、绿色设备和小微续贷，禁止借转贷名义进入楼市和股市。一家城商行信贷经理告诉记者，他们已经把审批时限从平均11天压到7天，但抵押物不足的商户仍要走担保公司。出口企业关心汇率波动，外汇部门表示将继续用逆周期因子平滑单边预期。债券市场早盘利率债收益率下行约3个基点，股票银行板块反应平淡。分析认为，真正要观察的是未来两周票据利率和普惠贷款加权成本，而不是降准当天的指数涨跌。财政部门同期公布，对吸纳就业的小微企业，失业保险稳岗返还将提前到9月拨付，与信贷政策形成组合。若资金仍淤积在银行间，公开市场可能回笼对冲，企业不要按宽松周期已经开始去排产能。各地工信部门会把技改项目清单对接到银行，减少重复尽调。担保费率上限本周也会对小微再降两个千分点，具体以各地公告为准。",
  ],
];

const notices = [
  [
    501,
    100,
    "系统维护通知：8 月 24 日 02:00–04:00",
    "published",
    "/media/covers/60.svg",
    "2026-08-21 10:00:00",
    1331,
    "8月24日02:00至04:00升级数据库索引。窗口期内写入接口返回503，列表与详情只读查询不受影响。请把批量导入改到05:00之后，值班号已同步到运维群。不要在窗口期重试写脚本。",
  ],
  [
    502,
    100,
    "办公区门禁升级完成",
    "published",
    "/media/covers/180.svg",
    "2026-08-20 14:20:00",
    1332,
    "办公区门禁升级完成，进出需工卡加人脸双因子。访客请提前在前台登记，临时码当天有效。如识别失败，走西侧人工通道，不要尾随进门。快递停在一层柜，骑手不得上楼。",
  ],
  [
    505,
    100,
    "食堂本周菜单调整",
    "published",
    "/media/covers/292.svg",
    "2026-08-11 08:40:00",
    1334,
    "食堂本周菜单调整：周三增加素食窗口，周五供应牛肉面。过敏原见各窗口告示牌。请自带杯具打汤，一次性碗筷按份计费，剩饭请倒进回收桶。高峰请错峰十分钟。",
  ],
  [
    503,
    200,
    "Q3 团建意向征集",
    "published",
    "/media/covers/1016.svg",
    "2026-08-19 09:15:00",
    1333,
    "第三季度团建开始征集意向，选项为郊外徒步、密室逃脱和湖边野餐。请于本周五下班前在表格中投票，过期按弃权处理。名额按部门人数分配，家属门票需自付。活动当天如遇暴雨，自动改到备用室内场馆，不再另行投票。集合时间与包车座位表将在投票截止后下一个工作日公布，请不要私下换人导致保险名单对不上。逾期报名不再加座。素食和过敏信息请一并填在备注里，后勤按表备餐。",
  ],
  [
    504,
    200,
    "开源贡献奖励办法（试行）",
    "published",
    "/media/covers/96.svg",
    "2026-08-12 11:00:00",
    1332,
    "开源贡献奖励办法进入试行：合并到主仓的PR按复杂度计分，文档与测试补齐后可再加分。季度末按积分兑换周边或调休，封顶两天。抄袭、代提和未经评审强合的记录一律不计分，并会在贡献榜备注。积分只统计主仓和官方插件仓，个人实验仓库不算。有异议可在公示期内向架构组提交说明，逾期视为接受当期结果。调休须在次季度内用完，不能折现。",
  ],
  [
    506,
    200,
    "草稿：年会场地待定",
    "draft",
    "/media/covers/201.svg",
    "2026-08-22 17:00:00",
    1333,
    "年会场地仍在两家酒店之间比选，预算表和交通接驳方案本周发出。节目彩排暂定11月，部门请先报节目时长，不要先定灯光舞美。草稿状态仅供内部讨论，对外不要传播候选报价。如需预定住宿，请等场地敲定后再走差旅系统，避免两头占房。主持人候选名单也先放在同一份表格里，方便行政统一对接。供应商询价邮件请抄送行政，不要单独承诺桌数。",
  ],
  [
    507,
    500,
    "数据库索引升级细则（值班与回滚）",
    "published",
    "/media/covers/60.svg",
    "2026-08-21 16:00:00",
    1331,
    "本次数据库索引升级安排在8月24日02:00至04:00。升级内容包括为Comment、Video、Music三张表补联合索引，以及重建ShopOrder的date字段统计索引。窗口期内所有POST、PUT、DELETE将返回503，并在响应头带Retry-After。GET列表、详情和导出不受影响，但分析接口会暂时关闭，以免扫全表。请各业务在23日下班前把定时导入、对账和爬虫停掉，24日05:00后再启动。值班顺序：02:00至03:00由数据组值守，03:00至04:00由平台组值守，手机保持接通。若主从延迟超过30秒，会自动中止切换并回滚到旧索引，不会强行切写。升级完成后，会在运维群发一条「索引可用」消息，同时把执行计划和慢查询对比贴到文档站。不要在窗口期内用本地脚本重试写接口，以免堆积错误工单。完成后如需核对，请用只读账号查information_schema，不要直接改线上统计表。回滚演练记录放在运维周报附件，审计抽查时要能打开。缓存和搜索索引不必同步重建，等主库稳定后再刷。",
  ],
  [
    508,
    500,
    "开源贡献奖励办法全文（试行）",
    "published",
    "/media/covers/96.svg",
    "2026-08-12 15:00:00",
    1332,
    "开源贡献奖励办法（试行）适用于所有把代码、文档或测试合并进主仓的同事。计分规则：修复缺陷1至3分，新增接口或页面3至8分，重构或性能优化需架构组确认后可到10分。补齐文档、示例和单测各加1分。季度末按积分兑换：20分周边礼包，40分调休一天，70分调休两天，封顶两天，不可累计到下一季度。以下情况不计分：未走评审、代他人提交、复制外部仓库不注明出处、把密钥写进仓库。公示期为季度最后五个工作日，有异议先找直属经理，再提交架构组。积分只统计主仓和官方插件仓。本办法解释权在工程委员会，试行满两个季度后复盘是否写入正式制度。对外宣传请用「试行」字样，不要写成已生效的薪酬政策。积分看板每周五更新，以合并时间为准，不以提交时间为准。跨组协作的PR由两边经理各确认一次，避免重复计分。调休须走人事系统，不能口头抵班。",
  ],
  [
    509,
    500,
    "门禁、访客与外卖通行说明",
    "published",
    "/media/covers/180.svg",
    "2026-08-20 18:00:00",
    1332,
    "办公区门禁已切换为工卡加人脸双因子。本人进出时先刷卡再正视摄像头，戴口罩或逆光失败请走西侧人工通道，不要尾随。访客须由接待人提前在前台登记，临时码当天23:00失效，过闸一次即作废。快递和外卖停在一层柜，员工自行取件，骑手不得上楼。外包同事使用橙色工卡，权限仅覆盖所在项目楼层，周末需单独申请。丢失工卡请当天挂失，补卡工本费20元。监控按法规保存九十天，仅供安保和合规调阅。本通知从发布之日起执行，旧的密码门方案同步停用。如需带领媒体或外部评审进楼，请至少提前一个工作日邮件告知行政。消防通道严禁堆放纸箱。访客离开时接待人负责送出闸机，不得把临时码转发给下一位未登记人员。夜间加班请在前台登记预计离开时间，保安巡楼时好核对。自行车棚也已纳入门禁，旧钥匙本周五作废。",
  ],
];

const articles = [
  [
    703,
    100,
    "智能字段：图片、性别与外键",
    "Jan",
    "/media/covers/177.svg",
    "[82001]",
    "[38710]",
    6,
    "2026-08-04 10:22:00",
    1361,
    "Show设为Auto时，会按字段名和注释推断图片列；sex显示为男女；以Id结尾的外键跳到关联详情。列表里的id数组可以点进单条，也可以用全部打开过滤后的列表页。这些都不改库存里的原始值。",
  ],
  [
    705,
    100,
    "运营活动页需要的最小字段集",
    "Wechat",
    "/media/covers/1018.svg",
    "[82001]",
    "[]",
    0,
    "2026-07-11 16:18:00",
    1361,
    "运营活动页最少要有标题、封面、说明、开始结束时间、状态和报名人数。其余字段放到详情里再编辑，避免列表被一长串配置项撑开，筛选也会更好做。报名人数用计数，不要每次打开详情再去数行。",
  ],
  [
    706,
    100,
    "电商列表为什么要独立购物车页",
    "Steve",
    "/media/covers/292.svg",
    "[38710,82002]",
    "[82001]",
    9,
    "2026-06-30 12:00:00",
    1363,
    "商品浏览用commerce布局，结算用独立订单页。同一份Product数据两套模板，购物车不要塞回商品列表，否则筛选和分页会把未结算行一起带上。地址和备注属于订单，不属于商品卡片。",
  ],
  [
    702,
    200,
    "权限门控：缺 Access 时自动提交 Apply",
    "Test User",
    "/media/covers/48.svg",
    "[38710]",
    "[]",
    4,
    "2026-08-09 15:40:00",
    1362,
    "编辑和删除先打业务API。若权限不足或Request结构不合法，Demo会自动向Admin提交配置申请，而不是在页面上放审批按钮。Apply的tag由页面标题生成，空格改下划线。等状态变化时再通知，不要轮询刷屏。敏感删除默认走审批，其他写入自动执行并记一笔auto_approved，方便事后对账。不要把密钥写进聊天再让模型去改权限。页面标题改了就要重新生成tag，旧申请不要复用。",
  ],
  [
    704,
    200,
    "不要把 SQL 交给模型临场拼装",
    "Strong",
    "/media/covers/60.svg",
    "[]",
    "[82012]",
    2,
    "2026-07-21 09:00:00",
    1363,
    "不要让模型临场拼SQL。可控的是HTTP上的JSON ORM，表级角色和Request.structure仍留在你信任的API层。图表默认分组也不要用主键，部门、状态、日期才分得开。一次成功的调用冻成模板后，稳态筛选分页必须usedLlm为false，由客户端自己拼请求体。浏览器也不要直连8080，会话留在Node代理这一侧。模板里的id必须来自用户点过的行，禁止编造示例主键。",
  ],
  [
    707,
    200,
    "列表与详情为什么必须是两页",
    "Test User",
    "/media/covers/1015.svg",
    "[38710]",
    "[]",
    3,
    "2026-08-10 19:20:00",
    1362,
    "列表页和详情页必须是独立页面：标题、surfaceId和保存快照都不能混用。改详情标题会分叉出新页面，旧页保持不动。多表槽位要一起持久化，才能从顶部菜单重新打开。这样回退按钮才有明确的上一页，而不是把列表和表单叠在同一个surface上。筛选条件也不要写进详情快照，以免回来时列表被清空。创建页同样要带create后缀，不能和详情抢同一个tag。",
  ],
  [
    701,
    500,
    "从文本到结构化请求：A2API 0.1",
    "TommyLemon",
    "/media/covers/0.svg",
    "[82001,82002,70793]",
    "[82001]",
    21,
    "2026-08-16 11:00:00",
    1362,
    "proposeRequest和bindRequest把一次成功的APIJSON调用冻成模板，这是A2API 0.1的核心。聊天里只负责提出意图和确认字段，真正列表、筛选、分页、排序必须usedLlm为false，由客户端按绑定模板重建请求体，再打同源的apijson代理。不要从浏览器直连Java的8080端口，会话cookie要留在Node这一侧。权限不足时不要改成「先问模型怎么办」，而是走Admin的Apply：把页面标题收成tag，结构写进Request，等审批后再reload。图表字段池来自所有查询表的字段，而不是当前表格可见列。性别、图片、外键这些智能显示属于UI层，不改变存库值。这样Agent才能被限制在你已经批准过的信封里，而不是每次点击都重新发明接口。把一次对话变成可重复的HTTP，比把模型留在热路径上更安全，也更便宜。绑定失败时把原始响应留下，方便对照MUST和REFUSE，不要只丢一句失败。UI语言和AI回复语言分开设置，不要把界面文案交给模型临场翻译。",
  ],
  [
    708,
    500,
    "Apply 门控怎么和页面 tag 对齐",
    "Test User",
    "/media/covers/48.svg",
    "[38710]",
    "[82001]",
    5,
    "2026-08-09 18:00:00",
    1362,
    "缺Access或Request不合法时，Demo会自动提交Apply，页面上不出现通过或驳回。这是刻意的：审批只属于Admin。tag从页面标题生成，例如Moment Detail变成moment_detail，重试写入时也要带上同一个tag。Apply通过后需要TYPE_RELOAD等于4并调用reload，客户端只在状态变化时提示，避免定时器刷出一堆相同通知。编辑删除一律先打业务API，只有权限、参数或结构错误才升级成配置申请。自动通过的普通写入仍要落auto_approved审计行，方便和人工审批对账。不要把敏感删除改成前端假成功。这一套门控让演示环境可以大胆点按钮，同时不把生产策略写进聊天提示词。Apply的结构里Verify要放在前面，电话和邮箱校验码才能先于User写入。页面标题改了就要重新生成tag，不要沿用旧申请。多表详情的Relate也要写进structure，用vice字段和IN或Contains表达，而不是让模型下次再猜一遍。",
  ],
  [
    709,
    500,
    "Access 与 Request：到底约束什么",
    "Steve",
    "/media/covers/24.svg",
    "[82001,70793]",
    "[82002]",
    8,
    "2026-06-18 08:30:00",
    1363,
    "APIJSON的Access决定谁能摸哪张表，Request.structure决定一次写入必须带什么字段、拒绝什么字段、以及OWNER如何注入userId。GET对公开表可以UNKNOWN，带tag的GET、以及POST PUT DELETE必须命中Request。会话里的访客身份由服务端注入，客户端不要写死38710这类示例id。列表查询默认不要给主表加过窄的column，详情才按需取列。Comment可以挂momentId、videoId、articleId或blogId，这些外键要用onTable和onField描述，而不是靠截断单词去猜。理解这两张配置表，比再学一套新的权限SDK更接近本项目的真实约束。把结构写对，模型只负责填值，就不会在生产里拼出无法审计的SQL。POST写操作省略userId，由会话注入访客，避免把别人的数据写成自己的。JOIN User时默认带name、tag、head和pictureList，不要只取一个名字字段。",
  ],
];

const lyrics = {
  grace: `[ti:Amazing Grace]
[ar:United States Marine Band]
[00:29.46]Amazing Grace, how sweet the sound
[00:29.46]奇异恩典，何等甘甜
[00:39.54]That saved a wretch like me
[00:39.54]我罪已得赦免
[00:50.41]I once was lost, but now am found
[00:50.41]前我迷失，今被寻回
[01:01.53]Was blind, but now I see
[01:01.53]瞎眼今得看见
[01:34.22]T'was Grace that taught my heart to fear
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
[02:53.71]T'is Grace that brought me safe thus far
[02:53.71]靠主恩典，安全度过
[03:04.19]And Grace will lead me home
[03:04.19]使我归回天家`,
  grace1922: `[ti:Amazing Grace]
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
[01:24.00]一生一世不忘`,
  auld: `[ti:Auld Lang Syne]
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
[00:52.00]We'll take a cup of kindness yet
[00:52.00]让我们来举杯畅饮
[01:00.00]For auld lang syne
[01:00.00]友谊地久天长`,
  susanna: `[ti:Oh! Susanna]
[ar:United States Navy Band]
[00:12.00]I come from Alabama with a banjo on my knee
[00:12.00]我从阿拉巴马来，膝上搁着班卓琴
[00:28.00]I'm going to Louisiana, my true love for to see
[00:28.00]我要去路易斯安那，去看我的爱人
[00:44.00]Oh! Susanna, oh don't you cry for me
[00:44.00]哦苏珊娜，你不要为我哭泣
[01:00.00]For I come from Alabama with a banjo on my knee
[01:00.00]我从阿拉巴马来，膝上搁着班卓琴
[01:28.00]It rained all night the day I left, the weather it was dry
[01:28.00]动身那夜大雨下个不停，天却还是干的
[01:48.00]The sun so hot I froze to death, Susanna, don't you cry
[01:48.00]太阳很热我却冻僵，苏珊娜你别哭
[02:08.00]Oh! Susanna, oh don't you cry for me
[02:08.00]哦苏珊娜，你不要为我哭泣
[02:28.00]For I come from Alabama with a banjo on my knee
[02:28.00]我从阿拉巴马来，膝上搁着班卓琴
[03:00.00]I had a dream the other night, when everything was still
[03:00.00]那天夜里万籁俱寂，我做了一个梦
[03:20.00]I thought I saw Susanna dear, a-coming down the hill
[03:20.00]仿佛看见亲爱的苏珊娜，从山坡上走来`,
  twinkle: `[ti:Twinkle Twinkle Little Star]
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
[00:32.00]我想知道你是谁`,
  america: `[ti:America the Beautiful]
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
[03:04.00]穿过荒野向前`,
};

function dumpCounts() {
  const rows = [];
  for (const r of news) rows.push(["News", r[0], r[1], count(r[10])]);
  for (const r of notices) rows.push(["Notice", r[0], r[1], count(r[7])]);
  for (const r of articles) rows.push(["Article", r[0], r[1], count(r[10])]);
  console.log(rows.map((x) => x.join("\t")).join("\n"));
}

const lines = [];
lines.push(`-- Idempotent lyrics / captions / long article bodies for layout demo.`);
lines.push(`-- Safe to re-run. Also appended from layout_demo_tables.sql.`);
lines.push(`SET NAMES utf8mb4;`);
lines.push(`SET @db := DATABASE();`);
const alters = [
  [
    "Music",
    "lyrics",
    "ALTER TABLE `Music` ADD COLUMN `lyrics` text COMMENT '歌词（LRC 或纯文本，公版/CC 曲目）'",
  ],
  [
    "Video",
    "subtitleList",
    "ALTER TABLE `Video` ADD COLUMN `subtitleList` json DEFAULT NULL COMMENT '字幕 [{lang,label,url}]，免登录 WebVTT'",
  ],
  [
    "Video",
    "qualityList",
    "ALTER TABLE `Video` ADD COLUMN `qualityList` json DEFAULT NULL COMMENT '清晰度 [{label,url}]，同一内容多分辨率'",
  ],
];
for (const [table, col, ddl] of alters) {
  lines.push(`SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='${table}')
  AND NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='${table}' AND COLUMN_NAME='${col}'),
  '${ddl.replace(/'/g, "''")}', 'SELECT 1'));`);
  lines.push(`PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;`);
}
lines.push(
  `SET @sql := (SELECT IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Notice' AND COLUMN_NAME='content' AND DATA_TYPE='varchar'),
  'ALTER TABLE \`Notice\` MODIFY \`content\` text COMMENT ''资讯正文''', 'SELECT 1'));`,
);
lines.push(`PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;`);

for (const r of news) {
  const [id, , title, headline, source, author, cover, views, date, cat, body] = r;
  lines.push(
    `INSERT INTO \`News\` (\`id\`,\`userId\`,\`title\`,\`headline\`,\`source\`,\`author\`,\`cover\`,\`content\`,\`viewCount\`,\`date\`,\`categoryId\`) VALUES (${id}, 82001, '${esc(title)}', '${esc(headline)}', '${esc(source)}', '${esc(author)}', '${cover}', '${esc(body)}', ${views}, '${date}', ${cat}) ON DUPLICATE KEY UPDATE title=VALUES(title), headline=VALUES(headline), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);`,
  );
}

for (const r of notices) {
  const [id, , title, status, cover, date, cat, body] = r;
  lines.push(
    `INSERT INTO \`Notice\` (\`id\`,\`userId\`,\`title\`,\`cover\`,\`content\`,\`status\`,\`date\`,\`categoryId\`) VALUES (${id}, 82001, '${esc(title)}', '${cover}', '${esc(body)}', '${status}', '${date}', ${cat}) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), status=VALUES(status), categoryId=VALUES(categoryId);`,
  );
}

for (const r of articles) {
  const [id, , title, author, cover, praise, collect, share, date, cat, body] = r;
  const uid = id === 701 ? 38710 : id === 703 ? 82002 : id === 709 ? 82012 : 82001;
  void praise;
  void collect;
  void share;
  lines.push(
    `INSERT INTO \`Article\` (\`id\`,\`userId\`,\`title\`,\`author\`,\`cover\`,\`content\`,\`date\`,\`categoryId\`) VALUES (${id}, ${uid}, '${esc(title)}', '${esc(author)}', '${cover}', '${esc(body)}', '${date}', ${cat}) ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content), categoryId=VALUES(categoryId);`,
  );
}

const musicRows = [
  [907, 82001, "Amazing Grace", "United States Marine Band", "Public Domain Hymns", "/media/covers/1015.svg", "https://upload.wikimedia.org/wikipedia/commons/transcoded/2/21/Amazing_Grace_US_Marine_Band.ogg/Amazing_Grace_US_Marine_Band.ogg.mp3", 234, 42000, "2026-08-08 12:00:00", 1313, lyrics.grace],
  [908, 38710, "Amazing Grace (1922)", "Original Sacred Harp Choir", "Library of Congress", "/media/covers/1016.svg", "https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f2/Amazing_grace_1922.ogg/Amazing_grace_1922.ogg.mp3", 120, 18000, "2026-08-08 12:10:00", 1313, lyrics.grace1922],
  [909, 82002, "Auld Lang Syne", "U.S. Navy Band", "Ceremonial Music", "/media/covers/1018.svg", "https://upload.wikimedia.org/wikipedia/commons/transcoded/7/74/Auld_Lang_Syne_-_U.S._Navy_Band.ogg/Auld_Lang_Syne_-_U.S._Navy_Band.ogg.mp3", 64, 26000, "2026-08-08 12:20:00", 1311, lyrics.auld],
  [910, 82001, "Oh! Susanna", "United States Navy Band", "American Folk", "/media/covers/1080.svg", "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c3/Oh_Susanna.ogg/Oh_Susanna.ogg.mp3", 233, 31000, "2026-08-08 12:30:00", 1315, lyrics.susanna],
  [911, 82003, "Twinkle Twinkle Little Star", "John Casale", "Nursery (CC BY-SA)", "/media/covers/1025.svg", "https://upload.wikimedia.org/wikipedia/commons/transcoded/9/91/Twinkle_Twinkle_Little_Star.ogg/Twinkle_Twinkle_Little_Star.ogg.mp3", 44, 15000, "2026-08-08 12:40:00", 1313, lyrics.twinkle],
  [912, 70793, "America the Beautiful", "United States Navy Band", "Ceremonial Vocals", "/media/covers/1043.svg", "https://upload.wikimedia.org/wikipedia/commons/transcoded/0/0e/America_the_Beautiful_%28male_vocalist%29_-_United_States_Navy_Band.opus/America_the_Beautiful_%28male_vocalist%29_-_United_States_Navy_Band.opus.mp3", 226, 22000, "2026-08-08 12:50:00", 1311, lyrics.america],
];

for (const r of musicRows) {
  const [id, uid, title, artist, album, cover, url, dur, plays, date, cat, lrc] = r;
  lines.push(
    `INSERT INTO \`Music\` (\`id\`,\`userId\`,\`title\`,\`artist\`,\`album\`,\`cover\`,\`audioUrl\`,\`lyrics\`,\`duration\`,\`playCount\`,\`date\`,\`categoryId\`) VALUES (${id}, ${uid}, '${esc(title)}', '${esc(artist)}', '${esc(album)}', '${cover}', '${url}', '${esc(lrc)}', ${dur}, ${plays}, '${date}', ${cat}) ON DUPLICATE KEY UPDATE lyrics=VALUES(lyrics), audioUrl=VALUES(audioUrl), title=VALUES(title), cover=VALUES(cover), categoryId=VALUES(categoryId);`,
  );
}

const SINTEL_Q = JSON.stringify([
  { label: "480P", url: "https://media.w3.org/2010/05/sintel/trailer.mp4" },
  { label: "720P", url: "https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4" },
  { label: "1080P", url: "https://download.blender.org/durian/trailer/sintel_trailer-1080p.mp4" },
  { label: "2K", url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.1440p.webm" },
  { label: "4K", url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.2160p.webm" },
]);
const BBB_Q = JSON.stringify([
  { label: "480P", url: "https://media.w3.org/2010/05/bunny/trailer.mp4" },
  { label: "720P", url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4" },
  { label: "1080P", url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4" },
  { label: "2K", url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.1440p.webm" },
  { label: "4K", url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.2160p.webm" },
]);
const videoMeta = [
  [801, "sintel", SINTEL_Q],
  [802, "bunny", BBB_Q],
  [803, "oceans", '[{"label":"720P","url":"https://vjs.zencdn.net/v/oceans.mp4"}]'],
  [804, "flower", '[{"label":"480P","url":"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"}]'],
  [805, "movie", '[{"label":"480P","url":"https://media.w3.org/2010/05/video/movie_300.mp4"}]'],
  [806, "rabbit", '[{"label":"480P","url":"https://mdn.github.io/learning-area/html/multimedia-and-embedding/video-and-audio-content/rabbit320.mp4"}]'],
];
for (const [id, cap, q] of videoMeta) {
  lines.push(
    `UPDATE \`Video\` SET \`subtitleList\` = CAST('${esc(caps(cap))}' AS JSON), \`qualityList\` = CAST('${esc(q)}' AS JSON) WHERE \`id\` = ${id};`,
  );
}

lines.push(`INSERT INTO \`Video\` (\`id\`,\`userId\`,\`title\`,\`author\`,\`cover\`,\`videoUrl\`,\`subtitleList\`,\`qualityList\`,\`duration\`,\`playCount\`,\`date\`,\`categoryId\`) VALUES
(807, 82001, 'Big Buck Bunny 10s', 'Blender Foundation', 'https://media.w3.org/2010/05/bunny/poster.png', 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4', CAST('${esc(caps("bbb10"))}' AS JSON), CAST('${esc(BBB_Q)}' AS JSON), 10, 6400, '2026-08-16 10:00:00', 1346),
(808, 38710, 'Sintel Short (captions)', 'Blender Foundation / MDN', 'https://media.w3.org/2010/05/sintel/poster.png', 'https://media.w3.org/2010/05/sintel/trailer.mp4', CAST('${esc(caps("sintel"))}' AS JSON), CAST('${esc(SINTEL_Q)}' AS JSON), 52, 8800, '2026-08-16 11:00:00', 1346)
ON DUPLICATE KEY UPDATE subtitleList=VALUES(subtitleList), qualityList=VALUES(qualityList), videoUrl=VALUES(videoUrl), cover=VALUES(cover);`);

writeFileSync(
  new URL("./layout_demo_media_text.sql", import.meta.url),
  `${lines.join("\n")}\n`,
  "utf8",
);
dumpCounts();
