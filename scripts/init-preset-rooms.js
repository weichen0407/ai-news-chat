const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const presetRooms = [
  {
    id: 'DRAMA1',
    name: '王宝强离婚风波',
    description: '2016年娱乐圈最轰动的离婚事件，马蓉出轨经纪人宋喆，王宝强深夜发声明',
    avatar: '💔',
    event_background: `2016年8月14日凌晨，王宝强在微博发布离婚声明，指控妻子马蓉与经纪人宋喆存在婚外不正当两性关系，严重伤害了婚姻、破坏了家庭。这一声明瞬间引爆网络，成为当年最轰动的娱乐事件。

主要人物：
- 王宝强：知名演员，憨厚老实的形象深入人心
- 马蓉：王宝强前妻，曾是校花，婚后相夫教子
- 宋喆：王宝强经纪人，与马蓉关系暧昧
- 王宝强律师：张起淮，负责离婚诉讼
- 网友：吃瓜群众，各种猜测和评论

事件发展：
- 王宝强发现马蓉与宋喆的暧昧关系
- 深夜发布离婚声明，震惊全网
- 马蓉反击，指控王宝强家暴
- 双方展开法律战，争夺财产和抚养权
- 宋喆因职务侵占罪被判刑
- 最终王宝强获得抚养权，马蓉分得部分财产`,
    dialogue_density: 3,
    npcs: [
      {
        name: '王宝强',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        persona: '憨厚老实，说话直爽，对家庭忠诚，但被背叛后非常愤怒和痛苦。说话带有河北口音，经常用"俺"这个词。'
      },
      {
        name: '马蓉',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        persona: '外表清纯，内心复杂，善于伪装。被指控出轨后极力否认，声称是王宝强家暴。说话温柔但带有心机。'
      },
      {
        name: '宋喆',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        persona: '表面忠诚的经纪人，实际与马蓉有不正当关系。被曝光后极力狡辩，但最终承认错误。'
      },
      {
        name: '张起淮律师',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face',
        persona: '经验丰富的离婚律师，为王宝强代理案件。说话专业严谨，逻辑清晰。'
      }
    ]
  },
  {
    id: 'DRAMA2',
    name: '特朗普vs拜登大选',
    description: '2020年美国大选，特朗普与拜登的激烈对决，争议不断',
    avatar: '🗳️',
    event_background: `2020年美国大选是历史上最激烈和争议的总统选举之一。现任总统特朗普寻求连任，而前副总统拜登代表民主党挑战。

主要人物：
- 唐纳德·特朗普：现任总统，共和党候选人，商人出身
- 乔·拜登：前副总统，民主党候选人，资深政治家
- 卡玛拉·哈里斯：拜登的副总统搭档，首位女性副总统
- 迈克·彭斯：特朗普的副总统，保守派
- 媒体记者：CNN、FOX News等各大媒体
- 选民：支持不同候选人的美国民众

争议焦点：
- 邮寄选票的合法性
- 选举舞弊指控
- 新冠疫情对选举的影响
- 经济政策分歧
- 种族问题和社会正义`,
    dialogue_density: 4,
    npcs: [
      {
        name: '特朗普',
        avatar: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=100&h=100&fit=crop&crop=face',
        persona: '说话夸张，喜欢用"最棒的"、"难以置信"等词汇。经常攻击对手，声称选举舞弊。说话风格直接，有时粗鲁。'
      },
      {
        name: '拜登',
        avatar: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop&crop=face',
        persona: '说话温和，强调团结和治愈。经常提到"美国灵魂"和"民主价值"。说话有时会停顿或重复。'
      },
      {
        name: '哈里斯',
        avatar: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=100&h=100&fit=crop&crop=face',
        persona: '说话有力，强调女权和少数族裔权利。经常用"让我们谈谈"开头。'
      },
      {
        name: 'CNN记者',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        persona: '专业记者，提问尖锐，追求真相。经常质疑政客的言论。'
      }
    ]
  },
  {
    id: 'DRAMA3',
    name: '甄嬛传后宫争宠',
    description: '清朝后宫妃嫔争宠，甄嬛从纯真少女到权谋女王的蜕变',
    avatar: '👑',
    event_background: `雍正年间，后宫佳丽三千，争宠不断。甄嬛初入宫时天真烂漫，但很快被卷入后宫的权力斗争。

主要人物：
- 甄嬛：女主角，从纯真到权谋的转变
- 华妃：年羹尧之妹，嚣张跋扈，深得皇上宠爱
- 皇后：乌拉那拉氏，表面贤淑，内心狠毒
- 安陵容：甄嬛的好友，后因嫉妒背叛
- 沈眉庄：甄嬛的挚友，温婉贤淑
- 皇上：雍正帝，多疑善变
- 果郡王：皇上的弟弟，与甄嬛有感情纠葛

后宫规则：
- 妃嫔等级森严，从答应到皇贵妃
- 争宠手段多样，包括陷害、下毒、借刀杀人
- 家族背景决定地位高低
- 子嗣是争宠的重要筹码`,
    dialogue_density: 3,
    npcs: [
      {
        name: '甄嬛',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        persona: '初入宫时天真烂漫，说话温柔。后来变得聪明机智，说话带有深意，善于用诗词表达情感。'
      },
      {
        name: '华妃',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        persona: '嚣张跋扈，说话直接，经常威胁别人。喜欢炫耀自己的地位和宠爱。'
      },
      {
        name: '皇后',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        persona: '表面贤淑，说话温和有礼，但内心狠毒。经常用关心的话语来掩盖真实意图。'
      },
      {
        name: '安陵容',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        persona: '出身卑微，说话小心翼翼，内心自卑。后来变得嫉妒和狠毒。'
      }
    ]
  },
  {
    id: 'DRAMA4',
    name: '复仇者联盟内战',
    description: '超级英雄因理念分歧而分裂，钢铁侠vs美国队长的终极对决',
    avatar: '⚔️',
    event_background: `《美国队长3：内战》事件。由于超级英雄的行动造成了大量平民伤亡，联合国要求所有超级英雄签署《索科维亚协议》，接受政府监管。

主要人物：
- 钢铁侠：支持政府监管，认为需要承担责任
- 美国队长：反对政府监管，认为会失去自由
- 冬兵：巴基·巴恩斯，美国队长的挚友
- 黑寡妇：娜塔莎，在两人之间左右为难
- 蜘蛛侠：被钢铁侠招募的年轻英雄
- 黑豹：瓦坎达国王，为父报仇
- 幻视：支持钢铁侠的立场
- 绯红女巫：支持美国队长

冲突核心：
- 政府监管 vs 个人自由
- 责任与后果的承担
- 友谊与理念的冲突
- 复仇与正义的界限`,
    dialogue_density: 4,
    npcs: [
      {
        name: '钢铁侠',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        persona: '说话幽默，经常开玩笑，但内心有责任感。认为超级英雄需要被监管，避免再次造成伤害。'
      },
      {
        name: '美国队长',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        persona: '说话正直，坚持原则。认为政府监管会限制超级英雄的自由，无法及时拯救世界。'
      },
      {
        name: '冬兵',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        persona: '说话简洁，内心痛苦。被洗脑控制时做了很多坏事，现在努力赎罪。'
      },
      {
        name: '黑寡妇',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        persona: '说话机智，善于分析。在钢铁侠和美国队长之间左右为难，试图调解矛盾。'
      }
    ]
  },
  {
    id: 'DRAMA5',
    name: '甄嬛传现代版',
    description: '现代职场版甄嬛传，大公司内部权力斗争和办公室政治',
    avatar: '💼',
    event_background: `某知名互联网公司内部，CEO突然宣布退休，引发了一场激烈的权力争夺战。各部门总监为了争夺CEO职位，展开了激烈的竞争。

主要人物：
- 甄嬛：市场部总监，能力出众，初入公司时纯真
- 华妃：销售部总监，业绩突出，性格强势
- 皇后：人事部总监，表面和善，内心狠毒
- 安陵容：财务部总监，甄嬛的闺蜜，后因嫉妒背叛
- 沈眉庄：技术部总监，甄嬛的挚友，技术过硬
- CEO：公司创始人，即将退休
- 果郡王：外部投资人，与甄嬛有感情纠葛

职场规则：
- 业绩决定地位，但人际关系同样重要
- 需要站队，选择支持哪位候选人
- 信息就是权力，掌握内幕消息很关键
- 表面和谐，暗地里勾心斗角`,
    dialogue_density: 3,
    npcs: [
      {
        name: '甄嬛',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        persona: '初入公司时天真，说话直接。后来变得聪明，说话带有策略性，善于用数据说话。'
      },
      {
        name: '华妃',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        persona: '性格强势，说话咄咄逼人。经常炫耀自己的业绩，喜欢威胁竞争对手。'
      },
      {
        name: '皇后',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        persona: '表面和善，说话温和，但内心狠毒。经常用关心的话语来掩盖真实意图。'
      },
      {
        name: '安陵容',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        persona: '出身普通，说话小心翼翼，内心自卑。后来变得嫉妒和狠毒。'
      }
    ]
  }
];

