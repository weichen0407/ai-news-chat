/**
 * 获取房间内的其他玩家（可添加为好友）
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

  const query = getQuery(event)
  const roomId = query.roomId as string

  if (!roomId) {
    throw createError({
      statusCode: 400,
      message: '房间ID不能为空'
    })
  }

  try {
    const db = getDB()

    // 获取房间内的其他玩家
    const players = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.nickname,
        u.avatar,
        CASE 
          WHEN f.id IS NOT NULL THEN 1
          ELSE 0
        END as is_friend
      FROM room_members rm
      INNER JOIN users u ON rm.user_id = u.id
      LEFT JOIN friendships f ON (f.user_id = ? AND f.friend_id = u.id)
      WHERE rm.room_id = ? AND u.id != ?
      ORDER BY u.username
    `).all(user.id, roomId, user.id)

    return {
      success: true,
      players
    }
  } catch (error: any) {
    console.error('❌ 获取房间玩家失败:', error.message)
    return {
      success: false,
      error: error.message,
      players: []
    }
  }
})

