/**
 * 标记朋友圈通知为已读
 */
import Database from 'better-sqlite3'
import { join } from 'path'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = getCurrentUser(event)
    if (!user) {
      return { success: false, error: '未登录' }
    }
    
    const chatDb = new Database(join(process.cwd(), 'data', 'chat.db'))
    
    // 确保表存在
    chatDb.exec(`
      CREATE TABLE IF NOT EXISTS moment_notification_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        last_check_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 更新或插入最后查看时间
    const stmt = chatDb.prepare(`
      INSERT INTO moment_notification_status (user_id, last_check_at)
      VALUES (?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET last_check_at = CURRENT_TIMESTAMP
    `)
    
    stmt.run(user.id)
    chatDb.close()
    
    return { success: true }
  } catch (error: any) {
    console.error('标记已读失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

