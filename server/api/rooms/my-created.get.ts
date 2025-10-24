import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const db = getDB()
  
  // 获取我创建的所有房间
  const rooms = db.prepare(`
    SELECT 
      r.*,
      (SELECT COUNT(DISTINCT user_id) FROM room_members WHERE room_id = r.id) as member_count,
      (SELECT COUNT(*) FROM npcs WHERE room_id = r.id) as npc_count,
      (SELECT COUNT(*) FROM messages WHERE room_id = r.id) as message_count
    FROM rooms r
    WHERE r.creator_id = ?
    ORDER BY r.created_at DESC
  `).all(user.id)
  
  return {
    success: true,
    rooms
  }
})

