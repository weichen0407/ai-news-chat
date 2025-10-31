/**
 * 获取单个剧情详情
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
    
    const npcs = db.prepare('SELECT * FROM npcs WHERE story_id = ?').all(id)
    
    return {
      success: true,
      data: {
        ...story,
        npcs
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

