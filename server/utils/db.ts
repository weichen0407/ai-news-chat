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
      avatar TEXT,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_read_at DATETIME,
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
  
  // 好友关系表
  db.exec(`
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, friend_id)
    )
  `)
  
  // 朋友圈表
  db.exec(`
    CREATE TABLE IF NOT EXISTS moments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      npc_id INTEGER,
      author_type TEXT NOT NULL,
      content TEXT NOT NULL,
      images TEXT,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // 朋友圈点赞表
  db.exec(`
    CREATE TABLE IF NOT EXISTS moment_likes (
      moment_id INTEGER NOT NULL,
      user_id INTEGER,
      npc_id INTEGER,
      liker_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(moment_id, user_id, npc_id, liker_type)
    )
  `)
  
  // 朋友圈评论表
  db.exec(`
    CREATE TABLE IF NOT EXISTS moment_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      moment_id INTEGER NOT NULL,
      user_id INTEGER,
      npc_id INTEGER,
      commenter_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // 自动控制配置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS auto_control_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER DEFAULT 1,
      max_tokens_per_hour INTEGER DEFAULT 10000,
      max_tokens_per_day INTEGER DEFAULT 50000,
      require_online_users INTEGER DEFAULT 0,
      active_hours_start INTEGER DEFAULT 0,
      active_hours_end INTEGER DEFAULT 24,
      moments_enabled INTEGER DEFAULT 1,
      moments_post_interval INTEGER DEFAULT 7200,
      moments_comment_interval INTEGER DEFAULT 1800,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    
    // 检查 users 表是否有 signature 字段（个性签名）
    const usersHasSignature = usersInfo.some((col: any) => col.name === 'signature')
    
    if (!usersHasSignature) {
      console.log('📝 添加 users.signature 字段（个性签名）...')
      db.exec(`ALTER TABLE users ADD COLUMN signature TEXT DEFAULT ''`)
    }
    
    // 检查 room_members 表是否有 avatar 和 last_read_at 字段
    const roomMembersInfo = db.pragma('table_info(room_members)')
    const hasRoomMemberAvatar = roomMembersInfo.some((col: any) => col.name === 'avatar')
    const hasLastReadAt = roomMembersInfo.some((col: any) => col.name === 'last_read_at')
    
    if (!hasRoomMemberAvatar) {
      console.log('📝 添加 room_members.avatar 字段...')
      db.exec(`ALTER TABLE room_members ADD COLUMN avatar TEXT`)
    }
    
    if (!hasLastReadAt) {
      console.log('📝 添加 room_members.last_read_at 字段...')
      db.exec(`ALTER TABLE room_members ADD COLUMN last_read_at DATETIME`)
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
    
    // 检查 npcs 表是否有所有必需字段
    const npcsInfo = db.pragma('table_info(npcs)')
    const npcColumns = npcsInfo.map((col: any) => col.name)
    
    const requiredNpcColumns = [
      { name: 'persona', type: 'TEXT' },
      { name: 'personality', type: 'TEXT' },
      { name: 'habits', type: 'TEXT' },
      { name: 'skills', type: 'TEXT' },
      { name: 'likes', type: 'TEXT' },
      { name: 'dislikes', type: 'TEXT' },
      { name: 'age', type: 'INTEGER' },
      { name: 'occupation', type: 'TEXT' },
      { name: 'background', type: 'TEXT' },
      { name: 'goals', type: 'TEXT' },
      { name: 'fears', type: 'TEXT' }
    ]
    
    for (const col of requiredNpcColumns) {
      if (!npcColumns.includes(col.name)) {
        console.log(`📝 添加 npcs.${col.name} 字段...`)
        db.exec(`ALTER TABLE npcs ADD COLUMN ${col.name} ${col.type}`)
      }
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
  
  // 创建story_npcs表（用于存储剧情模板的NPC）
  db.exec(`
    CREATE TABLE IF NOT EXISTS story_npcs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id TEXT NOT NULL,
      name TEXT NOT NULL,
      age INTEGER,
      occupation TEXT,
      avatar TEXT,
      profile TEXT,
      personality TEXT,
      skills TEXT,
      habits TEXT,
      likes TEXT,
      dislikes TEXT,
      background TEXT,
      goals TEXT,
      fears TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
    )
  `)
    
    // 检查是否需要初始化预设剧情
    const storyCount = db.prepare('SELECT COUNT(*) as count FROM stories').get()
    if (storyCount && storyCount.count === 0) {
      console.log('📦 正在加载预设剧情...')
      console.log('💡 将在首次访问/creator页面时自动初始化全部11个剧情55个角色')
      console.log('   或访问 /api/creator/init-all-dramas 手动初始化')
    }
    
  } catch (error) {
    console.log('⚠️ 数据库迁移检查:', error)
  }
  
  // 迁移：为npcs表添加story_id和扩展字段
  try {
    const npcsColumns = db.prepare(`PRAGMA table_info(npcs)`).all()
    const columnNames = npcsColumns.map((col: any) => col.name)
    
    // 添加story_id字段（用于剧情模板）
    if (!columnNames.includes('story_id')) {
      db.exec(`ALTER TABLE npcs ADD COLUMN story_id TEXT`)
      console.log('✅ 已添加npcs.story_id字段')
    }
    
    // 添加扩展字段
    const newFields = [
      { name: 'age', type: 'INTEGER' },
      { name: 'occupation', type: 'TEXT' },
      { name: 'personality', type: 'TEXT' },
      { name: 'skills', type: 'TEXT' },
      { name: 'habits', type: 'TEXT' },
      { name: 'likes', type: 'TEXT' },
      { name: 'dislikes', type: 'TEXT' },
      { name: 'background', type: 'TEXT' },
      { name: 'goals', type: 'TEXT' },
      { name: 'fears', type: 'TEXT' }
    ]
    
    for (const field of newFields) {
      if (!columnNames.includes(field.name)) {
        db.exec(`ALTER TABLE npcs ADD COLUMN ${field.name} ${field.type}`)
        console.log(`✅ 已添加npcs.${field.name}字段`)
      }
    }
  } catch (error) {
    console.log('⚠️ npcs表迁移检查:', error)
  }
  
  console.log('✅ 数据库初始化完成')
}

export function closeDB() {
  if (db) {
    db.close()
    db = null
  }
}

