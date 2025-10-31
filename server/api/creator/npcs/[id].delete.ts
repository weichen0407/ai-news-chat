/**
 * 删除NPC
 */
import { getDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: '缺少NPC ID'
      })
    }
    
    const db = getDB()
    
    // 检查NPC是否存在
    const npc = db.prepare('SELECT * FROM story_npcs WHERE id = ?').get(id)
    
    if (!npc) {
      throw createError({
        statusCode: 404,
        message: 'NPC不存在'
      })
    }
    
    // 删除NPC
    db.prepare('DELETE FROM story_npcs WHERE id = ?').run(id)
    
    return { 
      success: true, 
      message: 'NPC已删除'
    }
  } catch (error: any) {
    console.error('删除NPC失败:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
})

