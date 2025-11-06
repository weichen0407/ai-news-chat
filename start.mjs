// 启动脚本 - 在Nuxt启动前初始化数据库
import Database from 'better-sqlite3'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'
import { importInitialData } from './import-initial-data.mjs'

console.log('🚀 开始初始化...')
console.log('当前工作目录:', process.cwd())
console.log('环境变量检查:')
console.log('- DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '✓ 已设置 (前10字符: ' + process.env.DEEPSEEK_API_KEY.substring(0, 10) + '...)' : '✗ 未设置')
console.log('- SESSION_SECRET:', process.env.SESSION_SECRET ? '✓ 已设置' : '✗ 未设置')
console.log('- PORT:', process.env.PORT || '3000')
console.log('- HOST:', process.env.HOST || '0.0.0.0')

// 验证API密钥格式
if (!process.env.DEEPSEEK_API_KEY) {
  console.error('❌ 致命错误: DEEPSEEK_API_KEY 环境变量未设置！')
  process.exit(1)
}
if (!process.env.DEEPSEEK_API_KEY.startsWith('sk-')) {
  console.error('❌ 致命错误: DEEPSEEK_API_KEY 格式不正确，应该以 sk- 开头')
  process.exit(1)
}
console.log('✅ API密钥格式验证通过')

try {
  // 创建data目录
  const dataDir = join(process.cwd(), 'data')
  console.log('📁 数据目录路径:', dataDir)
  
  if (!existsSync(dataDir)) {
    console.log('创建data目录...')
    mkdirSync(dataDir, { recursive: true })
  }
  
  // 初始化主数据库 (app.db)
  const dbPath = join(dataDir, 'app.db')
  console.log('💾 主数据库路径:', dbPath)
  console.log('初始化主数据库...')
  
  const db = new Database(dbPath)
  console.log('✅ 主数据库连接成功')
  
  // 测试写入
  db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)')
  console.log('✅ 主数据库写入测试成功')
  
  // 导入初始数据（如果是首次启动）
  importInitialData(db)
  
  db.close()
  
  // 初始化朋友圈数据库 (chat.db)
  const chatDbPath = join(dataDir, 'chat.db')
  console.log('💾 朋友圈数据库路径:', chatDbPath)
  console.log('初始化朋友圈数据库...')
  
  const chatDb = new Database(chatDbPath)
  console.log('✅ 朋友圈数据库连接成功')
  
  // 创建朋友圈相关表（与 server/utils/db-moments.ts 保持一致）
  chatDb.exec(`
    CREATE TABLE IF NOT EXISTS moments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT,
      user_id INTEGER,
      npc_id INTEGER,
      content TEXT NOT NULL,
      images TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  chatDb.exec(`
    CREATE TABLE IF NOT EXISTS moment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      moment_id INTEGER NOT NULL,
      user_id INTEGER,
      npc_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(moment_id, user_id, npc_id)
    )
  `)
  
  chatDb.exec(`
    CREATE TABLE IF NOT EXISTS moment_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      moment_id INTEGER NOT NULL,
      user_id INTEGER,
      npc_id INTEGER,
      reply_to_user_id INTEGER,
      reply_to_npc_id INTEGER,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  chatDb.exec(`
    CREATE TABLE IF NOT EXISTS moment_read_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      room_id TEXT NOT NULL,
      last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, room_id)
    )
  `)
  
  chatDb.exec(`
    CREATE TABLE IF NOT EXISTS moment_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      moment_id INTEGER,
      actor_id INTEGER,
      actor_type TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  console.log('✅ 朋友圈表结构创建完成')
  
  // 数据库迁移：检查并添加缺失的字段
  try {
    const momentsInfo = chatDb.pragma('table_info(moments)')
    const hasRoomId = momentsInfo.some(col => col.name === 'room_id')
    
    if (!hasRoomId) {
      console.log('⚠️  检测到 moments 表缺少 room_id 字段，正在添加...')
      chatDb.exec(`ALTER TABLE moments ADD COLUMN room_id TEXT`)
      console.log('✅ room_id 字段添加成功')
    } else {
      // 检查 room_id 是否有 NOT NULL 约束
      const roomIdCol = momentsInfo.find(col => col.name === 'room_id')
      if (roomIdCol && roomIdCol.notnull === 1) {
        console.log('⚠️  检测到 room_id 有 NOT NULL 约束，需要移除约束...')
        // SQLite 不支持直接修改约束，需要重建表
        chatDb.exec(`
          BEGIN TRANSACTION;
          
          -- 创建新表（room_id 允许 NULL）
          CREATE TABLE moments_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT,
            user_id INTEGER,
            npc_id INTEGER,
            content TEXT NOT NULL,
            images TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          
          -- 复制数据
          INSERT INTO moments_new (id, room_id, user_id, npc_id, content, images, created_at)
          SELECT id, room_id, user_id, npc_id, content, images, created_at FROM moments;
          
          -- 删除旧表
          DROP TABLE moments;
          
          -- 重命名新表
          ALTER TABLE moments_new RENAME TO moments;
          
          COMMIT;
        `)
        console.log('✅ room_id NOT NULL 约束已移除')
      }
    }
    
    // 检查 moment_likes 表结构
    const likesInfo = chatDb.pragma('table_info(moment_likes)')
    const likesHasId = likesInfo.some(col => col.name === 'id')
    
    if (!likesHasId) {
      console.log('⚠️  moment_likes 表结构需要更新，正在重建...')
      chatDb.exec(`
        DROP TABLE IF EXISTS moment_likes_old;
        ALTER TABLE moment_likes RENAME TO moment_likes_old;
        CREATE TABLE moment_likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          moment_id INTEGER NOT NULL,
          user_id INTEGER,
          npc_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(moment_id, user_id, npc_id)
        );
        INSERT INTO moment_likes (moment_id, user_id, npc_id, created_at)
        SELECT moment_id, user_id, npc_id, created_at FROM moment_likes_old;
        DROP TABLE moment_likes_old;
      `)
      console.log('✅ moment_likes 表更新完成')
    }
    
    // 检查 moment_comments 表是否有 reply_to 字段
    const commentsInfo = chatDb.pragma('table_info(moment_comments)')
    const hasReplyToUserId = commentsInfo.some(col => col.name === 'reply_to_user_id')
    
    if (!hasReplyToUserId) {
      console.log('⚠️  moment_comments 表缺少回复字段，正在添加...')
      chatDb.exec(`ALTER TABLE moment_comments ADD COLUMN reply_to_user_id INTEGER`)
      chatDb.exec(`ALTER TABLE moment_comments ADD COLUMN reply_to_npc_id INTEGER`)
      console.log('✅ moment_comments 表更新完成')
    }
    
  } catch (error) {
    console.error('⚠️  数据库迁移过程中出现错误:', error.message)
    // 继续启动，不要因为迁移失败而中断
  }
  
  chatDb.close()
  
  console.log('✅ 所有检查通过，启动Nuxt应用...')
  console.log('---')
  
  // 动态导入Nuxt服务器
  await import('./.output/server/index.mjs')
} catch (error) {
  console.error('❌ 初始化失败!')
  console.error('错误类型:', error.constructor.name)
  console.error('错误信息:', error.message)
  console.error('错误堆栈:', error.stack)
  process.exit(1)
}

