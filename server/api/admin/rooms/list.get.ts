import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  // 这里可以添加管理员权限检查
  // if (!user.is_admin) {
  //   return { success: false, error: '需要管理员权限' }
  // }
  
  const db = getDB()
  
  try {
    // 获取所有房间及其统计信息
    const rooms = db.prepare(`
      SELECT 
        r.id,
        r.name,
        r.description,
        r.avatar,
        r.event_background,
        r.dialogue_density,
        r.auto_mode,
        r.creator_id,
        u.nickname as creator_name,
        COUNT(DISTINCT rm.user_id) as member_count,
        COUNT(DISTINCT n.id) as npc_count
      FROM rooms r
      LEFT JOIN users u ON r.creator_id = u.id
      LEFT JOIN room_members rm ON r.id = rm.room_id
      LEFT JOIN npcs n ON r.id = n.room_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `).all()
    
    return {
      success: true,
      rooms
    }
  } catch (error) {
    console.error('获取房间列表失败:', error)
    return { success: false, error: '获取失败' }
  }
})

