import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const roomId = event.context.params?.id
  if (!roomId) {
    return { success: false, error: '房间ID不能为空' }
  }
  
  const db = getDB()
  
  try {
    // 更新最后阅读时间为当前时间
    db.prepare(`
      UPDATE room_members 
      SET last_read_at = datetime('now') 
      WHERE room_id = ? AND user_id = ?
    `).run(roomId, user.id)
    
    return { success: true }
  } catch (error) {
    console.error('更新阅读时间失败:', error)
    return { success: false, error: '更新失败' }
  }
})

