import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const { roomId, dialogueDensity } = body
  
  if (!roomId) {
    return { success: false, error: '请提供房间ID' }
  }
  
  const db = getDB()
  
  try {
    // 更新房间设置
    db.prepare(`
      UPDATE rooms 
      SET dialogue_density = ? 
      WHERE id = ?
    `).run(dialogueDensity || 30, roomId)
    
    return {
      success: true,
      message: '设置已更新'
    }
  } catch (error) {
    console.error('更新设置失败:', error)
    return { success: false, error: '操作失败' }
  }
})

