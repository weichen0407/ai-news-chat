/**
 * 获取所有剧情（创作工具）
 */
import { getDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const db = getDB()
    
    const stories = db.prepare(`
      SELECT 
        s.*,
        COUNT(DISTINCT n.id) as npc_count
      FROM stories s
      LEFT JOIN npcs n ON s.id = n.story_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `).all()
    
    return { success: true, data: stories }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

