/**
 * 添加好友
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
    const body = await readBody(event)
    const { friend_id } = body

    if (!friend_id) {
      throw new Error('好友ID不能为空')
    }

    if (friend_id === user.id) {
      throw new Error('不能添加自己为好友')
    }

    const db = getDB()

    // 检查对方用户是否存在
    const friendUser = db.prepare('SELECT id, username, nickname FROM users WHERE id = ?').get(friend_id)
    if (!friendUser) {
      throw new Error('该用户不存在')
    }

    // 检查是否已经是好友
    const existing = db.prepare(`
      SELECT id FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) 
         OR (user_id = ? AND friend_id = ?)
    `).get(user.id, friend_id, friend_id, user.id)

    if (existing) {
      throw new Error('已经是好友了')
    }

    // 添加双向好友关系
    db.prepare(`
      INSERT INTO friendships (user_id, friend_id, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(user.id, friend_id)

    db.prepare(`
      INSERT INTO friendships (user_id, friend_id, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(friend_id, user.id)

    console.log(`✅ ${user.username} 添加好友: ${(friendUser as any).username}`)

    return {
      success: true,
      message: '添加好友成功',
      friend: friendUser
    }
  } catch (error: any) {
    console.error('❌ 添加好友失败:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
})

