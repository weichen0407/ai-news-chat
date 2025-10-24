import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const db = getDB()
  
  // 获取我加入的所有房间（包含最新头像和未读数）
  const rooms = db.prepare(`
    SELECT 
      r.id, r.name, r.description, r.avatar, r.created_at,
      u.nickname as creator_name,
      rm.last_read_at,
      (SELECT COUNT(DISTINCT user_id) FROM room_members WHERE room_id = r.id) as member_count,
      (SELECT COUNT(*) FROM npcs WHERE room_id = r.id) as npc_count,
      (SELECT COUNT(*) FROM messages WHERE room_id = r.id) as message_count,
      (SELECT content FROM messages WHERE room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT COUNT(*) FROM messages 
       WHERE room_id = r.id 
       AND created_at > COALESCE(rm.last_read_at, '2000-01-01')
       AND sender_type != 'user' OR (sender_type = 'user' AND sender_id != ?)
      ) as unread_count
    FROM rooms r
    JOIN room_members rm ON r.id = rm.room_id
    JOIN users u ON r.creator_id = u.id
    WHERE rm.user_id = ?
    ORDER BY r.created_at DESC
  `).all(user.id, user.id)
  
  return {
    success: true,
    rooms
  }
})

