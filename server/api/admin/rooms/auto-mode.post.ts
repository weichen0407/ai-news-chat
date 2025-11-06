import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const { roomId, enabled } = body
  
  if (!roomId) {
    return { success: false, error: '请提供房间ID' }
  }
  
  const db = getDB()
  
  try {
    // 更新房间的自动模式
    db.prepare(`
      UPDATE rooms 
      SET auto_mode = ? 
      WHERE id = ?
    `).run(enabled ? 1 : 0, roomId)
    
    return {
      success: true,
      message: enabled ? '已开启自动对话' : '已关闭自动对话'
    }
  } catch (error) {
    console.error('切换自动模式失败:', error)
    return { success: false, error: '操作失败' }
  }
})

