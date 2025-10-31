/**
 * 创建剧情
 */
import { getDB } from '~/server/utils/db'

function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { name, description, eventBackground, dialogueDensity, avatar } = body
    
    if (!name || !eventBackground) {
      throw createError({
        statusCode: 400,
        message: '请填写剧情名称和事件背景'
      })
    }
    
    const db = getDB()
    const storyId = generateId()
    
    db.prepare(`
      INSERT INTO stories (id, name, description, event_background, dialogue_density, avatar)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      storyId,
      name,
      description || '',
      eventBackground,
      dialogueDensity || 2,
      avatar || '📖'
    )
    
    return { success: true, storyId }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

