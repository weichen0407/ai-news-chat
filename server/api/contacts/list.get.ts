/**
 * 获取用户的联系人列表（好友NPC）
 */
import Database from 'better-sqlite3'
import { join } from 'path'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return { success: false, error: '请先登录' }
    }
    
    const db = new Database(join(process.cwd(), 'data', 'app.db'))
    
    // 获取用户的所有好友NPC（通过加入的房间）
    const contacts = db.prepare(`
      SELECT DISTINCT 
        n.id,
        n.name,
        n.avatar,
        n.profile,
        r.name as room_name,
        r.id as room_id
      FROM npcs n
      INNER JOIN room_members rm ON n.room_id = rm.room_id
      INNER JOIN rooms r ON n.room_id = r.id
      WHERE rm.user_id = ?
      ORDER BY n.name
    `).all(user.id)
    
    db.close()
    
    return {
      success: true,
      contacts
    }
  } catch (error: any) {
    console.error('获取联系人失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

