import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const { roomId, content } = body
  
  if (!roomId || !content) {
    return { success: false, error: '缺少必要参数' }
  }
  
  const db = getDB()
  
  // 检查是否是房间成员
  const member = db.prepare(
    'SELECT role_name FROM room_members WHERE room_id = ? AND user_id = ?'
  ).get(roomId, user.id) as any
  
  if (!member) {
    return { success: false, error: '你不是该房间成员' }
  }
  
  // 插入消息
  try {
    db.prepare(
      'INSERT INTO messages (room_id, sender_type, sender_id, sender_name, avatar, content) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      roomId,
      'user',
      user.id,
      member.role_name || user.nickname,
      user.avatar || null,
      content
    )
    
    return { success: true }
  } catch (error) {
    console.error('发送消息失败:', error)
    return { success: false, error: '发送消息失败' }
  }
})

