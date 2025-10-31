import Database from 'better-sqlite3'
import { join } from 'path'

let db: Database.Database | null = null

export function getDB() {
  if (!db) {
    const dbPath = join(process.cwd(), 'data', 'app.db')
    db = new Database(dbPath)
    initDB()
  }
  return db
}

function initDB() {
  if (!db) return
  
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // 房间表
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      event_background TEXT NOT NULL,
      dialogue_density INTEGER DEFAULT 2,
      avatar TEXT DEFAULT '聊',
      creator_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `)
  
  // NPC角色表
  db.exec(`
    CREATE TABLE IF NOT EXISTS npcs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      profile TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    )
  `)
  
  // 房间成员表
  db.exec(`
    CREATE TABLE IF NOT EXISTS room_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      role_name TEXT,
      role_profile TEXT,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(room_id, user_id)
    )
  `)
  
  // 消息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      sender_id INTEGER,
      sender_name TEXT NOT NULL,
      avatar TEXT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    )
  `)
  
  // Session表（用于认证）
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
  
  // 数据库迁移：添加新字段
  try {
    // 检查 rooms 表是否有 event_background 字段
    const roomsInfo = db.pragma('table_info(rooms)')
    const hasEventBackground = roomsInfo.some((col: any) => col.name === 'event_background')
    const hasDialogueDensity = roomsInfo.some((col: any) => col.name === 'dialogue_density')
    const hasAvatar = roomsInfo.some((col: any) => col.name === 'avatar')
    
    if (!hasEventBackground) {
      console.log('📝 添加 event_background 字段...')
      db.exec(`ALTER TABLE rooms ADD COLUMN event_background TEXT DEFAULT ''`)
    }
    
    if (!hasDialogueDensity) {
      console.log('📝 添加 dialogue_density 字段...')
      db.exec(`ALTER TABLE rooms ADD COLUMN dialogue_density INTEGER DEFAULT 2`)
    }
    
    if (!hasAvatar) {
      console.log('📝 添加 avatar 字段...')
      db.exec(`ALTER TABLE rooms ADD COLUMN avatar TEXT DEFAULT '聊'`)
    }
    
    // 检查 users 表是否有 avatar 字段
    const usersInfo = db.pragma('table_info(users)')
    const usersHasAvatar = usersInfo.some((col: any) => col.name === 'avatar')
    
    if (!usersHasAvatar) {
      console.log('📝 添加 users.avatar 字段...')
      db.exec(`ALTER TABLE users ADD COLUMN avatar TEXT`)
    }
    
    // 检查 rooms 表是否有 preset_id 和 auto_mode 字段
    const hasPresetId = roomsInfo.some((col: any) => col.name === 'preset_id')
    const hasAutoMode = roomsInfo.some((col: any) => col.name === 'auto_mode')
    
    if (!hasPresetId) {
      console.log('📝 添加 preset_id 字段...')
      db.exec(`ALTER TABLE rooms ADD COLUMN preset_id TEXT`)
    }
    
    if (!hasAutoMode) {
      console.log('📝 添加 auto_mode 字段...')
      db.exec(`ALTER TABLE rooms ADD COLUMN auto_mode INTEGER DEFAULT 0`)
    }
    
    // 检查 room_members 表是否有 last_read_at 和 avatar 字段
    const membersInfo = db.pragma('table_info(room_members)')
    const hasLastReadAt = membersInfo.some((col: any) => col.name === 'last_read_at')
    const hasMemberAvatar = membersInfo.some((col: any) => col.name === 'avatar')
    
    if (!hasLastReadAt) {
      console.log('📝 添加 last_read_at 字段...')
      db.exec(`ALTER TABLE room_members ADD COLUMN last_read_at DATETIME`)
    }
    
    if (!hasMemberAvatar) {
      console.log('📝 添加 room_members.avatar 字段...')
      db.exec(`ALTER TABLE room_members ADD COLUMN avatar TEXT`)
    }
    
    // 初始化jerry测试用户
    const jerryUser = db.prepare('SELECT id FROM users WHERE username = ?').get('jerry')
    if (!jerryUser) {
      console.log('📝 创建jerry测试用户...')
      // password: 123123 的SHA256哈希
      db.prepare(`
        INSERT INTO users (username, nickname, password, avatar) 
        VALUES (?, ?, ?, ?)
      `).run('jerry', 'Jerry', '96cae35ce8a9b0244178bf28e4966c2ce1b8385723a96a6b838858cdd6ca0a1e', null)
    }
    
    // 创建stories表（用于创作工具）
    db.exec(`
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        event_background TEXT,
        dialogue_density INTEGER DEFAULT 2,
        avatar TEXT DEFAULT '📖',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 检查是否需要初始化预设剧情
    const storyCount = db.prepare('SELECT COUNT(*) as count FROM stories').get()
    if (storyCount && storyCount.count === 0) {
      console.log('📦 正在加载预设剧情...')
      initPresetStories(db)
    }
    
  } catch (error) {
    console.log('⚠️ 数据库迁移检查:', error)
  }
  
  console.log('✅ 数据库初始化完成')
}

// 初始化预设剧情（11个剧情，55个角色）
function initPresetStories(db: Database.Database) {
  const presetDramas = getPresetDramas()
  
  let totalStories = 0
  let totalNPCs = 0
  
  try {
    for (const drama of presetDramas) {
      const storyId = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      db.prepare(`
        INSERT INTO stories (id, name, description, event_background, dialogue_density, avatar)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(storyId, drama.name, drama.description, drama.event_background, 3, drama.avatar)
      
      totalStories++
      
      for (const npc of drama.npcs) {
        db.prepare(`
          INSERT INTO npcs (story_id, name, age, occupation, avatar, profile, personality, skills, habits, likes, dislikes, background, goals, fears)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          storyId, npc.name, npc.age, npc.occupation, npc.avatar, npc.profile,
          npc.personality, npc.skills, npc.habits, npc.likes, npc.dislikes,
          npc.background, npc.goals, npc.fears
        )
        totalNPCs++
      }
    }
    
    console.log(`✅ 成功加载 ${totalStories} 个剧情和 ${totalNPCs} 个角色`)
  } catch (error) {
    console.error('❌ 预设剧情加载失败:', error)
  }
}

// 获取预设剧情数据
function getPresetDramas() {
  return [
    {
      name: '绝命毒师：白先生的帝国',
      description: '化学老师变毒枭，权力、贪婪与救赎的故事',
      event_background: `高中化学老师Walter White被诊断出肺癌晚期，为了给家人留下足够的钱，他决定利用化学知识制造冰毒。`,
      avatar: '⚗️',
      npcs: [
        { name: 'Walter White', age: 50, occupation: '化学老师/毒枭', avatar: '👨‍🔬', profile: '高中化学老师，被诊断出癌症后开始制毒', personality: '聪明、骄傲、控制欲强', skills: '化学、策略、操纵', habits: '戴帽子、精确计算', likes: '权力、尊重', dislikes: '被看不起、失控', background: '曾是诺贝尔奖团队成员', goals: '为家人留钱，建立帝国', fears: '失去家庭、被抓' },
        { name: 'Jesse Pinkman', age: 25, occupation: '毒贩/助手', avatar: '😎', profile: 'Walter的前学生，小混混出身', personality: '冲动、善良、情绪化', skills: '制毒、街头智慧', habits: '说俚语、抽烟', likes: '自由、艺术', dislikes: 'Walter的操纵', background: '从逃课生到制毒搭档', goals: '逃离这个行业', fears: 'Walter、死亡' },
        { name: 'Skyler White', age: 45, occupation: '会计/家庭主妇', avatar: '👩', profile: 'Walter的妻子，逐渐发现秘密', personality: '聪明、坚强、实际', skills: '会计、洞察力', habits: '怀疑、记账', likes: '家庭安全、真相', dislikes: 'Walter的谎言', background: '全职家庭主妇', goals: '保护孩子', fears: '孩子受伤害' },
        { name: 'Hank Schrader', age: 48, occupation: 'DEA探员', avatar: '👮', profile: 'Walter的姐夫，追查"白先生"', personality: '正直、固执、幽默', skills: '调查、射击', habits: '收集矿石', likes: '正义、家庭', dislikes: '毒贩、失败', background: 'DEA资深探员', goals: '抓住"白先生"', fears: '发现真相' },
        { name: 'Saul Goodman', age: 42, occupation: '律师', avatar: '👔', profile: '不择手段的律师', personality: '圆滑、贪财、机智', skills: '法律、洗钱', habits: '做广告', likes: '金钱、赢得案子', dislikes: '暴力、失去客户', background: '小律师事务所', goals: '赚钱、活下去', fears: 'Walter的疯狂' }
      ]
    },
    {
      name: '甄嬛传：后宫风云',
      description: '清宫女性权力斗争',
      event_background: `雍正年间，甄嬛入宫选秀，后宫明争暗斗。`,
      avatar: '👑',
      npcs: [
        { name: '甄嬛', age: 17, occupation: '妃嫔', avatar: '👸', profile: '从单纯到腹黑', personality: '聪慧、坚韧', skills: '诗词、宫斗', habits: '观察细节', likes: '真情', dislikes: '背叛', background: '名门之女', goals: '保护家人', fears: '家族被害' },
        { name: '皇后', age: 35, occupation: '中宫皇后', avatar: '👸‍♀️', profile: '表面贤良实则阴狠', personality: '阴险、伪装', skills: '宫斗、下毒', habits: '装病', likes: '权力', dislikes: '甄嬛', background: '满门贵族', goals: '巩固后位', fears: '真相暴露' },
        { name: '华妃', age: 28, occupation: '妃嫔', avatar: '💃', profile: '骄横跋扈', personality: '骄傲、任性', skills: '舞蹈', habits: '炫耀', likes: '皇帝', dislikes: '被忽视', background: '年羹尧之妹', goals: '独占皇帝', fears: '失宠' },
        { name: '皇帝', age: 45, occupation: '雍正皇帝', avatar: '🤴', profile: '深情实则帝王心术', personality: '多疑、冷酷', skills: '帝王心术', habits: '试探', likes: '纯元', dislikes: '背叛', background: '九龙夺嫡登基', goals: '巩固皇权', fears: '政权不稳' },
        { name: '安陵容', age: 16, occupation: '妃嫔', avatar: '🎭', profile: '从闺蜜到背叛', personality: '自卑、善妒', skills: '唱曲、制香', habits: '讨好', likes: '被认可', dislikes: '自己的出身', background: '小官之女', goals: '获得宠爱', fears: '被揭穿' }
      ]
    }
  ]
}

export function closeDB() {
  if (db) {
    db.close()
    db = null
  }
}

