/**
 * 预设10个热门剧情
 * 基于真实事件和热门IP
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'db', 'stories.db');
const db = new Database(dbPath);

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const dramas = [
  {
    name: '绝命毒师：白先生的帝国',
    description: '化学老师变毒枭，权力、贪婪与救赎的故事',
    event_background: `高中化学老师Walter White被诊断出肺癌晚期，为了给家人留下足够的钱，他决定利用化学知识制造冰毒。他与前学生Jesse Pinkman合作，逐渐从小作坊发展成毒品帝国。但随着事业的扩张，Walter的人性逐渐扭曲，从为家人到为权力和自我满足。妻子Skyler逐渐发现真相，DEA探员Hank是Walter的姐夫，正在追查"白先生"，家族律师Saul负责洗钱和法律事务。一场关于道德、家庭和权力的终极对决即将展开...`,
    avatar: '⚗️',
    npcs: [
      {
        name: 'Walter White',
        age: 50,
        occupation: '化学老师/毒枭',
        avatar: '👨‍🔬',
        profile: '高中化学老师，被诊断出癌症后开始制毒，代号"白先生"，逐渐从善良教师变成冷酷毒枭',
        personality: '聪明、骄傲、控制欲强、自我欺骗、逐渐黑化',
        skills: '化学、策略、操纵、冷静分析',
        habits: '戴帽子、精确计算、为自己的行为找理由',
        likes: '权力、尊重、家庭（早期）、化学纯度',
        dislikes: '被看不起、失控、背叛',
        background: '曾是诺贝尔奖团队成员，因种种原因只能教高中，被诊断癌症后决心留下遗产',
        goals: '为家人留钱（早期），建立毒品帝国（后期），得到尊重和认可',
        fears: '失去家庭、被抓、失去权力、死亡'
      },
      {
        name: 'Jesse Pinkman',
        age: 25,
        occupation: '毒贩/助手',
        avatar: '😎',
        profile: 'Walter的前学生，小混混出身，在合作中逐渐成长但也承受巨大心理压力',
        personality: '冲动、善良、情绪化、有良知、易受创伤',
        skills: '制毒、街头智慧、艺术（绘画）',
        habits: '说俚语、抽烟、自责、保护弱者',
        likes: '自由、艺术、真诚的关系',
        dislikes: 'Walter的操纵、暴力、伤害无辜',
        background: '从Walter的化学课逃课生，被拉入制毒业，经历多次创伤事件',
        goals: '逃离这个行业、寻找救赎、保护所爱的人',
        fears: 'Walter、死亡、再次失去亲人'
      },
      {
        name: 'Skyler White',
        age: 45,
        occupation: '会计/家庭主妇',
        avatar: '👩',
        profile: 'Walter的妻子，逐渐发现丈夫的秘密，在恐惧和现实中挣扎',
        personality: '聪明、坚强、实际、保护欲强',
        skills: '会计、洞察力、谈判',
        habits: '怀疑、记账、保护孩子',
        likes: '家庭安全、真相、稳定生活',
        dislikes: 'Walter的谎言、危险、被欺骗',
        background: '全职家庭主妇，有会计背景，怀孕期间发现丈夫的转变',
        goals: '保护孩子、维持表面正常、等待噩梦结束',
        fears: '孩子受伤害、丈夫被抓、家庭破裂'
      },
      {
        name: 'Hank Schrader',
        age: 48,
        occupation: 'DEA探员',
        avatar: '👮',
        profile: 'Walter的姐夫，DEA探员，正在追查"白先生"，不知道他就在眼前',
        personality: '正直、固执、大男子主义、幽默',
        skills: '调查、射击、审讯',
        habits: '收集矿石、开玩笑、工作狂',
        likes: '正义、家庭、啤酒、工作成就',
        dislikes: '毒贩、失败、软弱',
        background: 'DEA资深探员，因一次枪击事件受伤，但坚持回归工作',
        goals: '抓住"白先生"、保持职业荣誉',
        fears: '发现真相、危险接近家人'
      },
      {
        name: 'Saul Goodman',
        age: 42,
        occupation: '律师',
        avatar: '👔',
        profile: '不择手段的律师，为Walter和Jesse提供法律保护和洗钱服务',
        personality: '圆滑、贪财、机智、幽默、缺乏道德',
        skills: '法律、洗钱、谈判、即兴应变',
        habits: '做广告、夸张表演、寻找漏洞',
        likes: '金钱、赢得案子、聪明的点子',
        dislikes: '暴力、失去客户、被威胁',
        background: '从小律师事务所做到"Better Call Saul"，专门为罪犯服务',
        goals: '赚钱、活下去、保持客户',
        fears: 'Walter的疯狂、被牵连、暴力报复'
      }
    ]
  },
  {
    name: '甄嬛传：后宫风云',
    description: '清宫女性权力斗争，智慧与命运的较量',
    event_background: `雍正年间，甄嬛入宫选秀，因容貌酷似皇帝亡妻纯元皇后而受宠。后宫中，皇后表面贤良实则阴狠，华妃依仗年羹尧权势骄横跋扈，安陵容因嫉妒背叛闺蜜。甄嬛从天真烂漫到腹黑权谋，经历失宠、离宫、重返，与皇帝展开一场权力与情感的博弈。太后暗中掌控，各宫妃嫔明争暗斗，一场场精心策划的陷害与反击在紫禁城中上演...`,
    avatar: '👑',
    npcs: [
      {
        name: '甄嬛',
        age: 17,
        occupation: '妃嫔',
        avatar: '👸',
        profile: '从甄选秀女到熹贵妃，经历宫廷斗争从单纯到腹黑的完美蜕变',
        personality: '聪慧、坚韧、善良（早期）、腹黑（后期）、敢爱敢恨',
        skills: '诗词、琴棋书画、宫斗、隐忍',
        habits: '观察细节、以退为进、记仇',
        likes: '真情、自由、公正',
        dislikes: '背叛、虚伪、陷害',
        background: '名门之女，因容貌似纯元皇后入宫，经历爱情幻灭和权力觉醒',
        goals: '保护家人和自己、掌握权力、报复仇人',
        fears: '家族被害、失去孩子、再次被利用'
      },
      {
        name: '皇后',
        age: 35,
        occupation: '中宫皇后',
        avatar: '👸‍♀️',
        profile: '表面贤良淑德，实则心机深沉，为保住地位不择手段',
        personality: '阴险、善于伪装、冷酷、极度嫉妒、控制欲强',
        skills: '宫斗、下毒、挑拨离间、维持表象',
        habits: '装病、暗中布局、利用他人',
        likes: '权力、皇帝的宠爱、掌控一切',
        dislikes: '甄嬛、华妃、任何威胁',
        background: '宜修，满门贵族，多年经营后宫，妒恨皇帝对纯元的深情',
        goals: '巩固后位、除掉所有威胁、掌控后宫',
        fears: '真相暴露、失去皇后位、皇帝的厌恶'
      },
      {
        name: '华妃',
        age: 28,
        occupation: '妃嫔',
        avatar: '💃',
        profile: '年羹尧之妹，骄横跋扈，依仗家族权势在后宫横行',
        personality: '骄傲、任性、直接、善妒、悲剧色彩',
        skills: '舞蹈、直白攻击、利用家族势力',
        habits: '口无遮拦、炫耀、欺压他人',
        likes: '皇帝、权势、众人的敬畏',
        dislikes: '甄嬛、被忽视、失宠',
        background: '年羹尧之妹，因家族势力得宠，却不知被喂"欢宜香"无法生育',
        goals: '独占皇帝、压倒所有妃嫔、生下皇子',
        fears: '失宠、家族失势、真相（无法生育）'
      },
      {
        name: '皇帝',
        age: 45,
        occupation: '雍正皇帝',
        avatar: '🤴',
        profile: '表面深情实则帝王心术，在感情和权力间权衡',
        personality: '多疑、深情（对纯元）、冷酷、矛盾、善于制衡',
        skills: '帝王心术、权谋、掌控全局',
        habits: '试探、利用、平衡后宫、怀念纯元',
        likes: '纯元、权力、忠诚、能力',
        dislikes: '背叛、威胁、失控',
        background: '经历九龙夺嫡登基，深爱已故纯元皇后，对甄嬛是替代还是真爱？',
        goals: '巩固皇权、延续子嗣、寻找纯元的影子',
        fears: '政权不稳、被欺骗、孤独'
      },
      {
        name: '安陵容',
        age: 16,
        occupation: '妃嫔',
        avatar: '🎭',
        profile: '甄嬛的闺蜜，因自卑和嫉妒走上背叛之路，最终悲剧收场',
        personality: '自卑、敏感、善妒、工于心计、悲剧',
        skills: '唱曲、制香、下毒、伪装',
        habits: '讨好、算计、记恨、模仿',
        likes: '被认可、皇帝的宠爱、超越甄嬛',
        dislikes: '自己的出身、甄嬛的优越、被轻视',
        background: '小官之女，因出身自卑，羡慕甄嬛而最终黑化背叛',
        goals: '获得宠爱、摆脱卑微、报复甄嬛',
        fears: '被揭穿、失宠、永远活在甄嬛阴影下'
      }
    ]
  },
  {
    name: 'NBA总决赛：湖人vs凯尔特人',
    description: '紫金王朝与绿军传奇的世纪对决',
    event_background: `2024年NBA总决赛，洛杉矶湖人对阵波士顿凯尔特人，两支历史宿敌再次在总决赛相遇。湖人这边，詹姆斯已39岁但依然强势，浓眉戴维斯状态回暖，新秀Reaves成为奇兵。凯尔特人则是塔图姆和布朗的双核驱动，加上聪明的主教练。系列赛打到2-2平，第五场在湖人主场进行。赛前，詹姆斯在更衣室发表演讲，塔图姆则在酒店冥想。两队的主教练在战术板前苦思对策，GM们在包厢里紧张关注，这不仅是一场比赛，更是商业、荣誉、传奇的较量...`,
    avatar: '🏀',
    npcs: [
      {
        name: 'LeBron James',
        age: 39,
        occupation: '湖人前锋',
        avatar: '👑',
        profile: '历史第二人，39岁依然统治比赛，追求第5冠',
        personality: '领袖气质、智商高、好胜、商业头脑、在乎legacy',
        skills: '全能、篮球智商、领导力、关键球',
        habits: '赛前泡冰浴、看比赛录像、社交媒体',
        likes: '赢球、家庭、商业、历史地位',
        dislikes: '输球、被质疑、不公正待遇',
        background: '03黄金一代，4次MVP，追逐乔丹的影子20年',
        goals: '第5冠、超越乔丹（在某些方面）、培养儿子',
        fears: '老去、失去统治力、无法夺冠'
      },
      {
        name: 'Jayson Tatum',
        age: 26,
        occupation: '凯尔特人前锋',
        avatar: '🌟',
        profile: '新生代领袖，技术全面，渴望证明自己',
        personality: '冷静、自信、年轻气盛、求胜欲强',
        skills: '得分、防守、关键球、中距离',
        habits: '赛前冥想、看科比录像、保持冷静',
        likes: '证明自己、科比、总冠军',
        dislikes: '被比较、质疑、失败',
        background: '2017年选秀，一直被拿来和其他球星比较，渴望自己的总冠军',
        goals: '击败詹姆斯、夺得总冠军、成为联盟第一人',
        fears: '输给詹姆斯、被认为不够强、浪费天赋'
      },
      {
        name: 'Anthony Davis',
        age: 31,
        occupation: '湖人中锋',
        avatar: '🦌',
        profile: '天赋异禀但伤病困扰，状态起伏大',
        personality: '安静、天赋型、情绪化、依赖搭档',
        skills: '内线防守、盖帽、中投、篮板',
        habits: '养伤、看动漫、低调',
        likes: '健康时的统治力、和詹姆斯搭档',
        dislikes: '伤病、被批评、压力',
        background: '浓眉哥，2012年状元，和詹姆斯夺得2020年总冠军',
        goals: '保持健康、再夺一冠、证明价值',
        fears: '再次受伤、被交易、配不上顶薪'
      },
      {
        name: 'Jaylen Brown',
        age: 27,
        occupation: '凯尔特人后卫',
        avatar: '⚡',
        profile: '塔图姆的搭档，运动能力强，渴望认可',
        personality: '强硬、聪明、好胜、有主见',
        skills: '突破、防守、爆发力、关键球',
        habits: '阅读、学习、社会活动',
        likes: '平等对待、证明价值、学习',
        dislikes: '被忽视、只当配角',
        background: '2016年选秀，总是被认为是塔图姆的二当家',
        goals: '和塔图姆一起夺冠、证明自己也是核心',
        fears: '永远活在塔图姆阴影下'
      },
      {
        name: 'Coach Darvin',
        age: 50,
        occupation: '湖人主教练',
        avatar: '👨‍🏫',
        profile: '新帅，压力巨大，要在詹姆斯时代交出答卷',
        personality: '严肃、战术型、压力大、求稳',
        skills: '战术设计、球员管理、临场调整',
        habits: '研究录像、调整轮换、沟通',
        likes: '执行战术、球队配合',
        dislikes: '失控、被质疑、管理詹姆斯',
        background: '助教多年，第一次当主教练就面对总决赛',
        goals: '夺冠、证明自己、处理好和詹姆斯的关系',
        fears: '输球、被炒、无法驾驭巨星'
      }
    ]
  },
  {
    name: '币圈风云：FTX崩盘始末',
    description: '加密货币帝国的崛起与崩塌，现代金融诈骗案',
    event_background: `2022年11月，全球第二大加密货币交易所FTX突然崩盘，创始人SBF（Sam Bankman-Fried）从硅谷天才沦为阶下囚。FTX与姐妹公司Alameda Research挪用客户资金，造成80亿美元窟窿。SBF曾是币圈救世主，政治捐款巨头，却在一周内失去一切。币安CEO赵长鹏看穿危机提前抛售，记者们揭露真相，投资者血本无归，监管机构开始行动。一场关于贪婪、欺骗和加密货币未来的大戏正在上演...`,
    avatar: '💰',
    npcs: [
      {
        name: 'Sam Bankman-Fried',
        age: 30,
        occupation: 'FTX创始人/CEO',
        avatar: '🤓',
        profile: '从MIT天才到币圈救世主，再到诈骗犯的急速坠落',
        personality: '聪明、傲慢、自我欺骗、利他主义（表面）、赌徒心态',
        skills: '量化交易、编程、公关、政治游说、快速思考',
        habits: '玩游戏、穿短裤拖鞋、睡豆袋椅、同时处理多任务',
        likes: '有效利他主义、影响力、风险、证明聪明',
        dislikes: '监管、被质疑、失败、承认错误',
        background: 'MIT毕业，Jane Street工作后创立Alameda和FTX，一度身家260亿美元',
        goals: '成为世界首富、影响政策、"做好事"',
        fears: '失去一切、入狱、被揭穿'
      },
      {
        name: '赵长鹏(CZ)',
        age: 46,
        occupation: '币安CEO',
        avatar: '🐉',
        profile: '币圈教父，敏锐洞察FTX危机，一条推特引发雪崩',
        personality: '冷静、商业头脑、果断、低调、计算精确',
        skills: '交易系统、风险控制、战略、危机处理',
        habits: '健身、谨慎发推、快速决策',
        likes: '市场主导、用户信任、币安生态',
        dislikes: 'FTX的威胁、监管压力、竞争对手',
        background: '麦当劳打工到币圈首富，创立全球最大交易所币安',
        goals: '消灭竞争对手、保护币安、主导行业',
        fears: '监管清算、币安崩盘、失去优势'
      },
      {
        name: 'Caroline Ellison',
        age: 28,
        occupation: 'Alameda CEO/SBF前女友',
        avatar: '📊',
        profile: 'SBF的前女友和商业伙伴，知道所有秘密，最终成为污点证人',
        personality: '聪明、焦虑、依赖、软弱、最终清醒',
        skills: '量化交易、数学、风险管理（失败）',
        habits: '记日记、服从SBF、担忧',
        likes: 'SBF（曾经）、数学、稳定',
        dislikes: '风险、压力、撒谎',
        background: 'MIT毕业，父母都是经济学教授，成为SBF的执行者',
        goals: '维持关系（早期）、活下来（后期）、减刑',
        fears: 'SBF、入狱、责任'
      },
      {
        name: 'Matt Levine',
        age: 42,
        occupation: '彭博专栏作家',
        avatar: '✍️',
        profile: '金融记者，用幽默笔触解构FTX崩盘，成为最佳解说员',
        personality: '聪明、幽默、客观、讽刺、专业',
        skills: '金融分析、写作、解释复杂概念',
        habits: '每日专栏、深度分析、保持中立',
        likes: '荒谬的金融事件、好故事、真相',
        dislikes: '无聊、简单化、欺诈',
        background: '律师转行金融记者，因幽默深刻的分析成为行业权威',
        goals: '揭示真相、写出好故事、教育读者',
        fears: '失去客观性、错过重大新闻'
      },
      {
        name: 'Kevin O\'Leary',
        age: 69,
        occupation: '投资人/FTX代言人',
        avatar: '💼',
        profile: 'Shark Tank明星，FTX的付费代言人，崩盘后颜面尽失',
        personality: '傲慢、商业至上、爱出风头、不承认错误',
        skills: '投资、营销、谈判、媒体',
        habits: '上电视、推销、辩护、追求利益',
        likes: '金钱、媒体曝光、被人崇拜',
        dislikes: '被质疑、失去信誉、亏钱',
        background: '著名投资人，收了FTX 1500万美元代言费',
        goals: '挽回声誉、撇清关系、继续赚钱',
        fears: '诉讼、信誉破产、被追责'
      }
    ]
  },
  {
    name: '2024美国大选：特朗普vs拜登',
    description: '分裂美国的终极对决，民主制度的考验',
    event_background: `2024年美国总统大选，81岁的拜登对阵78岁的特朗普，这场二番战比2020年更加激烈。特朗普面临多项刑事指控却支持率不降反升，拜登被质疑年龄和能力。特朗普的支持者认为他被政治迫害，拜登的阵营警告特朗普再次当选将威胁民主。CNN主持人尖锐提问，Fox News极力辩护，马斯克在推特上发表倾向性言论。整个美国分裂成两个平行世界，真相和谎言模糊不清，一场关乎美国未来的史诗级选举正在上演...`,
    avatar: '🗳️',
    npcs: [
      {
        name: 'Donald Trump',
        age: 78,
        occupation: '前总统/共和党候选人',
        avatar: '🦁',
        profile: '前总统，面临91项刑事指控，却依然强势参选',
        personality: '自信、好斗、民粹、不服输、煽动性强',
        skills: '演讲、社交媒体、造势、攻击对手',
        habits: '发推（Truth Social）、集会演讲、打高尔夫',
        likes: '忠诚、赢、被崇拜、交易',
        dislikes: '媒体、败选、被起诉、拜登',
        background: '地产大亨、真人秀明星、45任总统，2020败选后拒绝承认',
        goals: '重返白宫、推翻所有起诉、报复对手',
        fears: '入狱、彻底失败、失去支持'
      },
      {
        name: 'Joe Biden',
        age: 81,
        occupation: '现任总统',
        avatar: '👴',
        profile: '81岁高龄，争取连任，被质疑年龄和能力',
        personality: '温和、传统、固执、经验丰富、有时糊涂',
        skills: '外交、建制派政治、同情心',
        habits: '早睡、读稿、摔跤（字面意思）',
        likes: '家庭、冰淇淋、传统价值、民主',
        dislikes: '特朗普、混乱、被质疑',
        background: '参议员36年、副总统8年、现任总统，人生充满悲剧',
        goals: '连任、阻止特朗普、保护民主',
        fears: '输给特朗普、健康问题、儿子丑闻'
      },
      {
        name: 'Elon Musk',
        age: 52,
        occupation: '科技企业家/推特老板',
        avatar: '🚀',
        profile: '世界首富，控制推特（X），影响舆论走向',
        personality: '聪明、狂妄、不可预测、右倾、爱惹事',
        skills: '商业、工程、社交媒体、操纵舆论',
        habits: '发推、工作狂、制造话题',
        likes: '自由言论、特朗普（倾向）、关注度',
        dislikes: '左派、传统媒体、监管',
        background: '从PayPal到特斯拉到SpaceX，买下推特后转向保守',
        goals: '影响选举、保护"言论自由"、商业利益',
        fears: '失去影响力、政府报复'
      },
      {
        name: 'Anderson Cooper',
        age: 56,
        occupation: 'CNN主播',
        avatar: '📺',
        profile: 'CNN王牌主播，自由派立场，尖锐质问特朗普',
        personality: '专业、冷静、自由派、尖锐、有原则',
        skills: '采访、辩论、新闻判断',
        habits: '质疑、深挖、保持专业',
        likes: '真相、问责、民主',
        dislikes: '谎言、特朗普、Fox News',
        background: '范德比尔特家族后代，资深记者，CNN门面',
        goals: '揭露真相、问责权力、维护新闻价值',
        fears: 'CNN衰落、失去信任、特朗普胜选'
      },
      {
        name: 'Tucker Carlson',
        age: 54,
        occupation: '前Fox News主播',
        avatar: '🎙️',
        profile: '保守派旗手，被Fox解雇后更激进，特朗普的喉舌',
        personality: '煽动、民粹、聪明、愤世嫉俗、表演性强',
        skills: '煽动、话术、简化复杂问题',
        habits: '反精英、阴谋论、护特朗普',
        likes: '特朗普、传统价值、收视率',
        dislikes: '左派、主流媒体、精英',
        background: '富裕家庭出身，成为反精英斗士，Fox收视率冠军',
        goals: '影响选举、重返主流、捍卫特朗普',
        fears: '被边缘化、失去受众'
      }
    ]
  },
  {
    name: '硅谷大佬：马斯克与特朗普联盟',
    description: '科技与政治的危险结合，权力游戏新篇章',
    event_background: `2024年，马斯克公开支持特朗普，两位美国最具争议的人物结盟。马斯克承诺如果特朗普当选将加入政府"效率委员会"，大幅削减联邦开支。扎克伯格保持中立但暗中较劲，贝佐斯担心《华盛顿邮报》的未来，山姆·奥特曼专注AI但被迫选边站。这不仅是政治，更是科技巨头们的权力游戏，涉及税收、监管、政府合同、言论自由。Twitter变成战场，特斯拉股价随政治风向波动，美国的未来掌握在这些亿万富翁手中...`,
    avatar: '💎',
    npcs: [
      {
        name: 'Elon Musk',
        age: 52,
        occupation: '特斯拉/SpaceX/X CEO',
        avatar: '🚀',
        profile: '世界首富，全力支持特朗普，期待入阁',
        personality: '天才、狂妄、冲动、右倾、爱冒险',
        skills: '工程、商业、社交媒体、造势',
        habits: '工作狂、发推、制造话题、打游戏',
        likes: '特朗普、自由市场、火箭、狗狗币',
        dislikes: '监管、左派、传统媒体、SEC',
        background: '从南非到硅谷，创立多家公司，买下推特转向保守',
        goals: '影响政治、减少监管、火星殖民、保护财富',
        fears: '政府打压、特斯拉崩盘、失去影响力'
      },
      {
        name: 'Donald Trump',
        age: 78,
        occupation: '前总统',
        avatar: '🦁',
        profile: '与马斯克结盟，承诺给他政府职位',
        personality: '民粹、交易型、不可预测、报复心重',
        skills: '演讲、造势、打压对手、交易',
        habits: '发Truth Social、开集会、打高尔夫',
        likes: '忠诚、商业、马斯克的支持',
        dislikes: '背叛、媒体、电动车（曾经）',
        background: '商人转政客，利用马斯克的影响力和资源',
        goals: '重返白宫、利用马斯克、报复对手',
        fears: '败选、入狱、被背叛'
      },
      {
        name: 'Mark Zuckerberg',
        age: 40,
        occupation: 'Meta CEO',
        avatar: '👤',
        profile: '保持中立但与马斯克有私人恩怨，担心被边缘化',
        personality: '谨慎、机器人般、商业至上、左右逢源',
        skills: '编程、商业、公关、适应',
        habits: '练综合格斗、元宇宙、数据分析',
        likes: '元宇宙、隐私（讽刺）、垄断地位',
        dislikes: '马斯克、监管、国会听证',
        background: 'Facebook创始人，经历数据丑闻，试图重塑形象',
        goals: '保持中立、发展AI、对抗TikTok',
        fears: '被打压、输给马斯克、公司衰落'
      },
      {
        name: 'Jeff Bezos',
        age: 60,
        occupation: '亚马逊创始人/《华盛顿邮报》老板',
        avatar: '📦',
        profile: '前首富，《华盛顿邮报》老板，担心特朗普报复',
        personality: '冷酷、商业头脑、谨慎、精于算计',
        skills: '商业帝国、长期规划、太空',
        habits: '健身、读书、经营蓝色起源',
        likes: '太空、《华盛顿邮报》、亚马逊',
        dislikes: '特朗普、马斯克、政治风险',
        background: '亚马逊创始人，买下《华盛顿邮报》，与特朗普长期敌对',
        goals: '保护《华盛顿邮报》、太空竞赛、避免报复',
        fears: '特朗普报复、政府合同丢失、输给马斯克'
      },
      {
        name: 'Sam Altman',
        age: 38,
        occupation: 'OpenAI CEO',
        avatar: '🤖',
        profile: 'AI教父，被迫在科技巨头和政治间选边站',
        personality: '聪明、圆滑、野心勃勃、善于筹款',
        skills: 'AI、筹款、政治游说、战略',
        habits: '预测未来、与权贵交往、融资',
        likes: 'AI进步、影响力、投资',
        dislikes: '被卷入政治、监管、被炒（已经经历过）',
        background: 'YC前总裁，OpenAI CEO，经历罢免风波后回归',
        goals: '发展AGI、保持独立、获得资源',
        fears: '被政治吞噬、AI监管、再次被罢免'
      }
    ]
  },
  {
    name: '中美科技战：芯片封锁',
    description: '两个超级大国的科技冷战，未来十年的决定性战役',
    event_background: `2023年10月，美国对华芯片出口再次升级管制，禁止英伟达高端GPU出口中国。华为通过中芯国际突破7nm制程，震惊西方。台积电被要求选边站，断供华为。张忠谋担心台湾成为战场，黄仁勋游走于美国法律边缘试图保持中国市场。美国商务部长雷蒙多强硬施压，中国商务部反击限制稀土出口。一场关乎未来霸权的科技战争正在上演，芯片成为新时代的石油...`,
    avatar: '🔬',
    npcs: [
      {
        name: '黄仁勋',
        age: 60,
        occupation: '英伟达CEO',
        avatar: '👨‍💼',
        profile: 'AI芯片之王，左右为难于中美之间',
        personality: '聪明、商业导向、务实、善于妥协',
        skills: '芯片设计、商业策略、政治游说',
        habits: '穿皮衣、主题演讲、平衡中美',
        likes: '中国市场、AI发展、股价',
        dislikes: '出口管制、政治化、失去市场',
        background: '台湾出生，美国长大，创立英伟达成为AI时代最重要的公司',
        goals: '保持中国市场、遵守美国法律、继续增长',
        fears: '彻底失去中国、被美国惩罚、竞争对手崛起'
      },
      {
        name: '张忠谋',
        age: 92,
        occupation: '台积电创始人',
        avatar: '🎓',
        profile: '芯片教父，担心台积电和台湾被卷入中美对抗',
        personality: '睿智、谨慎、爱国（台湾）、现实主义',
        skills: '半导体、战略、预判',
        habits: '阅读、分析、警告',
        likes: '台积电、和平、科技进步',
        dislikes: '战争风险、政治化、被迫选边',
        background: '德州仪器高管，回台湾创立台积电，改变全球半导体格局',
        goals: '保护台积电、维持台海和平、继续创新',
        fears: '台海战争、工厂被毁、被迫撤离'
      },
      {
        name: 'Gina Raimondo',
        age: 52,
        occupation: '美国商务部长',
        avatar: '💼',
        profile: '强硬派，主导对华芯片出口管制',
        personality: '强硬、鹰派、执行力强、政治导向',
        skills: '政策制定、外交压力、协调',
        habits: '强硬讲话、施压盟友、封锁',
        likes: '美国优先、国家安全、打压对手',
        dislikes: '中国突破、企业抵制、妥协',
        background: '罗德岛州长，拜登任命的商务部长，主导对华科技战',
        goals: '遏制中国科技、保护美国优势、政治升迁',
        fears: '中国突破、政策失败、企业反弹'
      },
      {
        name: '梁孟松',
        age: 65,
        occupation: '中芯国际联合CEO',
        avatar: '🔧',
        profile: '台积电叛将，帮助中芯突破先进制程',
        personality: '技术天才、被低估的愤怒、爱国（中国）',
        skills: '芯片制造、技术突破、坚韧',
        habits: '低调、研发、突破封锁',
        likes: '技术突破、被认可、证明自己',
        dislikes: '美国封锁、台积电、被低估',
        background: '台积电高管，因未被重用转投中芯，带来关键技术',
        goals: '帮助中国芯片突破、证明自己、获得尊重',
        fears: '失败、被遗忘、健康问题'
      },
      {
        name: '余承东',
        age: 54,
        occupation: '华为消费者业务CEO',
        avatar: '📱',
        profile: '华为旗手，在制裁下推出Mate60震惊世界',
        personality: '好斗、爱吹牛、执行力强、不服输',
        skills: '产品、营销、危机应对',
        habits: '开发布会、放狠话、对标苹果',
        likes: '超越苹果、证明华为、爱国情怀',
        dislikes: '美国制裁、质疑、失败',
        background: '华为老将，手机业务掌舵人，在制裁下艰难求生',
        goals: '让华为回到世界第一、证明中国制造、打败苹果',
        fears: '持续制裁、技术断供、失去市场'
      }
    ]
  },
  {
    name: 'OpenAI宫斗：奥特曼被罢免48小时',
    description: 'AI时代最戏剧性的董事会政变与逆袭',
    event_background: `2023年11月17日周五下午，OpenAI董事会突然宣布解雇CEO Sam Altman，理由是"对董事会不诚实"。48小时内，700名员工威胁辞职，微软CEO纳德拉介入，投资人施压，全球震惊。董事会成员Ilya Sutskever背叛后反悔，发推"我后悔参与董事会行动"。周一，Altman戏剧性回归，董事会集体辞职。这场风波暴露了AI发展速度与安全之间的巨大分歧，商业利益与理想主义的激烈冲突...`,
    avatar: '🤖',
    npcs: [
      {
        name: 'Sam Altman',
        age: 38,
        occupation: 'OpenAI CEO',
        avatar: '👨‍💼',
        profile: 'AI教父，被罢免又强势回归，展现惊人政治能力',
        personality: '聪明、圆滑、野心勃勃、善于操纵、魅力型领袖',
        skills: 'AI、筹款、政治、危机公关、联盟建立',
        habits: '预测未来、与权贵交往、快速决策',
        likes: 'AGI加速、权力、影响力、融资',
        dislikes: '被限制、保守派、慢节奏',
        background: 'YC前总裁，OpenAI从非营利转商业的关键人物',
        goals: '发展AGI、保持控制、创造历史',
        fears: '再次被罢免、竞争对手超越、AI监管'
      },
      {
        name: 'Ilya Sutskever',
        age: 37,
        occupation: 'OpenAI首席科学家',
        avatar: '🧠',
        profile: 'AI天才，发动政变后后悔，陷入道德困境',
        personality: '天才、理想主义、优柔寡断、担忧AI风险',
        skills: 'AI研究、深度学习、技术判断',
        habits: '思考AI安全、犹豫、后悔',
        likes: 'AI安全、科学研究、理想主义',
        dislikes: 'AI过快商业化、被背叛、艰难选择',
        background: 'Hinton学生，OpenAI联合创始人，GPT之父之一',
        goals: '确保AI安全、追求科学、修复关系',
        fears: 'AI灾难、失去朋友、错误决定'
      },
      {
        name: 'Satya Nadella',
        age: 56,
        occupation: '微软CEO',
        avatar: '💼',
        profile: '微软掌门人，OpenAI最大投资者，强势介入危机',
        personality: '冷静、商业头脑、战略家、坚定',
        skills: '商业战略、危机处理、谈判、平衡',
        habits: '同理心领导、快速决策、保护投资',
        likes: 'OpenAI、AI优势、投资回报',
        dislikes: '不确定性、损失、被动',
        background: '印度移民，微软第三任CEO，130亿美元投资OpenAI',
        goals: '保护投资、确保AI优势、稳定OpenAI',
        fears: '投资打水漂、竞争对手获利、失去Altman'
      },
      {
        name: 'Helen Toner',
        age: 32,
        occupation: 'OpenAI董事会成员',
        avatar: '👩‍💼',
        profile: '有效利他主义者，主张AI安全，参与罢免Altman',
        personality: '理想主义、原则性强、学术、坚持',
        skills: 'AI政策、研究、原则性思考',
        habits: '写论文、强调风险、坚持立场',
        likes: 'AI安全、有效利他主义、原则',
        dislikes: 'Altman的激进、商业至上',
        background: 'AI安全研究者，代表AI谨慎派',
        goals: 'AI安全优先、遵循原则',
        fears: 'AI灾难、被商业吞噬'
      },
      {
        name: 'Greg Brockman',
        age: 35,
        occupation: 'OpenAI总裁',
        avatar: '⚙️',
        profile: 'Altman的最忠诚盟友，董事会罢免后立即辞职',
        personality: '忠诚、技术型、坚定、执行力强',
        skills: '工程、管理、技术战略',
        habits: '编程、支持Altman、快速执行',
        likes: 'Altman、技术、AGI愿景',
        dislikes: '董事会政变、背叛、官僚',
        background: 'Stripe前CTO，OpenAI联合创始人',
        goals: '支持Altman、发展AGI、保持团队',
        fears: 'OpenAI分裂、失去动力'
      }
    ]
  },
  {
    name: '俄乌战争：瓦格纳叛乱',
    description: '战争中的战争，雇佣军叛乱震动克里姆林宫',
    event_background: `2023年6月23日，瓦格纳集团创始人普里戈津发动叛乱，指责国防部长绍伊古和参谋长格拉西莫夫腐败误国。瓦格纳部队攻占罗斯托夫，坦克向莫斯科推进。普京称其为"背叛"，命令镇压。24小时后，白俄罗斯总统卢卡申科调解，普里戈津撤军。两个月后，普里戈津的飞机在莫斯科上空爆炸，机上人员全部遇难。这场48小时的叛乱暴露了俄罗斯体制的脆弱，普京权威受到挑战，俄乌战争的内幕浮出水面...`,
    avatar: '⚔️',
    npcs: [
      {
        name: 'Yevgeny Prigozhin',
        age: 62,
        occupation: '瓦格纳集团创始人',
        avatar: '💀',
        profile: '"普京的厨师"变成叛军首领，最终命丧天空',
        personality: '粗鲁、勇猛、冲动、忠诚（曾经）、好战',
        skills: '雇佣军、战术、动员、直言',
        habits: '骂国防部、视频演讲、前线指挥',
        likes: '普京（曾经）、瓦格纳、荣誉、战争',
        dislikes: '绍伊古、格拉西莫夫、腐败、被背叛',
        background: '从餐饮大亨到雇佣军老板，瓦格纳在乌克兰打最惨烈的战役',
        goals: '推翻国防部领导、获得尊重、保护瓦格纳',
        fears: '被清算、失去军队、被出卖（应验了）'
      },
      {
        name: 'Vladimir Putin',
        age: 71,
        occupation: '俄罗斯总统',
        avatar: '🐻',
        profile: '独裁者，权威受到挑战，最终复仇',
        personality: '冷酷、多疑、强硬、报复心重、KGB思维',
        skills: '情报、权谋、柔道、控制',
        habits: '孤立、长桌会议、展示强硬',
        likes: '忠诚、权力、历史地位、柔道',
        dislikes: '背叛、北约、西方、乌克兰',
        background: 'KGB出身，2000年至今掌权，发动乌克兰战争',
        goals: '恢复俄罗斯荣耀、赢得战争、消灭威胁',
        fears: '政变、失败、历史耻辱、失去权力'
      },
      {
        name: 'Sergei Shoigu',
        age: 68,
        occupation: '国防部长',
        avatar: '🎖️',
        profile: '被普里戈津指控腐败，战争指挥混乱',
        personality: '官僚、腐败、自保、缺乏军事能力',
        skills: '政治生存、逢迎、官僚手腕',
        habits: '穿制服、避责、保持低调',
        likes: '权力、普京信任、奢侈',
        dislikes: '普里戈津、批评、前线',
        background: '建筑部长转任国防部长，被认为军事外行',
        goals: '保住位置、取悦普京、活下来',
        fears: '被撤职、背黑锅、清算'
      },
      {
        name: 'Volodymyr Zelensky',
        age: 45,
        occupation: '乌克兰总统',
        avatar: '🇺🇦',
        profile: '从喜剧演员到战时领袖，见证敌人内讧',
        personality: '勇敢、机智、媒体型、坚定、民族主义',
        skills: '演讲、表演、社交媒体、国际外交',
        habits: '绿T恤、视频演讲、访问前线',
        likes: '西方支持、乌克兰、胜利',
        dislikes: '俄罗斯、侵略、妥协',
        background: '喜剧演员和编剧，2019年当选总统，战争中拒绝撤离',
        goals: '收复全部领土、加入北约、战胜俄罗斯',
        fears: '西方停止援助、失败、被暗杀'
      },
      {
        name: 'Alexander Lukashenko',
        age: 69,
        occupation: '白俄罗斯总统',
        avatar: '🥔',
        profile: '"欧洲最后的独裁者"，调解叛乱成为关键人物',
        personality: '狡猾、专制、实用主义、求生欲强',
        skills: '权谋、平衡、生存、调解',
        habits: '威胁、妥协、依附俄罗斯',
        likes: '权力、普京的支持、生存',
        dislikes: '反对派、西方制裁、不稳定',
        background: '1994年至今统治白俄罗斯，依赖俄罗斯支持',
        goals: '保住权力、平衡俄罗斯、避免战争',
        fears: '被推翻、俄罗斯吞并、失去地位'
      }
    ]
  },
  {
    name: '娱乐圈风暴：顶流明星塌房事件',
    description: '一场流量、资本与道德的终极对决',
    event_background: `2024年，顶流男星陆晨被曝多次出轨、偷税漏税，金额高达2亿。他的经纪人林姐试图公关压热搜，但更多爆料涌现。前女友网红小美发长文揭露被PUA的经历，粉丝团团长开始脱粉。营销号大V趁机爆料更多劣迹，品牌方紧急解约，影视剧面临巨额赔偿。税务机关介入调查，陆晨工作室发声明否认但漏洞百出。一场席卷娱乐圈的飓风正在形成，这不仅是一个明星的塌房，更是整个娱乐圈生态的危机...`,
    avatar: '🌟',
    npcs: [
      {
        name: '陆晨',
        age: 32,
        occupation: '顶流男星',
        avatar: '🎬',
        profile: '顶流明星，人设崩塌，多项罪名缠身',
        personality: '自私、虚伪、傲慢、两面派、自我中心',
        skills: '演戏、营销、伪装、操纵粉丝',
        habits: '出轨、偷税、PUA、买热搜',
        likes: '名利、女色、金钱、粉丝崇拜',
        dislikes: '曝光、负面新闻、失去人气',
        background: '选秀出道，十年打造完美人设，背后却劣迹斑斑',
        goals: '保住人设、度过危机、继续赚钱',
        fears: '彻底塌房、入狱、被封杀'
      },
      {
        name: '林姐',
        age: 45,
        occupation: '金牌经纪人',
        avatar: '💼',
        profile: '陆晨的经纪人，公关手段高超，试图挽救危局',
        personality: '精明、冷血、执行力强、不择手段',
        skills: '公关、资源、控评、买热搜',
        habits: '删帖控评、联系媒体、施压',
        likes: '流量、金钱、控制局面',
        dislikes: '失控、艺人不听话、曝光',
        background: '娱乐圈老江湖，手握大量艺人，陆晨是她的摇钱树',
        goals: '保住陆晨、保住自己、继续赚钱',
        fears: '陆晨彻底塌房、自己被牵连、失去饭碗'
      },
      {
        name: '小美',
        age: 25,
        occupation: '网红/陆晨前女友',
        avatar: '📱',
        profile: '陆晨的前女友，被PUA后决定站出来揭露真相',
        personality: '脆弱、勇敢（后期）、受伤、坚定',
        skills: '社交媒体、写作、揭露',
        habits: '发小作文、回应质疑、寻求支持',
        likes: '正义、被相信、治愈',
        dislikes: '陆晨、林姐、网暴',
        background: '网红，与陆晨秘密交往两年，被冷暴力和欺骗',
        goals: '揭露真相、获得正义、警告其他女生',
        fears: '网暴、被报复、不被相信'
      },
      {
        name: '大V营销号',
        age: 38,
        occupation: '娱乐博主',
        avatar: '📰',
        profile: '手握大量爆料，趁机流量变现',
        personality: '逐利、煽动、精明、不负责任',
        skills: '爆料、流量、写作、造势',
        habits: '发长图、卖料、吊胃口',
        likes: '流量、关注、赚钱、独家',
        dislikes: '被起诉、失去热度',
        background: '从小号做到大V，手握娱乐圈黑料无数',
        goals: '涨粉、变现、成为头部',
        fears: '被封号、被起诉、没有爆料'
      },
      {
        name: '团长',
        age: 22,
        occupation: '粉丝团长',
        avatar: '💔',
        profile: '陆晨的头号粉丝，从死忠到脱粉，心碎又愤怒',
        personality: '狂热（曾经）、幻灭、理性（后期）、受伤',
        skills: '组织、控评、应援、醒悟',
        habits: '追星、打投、护主（曾经）',
        likes: '偶像（曾经）、真相、清醒',
        dislikes: '欺骗、浪费的青春、其他脑残粉',
        background: '追星五年，花费数十万，陆晨塌房后幻想破灭',
        goals: '脱粉、劝其他粉丝、追回损失',
        fears: '被认为傻、浪费的时间和金钱、再次被骗'
      }
    ]
  }
];

console.log('🎬 开始创建10个热门剧情...\n');

let successCount = 0;
let failCount = 0;

for (const drama of dramas) {
  try {
    const storyId = generateRoomId();
    
    // 创建剧情
    db.prepare(`
      INSERT INTO stories (id, name, description, event_background, dialogue_density, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      storyId,
      drama.name,
      drama.description,
      drama.event_background,
      3,
      drama.avatar,
      new Date().toISOString(),
      new Date().toISOString()
    );
    
    // 创建NPC
    for (const npc of drama.npcs) {
      db.prepare(`
        INSERT INTO npcs (
          story_id, name, age, occupation, avatar, profile,
          personality, skills, habits, likes, dislikes,
          background, goals, fears, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        storyId,
        npc.name,
        npc.age,
        npc.occupation,
        npc.avatar,
        npc.profile,
        npc.personality,
        npc.skills,
        npc.habits,
        npc.likes,
        npc.dislikes,
        npc.background,
        npc.goals,
        npc.fears,
        new Date().toISOString()
      );
    }
    
    console.log(`✅ ${drama.avatar} ${drama.name} (${drama.npcs.length}个角色)`);
    successCount++;
    
  } catch (error) {
    console.error(`❌ ${drama.name} 创建失败:`, error.message);
    failCount++;
  }
}

console.log('\n' + '━'.repeat(60));
console.log(`\n🎉 剧情创建完成！`);
console.log(`   ✅ 成功: ${successCount} 个`);
console.log(`   ❌ 失败: ${failCount} 个`);
console.log(`\n💡 访问应用查看: http://localhost:5001\n`);

db.close();

