/**
 * 获取房间的NPC列表（POST方式）
 */
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { room_id } = body
    
    if (!room_id) {
      return { success: false, error: '房间ID不能为空' }
    }
    
    const db = new Database(join(process.cwd(), 'data', 'app.db'))
    
    const npcs = db.prepare(`
      SELECT id, name, avatar, profile, personality, habits, skills, 
             likes, dislikes, age, occupation, background, goals, fears
      FROM npcs
      WHERE room_id = ?
      ORDER BY name
    `).all(room_id)
    
    db.close()
    
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

