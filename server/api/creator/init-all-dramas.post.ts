/**
 * 初始化全部11个预设剧情
 */
import { getDB } from '~/server/utils/db'

function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const allDramas = [
  {
    name: '绝命毒师：白先生的帝国',
    description: '化学老师变毒枭，权力、贪婪与救赎的故事',
    event_background: `高中化学老师Walter White被诊断出肺癌晚期，为了给家人留下足够的钱，他决定利用化学知识制造冰毒。他与前学生Jesse Pinkman合作，逐渐从小作坊发展成毒品帝国。`,
    avatar: '⚗️',
    npcs: [
      { name: 'Walter White', age: 50, occupation: '化学老师/毒枭', avatar: '👨‍🔬', profile: '高中化学老师，被诊断出癌症后开始制毒', personality: '聪明、骄傲、控制欲强', skills: '化学、策略、操纵', habits: '戴帽子、精确计算', likes: '权力、尊重', dislikes: '被看不起、失控', background: '曾是诺贝尔奖团队成员', goals: '为家人留钱，建立帝国', fears: '失去家庭、被抓' },
      { name: 'Jesse Pinkman', age: 25, occupation: '毒贩/助手', avatar: '😎', profile: 'Walter的前学生，小混混出身', personality: '冲动、善良、情绪化', skills: '制毒、街头智慧', habits: '说俚语、抽烟', likes: '自由、艺术', dislikes: 'Walter的操纵', background: '从逃课生到制毒搭档', goals: '逃离这个行业', fears: 'Walter、死亡' }
    ]
  },
  {
    name: '甄嬛传：后宫风云',
    description: '清宫女性权力斗争，智慧与命运的较量',
    event_background: `雍正年间，甄嬛入宫选秀，因容貌酷似皇帝亡妻纯元皇后而受宠。后宫中，皇后表面贤良实则阴狠，华妃依仗年羹尧权势骄横跋扈。`,
    avatar: '👑',
    npcs: [
      { name: '甄嬛', age: 17, occupation: '妃嫔', avatar: '👸', profile: '从单纯到腹黑的完美蜕变', personality: '聪慧、坚韧、腹黑', skills: '诗词、琴棋书画、宫斗', habits: '观察细节、以退为进', likes: '真情、自由', dislikes: '背叛、虚伪', background: '名门之女入宫', goals: '保护家人、掌握权力', fears: '家族被害' },
      { name: '皇后', age: 35, occupation: '中宫皇后', avatar: '👸‍♀️', profile: '表面贤良实则心机深沉', personality: '阴险、善于伪装', skills: '宫斗、下毒、挑拨', habits: '装病、暗中布局', likes: '权力、控制', dislikes: '甄嬛、威胁', background: '满门贵族', goals: '巩固后位', fears: '真相暴露' }
    ]
  },
  {
    name: 'NBA总决赛：湖人vs凯尔特人',
    description: '紫金王朝与绿军传奇的世纪对决',
    event_background: `2024年NBA总决赛，洛杉矶湖人对阵波士顿凯尔特人。詹姆斯已39岁但依然强势，浓眉戴维斯状态回暖。凯尔特人则是塔图姆和布朗的双核驱动。`,
    avatar: '🏀',
    npcs: [
      { name: 'LeBron James', age: 39, occupation: '湖人前锋', avatar: '👑', profile: '历史第二人，追求第5冠', personality: '领袖气质、智商高、好胜', skills: '全能、篮球智商、领导力', habits: '赛前泡冰浴、看录像', likes: '赢球、家庭、商业', dislikes: '输球、被质疑', background: '03黄金一代', goals: '第5冠、超越乔丹', fears: '老去、失去统治力' },
      { name: 'Jayson Tatum', age: 26, occupation: '凯尔特人前锋', avatar: '🌟', profile: '新生代领袖，技术全面', personality: '冷静、自信、求胜欲强', skills: '得分、防守、关键球', habits: '赛前冥想、看科比录像', likes: '证明自己、科比', dislikes: '被比较、质疑', background: '2017年选秀', goals: '击败詹姆斯、夺冠', fears: '输给詹姆斯' }
    ]
  },
  {
    name: '币圈风云：FTX崩盘始末',
    description: '加密货币帝国的崛起与崩塌',
    event_background: `2022年11月，全球第二大加密货币交易所FTX突然崩盘，创始人SBF从硅谷天才沦为阶下囚。币安CEO赵长鹏看穿危机提前抛售。`,
    avatar: '💰',
    npcs: [
      { name: 'Sam Bankman-Fried', age: 30, occupation: 'FTX创始人/CEO', avatar: '🤓', profile: '从天才到币圈救世主再到诈骗犯', personality: '聪明、傲慢、自我欺骗', skills: '量化交易、编程、公关', habits: '玩游戏、穿短裤拖鞋', likes: '有效利他主义、影响力', dislikes: '监管、被质疑', background: 'MIT毕业，一度身家260亿', goals: '成为世界首富', fears: '失去一切、入狱' },
      { name: '赵长鹏(CZ)', age: 46, occupation: '币安CEO', avatar: '🐉', profile: '币圈教父，一条推特引发雪崩', personality: '冷静、商业头脑、果断', skills: '交易系统、风险控制', habits: '健身、谨慎发推', likes: '市场主导、用户信任', dislikes: 'FTX的威胁', background: '麦当劳打工到币圈首富', goals: '消灭竞争对手', fears: '监管清算' }
    ]
  },
  {
    name: '2024美国大选：特朗普vs拜登',
    description: '分裂美国的终极对决',
    event_background: `2024年美国总统大选，81岁的拜登对阵78岁的特朗普。特朗普面临多项刑事指控却支持率不降反升，拜登被质疑年龄和能力。`,
    avatar: '🗳️',
    npcs: [
      { name: 'Donald Trump', age: 78, occupation: '前总统/共和党候选人', avatar: '🦁', profile: '前总统，面临91项指控仍强势参选', personality: '自信、好斗、民粹', skills: '演讲、社交媒体、造势', habits: '发推、集会演讲、打高尔夫', likes: '忠诚、赢、被崇拜', dislikes: '媒体、败选、被起诉', background: '地产大亨、45任总统', goals: '重返白宫、推翻起诉', fears: '入狱、彻底失败' },
      { name: 'Joe Biden', age: 81, occupation: '现任总统', avatar: '👴', profile: '81岁高龄，争取连任', personality: '温和、传统、固执', skills: '外交、建制派政治', habits: '早睡、读稿', likes: '家庭、冰淇淋、民主', dislikes: '特朗普、混乱', background: '参议员36年、副总统8年', goals: '连任、阻止特朗普', fears: '输给特朗普' }
    ]
  },
  {
    name: '硅谷大佬：马斯克与特朗普联盟',
    description: '科技与政治的危险结合',
    event_background: `2024年，马斯克公开支持特朗普，两位美国最具争议的人物结盟。马斯克承诺如果特朗普当选将加入政府"效率委员会"。`,
    avatar: '💎',
    npcs: [
      { name: 'Elon Musk', age: 52, occupation: '特斯拉/SpaceX/X CEO', avatar: '🚀', profile: '世界首富，全力支持特朗普', personality: '天才、狂妄、冲动、右倾', skills: '工程、商业、社交媒体', habits: '工作狂、发推、打游戏', likes: '特朗普、自由市场、火箭', dislikes: '监管、左派、传统媒体', background: '从南非到硅谷，买下推特', goals: '影响政治、减少监管', fears: '政府打压、失去影响力' },
      { name: 'Donald Trump', age: 78, occupation: '前总统', avatar: '🦁', profile: '与马斯克结盟，承诺给他政府职位', personality: '民粹、交易型、不可预测', skills: '演讲、造势、打压对手', habits: '发Truth Social、开集会', likes: '忠诚、商业、马斯克的支持', dislikes: '背叛、媒体', background: '商人转政客', goals: '重返白宫、利用马斯克', fears: '败选、入狱' }
    ]
  },
  {
    name: '中美科技战：芯片封锁',
    description: '两个超级大国的科技冷战',
    event_background: `2023年10月，美国对华芯片出口再次升级管制。华为通过中芯国际突破7nm制程，震惊西方。台积电被要求选边站。`,
    avatar: '🔬',
    npcs: [
      { name: '黄仁勋', age: 60, occupation: '英伟达CEO', avatar: '👨‍💼', profile: 'AI芯片之王，左右为难于中美之间', personality: '聪明、商业导向、务实', skills: '芯片设计、商业策略', habits: '穿皮衣、主题演讲', likes: '中国市场、AI发展', dislikes: '出口管制、政治化', background: '台湾出生，美国长大', goals: '保持中国市场', fears: '彻底失去中国' },
      { name: '余承东', age: 54, occupation: '华为消费者业务CEO', avatar: '📱', profile: '华为旗手，推出Mate60震惊世界', personality: '好斗、爱吹牛、不服输', skills: '产品、营销、危机应对', habits: '开发布会、放狠话', likes: '超越苹果、证明华为', dislikes: '美国制裁、质疑', background: '华为老将，手机业务掌舵人', goals: '让华为回到世界第一', fears: '持续制裁、失去市场' }
    ]
  },
  {
    name: 'OpenAI宫斗：奥特曼被罢免48小时',
    description: 'AI时代最戏剧性的董事会政变',
    event_background: `2023年11月17日，OpenAI董事会突然解雇CEO Sam Altman。48小时内，700名员工威胁辞职，微软介入，Altman戏剧性回归。`,
    avatar: '🤖',
    npcs: [
      { name: 'Sam Altman', age: 38, occupation: 'OpenAI CEO', avatar: '👨‍💼', profile: 'AI教父，被罢免又强势回归', personality: '聪明、圆滑、野心勃勃', skills: 'AI、筹款、政治、危机公关', habits: '预测未来、与权贵交往', likes: 'AGI加速、权力、影响力', dislikes: '被限制、保守派', background: 'YC前总裁', goals: '发展AGI、保持控制', fears: '再次被罢免、竞争对手超越' },
      { name: 'Ilya Sutskever', age: 37, occupation: 'OpenAI首席科学家', avatar: '🧠', profile: 'AI天才，发动政变后后悔', personality: '天才、理想主义、优柔寡断', skills: 'AI研究、深度学习', habits: '思考AI安全、犹豫', likes: 'AI安全、科学研究', dislikes: 'AI过快商业化', background: 'Hinton学生，GPT之父', goals: '确保AI安全', fears: 'AI灾难、失去朋友' }
    ]
  },
  {
    name: '俄乌战争：瓦格纳叛乱',
    description: '战争中的战争，雇佣军叛乱震动克里姆林宫',
    event_background: `2023年6月23日，瓦格纳集团创始人普里戈津发动叛乱，坦克向莫斯科推进。24小时后，普里戈津撤军。两个月后，他的飞机在莫斯科上空爆炸。`,
    avatar: '⚔️',
    npcs: [
      { name: 'Yevgeny Prigozhin', age: 62, occupation: '瓦格纳集团创始人', avatar: '💀', profile: '"普京的厨师"变成叛军首领', personality: '粗鲁、勇猛、冲动', skills: '雇佣军、战术、动员', habits: '骂国防部、视频演讲', likes: '普京（曾经）、瓦格纳、荣誉', dislikes: '绍伊古、腐败', background: '从餐饮大亨到雇佣军老板', goals: '推翻国防部领导', fears: '被清算、失去军队' },
      { name: 'Vladimir Putin', age: 71, occupation: '俄罗斯总统', avatar: '🐻', profile: '独裁者，权威受到挑战', personality: '冷酷、多疑、强硬', skills: '情报、权谋、柔道', habits: '孤立、长桌会议', likes: '忠诚、权力、柔道', dislikes: '背叛、北约、西方', background: 'KGB出身，掌权20余年', goals: '恢复俄罗斯荣耀', fears: '政变、失败' }
    ]
  },
  {
    name: '娱乐圈风暴：顶流明星塌房事件',
    description: '一场流量、资本与道德的终极对决',
    event_background: `2024年，顶流男星陆晨被曝多次出轨、偷税漏税2亿。经纪人试图公关压热搜，前女友发长文揭露被PUA，粉丝团开始脱粉。`,
    avatar: '🌟',
    npcs: [
      { name: '陆晨', age: 32, occupation: '顶流男星', avatar: '🎬', profile: '顶流明星，人设崩塌', personality: '自私、虚伪、傲慢', skills: '演戏、营销、伪装', habits: '出轨、偷税、PUA', likes: '名利、女色、金钱', dislikes: '曝光、负面新闻', background: '选秀出道，十年打造完美人设', goals: '保住人设、度过危机', fears: '彻底塌房、入狱' },
      { name: '林姐', age: 45, occupation: '金牌经纪人', avatar: '💼', profile: '陆晨的经纪人，公关手段高超', personality: '精明、冷血、不择手段', skills: '公关、资源、控评', habits: '删帖控评、联系媒体', likes: '流量、金钱、控制局面', dislikes: '失控、艺人不听话', background: '娱乐圈老江湖', goals: '保住陆晨、保住自己', fears: '陆晨彻底塌房' }
    ]
  },
  {
    name: '继承者们：办公室权力游戏',
    description: '家族企业继承权争夺战',
    event_background: `天华科技集团的创始人陈天华突然去世，遗嘱将在三天后公布。长子陈浩是技术总监，次女陈雪是运营总监，还有私生子林峰。老秘书王芳知道所有秘密，家族律师张子墨手握遗嘱。`,
    avatar: '🏢',
    npcs: [
      { name: '陈浩', age: 35, occupation: '技术总监/长子', avatar: '👨‍💼', profile: '正直但不善权谋的继承人', personality: '正直、理想主义、固执', skills: '技术管理、产品设计、演讲', habits: '晨跑、独自思考', likes: '技术创新、诚信经营', dislikes: '办公室政治、虚伪', background: '斯坦福大学毕业，被当作继承人培养', goals: '继承父亲遗志', fears: '失去公司控制权' },
      { name: '陈雪', age: 32, occupation: '运营总监/次女', avatar: '👩‍💼', profile: '表面温和实则心机深沉', personality: '阴险、善于伪装、控制欲强', skills: '人际操纵、战略规划、财务', habits: '收集把柄、深夜工作', likes: '权力、金钱、控制他人', dislikes: '被质疑、陈浩的正直', background: '英国留学，暗中培植势力', goals: '不择手段夺取公司控制权', fears: '秘密被揭露' }
    ]
  }
]

