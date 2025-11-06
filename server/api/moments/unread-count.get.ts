/**
 * 获取未读朋友圈通知数量（包括对自己朋友圈的回复和评论）
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
    const appDb = new Database(join(process.cwd(), 'data', 'app.db'))

    // 确保表存在
    chatDb.exec(`
      CREATE TABLE IF NOT EXISTS moment_notification_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        last_check_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 获取上次查看时间
    const lastCheck = chatDb.prepare(`
      SELECT last_check_at FROM moment_notification_status
      WHERE user_id = ?
    `).get(user.id) as any

    const lastCheckTime = lastCheck?.last_check_at || '1970-01-01 00:00:00'

    // 统计未读数量
    // 1. 自己朋友圈的新评论
    const myMomentsComments = chatDb.prepare(`
      SELECT COUNT(*) as count
      FROM moment_comments mc
      WHERE mc.moment_id IN (SELECT id FROM moments WHERE user_id = ?)
        AND mc.user_id IS NULL
        AND mc.created_at > ?
    `).get(user.id, lastCheckTime) as any

    // 2. 自己评论被回复
    const myCommentsReplies = chatDb.prepare(`
      SELECT COUNT(*) as count
      FROM moment_comments mc
      WHERE mc.reply_to_user_id = ?
        AND mc.created_at > ?
    `).get(user.id, lastCheckTime) as any

    // 3. 参与过的朋友圈的新评论（除了自己的评论）
    const participatedMomentsComments = chatDb.prepare(`
      SELECT COUNT(DISTINCT mc2.id) as count
      FROM moment_comments mc1
      INNER JOIN moment_comments mc2 ON mc1.moment_id = mc2.moment_id
      WHERE mc1.user_id = ?
        AND mc2.user_id != ?
        AND mc2.npc_id IS NOT NULL
        AND mc2.created_at > ?
        AND mc2.created_at > mc1.created_at
    `).get(user.id, user.id, lastCheckTime) as any

    const totalCount = 
      (myMomentsComments?.count || 0) +
      (myCommentsReplies?.count || 0) +
      (participatedMomentsComments?.count || 0)

    chatDb.close()
    appDb.close()

    return {
      success: true,
      count: totalCount
    }
  } catch (error: any) {
    console.error('❌ 获取未读数量失败:', error.message)
    return {
      success: false,
      count: 0,
      error: error.message
    }
  }
})

