import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

// 自动任务 - 定期触发所有开启自动模式的房间
export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const db = getDB()
  
  // 获取所有开启自动模式的房间
  const rooms = db.prepare(`
    SELECT id, name, auto_mode, dialogue_density 
    FROM rooms 
    WHERE auto_mode = 1
  `).all() as any[]
  
  console.log(`🤖 自动任务检查: 发现 ${rooms.length} 个开启自动模式的房间`)
  
  const results = []
  
  for (const room of rooms) {
    try {
      // 直接调用trigger-auto-chat的处理函数
      const triggerResponse = await $fetch('/api/admin/rooms/trigger-auto-chat', {
        method: 'POST',
        body: { roomId: room.id },
        headers: {
          cookie: getHeader(event, 'cookie') || ''
        }
      })
      
      results.push({
        roomId: room.id,
        roomName: room.name,
        success: triggerResponse.success,
        messages: triggerResponse.messages?.length || 0,
        error: triggerResponse.error
      })
    } catch (error: any) {
      console.error(`房间 ${room.id} 自动对话失败:`, error)
      results.push({
        roomId: room.id,
        roomName: room.name,
        success: false,
        error: error.message
      })
    }
  }
  
  return {
    success: true,
    totalRooms: rooms.length,
    results
  }
})

