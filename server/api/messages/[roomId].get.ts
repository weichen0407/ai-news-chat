import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const roomId = event.context.params?.roomId
  if (!roomId) {
    return { success: false, error: '房间ID不存在' }
  }
  
  const db = getDB()
  
  // 检查是否是房间成员
  const member = db.prepare(
    'SELECT id FROM room_members WHERE room_id = ? AND user_id = ?'
  ).get(roomId, user.id)
  
  if (!member) {
    return { success: false, error: '你不是该房间成员' }
  }
  
  // 获取消息列表，并实时获取用户的最新头像
  const messages = db.prepare(`
    SELECT 
      m.*,
      CASE 
        WHEN m.sender_type = 'user' THEN u.avatar
        ELSE m.avatar
      END as current_avatar
    FROM messages m
    LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
    WHERE m.room_id = ?
    ORDER BY m.created_at ASC
  `).all(roomId)
  
  // 将 current_avatar 替换为 avatar
  const messagesWithCurrentAvatar = messages.map(msg => ({
    ...msg,
    avatar: msg.current_avatar || msg.avatar
  }))
  
  return {
    success: true,
    messages: messagesWithCurrentAvatar
  }
})

