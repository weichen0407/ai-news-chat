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
  
  const body = await readBody(event)
  const { autoMode } = body
  
  const db = getDB()
  
  try {
    // 检查是否是房主
    const room = db.prepare('SELECT creator_id FROM rooms WHERE id = ?').get(roomId) as any
    if (!room) {
      return { success: false, error: '房间不存在' }
    }
    
    if (room.creator_id !== user.id) {
      return { success: false, error: '只有房主可以控制自动模式' }
    }
    
    // 更新自动模式状态
    db.prepare('UPDATE rooms SET auto_mode = ? WHERE id = ?').run(autoMode ? 1 : 0, roomId)
    
    return { success: true }
  } catch (error) {
    console.error('更新自动模式失败:', error)
    return { success: false, error: '更新失败' }
  }
})

