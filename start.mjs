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
  
  // 创建朋友圈相关表
  chatDb.exec(`
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
  
  chatDb.exec(`
    CREATE TABLE IF NOT EXISTS moment_likes (
      moment_id INTEGER NOT NULL,
      user_id INTEGER,
      npc_id INTEGER,
      liker_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(moment_id, user_id, npc_id, liker_type)
    )
  `)
  
  chatDb.exec(`
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
  
  chatDb.exec(`
    CREATE TABLE IF NOT EXISTS moment_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      moment_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      actor_id INTEGER NOT NULL,
      actor_type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  chatDb.exec(`
    CREATE TABLE IF NOT EXISTS moment_read_status (
      user_id INTEGER NOT NULL,
      last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id)
    )
  `)
  
  console.log('✅ 朋友圈表结构创建完成')
  
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

