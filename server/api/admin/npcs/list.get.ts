import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const db = getDB()
  
  try {
    // 获取所有NPC及其所属房间信息
    const npcs = db.prepare(`
      SELECT 
        n.*,
        r.name as room_name
      FROM npcs n
      LEFT JOIN rooms r ON n.room_id = r.id
      ORDER BY n.room_id, n.name
    `).all()
    
    return {
      success: true,
      npcs
    }
  } catch (error: any) {
    console.error('获取NPC列表失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

