/**
 * 导出剧情（包含NPC）
 */
import { getDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const db = getDB()
    
    const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(id)
    
    if (!story) {
      throw createError({
        statusCode: 404,
        message: '剧情不存在'
      })
    }
    
    const npcs = db.prepare('SELECT * FROM story_npcs WHERE story_id = ?').all(id)
    
    const exportData = {
      version: '2.0',
      story,
      npcs,
      exportedAt: new Date().toISOString()
    }
    
    return { success: true, data: exportData }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

