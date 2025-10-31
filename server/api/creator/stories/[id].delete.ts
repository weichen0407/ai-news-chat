/**
 * 删除剧情及其所有关联的NPC
 */
import { getDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: '缺少剧情ID'
      })
    }
    
    const db = getDB()
    
    // 检查剧情是否存在
    const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(id)
    
    if (!story) {
      throw createError({
        statusCode: 404,
        message: '剧情不存在'
      })
    }
    
    // 删除关联的NPC（story_npcs表会自动级联删除）
    db.prepare('DELETE FROM story_npcs WHERE story_id = ?').run(id)
    
    // 删除剧情
    db.prepare('DELETE FROM stories WHERE id = ?').run(id)
    
    return { 
      success: true, 
      message: '剧情已删除'
    }
  } catch (error: any) {
    console.error('删除剧情失败:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
})

