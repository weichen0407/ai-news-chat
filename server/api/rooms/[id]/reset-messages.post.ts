import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const roomId = event.context.params?.id
  if (!roomId) {
    return { success: false, error: '房间ID不存在' }
  }
  
  const db = getDB()
  
  // 检查是否是群主
  const room = db.prepare('SELECT creator_id FROM rooms WHERE id = ?').get(roomId) as any
  if (!room || room.creator_id !== user.id) {
    return { success: false, error: '只有群主可以执行此操作' }
  }
  
  try {
    // 删除所有消息
    db.prepare('DELETE FROM messages WHERE room_id = ?').run(roomId)
    
    return { success: true }
  } catch (error) {
    console.error('清空消息失败:', error)
    return { success: false, error: '操作失败' }
  }
})

