/**
 * 初始化预设剧情和NPC
 */
import { getDB } from '~/server/utils/db'

function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
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
      }
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
        message: '预设剧情已存在',
        count: existingCount 
      }
    }
    
    let totalStories = 0
    let totalNPCs = 0
    
    // 插入预设剧情和NPC
    for (const drama of dramas) {
      const storyId = generateId()
      
      db.prepare(`
        INSERT INTO stories (id, name, description, event_background, dialogue_density, avatar)
        VALUES (?, ?, ?, ?, ?, ?)
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
            background, goals, fears
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          npc.fears
        )
        
        totalNPCs++
      }
    }
    
    return {
      success: true,
      message: '预设剧情初始化成功',
      totalStories,
      totalNPCs
    }
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

