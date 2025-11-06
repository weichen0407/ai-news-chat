import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const db = getDB()
  
  try {
    // 获取用户加入的所有房间
    const rooms = db.prepare(`
      SELECT 
        r.id,
        r.name,
        r.description,
        r.avatar,
        r.event_background,
        r.created_at,
        (
          SELECT sender_name || ': ' || content
          FROM messages 
          WHERE room_id = r.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT created_at 
          FROM messages 
          WHERE room_id = r.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*) 
          FROM messages 
          WHERE room_id = r.id 
          AND created_at > COALESCE(rm.last_read_at, '1970-01-01')
        ) as unread_count
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      WHERE rm.user_id = ?
      ORDER BY last_message_time DESC NULLS LAST
    `).all(user.id)
    
    return {
      success: true,
      rooms
    }
  } catch (error) {
    console.error('获取我的群聊失败:', error)
    return { success: false, error: '获取失败' }
  }
})
