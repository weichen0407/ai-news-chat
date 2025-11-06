/**
 * 标记朋友圈通知为已读
 */
import Database from 'better-sqlite3'
import { join } from 'path'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '请先登录'
    })
  }

  try {
    const chatDb = new Database(join(process.cwd(), 'data', 'chat.db'))

    // 确保表存在
    chatDb.exec(`
      CREATE TABLE IF NOT EXISTS moment_notification_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        last_check_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 更新或插入last_check_at
    chatDb.prepare(`
      INSERT INTO moment_notification_status (user_id, last_check_at)
      VALUES (?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET last_check_at = CURRENT_TIMESTAMP
    `).run(user.id)

    chatDb.close()

    return {
      success: true
    }
  } catch (error: any) {
    console.error('❌ 标记已读失败:', error)
    console.error('错误堆栈:', error.stack)
    return {
      success: false,
      error: error.message
    }
  }
})