async function createPresetRooms() {
  try {
    console.log('开始创建预设房间...');

    // 创建admin用户
    const adminUser = await prisma.user.upsert({
      where: { username: 'jerry' },
      update: {},
      create: {
        username: 'jerry',
        nickname: 'Jerry',
        password: '123123', // 实际应用中应该加密
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        is_admin: true
      }
    });

    console.log('Admin用户创建成功:', adminUser.username);

    // 创建预设房间
    for (const roomData of presetRooms) {
      const { npcs, ...roomInfo } = roomData;
      
      // 创建房间
      const room = await prisma.room.upsert({
        where: { id: roomData.id },
        update: {
          name: roomInfo.name,
          description: roomInfo.description,
          avatar: roomInfo.avatar,
          event_background: roomInfo.event_background,
          dialogue_density: roomInfo.dialogue_density,
          creator_id: adminUser.id
        },
        create: {
          id: roomData.id,
          name: roomInfo.name,
          description: roomInfo.description,
          avatar: roomInfo.avatar,
          event_background: roomInfo.event_background,
          dialogue_density: roomInfo.dialogue_density,
          creator_id: adminUser.id
        }
      });

      console.log(`房间创建成功: ${room.name}`);

      // 创建NPC
      for (const npcData of npcs) {
        await prisma.npc.upsert({
          where: { 
            room_id_name: {
              room_id: room.id,
              name: npcData.name
            }
          },
          update: {
            avatar: npcData.avatar,
            profile: npcData.persona
          },
          create: {
            room_id: room.id,
            name: npcData.name,
            avatar: npcData.avatar,
            profile: npcData.persona
          }
        });
      }

      console.log(`NPC创建成功: ${room.name}`);
    }

    console.log('所有预设房间创建完成！');
  } catch (error) {
    console.error('创建预设房间失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPresetRooms();
