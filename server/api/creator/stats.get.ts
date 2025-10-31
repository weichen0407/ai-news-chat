/**
 * 获取剧情创作工具统计
 */
import { getDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const db = getDB()
    
    const stats = {
      totalStories: db.prepare('SELECT COUNT(*) as count FROM stories').get().count,
      totalNPCs: db.prepare('SELECT COUNT(*) as count FROM story_npcs').get().count
    }
    
    return { success: true, data: stats }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

