import { getDB } from "~/server/utils/db";

export default defineEventHandler(async (event) => {
  try {
    console.log("开始初始化预设房间...");

    const db = getDB();

    // 创建admin用户
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (username, nickname, password, avatar, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const adminUser = insertUser.run('jerry', 'Jerry', '123123', 
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      new Date().toISOString()
    );

    console.log("Admin用户创建成功");

    // 获取admin用户ID
    const getUser = db.prepare('SELECT id FROM users WHERE username = ?');
    const user = getUser.get('jerry');

    if (!user) {
      throw new Error('无法创建admin用户');
    }

    // 创建预设房间
    const insertRoom = db.prepare(`
      INSERT OR IGNORE INTO rooms (id, name, description, avatar, event_background, dialogue_density, creator_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertNpc = db.prepare(`
      INSERT OR IGNORE INTO npcs (room_id, name, avatar, profile, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMember = db.prepare(`
      INSERT OR IGNORE INTO room_members (room_id, user_id, role_name, role_profile, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();

    // 王宝强离婚风波
    insertRoom.run('DRAMA1', '王宝强离婚风波', '2016年娱乐圈最轰动的离婚事件', '💔', 
      `2016年8月14日凌晨，王宝强在微博发布离婚声明，指控妻子马蓉与经纪人宋喆存在婚外不正当两性关系，严重伤害了婚姻、破坏了家庭。这一声明瞬间引爆网络，成为当年最轰动的娱乐事件。

主要人物：
- 王宝强：知名演员，憨厚老实的形象深入人心
- 马蓉：王宝强前妻，曾是校花，婚后相夫教子
- 宋喆：王宝强经纪人，与马蓉关系暧昧
- 王宝强律师：张起淮，负责离婚诉讼

事件发展：
- 王宝强发现马蓉与宋喆的暧昧关系
- 深夜发布离婚声明，震惊全网
- 马蓉反击，指控王宝强家暴
- 双方展开法律战，争夺财产和抚养权
- 宋喆因职务侵占罪被判刑
- 最终王宝强获得抚养权，马蓉分得部分财产`, 3, user.id, now);
    
    insertNpc.run('DRAMA1', '王宝强', 
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      '憨厚老实，说话直爽，对家庭忠诚，但被背叛后非常愤怒和痛苦。说话带有河北口音，经常用"俺"这个词。', now);
    
    insertNpc.run('DRAMA1', '马蓉', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '外表清纯，内心复杂，善于伪装。被指控出轨后极力否认，声称是王宝强家暴。说话温柔但带有心机。', now);
    
    insertNpc.run('DRAMA1', '宋喆', 
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      '表面忠诚的经纪人，实际与马蓉有不正当关系。被曝光后极力狡辩，但最终承认错误。', now);
    
    insertNpc.run('DRAMA1', '张起淮律师', 
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face',
      '经验丰富的离婚律师，为王宝强代理案件。说话专业严谨，逻辑清晰。', now);
    
    insertMember.run('DRAMA1', user.id, '群主', '房间创建者和管理员', now);

    // 特朗普vs拜登大选
    insertRoom.run('DRAMA2', '特朗普vs拜登大选', '2020年美国大选激烈对决', '🗳️', 
      `2020年美国大选是历史上最激烈和争议的总统选举之一。现任总统特朗普寻求连任，而前副总统拜登代表民主党挑战。

主要人物：
- 唐纳德·特朗普：现任总统，共和党候选人，商人出身
- 乔·拜登：前副总统，民主党候选人，资深政治家
- 卡玛拉·哈里斯：拜登的副总统搭档，首位女性副总统
- CNN记者：专业记者，提问尖锐，追求真相

争议焦点：
- 邮寄选票的合法性
- 选举舞弊指控
- 新冠疫情对选举的影响
- 经济政策分歧
- 种族问题和社会正义`, 4, user.id, now);
    
    insertNpc.run('DRAMA2', '特朗普', 
      'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=100&h=100&fit=crop&crop=face',
      '说话夸张，喜欢用"最棒的"、"难以置信"等词汇。经常攻击对手，声称选举舞弊。说话风格直接，有时粗鲁。', now);
    
    insertNpc.run('DRAMA2', '拜登', 
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop&crop=face',
      '说话温和，强调团结和治愈。经常提到"美国灵魂"和"民主价值"。说话有时会停顿或重复。', now);
    
    insertNpc.run('DRAMA2', '哈里斯', 
      'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=100&h=100&fit=crop&crop=face',
      '说话有力，强调女权和少数族裔权利。经常用"让我们谈谈"开头。', now);
    
    insertNpc.run('DRAMA2', 'CNN记者', 
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      '专业记者，提问尖锐，追求真相。经常质疑政客的言论。', now);
    
    insertMember.run('DRAMA2', user.id, '群主', '房间创建者和管理员', now);

    // 甄嬛传后宫争宠
    insertRoom.run('DRAMA3', '甄嬛传后宫争宠', '清朝后宫妃嫔争宠大戏', '👑', 
      `雍正年间，后宫佳丽三千，争宠不断。甄嬛初入宫时天真烂漫，但很快被卷入后宫的权力斗争。

主要人物：
- 甄嬛：女主角，从纯真到权谋的转变
- 华妃：年羹尧之妹，嚣张跋扈，深得皇上宠爱
- 皇后：乌拉那拉氏，表面贤淑，内心狠毒
- 安陵容：甄嬛的好友，后因嫉妒背叛

后宫规则：
- 妃嫔等级森严，从答应到皇贵妃
- 争宠手段多样，包括陷害、下毒、借刀杀人
- 家族背景决定地位高低
- 子嗣是争宠的重要筹码`, 3, user.id, now);
    
    insertNpc.run('DRAMA3', '甄嬛', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '初入宫时天真烂漫，说话温柔。后来变得聪明机智，说话带有深意，善于用诗词表达情感。', now);
    
    insertNpc.run('DRAMA3', '华妃', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '嚣张跋扈，说话直接，经常威胁别人。喜欢炫耀自己的地位和宠爱。', now);
    
    insertNpc.run('DRAMA3', '皇后', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '表面贤淑，说话温和有礼，但内心狠毒。经常用关心的话语来掩盖真实意图。', now);
    
    insertNpc.run('DRAMA3', '安陵容', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '出身卑微，说话小心翼翼，内心自卑。后来变得嫉妒和狠毒。', now);
    
    insertMember.run('DRAMA3', user.id, '群主', '房间创建者和管理员', now);

    // 复仇者联盟内战
    insertRoom.run('DRAMA4', '复仇者联盟内战', '超级英雄因理念分歧而分裂', '⚔️', 
      `《美国队长3：内战》事件。由于超级英雄的行动造成了大量平民伤亡，联合国要求所有超级英雄签署《索科维亚协议》，接受政府监管。

主要人物：
- 钢铁侠：支持政府监管，认为需要承担责任
- 美国队长：反对政府监管，认为会失去自由
- 冬兵：巴基·巴恩斯，美国队长的挚友
- 黑寡妇：娜塔莎，在两人之间左右为难

冲突核心：
- 政府监管 vs 个人自由
- 责任与后果的承担
- 友谊与理念的冲突
- 复仇与正义的界限`, 4, user.id, now);
    
    insertNpc.run('DRAMA4', '钢铁侠', 
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      '说话幽默，经常开玩笑，但内心有责任感。认为超级英雄需要被监管，避免再次造成伤害。', now);
    
    insertNpc.run('DRAMA4', '美国队长', 
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      '说话正直，坚持原则。认为政府监管会限制超级英雄的自由，无法及时拯救世界。', now);
    
    insertNpc.run('DRAMA4', '冬兵', 
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      '说话简洁，内心痛苦。被洗脑控制时做了很多坏事，现在努力赎罪。', now);
    
    insertNpc.run('DRAMA4', '黑寡妇', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '说话机智，善于分析。在钢铁侠和美国队长之间左右为难，试图调解矛盾。', now);
    
    insertMember.run('DRAMA4', user.id, '群主', '房间创建者和管理员', now);

    // 甄嬛传现代版
    insertRoom.run('DRAMA5', '甄嬛传现代版', '现代职场版甄嬛传', '💼', 
      `某知名互联网公司内部，CEO突然宣布退休，引发了一场激烈的权力争夺战。各部门总监为了争夺CEO职位，展开了激烈的竞争。

主要人物：
- 甄嬛：市场部总监，能力出众，初入公司时纯真
- 华妃：销售部总监，业绩突出，性格强势
- 皇后：人事部总监，表面和善，内心狠毒
- 安陵容：财务部总监，甄嬛的闺蜜，后因嫉妒背叛

职场规则：
- 业绩决定地位，但人际关系同样重要
- 需要站队，选择支持哪位候选人
- 信息就是权力，掌握内幕消息很关键
- 表面和谐，暗地里勾心斗角`, 3, user.id, now);
    
    insertNpc.run('DRAMA5', '甄嬛', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '初入公司时天真，说话直接。后来变得聪明，说话带有策略性，善于用数据说话。', now);
    
    insertNpc.run('DRAMA5', '华妃', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '性格强势，说话咄咄逼人。经常炫耀自己的业绩，喜欢威胁竞争对手。', now);
    
    insertNpc.run('DRAMA5', '皇后', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '表面和善，说话温和，但内心狠毒。经常用关心的话语来掩盖真实意图。', now);
    
    insertNpc.run('DRAMA5', '安陵容', 
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      '出身普通，说话小心翼翼，内心自卑。后来变得嫉妒和狠毒。', now);
    
    insertMember.run('DRAMA5', user.id, '群主', '房间创建者和管理员', now);

    console.log("所有预设房间创建完成！");

    return {
      success: true,
      message: "预设房间初始化成功",
      rooms: ['王宝强离婚风波', '特朗普vs拜登大选', '甄嬛传后宫争宠', '复仇者联盟内战', '甄嬛传现代版']
    };
  } catch (error) {
    console.error("初始化预设房间失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
});