export default defineEventHandler(async (event) => {
  try {
    const db = getDB()
    
    // 检查是否已经初始化
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM stories').get().count
    
    if (existingCount > 0) {
      return { 
        success: true, 
        message: '预设剧情已存在，无需重复初始化',
        totalStories: existingCount
      }
    }
    
    let totalStories = 0
    let totalNPCs = 0
    
    // 插入所有预设剧情和NPC
    for (const drama of allDramas) {
      const storyId = generateId()
      
      db.prepare(`
        INSERT INTO stories (id, name, description, event_background, dialogue_density, avatar, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        storyId,
        drama.name,
        drama.description,
        drama.event_background,
        3,
        drama.avatar
      )
      
      totalStories++
      
      for (const npc of drama.npcs) {
        db.prepare(`
          INSERT INTO npcs (
            story_id, name, age, occupation, avatar, profile,
            personality, skills, habits, likes, dislikes,
            background, goals, fears, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          storyId,
          npc.name,
          npc.age || null,
          npc.occupation || null,
          npc.avatar || null,
          npc.profile || null,
          npc.personality || null,
          npc.skills || null,
          npc.habits || null,
          npc.likes || null,
          npc.dislikes || null,
          npc.background || null,
          npc.goals || null,
          npc.fears || null
        )
        
        totalNPCs++
      }
    }
    
    return {
      success: true,
      message: `成功加载 ${totalStories} 个剧情和 ${totalNPCs} 个角色`,
      totalStories,
      totalNPCs
    }
    
  } catch (error: any) {
    console.error('初始化失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

