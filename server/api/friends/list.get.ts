/**
 * 获取好友列表
 */
import { getDB } from '~/server/utils/db'
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
    const db = getDB()

    console.log('🔍 获取好友列表，用户ID:', user.id)

    // 确保表存在
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

        // 获取所有好友
        const friends = db.prepare(`
          SELECT 
            u.id,
            u.username,
            u.nickname,
            u.avatar,
            u.signature,
            f.created_at
          FROM friendships f
          INNER JOIN users u ON f.friend_id = u.id
          WHERE f.user_id = ?
          ORDER BY f.created_at DESC
        `).all(user.id)

    console.log('✅ 好友列表查询成功，数量:', friends.length)

    return {
      success: true,
      friends
    }
  } catch (error: any) {
    console.error('❌ 获取好友列表失败:', error)
    console.error('错误堆栈:', error.stack)
    return {
      success: false,
      error: error.message,
      friends: []
    }
  }
})

